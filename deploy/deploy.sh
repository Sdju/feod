#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/feod}"
COMPOSE_FILE="${REPO_DIR}/deploy/docker-compose.yml"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$REPO_DIR"

if [[ "$(git remote get-url origin)" == https://* ]]; then
  git remote set-url origin git@github.com:Sdju/feod.git
fi

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker compose -f "$COMPOSE_FILE" build
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

docker image prune -f

echo "Deploy finished: $(git rev-parse --short HEAD)"
