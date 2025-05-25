'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { SearchIcon, Satellite, Map, User, MapPin, Home, X, Trash2, MoreVertical, Target, Trash, ChevronDown, Building, DollarSign, Bed, Bath, Square } from "lucide-react";

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
  const [isSatellite, setIsSatellite] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('address');
  const [searchResults, setSearchResults] = useState<PropertyLocation[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Generate unique ID for properties
  const generatePropertyId = () => `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    try {
      // Initialize the map centered on US
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: isSatellite ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
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
  }, []);

  // Search for properties
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setShowResults(false);
      
      // Search based on active tab
      if (activeTab === 'address') {
        // Use Mapbox Geocoding for address search
        await handleAddressSearch();
      } else {
        // Use our API for property/owner search
        await handlePropertySearch();
      }
      
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle address search using Mapbox Geocoding
  const handleAddressSearch = async () => {
    try {
      const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5&country=US`;
      
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
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Handle property search using our API
  const handlePropertySearch = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      
      // Add search query as a filter (you can enhance this based on activeTab)
      if (activeTab === 'owner') {
        // For now, search by address - you can enhance this to search by owner
        params.append('address', searchQuery);
      } else if (activeTab === 'characteristics') {
        // Search by property type or characteristics
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/properties/locations?${params.toString()}`);
      if (!response.ok) throw new Error('Property search failed');

      const data = await response.json();
      setSearchResults(data.properties || []);
      setShowResults(true);
      
    } catch (error) {
      console.error('Property search error:', error);
    }
  };

  // Add property to map
  const addPropertyToMap = (property: PropertyLocation) => {
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

    // Notify parent components
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
    
    // Check if marker already exists
    if (markers.current[property.id]) {
      return;
    }
    
    // Color based on property type
    const getPropertyColor = (type: string) => {
      switch (type.toLowerCase()) {
        case 'residential': return '#10b981'; // Green
        case 'commercial': return '#3b82f6'; // Blue
        case 'industrial': return '#f59e0b'; // Orange
        case 'land': return '#8b5cf6'; // Purple
        case 'location': return '#D2966E'; // Orange for geocoded locations
        default: return '#6b7280'; // Gray
      }
    };
    
    const markerColor = property.color || getPropertyColor(property.propertyType);
    
    // Option 1: Use Mapbox's default marker with custom color
    if (property.propertyType === 'location') {
      // For location pins, use a simple approach
      const marker = new mapboxgl.Marker({
        color: markerColor,
        scale: 0.8
      })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current);
      
      // Add popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-sm text-gray-900 mb-1">${property.address}</div>
          <div class="text-xs text-gray-600 mb-2">${property.city}, ${property.stateCode}</div>
          <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Location Pin</span>
        </div>
      `);
      
      marker.setPopup(popup);
      
      // Store marker reference
      markers.current[property.id] = marker;
      
      console.log(`Added location marker for: ${property.address} at [${property.longitude}, ${property.latitude}]`);
      return;
    }
    
    // Option 2: Custom element for property markers with proper positioning
    const el = document.createElement('div');
    el.className = 'property-marker';
    
    // Create a simple, well-positioned marker
    el.style.cssText = `
      width: 24px;
      height: 24px;
      background-color: ${markerColor};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Add property type icon or initial
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
    `;
    el.appendChild(icon);
    
    // Add hover effects
    const handleMouseEnter = () => {
      el.style.transform = 'scale(1.2)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      el.style.zIndex = '1000';
    };
    
    const handleMouseLeave = () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.zIndex = '1';
    };
    
    const handleClick = (e: Event) => {
      e.stopPropagation();
      setSelectedProperty(property);
      if (onPropertySelect) {
        onPropertySelect(property);
      }
      
      // Fly to property with smooth animation
      map.current?.flyTo({
        center: [property.longitude, property.latitude],
        zoom: 16,
        essential: true,
        duration: 1000
      });
    };
    
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);
    
    // Create Mapbox marker with proper anchor
    try {
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center' // Use center anchor for circular markers
      })
        .setLngLat([property.longitude, property.latitude]);
      
      // Add popup for property details
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: 'property-popup'
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-sm text-gray-900 mb-1">${property.address}</div>
          <div class="text-xs text-gray-600 mb-2">${property.city}, ${property.stateCode}</div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">${property.formattedValue}</span>
            <span class="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">${property.propertyType}</span>
          </div>
        </div>
      `);
      
      // Set popup to marker for automatic positioning
      marker.setPopup(popup);
      
      // Add marker to map
      marker.addTo(map.current);
      
      console.log(`Added property marker for: ${property.address} at [${property.longitude}, ${property.latitude}]`);
      
      // Store marker reference with cleanup function
      markers.current[property.id] = marker;
      
      // Store cleanup function for event listeners
      (marker as any)._cleanup = () => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        el.removeEventListener('click', handleClick);
      };
      
    } catch (error) {
      console.error('Error creating Mapbox marker:', error);
    }
  };

  // Remove property
  const removeProperty = (propertyId: string) => {
    const updatedProperties = properties.filter(prop => prop.id !== propertyId);
    setProperties(updatedProperties);
    
    // Remove marker
    const marker = markers.current[propertyId];
    if (marker) {
      if ((marker as any)._cleanup) {
        (marker as any)._cleanup();
      }
      marker.remove();
      delete markers.current[propertyId];
    }
    
    // Update selected property if it was the removed one
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

    // Wait for map to be loaded
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

    // Add markers for new properties
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
    
    const newStyle = isSatellite ? 'mapbox://styles/mapbox/standard' : 'mapbox://styles/mapbox/standard-satellite';
    setIsSatellite(!isSatellite);
    
    // Clear markers before style change
    Object.values(markers.current).forEach(marker => {
      if ((marker as any)._cleanup) {
        (marker as any)._cleanup();
      }
      marker.remove();
    });
    markers.current = {};
    
    map.current.setStyle(newStyle);
    
    map.current.once('style.load', () => {
      // Restore view
      map.current?.jumpTo({
        center: currentCenter,
        zoom: currentZoom
      });
      
      // Re-add all markers after style loads
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
        return 'Search by owner name or entity...';
      case 'address':
        return 'Search for an address or location...';
      case 'characteristics':
        return 'Search by property type, size, features...';
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
          </div>
          
          {/* Desktop Custom Tabs - Hidden on mobile */}
          <div className="hidden sm:block">
            <div className="w-full max-w-2xl">
              {/* Custom Tab Navigation */}
              <div className="relative flex bg-gray-50/80 rounded-lg p-1 border border-gray-200/50">
                {/* Background slider */}
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
                
                {/* Tab Buttons */}
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
              
              {/* Search input for desktop with animation */}
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="relative max-w-lg">
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
            
            {/* Search input for mobile */}
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
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            className="absolute top-32 sm:top-40 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-[60] bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Search Results ({searchResults.length})
                </span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  className="p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 cursor-pointer"
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
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {result.address}
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.city}, {result.stateCode}
                      </p>
                      {result.propertyType !== 'location' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {result.formattedValue}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {result.propertyType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map style toggle button */}
      <div className="absolute bottom-4 right-4 z-[90]">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={toggleMapStyle}
            variant="outline"
            size="icon"
            className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-gray-50 focus:outline-none w-10 h-10 sm:w-12 sm:h-12 hover:border-blue-300 transition-all duration-200"
            title={isSatellite ? "Switch to Standard View" : "Switch to Satellite View"}
          >
            <motion.div
              animate={{ rotate: isSatellite ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isSatellite ? <Map className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Pin Management Dropdown */}
      <AnimatePresence>
        {allowMultiple && properties.length > 0 && (
          <motion.div 
            className="absolute top-4 right-4 z-[100]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-gray-50 focus:outline-none transition-all duration-200 h-10 px-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {properties.length}
                      </span>
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-80 z-[110] bg-white border border-gray-200 shadow-xl rounded-lg p-0 max-h-96 overflow-hidden"
                sideOffset={8}
              >
                {/* Header */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Pins ({properties.length}/{maxPins})
                      </span>
                    </div>
                    
                    {properties.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 hover:bg-gray-200 rounded-md"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 z-[120]">
                          <DropdownMenuItem 
                            onClick={fitMapToProperties}
                            className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                          >
                            <Target className="mr-2 h-3 w-3 text-blue-600" />
                            <span className="text-gray-900">Fit All Pins</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={clearAllProperties}
                            className="cursor-pointer hover:bg-red-50 focus:bg-red-50"
                          >
                            <Trash className="mr-2 h-3 w-3 text-red-600" />
                            <span className="text-red-600">Remove All</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                {/* Properties List */}
                <div className="max-h-64 overflow-y-auto">
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      className={`border-b border-gray-50 last:border-b-0 transition-colors ${
                        selectedProperty?.id === property.id 
                          ? 'bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Pin indicator */}
                          <motion.div 
                            className="flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: property.color || '#10b981' }}
                            />
                          </motion.div>
                          
                          {/* Property info - clickable area */}
                          <motion.div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedProperty(property);
                              map.current?.flyTo({
                                center: [property.longitude, property.latitude],
                                zoom: 15,
                                essential: true
                              });
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
      
      {/* Map container */}
      {mapError ? (
        <motion.div 
          className="absolute inset-0 pt-32 sm:pt-40 flex items-center justify-center bg-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-red-500 text-sm sm:text-base px-4 text-center">{mapError}</p>
        </motion.div>
      ) : (
        <div 
          ref={mapContainer}
          style={{
            position: 'absolute',
            top: '140px',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: 'calc(100% - 140px)'
          }}
          className="w-full sm:!top-[170px] sm:!h-[calc(100%-170px)]"
        />
      )}
      
      {/* Selected property info */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div 
            className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-sm z-[80] border border-gray-200"
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
                        {selectedProperty.bedrooms}bd
                      </div>
                    )}
                    {selectedProperty.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {selectedProperty.bathrooms}ba
                      </div>
                    )}
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
    </div>
  );
} 