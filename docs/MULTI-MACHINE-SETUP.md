# Multi-Machine Development Setup Guide

**Last Updated:** 2025-08-22  
**Status:** Current  
**Audience:** Developers  

This guide explains how to work on the Shepherd project from multiple machines (desktop and laptop) safely and efficiently.

## Overview

The Shepherd project uses Git and GitHub for version control, allowing you to work seamlessly across multiple machines without data corruption or conflicts.

## Initial Setup for New Machine (Laptop)

### Prerequisites
- Git installed
- Node.js and npm installed
- GitHub account access
- (Optional) Claude Code CLI for MCP servers

### Step 1: Clone the Repository
```bash
# Navigate to your desired project directory
cd ~/Documents/Dev/

# Clone the repository
git clone https://github.com/PLyons/shepherd-church-management.git

# Enter the project directory
cd shepherd-church-management
```

### Step 2: Install Dependencies
```bash
# Install all npm dependencies
npm install

# Verify installation
npm run dev --help
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
# Add your Firebase configuration
# Never commit .env files to Git
```

**Required Environment Variables:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Step 4: Verify Setup
```bash
# Start development server
npm run dev

# In another terminal, run type checking
npm run typecheck

# Run linting
npm run lint
```

### Step 5: MCP Servers Setup (Optional - For Claude Code Users)

If you use Claude Code, set up the same MCP servers as your desktop:

```bash
# Install Claude Code CLI first
# Then add MCP servers:

# Semgrep
claude mcp add semgrep -- uvx --isolated --with fastmcp==2.9.* semgrep-mcp

# Firebase
claude mcp add firebase -- npx -y firebase-tools@latest experimental:mcp

# Serena
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)

# Context7
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Playwright
claude mcp add playwright -- npx @playwright/mcp@latest

# GitHub (requires your GitHub Personal Access Token)
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer YOUR_GITHUB_TOKEN"
```

## Daily Workflow

### Before Starting Work (CRITICAL)
**Always start with this command on any machine:**
```bash
git pull origin main
```

This ensures you have the latest changes from your other machine.

### During Development
1. **Make regular commits:**
   ```bash
   git add .
   git commit -m "Descriptive message about your changes"
   ```

2. **Push frequently:**
   ```bash
   git push origin main
   ```

### Before Switching Machines (CRITICAL)
**Always end with these commands:**
```bash
# Stage all changes
git add .

# Commit (even if work is incomplete)
git commit -m "WIP: Work in progress - switching to [laptop/desktop]"

# Push to GitHub
git push origin main
```

## Common Scenarios and Solutions

### Scenario 1: Forgot to Push from Desktop
If you start working on laptop but forgot to push from desktop:

```bash
# On laptop - create a branch for your work
git checkout -b laptop-work

# Do your work and commit
git add .
git commit -m "Changes from laptop"
git push origin laptop-work

# Later on desktop - merge the branch
git fetch origin
git checkout laptop-work
git checkout main
git merge laptop-work
git push origin main

# Delete the branch
git branch -d laptop-work
git push origin --delete laptop-work
```

### Scenario 2: Merge Conflicts
If Git detects conflicts when pulling:

```bash
# Git will mark conflicts in files like this:
<<<<<<< HEAD
Your changes
=======
Changes from other machine
>>>>>>> commit-hash

# Edit files to resolve conflicts
# Remove conflict markers and choose the correct version
# Then commit the merge:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Scenario 3: Temporarily Save Work
If you need to quickly switch without committing:

```bash
# Save work temporarily
git stash

# Pull latest changes
git pull origin main

# Restore your work
git stash pop
```

## Best Practices

### 1. Commit Frequently
- Small, focused commits are easier to manage
- Commit even incomplete work with "WIP:" prefix
- Better to have too many commits than too few

### 2. Use Descriptive Commit Messages
- Good: "Add member profile activity history tab"
- Bad: "Update files"
- Use "WIP:" for work in progress

### 3. Always Pull Before Starting
- Prevents merge conflicts
- Ensures you're working with latest code
- Only takes a few seconds

### 4. Never Force Push
- Avoid `git push --force` 
- Can overwrite other machine's work
- If you need to force push, double-check first

### 5. Keep .env Files Machine-Specific
- Never commit .env files
- Each machine can have different local settings
- Always use .env.example as template

## Troubleshooting

### Problem: "Please commit your changes or stash them before you merge"
**Solution:**
```bash
git add .
git commit -m "WIP: Uncommitted changes"
git pull origin main
```

### Problem: "Your branch is behind origin/main"
**Solution:**
```bash
git pull origin main
```

### Problem: "Cannot push to origin/main"
**Solution:**
```bash
# Pull first, then push
git pull origin main
git push origin main
```

### Problem: Lost work on one machine
**Solution:**
```bash
# Check recent commits
git log --oneline -10

# Check reflog for recent actions
git reflog

# Your work is likely in a recent commit
```

## Emergency Recovery

If something goes seriously wrong:

1. **Check Git history:** `git log --oneline`
2. **Check recent actions:** `git reflog`
3. **Restore to last known good state:** `git reset --hard COMMIT_HASH`
4. **All pushed commits are safe in GitHub**
5. **Local backups:** Time Machine (Mac) or equivalent

## File Structure Considerations

### Files to Ignore (Already in .gitignore)
- `node_modules/`
- `.env`
- `dist/`
- `.DS_Store`
- Build artifacts

### Files to Always Commit
- Source code (`src/`)
- Documentation (`docs/`)
- Configuration (`package.json`, `tsconfig.json`)
- Environment template (`.env.example`)

## Security Notes

- Never commit `.env` files containing secrets
- GitHub Personal Access Tokens should be unique per machine
- Keep Firebase credentials secure
- Regularly rotate access tokens

## Advanced Tips

### Using VS Code Settings Sync
Enable VS Code Settings Sync to share:
- Extensions
- Settings
- Themes
- Keybindings

### GitHub Codespaces Alternative
For occasional laptop work, consider GitHub Codespaces:
- No local setup required
- Full development environment in browser
- Automatic sync with repository

### Branch-Based Workflow
For major features, consider:
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work and commit
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create PR on GitHub
# Merge when ready
```

## Summary Checklist

### Before Starting Work:
- [ ] `git pull origin main`
- [ ] Check `git status`

### During Work:
- [ ] Commit frequently
- [ ] Use descriptive messages
- [ ] Test changes work

### Before Switching Machines:
- [ ] `git add .`
- [ ] `git commit -m "WIP: ..."`
- [ ] `git push origin main`

**Remember: Git is designed to prevent data loss. When in doubt, commit and push!**