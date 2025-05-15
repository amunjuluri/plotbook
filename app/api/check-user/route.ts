import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

// Initialize Prisma client
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // Only need to know if user exists, not the details
    });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking user existence:', error);
    return NextResponse.json(
      { error: 'Failed to check user existence' },
      { status: 500 }
    );
  }
} 