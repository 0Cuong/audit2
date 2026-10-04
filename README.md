# CUONGISME

CUONGISME is a Vite + React + TypeScript relationship and memory web app.

## Development

    npm install
    npm run typecheck
    npm run build
    npm run dev

## Production stack

React/Vite is served as Cloudflare Worker Assets. Application data is stored in D1 and media in R2. The original Supabase migrations remain in supabase/migrations/ for recovery reference.

## Data recovery

Never reset, truncate, or delete the original Supabase project before migration is independently verified. The migration script fails on source-read, object-read, or target-import errors instead of reporting a false success.
