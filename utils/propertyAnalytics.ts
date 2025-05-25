// Property Analytics & Valuation Algorithms
// Advanced calculations for real estate analysis

export interface PropertyMetrics {
  // Valuation Metrics
  estimatedValue: number;
  pricePerSqFt: number;
  marketValueAdjustment: number;
  appreciationRate: number;
  
  // Investment Metrics
  capRate?: number;
  cashOnCashReturn?: number;
  roi?: number;
  irr?: number;
  
  // Market Metrics
  marketScore: number;
  liquidityScore: number;
  riskScore: number;
  
  // Comparative Metrics
  priceToAreaMedian: number;
  valuePercentile: number;
  
  // Financial Health
  taxBurden: number;
  maintenanceCostEstimate: number;
  insuranceCostEstimate: number;
}

export interface MarketAnalysis {
  medianPrice: number;
  averagePrice: number;
  priceGrowth: number;
  inventory: number;
  daysOnMarket: number;
  absorption: number;
  marketTrend: 'bullish' | 'bearish' | 'stable';
  competitiveIndex: number;
}

export interface OwnershipAnalysis {
  portfolioValue: number;
  portfolioGrowth: number;
  diversificationScore: number;
  concentrationRisk: number;
  leverageRatio: number;
  liquidityRatio: number;
  performanceScore: number;
}

// Advanced Valuation Algorithm
export function calculatePropertyValuation(property: any, comparables: any[] = []): PropertyMetrics {
  const baseValue = property.currentValue || property.assessedValue || 0;
  const sqft = property.squareFootage || 1;
  const yearBuilt = property.yearBuilt || 2000;
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // 1. Automated Valuation Model (AVM) - Hedonic Pricing
  let estimatedValue = baseValue;
  
  // Age depreciation curve (non-linear)
  const ageDepreciation = Math.max(0.7, 1 - (age * 0.008) - Math.pow(age * 0.001, 2));
  
  // Location premium (based on county median income if available)
  const locationMultiplier = property.location?.countyInfo?.medianIncome 
    ? Math.min(1.5, Math.max(0.8, property.location.countyInfo.medianIncome / 65000))
    : 1.0;
  
  // Property type multipliers
  const typeMultipliers = {
    'residential': 1.0,
    'commercial': 1.2,
    'industrial': 0.9,
    'land': 0.7
  };
  
  const typeMultiplier = typeMultipliers[property.propertyType?.toLowerCase() as keyof typeof typeMultipliers] || 1.0;
  
  // Market conditions (simulated based on current trends)
  const marketCondition = 1.05; // 5% market appreciation
  
  // Calculate estimated value using hedonic pricing model
  estimatedValue = baseValue * ageDepreciation * locationMultiplier * typeMultiplier * marketCondition;
  
  // 2. Price per square foot analysis
  const pricePerSqFt = estimatedValue / sqft;
  
  // 3. Market value adjustment based on comparables
  let marketValueAdjustment = 0;
  if (comparables.length > 0) {
    const comparablePrices = comparables.map(c => c.currentValue / (c.squareFootage || 1));
    const medianComparable = comparablePrices.sort()[Math.floor(comparablePrices.length / 2)];
    marketValueAdjustment = (pricePerSqFt - medianComparable) / medianComparable;
  }
  
  // 4. Appreciation rate calculation (Monte Carlo simulation simplified)
  const baseAppreciation = 0.03; // 3% base
  const volatility = 0.15; // 15% volatility
  const appreciationRate = baseAppreciation + (Math.random() - 0.5) * volatility;
  
  // 5. Investment metrics (for commercial properties)
  let capRate, cashOnCashReturn, roi;
  if (property.propertyType === 'commercial') {
    const estimatedRent = estimatedValue * 0.08; // 8% gross rent multiplier
    const operatingExpenses = estimatedRent * 0.35; // 35% expense ratio
    const noi = estimatedRent - operatingExpenses;
    capRate = noi / estimatedValue;
    cashOnCashReturn = noi / (estimatedValue * 0.25); // 25% down payment
    roi = (noi + (estimatedValue * appreciationRate)) / estimatedValue;
  }
  
  // 6. Market scoring algorithm
  const marketScore = calculateMarketScore(property, pricePerSqFt);
  
  // 7. Liquidity scoring
  const liquidityScore = calculateLiquidityScore(property);
  
  // 8. Risk assessment
  const riskScore = calculateRiskScore(property, age, marketScore);
  
  // 9. Comparative analysis
  const nationalMedian = 350000; // National median home price
  const priceToAreaMedian = estimatedValue / nationalMedian;
  
  // Value percentile (simulated)
  const valuePercentile = Math.min(99, Math.max(1, 
    50 + (Math.log(estimatedValue / nationalMedian) * 20)
  ));
  
  // 10. Financial burden calculations
  const taxBurden = (property.taxAmount || estimatedValue * 0.012) / estimatedValue;
  const maintenanceCostEstimate = estimatedValue * 0.015; // 1.5% annually
  const insuranceCostEstimate = estimatedValue * 0.003; // 0.3% annually
  
  return {
    estimatedValue: Math.round(estimatedValue),
    pricePerSqFt: Math.round(pricePerSqFt),
    marketValueAdjustment,
    appreciationRate,
    capRate,
    cashOnCashReturn,
    roi,
    marketScore,
    liquidityScore,
    riskScore,
    priceToAreaMedian,
    valuePercentile,
    taxBurden,
    maintenanceCostEstimate: Math.round(maintenanceCostEstimate),
    insuranceCostEstimate: Math.round(insuranceCostEstimate)
  };
}

