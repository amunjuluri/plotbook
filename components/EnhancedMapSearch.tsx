'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchIcon, Satellite, Map, User, MapPin, Home, X, Trash2, MoreVertical, Target, Trash, ChevronDown, Building, DollarSign, Bed, Bath, Square, List, Grid3X3, Filter, ChevronUp, SlidersHorizontal, Calendar, TrendingUp, Heart } from "lucide-react";
import { PropertyDetailPanel } from "./PropertyDetailPanel";
import { SavePropertyButton } from "./SavePropertyButton";
import Link from "next/link";

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbmRtdW5qdWx1cmkiLCJhIjoiY21hcGh3cHY4MGdkZjJqczNzaGQwbjRrbiJ9.0Ku8xuOZeSjD7Oojk7L6vQ';

export interface PropertyLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  propertyType: string;
  currentValue: number;
  formattedValue: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  state: string;
  stateCode: string;
  title: string;
  description: string;
  color?: string;
  ownerName?: string;
  yearBuilt?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
}

interface AdvancedFilters {
  propertyTypes: string[];
  priceRange: [number, number];
  sizeRange: [number, number];
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuiltRange: [number, number];
  hasOwnerInfo: boolean;
  sortBy: 'price' | 'size' | 'year' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

interface EnhancedMapSearchProps {
  onPropertySelect?: (property: PropertyLocation) => void;
  onPropertiesChange?: (properties: PropertyLocation[]) => void;
  allowMultiple?: boolean;
  maxPins?: number;
}

export function EnhancedMapSearch({ 
  onPropertySelect, 
  onPropertiesChange,
  allowMultiple = true,
  maxPins = 10
}: EnhancedMapSearchProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const resizeObserver = useRef<ResizeObserver | null>(null);
  
  // State
  const [properties, setProperties] = useState<PropertyLocation[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('satellite');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('address');
  const [searchResults, setSearchResults] = useState<PropertyLocation[]>([]);
  const [showResults, setShowResults] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({
    propertyTypes: [],
    priceRange: [0, 10000000],
    sizeRange: [0, 10000],
    bedrooms: null,
    bathrooms: null,
    yearBuiltRange: [1800, new Date().getFullYear()],
    hasOwnerInfo: false,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Property detail panel state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Generate unique ID for properties
  const generatePropertyId = () => `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Property detail panel handlers
  const openPropertyDetail = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowDetailPanel(true);
  };

  const closePropertyDetail = () => {
    setSelectedPropertyId(null);
    setShowDetailPanel(false);
  };

  // View toggle function
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'map' ? 'list' : 'map');
  };

  // Filter update functions
  const updateFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const togglePropertyType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      propertyTypes: [],
      priceRange: [0, 10000000],
      sizeRange: [0, 10000],
      bedrooms: null,
      bathrooms: null,
      yearBuiltRange: [1800, new Date().getFullYear()],
      hasOwnerInfo: false,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = () => {
    return filters.propertyTypes.length > 0 ||
           filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 ||
           filters.sizeRange[0] > 0 || filters.sizeRange[1] < 10000 ||
           filters.bedrooms !== null ||
           filters.bathrooms !== null ||
           filters.yearBuiltRange[0] > 1800 || filters.yearBuiltRange[1] < new Date().getFullYear() ||
           filters.hasOwnerInfo ||
           filters.sortBy !== 'relevance';
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current || viewMode === 'list') return;
    
    try {
      // Initialize the map centered on US
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4,
        projection: 'globe',
      });
      
      map.current = mapInstance;
      
      // Add controls
      mapInstance.addControl(new mapboxgl.NavigationControl());
      
      // Handle map loading
      mapInstance.on('style.load', () => {
        console.log('Map loaded successfully!');
        
        // Configure the standard style
        mapInstance.setConfigProperty('basemap', 'lightPreset', 'day');
        mapInstance.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        
        // Set fog for better depth perception
        mapInstance.setFog({
          'horizon-blend': 0.3,
          'color': '#f8f0e3',
          'high-color': '#add8e6',
          'space-color': '#d8f2ff',
          'star-intensity': 0.0
        });
      });
      
      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error loading map');
      });

      // Set up ResizeObserver
      if (mapContainer.current) {
        resizeObserver.current = new ResizeObserver(() => {
          if (map.current) {
            setTimeout(() => {
              map.current?.resize();
            }, 100);
          }
        });
        resizeObserver.current.observe(mapContainer.current);
      }
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
    
    // Cleanup
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      
      // Clean up markers with event listeners
      Object.values(markers.current).forEach(marker => {
        if ((marker as any)._cleanup) {
          (marker as any)._cleanup();
        }
        marker.remove();
      });
      markers.current = {};
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [viewMode]);

  // Re-add markers when switching back to map view
  useEffect(() => {
    if (viewMode === 'map' && map.current && properties.length > 0) {
      // Clear existing markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
      
      // Re-add all properties
      properties.forEach(property => {
        addPropertyMarker(property);
      });
    }
  }, [viewMode, properties]);

  // Build search parameters with filters
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    
    // Basic search parameters
    params.append('limit', '50');
    
    // Apply filters
    if (filters.propertyTypes.length > 0) {
      params.append('propertyTypes', filters.propertyTypes.join(','));
    }
    
    if (filters.priceRange[0] > 0) {
      params.append('minPrice', filters.priceRange[0].toString());
    }
    if (filters.priceRange[1] < 10000000) {
      params.append('maxPrice', filters.priceRange[1].toString());
    }
    
    if (filters.sizeRange[0] > 0) {
      params.append('minSquareFootage', filters.sizeRange[0].toString());
    }
    if (filters.sizeRange[1] < 10000) {
      params.append('maxSquareFootage', filters.sizeRange[1].toString());
    }
    
    if (filters.bedrooms !== null) {
      params.append('bedrooms', filters.bedrooms.toString());
    }
    
    if (filters.bathrooms !== null) {
      params.append('bathrooms', filters.bathrooms.toString());
    }
    
    if (filters.yearBuiltRange[0] > 1800) {
      params.append('minYearBuilt', filters.yearBuiltRange[0].toString());
    }
    if (filters.yearBuiltRange[1] < new Date().getFullYear()) {
      params.append('maxYearBuilt', filters.yearBuiltRange[1].toString());
    }
    
    if (filters.hasOwnerInfo) {
      params.append('hasOwnerInfo', 'true');
    }
    
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    
    return params;
  };

  // Search for properties
  const handleSearch = async () => {
    if (!searchQuery.trim() && !hasActiveFilters()) return;
    
    try {
      setLoading(true);
      setShowResults(true); // Show dropdown immediately with loading state
      
      // Search based on active tab
      if (activeTab === 'owner') {
        await handleOwnerSearch();
      } else if (activeTab === 'address') {
        await handleAddressSearch();
      } else if (activeTab === 'characteristics') {
        await handleCharacteristicsSearch();
      }
      
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle owner search - search by owner names in database
  const handleOwnerSearch = async () => {
    try {
      const params = buildSearchParams();
      if (searchQuery.trim()) {
        params.append('ownerSearch', searchQuery);
      }
      
      const response = await fetch(`/api/properties/locations?${params.toString()}`);
      if (!response.ok) throw new Error('Owner search failed');

      const data = await response.json();
      const rawResults = data.properties || [];
      
      if (rawResults.length === 0) {
        console.log('No owner results found, trying address search as fallback...');
        await handleAddressSearchFallback();
        return;
      }
      
      // Group properties by owner
      const ownerGroups = rawResults.reduce((groups: any, property: any) => {
        const ownerName = property.ownerName || 'Unknown Owner';
        if (!groups[ownerName]) {
          groups[ownerName] = {
            ownerName,
            properties: [],
            totalValue: 0,
            propertyCount: 0
          };
        }
        groups[ownerName].properties.push(property);
        groups[ownerName].totalValue += property.currentValue || 0;
        groups[ownerName].propertyCount += 1;
        return groups;
      }, {});
      
      // Convert to search results format - show owners, not individual properties
      const ownerResults = Object.values(ownerGroups).map((group: any) => {
        const firstProperty = group.properties[0];
        const totalValue = group.totalValue;
        const formattedTotalValue = formatPrice(totalValue);
        
        return {
          id: `owner-${group.ownerName.replace(/\s+/g, '-').toLowerCase()}`,
          latitude: firstProperty.latitude,
          longitude: firstProperty.longitude,
          address: group.ownerName,
          propertyType: 'owner',
          currentValue: totalValue,
          formattedValue: formattedTotalValue,
          city: `${group.propertyCount} properties`,
          state: 'Portfolio',
          stateCode: '',
          title: group.ownerName,
          description: `${group.propertyCount} properties • Total value: ${formattedTotalValue}`,
          color: '#8b5cf6',
          ownerName: group.ownerName,
          properties: group.properties
        };
      });
      
      setSearchResults(ownerResults);
      setShowResults(true);
      
    } catch (error) {
      console.error('Owner search error:', error);
      await handleAddressSearchFallback();
    }
  };

  // Handle address search using Mapbox Geocoding
  const handleAddressSearch = async () => {
    try {
      if (searchQuery.trim()) {
        // Enhanced US-only geocoding with additional parameters
        const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5&country=US&types=address,place,region,postcode&autocomplete=true`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Geocoding failed');
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Convert geocoding results to our property format
          const geocodingResults = data.features.map((feature: any) => ({
            id: generatePropertyId(),
            latitude: feature.center[1],
            longitude: feature.center[0],
            address: feature.place_name,
            propertyType: 'location',
            currentValue: 0,
            formattedValue: 'Location Pin',
            city: feature.context?.find((c: any) => c.id.includes('place'))?.text || 'Unknown',
            state: feature.context?.find((c: any) => c.id.includes('region'))?.text || 'Unknown',
            stateCode: feature.context?.find((c: any) => c.id.includes('region'))?.short_code?.replace('US-', '') || 'XX',
            title: feature.place_name,
            description: 'Geocoded location',
            color: '#D2966E'
          }));
          
          setSearchResults(geocodingResults);
          setShowResults(true);
        }
      } else if (hasActiveFilters()) {
        // Search with filters only
        const params = buildSearchParams();
        const response = await fetch(`/api/properties/locations?${params.toString()}`);
        if (!response.ok) throw new Error('Filter search failed');

        const data = await response.json();
        const rawResults = data.properties || [];
        
        const filteredResults = rawResults.map((property: any) => {
          const getPropertyColor = (type: string) => {
            switch (type.toLowerCase()) {
              case 'residential': return '#10b981';
              case 'commercial': return '#3b82f6';
              case 'industrial': return '#f59e0b';
              case 'land': return '#8b5cf6';
              default: return '#6b7280';
            }
          };

          return {
            ...property,
            id: property.id || generatePropertyId(),
            color: getPropertyColor(property.propertyType),
            title: `${property.address}, ${property.city}, ${property.stateCode}`,
            description: `${property.propertyType} • ${property.formattedValue} • ${property.squareFootage?.toLocaleString() || 'N/A'} sq ft${property.bedrooms ? ` • ${property.bedrooms}bd` : ''}${property.bathrooms ? `/${property.bathrooms}ba` : ''}`
          };
        });
        
        setSearchResults(filteredResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Handle characteristics search - search by property type, features, etc.
  const handleCharacteristicsSearch = async () => {
    try {
      const params = buildSearchParams();
      
      if (searchQuery.trim()) {
        // Determine search type based on query
        const query = searchQuery.toLowerCase();
        
        if (['residential', 'commercial', 'industrial', 'land'].some(type => query.includes(type))) {
          const propertyType = ['residential', 'commercial', 'industrial', 'land'].find(type => query.includes(type));
          params.append('propertyType', propertyType!);
        } else if (query.includes('bedroom') || query.includes('bed')) {
          const bedroomMatch = query.match(/(\d+)\s*(bedroom|bed)/);
          if (bedroomMatch) {
            params.append('bedrooms', bedroomMatch[1]);
          }
        } else if (query.includes('bathroom') || query.includes('bath')) {
          const bathroomMatch = query.match(/(\d+)\s*(bathroom|bath)/);
          if (bathroomMatch) {
            params.append('bathrooms', bathroomMatch[1]);
          }
        } else if (query.includes('sqft') || query.includes('square')) {
          const sqftMatch = query.match(/(\d+)\s*(sqft|square)/);
          if (sqftMatch) {
            params.append('minSquareFootage', sqftMatch[1]);
          }
        } else {
          params.append('search', searchQuery);
        }
      }

      const response = await fetch(`/api/properties/locations?${params.toString()}`);
      if (!response.ok) throw new Error('Characteristics search failed');

      const data = await response.json();
      const rawResults = data.properties || [];
      
      // Format results for characteristics search with proper markers
      const characteristicsResults = rawResults.map((property: any) => {
        const getPropertyColor = (type: string) => {
          switch (type.toLowerCase()) {
            case 'residential': return '#10b981';
            case 'commercial': return '#3b82f6';
            case 'industrial': return '#f59e0b';
            case 'land': return '#8b5cf6';
            default: return '#6b7280';
          }
        };

        return {
          ...property,
          id: property.id || generatePropertyId(),
          color: getPropertyColor(property.propertyType),
          title: `${property.address}, ${property.city}, ${property.stateCode}`,
          description: `${property.propertyType} • ${property.formattedValue} • ${property.squareFootage?.toLocaleString() || 'N/A'} sq ft${property.bedrooms ? ` • ${property.bedrooms}bd` : ''}${property.bathrooms ? `/${property.bathrooms}ba` : ''}`
        };
      });
      
      // If no database results found, try geocoding as fallback
      if (characteristicsResults.length === 0 && searchQuery.trim()) {
        console.log('No characteristics results found, trying address search as fallback...');
        await handleAddressSearchFallback();
        return;
      }
      
      setSearchResults(characteristicsResults);
      setShowResults(true);
      
    } catch (error) {
      console.error('Characteristics search error:', error);
      if (searchQuery.trim()) {
        await handleAddressSearchFallback();
      }
    }
  };

  // Address search fallback for other tabs
  const handleAddressSearchFallback = async () => {
    try {
      const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5&country=US&types=address,place,region,postcode&autocomplete=true`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const geocodingResults = data.features.map((feature: any) => ({
          id: generatePropertyId(),
          latitude: feature.center[1],
          longitude: feature.center[0],
          address: feature.place_name,
          propertyType: 'location',
          currentValue: 0,
          formattedValue: 'Location Pin',
          city: feature.context?.find((c: any) => c.id.includes('place'))?.text || 'Unknown',
          state: feature.context?.find((c: any) => c.id.includes('region'))?.text || 'Unknown',
          stateCode: feature.context?.find((c: any) => c.id.includes('region'))?.short_code?.replace('US-', '') || 'XX',
          title: feature.place_name,
          description: `Location pin • Found via ${activeTab} search`,
          color: '#D2966E'
        }));
        
        setSearchResults(geocodingResults);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Address search fallback error:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Add property to map
  const addPropertyToMap = (property: PropertyLocation) => {
    // Special handling for owner selection
    if (property.propertyType === 'owner' && (property as any).properties) {
      const ownerProperties = (property as any).properties;
      
      // Check if adding all properties would exceed the limit
      if (properties.length + ownerProperties.length > maxPins) {
        console.warn(`Adding ${ownerProperties.length} properties would exceed maximum pins (${maxPins}). Cannot add owner's properties.`);
        return;
      }

      // Convert owner's properties to our format
      const formattedProperties = ownerProperties.map((prop: PropertyLocation) => {
        const getPropertyColor = (type: string) => {
          switch (type.toLowerCase()) {
            case 'residential': return '#10b981';
            case 'commercial': return '#3b82f6';
            case 'industrial': return '#f59e0b';
            case 'land': return '#8b5cf6';
            default: return '#6b7280';
          }
        };

        return {
          ...prop,
          id: prop.id || generatePropertyId(),
          color: getPropertyColor(prop.propertyType),
          title: `${prop.address} (Owner: ${property.ownerName})`,
          description: `Owned by ${property.ownerName} • ${prop.propertyType} • ${prop.formattedValue}`
        };
      });

      const updatedProperties = allowMultiple ? [...properties, ...formattedProperties] : formattedProperties;
      setProperties(updatedProperties);
      setSelectedProperty(formattedProperties[0]);
      setShowResults(false);
      setSearchQuery('');

      // Fit map to show all owner's properties
      if (map.current && formattedProperties.length > 0) {
        setTimeout(() => {
          if (formattedProperties.length === 1) {
            map.current?.flyTo({
              center: [formattedProperties[0].longitude, formattedProperties[0].latitude],
              zoom: 15,
              essential: true,
              duration: 1000
            });
          } else {
            const bounds = new mapboxgl.LngLatBounds();
            formattedProperties.forEach((prop: PropertyLocation) => {
              bounds.extend([prop.longitude, prop.latitude]);
            });
            
            map.current?.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 80, right: 80 },
              maxZoom: 12,
              duration: 1500
            });
          }
        }, 100);
      }

      if (onPropertySelect) {
        onPropertySelect(formattedProperties[0]);
      }
      if (onPropertiesChange) {
        onPropertiesChange(updatedProperties);
      }
      
      return;
    }

    // Regular property handling
    if (properties.length >= maxPins) {
      console.warn(`Maximum pins reached (${maxPins}). Cannot add more pins.`);
      return;
    }

    const newProperty = { ...property, id: property.id || generatePropertyId() };
    const updatedProperties = allowMultiple ? [...properties, newProperty] : [newProperty];
    
    setProperties(updatedProperties);
    setSelectedProperty(newProperty);
    setShowResults(false);
    setSearchQuery('');

    // Fly to the property
    if (map.current) {
      map.current.flyTo({
        center: [newProperty.longitude, newProperty.latitude],
        zoom: 15,
        essential: true,
        duration: 1000
      });
    }

    if (onPropertySelect) {
      onPropertySelect(newProperty);
    }
    if (onPropertiesChange) {
      onPropertiesChange(updatedProperties);
    }
  };

