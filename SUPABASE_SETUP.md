# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: report-builder (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
4. Click "Create new project" and wait for setup to complete

## 2. Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## 3. Configure Environment Variables

1. Create a `.env.local` file in the project root:
   ```bash
   cp env.example .env.local
   ```

2. Fill in the values you copied:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` and paste it into the editor
4. Click "Run" to execute the SQL

This will create:
- `profiles` table (stores user roles and info)
- `reports` table (stores report data)
- Row Level Security (RLS) policies
- Automatic triggers for profile creation

## 5. Configure Email Settings (Optional)

By default, Supabase requires email confirmation for new signups.

**To disable email confirmation** (for development):
1. Go to **Authentication** → **Providers** → **Email**
2. Disable "Confirm email"
3. Click "Save"

**To customize email templates**:
1. Go to **Authentication** → **Email Templates**
2. Customize the templates as needed

## 6. Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Try creating an account at `/signup`

## 7. Create First Admin User

After signing up your first user, you need to manually set their role to 'admin':

1. In Supabase dashboard, go to **Table Editor** → **profiles**
2. Find your user row
3. Edit the `role` column to `admin`
4. Save

Now you can log in with admin privileges!

## 8. Verify Setup

Check that everything works:

- ✅ Can sign up new users
- ✅ Can log in
- ✅ Admin users see "Create Report" option
- ✅ Manager/Student users see "View Reports" only
- ✅ Logout works correctly

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Make sure there are no quotes around the values
- Restart your dev server after changing env variables

### Email confirmation required
- Go to Authentication → Providers → Email
- Disable "Confirm email" for development
- Or check your email inbox for confirmation link

### Users can't access protected routes
- Make sure you ran the database migrations
- Check that the `profiles` table exists
- Verify RLS policies are enabled

### Role-based access not working
- Make sure user has a role set in the `profiles` table
- Check browser console for errors
- Verify middleware is running correctly

## Next Steps

Once authentication is working:
1. Start building the reports management interface
2. Implement file upload to Supabase Storage
3. Connect existing processing logic to database
4. Create reports list and detail views

## Useful Supabase Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/auth/server-side/nextjs)

