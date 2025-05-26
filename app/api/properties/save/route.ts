import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, notes, tags } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if already saved
    const existingSave = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId: propertyId
        }
      }
    });

    if (existingSave) {
      return NextResponse.json(
        { error: 'Property already saved' },
        { status: 409 }
      );
    }

    // Save the property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId: session.user.id,
        propertyId: propertyId,
        notes: notes || null,
        tags: tags || []
      },
      include: {
        property: {
          include: {
            state: true,
            city: true,
            county: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      savedProperty: {
        id: savedProperty.id,
        propertyId: savedProperty.propertyId,
        notes: savedProperty.notes,
        tags: savedProperty.tags,
        createdAt: savedProperty.createdAt,
        property: {
          id: savedProperty.property.id,
          address: savedProperty.property.address,
          propertyType: savedProperty.property.propertyType,
          currentValue: savedProperty.property.currentValue,
          city: savedProperty.property.city?.name,
          state: savedProperty.property.state.name,
          stateCode: savedProperty.property.state.code
        }
      }
    });

  } catch (error) {
    console.error('Error saving property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the saved property
    const deletedSave = await prisma.savedProperty.deleteMany({
      where: {
        userId: session.user.id,
        propertyId: propertyId
      }
    });

    if (deletedSave.count === 0) {
      return NextResponse.json(
        { error: 'Saved property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property removed from saved list'
    });

  } catch (error) {
    console.error('Error removing saved property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tag = searchParams.get('tag');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      userId: string;
      tags?: {
        has: string;
      };
    } = {
      userId: session.user.id
    };

    if (tag) {
      where.tags = {
        has: tag
      };
    }

    // Get saved properties with property details
    const savedProperties = await prisma.savedProperty.findMany({
      where: where,
      include: {
        property: {
          include: {
            city: {
              select: {
                name: true,
                state: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            },
            state: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform the data for frontend consumption
    const transformedProperties = savedProperties.map((saved) => ({
      id: saved.id,
      propertyId: saved.propertyId,
      notes: saved.notes,
      tags: saved.tags,
      createdAt: saved.createdAt,
      property: {
        id: saved.property.id,
        address: saved.property.address,
        latitude: saved.property.latitude,
        longitude: saved.property.longitude,
        propertyType: saved.property.propertyType,
        currentValue: saved.property.currentValue,
        squareFootage: saved.property.squareFootage,
        bedrooms: saved.property.bedrooms,
        bathrooms: saved.property.bathrooms,
        yearBuilt: saved.property.yearBuilt,
        city: saved.property.city?.name || 'Unknown',
        state: saved.property.state?.name || saved.property.city?.state?.name || 'Unknown',
        stateCode: saved.property.state?.code || saved.property.city?.state?.code || 'XX',
        formattedValue: saved.property.currentValue 
          ? (saved.property.currentValue > 1000000 
            ? `$${(saved.property.currentValue / 1000000).toFixed(1)}M`
            : `$${saved.property.currentValue.toLocaleString()}`)
          : 'N/A'
      }
    }));

    // Get all unique tags for the user
    const allSavedProperties = await prisma.savedProperty.findMany({
      where: { userId: session.user.id },
      select: { tags: true }
    });

    const allTags = Array.from(
      new Set(allSavedProperties.flatMap(sp => sp.tags))
    ).sort();

    return NextResponse.json({
      success: true,
      savedProperties: transformedProperties,
      pagination: {
        page,
        limit,
        total: savedProperties.length,
        totalPages: Math.ceil(savedProperties.length / limit)
      },
      availableTags: allTags
    });

  } catch (error) {
    console.error('Error fetching saved properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 