// Market Scoring Algorithm (0-100)
function calculateMarketScore(property: any, pricePerSqFt: number): number {
  let score = 50; // Base score
  
  // Population density factor
  if (property.location?.cityInfo?.population) {
    const popScore = Math.min(20, property.location.cityInfo.population / 50000);
    score += popScore;
  }
  
  // Income factor
  if (property.location?.countyInfo?.medianIncome) {
    const incomeScore = Math.min(15, (property.location.countyInfo.medianIncome - 50000) / 5000);
    score += incomeScore;
  }
  
  // Price efficiency
  const nationalAvgPSF = 150;
  const priceEfficiency = Math.max(-10, Math.min(10, (nationalAvgPSF - pricePerSqFt) / 20));
  score += priceEfficiency;
  
  // Property type bonus
  const typeBonus = {
    'residential': 5,
    'commercial': 10,
    'industrial': 0,
    'land': -5
  };
  score += typeBonus[property.propertyType?.toLowerCase() as keyof typeof typeBonus] || 0;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Liquidity Scoring Algorithm (0-100)
function calculateLiquidityScore(property: any): number {
  let score = 50;
  
  // Property type liquidity
  const typeLiquidity = {
    'residential': 20,
    'commercial': 10,
    'industrial': 5,
    'land': 0
  };
  score += typeLiquidity[property.propertyType?.toLowerCase() as keyof typeof typeLiquidity] || 0;
  
  // Size factor (larger properties are less liquid)
  if (property.squareFootage) {
    const sizeScore = Math.max(-15, Math.min(15, (3000 - property.squareFootage) / 500));
    score += sizeScore;
  }
  
  // Age factor (newer properties more liquid)
  if (property.yearBuilt) {
    const age = new Date().getFullYear() - property.yearBuilt;
    const ageScore = Math.max(-10, Math.min(10, (30 - age) / 5));
    score += ageScore;
  }
  
  // Location factor
  if (property.location?.cityInfo?.population && property.location.cityInfo.population > 100000) {
    score += 15; // Urban premium
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Risk Assessment Algorithm (0-100, lower is better)
function calculateRiskScore(property: any, age: number, marketScore: number): number {
  let risk = 30; // Base risk
  
  // Age risk
  if (age > 50) risk += 15;
  else if (age > 30) risk += 10;
  else if (age < 5) risk += 5; // New construction risk
  
  // Market risk (inverse of market score)
  risk += (100 - marketScore) * 0.3;
  
  // Property type risk
  const typeRisk = {
    'residential': 0,
    'commercial': 10,
    'industrial': 20,
    'land': 25
  };
  risk += typeRisk[property.propertyType?.toLowerCase() as keyof typeof typeRisk] || 15;
  
  // Concentration risk (if high value)
  if (property.currentValue > 1000000) risk += 10;
  if (property.currentValue > 5000000) risk += 15;
  
  return Math.max(0, Math.min(100, Math.round(risk)));
}

// Portfolio Analysis for Owners
export function analyzeOwnerPortfolio(properties: any[]): OwnershipAnalysis {
  if (properties.length === 0) {
    return {
      portfolioValue: 0,
      portfolioGrowth: 0,
      diversificationScore: 0,
      concentrationRisk: 100,
      leverageRatio: 0,
      liquidityRatio: 0,
      performanceScore: 0
    };
  }
  
  const portfolioValue = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
  
  // Diversification analysis
  const typeDistribution = properties.reduce((dist, p) => {
    const type = p.propertyType || 'unknown';
    dist[type] = (dist[type] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  const typeCount = Object.keys(typeDistribution).length;
  const maxConcentration = Math.max(...(Object.values(typeDistribution) as number[])) / properties.length;
  
  const diversificationScore = Math.round(
    (typeCount / 4) * 50 + (1 - maxConcentration) * 50
  );
  
  // Concentration risk (Herfindahl-Hirschman Index)
  const hhi = (Object.values(typeDistribution) as number[])
    .map((count: number) => Math.pow(count / properties.length, 2))
    .reduce((sum, val) => sum + val, 0);
  
  const concentrationRisk = Math.round(hhi * 100);
  
  // Geographic diversification
  const locationDistribution = properties.reduce((dist, p) => {
    const location = p.city || 'unknown';
    dist[location] = (dist[location] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  const geoHHI = (Object.values(locationDistribution) as number[])
    .map((count: number) => Math.pow(count / properties.length, 2))
    .reduce((sum, val) => sum + val, 0);
  
  // Simulated portfolio growth (based on property metrics)
  const avgAppreciation = properties
    .map(p => calculatePropertyValuation(p).appreciationRate)
    .reduce((sum, rate) => sum + rate, 0) / properties.length;
  
  const portfolioGrowth = avgAppreciation;
  
  // Liquidity ratio
  const liquidAssets = properties.filter(p => 
    p.propertyType === 'residential' && (p.currentValue || 0) < 500000
  ).length;
  const liquidityRatio = liquidAssets / properties.length;
  
  // Performance score (composite)
  const performanceScore = Math.round(
    diversificationScore * 0.3 +
    (100 - concentrationRisk) * 0.2 +
    (100 - geoHHI * 100) * 0.2 +
    Math.min(100, portfolioGrowth * 1000) * 0.3
  );
  
  return {
    portfolioValue: Math.round(portfolioValue),
    portfolioGrowth: Math.round(portfolioGrowth * 100) / 100,
    diversificationScore: Math.max(0, Math.min(100, diversificationScore)),
    concentrationRisk: Math.max(0, Math.min(100, concentrationRisk)),
    leverageRatio: 0.65, // Simulated average leverage
    liquidityRatio: Math.round(liquidityRatio * 100) / 100,
    performanceScore: Math.max(0, Math.min(100, performanceScore))
  };
}

// Market Analysis Algorithm
export function analyzeMarket(properties: any[], location?: string): MarketAnalysis {
  if (properties.length === 0) {
    return {
      medianPrice: 0,
      averagePrice: 0,
      priceGrowth: 0,
      inventory: 0,
      daysOnMarket: 90,
      absorption: 0,
      marketTrend: 'stable',
      competitiveIndex: 50
    };
  }
  
  const prices = properties.map(p => p.currentValue || 0).filter(p => p > 0);
  const sortedPrices = prices.sort((a, b) => a - b);
  
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Simulated market metrics
  const priceGrowth = 0.05 + (Math.random() - 0.5) * 0.1; // 0-10% growth
  const inventory = properties.length;
  const daysOnMarket = 60 + Math.random() * 60; // 60-120 days
  const absorption = Math.max(0.1, Math.min(2.0, inventory / 100)); // Months of inventory
  
  // Market trend analysis
  let marketTrend: 'bullish' | 'bearish' | 'stable' = 'stable';
  if (priceGrowth > 0.07) marketTrend = 'bullish';
  else if (priceGrowth < 0.02) marketTrend = 'bearish';
  
  // Competitive index (based on price variance)
  const priceVariance = prices.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / prices.length;
  const competitiveIndex = Math.min(100, Math.max(0, 50 + (priceVariance / averagePrice) * 100));
  
  return {
    medianPrice: Math.round(medianPrice),
    averagePrice: Math.round(averagePrice),
    priceGrowth: Math.round(priceGrowth * 100) / 100,
    inventory,
    daysOnMarket: Math.round(daysOnMarket),
    absorption: Math.round(absorption * 100) / 100,
    marketTrend,
    competitiveIndex: Math.round(competitiveIndex)
  };
}

// Property Image Generator
export function getPropertyImage(propertyType: string, value?: number): string {
  const baseUrl = 'https://images.unsplash.com';
  
  const imageCategories = {
    residential: [
      `${baseUrl}/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop`, // Modern house
      `${baseUrl}/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop`, // Beautiful home
      `${baseUrl}/photo-1605146769289-440113cc3d00?w=800&h=600&fit=crop`, // Luxury house
      `${baseUrl}/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop`, // Contemporary home
      `${baseUrl}/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop`, // Modern architecture
    ],
    commercial: [
      `${baseUrl}/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop`, // Office building
      `${baseUrl}/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop`, // Modern office
      `${baseUrl}/photo-1497366216548-37526070297c?w=800&h=600&fit=crop`, // Business center
      `${baseUrl}/photo-1554469384-e58fac16e23a?w=800&h=600&fit=crop`, // Corporate building
      `${baseUrl}/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop`, // Commercial complex
    ],
    industrial: [
      `${baseUrl}/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop`, // Warehouse
      `${baseUrl}/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop`, // Industrial facility
      `${baseUrl}/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop`, // Factory
      `${baseUrl}/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop`, // Industrial complex
    ],
    land: [
      `${baseUrl}/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop`, // Open land
      `${baseUrl}/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop`, // Development land
      `${baseUrl}/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop`, // Rural land
    ]
  };
  
  const type = propertyType.toLowerCase() as keyof typeof imageCategories;
  const images = imageCategories[type] || imageCategories.residential;
  
  // Select image based on property value for consistency
  const index = value ? Math.abs(value) % images.length : Math.floor(Math.random() * images.length);
  return images[index];
}

// Format currency for display
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

// Format percentage for display
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
} 