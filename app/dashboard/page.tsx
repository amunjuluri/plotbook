"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Search, 
  Filter,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  Download,
  Bookmark,
  BarChart3,
  ChevronDown,
  FileText,
  X
} from "lucide-react";
import { MapSearch, PropertyLocation } from "@/components/MapSearch";

interface PropertyOwnership {
  id: string;
  address: string;
  propertyValue: number;
  propertyType: string;
  squareFootage: number;
  yearBuilt: number;
  lastSaleDate: string;
  lastSalePrice: number;
  location: PropertyLocation;
  owner: PropertyOwner;
  taxAssessment: number;
}

interface PropertyOwner {
  id: string;
  name: string;
  type: 'individual' | 'entity' | 'trust' | 'corporation';
  estimatedNetWorth: number;
  netWorthConfidence: number;
  lastUpdated: string;
  businessAffiliations: string[];
  wealthSources: {
    realEstate: number;
    securities: number;
    business: number;
    other: number;
  };
  riskProfile: 'low' | 'medium' | 'high';
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  permissions: string[];
}

type SearchType = 'address' | 'owner' | 'characteristics';
type ViewMode = 'map' | 'list' | 'analytics';

export default function WealthMapDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOwnership | null>(null);
  const [searchType, setSearchType] = useState<SearchType>('address');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [properties, setProperties] = useState<PropertyOwnership[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Mock data for demonstration - keeping as fallback
  const mockProperties: PropertyOwnership[] = [
    {
      id: '1',
      address: '1847 Billionaire Row, Manhattan, NY',
      propertyValue: 45000000,
      propertyType: 'Luxury Penthouse',
      squareFootage: 8500,
      yearBuilt: 2019,
      lastSaleDate: '2021-03-15',
      lastSalePrice: 42000000,
      location: { latitude: 40.7589, longitude: -73.9851 },
      taxAssessment: 38000000,
      owner: {
        id: 'o1',
        name: 'John Richardson',
        type: 'individual',
        estimatedNetWorth: 2400000000,
        netWorthConfidence: 87,
        lastUpdated: '2024-01-15',
        businessAffiliations: ['Richardson Capital Management', 'TechVentures LLC'],
        wealthSources: {
          realEstate: 15,
          securities: 60,
          business: 20,
          other: 5
        },
        riskProfile: 'low'
      }
    },
    {
      id: '2',
      address: '500 Park Avenue, Manhattan, NY',
      propertyValue: 28000000,
      propertyType: 'Luxury Condo',
      squareFootage: 6200,
      yearBuilt: 2016,
      lastSaleDate: '2020-11-22',
      lastSalePrice: 26500000,
      location: { latitude: 40.7614, longitude: -73.9776 },
      taxAssessment: 25000000,
      owner: {
        id: 'o2',
        name: 'Global Dynamics Corp',
        type: 'corporation',
        estimatedNetWorth: 850000000,
        netWorthConfidence: 72,
        lastUpdated: '2024-01-10',
        businessAffiliations: ['Fortune 500', 'NYSE: GDC'],
        wealthSources: {
          realEstate: 25,
          securities: 10,
          business: 60,
          other: 5
        },
        riskProfile: 'medium'
      }
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/signin");
          return;
        }
        // Mock user data - replace with actual API call
        setUser({
          id: session.data.user.id,
          name: session.data.user.name || 'Unknown User',
          email: session.data.user.email || '',
          role: session.data.user.role || 'user',
          company: 'Fountane Analytics',
          permissions: ['view_properties', 'view_wealth_data', 'export_data']
        });
        setProperties(mockProperties);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Load sample properties initially
  useEffect(() => {
    if (properties.length === 0) {
      setProperties(mockProperties);
    }
  }, [properties.length, mockProperties]);

  const handlePropertySelect = (location: PropertyLocation) => {
    const property = properties.find(p => 
      Math.abs(p.location.latitude - location.latitude) < 0.001 &&
      Math.abs(p.location.longitude - location.longitude) < 0.001
    );
    setSelectedProperty(property || null);
    if (property) {
      setShowPropertyDetails(true);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Build search parameters based on search type
      const searchParams = new URLSearchParams();
      
      if (searchType === 'address') {
        searchParams.append('address', searchQuery);
      } else if (searchType === 'owner') {
        // For owner search, we'll search by city/state and then filter by owner name
        searchParams.append('city', searchQuery);
        searchParams.append('limit', '20');
      } else if (searchType === 'characteristics') {
        // For characteristics search, parse common terms
        const query = searchQuery.toLowerCase();
        if (query.includes('luxury') || query.includes('expensive')) {
          searchParams.append('minValue', '1000000');
        }
        if (query.includes('condo')) {
          searchParams.append('propertyType', 'Condo');
        } else if (query.includes('house') || query.includes('home')) {
          searchParams.append('propertyType', 'Single Family');
        }
        searchParams.append('limit', '20');
      }

      // Add filter parameters if available
      const response = await fetch(`/api/properties/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
        console.log(`Found ${data.properties.length} properties`);
      } else {
        // Fallback to mock data if no results
        setProperties(mockProperties);
        setSearchError('No properties found. Showing sample data.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      // Fallback to mock data
      setProperties(mockProperties);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleBookmark = (propertyId: string) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(propertyId)) {
        newBookmarks.delete(propertyId);
      } else {
        newBookmarks.add(propertyId);
      }
      return newBookmarks;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNetWorth = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else {
      return formatCurrency(amount);
    }
  };

  if (loading) {
    return (
      <DashboardLayout fullHeight>
        <div className="h-full relative">
          <Skeleton className="h-full w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullHeight>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Mobile-First Header */}
        <div className="bg-white border-b border-gray-200 relative z-50">
          {/* Mobile Header */}
          <div className="lg:hidden px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 ml-12">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Wealth Map</h1>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    {user?.company}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* User Avatar */}
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mobile View Mode Toggle */}
            <div className="mt-3 flex bg-gray-100 rounded-lg p-1 w-full">
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className={`flex-1 text-xs ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex-1 text-xs ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <FileText className="h-3 w-3 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                className={`flex-1 text-xs ${viewMode === 'analytics' ? 'bg-white shadow-sm' : ''}`}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex px-6 py-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Wealth Map</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {user?.company}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 text-xs ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Map
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-xs ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                  className={`px-3 py-1 text-xs ${viewMode === 'analytics' ? 'bg-white shadow-sm' : ''}`}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Search and Filters */}
        <div className="bg-white border-b border-gray-200">
          {/* Mobile Search */}
          <div className="lg:hidden px-4 py-3 space-y-3">
            {/* Search Type Selector - Mobile */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-full">
              <Button
                variant={searchType === 'address' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchType('address')}
                className={`flex-1 text-xs ${searchType === 'address' ? 'bg-white shadow-sm' : ''}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Address
              </Button>
              <Button
                variant={searchType === 'owner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchType('owner')}
                className={`flex-1 text-xs ${searchType === 'owner' ? 'bg-white shadow-sm' : ''}`}
              >
                <User className="h-3 w-3 mr-1" />
                Owner
              </Button>
              <Button
                variant={searchType === 'characteristics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchType('characteristics')}
                className={`flex-1 text-xs ${searchType === 'characteristics' ? 'bg-white shadow-sm' : ''}`}
              >
                <Building2 className="h-3 w-3 mr-1" />
                Property
              </Button>
            </div>

            {/* Search Input - Mobile */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={
                  searchType === 'address' ? "Search by address..." :
                  searchType === 'owner' ? "Search by owner..." :
                  "Search by property features..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
            )}

            {/* Filter and Action Buttons - Mobile */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              <Button 
                onClick={handleSearch} 
                className="px-6 bg-blue-600 hover:bg-blue-700"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-3 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Value</label>
                      <Input placeholder="$0" className="text-sm h-9" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Value</label>
                      <Input placeholder="No limit" className="text-sm h-9" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 h-9">
                        <option value="">All Types</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Owner Type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 h-9">
                        <option value="">All Owners</option>
                        <option value="individual">Individual</option>
                        <option value="corporation">Corporation</option>
                        <option value="trust">Trust</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:block px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Search Type Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={searchType === 'address' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchType('address')}
                  className={`px-3 py-1 text-xs ${searchType === 'address' ? 'bg-white shadow-sm' : ''}`}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Address
                </Button>
                <Button
                  variant={searchType === 'owner' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchType('owner')}
                  className={`px-3 py-1 text-xs ${searchType === 'owner' ? 'bg-white shadow-sm' : ''}`}
                >
                  <User className="h-3 w-3 mr-1" />
                  Owner
                </Button>
                <Button
                  variant={searchType === 'characteristics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchType('characteristics')}
                  className={`px-3 py-1 text-xs ${searchType === 'characteristics' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Property
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={
                      searchType === 'address' ? "Search by address or location..." :
                      searchType === 'owner' ? "Search by owner name or entity..." :
                      "Search by property type, value, characteristics..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Saved ({bookmarks.size})
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  onClick={handleSearch} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Desktop Search Error */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'map' && (
            <>
              {/* Mobile Map View */}
              <div className="lg:hidden flex-1 relative">
                <MapSearch 
                  onLocationSelect={handlePropertySelect} 
                  selectedLocation={selectedProperty?.location}
                  showMapOnly={true}
                  showFloatingSearch={false}
                  properties={properties.map(p => p.location)}
                />
                
                {/* Mobile Property Details Bottom Sheet */}
                <AnimatePresence>
                  {selectedProperty && showPropertyDetails && (
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl max-h-[70vh] overflow-y-auto z-40"
                    >
                      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Property Details</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPropertyDetails(false)}
                          className="rounded-full p-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="p-4">
                        <MobilePropertyDetails 
                          property={selectedProperty}
                          isBookmarked={bookmarks.has(selectedProperty.id)}
                          onToggleBookmark={() => toggleBookmark(selectedProperty.id)}
                          formatCurrency={formatCurrency}
                          formatNetWorth={formatNetWorth}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Property Button */}
                {selectedProperty && !showPropertyDetails && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-4 left-4 right-4 z-30"
                  >
                    <Button
                      onClick={() => setShowPropertyDetails(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow-lg"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View Property Details
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Desktop Map + Sidebar */}
              <div className="hidden lg:flex flex-1">
                <div className="flex-1 relative">
                  <MapSearch 
                    onLocationSelect={handlePropertySelect} 
                    selectedLocation={selectedProperty?.location}
                    showMapOnly={true}
                    showFloatingSearch={false}
                    properties={properties.map(p => p.location)}
                  />
                </div>

                {/* Desktop Property Details Panel */}
                {selectedProperty && (
                  <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                    <DesktopPropertyDetails 
                      property={selectedProperty}
                      isBookmarked={bookmarks.has(selectedProperty.id)}
                      onToggleBookmark={() => toggleBookmark(selectedProperty.id)}
                      formatCurrency={formatCurrency}
                      formatNetWorth={formatNetWorth}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {/* Mobile List View */}
              <div className="lg:hidden p-4 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <MobilePropertyCard
                      key={property.id}
                      property={property}
                      isBookmarked={bookmarks.has(property.id)}
                      onToggleBookmark={() => toggleBookmark(property.id)}
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowPropertyDetails(true);
                      }}
                      formatCurrency={formatCurrency}
                      formatNetWorth={formatNetWorth}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop List View */}
              <div className="hidden lg:block p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Property Listings</h2>
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <Card key={property.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-6" onClick={() => setSelectedProperty(property)}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                                <Badge variant="secondary">{property.propertyType}</Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(property.propertyValue)}</div>
                                  <div className="text-sm text-gray-500">Property Value</div>
                                </div>
                                <div>
                                  <div className="text-xl font-semibold text-blue-600">{formatNetWorth(property.owner.estimatedNetWorth)}</div>
                                  <div className="text-sm text-gray-500">Owner Net Worth</div>
                                </div>
                                <div>
                                  <div className="text-lg font-medium text-gray-900">{property.owner.name}</div>
                                  <div className="text-sm text-gray-500 capitalize">{property.owner.type}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{property.squareFootage.toLocaleString()} sq ft</span>
                                <span>Built {property.yearBuilt}</span>
                                <span>Confidence: {property.owner.netWorthConfidence}%</span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(property.id);
                              }}
                              className="rounded-full"
                            >
                              <Bookmark className={`h-4 w-4 ${bookmarks.has(property.id) ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'analytics' && (
            <div className="flex-1 overflow-y-auto">
              {/* Mobile Analytics */}
              <div className="lg:hidden p-4 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                
                {/* Mobile Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-gray-900">{properties.length}</div>
                      <div className="text-xs text-gray-500">Properties</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(properties.reduce((sum, p) => sum + p.propertyValue, 0))}
                      </div>
                      <div className="text-xs text-gray-500">Total Value</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {formatNetWorth(properties.reduce((sum, p) => sum + p.owner.estimatedNetWorth, 0) / properties.length)}
                      </div>
                      <div className="text-xs text-gray-500">Avg Net Worth</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(properties.reduce((sum, p) => sum + p.propertyValue, 0) / properties.length)}
                      </div>
                      <div className="text-xs text-gray-500">Avg Property Value</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile Charts */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Property Value Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-gray-500">Chart placeholder</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Owner Net Worth Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-gray-500">Chart placeholder</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Desktop Analytics */}
              <div className="hidden lg:block p-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Building2 className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
                            <div className="text-sm text-gray-500">Properties</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(properties.reduce((sum, p) => sum + p.propertyValue, 0))}
                            </div>
                            <div className="text-sm text-gray-500">Total Value</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNetWorth(properties.reduce((sum, p) => sum + p.owner.estimatedNetWorth, 0) / properties.length)}
                            </div>
                            <div className="text-sm text-gray-500">Avg Net Worth</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <BarChart3 className="h-8 w-8 text-orange-600" />
                          <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(properties.reduce((sum, p) => sum + p.propertyValue, 0) / properties.length)}
                            </div>
                            <div className="text-sm text-gray-500">Avg Property Value</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts placeholder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Property Value Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">Chart placeholder - Property value distribution</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Owner Net Worth Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">Chart placeholder - Net worth analysis</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Mobile Property Details Component
function MobilePropertyDetails({ 
  property, 
  isBookmarked, 
  onToggleBookmark, 
  formatCurrency, 
  formatNetWorth 
}: {
  property: PropertyOwnership;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  formatCurrency: (amount: number) => string;
  formatNetWorth: (amount: number) => string;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{property.address}</h2>
          <Badge variant="secondary" className="mb-2">{property.propertyType}</Badge>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(property.propertyValue)}</div>
          <div className="text-sm text-gray-500">Property Value</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleBookmark}
          className="rounded-full p-2"
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
        </Button>
      </div>

      {/* Property Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Size</span>
            <div className="font-medium">{property.squareFootage.toLocaleString()} sq ft</div>
          </div>
          <div>
            <span className="text-gray-600">Built</span>
            <div className="font-medium">{property.yearBuilt}</div>
          </div>
          <div>
            <span className="text-gray-600">Last Sale</span>
            <div className="font-medium">{formatCurrency(property.lastSalePrice)}</div>
          </div>
          <div>
            <span className="text-gray-600">Tax Assessment</span>
            <div className="font-medium">{formatCurrency(property.taxAssessment)}</div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{property.owner.name}</h3>
          <Badge variant="outline" className="text-xs capitalize">
            {property.owner.type}
          </Badge>
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              property.owner.riskProfile === 'low' ? 'bg-green-100 text-green-700' :
              property.owner.riskProfile === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}
          >
            {property.owner.riskProfile} risk
          </Badge>
        </div>

        {/* Net Worth */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Estimated Net Worth</span>
            <span className="text-xl font-bold text-blue-900">{formatNetWorth(property.owner.estimatedNetWorth)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>Confidence: {property.owner.netWorthConfidence}%</span>
            <span>Updated: {new Date(property.owner.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Wealth Sources */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Wealth Sources</h4>
          <div className="space-y-2">
            {Object.entries(property.owner.wealthSources).map(([source, percentage]) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-600">{source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-900 w-8">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Affiliations */}
        {property.owner.businessAffiliations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Business Affiliations</h4>
            <div className="flex flex-wrap gap-1">
              {property.owner.businessAffiliations.map((affiliation, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {affiliation}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Desktop Property Details Component
function DesktopPropertyDetails({ 
  property, 
  isBookmarked, 
  onToggleBookmark, 
  formatCurrency, 
  formatNetWorth 
}: {
  property: PropertyOwnership;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  formatCurrency: (amount: number) => string;
  formatNetWorth: (amount: number) => string;
}) {
  return (
    <div className="h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{property.address}</h2>
            <Badge variant="secondary" className="mb-2">{property.propertyType}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleBookmark}
            className="rounded-full"
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
          </Button>
        </div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(property.propertyValue)}</div>
        <div className="text-sm text-gray-500">Property Value</div>
      </div>

      {/* Property Details */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Square Footage</span>
            <span className="text-sm font-medium">{property.squareFootage.toLocaleString()} sq ft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Year Built</span>
            <span className="text-sm font-medium">{property.yearBuilt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Last Sale</span>
            <span className="text-sm font-medium">{formatCurrency(property.lastSalePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax Assessment</span>
            <span className="text-sm font-medium">{formatCurrency(property.taxAssessment)}</span>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Owner Information</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-base font-medium text-gray-900">{property.owner.name}</div>
              <Badge variant="outline" className="text-xs capitalize">
                {property.owner.type}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  property.owner.riskProfile === 'low' ? 'bg-green-100 text-green-700' :
                  property.owner.riskProfile === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {property.owner.riskProfile} risk
              </Badge>
            </div>
          </div>

          {/* Net Worth */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-900">Estimated Net Worth</span>
              <span className="text-lg font-bold text-blue-900">{formatNetWorth(property.owner.estimatedNetWorth)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span>Confidence: {property.owner.netWorthConfidence}%</span>
              <span>Updated: {new Date(property.owner.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Wealth Composition */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Wealth Sources</h4>
            <div className="space-y-2">
              {Object.entries(property.owner.wealthSources).map(([source, percentage]) => (
                <div key={source} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-gray-600">{source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Affiliations */}
          {property.owner.businessAffiliations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Business Affiliations</h4>
              <div className="space-y-1">
                {property.owner.businessAffiliations.map((affiliation, index) => (
                  <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                    {affiliation}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Property Card Component
function MobilePropertyCard({
  property,
  isBookmarked,
  onToggleBookmark,
  onClick,
  formatCurrency,
  formatNetWorth
}: {
  property: PropertyOwnership;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  formatNetWorth: (amount: number) => string;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{property.address}</h3>
            <Badge variant="secondary" className="text-xs">{property.propertyType}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className="rounded-full p-1"
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-400'}`} />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(property.propertyValue)}</div>
            <div className="text-xs text-gray-500">Property Value</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{formatNetWorth(property.owner.estimatedNetWorth)}</div>
            <div className="text-xs text-gray-500">Owner Net Worth</div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{property.owner.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="capitalize">{property.owner.type}</span>
            <span>•</span>
            <span>{property.squareFootage.toLocaleString()} sq ft</span>
            <span>•</span>
            <span>{property.owner.netWorthConfidence}% confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 