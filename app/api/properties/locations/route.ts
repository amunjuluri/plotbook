import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');

    // Build where clause based on filters
    const where: any = {};
    
    if (state) {
      where.state = { name: state };
    }
    
    if (city) {
      where.city = { name: city };
    }
    
    if (propertyType) {
      where.propertyType = propertyType;
    }
    
    if (minValue || maxValue) {
      where.currentValue = {};
      if (minValue) where.currentValue.gte = parseInt(minValue);
      if (maxValue) where.currentValue.lte = parseInt(maxValue);
    }

    // Fetch properties with location data
    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        currentValue: true,
        squareFootage: true,
        bedrooms: true,
        bathrooms: true,
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
        }
      },
      take: limit,
      orderBy: {
        currentValue: 'desc'
      }
    });

    // Transform data for map display
    const propertyLocations = properties.map(property => ({
      id: property.id,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      propertyType: property.propertyType,
      currentValue: property.currentValue || 0,
      squareFootage: property.squareFootage,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      city: property.city?.name || 'Unknown',
      state: property.city?.state?.name || 'Unknown',
      stateCode: property.city?.state?.code || 'XX',
      formattedValue: (property.currentValue || 0) > 1000000 
        ? `$${((property.currentValue || 0) / 1000000).toFixed(1)}M`
        : `$${(property.currentValue || 0).toLocaleString()}`,
      title: `${property.address}, ${property.city?.name || 'Unknown'}, ${property.city?.state?.code || 'XX'}`,
      description: `${property.propertyType} • ${property.squareFootage?.toLocaleString() || 'N/A'} sq ft • ${property.bedrooms || 0}bd/${property.bathrooms || 0}ba`
    }));

    return NextResponse.json({
      properties: propertyLocations,
      total: propertyLocations.length,
      filters: {
        state,
        city,
        propertyType,
        minValue,
        maxValue
      }
    });

  } catch (error) {
    console.error('Error fetching property locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property locations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 