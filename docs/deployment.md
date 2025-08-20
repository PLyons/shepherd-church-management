# Deployment Guide - Shepherd Church Management System

**Last Updated:** 2025-08-20  
**Stack:** React + Firebase + Vercel  

## Overview
Complete deployment instructions for the Shepherd Church Management System using Firebase backend and Vercel frontend hosting.

## Prerequisites
- Firebase account (free tier sufficient for development)
- Vercel account
- GitHub repository access
- Node.js 18+ for local development

---

## Firebase Backend Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Follow the setup wizard:
   - Project name: `shepherd-cms-[your-suffix]`
   - Enable Google Analytics (optional)
   - Choose default account

### 2. Enable Firebase Services

#### Authentication
1. Go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable the following providers:
   - **Email/Password** - Enable
   - **Email link (passwordless sign-in)** - Enable
4. Configure **Authorized domains** (add your production domain)

#### Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode** (we'll use security rules)
3. Select a location (choose closest to your users)
4. Database will be created

#### Firebase Storage
1. Go to **Storage** → **Get started**
2. Choose **Start in production mode**
3. Select same location as Firestore
4. Storage bucket will be created

### 3. Deploy Security Rules

#### Firestore Rules
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

#### Storage Rules (if using file uploads)
```bash
# Deploy storage security rules  
firebase deploy --only storage
```

### 4. Get Firebase Configuration
1. Go to **Project settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register your app name: `shepherd-cms`
5. Copy the configuration object

---

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Import Git Repository**
3. Select your Shepherd CMS repository
4. Choose **Import**

### 2. Configure Build Settings
Vercel should auto-detect Vite settings:
- **Framework Preset:** Vite
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build`
- **Output Directory:** `dist` (default)
- **Install Command:** `npm install`

### 3. Environment Variables
Add these in Vercel project settings → **Environment Variables**:

```bash
# Firebase Configuration (from step 4 above)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: Feature flags
VITE_USE_FIREBASE=true
```

### 4. Deploy
1. Click **Deploy** 
2. Vercel will build and deploy automatically
3. Get your deployment URL from Vercel dashboard

---

## Post-Deployment Setup

### 1. Initialize Database with Seed Data
```bash
# Run locally to seed your Firebase database
npm run seed
```

### 2. Create Admin User
```bash
# Create your first admin user
npm run setup-admin
```

### 3. Configure Firebase Authentication Domain
1. Go to Firebase Console → **Authentication** → **Settings**
2. Add your Vercel domain to **Authorized domains**:
   - `your-project.vercel.app`
   - Your custom domain (if applicable)

### 4. Test Deployment
1. Visit your deployed URL
2. Test user registration/login
3. Verify admin dashboard access
4. Test member management features

---

## Production Configuration

### Domain Setup (Optional)
1. **Vercel Custom Domain:**
   - Go to Vercel project → **Settings** → **Domains**
   - Add your custom domain
   - Configure DNS records as instructed

2. **Firebase Custom Domain:**
   - Add custom domain to Firebase Auth authorized domains
   - Update CORS settings if needed

### SSL/HTTPS
- Vercel provides SSL automatically
- Firebase handles HTTPS for all services

### Performance Optimization
```bash
# Build with optimizations
npm run build

# Analyze bundle size
npm run build -- --analyze
```

---

## Maintenance & Updates

### Environment Updates
- Use different Firebase projects for staging/production
- Create staging Vercel deployment for testing

### Database Backups
- Firebase automatic backups (varies by plan)
- Export data manually via Firebase Console

### Monitoring
- Monitor deployment status in Vercel dashboard
- Check Firebase usage in Firebase Console
- Review error logs in both platforms

---

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Firebase Connection Issues:**
- Verify all environment variables are set correctly
- Check Firebase project ID matches configuration
- Ensure services are enabled in Firebase Console

**Authentication Issues:**
- Verify domain is added to Firebase Auth authorized domains
- Check that Email/Password and Email Link are both enabled
- Test authentication locally first

**Deployment Not Updating:**
- Clear Vercel build cache in project settings
- Redeploy manually from Vercel dashboard

### Getting Help
- Firebase Documentation: https://firebase.google.com/docs
- Vercel Documentation: https://vercel.com/docs
- Project Issues: [GitHub Issues Page]

---

## Security Considerations

1. **Never commit Firebase config** to public repositories
2. **Use environment variables** for all sensitive configuration
3. **Review Firebase security rules** regularly
4. **Monitor Firebase usage** to prevent quota exceeded
5. **Keep dependencies updated** for security patches

---

## Cost Estimates

### Firebase (Free Tier Limits)
- **Firestore:** 50K reads, 20K writes per day
- **Authentication:** Unlimited
- **Storage:** 5GB total, 1GB per day bandwidth
- **Hosting:** 10GB storage, 360MB per day bandwidth

### Vercel (Hobby Plan - Free)
- **Bandwidth:** 100GB per month
- **Builds:** 6000 minutes per month
- **Serverless Functions:** 12 seconds execution per month

For production use, consider upgrading to paid tiers for better limits and support.