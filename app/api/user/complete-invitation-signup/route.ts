import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log("!!! PLOTBOOK_DEBUG: /api/user/complete-invitation-signup POST received !!!");
  try {
    const { userId, token } = await request.json();

    if (!userId || !token) {
      console.error("!!! PLOTBOOK_DEBUG: Missing userId or token !!!");
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 });
    }
    console.log(`!!! PLOTBOOK_DEBUG: Processing for userId: ${userId}, token: ${token} !!!`);

    // 1. Validate the invitation token and get companyId
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: token as string,
        status: 'pending', // Important: Only process pending invitations
        expires: { gt: new Date() },
      },
    });

    if (!invitation) {
      console.error(`!!! PLOTBOOK_DEBUG: Invalid, non-pending, or expired invitation token: ${token} !!!`);
      // If the user was created but the token is now invalid, this is a tricky state.
      // For now, we prevent linking if the token isn't valid at this point.
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 });
    }
    console.log(`!!! PLOTBOOK_DEBUG: Valid invitation found: ${JSON.stringify(invitation)} !!!`);

    if (!invitation.companyId) {
      console.error(`!!! PLOTBOOK_DEBUG: Invitation ${invitation.id} has no companyId! !!!`);
      return NextResponse.json({ error: 'Invitation is missing company information' }, { status: 400 });
    }

    // 2. Update the user record with companyId and other defaults
    const now = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        companyId: invitation.companyId,
        role: 'user', // Ensure role is set (might be set by BetterAuth, but good to be explicit)
        canAccessDashboard: true,
        canAccessSavedProperties: true,
        canAccessTeamManagement: false,
        // emailVerified should be handled by Better Auth's verification flow
        // createdAt was set by Better Auth
        updatedAt: now, 
      },
    });
    console.log(`!!! PLOTBOOK_DEBUG: User ${userId} updated with companyId: ${invitation.companyId}. Updated user: ${JSON.stringify(updatedUser)} !!!`);

    // 3. Mark the invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });
    console.log(`!!! PLOTBOOK_DEBUG: Invitation ${invitation.id} status updated to accepted. !!!`);

    return NextResponse.json({ message: 'User setup with invitation completed successfully', user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("!!! PLOTBOOK_DEBUG: Error in /api/user/complete-invitation-signup: !!!", error);
    let errorMessage = 'An unexpected error occurred during invitation completion.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 