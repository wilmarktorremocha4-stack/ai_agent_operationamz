# AMZ Navigator

AMZ Navigator is an AI-powered chatbot for Amazon sellers, built on the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template.

## Features

- **Dify Integration**: Routes chat traffic through your Dify agent when configured
- **Multi-model support**: Switch between DeepSeek, Kimi, GPT, and Grok models
- **File exports**: Export conversations as PDF, DOCX, or XLSX
- **Artifact system**: Create and edit code, text, and spreadsheet artifacts
- **Authentication**: Email/password and guest login via NextAuth
- **Chat history**: Paginated sidebar with date grouping

## Setup

1. Copy `.env.example` to `.env.local` and fill in your values
2. Install dependencies: `pnpm install`
3. Run migrations: `pnpm db:migrate`
4. Start the dev server: `pnpm dev`

## Environment Variables

See `.env.example` for all required and optional environment variables.

## Tech Stack

- Next.js 16 (App Router)
- AI SDK v6
- Drizzle ORM + PostgreSQL
- Vercel Blob
- NextAuth v5
- shadcn/ui + Tailwind CSS v4
