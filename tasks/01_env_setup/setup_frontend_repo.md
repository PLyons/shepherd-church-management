# setup_frontend_repo

## Purpose
Set up the Vite + React + TypeScript frontend codebase for the ChurchOps Suite. This project will serve as the user interface for all roles.

## Requirements
- Node.js v18+ installed
- GitHub account available
- Vite installed globally (optional)
- TailwindCSS required for styling

## Procedure
1. Create a new GitHub repository named `churchops-frontend`.
2. Clone the repository locally.
3. Initialize the project using:
   ```
   npm create vite@latest churchops-frontend -- --template react-ts
   ```
4. Change directory: `cd churchops-frontend`
5. Install dependencies: `npm install`
6. Install TailwindCSS with PostCSS and Autoprefixer:
   ```
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
7. Configure `tailwind.config.js` and update `index.css` per Tailwind setup guide.
8. Push the initialized project to GitHub.
9. Deploy to Vercel using GitHub integration.
10. Add environment variables via Vercel dashboard:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
