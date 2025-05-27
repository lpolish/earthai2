import { NextResponse } from 'next/server';
import { authOptions } from '../[...nextauth]/route';

export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: [] as Array<{ name: string; status: 'pass' | 'fail'; message?: string }>,
    environment: process.env.NODE_ENV,
  };

  // Check environment variables
  const envChecks = [
    { name: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET },
    { name: 'NEXTAUTH_URL', value: process.env.NEXTAUTH_URL },
    { name: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID },
    { name: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
  ];

  envChecks.forEach(check => {
    healthCheck.checks.push({
      name: `env_${check.name}`,
      status: check.value ? 'pass' : 'fail',
      message: check.value ? 'Set' : 'Missing or empty'
    });
  });

  // Check NextAuth configuration
  try {
    if (authOptions.providers && authOptions.providers.length > 0) {
      healthCheck.checks.push({
        name: 'nextauth_providers',
        status: 'pass',
        message: `${authOptions.providers.length} provider(s) configured`
      });
    } else {
      healthCheck.checks.push({
        name: 'nextauth_providers',
        status: 'fail',
        message: 'No providers configured'
      });
    }
  } catch (error) {
    healthCheck.checks.push({
      name: 'nextauth_config',
      status: 'fail',
      message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Check database connection (basic check)
  try {
    const { db } = await import('@/db');
    const result = await db.execute('SELECT 1 as test');
    healthCheck.checks.push({
      name: 'database_connection',
      status: 'pass',
      message: 'Database connection successful'
    });
  } catch (error) {
    healthCheck.checks.push({
      name: 'database_connection',
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Determine overall status
  const hasFailures = healthCheck.checks.some(check => check.status === 'fail');
  if (hasFailures) {
    healthCheck.status = 'unhealthy';
  }

  return NextResponse.json(healthCheck, {
    status: hasFailures ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
