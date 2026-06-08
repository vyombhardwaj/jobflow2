# JobFlow – Job Application Tracker

A full-stack web application for tracking job applications, interviews, and contacts.

## Features
- **Application Pipeline** – Track every job from Wishlist → Offer with status management
- **Interview Scheduler** – Log interviews, set outcomes, track upcoming dates
- **Contact Manager** – Store recruiters and hiring managers linked to applications
- **Analytics** – Response rate, offer rate, pipeline breakdown
- **AI Assistant** – Generate cover letters and interview prep guides powered by Claude AI

## Tech Stack
- **Frontend/Backend**: Next.js 15 + TypeScript
- **Database**: SQLite via Prisma ORM
- **Auth**: NextAuth (email-based, no password for demo)
- **AI**: Anthropic Claude API

## Setup

```bash
npm install
cp .env.example .env.local
# Add ANTHROPIC_API_KEY to .env.local
npx prisma db push
npx prisma db seed
npm run dev
```

Login with `demo@example.com` (any name).
