# Production Deployment Guide

## 1) Deploy Flask backend to DigitalOcean

### Option A: Droplet + Docker Compose (recommended for MVP)
1. Create Ubuntu 22.04 Droplet.
2. SSH into server and install Docker + Compose plugin:
   ```bash
   sudo apt update
   sudo apt install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```
3. Clone repo, copy env file:
   ```bash
   cp backend/.env.production.example backend/.env.production
   ```
4. Update `deploy/nginx/default.conf` with your domain.
5. Start stack:
   ```bash
   docker compose up -d --build
   ```

## 2) MongoDB Atlas setup
1. Create Atlas cluster.
2. Add a DB user and password.
3. Add network access for Droplet IP.
4. Copy connection string into `MONGODB_URI` in `backend/.env.production`.

## 3) HTTPS/SSL certificate
1. Run initial cert issue after DNS is pointed:
   ```bash
   docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain -d www.your-domain --email you@example.com --agree-tos --no-eff-email
   ```
2. Restart nginx:
   ```bash
   docker compose restart nginx
   ```
3. Add cron for renewal (example):
   ```bash
   0 3 * * * cd /path/to/repo && docker compose run --rm certbot renew && docker compose restart nginx
   ```

## 4) Environment variables
Required backend variables:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_API_BASE`
- `MONGODB_URI`
- `MONGODB_DB`
- `RATE_LIMIT_DEFAULT`
- `RATE_LIMIT_REVIEW`
- `MAX_DIFF_CHARS`

## 5) Package Chrome extension for Chrome Web Store
1. Build extension assets (once frontend build is added):
   ```bash
   npm install
   npm run build
   ```
2. Ensure `manifest.json` points to production backend URL.
3. Zip extension root contents (not parent folder):
   ```bash
   cd chrome-extension
   zip -r ../chrome-extension-release.zip . -x "*.git*" "node_modules/*"
   ```
4. Upload zip to Chrome Web Store developer dashboard.

## 6) Optional CI/CD with GitHub Actions
Use `.github/workflows/deploy.yml` for build + SSH deploy to Droplet.

Secrets needed:
- `DO_HOST`
- `DO_USER`
- `DO_SSH_KEY`
- `DO_DEPLOY_PATH`
