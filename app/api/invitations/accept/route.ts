import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    // Check if invitation exists
    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expires < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 400 }
      );
    }

    // Update the invitation status to "accepted"
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    });

    return NextResponse.json({
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
} 