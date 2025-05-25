'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  X, 
  MapPin, 
  Building, 
  DollarSign, 
  Calendar, 
  User, 
  Users, 
  TrendingUp, 
  Home, 
  Bed, 
  Bath, 
  Square, 
  Ruler, 
  Phone, 
  Mail, 
  MapIcon,
  Clock,
  FileText,
  ArrowUpDown,
  Building2,
  Briefcase,
  ExternalLink,
  Copy,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Droplets,
  Zap,
  AlertTriangle,
  Target,
  TrendingDown
} from "lucide-react";
import { 
  calculatePropertyValuation, 
  analyzeOwnerPortfolio, 
  getPropertyImage, 
  formatCurrency, 
  formatPercentage,
  type PropertyMetrics,
  type OwnershipAnalysis
} from "@/utils/propertyAnalytics";

interface PropertyOwnership {
  id: string;
  ownershipType: string;
  ownershipPercent: number;
  startDate: string;
  owner: {
    id: string;
    name: string;
    type: string;
    estimatedNetWorth?: number;
    occupation?: string;
    employer?: string;
    industry?: string;
    email?: string;
    phone?: string;
    mailingAddress?: string;
  };
}

interface PropertyTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  buyerName: string;
  sellerName: string;
  documentType?: string;
  recordingDate?: string;
  formattedAmount: string;
}

