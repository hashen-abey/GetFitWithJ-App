# GetFitWithJ App - Complete Setup Guide

This guide provides step-by-step instructions for setting up and deploying the GetFitWithJ fitness coaching platform. All instructions use **free tier services** with strict pricing controls.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Supabase Setup (Free Tier)](#supabase-setup-free-tier)
4. [Local Development Setup](#local-development-setup)
5. [Database Migration](#database-migration)
6. [Storage Buckets Configuration](#storage-buckets-configuration)
7. [Authentication Setup](#authentication-setup)
8. [Vercel Deployment (Free Tier)](#vercel-deployment-free-tier)
9. [Post-Deployment Configuration](#post-deployment-configuration)
10. [Pricing Controls & Monitoring](#pricing-controls--monitoring)
11. [Testing Your Setup](#testing-your-setup)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- A **GitHub account** (for version control and Vercel deployment)
- A **Supabase account** (free tier) - [Sign up here](https://supabase.com/)
- A **Vercel account** (free tier) - [Sign up here](https://vercel.com/)

### Verify Prerequisites

```bash
# Check Node.js version (should be 18.x or higher)
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

---

## Project Overview

**GetFitWithJ** is a comprehensive fitness coaching platform that includes:

- **Admin Dashboard**: For trainers to manage clients, workouts, meals, and sessions
- **Client Dashboard**: For clients to view their plans, track progress, and manage payments
- **Workout Management**: Templates, assignments, and completion tracking
- **Meal Planning**: Custom meal plans with nutritional information
- **Session Scheduling**: Book and manage training sessions
- **Payment Tracking**: Receipt uploads and subscription management
- **Progress Tracking**: Body measurements and progress photos

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (Authentication, Database, Storage)
- Tailwind CSS
- Radix UI Components

---

## Supabase Setup (Free Tier)

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Organization**: Select or create an organization
   - **Project Name**: `getfitwithj` (or your preferred name)
   - **Database Password**: Create a strong password and **save it securely**
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select **"Free"** (includes everything you need)
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your API Credentials

Once your project is ready:

1. Go to **Settings** (gear icon in sidebar) → **API**
2. Copy and save the following (you'll need them later):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Project API keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` `secret` key (**keep this secret!**)

### Step 3: Understand Free Tier Limits

The Supabase free tier includes:
- ✅ **500 MB database space** (sufficient for thousands of users)
- ✅ **1 GB file storage** (for receipts and progress photos)
- ✅ **50,000 monthly active users**
- ✅ **2 GB bandwidth per month**
- ✅ **Unlimited API requests**
- ✅ Projects pause after 1 week of inactivity (but can be reactivated instantly)

**Cost Control Tip:** Your project will stay free as long as you remain within these limits. Monitor usage in the Supabase dashboard under **Settings** → **Usage**.

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/GetFitWithJ-App.git
cd GetFitWithJ-App
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

This will install all dependencies listed in `package.json`, including:
- Next.js
- Supabase client libraries
- UI components (Radix UI, Tailwind CSS)
- Form handling (React Hook Form, Zod)

### Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in your text editor and fill in your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:**
- Replace `your-project-id.supabase.co` with your actual Project URL from Supabase
- Replace `your-anon-key-here` with your `anon public` key
- Replace `your-service-role-key-here` with your `service_role secret` key
- **Never commit `.env.local` to Git** (it's already in `.gitignore`)

### Step 4: Verify Local Setup

```bash
# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the app running (though you'll get errors until the database is set up).

Press `Ctrl+C` to stop the development server.

---

## Database Migration

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **"+ New Query"**

### Step 2: Run the Database Migration

1. Open the file `supabase/migrations/001_initial_schema.sql` from your local project
2. Copy the **entire contents** of this file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter`)

You should see a success message: **"Success. No rows returned"**

### Step 3: Verify Database Tables

1. In Supabase dashboard, go to **Table Editor**
2. You should now see all the tables:
   - `profiles`
   - `workout_templates`
   - `workout_template_exercises`
   - `workout_assignments`
   - `workout_assignment_exercises`
   - `workout_completions`
   - `meal_plans`
   - `meal_plan_days`
   - `meal_plan_items`
   - `meal_assignments`
   - `sessions`
   - `payments`
   - `progress_logs`
   - `app_settings`

### Step 4: Verify Row Level Security (RLS)

The migration file includes Row Level Security policies to ensure users can only access their own data.

1. Go to **Authentication** → **Policies** in the Supabase dashboard
2. Verify that RLS is enabled on all tables
3. Check that policies exist for each table

**Security Note:** RLS ensures that:
- Clients can only see their own data
- Admins (trainers) can access all data
- Unauthenticated users have no access

---

## Storage Buckets Configuration

The app requires two storage buckets for file uploads.

### Step 1: Create Storage Buckets

1. In Supabase dashboard, go to **Storage**
2. Click **"Create a new bucket"**

#### Bucket 1: Payment Receipts

- **Name**: `receipts`
- **Public bucket**: ❌ **No** (keep private)
- **Allowed MIME types**: `image/*,application/pdf`
- **File size limit**: `5 MB` (sufficient for receipt scans)
- Click **"Create bucket"**

#### Bucket 2: Progress Photos

- **Name**: `progress-photos`
- **Public bucket**: ❌ **No** (keep private)
- **Allowed MIME types**: `image/*`
- **File size limit**: `5 MB`
- Click **"Create bucket"**

### Step 2: Configure Storage Policies

For each bucket, you need to set up access policies:

1. Click on the bucket name
2. Go to **Policies** tab
3. Click **"New Policy"**

#### Policy for `receipts` bucket:

**Insert Policy:**
```sql
-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Select Policy:**
```sql
-- Allow users to view their own receipts, admins can view all
CREATE POLICY "Users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);
```

#### Policy for `progress-photos` bucket:

**Insert Policy:**
```sql
-- Allow authenticated users to upload their own progress photos
CREATE POLICY "Users can upload progress photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Select Policy:**
```sql
-- Allow users to view their own photos, admins can view all
CREATE POLICY "Users can view progress photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);
```

### Step 3: Test Storage Access

1. Run your app locally: `npm run dev`
2. Create a test user and try uploading a file
3. Verify the file appears in the Supabase Storage dashboard

---

## Authentication Setup

### Step 1: Configure Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email settings:
   - **Enable Email Confirmations**: ✅ Recommended for production
   - **Secure Email Change**: ✅ Enabled
   - **Secure Password Change**: ✅ Enabled

### Step 2: Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirmation email
   - Password reset email
   - Magic link email

**Free Tier Note:** Supabase sends emails from their domain on the free tier. For custom domain emails, you'll need a paid plan or configure your own SMTP server.

### Step 3: Set URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Add your URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add both:
     - `http://localhost:3000/**`
     - `https://your-app.vercel.app/**` (after Vercel deployment)

### Step 4: Create Your First Admin User

1. Run your local development server: `npm run dev`
2. Visit [http://localhost:3000/login](http://localhost:3000/login)
3. Create an account with your email
4. Check your email for confirmation link
5. After confirming, manually set your role to `admin`:

```sql
-- Run this in Supabase SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

---

## Vercel Deployment (Free Tier)

### Step 1: Push Code to GitHub

```bash
# If you haven't already, initialize git and push to GitHub
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - Select your repository from the list
   - Click **"Import"**

### Step 3: Configure Environment Variables

In the Vercel import dialog:

1. Click **"Environment Variables"**
2. Add the following variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role secret key |

3. Click **"Deploy"**

### Step 4: Wait for Deployment

Vercel will:
1. Install dependencies
2. Build your Next.js app
3. Deploy to production

This takes 2-3 minutes. You'll get a deployment URL like `https://your-app.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to update DNS records

**Free Tier Note:** Custom domains are free on Vercel! You just need to own the domain.

### Step 6: Understand Vercel Free Tier Limits

The Vercel free tier (Hobby) includes:
- ✅ **Unlimited deployments**
- ✅ **100 GB bandwidth per month**
- ✅ **100 hours of serverless function execution**
- ✅ **Automatic HTTPS**
- ✅ **Preview deployments for every git push**
- ⚠️ **No commercial usage** (for personal/hobby projects only)

**For commercial use:** Upgrade to Vercel Pro ($20/month) when you start charging clients.

---

## Post-Deployment Configuration

### Step 1: Update Supabase Redirect URLs

1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel deployment URL to **Redirect URLs**:
   - `https://your-app.vercel.app/**`

### Step 2: Test Production Deployment

1. Visit your Vercel URL
2. Try to sign up/login
3. Verify email delivery
4. Test file uploads
5. Create test workout and meal plans

### Step 3: Set Up Continuous Deployment

Vercel automatically deploys on every push to your main branch:

```bash
# Make a change and push
git add .
git commit -m "Update feature"
git push
```

Vercel will automatically build and deploy the changes.

---

## Pricing Controls & Monitoring

### Supabase Cost Monitoring

1. **Set Up Usage Alerts:**
   - Go to **Settings** → **Usage**
   - Monitor database size, storage, and bandwidth
   - Upgrade if you approach limits (starting at $25/month for Pro)

2. **Database Size Management:**
   - Regularly clean up old data
   - Compress images before upload
   - Use appropriate data types (don't store large files in database)

3. **Storage Optimization:**
   - Limit file upload sizes (currently set to 5 MB)
   - Compress images client-side before upload
   - Delete old files when no longer needed

4. **Bandwidth Optimization:**
   - Use CDN for static assets
   - Enable Supabase's image optimization
   - Implement pagination for large data sets

### Vercel Cost Monitoring

1. **Check Usage:**
   - Go to Vercel dashboard → **Settings** → **Usage**
   - Monitor bandwidth and function execution time

2. **Optimize Performance:**
   - Use Next.js Image optimization
   - Implement ISR (Incremental Static Regeneration) where possible
   - Minimize API calls
   - Use client-side caching

3. **Prevent Overage:**
   - Set up Vercel usage alerts
   - Monitor analytics for unusual traffic spikes
   - Implement rate limiting for API routes

### Free Tier Checklist

✅ **Supabase Free Tier:**
- Database: < 500 MB
- Storage: < 1 GB
- Bandwidth: < 2 GB/month
- Active users: < 50,000/month

✅ **Vercel Free Tier:**
- Bandwidth: < 100 GB/month
- Function execution: < 100 hours/month
- Personal/hobby use only

**Upgrade Path:**
- **Supabase Pro**: $25/month (8 GB database, 100 GB storage)
- **Vercel Pro**: $20/month (commercial use, more bandwidth)

---

## Testing Your Setup

### Local Development Tests

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Start production server locally
npm run start
```

All commands should complete without errors.

### Feature Testing Checklist

- [ ] **Authentication**
  - [ ] Sign up with email
  - [ ] Receive confirmation email
  - [ ] Log in/out
  - [ ] Password reset flow

- [ ] **Admin Features**
  - [ ] Create client profile
  - [ ] Create workout template
  - [ ] Assign workout to client
  - [ ] Create meal plan
  - [ ] Schedule training session
  - [ ] Review payment receipts

- [ ] **Client Features**
  - [ ] View assigned workouts
  - [ ] Mark workout as complete
  - [ ] View meal plan
  - [ ] Upload payment receipt
  - [ ] Log progress (measurements, photos)
  - [ ] View upcoming sessions

- [ ] **File Uploads**
  - [ ] Upload receipt (< 5 MB)
  - [ ] Upload progress photo (< 5 MB)
  - [ ] View uploaded files

---

## Troubleshooting

### Common Issues

#### 1. "Error: Invalid JWT" or "User not found"

**Solution:**
- Verify environment variables are set correctly
- Check that you're using the correct Supabase project
- Clear browser cookies and try logging in again

#### 2. "Storage bucket not found"

**Solution:**
- Verify buckets are created in Supabase Storage
- Check bucket names match exactly: `receipts` and `progress-photos`
- Ensure storage policies are configured

#### 3. "Permission denied" when uploading files

**Solution:**
- Check RLS policies on storage buckets
- Verify user is authenticated
- Ensure file path follows pattern: `bucket-name/user-id/filename`

#### 4. "Cannot read properties of null"

**Solution:**
- Check that database migration ran successfully
- Verify all tables exist in Supabase Table Editor
- Ensure user profile was created in `profiles` table

#### 5. Build fails on Vercel

**Solution:**
- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Ensure environment variables are set in Vercel
- Try building locally: `npm run build`

#### 6. Emails not being delivered

**Solution:**
- Check spam folder
- Verify email settings in Supabase → Authentication → Settings
- For production, consider setting up custom SMTP
- Check email rate limits (free tier: 4 emails/hour)

### Getting Help

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **GitHub Issues**: Create an issue in your repository

---

## Next Steps

Once your setup is complete:

1. **Customize Branding:**
   - Update app name and logo
   - Customize color scheme in `tailwind.config.ts`
   - Add your business information

2. **Set Up Analytics:**
   - Add Vercel Analytics (free on Pro plan)
   - Implement custom event tracking
   - Monitor user behavior

3. **Implement Backup Strategy:**
   - Regular database backups (Supabase daily backups on Pro)
   - Export important data periodically
   - Document recovery procedures

4. **Security Hardening:**
   - Enable 2FA on Supabase and Vercel accounts
   - Review and test all RLS policies
   - Implement rate limiting
   - Add CAPTCHA for signup

5. **Performance Optimization:**
   - Analyze Core Web Vitals
   - Optimize images
   - Implement caching strategies
   - Monitor performance with Vercel Analytics

6. **Scale Preparation:**
   - Plan upgrade path to paid tiers
   - Set up monitoring and alerts
   - Document scaling thresholds
   - Prepare for increased traffic

---

## Cost Estimate for Scaling

### Starting Out (0-50 users)
- **Cost**: $0/month (Free tier)
- **Services**: Supabase Free + Vercel Hobby

### Growing (50-500 users)
- **Cost**: ~$45/month
- **Services**:
  - Supabase Pro: $25/month
  - Vercel Pro: $20/month

### Established (500-5000 users)
- **Cost**: ~$100-200/month
- **Services**:
  - Supabase Pro or Team: $25-599/month
  - Vercel Pro or Enterprise: $20+/month
  - Consider dedicated database

**Note:** These are estimates. Actual costs depend on usage patterns, file storage, and feature usage.

---

## Conclusion

You now have a fully functional fitness coaching platform running on free tier services!

**Remember:**
- Monitor usage regularly
- Keep dependencies updated
- Back up your data
- Plan for scaling before hitting limits

**Happy coaching!** 💪
