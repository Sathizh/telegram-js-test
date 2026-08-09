# Telegram Profile Bot

A private Telegram bot that retrieves profile information using a unique profile ID and delivers formatted details, verified profile photos, and related images directly to Telegram through a secure API-based workflow.

## Features

- 🔎 Retrieve profile details using a profile ID
- 👤 Display formatted profile information
- 📸 Send verified profile photo with profile details
- 🖼️ Send related images separately as a Telegram album
- 📝 Support multiple image URLs
- 🌐 Integrate with an external profile API
- 🤖 Telegram webhook-based communication
- 🔐 Keep API credentials in environment variables
- ⚠️ Highlight specific profile status when applicable
- 🔯 Display profile-specific attributes with formatted labels

## Workflow

```text
Telegram
   ↓
Telegram Webhook
   ↓
Node.js / Express
   ↓
External Profile API
   ↓
Profile Data
   ↓
Response Formatting
   ↓
Telegram
   ├── Profile Photo + Details
   └── Related Images
```

## Requirements

- Node.js 18+
- npm
- Telegram Bot
- External API access
- Telegram Bot Token
- API Bearer Token

## Project Structure

```text
telegram-profile-bot/
├── bot.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── node_modules/
```

## Environment Variables

Create a `.env` file in the project root:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_BEARER_TOKEN=your_api_bearer_token
```

Never commit `.env` to the repository.

## Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Enter the project directory:

```bash
cd telegram-profile-bot
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
touch .env
```

Add your credentials to `.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_BEARER_TOKEN=your_api_bearer_token
```

## Run Locally

Start the application:

```bash
node bot.js
```

Expected output:

```text
🚀 Server running at http://localhost:3000
📡 Waiting for Telegram webhook...
```

## Local Telegram Testing

Telegram cannot directly access a server running on `localhost`.

Use Cloudflare Tunnel to expose the local application:

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflare will provide a temporary public URL similar to:

```text
https://example-name.trycloudflare.com
```

The Telegram webhook endpoint will be:

```text
https://example-name.trycloudflare.com/telegram
```

## Configure Telegram Webhook

Set the webhook:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://example-name.trycloudflare.com/telegram"
```

Verify the webhook:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

A successful response should contain:

```json
{
  "ok": true,
  "result": {
    "url": "https://example-name.trycloudflare.com/telegram"
  }
}
```

## Usage

Send a profile ID to the Telegram bot:

```text
2779919
```

The bot will:

1. Receive the profile ID.
2. Retrieve the profile from the external API.
3. Format the profile information.
4. Send the verified profile photo with the formatted details.
5. Send related images separately as a Telegram album.

## Telegram Response

The profile response uses formatted labels and presents the available profile information in a compact Telegram-friendly format.

The response contains:

- Name
- Age
- Marital status
- Religion
- Caste
- Mother tongue
- Education
- Employment
- Location
- Height
- Weight
- Family details
- Rasi
- Star
- Dosham

Divorced status is highlighted with a warning indicator.

Dosham status is displayed using:

```text
No 🚫
```

or:

```text
Ullathu ✅
```

The verified profile photo is sent together with the formatted profile details.

Related jathagam images are sent separately as a Telegram album.

## Image Handling

The application supports both single and multiple image URLs.

For example, a single image:

```text
https://example.com/image1.jpg
```

Multiple images:

```text
https://example.com/image1.jpg,https://example.com/image2.jpg
```

The application converts these values into an array before sending them to Telegram.

Multiple images are sent using Telegram's media group functionality so they appear together as an album rather than as unrelated individual messages.

## Git Setup

Initialize Git in the project directory:

```bash
git init
```

Check the repository status:

```bash
git status
```

Add the project files:

```bash
git add .
```

Create the initial commit:

```bash
git commit -m "Initial project setup"
```

Add the GitHub repository:

```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
```

Set the main branch:

```bash
git branch -M main
```

Push the project to GitHub:

```bash
git push -u origin main
```

## Git Ignore

Create a `.gitignore` file in the project root.

Recommended contents:

```gitignore
.env
node_modules/
.DS_Store
```

This prevents sensitive environment variables and installed dependencies from being committed to GitHub.

## Security

Never commit the following to GitHub:

- Telegram bot token
- API bearer token
- `.env` file
- Other private credentials

The application reads credentials using environment variables:

```javascript
process.env.TELEGRAM_BOT_TOKEN
```

and:

```javascript
process.env.API_BEARER_TOKEN
```

For production deployment, configure these variables directly through the hosting platform.

## Local Development

For local development, two terminals are typically required.

### Terminal 1 — Node.js Server

```bash
node bot.js
```

The server should remain running:

```text
🚀 Server running at http://localhost:3000
📡 Waiting for Telegram webhook...
```

### Terminal 2 — Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

Keep the tunnel running while testing the Telegram webhook.

If the Cloudflare URL changes, update the Telegram webhook to use the new URL.

## Troubleshooting

### Bot is not responding

Check that the Node.js server is running:

```bash
node bot.js
```

Check that Cloudflare Tunnel is running:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then verify the Telegram webhook:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

Make sure the webhook URL ends with:

```text
/telegram
```

### Telegram returns 404

Make sure the webhook points to:

```text
https://YOUR-CLOUDFLARE-URL/telegram
```

and not just:

```text
https://YOUR-CLOUDFLARE-URL
```

### API request fails

Check that `API_BEARER_TOKEN` exists:

```bash
echo $API_BEARER_TOKEN
```

If using `.env`, make sure the application loads it with:

```javascript
require("dotenv").config();
```

### Telegram bot receives the message but doesn't respond

Check the Node.js terminal.

You should see something similar to:

```text
📩 Telegram request received
Chat ID: 123456789
Profile ID: 2779919
🔎 Calling Nithra API...
Nithra API status: 200
```

Then check the Telegram API response printed by the application.

## Deployment

The application can be deployed to a serverless hosting platform.

The production workflow will be:

```text
Telegram
   ↓
Hosted Webhook
   ↓
Serverless Function
   ↓
External Profile API
   ↓
Serverless Function
   ↓
Telegram
```

Production credentials should be configured as environment variables on the hosting platform.

For example:

```text
TELEGRAM_BOT_TOKEN
API_BEARER_TOKEN
```

Cloudflare Tunnel is only required for local webhook testing and is not required once the application is deployed.

## Production Checklist

Before deploying to production:

- [ ] `.env` is included in `.gitignore`
- [ ] No API tokens are committed to GitHub
- [ ] Telegram bot token is stored securely
- [ ] API bearer token is stored securely
- [ ] Telegram webhook points to the production endpoint
- [ ] Profile API requests are working
- [ ] Profile photo delivery is working
- [ ] Multiple image albums are working
- [ ] Invalid profile IDs are handled
- [ ] Missing images are handled
- [ ] Only authorized Telegram users can access the bot

## Future Improvements

Possible improvements include:

- 🔐 Restrict access to authorized Telegram users
- ☁️ Deploy as a serverless function
- ⏱️ Add API request timeout handling
- 🔄 Add retry handling for temporary API failures
- 📊 Add structured logging
- 🛡️ Improve webhook security
- ⚡ Optimize API and Telegram response time

## License

This project is intended for private use.