import { NextRequest, NextResponse } from 'next/server';
import { propertyAPI, PropertySearchParams } from '@/lib/property-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const params: PropertySearchParams = {
      address: searchParams.get('address') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      zipCode: searchParams.get('zipCode') || undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      propertyType: searchParams.get('propertyType') as any || undefined,
      minValue: searchParams.get('minValue') ? parseInt(searchParams.get('minValue')!) : undefined,
      maxValue: searchParams.get('maxValue') ? parseInt(searchParams.get('maxValue')!) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? parseInt(searchParams.get('minBedrooms')!) : undefined,
      maxBedrooms: searchParams.get('maxBedrooms') ? parseInt(searchParams.get('maxBedrooms')!) : undefined,
      minBathrooms: searchParams.get('minBathrooms') ? parseFloat(searchParams.get('minBathrooms')!) : undefined,
      maxBathrooms: searchParams.get('maxBathrooms') ? parseFloat(searchParams.get('maxBathrooms')!) : undefined,
      minSquareFootage: searchParams.get('minSquareFootage') ? parseInt(searchParams.get('minSquareFootage')!) : undefined,
      maxSquareFootage: searchParams.get('maxSquareFootage') ? parseInt(searchParams.get('maxSquareFootage')!) : undefined,
      minYearBuilt: searchParams.get('minYearBuilt') ? parseInt(searchParams.get('minYearBuilt')!) : undefined,
      maxYearBuilt: searchParams.get('maxYearBuilt') ? parseInt(searchParams.get('maxYearBuilt')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    // Check if we have at least one search parameter
    const hasSearchParams = Object.values(params).some(value => value !== undefined);
    if (!hasSearchParams) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    // For now, return mock data since we're not using RentCast
    const mockProperties = [
      {
        id: '1',
        formattedAddress: '1847 Billionaire Row, Manhattan, NY',
        addressLine1: '1847 Billionaire Row',
        city: 'Manhattan',
        state: 'NY',
        zipCode: '10019',
        county: 'New York',
        latitude: 40.7589,
        longitude: -73.9851,
        propertyType: 'Luxury Penthouse',
        bedrooms: 4,
        bathrooms: 3.5,
        squareFootage: 8500,
        yearBuilt: 2019,
        lastSaleDate: '2021-03-15',
        lastSalePrice: 42000000,
        taxAssessments: [{ year: 2024, value: 38000000 }],
        owner: {
          names: ['John Richardson'],
          mailingAddress: {
            addressLine1: '1847 Billionaire Row',
            city: 'Manhattan',
            state: 'NY',
            zipCode: '10019'
          }
        },
        features: ['Pool', 'Gym', 'Concierge'],
        valuation: {
          value: 45000000,
          valueHigh: 50000000,
          valueLow: 40000000
        }
      },
      {
        id: '2',
        formattedAddress: '500 Park Avenue, Manhattan, NY',
        addressLine1: '500 Park Avenue',
        city: 'Manhattan',
        state: 'NY',
        zipCode: '10022',
        county: 'New York',
        latitude: 40.7614,
        longitude: -73.9776,
        propertyType: 'Luxury Condo',
        bedrooms: 3,
        bathrooms: 2.5,
        squareFootage: 6200,
        yearBuilt: 2016,
        lastSaleDate: '2020-11-22',
        lastSalePrice: 26500000,
        taxAssessments: [{ year: 2024, value: 25000000 }],
        owner: {
          names: ['Global Dynamics Corp']
        },
        features: ['Doorman', 'Rooftop Terrace'],
        valuation: {
          value: 28000000,
          valueHigh: 32000000,
          valueLow: 24000000
        }
      }
    ];
    
    // Transform the data to match our existing interfaces
    const transformedProperties = mockProperties.map((property) => ({
      id: property.id,
      address: property.formattedAddress,
      propertyValue: property.valuation?.value || property.lastSalePrice || property.taxAssessments?.[0]?.value || 0,
      propertyType: property.propertyType,
      squareFootage: property.squareFootage || 0,
      yearBuilt: property.yearBuilt || new Date().getFullYear(),
      lastSaleDate: property.lastSaleDate || new Date().toISOString().split('T')[0],
      lastSalePrice: property.lastSalePrice || 0,
      location: {
        latitude: property.latitude,
        longitude: property.longitude,
      },
      taxAssessment: property.taxAssessments?.[0]?.value || 0,
      owner: {
        id: `owner-${property.id}`,
        name: property.owner?.names?.[0] || 'Private Owner',
        type: 'individual' as const,
        estimatedNetWorth: property.valuation?.value ? property.valuation.value * 3 : 1000000, // Rough estimate
        netWorthConfidence: property.valuation?.value ? 75 : 50,
        lastUpdated: new Date().toISOString().split('T')[0],
        businessAffiliations: [],
        wealthSources: {
          realEstate: 40,
          securities: 30,
          business: 20,
          other: 10,
        },
        riskProfile: 'medium' as const,
      },
      // Additional data
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      lotSize: 0,
      features: property.features,
      county: property.county,
      valuation: property.valuation,
    }));

    return NextResponse.json({
      properties: transformedProperties,
      total: transformedProperties.length,
      limit: params.limit,
      offset: params.offset,
    });

  } catch (error) {
    console.error('Property search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params: PropertySearchParams = body;

    // Return mock data for POST requests too
    const mockProperties = [
      {
        id: '1',
        formattedAddress: '1847 Billionaire Row, Manhattan, NY',
        addressLine1: '1847 Billionaire Row',
        city: 'Manhattan',
        state: 'NY',
        zipCode: '10019',
        county: 'New York',
        latitude: 40.7589,
        longitude: -73.9851,
        propertyType: 'Luxury Penthouse',
        bedrooms: 4,
        bathrooms: 3.5,
        squareFootage: 8500,
        yearBuilt: 2019,
        lastSaleDate: '2021-03-15',
        lastSalePrice: 42000000,
        taxAssessments: [{ year: 2024, value: 38000000 }],
        owner: {
          names: ['John Richardson']
        },
        features: ['Pool', 'Gym', 'Concierge'],
      }
    ];
    
    return NextResponse.json({
      properties: mockProperties,
      total: mockProperties.length,
    });

  } catch (error) {
    console.error('Property search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 