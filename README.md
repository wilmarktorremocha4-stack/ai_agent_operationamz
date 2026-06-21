# AMZ Navigator

An AI-powered Amazon seller assistant built with Next.js, Dify, and the Vercel AI SDK.

## Features

- **Dify Backend Integration**: Routes all chat traffic through your Dify agent for Amazon seller expertise
- **AI SDK Fallback**: Falls back to Vercel AI Gateway when Dify is not configured
- **Multi-model Support**: DeepSeek V3.2, Kimi K2.5 (default), GPT OSS models, Grok 4.1 Fast
- **File Export**: Export conversations as PDF, DOCX, or XLSX
- **Artifacts**: Create and edit text, code, and spreadsheet documents
- **Auth**: Guest and registered user authentication via NextAuth.js
- **Rate Limiting**: IP-based rate limiting with Redis

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Vercel AI SDK v6 + Dify SSE streaming
- **Database**: PostgreSQL via Drizzle ORM (Neon Serverless)
- **Auth**: NextAuth.js v5 beta
- **Storage**: Vercel Blob
- **Cache**: Redis (Upstash or self-hosted)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Font**: Plus Jakarta Sans
- **Brand Colors**: Navy `#030A18`, Cyan `#0E90C8`

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the required values
3. Run `pnpm install`
4. Run `pnpm db:migrate` to set up the database
5. Run `pnpm dev` to start the development server

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Dify Configuration

To use Dify as the AI backend, set:
```
DIFY_API_BASE_URL=https://<your-dify-host>/v1
DIFY_APP_API_KEY=app-xxxxxxxxxxxxxxxx
```

When these are not set, the app falls back to the Vercel AI Gateway.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wilmarktorremocha4-stack/ai_agent_operationamz)
