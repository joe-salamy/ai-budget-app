# AI Budget App

A personal finance management application with AI-powered transaction categorization and an intelligent chatbot assistant.

## Features

- 💰 Track accounts, categories, and transactions
- 🤖 AI-powered transaction categorization (Google Gemini)
- 📊 Interactive dashboards with visualizations
- 💬 AI chatbot assistant for financial insights
- 🎯 Budget goals and savings tracking
- 📈 Financial health score
- 🌙 Dark mode design

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **AI**: Google Gemini 2.5 Flash
- **Hosting**: Vercel
- **Charts**: Recharts + Nivo

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))
- A Google AI API key for Gemini ([get one here](https://ai.google.dev))

### Installation

1. **Clone the repository**:

```bash
git clone <your-repo-url>
cd ai-budget-app
```

2. **Install dependencies**:

```bash
npm install
```

3. **Set up Supabase**:

Follow the comprehensive guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:

- Create your Supabase project
- Run database migrations
- Configure authentication

4. **Configure environment variables**:

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

5. **Start the development server**:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Project Structure

```
ai-budget-app/
├── api/                      # Vercel serverless functions
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   └── features/        # Feature-specific components
│   ├── config/              # App configuration and constants
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and Supabase client
│   ├── pages/               # Page components
│   ├── services/            # API service functions
│   └── types/               # TypeScript type definitions
├── supabase/
│   └── migrations/          # Database migration files
├── SUPABASE_SETUP.md        # Supabase setup guide
└── plan.md                  # Comprehensive development plan
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- **ESLint**: Configured for React + TypeScript
- **Prettier**: Auto-formatting on save (configure in your editor)
- **Tailwind CSS**: Utility-first styling

## Documentation

- [Development Plan](plan.md) - Complete project roadmap with 12 phases
- [Supabase Setup Guide](SUPABASE_SETUP.md) - Database setup instructions
- [Progress Tracking](progress.md) - Current development status

## Project Status

✅ **Phase 0**: Project Setup & Infrastructure
✅ **Phase 1**: Database Schema & Backend Setup
🚧 **Phase 2**: Authentication & User Management (Next)

See [progress.md](progress.md) for detailed status.

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please open an issue to discuss proposed changes.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:

- Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup troubleshooting
- Review [plan.md](plan.md) for feature documentation
- Open a GitHub issue for bugs or feature requests
