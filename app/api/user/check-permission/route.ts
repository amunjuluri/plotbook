import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    const { permission } = await request.json();

    if (!permission) {
      return NextResponse.json({ error: 'Permission field is required' }, { status: 400 });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        canAccessDashboard: true,
        canAccessSavedProperties: true,
        canAccessTeamManagement: true
      }
    });

    if (!user) {
      return NextResponse.json({ hasPermission: false }, { status: 404 });
    }

    // Check the specific permission
    const hasPermission = user[permission as keyof typeof user] === true;

    return NextResponse.json({ hasPermission });

  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      { hasPermission: false },
      { status: 500 }
    );
  }
} 