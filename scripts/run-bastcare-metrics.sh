#!/bin/sh
# Cron-safe wrapper for the aggregate-only BastCare metrics collector.
set -eu

REPO_DIR="/Users/bethrudden/bast-website"
ENV_FILE="/Users/bethrudden/bast-careloop/.env"
LOCK_DIR="/tmp/bastcare-metrics.lock"

if [ ! -r "$ENV_FILE" ]; then
  echo "ERROR: metrics environment file is unavailable" >&2
  exit 2
fi
# The env file stays outside the public repository and is excluded from output.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

PYTHON_BIN="${BASTCARE_METRICS_PYTHON:-python3}"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "ERROR: another metrics collection is running" >&2
  exit 1
fi
trap 'rmdir "$LOCK_DIR"' EXIT HUP INT TERM

cd "$REPO_DIR"
umask 022
"$PYTHON_BIN" scripts/collect-bastcare-metrics.py \
  --minimum-successful-summaries 1 \
  --output src/assets/data/bastcare-metrics.json
