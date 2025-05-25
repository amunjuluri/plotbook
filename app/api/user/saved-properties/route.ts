import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the session to identify the user
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's saved properties count
    const savedPropertiesCount = await prisma.savedProperty.count({
      where: {
        userId: session.user.id
      }
    });

    // Get recent saved properties with property details
    const recentSavedProperties = await prisma.savedProperty.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        property: {
          include: {
            city: true,
            state: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      count: savedPropertiesCount,
      recentProperties: recentSavedProperties
    });

  } catch (error) {
    console.error('Error fetching user saved properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved properties' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 