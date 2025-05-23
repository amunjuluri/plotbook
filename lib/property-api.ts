/**
 * RentCast Property Data API Service
 * Provides access to 140+ million US property records
 */

// API Configuration
const RENTCAST_API_URL = 'https://api.rentcast.io/v1';
const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || '';

// Types for RentCast API responses
export interface PropertyRecord {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  
  // Property Details
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  stories?: number;
  
  // Financial Information
  taxAssessments?: {
    year: number;
    value: number;
    landValue?: number;
    improvementValue?: number;
  }[];
  lastSaleDate?: string;
  lastSalePrice?: number;
  
  // Owner Information
  owner?: {
    names?: string[];
    mailingAddress?: {
      addressLine1: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  
  // Additional Features
  features?: string[];
  heating?: string;
  cooling?: string;
  parking?: string;
  pool?: boolean;
  fireplace?: boolean;
}

export interface PropertyValuation {
  value?: number;
  valueHigh?: number;
  valueLow?: number;
  rentValue?: number;
  rentValueHigh?: number;
  rentValueLow?: number;
  comparables?: Array<{
    id: string;
    formattedAddress: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    distanceFromSubject: number;
    price?: number;
    listDate?: string;
  }>;
}

export interface PropertySearchParams {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  radius?: number; // in miles
  propertyType?: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Apartment' | 'Commercial';
  minValue?: number;
  maxValue?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareFootage?: number;
  maxSquareFootage?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  limit?: number;
  offset?: number;
}

class PropertyAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'PropertyAPIError';
  }
}

/**
 * RentCast Property API Service
 */
export class PropertyAPI {
  private baseURL = RENTCAST_API_URL;
  private apiKey = RENTCAST_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('RentCast API key not found. Please set RENTCAST_API_KEY environment variable.');
    }
  }

  /**
   * Make authenticated request to RentCast API
   */
  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const headers: HeadersInit = {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PropertyAPIError(
          errorData.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PropertyAPIError) {
        throw error;
      }
      throw new PropertyAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search properties by address or location criteria
   */
  async searchProperties(params: PropertySearchParams): Promise<PropertyRecord[]> {
    try {
      const response = await this.makeRequest<PropertyRecord[]>('/properties', {
        address: params.address,
        city: params.city,
        state: params.state,
        zipCode: params.zipCode,
        radius: params.radius,
        propertyType: params.propertyType,
        minValue: params.minValue,
        maxValue: params.maxValue,
        minBedrooms: params.minBedrooms,
        maxBedrooms: params.maxBedrooms,
        minBathrooms: params.minBathrooms,
        maxBathrooms: params.maxBathrooms,
        minSquareFootage: params.minSquareFootage,
        maxSquareFootage: params.maxSquareFootage,
        minYearBuilt: params.minYearBuilt,
        maxYearBuilt: params.maxYearBuilt,
        limit: params.limit || 10,
        offset: params.offset || 0,
      });

      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  /**
   * Get property details by ID
   */
  async getPropertyById(id: string): Promise<PropertyRecord | null> {
    try {
      const response = await this.makeRequest<PropertyRecord>(`/properties/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching property by ID:', error);
      return null;
    }
  }

  /**
   * Get property valuation estimates
   */
  async getPropertyValuation(params: {
    address?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    radius?: number;
  }): Promise<PropertyValuation | null> {
    try {
      const response = await this.makeRequest<PropertyValuation>('/avm/value', params);
      return response;
    } catch (error) {
      console.error('Error getting property valuation:', error);
      return null;
    }
  }

  /**
   * Get rent estimate for a property
   */
  async getRentEstimate(params: {
    address?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    radius?: number;
  }): Promise<PropertyValuation | null> {
    try {
      const response = await this.makeRequest<PropertyValuation>('/avm/rent/long-term', params);
      return response;
    } catch (error) {
      console.error('Error getting rent estimate:', error);
      return null;
    }
  }

  /**
   * Enhanced property search with valuation data
   */
  async searchPropertiesWithValuation(params: PropertySearchParams): Promise<Array<PropertyRecord & { valuation?: PropertyValuation }>> {
    try {
      const properties = await this.searchProperties(params);
      
      // Get valuations for properties (in batches to avoid rate limits)
      const propertiesWithValuation = await Promise.all(
        properties.slice(0, 5).map(async (property) => { // Limit to 5 for API efficiency
          try {
            const valuation = await this.getPropertyValuation({
              address: property.formattedAddress,
              propertyType: property.propertyType,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              squareFootage: property.squareFootage,
            });
            
            return { ...property, valuation };
          } catch (error) {
            console.error(`Error getting valuation for ${property.formattedAddress}:`, error);
            return property;
          }
        })
      );

      return propertiesWithValuation;
    } catch (error) {
      console.error('Error searching properties with valuation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const propertyAPI = new PropertyAPI();

// Helper function to format currency
export const formatPropertyValue = (value: number | undefined): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to estimate net worth from property ownership
export const estimateOwnerNetWorth = (properties: PropertyRecord[]): number => {
  const totalPropertyValue = properties.reduce((sum, property) => {
    const latestAssessment = property.taxAssessments?.[0]?.value || property.lastSalePrice || 0;
    return sum + latestAssessment;
  }, 0);
  
  // Rough estimate: property value represents 20-40% of total net worth for high-net-worth individuals
  return totalPropertyValue * 3; // Conservative 33% assumption
}; 