'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, Satellite, Map, User, MapPin, Home } from "lucide-react";

// Mapbox token from documentation
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbmRtdW5qdWx1cmkiLCJhIjoiY21hcGh3cHY4MGdkZjJqczNzaGQwbjRrbiJ9.0Ku8xuOZeSjD7Oojk7L6vQ';

export interface PropertyLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapSearchProps {
  onLocationSelect?: (location: PropertyLocation) => void;
  initialLocation?: PropertyLocation;
}

export function MapSearch({ onLocationSelect, initialLocation }: MapSearchProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PropertyLocation | null>(initialLocation || null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [activeTab, setActiveTab] = useState('address');

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    console.log('Initializing map with container:', mapContainer.current);
    
    try {
      // Initial center based on props or default to NYC
      const initialCenter = initialLocation 
        ? [initialLocation.longitude, initialLocation.latitude]
        : [-74.0060, 40.7128]; // Default to NYC
      
      // Initialize the map with Mapbox Standard style
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: isSatellite ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
        center: initialCenter as [number, number],
        zoom: initialLocation ? 15 : 12,
        projection: 'globe', // Using the globe projection for a more modern look
      });
      
      // Set the map instance ref
      map.current = mapInstance;
      
      // Add controls
      mapInstance.addControl(new mapboxgl.NavigationControl());
      
      // Handle map loading and style configuration
      mapInstance.on('style.load', () => {
        console.log('Map loaded successfully!');
        
        // Configure the standard style
        mapInstance.setConfigProperty('basemap', 'lightPreset', 'day');
        mapInstance.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        
        // Set fog for better depth perception with terrain and buildings
        mapInstance.setFog({
          'horizon-blend': 0.3,
          'color': '#f8f0e3',
          'high-color': '#add8e6',
          'space-color': '#d8f2ff',
          'star-intensity': 0.0
        });
        
        // Add marker if initial location provided
        if (initialLocation) {
          addMarker(initialLocation.longitude, initialLocation.latitude);
        }
      });
      
      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error loading map');
      });

      // Set up ResizeObserver to handle container size changes
      if (mapContainer.current) {
        resizeObserver.current = new ResizeObserver(() => {
          if (map.current) {
            // Add a small delay to ensure the container has finished resizing
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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLocation]);
  
  // Create or update marker
  const addMarker = (longitude: number, latitude: number) => {
    if (!map.current) return;
    
    // Remove existing marker if it exists
    if (marker.current) {
      marker.current.remove();
    }
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#D2966E';
    el.style.border = '2px solid white';
    
    // Create and add new marker
    marker.current = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(map.current);
  };
  
  // Update map when initialLocation changes
  useEffect(() => {
    if (!map.current || !initialLocation) return;
    
    // Fly to location with animation
    map.current.flyTo({
      center: [initialLocation.longitude, initialLocation.latitude],
      zoom: 15,
      essential: true
    });
    
    // Add marker
    addMarker(initialLocation.longitude, initialLocation.latitude);
    
    // Update selected location state
    setSelectedLocation(initialLocation);
  }, [initialLocation]);
  
  const handleSearch = async () => {
    if (!map.current || !searchQuery.trim()) return;
    
    try {
      // Use Mapbox Geocoding API
      const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=4`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle Mapbox geocoding response
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const location = {
          latitude,
          longitude,
          address: data.features[0].place_name
        };
        
        console.log('Found location:', location);
        
        // Update state
        setSelectedLocation(location);
        
        // Update map
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 15,
          essential: true
        });
        
        // Add marker
        addMarker(location.longitude, location.latitude);
        
        // Notify parent component
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      } else {
        console.log('No results found');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const toggleMapStyle = () => {
    if (!map.current) return;
    
    // Store current map center and zoom to preserve view
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    
    const newStyle = isSatellite ? 'mapbox://styles/mapbox/standard' : 'mapbox://styles/mapbox/standard-satellite';
    setIsSatellite(!isSatellite);
    
    // Change map style
    map.current.setStyle(newStyle);
    
    // Restore view and re-add marker after style loads
    map.current.once('style.load', () => {
      // Restore the previous center and zoom
      map.current?.jumpTo({
        center: currentCenter,
        zoom: currentZoom
      });
      
      // Re-add marker if there's a selected location
      if (selectedLocation) {
        addMarker(selectedLocation.longitude, selectedLocation.latitude);
      }
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
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
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
                  layoutId="activeTab"
                  initial={false}
                  animate={{
                    x: activeTab === 'owner' ? '0%' : activeTab === 'address' ? '100%' : '200%',
                    width: '33.333%'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
                
                {/* Tab Buttons */}
                <motion.button
                  onClick={() => setActiveTab('owner')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'owner' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="h-4 w-4" />
                  By Owner
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('address')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'address' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MapPin className="h-4 w-4" />
                  By Address
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('characteristics')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'characteristics' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  >
                    <SearchIcon className="h-4 w-4"/>
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
              >
                <SearchIcon className="h-4 w-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map style toggle button positioned on bottom-right */}
      <div className="absolute bottom-4 right-4 z-10">
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
      
      {/* Map container taking full space with responsive top margin */}
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
      
      {/* Selected location info positioned at bottom - Mobile responsive */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div 
            className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-sm z-10 border border-gray-200"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium text-xs sm:text-sm">Selected Location:</p>
            <p className="text-muted-foreground text-xs break-words">{selectedLocation.address || `${selectedLocation.latitude}, ${selectedLocation.longitude}`}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 