interface DetailedProperty {
  id: string;
  address: string;
  streetNumber?: string;
  streetName?: string;
  unit?: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  buildingType?: string;
  yearBuilt?: number;
  propertyAge?: number;
  squareFootage?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  currentValue?: number;
  assessedValue?: number;
  taxAmount?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  pricePerSqFt?: number;
  formattedCurrentValue: string;
  formattedAssessedValue: string;
  formattedTaxAmount: string;
  formattedLastSalePrice: string;
  location: {
    state: string;
    stateCode: string;
    county: string;
    city: string;
    countyInfo?: {
      fipsCode: string;
      population?: number;
      medianIncome?: number;
    };
    cityInfo?: {
      population?: number;
      medianIncome?: number;
      zipCodes: string[];
    };
  };
  ownerships: PropertyOwnership[];
  transactions: PropertyTransaction[];
  dataSource?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

interface PropertyDetailPanelProps {
  propertyId: string | null;
  onClose: () => void;
  isOpen: boolean;
}

export function PropertyDetailPanel({ propertyId, onClose, isOpen }: PropertyDetailPanelProps) {
  const [property, setProperty] = useState<DetailedProperty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Phase 1: Basic analytics only
  const [propertyImage, setPropertyImage] = useState<string>('');
  const [basicValue, setBasicValue] = useState<number>(0);

  useEffect(() => {
    if (propertyId && isOpen) {
      fetchPropertyDetails();
    } else {
      // Clear property data when panel is closed
      setProperty(null);
      setError(null);
      setCopiedField(null);
      setPropertyImage('');
      setBasicValue(0);
    }
  }, [propertyId, isOpen]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      
      const data = await response.json();
      const propertyData = data.property;
      setProperty(propertyData);
      
      // Phase 1: Simple value calculation
      setBasicValue(propertyData.currentValue || propertyData.assessedValue || 0);
      
      // Set property image
      const image = getPropertyImage(propertyData.propertyType, propertyData.currentValue);
      setPropertyImage(image);
      
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNetWorth = (netWorth?: number) => {
    if (!netWorth) return 'N/A';
    if (netWorth >= 1000000000) {
      return `$${(netWorth / 1000000000).toFixed(1)}B`;
    } else if (netWorth >= 1000000) {
      return `$${(netWorth / 1000000).toFixed(1)}M`;
    } else if (netWorth >= 1000) {
      return `$${(netWorth / 1000).toFixed(0)}K`;
    }
    return `$${netWorth.toLocaleString()}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPropertyTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'residential': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'commercial': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'industrial': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'land': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-[101] overflow-hidden border-l border-gray-100"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-semibold text-gray-900 truncate">
                      Property Details
                    </h1>
                    {property && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPropertyTypeColor(property.propertyType)}`}>
                        {property.propertyType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {property?.address || 'Loading property information...'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50/30">
                <div className="p-8 space-y-8">
                  {loading && (
                    <div className="space-y-6">
                      <Skeleton className="h-48 w-full rounded-xl" />
                      <Skeleton className="h-32 w-full rounded-xl" />
                      <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-red-700 font-medium">Error loading property</p>
                      </div>
                      <p className="text-red-600 text-sm mt-2">{error}</p>
                    </div>
                  )}

                  {property && (
                    <>
                      {/* PHASE 1: Property Hero Section with Image */}
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
                          {propertyImage && (
                            <img 
                              src={propertyImage} 
                              alt={`${property.propertyType} property`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to gradient if image fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="absolute bottom-4 left-6 right-6">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPropertyTypeColor(property.propertyType)}`}>
                                {property.propertyType}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-900">
                                {formatCurrency(basicValue)}
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{property.address}</h2>
                            <p className="text-white/90 text-sm">{property.location.city}, {property.location.stateCode} {property.zipCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* PHASE 1: Basic Property Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Building className="h-4 w-4 text-indigo-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Basic Details */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {property.squareFootage && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <Square className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">Square Feet</p>
                                    <p className="font-semibold text-gray-900">{property.squareFootage.toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                              {property.yearBuilt && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">Year Built</p>
                                    <p className="font-semibold text-gray-900">{property.yearBuilt}</p>
                                  </div>
                                </div>
                              )}
                              {property.bedrooms && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <Bed className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">Bedrooms</p>
                                    <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                                  </div>
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <Bath className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-xs text-gray-500">Bathrooms</p>
                                    <p className="font-semibold text-gray-900">{property.bathrooms}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Financial Information */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 mb-3">Financial Information</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Current Value</span>
                                <span className="font-bold text-gray-900">{property.formattedCurrentValue}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Assessed Value</span>
                                <span className="font-bold text-gray-900">{property.formattedAssessedValue}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Annual Tax</span>
                                <span className="font-bold text-gray-900">{property.formattedTaxAmount}</span>
                              </div>
                              {property.lastSalePrice && (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <span className="text-sm text-gray-600">Last Sale</span>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">{property.formattedLastSalePrice}</p>
                                    {property.lastSaleDate && (
                                      <p className="text-xs text-gray-500">{formatDate(property.lastSaleDate)}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PHASE 1: Location Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Address</p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{property.address}</p>
                              <button
                                onClick={() => copyToClipboard(property.address, 'address')}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Copy address"
                              >
                                {copiedField === 'address' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {property.location.city}, {property.location.stateCode} {property.zipCode}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">County</p>
                              <p className="font-medium text-gray-900">{property.location.county}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coordinates</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs text-gray-900">
                                  {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(`${property.latitude}, ${property.longitude}`, 'coordinates')}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Copy coordinates"
                                >
                                  {copiedField === 'coordinates' ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PHASE 1: Owner Information (Core to Wealth Mapping) */}
                      {property.ownerships.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Property Owners ({property.ownerships.length})
                            </h3>
                          </div>
                          
                          <div className="space-y-4">
                            {property.ownerships.map((ownership, index) => (
                              <div key={ownership.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-gray-900">{ownership.owner.name}</h4>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {ownership.ownershipPercent}% ownership
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      {ownership.owner.type} • {ownership.ownershipType} ownership
                                    </p>
                                  </div>
                                  {ownership.owner.estimatedNetWorth && (
                                    <div className="text-right">
                                      <p className="text-xs text-gray-500 mb-1">Est. Net Worth</p>
                                      <p className="font-bold text-green-600">
                                        {formatNetWorth(ownership.owner.estimatedNetWorth)}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Basic Owner Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {ownership.owner.occupation && (
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-500">Occupation:</span>
                                      <span className="text-gray-900 truncate">{ownership.owner.occupation}</span>
                                    </div>
                                  )}
                                  {ownership.owner.employer && (
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-500">Employer:</span>
                                      <span className="text-gray-900 truncate">{ownership.owner.employer}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-500">
                                    Owner since {formatDate(ownership.startDate)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PHASE 1: Basic Data Info */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Property Data</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Data Source</p>
                            <p className="font-medium text-gray-900">{property.dataSource || 'Public Records'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                            <p className="font-medium text-gray-900">{formatDate(property.updatedAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Property ID</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs text-gray-900 truncate">{property.id.slice(0, 8)}...</p>
                              <button
                                onClick={() => copyToClipboard(property.id, 'propertyId')}
                                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                title="Copy property ID"
                              >
                                {copiedField === 'propertyId' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PHASE 2/3: Advanced Analytics (Commented out for now) */}
                      {/*
                      TODO: Add back for Phase 2 if time permits:
                      - Advanced valuation analytics
                      - Risk scoring
                      - Market intelligence
                      - Investment metrics
                      - Portfolio analysis
                      - Transaction history
                      */}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 