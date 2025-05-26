import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const memberId = params.id;

    // Get the current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!currentUser?.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Validate that the member belongs to the same company
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { companyId: true }
    });

    if (!member || member.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'Member not found or access denied' }, { status: 404 });
    }

    // Extract permission fields from body
    const updateData: any = {};
    
    if ('canAccessDashboard' in body) {
      updateData.canAccessDashboard = body.canAccessDashboard;
    }
    if ('canAccessSavedProperties' in body) {
      updateData.canAccessSavedProperties = body.canAccessSavedProperties;
    }
    if ('canAccessTeamManagement' in body) {
      updateData.canAccessTeamManagement = body.canAccessTeamManagement;
    }

    // Update the member's permissions
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        canAccessDashboard: true,
        canAccessSavedProperties: true,
        canAccessTeamManagement: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      member: updatedMember 
    });

  } catch (error) {
    console.error('Error updating member permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
} 