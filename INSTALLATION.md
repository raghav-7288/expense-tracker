# Installation Guide

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | 22.x | `node --version` |
| npm | 10.x+ | `npm --version` |
| Git | Any | `git --version` |
| Supabase account | — | [supabase.com](https://supabase.com) |

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs all production and development dependencies defined in `package.json`.

## Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```dotenv
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Where to find your credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Project URL** → `VITE_SUPABASE_URL`
5. Copy the **anon / public** key → `VITE_SUPABASE_ANON_KEY`

> ⚠️ **Important:** Never use the `service_role` key in frontend code. It bypasses Row Level Security and exposes full database access.

## Step 4: Set Up the Database

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for complete database setup instructions.

## Step 5: Verify the Connection

```bash
npm run verify-supabase
```

This script checks that your Supabase URL and key are valid and the database is accessible.

## Step 6: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Step 7: Create Your Account

1. Click **Sign Up** on the login page
2. Enter your email, name, and password
3. Check your email for a confirmation link (if email confirmation is enabled in Supabase)
4. Log in and start tracking expenses!

## Optional: Google OAuth

To enable "Sign in with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID
3. Add `https://your-project-id.supabase.co/auth/v1/callback` as an authorized redirect URI
4. In Supabase Dashboard → **Authentication → Providers → Google**, enable it and paste your Client ID and Secret

## Troubleshooting

### `Error: Missing Supabase environment variables`

Your `.env.local` file is missing or has empty values. Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.

### `npm install` fails

Ensure you're using Node.js 22.x:

```bash
node --version  # Should output v22.x.x
```

If using nvm:

```bash
nvm install 22
nvm use 22
```

### Port 5173 is already in use

Kill the existing process or use a different port:

```bash
npm run dev -- --port 3000
```

### Database tables not found

Make sure you've run all 5 migration files in order. See [DATABASE_SETUP.md](DATABASE_SETUP.md).

