# Unified Alpine sandbox for ShellCraft labs 01–05 — real shell, tiny footprint.
FROM alpine:3.21

RUN apk add --no-cache bash coreutils readline bash-completion procps grep \
  && addgroup -S learner \
  && adduser -S -G learner -h /home/guest learner

# Lab 01 — filesystem quest
RUN mkdir -p /home/guest/projects/labs \
  && printf '%s\n' \
    'MISSION_READY=filesystem' \
    'You found the mission file. Next stop: permissions.' \
    > /home/guest/projects/labs/mission.txt

# Lab 02 — permissions (deploy.sh starts rw-r--r--)
RUN printf '%s\n' '#!/bin/bash' 'echo "ShellCraft deploy stub"' \
    > /home/guest/projects/deploy.sh \
  && chmod 644 /home/guest/projects/deploy.sh

# Lab 03 — pipes & grep
RUN mkdir -p /home/guest/projects/logs \
  && printf '%s\n' \
    '2026-06-01 INFO user login ok' \
    '2026-06-01 ERROR disk full on /var' \
    '2026-06-01 INFO backup finished' \
    '2026-06-02 ERROR connection timeout' \
    '2026-06-02 INFO shutdown complete' \
    > /home/guest/projects/logs/access.log

# Lab 04 — process watch
RUN printf '%s\n' '#!/bin/sh' 'while true; do sleep 1; done' \
    > /home/guest/projects/worker.sh \
  && chmod 755 /home/guest/projects/worker.sh

# Lab 05 — signals (trap SIGTERM for graceful exit)
RUN printf '%s\n' \
    '#!/bin/sh' \
    'trap "exit 0" TERM' \
    'while true; do sleep 1; done' \
    > /home/guest/projects/hang.sh \
  && chmod 755 /home/guest/projects/hang.sh

# Interactive shell logging for PTY grading (all labs).
RUN printf '%s\n' \
    '__shellcraft_log_cmd() {' \
    '  local current="$BASH_COMMAND"' \
    '  [[ "$current" == "$PROMPT_COMMAND" ]] && return' \
    '  [[ "$current" == __shellcraft_log_cmd ]] && return' \
    '  [[ "$current" == trap* ]] && return' \
    '  printf '"'"'%s|%s\n'"'"' "$PWD" "$current" >> /tmp/.shellcraft-history' \
    '}' \
    'trap '"'"'__shellcraft_log_cmd'"'"' DEBUG' \
    'export PROMPT_COMMAND="pwd > /tmp/.shellcraft-cwd 2>/dev/null"' \
    >> /home/guest/.bashrc \
  && chown -R learner:learner /home/guest

USER learner
WORKDIR /home/guest/projects

CMD ["sleep", "infinity"]
