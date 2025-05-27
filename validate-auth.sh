#!/bin/bash

# Authentication Validation Script
# This script validates the Google OAuth setup and configuration

echo "🔍 EarthAI Authentication Validation"
echo "====================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "💡 Run: ./setup-auth.sh to create it"
    exit 1
fi

echo "✅ .env.local file found"

# Function to check if environment variable is set and not placeholder
check_env_var() {
    local var_name=$1
    local placeholder=$2
    
    if grep -q "^${var_name}=" .env.local; then
        local value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2-)
        if [ "$value" = "$placeholder" ] || [ -z "$value" ]; then
            echo "❌ $var_name is not set or still has placeholder value"
            return 1
        else
            echo "✅ $var_name is configured"
            return 0
        fi
    else
        echo "❌ $var_name is missing from .env.local"
        return 1
    fi
}

# Check required environment variables
echo ""
echo "🔧 Checking Environment Variables:"
echo "---------------------------------"

ALL_GOOD=true

if ! check_env_var "NEXTAUTH_SECRET" "your-nextauth-secret-here"; then
    ALL_GOOD=false
    echo "   💡 Generate with: openssl rand -base64 32"
fi

if ! check_env_var "GOOGLE_CLIENT_ID" "your-google-client-id-here"; then
    ALL_GOOD=false
    echo "   💡 Get from Google Cloud Console"
fi

if ! check_env_var "GOOGLE_CLIENT_SECRET" "your-google-client-secret-here"; then
    ALL_GOOD=false
    echo "   💡 Get from Google Cloud Console"
fi

if ! check_env_var "DATABASE_URL" "your-postgresql-database-url-here"; then
    ALL_GOOD=false
    echo "   💡 Set your PostgreSQL connection string"
fi

# Check NEXTAUTH_URL
if grep -q "NEXTAUTH_URL=http://localhost:3000" .env.local; then
    echo "✅ NEXTAUTH_URL is set for development"
else
    echo "⚠️  NEXTAUTH_URL should be http://localhost:3000 for development"
fi

# Check file structure
echo ""
echo "📁 Checking File Structure:"
echo "---------------------------"

required_files=(
    "src/app/api/auth/[...nextauth]/route.ts"
    "src/app/auth/login/page.tsx"
    "src/app/auth/register/page.tsx"
    "src/app/auth/callback/page.tsx"
    "src/app/auth/error/page.tsx"
    "src/components/AuthModal.tsx"
    "src/middleware.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
        ALL_GOOD=false
    fi
done

# Check package.json dependencies
echo ""
echo "📦 Checking Dependencies:"
echo "------------------------"

required_deps=(
    "next-auth"
    "bcryptjs"
    "drizzle-orm"
)

for dep in "${required_deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "✅ $dep installed"
    else
        echo "❌ $dep missing"
        echo "   💡 Run: pnpm install $dep"
        ALL_GOOD=false
    fi
done

# Test auth health endpoint
echo ""
echo "🏥 Testing Authentication Health:"
echo "--------------------------------"

if command -v curl >/dev/null 2>&1; then
    echo "Starting development server test..."
    
    # Check if dev server is running
    if curl -s http://localhost:3000/api/auth/health >/dev/null 2>&1; then
        echo "✅ Auth health endpoint accessible"
        
        # Get health status
        HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/auth/health)
        if echo "$HEALTH_RESPONSE" | grep -q "\"status\":\"healthy\""; then
            echo "✅ Authentication system healthy"
        else
            echo "⚠️  Authentication system has issues"
            echo "   💡 Check: http://localhost:3000/api/auth/health"
        fi
    else
        echo "⚠️  Development server not running or health endpoint not accessible"
        echo "   💡 Start with: pnpm run dev"
        echo "   💡 Then test: http://localhost:3000/api/auth/health"
    fi
else
    echo "ℹ️  curl not available - skipping health check"
    echo "   💡 Manually test: http://localhost:3000/api/auth/health"
fi

# Final summary
echo ""
echo "📋 Validation Summary:"
echo "====================="

if [ "$ALL_GOOD" = true ]; then
    echo "🎉 All checks passed! Your authentication setup looks good."
    echo ""
    echo "🚀 Next steps:"
    echo "1. Start development server: pnpm run dev"
    echo "2. Test Google sign-in at: http://localhost:3000"
    echo "3. Check auth health at: http://localhost:3000/api/auth/health"
    echo ""
    echo "📖 If you encounter issues, see TROUBLESHOOTING.md"
else
    echo "⚠️  Some issues found. Please fix the items marked with ❌ above."
    echo ""
    echo "📚 Helpful resources:"
    echo "- GOOGLE_AUTH_SETUP.md - Detailed setup guide"
    echo "- TROUBLESHOOTING.md - Common issues and solutions"
    echo "- .env.example - Environment variable template"
fi

echo ""
echo "🔗 Important URLs to verify in Google Cloud Console:"
echo "Development: http://localhost:3000/api/auth/callback/google"
echo "Production: https://yourdomain.com/api/auth/callback/google"
