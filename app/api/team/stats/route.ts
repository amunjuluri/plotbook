import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
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

    // Get team statistics
    const [
      totalMembers,
      activeMembers,
      pendingInvitations,
      totalRoles
    ] = await Promise.all([
      // Total members in the company
      prisma.user.count({
        where: { companyId: user.companyId }
      }),
      
      // Active members (logged in within last 30 days)
      prisma.user.count({
        where: {
          companyId: user.companyId,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Pending invitations
      prisma.invitation.count({
        where: {
          status: 'pending',
          expires: {
            gt: new Date()
          }
        }
      }),
      
      // Count distinct roles in the company
      prisma.user.findMany({
        where: { companyId: user.companyId },
        select: { role: true },
        distinct: ['role']
      }).then(roles => roles.filter(r => r.role).length)
    ]);

    return NextResponse.json({
      totalMembers,
      activeMembers,
      pendingInvitations,
      totalRoles
    });

  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 