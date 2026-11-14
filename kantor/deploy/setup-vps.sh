#!/usr/bin/env bash
# Memasang Kantor di VPS Ubuntu 22.04 / 24.04.
# Jalankan sebagai root:   sudo bash kantor/deploy/setup-vps.sh
# BELUM diuji di VPS sungguhan: baca tiap langkah sebelum menjalankannya.
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "Jalankan sebagai root: sudo bash $0"; exit 1; }

REPO_URL="${REPO_URL:-https://github.com/nurdian12/belajar-react.git}"
BRANCH="${BRANCH:-claude/animation-blueprint-9req4g}"
PENGGUNA="${PENGGUNA:-kantor}"
RUMAH="/home/$PENGGUNA"
APP="$RUMAH/belajar-react"

echo "==> 1/6 Paket sistem (Chromium untuk render video, ffmpeg, font)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates gnupg ffmpeg fonts-liberation fonts-noto-color-emoji \
  libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxrandr2 libxkbcommon0 libxfixes3 \
  libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2
apt-get install -y libasound2t64 2>/dev/null || apt-get install -y libasound2   # nama paket beda antar versi Ubuntu

echo "==> 2/6 Node.js 22 (dari repositori resmi NodeSource)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> 3/6 Pengguna '$PENGGUNA' (layanan tidak berjalan sebagai root)"
id "$PENGGUNA" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$PENGGUNA"

echo "==> 4/6 Kode Kantor + dependensi"
if [ -d "$APP/.git" ]; then
  sudo -u "$PENGGUNA" git -C "$APP" fetch origin "$BRANCH" && sudo -u "$PENGGUNA" git -C "$APP" checkout "$BRANCH" && sudo -u "$PENGGUNA" git -C "$APP" pull --ff-only
else
  sudo -u "$PENGGUNA" git clone --branch "$BRANCH" "$REPO_URL" "$APP"
fi
sudo -u "$PENGGUNA" bash -lc "cd '$APP' && npm install --no-audit --no-fund"
[ -f "$APP/kantor/.env" ] || sudo -u "$PENGGUNA" cp "$APP/kantor/.env.example" "$APP/kantor/.env"
chmod 600 "$APP/kantor/.env"

echo "==> 5/6 Claude Code (pemasang resmi, untuk pengguna '$PENGGUNA')"
sudo -u "$PENGGUNA" bash -lc 'command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash'

echo "==> 6/6 Layanan systemd (hidup otomatis dan menyala ulang bila mati)"
sed "s|__PENGGUNA__|$PENGGUNA|g; s|__APP__|$APP|g; s|__RUMAH__|$RUMAH|g" "$APP/kantor/deploy/kantor.service" > /etc/systemd/system/kantor.service
systemctl daemon-reload
systemctl enable kantor >/dev/null

cat <<SELESAI

Selesai dipasang. Layanan belum dinyalakan. Langkah berikutnya:

  1) Login Claude Code sekali (pakai langganan Claude kamu):
       sudo -u $PENGGUNA -i claude
     Ikuti tautan login yang muncul, tempel kodenya, lalu keluar dengan /exit.
  2) Isi kunci seperlunya:
       sudo -u $PENGGUNA nano $APP/kantor/.env      (ELEVENLABS_API_KEY, REPLIZ_*, dst.)
  3) Nyalakan:
       systemctl start kantor
       journalctl -u kantor -f                       (lihat log)
  4) Dari laptop, buka dashboard lewat SSH tunnel (dashboard TIDAK dibuka ke internet):
       ssh -L 4321:127.0.0.1:4321 <pengguna-ssh>@<IP-VPS>
     lalu buka http://127.0.0.1:4321

SELESAI
