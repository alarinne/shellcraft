# Docker CLI is provided by the official image so it does not depend on the
# (now removed) Debian `docker.io` package. The backend uses it to talk to the
# host daemon for the opt-in sandbox; the API degrades gracefully without it.
FROM docker:27-cli AS docker-cli

FROM python:3.12-slim
WORKDIR /app

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1
CMD ["./entrypoint.sh"]
