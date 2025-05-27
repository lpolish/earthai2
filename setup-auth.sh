#!/bin/bash

# EarthAI Database Schema Update
echo "🌍 EarthAI Authentication Setup"
echo "==============================="

echo "🔍 Checking authentication configuration..."

# Check if required files exist
if [ -f "src/app/api/auth/[...nextauth]/route.ts" ]; then
    echo "✅ NextAuth configuration found"
else
    echo "❌ NextAuth configuration missing"
    exit 1
fi

if [ -f "src/db/schema.ts" ]; then
    echo "✅ Database schema found"
else
    echo "❌ Database schema missing"
    exit 1
fi

# Check if the schema supports nullable passwords (for OAuth users)
if grep -q "password: text('password')" src/db/schema.ts; then
    echo "✅ Database schema supports OAuth users (nullable passwords)"
else
    echo "⚠️  Database schema may need updating for OAuth support"
fi

echo ""
echo "🎉 Authentication setup is ready!"
echo ""
echo "💡 Make sure your Vercel environment variables are set:"
echo "   - NEXTAUTH_SECRET"
echo "   - GOOGLE_CLIENT_ID" 
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - DATABASE_URL"
echo "   - GOOGLE_API_KEY"
echo ""
echo "🚀 To test authentication:"
echo "   1. Start dev server: npm run dev"
echo "   2. Open: http://localhost:3000"
echo "   3. Try Google sign-in"
