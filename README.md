# Next.js Boilerplate

A production-ready starter template featuring:

*   **Framework**: Next.js 15 (App Router)
*   **Auth**: Supabase Auth (SSR + Middleware protection)
*   **Database**: Lowdb (Local JSON database)
*   **UI**: Tailwind CSS + Shadcn/UI
*   **Deployment**: Docker & Docker Compose ready

## Features

*   **Authentication**: Complete user management (Login, Register, Admin roles).
*   **Admin Dashboard**: User management interface included.
*   **Secure**: Middleware protection for private routes.
*   **Persistance**: Data stored in `data/storage/db.json` via Docker volumes.

## Getting Started

### Prerequisites

*   Docker & Docker Compose
*   Node.js (for local dev without Docker)

### Environment Setup

Copy `.env.example` to `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Running with Docker

```bash
docker compose up -d
```

Access the app at [http://localhost:3000](http://localhost:3000).

### Project Structure

*   `src/app`: Application routes and pages.
*   `src/components`: Reusable UI components.
*   `src/lib`: Core libraries (Database, Supabase client).
*   `src/app/actions`: Server actions for data mutation.
*   `data`: persistent storage location.