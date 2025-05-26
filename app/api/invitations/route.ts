import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL;

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get the email from the request body
    const { email } = await req.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if the email is already invited
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation for this email already exists" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Create an invitation that expires in 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    // Create the invitation
    await prisma.invitation.create({
      data: {
        email,
        token,
        expires: expiryDate,
        invitedBy: session.user.id,
      },
    });

    // Create the invitation URL using the correct domain
    const invitationUrl = `${APP_DOMAIN}/signup?token=${token}`;

    // Send the invitation email
    await resend.emails.send({
      from: "Plotbook <noreply@plotbook.munjuluri.com>",
      to: email,
      subject: "Invitation to join Plotbook",
      html: `
        <h1>You've been invited to join Plotbook</h1>
        <p>You've been invited to join Plotbook by ${session.user.name}.</p>
        <p>Click the link below to create your account:</p>
        <a href="${invitationUrl}">Accept Invitation</a>
        <p>This invitation expires in 7 days.</p>
      `,
    });

    return NextResponse.json(
      { message: "Invitation sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
} 