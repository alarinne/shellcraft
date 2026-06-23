import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { sandboxTerminalWsUrl } from '../../core/api/api-base';

@Component({
  selector: 'sc-pty-terminal',
  templateUrl: './pty-terminal.component.html',
  styleUrl: './pty-terminal.component.scss',
})
export class PtyTerminalComponent implements AfterViewInit, OnDestroy {
  readonly sessionId = input.required<string>();
  readonly labTitle = input('');

  readonly cwdChange = output<string>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('terminalHost');

  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private socket: WebSocket | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.connect();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.socket?.close();
    this.terminal?.dispose();
  }

  private connect(): void {
    const host = this.host().nativeElement;
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
      fontSize: 14,
      theme: {
        background: '#030608',
        foreground: '#dceaff',
        cursor: '#32ef8f',
        selectionBackground: 'rgba(82, 168, 255, 0.35)',
      },
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    fit.fit();
    term.focus();

    const socket = new WebSocket(sandboxTerminalWsUrl(this.sessionId()));
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      term.writeln('\x1b[1;32mConnected to real Linux sandbox.\x1b[0m');
      term.writeln('Tab completion, Ctrl+C, and arrow history work like a real shell.');
      this.sendResize(term, socket);
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data) as { type?: string; cwd?: string };
          if (message.type === 'cwd' && message.cwd) {
            this.cwdChange.emit(message.cwd);
          }
        } catch {
          term.write(event.data);
        }
        return;
      }

      term.write(new Uint8Array(event.data as ArrayBuffer));
    };

    socket.onerror = () => {
      term.writeln(
        '\r\n\x1b[31mCould not connect to the sandbox. Start the backend with:\x1b[0m',
      );
      term.writeln('  SHELLCRAFT_SANDBOX=1 uvicorn app.main:app --reload --port 8000');
    };

    socket.onclose = (event) => {
      if (event.code === 1000) {
        return;
      }
      term.writeln(
        `\r\n\x1b[31mSandbox connection closed (${event.code}). Is the backend running on port 8000?\x1b[0m`,
      );
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    term.onResize(({ rows, cols }) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(`__resize__:${rows}:${cols}`);
      }
    });

    this.resizeObserver = new ResizeObserver(() => {
      fit.fit();
      this.sendResize(term, socket);
    });
    this.resizeObserver.observe(host);

    this.terminal = term;
    this.fitAddon = fit;
    this.socket = socket;
  }

  private sendResize(term: Terminal, socket: WebSocket): void {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(`__resize__:${term.rows}:${term.cols}`);
  }
}
