# Промпт: восстановление production-деплоя feod.dev

Используй этот документ, когда пользователь просит **восстановить сервер**, **переустановить VPS**, **починить деплой** или **поднять feod.dev с нуля**.

## Контекст системы

- **Репозиторий:** `Sdju/feod` (private), ветка `main`
- **Сайт:** статическая документация VitePress → Docker (nginx) → `https://feod.dev`
- **DNS:** A-запись `feod.dev` → публичный IP VPS
- **CI/CD:** push в `main` → GitHub Actions workflow `.github/workflows/deploy-production.yml` → SSH на сервер → `/opt/feod/deploy/deploy.sh`
- **На сервере:** пользователь `feod-deploy`, репозиторий в `/opt/feod`, контейнер `feod-site`

## ⚠️ Безопасность (обязательно)

- **НИКОГДА** не записывай в репозиторий, коммиты, issues и этот файл: пароли, приватные SSH-ключи, содержимое GitHub Secrets, токены.
- Секреты хранятся **только** в GitHub Actions Secrets и у оператора локально (password manager / offline backup).
- В промпте ниже — **только имена** секретов и **описание** того, откуда оператор их предоставляет.
- Первичный вход root по паролю возможен только сразу после переустановки VPS; после hardening — **только ключи**.

## Что должно существовать до/после восстановления

### GitHub (репозиторий `Sdju/feod`)

| Ресурс | Имя / путь | Назначение |
|---|---|---|
| Workflow | `.github/workflows/deploy-production.yml` | триггер деплоя по push |
| Secret | `DEPLOY_HOST` | публичный IP или hostname VPS |
| Secret | `DEPLOY_USER` | `feod-deploy` |
| Secret | `DEPLOY_SSH_KEY` | **приватный** ключ для SSH Actions → сервер (Ed25519) |
| Deploy key | read-only, title ~`feod-server-git-deploy` | **публичный** ключ сервера для `git pull` |

Оператор должен **сам** передать ключи агенту через безопасный канал или добавить в GitHub UI / `gh secret set`. Агент **не выдумывает** и **не коммитит** секреты.

### Сервер (после bootstrap)

| Путь / сущность | Назначение |
|---|---|
| `/opt/feod` | git clone репозитория |
| `/home/feod-deploy/.ssh/authorized_keys` | ключ оператора + **публичный** ключ GitHub Actions |
| `/home/feod-deploy/.ssh/github_deploy` | пара ключей сервера для `git@github.com:Sdju/feod.git` |
| `/etc/letsencrypt/` | сертификаты Let's Encrypt |
| `/var/www/certbot` | webroot для ACME challenge |
| `/etc/letsencrypt/renewal-hooks/deploy/reload-feod.sh` | reload nginx после renew (из `deploy/certbot-renew-hook.sh`) |

### Локально у оператора (вне репозитория)

- Личный SSH-ключ для входа на сервер
- Backup **приватного** ключа GitHub Actions (создаётся один раз при первичной настройке; публичная часть — на сервере в `authorized_keys` для `feod-deploy`)

## Файлы деплоя в репозитории

```
deploy/
  deploy.sh              # git pull + docker compose build/up
  docker-compose.yml     # nginx :80/:443, mount letsencrypt + certbot webroot
  Dockerfile             # pnpm build docs → nginx
  nginx.conf             # HTTPS + redirect с HTTP
  nginx-http-only.conf   # временный конфиг для первого выпуска cert
  setup-https.sh         # certbot + hook (run as root)
  certbot-renew-hook.sh  # docker exec feod-site nginx -s reload
  AGENT-RESTORE.md       # этот файл
```

## Алгоритм восстановления (чистый VPS)

Выполняй шаги **по порядку**. Проверяй каждый шаг перед следующим.

### Фаза 0 — уточни у оператора

1. IP нового/переустановленного сервера (обновить `DEPLOY_HOST`, если изменился).
2. Есть ли доступ root (пароль или консоль провайдера) для первичной настройки.
3. Есть ли backup SSH-ключей (Actions + deploy) или нужно **сгенерировать новые** и обновить GitHub.

