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
    const where: any = {
      userId: session.user.id
    };

    if (tag) {
      where.tags = {
        has: tag
      };
    }

    // Get saved properties with pagination
    const [savedProperties, total] = await Promise.all([
      prisma.savedProperty.findMany({
        where,
        include: {
          property: {
            include: {
              state: true,
              city: true,
              county: true,
              ownerships: {
                where: { isActive: true },
                include: {
                  owner: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.savedProperty.count({ where })
    ]);

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
      savedProperties: savedProperties.map(sp => ({
        id: sp.id,
        propertyId: sp.propertyId,
        notes: sp.notes,
        tags: sp.tags,
        createdAt: sp.createdAt,
        property: {
          id: sp.property.id,
          address: sp.property.address,
          propertyType: sp.property.propertyType,
          currentValue: sp.property.currentValue,
          squareFootage: sp.property.squareFootage,
          bedrooms: sp.property.bedrooms,
          bathrooms: sp.property.bathrooms,
          yearBuilt: sp.property.yearBuilt,
          latitude: sp.property.latitude,
          longitude: sp.property.longitude,
          city: sp.property.city?.name,
          state: sp.property.state.name,
          stateCode: sp.property.state.code,
          owners: sp.property.ownerships.map(o => ({
            name: o.owner.type === 'individual' 
              ? `${o.owner.firstName || ''} ${o.owner.lastName || ''}`.trim()
              : o.owner.entityName,
            ownershipPercent: o.ownershipPercent
          }))
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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