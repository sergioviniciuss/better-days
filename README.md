# Better Days - Sugar-Free Streaks App

A web application to track sugar-free streaks with group challenges and light competition.

## Features

- **Daily Logging**: Confirm each day whether you consumed sugar or not
- **Streak Tracking**: Maintain and track your current and best streaks
- **Pending Days**: Offline-friendly confirmation of missed days
- **Group Challenges**: Create and join challenges with friends
- **Leaderboards**: Compete and see rankings based on confirmed streaks
- **Internationalization**: Support for English and Portuguese (pt-BR)
- **Responsive Design**: Mobile-first approach optimized for touch devices

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Postgres), Prisma ORM
- **i18n**: next-intl
- **Testing**: Jest + React Testing Library
- **Hosting**: Vercel (frontend), Supabase free tier (backend)

## Prerequisites

- Node.js 18+ and yarn
- Supabase account (free tier)
- PostgreSQL database (via Supabase)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd betterDays
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Database
   DATABASE_URL=your_database_connection_string

   # Next.js
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Enable Email/Password authentication
   - Get your Supabase URL and anon key from Settings > API
   - Get your database connection string from Settings > Database

5. **Set up the database**
   ```bash
   # Generate Prisma client
   yarn db:generate

   # Push schema to database
   yarn db:push

   # (Optional) Run migrations
   yarn db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   # Note: You need to create at least one user through Supabase Auth first
   yarn db:seed
   ```

7. **Run the development server**
   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
betterDays/
├── app/
│   ├── [locale]/              # i18n locale routing
│   │   ├── dashboard/         # Dashboard page
│   │   ├── history/           # History page
│   │   ├── challenges/        # Challenges pages
│   │   └── join/              # Join challenge page
│   ├── login/                 # Login/signup page
│   ├── actions/               # Server actions
│   └── layout.tsx
├── components/
│   ├── auth/                  # Authentication components
│   ├── dashboard/             # Dashboard components
│   ├── challenges/            # Challenge components
│   ├── history/               # History components
│   └── Navigation.tsx
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── prisma/                 # Prisma client
│   ├── i18n/                   # i18n configuration
│   ├── date-utils.ts           # Date utilities
│   └── streak-utils.ts         # Streak calculation
├── messages/                   # i18n message files
│   ├── en.json
│   └── pt-BR.json
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
└── public/
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn db:generate` - Generate Prisma client
- `yarn db:push` - Push schema to database
- `yarn db:migrate` - Run database migrations
- `yarn db:seed` - Seed the database

## Testing

Tests are co-located with components:
- `Component.tsx` - Component file
- `Component.test.tsx` - Test file

Run tests with:
```bash
yarn test
```

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase (Backend)

The database and authentication are already hosted on Supabase. Make sure your environment variables are set correctly in Vercel.

## Key Features Implementation

### Streak Calculation
- Streaks are calculated based on confirmed days only
- Pending days don't count until confirmed
- Streak resets when a confirmed day has `consumedSugar = true`

### Pending Days
- Automatically detected when there are gaps between confirmed days
- Can be confirmed individually or in bulk
- Offline-friendly (can confirm past days)

### Challenges
- Create challenges with custom rules
- Join via invite codes
- Leaderboards sorted by confirmed streak, then best streak
- Only confirmed data affects rankings

## License

MIT

