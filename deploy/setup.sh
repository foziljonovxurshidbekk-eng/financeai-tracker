#!/usr/bin/env bash
# Glass Finance — Ubuntu serverga bir buyruq bilan o'rnatish (Oracle Cloud / Google Cloud / istalgan VPS).
#
#   curl -fsSL https://raw.githubusercontent.com/foziljonovxurshidbekk-eng/financeai-tracker/main/deploy/setup.sh | sudo bash
#
# Qayta ishga tushirsangiz — kodni yangilaydi, .env va ma'lumotlarga tegmaydi.
set -euo pipefail

REPO="${REPO:-https://github.com/foziljonovxurshidbekk-eng/financeai-tracker.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/glass-finance}"
APP_USER="glassfin"
PORT=3000

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
# Savollarga javob terminaldan o'qiladi (curl | bash holatida ham)
if ! { exec 3</dev/tty; } 2>/dev/null; then exec 3<&0; fi
ask() { # ask VAR "Savol" [secret]
  local __var=$1 __prompt=$2 __val
  if [ "${3:-}" = secret ]; then read -rsp "$__prompt: " __val <&3; echo; else read -rp "$__prompt: " __val <&3; fi
  printf -v "$__var" '%s' "$__val"
}

[ "$(id -u)" -eq 0 ] || { echo "sudo bilan ishga tushiring: curl ... | sudo bash"; exit 1; }
command -v apt-get >/dev/null || { echo "Bu skript Ubuntu/Debian uchun."; exit 1; }

say "Tizim paketlari"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https >/dev/null

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  say "Node.js 22 o'rnatilmoqda"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
echo "Node $(node -v)"

say "Ilova kodi: $APP_DIR"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch -q origin "$BRANCH"
  git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
else
  git clone -q --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
mkdir -p "$APP_DIR/data/backups"
(cd "$APP_DIR" && npm ci --omit=dev --no-audit --no-fund --loglevel=error)

PUBLIC_IP="$(curl -fsS -4 https://api.ipify.org || curl -fsS -4 https://ifconfig.me || true)"
DOMAIN="${DOMAIN:-${PUBLIC_IP:+$PUBLIC_IP.sslip.io}}"

if [ ! -f "$APP_DIR/.env" ]; then
  say "Sozlamalar (.env). Bo'sh qoldirish mumkin bo'lganlari — Enter."
  ask ANTHROPIC_API_KEY "Claude API kaliti (console.anthropic.com)" secret
  ask BOT_TOKEN "Telegram bot tokeni (@BotFather)" secret
  ask TELEGRAM_ALLOWED_IDS "Sizning Telegram ID (bilmasangiz bo'sh qoldiring, bot /start da ko'rsatadi)"
  APP_PASSWORD=""
  while [ -z "$APP_PASSWORD" ]; do ask APP_PASSWORD "Saytga kirish paroli (majburiy)" secret; done
  umask 077
  cat >"$APP_DIR/.env" <<EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
BOT_TOKEN=$BOT_TOKEN
TELEGRAM_ALLOWED_IDS=$TELEGRAM_ALLOWED_IDS
APP_PASSWORD=$APP_PASSWORD
PORT=$PORT
HOST=127.0.0.1
DATA_DIR=$APP_DIR/data
EOF
else
  echo ".env mavjud — o'zgartirilmadi"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 600 "$APP_DIR/.env"

say "systemd xizmati"
cat >/etc/systemd/system/glass-finance.service <<EOF
[Unit]
Description=Glass Finance
After=network-online.target
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$(command -v node) server/index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable -q glass-finance
systemctl restart glass-finance

say "Kunlik zaxira nusxa (14 kun saqlanadi)"
cat >/etc/cron.daily/glass-finance-backup <<EOF
#!/bin/sh
[ -f $APP_DIR/data/db.json ] && cp $APP_DIR/data/db.json $APP_DIR/data/backups/db-\$(date +%F).json
find $APP_DIR/data/backups -name 'db-*.json' -mtime +14 -delete
EOF
chmod +x /etc/cron.daily/glass-finance-backup

if [ -n "$DOMAIN" ]; then
  say "HTTPS (Caddy) — https://$DOMAIN"
  if ! command -v caddy >/dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' >/etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq && apt-get install -y -qq caddy >/dev/null
  fi
  cat >/etc/caddy/Caddyfile <<EOF
$DOMAIN {
  encode gzip
  reverse_proxy 127.0.0.1:$PORT
}
EOF
  systemctl restart caddy

  # Oracle Cloud Ubuntu obrazlarida 80/443 portlar iptables bilan yopiq bo'ladi
  if command -v iptables >/dev/null && iptables -S INPUT 2>/dev/null | grep -q REJECT; then
    for p in 80 443; do
      iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport $p -j ACCEPT
    done
    command -v netfilter-persistent >/dev/null && netfilter-persistent save >/dev/null 2>&1 || true
  fi
  command -v ufw >/dev/null && ufw status | grep -q active && ufw allow 80,443/tcp >/dev/null || true
fi

sleep 2
say "Tayyor!"
systemctl --no-pager --lines=5 status glass-finance || true
cat <<EOF

  Sayt:      ${DOMAIN:+https://$DOMAIN}
  Loglar:    journalctl -u glass-finance -f
  Yangilash: shu buyruqni qayta ishga tushiring
  Sozlama:   sudo nano $APP_DIR/.env  &&  sudo systemctl restart glass-finance

  Sayt ochilmasa: bulut panelida (Oracle: Security List, Google: Firewall) 80 va 443 portlarni oching.
EOF