  // Add property marker
  const addPropertyMarker = (property: PropertyLocation) => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    if (markers.current[property.id]) {
      return;
    }
    
    const getPropertyColor = (type: string) => {
      switch (type.toLowerCase()) {
        case 'residential': return '#10b981';
        case 'commercial': return '#3b82f6';
        case 'industrial': return '#f59e0b';
        case 'land': return '#8b5cf6';
        case 'location': return '#D2966E';
        default: return '#6b7280';
      }
    };
    
    const markerColor = property.color || getPropertyColor(property.propertyType);
    
    const marker = new mapboxgl.Marker({
      color: markerColor,
      scale: 0.8
    })
      .setLngLat([property.longitude, property.latitude])
      .addTo(map.current);
    
    // Create popup content based on property type
    let popupContent = '';
    if (property.propertyType === 'location') {
      popupContent = `
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-sm text-gray-900 mb-1">${property.address}</div>
          <div class="text-xs text-gray-600 mb-2">${property.city}, ${property.stateCode}</div>
          <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Location Pin</span>
        </div>
      `;
    } else {
      popupContent = `
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-sm text-gray-900 mb-1">${property.address}</div>
          <div class="text-xs text-gray-600 mb-2">${property.city}, ${property.stateCode}</div>
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">${property.formattedValue}</span>
            <span class="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">${property.propertyType}</span>
          </div>
          ${property.squareFootage || property.bedrooms || property.bathrooms ? `
            <div class="text-xs text-gray-600 flex items-center gap-3">
              ${property.squareFootage ? `<span>${property.squareFootage.toLocaleString()} sq ft</span>` : ''}
              ${property.bedrooms ? `<span>${property.bedrooms}bd</span>` : ''}
              ${property.bathrooms ? `<span>${property.bathrooms}ba</span>` : ''}
            </div>
          ` : ''}
          ${property.ownerName ? `
            <div class="text-xs text-gray-500 mt-1">Owner: ${property.ownerName}</div>
          ` : ''}
        </div>
      `;
    }
    
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      className: 'property-popup'
    }).setHTML(popupContent);
    
    marker.setPopup(popup);
    
    if (property.propertyType !== 'location') {
      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        openPropertyDetail(property.id);
      });
      
      marker.getElement().style.cursor = 'pointer';
    }
    
    markers.current[property.id] = marker;
    
    console.log(`Added ${property.propertyType} marker for: ${property.address} at [${property.longitude}, ${property.latitude}]`);
  };

  // Remove property
  const removeProperty = (propertyId: string) => {
    const updatedProperties = properties.filter(prop => prop.id !== propertyId);
    setProperties(updatedProperties);
    
    const marker = markers.current[propertyId];
    if (marker) {
      if ((marker as any)._cleanup) {
        (marker as any)._cleanup();
      }
      marker.remove();
      delete markers.current[propertyId];
    }
    
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(updatedProperties.length > 0 ? updatedProperties[0] : null);
    }
    
    if (onPropertiesChange) {
      onPropertiesChange(updatedProperties);
    }
  };

  // Clear all properties
  const clearAllProperties = () => {
    Object.values(markers.current).forEach(marker => {
      if ((marker as any)._cleanup) {
        (marker as any)._cleanup();
      }
      marker.remove();
    });
    markers.current = {};
    setProperties([]);
    setSelectedProperty(null);
    if (onPropertiesChange) {
      onPropertiesChange([]);
    }
  };

  // Fit map to show all properties
  const fitMapToProperties = () => {
    if (!map.current || properties.length === 0 || !map.current.isStyleLoaded()) return;

    try {
      if (properties.length === 1) {
        const property = properties[0];
        map.current.flyTo({
          center: [property.longitude, property.latitude],
          zoom: 14,
          essential: true,
          duration: 1500
        });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        properties.forEach(property => {
          bounds.extend([property.longitude, property.latitude]);
        });
        
        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 12,
          duration: 1500
        });
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  };

  // Update markers when properties change
  useEffect(() => {
    if (!map.current) return;

    if (!map.current.isStyleLoaded()) {
      const onStyleLoad = () => {
        properties.forEach(property => {
          addPropertyMarker(property);
        });
        map.current?.off('style.load', onStyleLoad);
      };
      map.current.on('style.load', onStyleLoad);
      return;
    }

    properties.forEach(property => {
      if (!markers.current[property.id]) {
        addPropertyMarker(property);
      }
    });
  }, [properties]);

  // Toggle map style
  const toggleMapStyle = () => {
    if (!map.current) return;
    
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    
    const newStyle = mapStyle === 'satellite' ? 'mapbox://styles/mapbox/standard' : 'mapbox://styles/mapbox/standard-satellite';
    setMapStyle(mapStyle === 'satellite' ? 'standard' : 'satellite');
    
    Object.values(markers.current).forEach(marker => {
      if ((marker as any)._cleanup) {
        (marker as any)._cleanup();
      }
      marker.remove();
    });
    markers.current = {};
    
    map.current.setStyle(newStyle);
    
    map.current.once('style.load', () => {
      map.current?.jumpTo({
        center: currentCenter,
        zoom: currentZoom
      });
      
      setTimeout(() => {
        properties.forEach(property => {
          addPropertyMarker(property);
        });
      }, 200);
    });
  };

  // Get placeholder text based on active tab
  const getPlaceholderText = () => {
    switch (activeTab) {
      case 'owner':
        return 'Search by owner name or use filters below...';
      case 'address':
        return 'Search for an address or use filters below...';
      case 'characteristics':
        return 'Search by type, features, or use filters below...';
      default:
        return 'Search for an address or location...';
    }
  };

  // Get display text for the search type
  const getSearchTypeDisplay = (value: string) => {
    switch (value) {
      case 'owner':
        return 'By Owner';
      case 'address':
        return 'By Address';
      case 'characteristics':
        return 'Property Characteristics';
      default:
        return 'By Address';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Top navigation bar with responsive tabs/dropdown */}
      <div className="absolute top-0 left-0 right-0 z-[50] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-xl sm:text-2xl font-cal-sans font-bold text-gray-900">PlotBook</h1>
              <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:inline">Property Intelligence</span>
            </motion.div>
            
            {/* Navigation Links */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <Link href="/saved-properties">
                <motion.button
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved</span>
                </motion.button>
              </Link>
            </motion.div>
            
            {/* View Toggle Controls */}
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex bg-gray-50/80 rounded-lg p-1 border border-gray-200/50">
                <motion.button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md ${
                    viewMode === 'map' 
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <Map className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Map</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">List</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Desktop Custom Tabs - Hidden on mobile */}
          <div className="hidden sm:block">
            <div className="w-full max-w-4xl">
              {/* Custom Tab Navigation */}
              <div className="relative flex bg-gray-50/80 rounded-lg p-1 border border-gray-200/50">
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm border border-gray-200/50"
                  initial={false}
                  animate={{
                    translateX: activeTab === 'owner' ? '0%' : 
                               activeTab === 'address' ? '100%' : 
                               '200%'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                  style={{
                    width: 'calc(33.333% - 2px)',
                    left: '1px'
                  }}
                />
                
                <motion.button
                  onClick={() => setActiveTab('owner')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 rounded-md ${
                    activeTab === 'owner' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <User className="h-4 w-4" />
                  By Owner
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('address')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 rounded-md ${
                    activeTab === 'address' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <MapPin className="h-4 w-4" />
                  By Address
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('characteristics')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 rounded-md ${
                    activeTab === 'characteristics' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <Home className="h-4 w-4" />
                  Property Characteristics
                </motion.button>
              </div>
              
              {/* Search input and filters for desktop */}
              <motion.div 
                className="mt-4 space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {/* Search Bar */}
                <div className="flex gap-3">
                  <div className="relative flex-1 max-w-lg">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          placeholder={getPlaceholderText()}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10 bg-white border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch();
                            }
                          }}
                        />
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={handleSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <SearchIcon className="h-4 w-4"/>
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Advanced Filters Toggle */}
                  <motion.button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                      showAdvancedFilters || hasActiveFilters()
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="text-sm font-medium">Filters</span>
                    {hasActiveFilters() && (
                      <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        !
                      </span>
                    )}
                    <motion.div
                      animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </motion.button>
                </div>
                
                {/* Advanced Filters Panel */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-xl z-[70]"
                      style={{ 
                        maxHeight: '60vh', 
                        minHeight: '400px',
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'absolute'
                      }}
                    >
                      {/* Scrollable content area */}
                      <div 
                        className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                        style={{ 
                          maxHeight: 'calc(60vh - 80px)',
                          minHeight: '320px'
                        }}
                      >
                        <div className="p-6 space-y-6">
                          {/* Property Types */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 mb-3 block">Property Types</Label>
                            <div className="flex flex-wrap gap-3">
                              {['residential', 'commercial', 'industrial', 'land'].map((type) => (
                                <motion.div
                                  key={type}
                                  className="flex items-center space-x-2"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <Checkbox
                                    id={type}
                                    checked={filters.propertyTypes.includes(type)}
                                    onCheckedChange={() => togglePropertyType(type)}
                                    className="border-gray-300"
                                  />
                                  <Label 
                                    htmlFor={type} 
                                    className="text-sm text-gray-700 capitalize cursor-pointer"
                                  >
                                    {type}
                                  </Label>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Price Range */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                              Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                            </Label>
                            <div className="px-2 py-2">
                              <Slider
                                value={filters.priceRange}
                                onValueChange={(value: number[]) => updateFilter('priceRange', value as [number, number])}
                                max={10000000}
                                min={0}
                                step={50000}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Size Range */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                              Size Range: {filters.sizeRange[0].toLocaleString()} - {filters.sizeRange[1].toLocaleString()} sq ft
                            </Label>
                            <div className="px-2 py-2">
                              <Slider
                                value={filters.sizeRange}
                                onValueChange={(value: number[]) => updateFilter('sizeRange', value as [number, number])}
                                max={10000}
                                min={0}
                                step={100}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Bedrooms and Bathrooms */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-semibold text-gray-900 mb-3 block">Bedrooms</Label>
                              <Select 
                                value={filters.bedrooms?.toString() || 'any'} 
                                onValueChange={(value) => updateFilter('bedrooms', value === 'any' ? null : parseInt(value))}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}+ bedrooms
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-semibold text-gray-900 mb-3 block">Bathrooms</Label>
                              <Select 
                                value={filters.bathrooms?.toString() || 'any'} 
                                onValueChange={(value) => updateFilter('bathrooms', value === 'any' ? null : parseInt(value))}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}+ bathrooms
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Year Built Range */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                              Year Built: {filters.yearBuiltRange[0]} - {filters.yearBuiltRange[1]}
                            </Label>
                            <div className="px-2 py-2">
                              <Slider
                                value={filters.yearBuiltRange}
                                onValueChange={(value: number[]) => updateFilter('yearBuiltRange', value as [number, number])}
                                max={new Date().getFullYear()}
                                min={1800}
                                step={5}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Additional Options */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="hasOwnerInfo"
                                checked={filters.hasOwnerInfo}
                                onCheckedChange={(checked: boolean) => updateFilter('hasOwnerInfo', checked as boolean)}
                                className="border-gray-300"
                              />
                              <Label htmlFor="hasOwnerInfo" className="text-sm text-gray-700 cursor-pointer">
                                Has owner information
                              </Label>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-semibold text-gray-900 mb-2 block">Sort By</Label>
                              <div className="flex gap-2">
                                <Select 
                                  value={filters.sortBy} 
                                  onValueChange={(value) => updateFilter('sortBy', value as any)}
                                >
                                  <SelectTrigger className="bg-white flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="relevance">Relevance</SelectItem>
                                    <SelectItem value="price">Price</SelectItem>
                                    <SelectItem value="size">Size</SelectItem>
                                    <SelectItem value="year">Year Built</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select 
                                  value={filters.sortOrder} 
                                  onValueChange={(value) => updateFilter('sortOrder', value as any)}
                                >
                                  <SelectTrigger className="bg-white w-20 lg:w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="desc">
                                      {filters.sortBy === 'price' ? 'High to Low' : 
                                       filters.sortBy === 'size' ? 'Large to Small' :
                                       filters.sortBy === 'year' ? 'Newest First' : 'Best Match'}
                                    </SelectItem>
                                    <SelectItem value="asc">
                                      {filters.sortBy === 'price' ? 'Low to High' : 
                                       filters.sortBy === 'size' ? 'Small to Large' :
                                       filters.sortBy === 'year' ? 'Oldest First' : 'Least Match'}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Extra padding at bottom for better scrolling */}
                          <div className="h-4"></div>
                        </div>
                      </div>
                      
                      {/* Fixed Footer Actions */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          size="sm"
                          className="text-gray-600"
                          disabled={!hasActiveFilters()}
                        >
                          Clear Filters
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowAdvancedFilters(false)}
                            variant="outline"
                            size="sm"
                          >
                            Close
                          </Button>
                          <Button
                            onClick={handleSearch}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <SearchIcon className="h-4 w-4 mr-2" />
                            )}
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Mobile Dropdown and Search - Visible only on mobile */}
          <div className="sm:hidden space-y-3">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-0 relative z-50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {activeTab === 'owner' && <User className="h-4 w-4" />}
                    {activeTab === 'address' && <MapPin className="h-4 w-4" />}
                    {activeTab === 'characteristics' && <Home className="h-4 w-4" />}
                    {getSearchTypeDisplay(activeTab)}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
                <SelectItem value="owner" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    By Owner
                  </div>
                </SelectItem>
                <SelectItem value="address" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    By Address
                  </div>
                </SelectItem>
                <SelectItem value="characteristics" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Property Characteristics
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Search input and filters for mobile */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder={getPlaceholderText()}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white border-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  type="button"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <SearchIcon className="h-4 w-4"/>
                  )}
                </button>
              </div>
              
              {/* Mobile Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  showAdvancedFilters || hasActiveFilters()
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">Advanced Filters</span>
                {hasActiveFilters() && (
                  <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
                <motion.div
                  animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel - Full Screen Overlay */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
              onClick={() => setShowAdvancedFilters(false)}
            />
            
            {/* Desktop Filters Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl mx-4 bg-white rounded-lg border border-gray-200 shadow-2xl z-[101] hidden sm:flex flex-col"
              style={{ 
                maxHeight: '80vh', 
                minHeight: '500px'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Scrollable content area */}
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-6 space-y-6">
                  {/* Property Types */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">Property Types</Label>
                    <div className="flex flex-wrap gap-3">
                      {['residential', 'commercial', 'industrial', 'land'].map((type) => (
                        <motion.div
                          key={type}
                          className="flex items-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <Checkbox
                            id={type}
                            checked={filters.propertyTypes.includes(type)}
                            onCheckedChange={() => togglePropertyType(type)}
                            className="border-gray-300"
                          />
                          <Label 
                            htmlFor={type} 
                            className="text-sm text-gray-700 capitalize cursor-pointer"
                          >
                            {type}
                          </Label>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                      Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value: number[]) => updateFilter('priceRange', value as [number, number])}
                        max={10000000}
                        min={0}
                        step={50000}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Size Range */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                      Size Range: {filters.sizeRange[0].toLocaleString()} - {filters.sizeRange[1].toLocaleString()} sq ft
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.sizeRange}
                        onValueChange={(value: number[]) => updateFilter('sizeRange', value as [number, number])}
                        max={10000}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Bedrooms and Bathrooms */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-3 block">Bedrooms</Label>
                      <Select 
                        value={filters.bedrooms?.toString() || 'any'} 
                        onValueChange={(value) => updateFilter('bedrooms', value === 'any' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="any">Any</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}+ bedrooms
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-3 block">Bathrooms</Label>
                      <Select 
                        value={filters.bathrooms?.toString() || 'any'} 
                        onValueChange={(value) => updateFilter('bathrooms', value === 'any' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="any">Any</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}+ bathrooms
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Year Built Range */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                      Year Built: {filters.yearBuiltRange[0]} - {filters.yearBuiltRange[1]}
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.yearBuiltRange}
                        onValueChange={(value: number[]) => updateFilter('yearBuiltRange', value as [number, number])}
                        max={new Date().getFullYear()}
                        min={1800}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Additional Options */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasOwnerInfo"
                        checked={filters.hasOwnerInfo}
                        onCheckedChange={(checked: boolean) => updateFilter('hasOwnerInfo', checked as boolean)}
                        className="border-gray-300"
                      />
                      <Label htmlFor="hasOwnerInfo" className="text-sm text-gray-700 cursor-pointer">
                        Has owner information
                      </Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-2 block">Sort By</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={filters.sortBy} 
                          onValueChange={(value) => updateFilter('sortBy', value as any)}
                        >
                          <SelectTrigger className="bg-white flex-1 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="size">Size</SelectItem>
                            <SelectItem value="year">Year Built</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={filters.sortOrder} 
                          onValueChange={(value) => updateFilter('sortOrder', value as any)}
                        >
                          <SelectTrigger className="bg-white w-32 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="desc">
                              {filters.sortBy === 'price' ? 'High to Low' : 
                               filters.sortBy === 'size' ? 'Large to Small' :
                               filters.sortBy === 'year' ? 'Newest First' : 'Best Match'}
                            </SelectItem>
                            <SelectItem value="asc">
                              {filters.sortBy === 'price' ? 'Low to High' : 
                               filters.sortBy === 'size' ? 'Small to Large' :
                               filters.sortBy === 'year' ? 'Oldest First' : 'Least Match'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer Actions */}
              <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-gray-600"
                  disabled={!hasActiveFilters()}
                >
                  Clear Filters
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowAdvancedFilters(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleSearch();
                      setShowAdvancedFilters(false);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <SearchIcon className="h-4 w-4 mr-2" />
                    )}
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Mobile Filters Panel */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl border-t border-gray-200 shadow-2xl z-[101] sm:hidden flex flex-col"
              style={{ 
                maxHeight: '85vh',
                minHeight: '50vh'
              }}
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile scrollable content */}
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4 space-y-4">
                  {/* Mobile filters - optimized layout */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">Property Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['residential', 'commercial', 'industrial', 'land'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-${type}`}
                            checked={filters.propertyTypes.includes(type)}
                            onCheckedChange={() => togglePropertyType(type)}
                            className="border-gray-300"
                          />
                          <Label 
                            htmlFor={`mobile-${type}`} 
                            className="text-sm text-gray-700 capitalize cursor-pointer"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                      Price: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value: number[]) => updateFilter('priceRange', value as [number, number])}
                        max={10000000}
                        min={0}
                        step={50000}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                      Size: {filters.sizeRange[0].toLocaleString()} - {filters.sizeRange[1].toLocaleString()} sq ft
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.sizeRange}
                        onValueChange={(value: number[]) => updateFilter('sizeRange', value as [number, number])}
                        max={10000}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-2 block">Bedrooms</Label>
                      <Select 
                        value={filters.bedrooms?.toString() || 'any'} 
                        onValueChange={(value) => updateFilter('bedrooms', value === 'any' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="bg-white text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="any">Any</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}+
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-2 block">Bathrooms</Label>
                      <Select 
                        value={filters.bathrooms?.toString() || 'any'} 
                        onValueChange={(value) => updateFilter('bathrooms', value === 'any' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="bg-white text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="any">Any</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}+
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                      Year Built: {filters.yearBuiltRange[0]} - {filters.yearBuiltRange[1]}
                    </Label>
                    <div className="px-3 py-4 bg-gray-50 rounded-lg">
                      <Slider
                        value={filters.yearBuiltRange}
                        onValueChange={(value: number[]) => updateFilter('yearBuiltRange', value as [number, number])}
                        max={new Date().getFullYear()}
                        min={1800}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-hasOwnerInfo"
                      checked={filters.hasOwnerInfo}
                      onCheckedChange={(checked: boolean) => updateFilter('hasOwnerInfo', checked as boolean)}
                      className="border-gray-300"
                    />
                    <Label htmlFor="mobile-hasOwnerInfo" className="text-sm text-gray-700 cursor-pointer">
                      Has owner information
                    </Label>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">Sort By</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select 
                        value={filters.sortBy} 
                        onValueChange={(value) => updateFilter('sortBy', value as any)}
                      >
                        <SelectTrigger className="bg-white text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="size">Size</SelectItem>
                          <SelectItem value="year">Year Built</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={filters.sortOrder} 
                        onValueChange={(value) => updateFilter('sortOrder', value as any)}
                      >
                        <SelectTrigger className="bg-white text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="desc">
                            {filters.sortBy === 'price' ? 'High→Low' : 
                             filters.sortBy === 'size' ? 'Large→Small' :
                             filters.sortBy === 'year' ? 'New→Old' : 'Best'}
                          </SelectItem>
                          <SelectItem value="asc">
                            {filters.sortBy === 'price' ? 'Low→High' : 
                             filters.sortBy === 'size' ? 'Small→Large' :
                             filters.sortBy === 'year' ? 'Old→New' : 'Least'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile fixed footer */}
              <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={!hasActiveFilters()}
                >
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    handleSearch();
                    setShowAdvancedFilters(false);
                  }}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  ) : (
                    <SearchIcon className="h-4 w-4 mr-1" />
                  )}
                  Apply
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {(showResults || loading) && (
          <motion.div
            className="absolute top-32 sm:top-40 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-[60] bg-white border border-gray-200 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {loading 
                    ? 'Searching...' 
                    : searchResults.length > 0 
                    ? `Search Results (${searchResults.length})` 
                    : 'No Results Found'
                  }
                </span>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setLoading(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {loading ? (
              // Loading state
              <div className="p-6 text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-600">Searching properties...</p>
                </motion.div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    className="p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addPropertyToMap(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-3 h-3 rounded-full border border-white shadow-sm mt-1 flex-shrink-0"
                        style={{ backgroundColor: result.color || '#10b981' }}
                      />
                      <div className="flex-1 min-w-0">
                        {result.propertyType === 'owner' ? (
                          // Owner search result display
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-purple-600 flex-shrink-0" />
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {result.ownerName}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">
                              {result.city} • Portfolio value: {result.formattedValue}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                Property Owner
                              </span>
                              <span className="text-xs text-gray-500">
                                Click to map all properties
                              </span>
                            </div>
                          </>
                        ) : (
                          // Regular property/location result display
                          <>
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {result.address}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              {result.city}, {result.stateCode}
                            </p>
                            {result.propertyType !== 'location' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {result.formattedValue}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                  {result.propertyType}
                                </span>
                                {result.squareFootage && (
                                  <span className="text-xs text-gray-500">
                                    {result.squareFootage.toLocaleString()} sq ft
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // No results fallback
              <div className="p-6 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <SearchIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-xs text-gray-500 text-center mb-4 max-w-xs">
                    {activeTab === 'owner' 
                      ? "No properties found for this owner. Try searching by address or adjusting your filters."
                      : activeTab === 'address'
                      ? "No properties found at this location. Try a different address or broader search terms."
                      : "No properties match these characteristics. Try different criteria or adjust your filters."
                    }
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowResults(false);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear search
                    </button>
                    {hasActiveFilters() && (
                      <button
                        onClick={() => {
                          clearFilters();
                          setShowResults(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map style toggle button - Only visible in map view */}
      {viewMode === 'map' && (
        <div className="absolute bottom-4 right-4 z-[85]">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={toggleMapStyle}
              variant="outline"
              size="icon"
              className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-gray-50 focus:outline-none w-10 h-10 sm:w-12 sm:h-12 hover:border-blue-300 transition-all duration-200"
              title={mapStyle === 'satellite' ? "Switch to Standard View" : "Switch to Satellite View"}
            >
              <motion.div
                animate={{ rotate: mapStyle === 'satellite' ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {mapStyle === 'satellite' ? <Map className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      )}

      {/* Pin Management Dropdown - Only when pins exist */}
      <AnimatePresence>
        {allowMultiple && properties.length > 0 && (
          <motion.div 
            className={`absolute bottom-4 z-[90] ${viewMode === 'map' ? 'right-16 sm:right-20' : 'right-4'}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-200 hover:bg-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`${properties.length} pin${properties.length !== 1 ? 's' : ''} on map`}
                >
                  <div className="relative">
                    <MapPin className="h-5 w-5 text-gray-700" />
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {properties.length}
                    </span>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-80 z-[95] bg-white border border-gray-200 shadow-xl rounded-lg p-0 max-h-96 overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Map Pins ({properties.length})
                    </h3>
                    {properties.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 z-[98]">
                          <DropdownMenuItem 
                            onClick={fitMapToProperties}
                            className="cursor-pointer"
                          >
                            <Target className="h-3 w-3 mr-2" />
                            Fit to View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={clearAllProperties}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash className="h-3 w-3 mr-2" />
                            Clear All Pins
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                {/* Properties list */}
                <div className="max-h-64 overflow-y-auto">
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      className="p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm mt-1 flex-shrink-0"
                          style={{ backgroundColor: property.color || '#10b981' }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <motion.div
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedProperty(property);
                              if (viewMode === 'map') {
                                map.current?.flyTo({
                                  center: [property.longitude, property.latitude],
                                  zoom: 15,
                                  essential: true
                                });
                              }
                            }}
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-900">
                                Pin {index + 1}
                              </span>
                              {selectedProperty?.id === property.id && (
                                <motion.span 
                                  className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  Selected
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 break-words leading-relaxed">
                              {property.address}
                            </p>
                            {property.propertyType !== 'location' && (
                              <p className="text-xs text-gray-500 mt-1">
                                {property.formattedValue} • {property.propertyType}
                              </p>
                            )}
                          </motion.div>
                          
                          {/* Quick actions */}
                          <div className="flex items-center gap-1">
                            {property.propertyType !== 'location' && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPropertyDetail(property.id);
                                }}
                                className="p-1.5 hover:bg-green-100 rounded-md transition-colors"
                                title="View details"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Building className="h-3 w-3 text-green-600" />
                              </motion.button>
                            )}
                            
                            {viewMode === 'map' && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProperty(property);
                                  map.current?.flyTo({
                                    center: [property.longitude, property.latitude],
                                    zoom: 15,
                                    essential: true
                                  });
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                                title="Focus on pin"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Target className="h-3 w-3 text-blue-600" />
                              </motion.button>
                            )}
                            
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProperty(property.id);
                              }}
                              className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                              title="Remove pin"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Footer */}
                {properties.length >= maxPins && (
                  <motion.div 
                    className="p-3 border-t border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-xs text-amber-700 text-center font-medium flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Maximum pins reached ({maxPins})
                    </p>
                  </motion.div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content Area - Map or List View */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          /* Map View */
          <motion.div
            key="map-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pt-32 sm:pt-40"
          >
            {mapError ? (
              <motion.div 
                className="flex items-center justify-center h-full bg-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-red-500 text-sm sm:text-base px-4 text-center">{mapError}</p>
              </motion.div>
            ) : (
              <div 
                ref={mapContainer}
                className="w-full h-full"
              />
            )}
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pt-32 sm:pt-40 bg-gray-50/30"
          >
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {properties.length === 0 ? (
                  /* Empty State */
                  <motion.div 
                    className="flex flex-col items-center justify-center h-64 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <List className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
                    <p className="text-gray-500 text-sm max-w-md">
                      Search for properties using the search bar above to see them in list view.
                    </p>
                  </motion.div>
                ) : (
                  /* Properties List */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Properties ({properties.length})
                      </h2>
                      {properties.length > 1 && (
                        <Button
                          onClick={clearAllProperties}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid gap-4">
                      {properties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => setSelectedProperty(property)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Property Header */}
                              <div className="flex items-center gap-3 mb-3">
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: property.color || '#10b981' }}
                                />
                                <span className="text-sm font-medium text-gray-500">
                                  Property {index + 1}
                                </span>
                                {selectedProperty?.id === property.id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    Selected
                                  </span>
                                )}
                              </div>
                              
                              {/* Address */}
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {property.address}
                              </h3>
                              <p className="text-gray-600 mb-3">
                                {property.city}, {property.stateCode}
                              </p>
                              
                              {/* Property Details */}
                              {property.propertyType !== 'location' && (
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-green-600">
                                      {property.formattedValue}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 capitalize">
                                      {property.propertyType}
                                    </span>
                                  </div>
                                  
                                  {property.squareFootage && (
                                    <div className="flex items-center gap-2">
                                      <Square className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">
                                        {property.squareFootage.toLocaleString()} sq ft
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {property.propertyType !== 'location' && (
                                <>
                                  <SavePropertyButton
                                    property={property}
                                    variant="outline"
                                    size="sm"
                                    showText={true}
                                  />
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPropertyDetail(property.id);
                                    }}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Building className="h-4 w-4 mr-2" />
                                    Details
                                  </Button>
                                </>
                              )}
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewMode('map');
                                  setTimeout(() => {
                                    setSelectedProperty(property);
                                    map.current?.flyTo({
                                      center: [property.longitude, property.latitude],
                                      zoom: 15,
                                      essential: true
                                    });
                                  }, 300);
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                View on Map
                              </Button>
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeProperty(property.id);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selected property info - Only show in map view */}
      <AnimatePresence>
        {selectedProperty && viewMode === 'map' && (
          <motion.div 
            className="absolute bottom-4 left-4 right-20 sm:right-auto bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-sm z-[80] border border-gray-200"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Property type indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: selectedProperty.color || '#10b981' }}
                  />
                  <span className="text-xs font-semibold text-gray-900 capitalize">
                    {selectedProperty.propertyType}
                  </span>
                  {selectedProperty.propertyType !== 'location' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {selectedProperty.formattedValue}
                    </span>
                  )}
                </div>
                
                {/* Address */}
                <p className="font-medium text-sm text-gray-900 mb-1">
                  {selectedProperty.address}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {selectedProperty.city}, {selectedProperty.stateCode}
                </p>
                
                {/* Property details */}
                {selectedProperty.propertyType !== 'location' && (
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {selectedProperty.squareFootage && (
                      <div className="flex items-center gap-1">
                        <Square className="h-3 w-3" />
                        {selectedProperty.squareFootage.toLocaleString()} sq ft
                      </div>
                    )}
                    {selectedProperty.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        {selectedProperty.bedrooms} bed
                      </div>
                    )}
                    {selectedProperty.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {selectedProperty.bathrooms} bath
                      </div>
                    )}
                  </div>
                )}
                
                {/* View Details Button */}
                {selectedProperty.propertyType !== 'location' && (
                  <div className="mt-3 space-y-2">
                    <SavePropertyButton
                      property={selectedProperty}
                      variant="outline"
                      size="sm"
                      showText={true}
                      className="w-full"
                    />
                    <motion.button
                      onClick={() => openPropertyDetail(selectedProperty.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View Full Details
                    </motion.button>
                  </div>
                )}
              </div>
              
              <motion.button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Close"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Property Detail Panel */}
      <PropertyDetailPanel
        propertyId={selectedPropertyId}
        isOpen={showDetailPanel}
        onClose={closePropertyDetail}
      />
    </div>
  );
} 