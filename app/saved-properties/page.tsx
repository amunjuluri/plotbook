'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Filter, Tag, MapPin, Building, DollarSign, Square, Bed, Bath, Calendar, User, Trash2, Edit, Eye, Grid3X3, List, SortAsc, SortDesc, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSavedProperties, SavedProperty } from '@/hooks/useSavedProperties';
import { SavePropertyButton } from '@/components/SavePropertyButton';
import { PropertyDetailPanel } from '@/components/PropertyDetailPanel';
import { PropertyLocation } from '@/components/EnhancedMapSearch';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReportBuilderDialog } from '@/components/ReportBuilderDialog';

export default function SavedPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all-tags');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'address'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { 
    savedProperties, 
    availableTags, 
    loading, 
    error, 
    fetchSavedProperties,
    removeSavedProperty 
  } = useSavedProperties();

  // Fetch saved properties on component mount
  useEffect(() => {
    fetchSavedProperties();
  }, [fetchSavedProperties]);

  // Filter and sort properties
  const filteredAndSortedProperties = React.useMemo(() => {
    let filtered = savedProperties;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sp => 
        sp.property.address.toLowerCase().includes(query) ||
        sp.property.city?.toLowerCase().includes(query) ||
        sp.property.state.toLowerCase().includes(query) ||
        sp.notes?.toLowerCase().includes(query) ||
        sp.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by tag
    if (selectedTag && selectedTag !== 'all-tags') {
      filtered = filtered.filter(sp => sp.tags.includes(selectedTag));
    }

    // Sort properties
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'value':
          comparison = (a.property.currentValue || 0) - (b.property.currentValue || 0);
          break;
        case 'address':
          comparison = a.property.address.localeCompare(b.property.address);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [savedProperties, searchQuery, selectedTag, sortBy, sortOrder]);

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openPropertyDetail = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowDetailPanel(true);
  };

  const closePropertyDetail = () => {
    setSelectedPropertyId(null);
    setShowDetailPanel(false);
  };

  const convertToPropertyLocation = (savedProperty: SavedProperty): PropertyLocation => {
    return {
      id: savedProperty.property.id,
      latitude: savedProperty.property.latitude,
      longitude: savedProperty.property.longitude,
      address: savedProperty.property.address,
      propertyType: savedProperty.property.propertyType,
      currentValue: savedProperty.property.currentValue || 0,
      formattedValue: formatPrice(savedProperty.property.currentValue),
      squareFootage: savedProperty.property.squareFootage || undefined,
      bedrooms: savedProperty.property.bedrooms || undefined,
      bathrooms: savedProperty.property.bathrooms || undefined,
      city: savedProperty.property.city || '',
      state: savedProperty.property.state,
      stateCode: savedProperty.property.stateCode,
      title: savedProperty.property.address,
      description: `${savedProperty.property.propertyType} • ${formatPrice(savedProperty.property.currentValue)}`,
      yearBuilt: savedProperty.property.yearBuilt || undefined
    };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white fill-current" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
                    <p className="text-gray-600">
                      {savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved
                    </p>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowReportDialog(true)}
                    disabled={savedProperties.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </Button>
                  
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search saved properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tag Filter */}
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-tags">All tags</SelectItem>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="address">Address</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading saved properties...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Properties</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => fetchSavedProperties()}>
                Try Again
              </Button>
            </div>
          ) : filteredAndSortedProperties.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {savedProperties.length === 0 ? 'No Saved Properties' : 'No Properties Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {savedProperties.length === 0 
                  ? 'Start exploring properties and save the ones you\'re interested in.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {searchQuery || (selectedTag && selectedTag !== 'all-tags') ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('all-tags');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredAndSortedProperties.map((savedProperty, index) => (
                    <motion.div
                      key={savedProperty.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      {/* Property Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                              {savedProperty.property.address}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2">
                              {savedProperty.property.city}, {savedProperty.property.stateCode}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                {formatPrice(savedProperty.property.currentValue)}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                                {savedProperty.property.propertyType}
                              </span>
                            </div>
                          </div>
                          <SavePropertyButton
                            property={convertToPropertyLocation(savedProperty)}
                            variant="icon"
                            size="sm"
                            showText={false}
                          />
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-4">
                        {savedProperty.property.squareFootage || savedProperty.property.bedrooms || savedProperty.property.bathrooms ? (
                          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                            {savedProperty.property.squareFootage && (
                              <div className="flex items-center gap-1">
                                <Square className="h-3 w-3" />
                                {savedProperty.property.squareFootage.toLocaleString()} sq ft
                              </div>
                            )}
                            {savedProperty.property.bedrooms && (
                              <div className="flex items-center gap-1">
                                <Bed className="h-3 w-3" />
                                {savedProperty.property.bedrooms}
                              </div>
                            )}
                            {savedProperty.property.bathrooms && (
                              <div className="flex items-center gap-1">
                                <Bath className="h-3 w-3" />
                                {savedProperty.property.bathrooms}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Notes */}
                        {savedProperty.notes && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                              {savedProperty.notes}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        {savedProperty.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {savedProperty.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Saved Date */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Saved {formatDate(savedProperty.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openPropertyDetail(savedProperty.property.id)}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredAndSortedProperties.map((savedProperty, index) => (
                    <motion.div
                      key={savedProperty.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">
                                {savedProperty.property.address}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {savedProperty.property.city}, {savedProperty.property.stateCode}
                              </p>

                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {formatPrice(savedProperty.property.currentValue)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 capitalize">
                                    {savedProperty.property.propertyType}
                                  </span>
                                </div>
                                {savedProperty.property.squareFootage && (
                                  <div className="flex items-center gap-2">
                                    <Square className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {savedProperty.property.squareFootage.toLocaleString()} sq ft
                                    </span>
                                  </div>
                                )}
                              </div>

                              {savedProperty.notes && (
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                    {savedProperty.notes}
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {savedProperty.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {savedProperty.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  Saved {formatDate(savedProperty.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => openPropertyDetail(savedProperty.property.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <SavePropertyButton
                            property={convertToPropertyLocation(savedProperty)}
                            variant="icon"
                            size="sm"
                            showText={false}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Property Detail Panel */}
        <PropertyDetailPanel
          propertyId={selectedPropertyId}
          isOpen={showDetailPanel}
          onClose={closePropertyDetail}
        />

        {/* Report Builder Dialog */}
        <ReportBuilderDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          savedProperties={savedProperties}
        />
      </div>
    </DashboardLayout>
  );
} 