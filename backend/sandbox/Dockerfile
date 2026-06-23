# Unified Alpine sandbox for ShellCraft labs 01–05.
# Lab files live in /opt/shellcraft-seeds (read-only); each session gets a
# writable tmpfs copy at /home/guest/lab-NN so chmod and similar labs work.
FROM alpine:3.21

RUN apk add --no-cache bash coreutils readline bash-completion procps grep \
  && addgroup -S learner \
  && adduser -S -G learner -h /home/guest learner

# Lab 01 — filesystem quest
RUN mkdir -p /opt/shellcraft-seeds/lab-01/labs \
  && printf '%s\n' \
    'MISSION_READY=filesystem' \
    'You found the mission file. Next stop: permissions.' \
    > /opt/shellcraft-seeds/lab-01/labs/mission.txt

# Lab 02 — permissions (deploy.sh starts rw-r--r--)
RUN mkdir -p /opt/shellcraft-seeds/lab-02 \
  && printf '%s\n' '#!/bin/bash' 'echo "ShellCraft deploy stub"' \
    > /opt/shellcraft-seeds/lab-02/deploy.sh \
  && chmod 644 /opt/shellcraft-seeds/lab-02/deploy.sh

# Lab 03 — pipes & grep
RUN mkdir -p /opt/shellcraft-seeds/lab-03/logs \
  && printf '%s\n' \
    '2026-06-01 INFO user login ok' \
    '2026-06-01 ERROR disk full on /var' \
    '2026-06-01 INFO backup finished' \
    '2026-06-02 ERROR connection timeout' \
    '2026-06-02 INFO shutdown complete' \
    > /opt/shellcraft-seeds/lab-03/logs/access.log

# Lab 04 — process watch
RUN mkdir -p /opt/shellcraft-seeds/lab-04 \
  && printf '%s\n' '#!/bin/sh' 'while true; do sleep 1; done' \
    > /opt/shellcraft-seeds/lab-04/worker.sh \
  && chmod 755 /opt/shellcraft-seeds/lab-04/worker.sh

# Lab 05 — signals
RUN mkdir -p /opt/shellcraft-seeds/lab-05 \
  && printf '%s\n' \
    '#!/bin/sh' \
    'trap "exit 0" TERM' \
    'while true; do sleep 1; done' \
    > /opt/shellcraft-seeds/lab-05/hang.sh \
  && chmod 755 /opt/shellcraft-seeds/lab-05/hang.sh

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
  && chown -R learner:learner /home/guest /opt/shellcraft-seeds

USER learner
WORKDIR /home/guest

CMD ["sleep", "infinity"]
