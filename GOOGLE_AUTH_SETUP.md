# Google Authentication Setup Guide

## Prerequisites

Before you can use Google authentication, you need to set up a Google OAuth application in the Google Cloud Console.

## Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`

4. **Get Client ID and Secret**
   - Copy the Client ID and Client Secret

## Environment Variables

Update your `.env.local` file with the following variables:

```env
# NextAuth.js
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Database
DATABASE_URL=your-database-url-here

# Google AI (Existing)
GOOGLE_API_KEY=your-google-api-key-here
```

## Database Schema Changes

The authentication system has been updated to support both credential-based and OAuth users:

- The `password` field in the `users` table is now nullable
- Google OAuth users will have `null` for their password field
- Credential users continue to have hashed passwords

## Features Implemented

### 1. Google OAuth Provider
- Added Google provider to NextAuth configuration
- Handles user creation for new Google users
- Maintains existing credential authentication

### 2. Updated Auth Views

#### Login Page (`/auth/login`)
- Added "Sign in with Google" button
- Maintains existing email/password form
- Clean separation between auth methods

#### Register Page (`/auth/register`)
- Added "Sign up with Google" button
- Maintains existing registration form

#### Auth Modal (Chat Window)
- Added Google sign-in buttons to both login and register modes
- Consistent styling with the rest of the application

### 3. Chat Window Integration
- Unauthenticated users see a clean auth prompt
- Google and credential users have the same experience once authenticated
- Seamless integration with existing chat functionality

## Security Features

- OAuth users cannot use credential login (password is null)
- Existing credential users are unaffected
- Proper session management via NextAuth
- JWT-based sessions for scalability

## Usage

1. **For New Users**
   - Can sign up with Google or create a credential account
   - Google users are automatically created in the database

2. **For Existing Users**
   - Credential users continue to use email/password
   - Can't mix authentication methods for the same email

3. **In the Chat Interface**
   - Unauthenticated users see a clean sign-in prompt
   - One-click Google authentication
   - Seamless transition to chat functionality

## Testing

1. **Development Testing**
   - Set up Google OAuth with localhost redirect
   - Test both Google and credential authentication
   - Verify chat functionality works for both user types

2. **Production Deployment**
   - Update Google OAuth redirect URIs for production domain
   - Set production environment variables
   - Test authentication flows

## Troubleshooting

### Common Issues

1. **"Configuration error"**
   - Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
   - Verify redirect URIs in Google Console match your domain

2. **Database errors**
   - Ensure the users table allows NULL passwords
   - Run database migrations if needed

3. **Session issues**
   - Check NEXTAUTH_SECRET is set and consistent
   - Verify NEXTAUTH_URL matches your domain

### Debug Mode

Enable NextAuth debug mode by adding to `.env.local`:
```env
NEXTAUTH_DEBUG=true
```
