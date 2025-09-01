# Authentication & User Management Setup

## Overview
This application now includes a complete authentication and user management system using Supabase with the following features:

- **Real Authentication**: Google OAuth and email/password login
- **Role-Based Access Control**: Super Admin, Admin, Manager, Viewer roles
- **User Management Dashboard**: Admin interface for managing users and permissions
- **Protected Routes**: Route-level protection based on user roles
- **User Approval System**: New users require admin approval

## Setup Instructions

### 1. Supabase Configuration

You need to connect your Lovable project to Supabase:

1. Click the green Supabase button in the top right of the Lovable interface
2. Follow the setup process to connect to your Supabase project
3. Get your project URL and anon key from Supabase Settings > API

### 2. Environment Variables

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL script in `src/lib/database.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `src/lib/database.sql`
4. Execute the script

This will create:
- `profiles` table for user data
- `permissions` table for role-based permissions
- RLS policies for security
- Automatic user profile creation on signup

### 4. Configure Google OAuth (Optional)

To enable Google login:

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `https://your-domain.com/auth/callback`

### 5. Create First Admin User

After setting up the database:

1. Sign up with your email or Google account
2. Go to Supabase Dashboard > Table Editor > profiles
3. Find your user record and change `role` to `'super_admin'`
4. Set `is_approved` to `true`

## User Roles & Permissions

### Super Admin
- Full system access
- Can manage all users and their roles
- Can approve/reject new users
- Access to all features and data

### Admin
- Can view and manage users (except super admins)
- Full property management access
- Can create and view reports
- Can manage alerts

### Manager
- Can create, view, and update properties
- Can view reports
- Can view and update alerts
- Limited user access

### Viewer
- Read-only access to properties
- Can view reports
- Can view alerts
- No editing capabilities

## Features

### Authentication
- **Login Methods**: Email/password and Google OAuth
- **Session Management**: Automatic token refresh and persistent sessions
- **Password Reset**: Email-based password recovery
- **Secure Logout**: Proper session cleanup

### User Management (Admin Only)
- **Invite Users**: Send invitations with predefined roles
- **Approve/Reject**: Control who can access the system
- **Role Management**: Change user roles and permissions
- **User Overview**: View all users and their status

### Route Protection
- **Authentication Required**: All routes require login
- **Role-Based Access**: Certain routes require specific roles
- **Approval Required**: Users must be approved to access the system
- **Graceful Redirects**: Automatic redirects for unauthorized access

## Security Features

- **Row Level Security (RLS)**: Database-level security policies
- **Role-Based Permissions**: Granular permission system
- **Secure API**: All API calls are authenticated
- **Session Validation**: Real-time session validation
- **Audit Trail**: User activity logging

## Usage

### For End Users
1. Visit the application
2. Click "Sign In with Google" or use email/password
3. Wait for admin approval if you're a new user
4. Access features based on your assigned role

### For Administrators
1. Log in with admin/super admin account
2. Navigate to "Users" in the top navigation
3. Invite new users by email
4. Approve pending users
5. Manage user roles as needed

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env.local` file exists with correct variables
   - Check that variable names match exactly

2. **"User not approved"**
   - Admin needs to approve the user in the user management dashboard
   - Check the `is_approved` field in the profiles table

3. **"Permission denied"**
   - User doesn't have the required role for the route
   - Check user role in the profiles table

4. **Google OAuth not working**
   - Verify Google OAuth is configured in Supabase
   - Check redirect URLs are correct
   - Ensure Google credentials are valid

### Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure the database script was executed successfully
4. Check that your user has the correct role and approval status

## Development Notes

- The authentication context is available throughout the app via `useAuth()` hook
- Protected routes automatically check authentication and permissions
- User profile data is cached and automatically refreshed
- All database operations include proper error handling and logging