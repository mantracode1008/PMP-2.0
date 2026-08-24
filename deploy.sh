#!/bin/bash
set -e

echo "🚀 ================================================"
echo "🚀 Starting PMP Full Deployment on VPS"
echo "🚀 ================================================"

# 1. Load Node / NVM environment
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"
export PATH=$PATH:/usr/local/bin:/usr/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

echo "📌 Node Version: $(node -v 2>/dev/null || echo 'Not found')"
echo "📌 NPM Version:  $(npm -v 2>/dev/null || echo 'Not found')"

# 2. Ensure PM2 and Git are available
command -v pm2 >/dev/null 2>&1 || npm install -g pm2
command -v git >/dev/null 2>&1 || (sudo apt update && sudo apt install -y git)

DEPLOY_DIR="/var/www/pmp"
mkdir -p $DEPLOY_DIR

# 3. Pull latest code or initialize
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "📦 Cloning Repository into $DEPLOY_DIR..."
  git clone https://github.com/mantracode1008/PMP-2.0.git $DEPLOY_DIR
  cd $DEPLOY_DIR
else
  echo "🔄 Pulling latest changes from Git..."
  cd $DEPLOY_DIR
  git fetch origin
  git checkout main || true
  git reset --hard origin/main
fi

# 4. Configure Backend .env
echo "⚙️ Configuring Backend Environment..."
mkdir -p $DEPLOY_DIR/backend
cat << 'EOF' > $DEPLOY_DIR/backend/.env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://pmp_user:Letvar@1810@localhost:5432/pmp_db?schema=public

JWT_SECRET=pmp_jwt_super_secret_key_2026_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=pmp_refresh_super_secret_key_2026_production
JWT_REFRESH_EXPIRES_IN=7d

SUPER_ADMIN_EMAIL=admin@pmp.local
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_FIRST_NAME=System
SUPER_ADMIN_LAST_NAME=Super Admin

CORS_ORIGIN=https://pmp.letvarsolution.com,http://145.223.22.204:3000,http://localhost:3000
EOF

# 5. Configure Frontend .env.local
echo "⚙️ Configuring Frontend Environment..."
mkdir -p $DEPLOY_DIR/frontend
cat << 'EOF' > $DEPLOY_DIR/frontend/.env.local
NEXT_PUBLIC_API_URL=https://pmp.letvarsolution.com/api/v1
EOF

# 6. Build Backend & Sync Database
echo "📦 Installing Backend Dependencies & Syncing Database..."
cd $DEPLOY_DIR/backend
npm install --production=false
npx prisma generate
npx prisma db push
npm run prisma:clean || true
npm run build

# 7. Build Frontend
echo "🎨 Installing Frontend Dependencies & Building Next.js App..."
cd $DEPLOY_DIR/frontend
npm install --production=false
npm run build

# 8. Start / Restart PM2 Services
echo "🔁 Starting / Reloading Services in PM2..."

if pm2 describe pmp-backend > /dev/null 2>&1; then
  pm2 restart pmp-backend --update-env
else
  pm2 start $DEPLOY_DIR/backend/dist/main.js --name "pmp-backend" --cwd $DEPLOY_DIR/backend
fi

if pm2 describe pmp-frontend > /dev/null 2>&1; then
  pm2 restart pmp-frontend --update-env
else
  pm2 start npm --name "pmp-frontend" --cwd $DEPLOY_DIR/frontend -- start -- -p 3000
fi

pm2 save

echo "🎉 ================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "🎉 Site is live at: https://pmp.letvarsolution.com"
echo "🎉 ================================================"
