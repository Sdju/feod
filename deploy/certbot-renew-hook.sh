#!/usr/bin/env bash
set -euo pipefail

docker exec feod-site nginx -s reload
