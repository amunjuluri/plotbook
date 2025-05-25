import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;

    // Fetch comprehensive property data
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        // Location data
        state: {
          select: {
            name: true,
            code: true
          }
        },
        county: {
          select: {
            name: true,
            fipsCode: true,
            population: true,
            medianIncome: true
          }
        },
        city: {
          select: {
            name: true,
            population: true,
            medianIncome: true,
            zipCodes: true
          }
        },
        
        // Ownership data
        ownerships: {
          where: { isActive: true },
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                entityName: true,
                type: true,
                estimatedNetWorth: true,
                occupation: true,
                employer: true,
                industry: true,
                email: true,
                phone: true,
                mailingAddress: true
              }
            }
          },
          orderBy: {
            ownershipPercent: 'desc'
          }
        },
        
        // Transaction history
        transactions: {
          include: {
            buyer: {
              select: {
                firstName: true,
                lastName: true,
                entityName: true,
                type: true
              }
            },
            seller: {
              select: {
                firstName: true,
                lastName: true,
                entityName: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 10 // Last 10 transactions
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Format ownership data
    const formattedOwnerships = property.ownerships.map((ownership: any) => {
      const owner = ownership.owner;
      let ownerName = 'Unknown Owner';
      
      if (owner.type === 'individual') {
        ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
      } else {
        ownerName = owner.entityName || 'Unknown Entity';
      }

      return {
        id: ownership.id,
        ownershipType: ownership.ownershipType,
        ownershipPercent: ownership.ownershipPercent,
        startDate: ownership.startDate,
        owner: {
          id: owner.id,
          name: ownerName,
          type: owner.type,
          estimatedNetWorth: owner.estimatedNetWorth,
          occupation: owner.occupation,
          employer: owner.employer,
          industry: owner.industry,
          email: owner.email,
          phone: owner.phone,
          mailingAddress: owner.mailingAddress
        }
      };
    });

    // Format transaction data
    const formattedTransactions = property.transactions.map((transaction: any) => {
      const getBuyerName = (buyer: any) => {
        if (!buyer) return 'Unknown';
        return buyer.type === 'individual' 
          ? `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim()
          : buyer.entityName || 'Unknown Entity';
      };

      const getSellerName = (seller: any) => {
        if (!seller) return 'Unknown';
        return seller.type === 'individual' 
          ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim()
          : seller.entityName || 'Unknown Entity';
      };

      return {
        id: transaction.id,
        type: transaction.transactionType,
        amount: transaction.amount,
        date: transaction.date,
        buyerName: getBuyerName(transaction.buyer),
        sellerName: getSellerName(transaction.seller),
        documentType: transaction.documentType,
        recordingDate: transaction.recordingDate,
        formattedAmount: transaction.amount > 1000000 
          ? `$${(transaction.amount / 1000000).toFixed(1)}M`
          : `$${transaction.amount.toLocaleString()}`
      };
    });

    // Calculate property metrics
    const propertyAge = property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : null;
    const pricePerSqFt = property.currentValue && property.squareFootage 
      ? Math.round(property.currentValue / property.squareFootage)
      : null;

    // Format the response
    const detailedProperty = {
      // Basic property info
      id: property.id,
      address: property.address,
      streetNumber: property.streetNumber,
      streetName: property.streetName,
      unit: property.unit,
      zipCode: property.zipCode,
      latitude: property.latitude,
      longitude: property.longitude,

      // Property characteristics
      propertyType: property.propertyType,
      buildingType: property.buildingType,
      yearBuilt: property.yearBuilt,
      propertyAge,
      squareFootage: property.squareFootage,
      lotSize: property.lotSize,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      stories: property.stories,

      // Financial data
      currentValue: property.currentValue,
      assessedValue: property.assessedValue,
      taxAmount: property.taxAmount,
      lastSalePrice: property.lastSalePrice,
      lastSaleDate: property.lastSaleDate,
      pricePerSqFt,
      
      // Formatted values
      formattedCurrentValue: property.currentValue 
        ? (property.currentValue > 1000000 
          ? `$${(property.currentValue / 1000000).toFixed(1)}M`
          : `$${property.currentValue.toLocaleString()}`)
        : 'N/A',
      formattedAssessedValue: property.assessedValue 
        ? `$${property.assessedValue.toLocaleString()}`
        : 'N/A',
      formattedTaxAmount: property.taxAmount 
        ? `$${property.taxAmount.toLocaleString()}`
        : 'N/A',
      formattedLastSalePrice: property.lastSalePrice 
        ? `$${property.lastSalePrice.toLocaleString()}`
        : 'N/A',

      // Location data
      location: {
        state: property.state?.name || 'Unknown',
        stateCode: property.state?.code || 'XX',
        county: property.county?.name || 'Unknown',
        city: property.city?.name || 'Unknown',
        countyInfo: property.county ? {
          fipsCode: property.county.fipsCode,
          population: property.county.population,
          medianIncome: property.county.medianIncome
        } : null,
        cityInfo: property.city ? {
          population: property.city.population,
          medianIncome: property.city.medianIncome,
          zipCodes: property.city.zipCodes
        } : null
      },

      // Ownership and transaction data
      ownerships: formattedOwnerships,
      transactions: formattedTransactions,
      
      // Metadata
      dataSource: property.dataSource,
      confidence: property.confidence,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    };

    return NextResponse.json({
      property: detailedProperty,
      success: true
    });

  } catch (error) {
    console.error('Error fetching property details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 