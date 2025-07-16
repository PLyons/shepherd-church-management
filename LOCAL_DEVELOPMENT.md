# Local Development Setup with Docker

This guide sets up a local development environment using Docker and Supabase CLI for the Shepherd Church Management System.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Supabase CLI installed: `npm install -g @supabase/cli`

## Quick Start

### 1. Environment Setup

Choose your development environment:

**Option A: Local Docker Development (Recommended)**
```bash
# Copy local development environment variables
cp .env.local.development .env.local
```

**Option B: Hosted Supabase Development**
```bash
# Keep existing .env.local for hosted development
# (Current setup with hosted Supabase)
```

### 2. Start Local Development Stack

```bash
# Start Supabase local development
supabase start

# Start React development server
npm run dev
```

**Alternative: Docker Compose (if preferred)**
```bash
# Start full Docker stack
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Access Development Services

| Service | Local URL | Purpose |
|---------|-----------|---------|
| React App | http://localhost:5173 | Frontend application |
| Supabase Studio | http://localhost:54323 | Database management UI |
| Supabase API | http://localhost:54321 | Backend API |
| Database | postgresql://postgres:postgres@localhost:5432/postgres | Direct DB access |

## Development Workflow

### Daily Development
```bash
# Start development (with fresh database)
npm run dev:fresh

# Start development (with existing data)
npm run dev:local

# Reset database with fresh seed data
npm run dev:reset
```

### Database Management
```bash
# Check status
supabase status

# Reset database with migrations and seed data
supabase db reset

# Apply new migrations
supabase db push

# View database in browser
supabase studio
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Reset everything (nuclear option)
docker-compose down -v && docker-compose up -d

# View logs
docker-compose logs -f
```

## Development Features

### ✅ Automatic Database Seeding
- Fresh database gets populated with test data automatically
- Includes households, members, events, donations, sermons
- Test admin user: `admin@test.com` (password can be set in Supabase Studio)

### ✅ Hot Reload
- React app updates instantly on file changes
- Database schema changes apply via migrations
- Seed data refreshes on database reset

### ✅ Easy Testing
- Isolated local database for testing
- Quick reset capability for clean state
- No impact on production data

## Switching Between Environments

### Local Development
```bash
# Switch to local development
cp .env.local.development .env.local
supabase start
npm run dev
```

### Hosted Development
```bash
# Switch to hosted Supabase
# Restore original .env.local with hosted URLs
git checkout .env.local
npm run dev
```

## Database Schema Management

### Migrations
- All schema changes in `supabase/migrations/`
- Applied automatically on `supabase db reset`
- Version controlled and reproducible

### Seed Data
- Located in `supabase/seed.sql`
- Runs automatically after migrations
- Idempotent (can run multiple times safely)

## Troubleshooting

### Database Connection Issues
```bash
# Check if services are running
supabase status
docker-compose ps

# Reset everything
supabase stop
supabase start
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :5432  # PostgreSQL
lsof -i :54321 # Supabase API
lsof -i :54323 # Supabase Studio
```

### Environment Variables
```bash
# Verify environment variables
cat .env.local
```

## Benefits of Local Development

1. **No Network Dependency**: Work offline
2. **Fast Iterations**: No API latency
3. **Easy Testing**: Quick database resets
4. **Safe Development**: No impact on production
5. **Better Debugging**: Full control over database state
6. **Automated Seeding**: Consistent test data

## Next Steps

1. **Test the setup**: Run `supabase start && npm run dev`
2. **Verify seed data**: Check member directory has populated data
3. **Test authentication**: Login with `admin@test.com`
4. **Explore database**: Use Supabase Studio at http://localhost:54323

Your local development environment is now ready! 🚀