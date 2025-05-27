# Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. "Configuration error" or "Invalid client_id"

**Symptoms:**
- Error during Google sign-in
- "Configuration error" message
- OAuth consent screen not showing

**Solutions:**
1. **Check environment variables:**
   ```bash
   # Verify these are set in .env.local
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Verify Google Cloud Console setup:**
   - Ensure OAuth 2.0 client is created
   - Check redirect URIs are correct:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

3. **Restart development server:**
   ```bash
   pnpm dev
   ```

### 2. "Access blocked" or "redirect_uri_mismatch"

**Symptoms:**
- Google shows "Access blocked" error
- "redirect_uri_mismatch" error in browser

**Solutions:**
1. **Check redirect URIs in Google Cloud Console:**
   - Go to APIs & Services > Credentials
   - Edit your OAuth 2.0 client
   - Ensure redirect URIs exactly match:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

2. **Verify NEXTAUTH_URL:**
   ```env
   # Development
   NEXTAUTH_URL=http://localhost:3000
   
   # Production
   NEXTAUTH_URL=https://yourdomain.com
   ```

### 3. Database Connection Issues

**Symptoms:**
- "Database connection failed"
- User creation errors
- Session persistence issues

**Solutions:**
1. **Check DATABASE_URL format:**
   ```env
   # PostgreSQL format
   DATABASE_URL=postgresql://username:password@localhost:5432/database
   
   # Neon/Supabase format
   DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
   ```

2. **Update database schema:**
   ```bash
   pnpm run db:generate
   pnpm run db:push
   ```

3. **Test database connection:**
   ```bash
   pnpm run db:studio
   ```

### 4. Session/Authentication State Issues

**Symptoms:**
- User appears signed in but can't access protected features
- Session not persisting between page reloads
- "Not authorized" errors

**Solutions:**
1. **Clear browser storage:**
   - Open Developer Tools (F12)
   - Go to Application tab
   - Clear all storage for localhost:3000

2. **Check NEXTAUTH_SECRET:**
   ```bash
   # Generate a new secret
   openssl rand -base64 32
   ```
   Add to `.env.local`:
   ```env
   NEXTAUTH_SECRET=generated-secret-here
   ```

3. **Verify session configuration:**
   - Ensure JWT strategy is being used
   - Check callback functions in NextAuth config

### 5. Development vs Production Issues

**Symptoms:**
- Works in development but fails in production
- OAuth errors only in deployed version

**Solutions:**
1. **Update Google Cloud Console for production:**
   - Add production redirect URI
   - Update authorized domains
   - Verify OAuth consent screen settings

2. **Set production environment variables:**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=your-production-secret
   ```

3. **Check HTTPS requirements:**
   - Google OAuth requires HTTPS in production
   - Ensure your domain has SSL certificate

### 6. API Keys and Limits

**Symptoms:**
- Quota exceeded errors
- API key not working
- Rate limiting issues

**Solutions:**
1. **Check Google Cloud Console quotas:**
   - Go to APIs & Services > Quotas
   - Monitor API usage
   - Request quota increases if needed

2. **Verify API keys:**
   ```env
   # Separate keys for different services
   GOOGLE_API_KEY=your-gemini-api-key
   GOOGLE_CLIENT_ID=your-oauth-client-id
   ```

## Debug Mode

Enable debug mode to get more detailed logs:

```env
# Add to .env.local
NEXTAUTH_DEBUG=true
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## Still Having Issues?

1. **Check the logs:**
   - Browser developer console
   - Terminal/server logs
   - Vercel function logs (if deployed)

2. **Verify all setup steps:**
   - Review [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)
   - Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

3. **Test with a fresh setup:**
   - Create a new Google Cloud project
   - Use a different browser/incognito mode
   - Test with a different Google account

4. **Common environment file:**
   ```env
   # Complete .env.local example
   NEXTAUTH_SECRET=abc123xyz789
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
   DATABASE_URL=postgresql://user:pass@localhost:5432/earthai
   GOOGLE_API_KEY=AIzaSyAbc123DefGhi456Jkl
   ```

Remember to restart your development server after making environment changes!
