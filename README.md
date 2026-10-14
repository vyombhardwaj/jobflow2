# JobFlow

JobFlow helps organize applications, interviews, contacts, and follow-ups in one workspace. Optional AI tools can review a job description before suggesting an application and estimate a resume match against a role.

## Features

- Application pipeline, contacts, interview scheduler, and job-search analytics
- AI-assisted job-description review and resume-match estimates
- Review suggested application details before saving
- Dark Liquid Glass interface with responsive layouts and interactive 3D illustrations
- Password-based accounts with email verification

## Tech stack

- Next.js 14 and TypeScript
- SQLite with Prisma ORM
- NextAuth credentials authentication
- Google Gemini API for AI features
- Three.js for interactive 3D scenes

## Local setup

```bash
npm install
cp .env.example .env.local
npx prisma db push
npm run dev
```

Set `NEXTAUTH_SECRET` in `.env.local`. Add `GEMINI_API_KEY` to use the AI tools.

### Optional local demo account

Demo access is disabled by default and is rejected in production. For your private local workspace only, set these values in the ignored `.env.local` file:

```dotenv
ALLOW_DEMO_LOGIN=true
DEMO_ACCOUNT_PASSWORD=choose-a-local-demo-password
```

Then provision the demo account and its sample applications, interview, contact, and notes:

```bash
npm run db:seed
```

Sign in locally with `demo@example.com` and the password you set in `.env.local`. Never put demo credentials in public pages, tracked files, or production configuration.
