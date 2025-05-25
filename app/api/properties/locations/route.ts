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
    
    // New search type parameters
    const ownerSearch = searchParams.get('ownerSearch');
    const address = searchParams.get('address');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minSquareFootage = searchParams.get('minSquareFootage');
    const search = searchParams.get('search'); // General search term

    // Advanced filter parameters
    const propertyTypes = searchParams.get('propertyTypes'); // Comma-separated list
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const maxSquareFootage = searchParams.get('maxSquareFootage');
    const minYearBuilt = searchParams.get('minYearBuilt');
    const maxYearBuilt = searchParams.get('maxYearBuilt');
    const hasOwnerInfo = searchParams.get('hasOwnerInfo');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause based on filters
    const where: any = {};
    
    // Owner search - search by owner names
    if (ownerSearch) {
      where.ownerships = {
        some: {
          owner: {
            OR: [
              { firstName: { contains: ownerSearch, mode: 'insensitive' } },
              { lastName: { contains: ownerSearch, mode: 'insensitive' } },
              { entityName: { contains: ownerSearch, mode: 'insensitive' } }
            ]
          }
        }
      };
    }
    
    // Address search
    if (address) {
      where.address = { contains: address, mode: 'insensitive' };
    }
    
    // Property characteristics filters
    if (state) {
      where.state = { name: state };
    }
    
    if (city) {
      where.city = { name: city };
    }
    
    // Property type filter - support multiple types
    if (propertyTypes) {
      const typeArray = propertyTypes.split(',').map(t => t.trim());
      where.propertyType = { in: typeArray };
    } else if (propertyType) {
      where.propertyType = propertyType;
    }
    
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }
    
    if (bathrooms) {
      where.bathrooms = { gte: parseFloat(bathrooms) };
    }
    
    // Square footage range
    if (minSquareFootage || maxSquareFootage) {
      where.squareFootage = {};
      if (minSquareFootage) where.squareFootage.gte = parseInt(minSquareFootage);
      if (maxSquareFootage) where.squareFootage.lte = parseInt(maxSquareFootage);
    }
    
    // Price range (support both old and new parameter names)
    if (minPrice || maxPrice || minValue || maxValue) {
      where.currentValue = {};
      if (minPrice) where.currentValue.gte = parseInt(minPrice);
      if (maxPrice) where.currentValue.lte = parseInt(maxPrice);
      if (minValue) where.currentValue.gte = parseInt(minValue);
      if (maxValue) where.currentValue.lte = parseInt(maxValue);
    }

    // Year built range
    if (minYearBuilt || maxYearBuilt) {
      where.yearBuilt = {};
      if (minYearBuilt) where.yearBuilt.gte = parseInt(minYearBuilt);
      if (maxYearBuilt) where.yearBuilt.lte = parseInt(maxYearBuilt);
    }

    // Has owner info filter
    if (hasOwnerInfo === 'true') {
      where.ownerships = {
        some: {
          isActive: true,
          owner: {
            OR: [
              { firstName: { not: null } },
              { lastName: { not: null } },
              { entityName: { not: null } }
            ]
          }
        }
      };
    }
    
    // General search - search across multiple fields
    if (search && !ownerSearch && !address) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { propertyType: { contains: search, mode: 'insensitive' } },
        { city: { name: { contains: search, mode: 'insensitive' } } },
        { state: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build orderBy clause based on sortBy parameter
    let orderBy: any = { currentValue: 'desc' }; // Default sorting
    
    switch (sortBy) {
      case 'price':
        orderBy = { currentValue: sortOrder };
        break;
      case 'size':
        orderBy = { squareFootage: sortOrder };
        break;
      case 'year':
        orderBy = { yearBuilt: sortOrder };
        break;
      case 'relevance':
      default:
        // For relevance, prioritize by current value
        orderBy = { currentValue: 'desc' };
        break;
    }

    // Fetch properties with location data and owner information
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
        yearBuilt: true,
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
        ownerships: {
          where: {
            isActive: true
          },
          select: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
                entityName: true,
                type: true
              }
            }
          },
          take: 1 // Get primary owner
        }
      },
      take: limit,
      orderBy
    });

    // Transform data for map display
    const propertyLocations = properties.map(property => {
      const primaryOwner = property.ownerships[0]?.owner;
      let ownerName = 'Unknown Owner';
      
      if (primaryOwner) {
        if (primaryOwner.type === 'individual') {
          ownerName = `${primaryOwner.firstName || ''} ${primaryOwner.lastName || ''}`.trim();
        } else {
          ownerName = primaryOwner.entityName || 'Unknown Entity';
        }
      }
      
      return {
        id: property.id,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        propertyType: property.propertyType,
        currentValue: property.currentValue || 0,
        squareFootage: property.squareFootage,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt,
        city: property.city?.name || 'Unknown',
        state: property.city?.state?.name || 'Unknown',
        stateCode: property.city?.state?.code || 'XX',
        ownerName: ownerName,
        ownerType: primaryOwner?.type || 'unknown',
        formattedValue: (property.currentValue || 0) > 1000000 
          ? `$${((property.currentValue || 0) / 1000000).toFixed(1)}M`
          : `$${(property.currentValue || 0).toLocaleString()}`,
        title: ownerSearch 
          ? `${property.address} (Owner: ${ownerName})`
          : `${property.address}, ${property.city?.name || 'Unknown'}, ${property.city?.state?.code || 'XX'}`,
        description: ownerSearch
          ? `Owned by ${ownerName} • ${property.propertyType}`
          : `${property.propertyType} • ${property.squareFootage?.toLocaleString() || 'N/A'} sq ft • ${property.bedrooms || 0}bd/${property.bathrooms || 0}ba`
      };
    });

    return NextResponse.json({
      properties: propertyLocations,
      total: propertyLocations.length,
      searchType: ownerSearch ? 'owner' : address ? 'address' : search ? 'general' : 'filter',
      filters: {
        state,
        city,
        propertyType,
        propertyTypes,
        minValue,
        maxValue,
        minPrice,
        maxPrice,
        minSquareFootage,
        maxSquareFootage,
        minYearBuilt,
        maxYearBuilt,
        hasOwnerInfo,
        sortBy,
        sortOrder,
        ownerSearch,
        address,
        bedrooms,
        bathrooms,
        search
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