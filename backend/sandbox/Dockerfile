# Minimal Alpine sandbox for Lab 01 — real shell, tiny footprint, fast start/stop.
FROM alpine:3.21

RUN apk add --no-cache bash coreutils readline bash-completion \
  && addgroup -S learner \
  && adduser -S -G learner -h /home/guest learner

# Lab 01 filesystem (matches frontend LAB_01_FILESYSTEM).
RUN mkdir -p /home/guest/projects/labs \
  && printf '%s\n' \
    'MISSION_READY=filesystem' \
    'You found the mission file. Next stop: permissions.' \
    > /home/guest/projects/labs/mission.txt \
  && printf '%s\n' \
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

# Keep the container alive; commands run via `docker exec`.
CMD ["sleep", "infinity"]
