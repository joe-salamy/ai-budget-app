# AI-Powered Budget App

A personal finance management application with AI-powered transaction categorization and an intelligent chatbot assistant.

## Quick Links

- **[Full Documentation](docs/README.md)** - Complete project documentation
- **[Setup Guide](docs/SUPABASE_SETUP.md)** - Supabase database setup instructions
- **[Project Plan](plan.md)** - Comprehensive development plan with all phases
- **[Progress Tracker](progress.md)** - Current project status and milestones

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 (dark mode)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **AI:** Google Gemini 2.5 Flash

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase (see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md))
4. Create `.env.local` from `.env.local.example`
5. Run dev server: `npm run dev`

## Project Structure

```
├── docs/          # All documentation
├── prompts/       # AI agent guidelines
├── src/           # Application source code
├── api/           # Vercel serverless functions
├── supabase/      # Database migrations
├── archive/       # Old/unused files
├── plan.md        # Development plan
└── progress.md    # Progress tracking
```

## Contributing

This is a personal project. See [docs/README.md](docs/README.md) for development guidelines.
