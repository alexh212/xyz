# AI-Powered GitHub PR Review Assistant

An end-to-end **AI code review platform** that combines a Chrome extension, Flask API, and LLM analysis to help developers review pull requests faster and with higher quality.

The extension runs directly on GitHub PR pages and enables one-click analysis of code changes. It sends PR context to a backend service that uses OpenAI models to return structured findings across security, performance, code quality, and best practices.

---

## Demo

> Replace placeholders below with your actual assets.

### Product walkthrough (GIF)

![AI PR Review Assistant Demo](docs/assets/demo.gif)

### Screenshots

| GitHub PR page with AI Review button | AI review sidebar with grouped findings |
|---|---|
| ![PR Page](docs/assets/screenshot-pr-page.png) | ![Sidebar](docs/assets/screenshot-sidebar.png) |

---

## Key Features

- **GitHub-native review workflow** via Chrome Extension (Manifest V3)
- **One-click AI review trigger** from PR pages
- **Structured findings by category**:
  - Security Issues
  - Performance
  - Code Quality
  - Best Practices
- **Severity tagging** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- **Actionable recommendations** with suggested fixes
- **Backend API rate limiting + payload guardrails**
- **Production deployment scaffolding** for DigitalOcean with Docker, Nginx, and Certbot
- **Optional GitHub token support** for richer API access and higher limits

---

## Tech Stack

### Chrome Extension
- Manifest V3
- React + TypeScript (UI components)
- Content script integration on GitHub PR pages

### Backend
- Python + Flask
- OpenAI API integration
- MongoDB Atlas (planned/production-ready env scaffolding)
- Gunicorn (production server)

### Infra / DevOps
- Docker + Docker Compose
- Nginx reverse proxy
- Let’s Encrypt (Certbot) for SSL
- DigitalOcean (Droplet target)
- GitHub Actions (optional deployment workflow)

---

## Repository Structure

```text
.
├── backend/                 # Flask API
├── chrome-extension/        # Browser extension source
├── deploy/                  # Nginx + certbot configs
├── docs/                    # Deployment docs and assets
├── .github/workflows/       # Optional CI/CD workflows
└── docker-compose.yml       # Production stack definition
```

---

## Installation (Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+
- Git

### 1) Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2) Backend setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

Create your local env file:

```bash
cp backend/.env.production.example backend/.env
```

Then edit `backend/.env` for local development values.

### 3) Extension setup (frontend shell)

```bash
cd chrome-extension
npm install
cd ..
```

> Note: if your bundler setup is not added yet, you can still load unpacked extension assets for scaffold-level testing.

---

## API Keys & Secrets Setup

Create environment values (in `backend/.env` / production secret manager):

- `OPENAI_API_KEY` → OpenAI API key
- `OPENAI_MODEL` → e.g. `gpt-4`
- `OPENAI_API_BASE` → default `https://api.openai.com/v1`
- `MONGODB_URI` → MongoDB Atlas connection string
- `MONGODB_DB` → database name

### GitHub Token (optional, extension)

A personal access token can be saved in extension storage for higher GitHub API limits and private repos.

Recommended scopes (minimum required depending on repo access):
- `repo` (private repos)
- `read:org` (if organization visibility is needed)

---

## Run Locally

### Start backend

```bash
cd backend
export FLASK_ENV=development
python app.py
```

Backend runs on `http://localhost:5000`.

### Load Chrome extension (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `chrome-extension/`
5. Navigate to any GitHub PR page and use the extension features

---

## Build the Extension

If your frontend build pipeline is configured:

```bash
cd chrome-extension
npm run build
```

For Chrome Web Store packaging:

```bash
cd chrome-extension
zip -r ../chrome-extension-release.zip . -x "*.git*" "node_modules/*"
```

Upload `chrome-extension-release.zip` in the Chrome Web Store Developer Dashboard.

---

## Deployment Guide

Production deployment instructions are documented in:

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

This includes:
- Deploying to DigitalOcean Droplet
- MongoDB Atlas configuration
- HTTPS setup with Certbot
- Production env configuration
- Optional GitHub Actions-based deploy flow

---

## Contributing

Contributions are welcome.

### Workflow

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit with clear messages
4. Add/update docs and tests
5. Open a pull request with:
   - Problem statement
   - Implementation summary
   - Screenshots/GIFs (for UI changes)
   - Validation steps

### Contribution standards

- Keep changes scoped and reviewable
- Follow existing naming and project structure
- Prefer typed interfaces and explicit error handling
- Never commit secrets/API keys

---

## License

This project is licensed under the **MIT License**.

If you haven’t added a license file yet, create `LICENSE` with the MIT template before public release.

---

## Metrics & Impact (WIP)

Add these once you have production usage data:

- PRs reviewed per week
- Median review turnaround improvement
- Defect classes caught pre-merge (security/performance/quality)
- False-positive rate over time
- Team adoption across repositories

Example section format:

- **500+ PRs analyzed** in first 60 days
- **32% faster review cycles** on average
- **Top recurring issue class:** input validation and error handling

---

## Roadmap

- [ ] Full React popup + sidebar integration
- [ ] Structured PR payload ingestion on backend
- [ ] Persistent review history in MongoDB
- [ ] Analytics dashboard for issue trends
- [ ] Automated test suite (unit + integration + e2e)

---

Built for developers who want faster, more consistent PR reviews without sacrificing quality.
