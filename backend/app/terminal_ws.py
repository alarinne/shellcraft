"""WebSocket bridge between the browser xterm.js client and a Docker sandbox PTY."""

from __future__ import annotations

import asyncio
import fcntl
import os
import pty
import re
import signal
import struct
import subprocess
import termios
import time
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from .engine import normalize_command
from .lab_checker import resolve_path
from .sandbox import ExecRecord, SandboxError, read_shell_cwd, sandbox_manager

_LABS: dict[str, dict[str, Any]] | None = None
_ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\].*?(?:\x07|\x1b\\)|\x1b[PX^_][\x20-\x7e]*\x1b\\")


def set_labs(labs: dict[str, dict[str, Any]]) -> None:
    global _LABS
    _LABS = labs


def _set_pty_size(master_fd: int, rows: int, cols: int) -> None:
    winsize = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)


def _pty_child() -> None:
    os.setsid()
    fcntl.ioctl(0, termios.TIOCSCTTY, 0)


def _append_pty_history(session_id: str, command: str, output_text: str) -> dict[str, Any] | None:
    try:
        session = sandbox_manager.get_session_info(session_id)
    except SandboxError:
        return None

    session.last_used_at = time.time()
    cleaned_output = _ANSI_ESCAPE_RE.sub("", output_text)
    lines = [line.strip() for line in cleaned_output.splitlines() if line.strip()]
    tail = "\n".join(lines[-5:]).lower() if lines else cleaned_output.lower()
    if "command not found" in tail:
        exit_code = 127
    elif any(
        phrase in tail
        for phrase in ("no such file", "read-only file system", "permission denied")
    ):
        exit_code = 1
    else:
        exit_code = 0

    normalized = normalize_command(command)
    if normalized.startswith("cd ") and exit_code == 0:
        # Resolve cd locally — PROMPT_COMMAND may not have updated yet.
        parts = normalized.split(" ", 1)
        target = parts[1] if len(parts) > 1 else "~"
        session.cwd = resolve_path(session.cwd, target)
        cwd = session.cwd
    else:
        cwd = session.cwd
        container_cwd = read_shell_cwd(session.container_name)
        if container_cwd:
            session.cwd = container_cwd
            cwd = container_cwd

    record = ExecRecord(
        command=command,
        stdout=lines,
        stderr=[],
        exit_code=exit_code,
        cwd=cwd,
    )
    session.history.append(record)
    return {"cwd": cwd}


async def terminal_websocket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()

    try:
        session = sandbox_manager.get_session_info(session_id)
    except SandboxError as exc:
        await websocket.close(code=4404, reason=str(exc))
        return

    master_fd, slave_fd = pty.openpty()
    _set_pty_size(master_fd, 24, 80)

    proc = subprocess.Popen(
        [
            "docker",
            "exec",
            "-it",
            "-w",
            session.cwd,
            session.container_name,
            "bash",
            "-li",
        ],
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        preexec_fn=_pty_child,
    )
    os.close(slave_fd)

    flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

    line_buffer = bytearray()
    capture_buffer = bytearray()
    stop = asyncio.Event()
    log_lock = asyncio.Lock()

    async def log_command(command: str) -> None:
        await asyncio.sleep(0.4)
        async with log_lock:
            output_text = bytes(capture_buffer).decode("utf-8", errors="replace")
            capture_buffer.clear()
        result = _append_pty_history(session_id, command, output_text)
        if result is not None and result.get("cwd"):
            await websocket.send_json({"type": "cwd", "cwd": result["cwd"]})

    async def read_pty() -> None:
        while not stop.is_set():
            await asyncio.sleep(0.02)
            if proc.poll() is not None:
                stop.set()
                break
            try:
                chunk = os.read(master_fd, 4096)
            except OSError:
                continue
            if not chunk:
                continue
            capture_buffer.extend(chunk)
            await websocket.send_bytes(chunk)

    async def write_pty() -> None:
        while not stop.is_set():
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                stop.set()
                break

            if message.get("type") == "websocket.disconnect":
                stop.set()
                break

            if "bytes" in message and message["bytes"] is not None:
                data = message["bytes"]
            elif "text" in message and message["text"] is not None:
                data = message["text"].encode("utf-8")
            else:
                continue

            if data.startswith(b"__resize__:"):
                try:
                    _, rows_s, cols_s = data.decode("utf-8").split(":")
                    _set_pty_size(master_fd, int(rows_s), int(cols_s))
                except (ValueError, UnicodeDecodeError):
                    pass
                continue

            os.write(master_fd, data)

            command_to_log: str | None = None
            i = 0
            while i < len(data):
                byte = data[i]
                if byte == 27 and i + 1 < len(data) and data[i + 1] == ord("["):
                    # Skip CSI escape sequences (arrow keys, etc.) for command logging.
                    i += 2
                    while i < len(data) and not (64 <= data[i] <= 126):
                        i += 1
                    i += 1
                    continue

                if byte in (10, 13):
                    command = line_buffer.decode("utf-8", errors="replace").strip()
                    line_buffer.clear()
                    if command:
                        command_to_log = command
                elif byte in (8, 127):
                    if line_buffer:
                        line_buffer.pop()
                elif byte == 3:
                    line_buffer.clear()
                    async with log_lock:
                        capture_buffer.clear()
                elif byte == 9:
                    pass
                elif byte >= 32:
                    line_buffer.append(byte)
                i += 1

            if command_to_log:
                asyncio.create_task(log_command(command_to_log))

    reader = asyncio.create_task(read_pty())
    writer = asyncio.create_task(write_pty())

    try:
        await asyncio.wait({reader, writer}, return_when=asyncio.FIRST_COMPLETED)
    finally:
        stop.set()
        reader.cancel()
        writer.cancel()
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            proc.terminate()
        proc.wait(timeout=5)
        os.close(master_fd)
