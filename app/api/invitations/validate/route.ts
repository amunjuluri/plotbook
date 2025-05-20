import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

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

    // Return the invitation data
    return NextResponse.json({
      email: invitation.email,
      expires: invitation.expires,
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
} 