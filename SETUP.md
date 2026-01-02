# Quick Setup Guide

Follow these steps to get the app running:

## Step 1: Install Dependencies

```bash
yarn install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be ready (takes a few minutes)

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (this is your `SUPABASE_SERVICE_ROLE_KEY`) - keep this secret!

3. Go to **Settings** → **Database**
4. Under "Connection string", select "URI" and copy the connection string
   - This is your `DATABASE_URL`
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 4: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. (Optional) Configure email templates if needed

## Step 5: Create Environment File

Create a `.env` file in the root directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Then edit `.env` and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (from Supabase Database settings)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Replace `[YOUR-PASSWORD]` in the DATABASE_URL with your actual database password (set when creating the Supabase project).

## Step 6: Set Up Database Schema

```bash
# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push
```

This will create all the necessary tables in your Supabase database.

## Step 7: Run the Development Server

```bash
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Step 8: Create Your First User

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Don't have an account?" to switch to signup
3. Enter your email and password (minimum 6 characters)
4. Click "Sign Up"
5. You'll be automatically logged in and redirected to the dashboard

## Step 9: (Optional) Seed Sample Data

After creating your first user, you can seed the database with sample data:

```bash
yarn db:seed
```

This will create:
- Sample daily logs for the last 30 days
- A sample challenge

## Troubleshooting

### "Module not found" errors
Run `yarn install` again to ensure all dependencies are installed.

### Database connection errors
- Double-check your `DATABASE_URL` in `.env`
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- Verify your Supabase project is active

### Authentication errors
- Make sure Email provider is enabled in Supabase
- Check that your Supabase URL and keys are correct in `.env`

### Prisma errors
- Run `yarn db:generate` to regenerate the Prisma client
- Make sure your `DATABASE_URL` is correct

## Next Steps

- Create challenges and invite friends
- Start tracking your sugar-free streaks
- Switch between English and Portuguese using the language switcher

