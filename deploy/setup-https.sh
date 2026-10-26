#!/usr/bin/env bash
# One-time HTTPS bootstrap on the server (run as root).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
REPO_DIR=/opt/feod
COMPOSE_FILE="$REPO_DIR/deploy/docker-compose.yml"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@feod.dev}"

apt-get update -qq
apt-get install -y -qq certbot

install -d -m 755 /var/www/certbot

if [[ ! -f /etc/letsencrypt/live/feod.dev/fullchain.pem ]]; then
  cp "$REPO_DIR/deploy/nginx.conf" "$REPO_DIR/deploy/nginx.conf.ssl"
  cp "$REPO_DIR/deploy/nginx-http-only.conf" "$REPO_DIR/deploy/nginx.conf"
  sudo -u feod-deploy docker compose -f "$COMPOSE_FILE" build
  sudo -u feod-deploy docker compose -f "$COMPOSE_FILE" up -d

  certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d feod.dev \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --non-interactive \
    --no-eff-email

  cp "$REPO_DIR/deploy/nginx.conf.ssl" "$REPO_DIR/deploy/nginx.conf"
fi

install -d /etc/letsencrypt/renewal-hooks/deploy
install -m 755 "$REPO_DIR/deploy/certbot-renew-hook.sh" /etc/letsencrypt/renewal-hooks/deploy/reload-feod.sh

sudo -u feod-deploy docker compose -f "$COMPOSE_FILE" build
sudo -u feod-deploy docker compose -f "$COMPOSE_FILE" up -d

certbot renew --dry-run
echo "HTTPS setup complete"
