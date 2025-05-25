import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the session to identify the user (optional for this endpoint)
    let session;
    try {
      session = await auth.api.getSession({
        headers: request.headers
      });
    } catch (error) {
      // Session is optional for general stats
      console.log('No session found, showing general stats');
    }

    // Get total counts from database
    const [
      totalProperties,
      totalOwners,
      totalStates,
      totalCities
    ] = await Promise.all([
      prisma.property.count(),
      prisma.owner.count(),
      prisma.state.count(),
      prisma.city.count()
    ]);

    // Calculate total property value
    const propertyValues = await prisma.property.aggregate({
      _sum: {
        currentValue: true
      }
    });

    // Get user's saved properties count if authenticated
    let savedPropertiesCount = 0;
    if (session?.user?.id) {
      savedPropertiesCount = await prisma.savedProperty.count({
        where: {
          userId: session.user.id
        }
      });
    }

    // Format total value
    const totalValue = propertyValues._sum.currentValue || 0;
    const formattedValue = totalValue > 1000000000 
      ? `$${(totalValue / 1000000000).toFixed(1)}B`
      : totalValue > 1000000
      ? `$${(totalValue / 1000000).toFixed(1)}M`
      : `$${totalValue.toLocaleString()}`;

    return NextResponse.json({
      totalProperties: totalProperties.toLocaleString(),
      totalOwners: totalOwners.toLocaleString(),
      totalValue: formattedValue,
      savedProperties: savedPropertiesCount.toString(),
      totalStates,
      totalCities,
      isUserSpecific: !!session?.user?.id
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 