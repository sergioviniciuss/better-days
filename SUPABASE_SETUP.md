# Supabase Setup - Step by Step Guide

You've created your Supabase project! Now follow these steps to get all the credentials you need.

## Step 1: Get Your Project URL

1. Look at the **top header bar** in your Supabase dashboard
2. You should see your project name (e.g., "sergioviniciuss's Project")
3. The **Project URL** is shown in the browser address bar, or you can find it in **Settings → API**
4. It looks like: `https://xxxxxxxxxxxxx.supabase.co`
5. **Copy this URL** - this is your `NEXT_PUBLIC_SUPABASE_URL`

## Step 2: Get Your API Keys

You're currently on the **API Keys** page (which is perfect!)

### Option A: New API Keys (Recommended - if you see "Publishable key")

1. On the **"Publishable and secret API keys"** tab (which you're on):
   - Find the **"Publishable key"** section
   - Click the **copy icon** (📋) next to the key that starts with `sh_publishable_...`
   - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
2. Scroll down to find the **"Secret key"** section:
   - Click **"+ New secret key"** if you don't have one
   - Click the **copy icon** next to the secret key
   - This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Option B: Legacy API Keys (if you see "anon" and "service_role")

1. Click on the **"Legacy anon, service_role API keys"** tab
2. You'll see two keys:
   - **anon public** key - Copy this (this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key - Click "Reveal" and copy this (this is `SUPABASE_SERVICE_ROLE_KEY` - keep it secret!)

## Step 3: Get Your Database Connection String

1. In the **left sidebar**, click on **"Database"** (it has an external link icon)
2. Or go to **Settings → Database**
3. Scroll down to find **"Connection string"** or **"Connection pooling"**
4. Select the **"URI"** tab (not "Session mode" or "Transaction mode")
5. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. **Important**: Replace `[YOUR-PASSWORD]` with the database password you set when creating the project
   - If you forgot it, you can reset it in **Settings → Database → Database password**
7. **Copy the full connection string** - this is your `DATABASE_URL`

## Step 4: Enable Email Authentication

1. In the **left sidebar**, click on **"Authentication"** (it has an external link icon)
2. Or go to **Authentication → Providers**
3. Make sure **"Email"** is enabled (toggle should be ON/green)
4. If it's not enabled, click the toggle to enable it
5. (Optional) You can configure email templates, but the defaults work fine for development

## Step 5: Create Your .env File

Now that you have all the credentials, create a `.env` file in your project root:

1. In your project folder (`betterDays`), create a new file called `.env`
2. Copy this template and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-secret-or-service-role-key-here

# Database (replace [YOUR-PASSWORD] with your actual database password)
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.your-project-ref.supabase.co:5432/postgres

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sh_publishable_ai0NgRdAAHfua287m71Sxg_ugxf-...
SUPABASE_SERVICE_ROLE_KEY=sh_secret_xyz123...
DATABASE_URL=postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Continue with Database Setup

Once your `.env` file is ready, go back to `SETUP.md` and continue from **Step 6: Set Up Database Schema**

Run these commands:
```bash
yarn db:generate
yarn db:push
```

## Quick Checklist

- [ ] Got Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- [ ] Got Publishable/Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Got Secret/Service Role key (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Got Database connection string (`DATABASE_URL`) with password replaced
- [ ] Enabled Email authentication
- [ ] Created `.env` file with all values filled in

## Need Help?

- **Forgot database password?** Go to Settings → Database → Reset database password
- **Can't find API keys?** Make sure you're on Settings → API Keys page
- **Connection string not working?** Make sure you replaced `[YOUR-PASSWORD]` with your actual password


