# Insighta CLI

Command-line interface for Insighta Labs+.

## Installation
```bash
npm install
npm link
```

## Usage
```bash
insighta login
insighta logout
insighta whoami

insighta profiles list
insighta profiles list --gender male --country NG --age-group adult
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc --page 2 --limit 20
insighta profiles get <id>
insighta profiles search "young males from nigeria"
insighta profiles create --name "Harriet Tubman"
insighta profiles export --format csv
```

## Token Handling
- Tokens stored at `~/.insighta/credentials.json`
- Access token expires in 3 minutes — auto-refreshed on 401
- If refresh fails, user is prompted to login again

## Backend
https://insighta-api-production-0a80.up.railway.app