### Фаза 1 — базовая система (root)

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 git certbot
systemctl enable --now docker
```

Создай пользователя и каталоги:

```bash
id feod-deploy &>/dev/null || useradd -m -s /bin/bash feod-deploy
usermod -aG docker feod-deploy
install -d -o feod-deploy -g feod-deploy /opt/feod
install -d -m 755 /var/www/certbot
```

### Фаза 2 — SSH-ключи

1. **feod-deploy → GitHub (git pull):** сгенерируй `~/.ssh/github_deploy`, покажи оператору **только публичную** часть → он добавляет/обновляет Deploy key в `Sdju/feod` (read-only).
2. **GitHub Actions → feod-deploy:** оператор предоставляет **публичный** ключ, соответствующий `DEPLOY_SSH_KEY`; добавь в `/home/feod-deploy/.ssh/authorized_keys`.
3. **Оператор → root и feod-deploy:** добавь его публичный ключ в `authorized_keys`.
4. Настрой `/home/feod-deploy/.ssh/config` для `Host github.com` с `IdentityFile ~/.ssh/github_deploy`.

Проверка:

```bash
ssh -o BatchMode=yes feod-deploy@<DEPLOY_HOST> 'whoami'
sudo -u feod-deploy ssh -o BatchMode=yes git@github.com  # ожидается: успешная аутентификация GitHub
```

### Фаза 3 — GitHub Secrets (если менялись ключи или IP)

Через `gh` (оператор авторизован) или UI:

```bash
gh secret set DEPLOY_HOST -R Sdju/feod -b "<IP>"
gh secret set DEPLOY_USER -R Sdju/feod -b "feod-deploy"
gh secret set DEPLOY_SSH_KEY -R Sdju/feod < <path-to-actions-private-key>
```

Deploy key (публичный ключ сервера):

```bash
gh repo deploy-key add -R Sdju/feod -t "feod-server-git-deploy" <path-to-github_deploy.pub>
```

### Фаза 4 — клон и первый деплой

**Только git clone.** Не копируй репозиторий через tar/rsync — это ломает `.git` и ломает `deploy.sh`.

```bash
sudo -u feod-deploy git clone git@github.com:Sdju/feod.git /opt/feod
sudo -u feod-deploy /opt/feod/deploy/deploy.sh
```

Ожидание: контейнер `feod-site` слушает `:80`, HTTP отвечает.

### Фаза 5 — HTTPS (root)

```bash
CERTBOT_EMAIL=<email-оператора> bash /opt/feod/deploy/setup-https.sh
```

Скрипт: временный HTTP nginx → certbot webroot → финальный `nginx.conf` с SSL → hook renew.

Проверка:

```bash
curl -sI https://feod.dev/ | head -5
certbot renew --dry-run
```

### Фаза 6 — firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Фаза 7 — SSH hardening (после проверки входа по ключам)

Создай `/etc/ssh/sshd_config.d/99-feod-hardening.conf`:

```
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
```

На FirstVDS проверь также `/etc/ssh/sshd_config.d/40-hosting.conf` — там может быть `PasswordAuthentication yes` (**первое** значение в sshd имеет приоритет). Приведи к `no`.

```bash
sshd -t && systemctl reload ssh
```

Убедись, что пароль **не** работает, ключи — работают.

### Фаза 8 — проверка CI/CD

```bash
gh workflow run deploy-production.yml -R Sdju/feod
gh run list -R Sdju/feod --workflow=deploy-production.yml -L 1
```

Workflow должен завершиться success; на сервере `docker ps` показывает `feod-site`.

## Чеклист «всё работает»

- [ ] `https://feod.dev` → HTTP 200
- [ ] `http://feod.dev` → redirect на HTTPS
- [ ] `ssh feod-deploy@<host>` по ключу без пароля
- [ ] `/opt/feod` — чистый git clone, `git pull` без ошибок
- [ ] `deploy.sh` отрабатывает локально на сервере
- [ ] GitHub Actions deploy workflow — success
- [ ] `certbot renew --dry-run` — success

## Типичные ошибки и решения

| Симптом | Причина | Решение |
|---|---|---|
| `untracked files would be overwritten by merge` | репо залито tar/scp поверх git | удалить `/opt/feod`, **fresh clone** |
| `unable to read sha1 file` / corrupt git | повреждён `.git/objects` | backup + fresh clone |
| Workflow: `Permission denied (publickey)` | неверный `DEPLOY_SSH_KEY` или нет ключа в `authorized_keys` | синхронизировать пару ключей Actions |
| `git@github.com: Permission denied` | deploy key не добавлен или новый ключ не обновлён на GitHub | обновить Deploy key |
| HTTPS не поднимается | cert ещё не выпущен | `setup-https.sh`, проверить DNS и `:80` |
| Пароль всё ещё работает | `40-hosting.conf` переопределяет hardening | исправить hosting config, `sshd -T \| grep password` |

## Чего не делать

- Не коммитить секреты и ключи в репозиторий.
- Не синхронизировать `/opt/feod` через tar вместо git.
- Не отключать `PasswordAuthentication`, пока не проверен вход по ключу.
- Не удалять deploy key / secrets без заранее добавленной замены.

## Краткая команда для агента (summary)

> Подключись к VPS, установи Docker/git/certbot, создай `feod-deploy`, настрой SSH-ключи (оператор предоставляет секреты **вне** репо), обнови GitHub Secrets и Deploy key при необходимости, выполни `git clone` в `/opt/feod`, запусти `deploy/setup-https.sh`, включи UFW, harden SSH, проверь `https://feod.dev` и workflow `deploy-production.yml`.
