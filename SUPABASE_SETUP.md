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
- `profiles` table (stores user roles, admin requests, and info)
- `reports` table (stores report data)
- `pending_admin_requests` view (for admin to see requests)
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

## 7. User Roles & Admin Access

### How Admin Access Works

**🔒 Security First Approach:**
- Users **cannot** self-assign admin role during signup
- When selecting "Admin" during registration:
  - Account is created with `student` role (view-only access)
  - `requested_admin` flag is set to `true`
  - User can log in but has limited access
  - Administrator must manually approve the request

### Create First Admin User

For your very first admin user:

1. Sign up normally at `/signup`
2. Select any role (it doesn't matter for the first user)
3. In Supabase dashboard, go to **Table Editor** → **profiles**
4. Find your user row
5. Edit the columns:
   - `role` → `admin`
   - `requested_admin` → `false` (optional)
6. Save

Now you can log in with full admin privileges!

### Approve Admin Requests (For Existing Admins)

When users request admin access:

1. Log in as admin
2. Go to Supabase dashboard → **Table Editor** → **profiles**
3. Filter by `requested_admin = true` and `role != admin`
4. For each user you want to approve:
   - Change `role` from `student` to `admin`
   - Set `requested_admin` to `false`
   - Optionally set `admin_approved_at` to current timestamp
   - Save
5. User will have admin access on next login

**Optional:** Create a SQL query to see pending requests:
```sql
select email, full_name, created_at
from pending_admin_requests;
```

## 8. Verify Setup

Check that everything works:

- ✅ Can sign up new users
- ✅ Can log in
- ✅ Selecting "Admin" during signup shows warning message
- ✅ Admin-requested users get `student` role initially
- ✅ Admin users see "Create Report" option
- ✅ Manager/Student users see "View Reports" only
- ✅ Logout works correctly

## 9. Role Permissions Summary

| Role | Can View Reports | Can Create Reports | Needs Approval |
|------|-----------------|-------------------|----------------|
| **Student** | ✅ Yes | ❌ No | ❌ No |
| **Manager** | ✅ Yes | ❌ No | ❌ No |
| **Admin** | ✅ Yes | ✅ Yes | ✅ **Yes** |

**Note:** Admin role must be granted manually in Supabase dashboard.

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

### User selected Admin but has student role
- **This is correct behavior!** Admin access requires manual approval
- User will see a message explaining this during signup
- Go to Supabase Table Editor → profiles and change their role to `admin`

## Next Steps

Once authentication is working:
1. Users can request admin access during signup
2. You approve requests in Supabase dashboard
3. Start building the reports management interface
4. Implement file upload to Supabase Storage
5. Connect existing processing logic to database
6. Create reports list and detail views

## Useful Supabase Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/auth/server-side/nextjs)
