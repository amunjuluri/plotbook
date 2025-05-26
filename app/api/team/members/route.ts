import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Get all team members in the same company
    const members = await prisma.user.findMany({
      where: { 
        companyId: user.companyId 
      },
      include: {
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to include status and tab permissions
    const membersWithStatus = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || 'user',
      image: member.image,
      emailVerified: member.emailVerified,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      company: member.company,
      // Tab permissions
      canAccessDashboard: member.canAccessDashboard,
      canAccessSavedProperties: member.canAccessSavedProperties,
      canAccessTeamManagement: member.canAccessTeamManagement,
      // Determine status based on recent activity
      status: (() => {
        const daysSinceUpdate = (Date.now() - member.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate <= 1) return 'active';
        if (daysSinceUpdate <= 30) return 'inactive';
        return 'pending';
      })(),
      lastActive: member.updatedAt.toISOString()
    }));

    return NextResponse.json({
      members: membersWithStatus
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
} 