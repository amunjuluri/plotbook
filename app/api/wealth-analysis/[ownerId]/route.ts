import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeOwnerPortfolio } from '@/utils/propertyAnalytics';

// Input validation
function validateOwnerId(ownerId: string): boolean {
  return typeof ownerId === 'string' && ownerId.length > 0 && ownerId.length < 100;
}

function validatePropertyId(propertyId: string | null): boolean {
  return propertyId === null || (typeof propertyId === 'string' && propertyId.length > 0 && propertyId.length < 100);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const startTime = Date.now();
  let ownerId: string = '';
  
  try {
    // Extract and validate parameters
    const resolvedParams = await params;
    ownerId = resolvedParams.ownerId;
    
    if (!validateOwnerId(ownerId)) {
      console.warn(`Invalid ownerId provided: ${ownerId}`);
      return NextResponse.json(
        { 
          error: 'Invalid owner ID format',
          code: 'INVALID_OWNER_ID'
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    if (!validatePropertyId(propertyId)) {
      console.warn(`Invalid propertyId provided: ${propertyId}`);
      return NextResponse.json(
        { 
          error: 'Invalid property ID format',
          code: 'INVALID_PROPERTY_ID'
        },
        { status: 400 }
      );
    }

    console.log(`Starting wealth analysis for owner: ${ownerId}${propertyId ? `, property: ${propertyId}` : ''}`);

    // Enhanced database query with timeout protection
    const queryTimeout = 10000; // 10 seconds
    const queryPromise = prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        wealthBreakdown: {
          orderBy: { amount: 'desc' }
        },
        ownerships: {
          where: { isActive: true },
          include: {
            property: {
              include: {
                city: true,
                state: true
              }
            }
          },
          orderBy: { ownershipPercent: 'desc' }
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), queryTimeout)
    );

    const owner = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (!owner) {
      console.warn(`Owner not found: ${ownerId}`);
      return NextResponse.json(
        { 
          error: 'Owner not found',
          code: 'OWNER_NOT_FOUND',
          message: 'The specified owner does not exist in our database.'
        },
        { status: 404 }
      );
    }

    // Enhanced owner name formatting with fallbacks
    let ownerName = 'Unknown Owner';
    try {
      if (owner.type === 'individual') {
        const firstName = owner.firstName?.trim() || '';
        const lastName = owner.lastName?.trim() || '';
        if (firstName || lastName) {
          ownerName = `${firstName} ${lastName}`.trim();
        } else {
          ownerName = 'Individual Owner';
        }
      } else if (owner.entityName?.trim()) {
        ownerName = owner.entityName.trim();
      } else {
        ownerName = 'Entity Owner';
      }
    } catch (nameError) {
      console.warn(`Error formatting owner name for ${ownerId}:`, nameError);
      ownerName = 'Owner';
    }

    // Enhanced property data extraction with error handling
    const properties = [];
    const propertyErrors = [];

    for (const ownership of owner.ownerships || []) {
      try {
        if (!ownership.property) {
          propertyErrors.push(`Missing property data for ownership ${ownership.id}`);
          continue;
        }

        properties.push({
          id: ownership.property.id,
          address: ownership.property.address || 'Unknown Address',
          currentValue: Math.max(0, ownership.property.currentValue || 0),
          propertyType: ownership.property.propertyType || 'unknown',
          city: ownership.property.city?.name || 'Unknown City',
          state: ownership.property.state?.code || 'Unknown State',
          ownershipPercent: Math.max(0, Math.min(100, ownership.ownershipPercent || 0))
        });
      } catch (propertyError) {
        console.warn(`Error processing property for ownership ${ownership.id}:`, propertyError);
        propertyErrors.push(`Error processing property ${ownership.property?.id || 'unknown'}`);
      }
    }

    if (propertyErrors.length > 0) {
      console.warn(`Property processing errors for owner ${ownerId}:`, propertyErrors);
    }

    // Enhanced portfolio analysis with error handling
    let portfolioAnalysis;
    try {
      portfolioAnalysis = analyzeOwnerPortfolio(properties);
    } catch (analysisError) {
      console.error(`Portfolio analysis failed for owner ${ownerId}:`, analysisError);
      // Fallback portfolio analysis
      portfolioAnalysis = {
        portfolioValue: properties.reduce((sum, p) => sum + p.currentValue, 0),
        portfolioGrowth: 0.05, // Default 5% growth
        diversificationScore: 50,
        concentrationRisk: 50,
        leverageRatio: 0.65,
        liquidityRatio: 0.5,
        performanceScore: 50
      };
    }

    // Enhanced market comparison with bounds checking
    const estimatedNetWorth = Math.max(0, owner.estimatedNetWorth || 1000000);
    const basePercentile = Math.min(95, Math.max(5, 
      50 + Math.log(estimatedNetWorth / 1000000) * 15
    ));
    
    const industryMultiplier = getIndustryMultiplier(owner.industry);
    const locationMultiplier = getLocationMultiplier(properties);
    
    const marketComparison = {
      percentile: Math.round(Math.max(1, Math.min(99, basePercentile))),
      industryAverage: Math.round(Math.max(50000, estimatedNetWorth / industryMultiplier)),
      localAverage: Math.round(Math.max(50000, estimatedNetWorth / locationMultiplier))
    };

    // Enhanced risk assessment
    let riskAssessment;
    try {
      riskAssessment = calculateRiskAssessment(owner, properties, portfolioAnalysis);
    } catch (riskError) {
      console.error(`Risk assessment failed for owner ${ownerId}:`, riskError);
      // Fallback risk assessment
      riskAssessment = {
        score: 50,
        factors: ['Unable to calculate detailed risk factors'],
        recommendations: ['Please contact support for detailed risk analysis']
      };
    }

    // Enhanced wealth breakdown formatting with validation
    const wealthBreakdown = [];
    for (const wb of owner.wealthBreakdown || []) {
      try {
        if (wb.amount > 0) { // Only include positive amounts
          wealthBreakdown.push({
            id: wb.id,
            category: wb.category || 'other',
            amount: Math.round(wb.amount),
            percentage: Math.max(0, Math.min(100, wb.percentage || 0)),
            confidence: Math.max(0, Math.min(1, wb.confidence || 0.5))
          });
        }
      } catch (wbError) {
        console.warn(`Error processing wealth breakdown item ${wb.id}:`, wbError);
      }
    }

    // Sort wealth breakdown by amount (highest first)
    wealthBreakdown.sort((a, b) => b.amount - a.amount);

    const analysisData = {
      owner: {
        id: owner.id,
        name: ownerName,
        type: owner.type || 'unknown',
        estimatedNetWorth: Math.round(estimatedNetWorth),
        wealthConfidence: Math.max(0, Math.min(1, owner.wealthConfidence || 0.5)),
        occupation: owner.occupation?.trim() || '',
        industry: owner.industry?.trim() || '',
        wealthBreakdown,
        properties: properties.slice(0, 50) // Limit to 50 properties for performance
      },
      portfolioAnalysis,
      marketComparison,
      riskAssessment,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        dataQuality: {
          propertiesProcessed: properties.length,
          wealthCategoriesAvailable: wealthBreakdown.length,
          hasErrors: propertyErrors.length > 0
        }
      }
    };

    console.log(`Wealth analysis completed for owner ${ownerId} in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(analysisData, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Processing-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Wealth analysis error for owner ${ownerId}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
      timestamp: new Date().toISOString()
    });

    // Determine appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout. Please try again.',
            code: 'TIMEOUT',
            retryAfter: 5
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          { 
            error: 'Database connection error. Please try again later.',
            code: 'DATABASE_ERROR',
            retryAfter: 10
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        code: 'INTERNAL_ERROR',
        requestId: `${ownerId}-${Date.now()}`
      },
      { status: 500 }
    );
  }
}

function getIndustryMultiplier(industry?: string | null): number {
  if (!industry) return 1.0;
  
  const multipliers: Record<string, number> = {
    'technology': 1.3,
    'finance': 1.2,
    'healthcare': 1.1,
    'real estate': 1.4,
    'manufacturing': 0.9,
    'education': 0.8,
    'government': 0.7,
    'entertainment': 1.1,
    'consulting': 1.15,
    'law': 1.25,
    'energy': 1.1,
    'retail': 0.85,
    'hospitality': 0.8,
    'agriculture': 0.75
  };
  
  const normalizedIndustry = industry.toLowerCase().trim();
  return multipliers[normalizedIndustry] || 1.0;
}

function getLocationMultiplier(properties: any[]): number {
  if (!properties || properties.length === 0) return 1.0;
  
  // High-cost states and their multipliers
  const stateMultipliers: Record<string, number> = {
    'CA': 1.4, // California
    'NY': 1.3, // New York
    'MA': 1.25, // Massachusetts
    'WA': 1.2, // Washington
    'CT': 1.2, // Connecticut
    'HI': 1.35, // Hawaii
    'NJ': 1.15, // New Jersey
    'MD': 1.1, // Maryland
    'VA': 1.05, // Virginia
    'CO': 1.05, // Colorado
    'FL': 1.0, // Florida
    'TX': 0.95, // Texas
    'IL': 0.95, // Illinois
    'NC': 0.9, // North Carolina
    'GA': 0.9, // Georgia
    'OH': 0.85, // Ohio
    'PA': 0.85, // Pennsylvania
    'MI': 0.8, // Michigan
    'IN': 0.75, // Indiana
    'TN': 0.75, // Tennessee
    'KY': 0.7, // Kentucky
    'AL': 0.7, // Alabama
    'MS': 0.65, // Mississippi
    'WV': 0.65  // West Virginia
  };
  
  // Calculate weighted average multiplier based on property values
  let totalValue = 0;
  let weightedMultiplier = 0;
  
  for (const property of properties) {
    const value = property.currentValue || 0;
    const multiplier = stateMultipliers[property.state] || 1.0;
    
    totalValue += value;
    weightedMultiplier += value * multiplier;
  }
  
  return totalValue > 0 ? weightedMultiplier / totalValue : 1.0;
}

function calculateRiskAssessment(owner: any, properties: any[], portfolio: any) {
  let riskScore = 25; // Base risk (lower starting point)
  const factors: string[] = [];
  const recommendations: string[] = [];

  try {
    // Enhanced concentration risk analysis
    if (portfolio.concentrationRisk > 80) {
      riskScore += 20;
      factors.push('Very high concentration in single asset type - significant diversification risk');
      recommendations.push('Urgently diversify across multiple property types and asset classes');
    } else if (portfolio.concentrationRisk > 60) {
      riskScore += 12;
      factors.push('High concentration in limited asset types');
      recommendations.push('Consider diversifying across different property types and markets');
    } else if (portfolio.concentrationRisk < 30) {
      riskScore -= 5;
      recommendations.push('Excellent diversification - maintain current portfolio balance');
    }

    // Enhanced geographic risk analysis
    const uniqueStates = new Set(properties.map(p => p.state)).size;
    const totalProperties = properties.length;
    
    if (uniqueStates === 1 && totalProperties > 3) {
      riskScore += 15;
      factors.push('Complete geographic concentration in single state');
      recommendations.push('Diversify investments across multiple states and regions');
    } else if (uniqueStates <= 2 && totalProperties > 5) {
      riskScore += 10;
      factors.push('Limited geographic diversification across states');
      recommendations.push('Expand to additional geographic markets for better risk distribution');
    } else if (uniqueStates >= Math.min(5, Math.floor(totalProperties / 2))) {
      riskScore -= 5;
      recommendations.push('Good geographic diversification - continue expanding thoughtfully');
    }

    // Enhanced liquidity analysis
    if (portfolio.liquidityRatio < 0.2) {
      riskScore += 15;
      factors.push('Very low portfolio liquidity - difficulty accessing cash quickly');
      recommendations.push('Increase allocation to more liquid assets and maintain emergency reserves');
    } else if (portfolio.liquidityRatio < 0.4) {
      riskScore += 8;
      factors.push('Below-average portfolio liquidity');
      recommendations.push('Consider increasing liquid asset allocation for financial flexibility');
    } else if (portfolio.liquidityRatio > 0.7) {
      riskScore -= 3;
      recommendations.push('Strong liquidity position - well-positioned for opportunities');
    }

    // Enhanced age-related risk analysis for individuals
    if (owner.type === 'individual' && owner.dateOfBirth) {
      try {
        const age = new Date().getFullYear() - new Date(owner.dateOfBirth).getFullYear();
        if (age > 70) {
          riskScore += 12;
          factors.push('Advanced age requires more conservative investment approach');
          recommendations.push('Focus on income-generating assets and capital preservation strategies');
        } else if (age > 60) {
          riskScore += 6;
          factors.push('Pre-retirement age suggests need for risk assessment');
          recommendations.push('Begin transitioning to more conservative investment strategy');
        } else if (age < 35) {
          riskScore -= 5;
          recommendations.push('Young age allows for higher risk tolerance and growth focus');
        }
      } catch (dateError) {
        console.warn('Error calculating age for risk assessment:', dateError);
      }
    }

    // Enhanced wealth complexity analysis
    const netWorth = owner.estimatedNetWorth || 0;
    if (netWorth > 50000000) {
      riskScore += 8;
      factors.push('Ultra-high net worth requires sophisticated wealth management');
      recommendations.push('Engage specialized wealth management and tax planning professionals');
    } else if (netWorth > 10000000) {
      riskScore += 5;
      factors.push('High net worth complexity requires professional oversight');
      recommendations.push('Consider comprehensive wealth management and estate planning services');
    } else if (netWorth < 500000) {
      riskScore += 3;
      factors.push('Limited wealth base requires careful growth strategy');
      recommendations.push('Focus on building diversified wealth foundation');
    }

    // Enhanced data confidence analysis
    const wealthConfidence = owner.wealthConfidence || 0;
    if (wealthConfidence < 0.6) {
      riskScore += 12;
      factors.push('Low confidence in wealth estimates creates planning uncertainty');
      recommendations.push('Conduct comprehensive financial audit to improve data accuracy');
    } else if (wealthConfidence < 0.8) {
      riskScore += 6;
      factors.push('Moderate uncertainty in wealth estimates');
      recommendations.push('Verify and update financial information for better planning accuracy');
    }

    // Enhanced portfolio performance analysis
    if (portfolio.performanceScore < 40) {
      riskScore += 15;
      factors.push('Significantly below-average portfolio performance');
      recommendations.push('Comprehensive portfolio review and strategy overhaul recommended');
    } else if (portfolio.performanceScore < 60) {
      riskScore += 8;
      factors.push('Below-average portfolio performance');
      recommendations.push('Review investment strategy and consider professional portfolio management');
    } else if (portfolio.performanceScore > 80) {
      riskScore -= 8;
      recommendations.push('Excellent portfolio performance - maintain successful strategies');
    }

    // Market timing and economic cycle considerations
    if (properties.length > 0) {
      const avgPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0) / properties.length;
      if (avgPropertyValue > 2000000) {
        riskScore += 5;
        factors.push('High-value properties may be more sensitive to market cycles');
        recommendations.push('Monitor market conditions and consider hedging strategies');
      }
    }

    // Positive factors that reduce risk
    if (portfolio.diversificationScore > 75) {
      riskScore -= 8;
      recommendations.push('Excellent diversification strategy - continue maintaining balance');
    }

    if (wealthConfidence > 0.85) {
      riskScore -= 3;
      recommendations.push('High data confidence enables better strategic planning');
    }

    // Ensure risk score stays within realistic bounds
    riskScore = Math.max(5, Math.min(95, riskScore));

    // Add general best-practice recommendations
    if (recommendations.length < 3) {
      recommendations.push('Conduct annual portfolio reviews and rebalancing');
      recommendations.push('Stay informed about market trends and economic indicators');
      recommendations.push('Maintain adequate insurance coverage for major assets');
    }

    // Ensure we have meaningful factors
    if (factors.length === 0) {
      factors.push('Portfolio shows balanced risk characteristics');
    }

    return {
      score: Math.round(riskScore),
      factors: factors.slice(0, 8), // Limit to 8 factors for readability
      recommendations: recommendations.slice(0, 8) // Limit to 8 recommendations
    };

  } catch (error) {
    console.error('Error in risk assessment calculation:', error);
    return {
      score: 50,
      factors: ['Unable to complete detailed risk analysis'],
      recommendations: ['Contact a financial advisor for comprehensive risk assessment']
    };
  }
} 