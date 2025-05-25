'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { SearchIcon, Satellite, Map, User, MapPin, Home, X, Trash2, MoreVertical, Target, Trash, ChevronDown } from "lucide-react";

// Mapbox token from documentation
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hbmRtdW5qdWx1cmkiLCJhIjoiY21hcGh3cHY4MGdkZjJqczNzaGQwbjRrbiJ9.0Ku8xuOZeSjD7Oojk7L6vQ';

export interface PropertyLocation {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  color?: string; // Optional color for the marker
}

interface MapSearchProps {
  onLocationSelect?: (location: PropertyLocation) => void;
  onLocationsChange?: (locations: PropertyLocation[]) => void;
  initialLocation?: PropertyLocation;
  initialLocations?: PropertyLocation[]; // Support for multiple initial locations
  allowMultiple?: boolean; // Whether to allow multiple pins (default: true)
  maxPins?: number; // Maximum number of pins allowed
  onAddPin?: (addPinFunction: (lat: number, lng: number, address?: string, color?: string) => void) => void; // Callback to expose addPin function
}

export function MapSearch({ 
  onLocationSelect, 
  onLocationsChange,
  initialLocation, 
  initialLocations = [],
  allowMultiple = true,
  maxPins = 10,
  onAddPin
}: MapSearchProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({}); // Store markers by ID
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<PropertyLocation[]>(() => {
    // Initialize with either initialLocations or single initialLocation
    if (initialLocations.length > 0) {
      return initialLocations;
    } else if (initialLocation) {
      return [{ ...initialLocation, id: initialLocation.id || 'initial-location' }];
    }
    return [];
  });
  const [selectedLocation, setSelectedLocation] = useState<PropertyLocation | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [activeTab, setActiveTab] = useState('address');

  // Generate unique ID for locations
  const generateLocationId = () => `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    console.log('Initializing map with container:', mapContainer.current);
    
    try {
      // Initial center based on props or default to NYC
      const initialCenter = locations.length > 0
        ? [locations[0].longitude, locations[0].latitude]
        : [-74.0060, 40.7128]; // Default to NYC
      
      // Initialize the map with Mapbox Standard style
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: isSatellite ? 'mapbox://styles/mapbox/standard-satellite' : 'mapbox://styles/mapbox/standard',
        center: initialCenter as [number, number],
        zoom: locations.length > 0 ? 15 : 12,
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
        
        // Add markers for all initial locations
        locations.forEach(location => {
          addMarker(location);
        });
        
        // Fit map to show all markers if multiple locations
        if (locations.length > 1) {
          fitMapToMarkers();
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
      // Clear all markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove initialLocation dependency to avoid re-initialization
  
  // Create or update marker
  const addMarker = (location: PropertyLocation) => {
    if (!map.current) return;
    
    const locationId = location.id || generateLocationId();
    
    // Remove existing marker if it exists
    if (markers.current[locationId]) {
      markers.current[locationId]?.remove();
    }
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = location.color || '#D2966E';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    // Add click handler to marker
    el.addEventListener('click', () => {
      setSelectedLocation(location);
      // Fly to the clicked marker
      map.current?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        essential: true
      });
    });
    
    // Create and add new marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);
    
    // Store marker reference
    markers.current[locationId] = marker;
    
    return locationId;
  };

  // Remove a specific marker
  const removeMarker = (locationId: string) => {
    const marker = markers.current[locationId];
    if (marker) {
      marker.remove();
      delete markers.current[locationId];
    }
  };

  // Clear all markers
  const clearAllMarkers = () => {
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};
    setLocations([]);
    setSelectedLocation(null);
    if (onLocationsChange) {
      onLocationsChange([]);
    }
  };

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (!map.current || locations.length === 0) return;
    
    if (locations.length === 1) {
      // Single location - just center on it
      map.current.flyTo({
        center: [locations[0].longitude, locations[0].latitude],
        zoom: 15,
        essential: true
      });
    } else {
      // Multiple locations - fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      });
    }
  };

  // Update locations when they change
  useEffect(() => {
    if (!map.current) return;
    
    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};
    
    // Add new markers
    locations.forEach(location => {
      addMarker(location);
    });
    
    // Fit map to show all markers
    if (locations.length > 0) {
      fitMapToMarkers();
    }
  }, [locations]);
  
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
        const newLocation: PropertyLocation = {
          id: generateLocationId(),
          latitude,
          longitude,
          address: data.features[0].place_name
        };
        
        console.log('Found location:', newLocation);
        
        // Update state based on allowMultiple setting
        if (allowMultiple && locations.length < maxPins) {
          // Add to existing locations
          const updatedLocations = [...locations, newLocation];
          setLocations(updatedLocations);
          if (onLocationsChange) {
            onLocationsChange(updatedLocations);
          }
        } else {
          // Replace existing location(s)
          setLocations([newLocation]);
          if (onLocationsChange) {
            onLocationsChange([newLocation]);
          }
        }
        
        // Update selected location
        setSelectedLocation(newLocation);
        
        // Update map view
        map.current.flyTo({
          center: [newLocation.longitude, newLocation.latitude],
          zoom: 15,
          essential: true
        });
        
        // Notify parent component
        if (onLocationSelect) {
          onLocationSelect(newLocation);
        }
        
        // Clear search query
        setSearchQuery('');
      } else {
        console.log('No results found');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  // Remove a specific location
  const removeLocation = (locationId: string) => {
    const updatedLocations = locations.filter(loc => loc.id !== locationId);
    setLocations(updatedLocations);
    removeMarker(locationId);
    
    // Update selected location if it was the removed one
    if (selectedLocation?.id === locationId) {
      setSelectedLocation(updatedLocations.length > 0 ? updatedLocations[0] : null);
    }
    
    if (onLocationsChange) {
      onLocationsChange(updatedLocations);
    }
  };

  // Programmatically add a pin with coordinates
  const addPinProgrammatically = (lat: number, lng: number, address?: string, color?: string) => {
    if (locations.length >= maxPins) {
      console.warn(`Maximum pins reached (${maxPins}). Cannot add more pins.`);
      return;
    }

    const newLocation: PropertyLocation = {
      id: generateLocationId(),
      latitude: lat,
      longitude: lng,
      address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      color: color || '#D2966E'
    };

    const updatedLocations = allowMultiple ? [...locations, newLocation] : [newLocation];
    setLocations(updatedLocations);
    setSelectedLocation(newLocation);

    // Update map view to show the new pin
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        essential: true
      });
    }

    // Notify parent components
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    }
    if (onLocationsChange) {
      onLocationsChange(updatedLocations);
    }

    return newLocation;
  };

  // Expose addPin function to parent component
  useEffect(() => {
    if (onAddPin) {
      onAddPin(addPinProgrammatically);
    }
  }, [onAddPin, locations.length, maxPins, allowMultiple]);

  const toggleMapStyle = () => {
    if (!map.current) return;
    
    // Store current map center and zoom to preserve view
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    
    const newStyle = isSatellite ? 'mapbox://styles/mapbox/standard' : 'mapbox://styles/mapbox/standard-satellite';
    setIsSatellite(!isSatellite);
    
    // Change map style
    map.current.setStyle(newStyle);
    
    // Restore view and re-add markers after style loads
    map.current.once('style.load', () => {
      // Restore the previous center and zoom
      map.current?.jumpTo({
        center: currentCenter,
        zoom: currentZoom
      });
      
      // Re-add all markers
      locations.forEach(location => {
        addMarker(location);
      });
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

      {/* Compact Pin Management Dropdown - Mobile Friendly */}
      <AnimatePresence>
        {allowMultiple && locations.length > 0 && (
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
                        {locations.length}
                      </span>
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-80 z-[110] bg-white border border-gray-200 shadow-xl rounded-lg p-0 max-h-96 overflow-hidden"
                style={{ zIndex: 110 }}
                sideOffset={8}
              >
                {/* Header */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Pins ({locations.length}/{maxPins})
                      </span>
                    </div>
                    
                    {locations.length > 1 && (
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
                        <DropdownMenuContent align="end" className="w-44 z-[120]" style={{ zIndex: 120 }}>
                          <DropdownMenuItem 
                            onClick={fitMapToMarkers}
                            className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                          >
                            <Target className="mr-2 h-3 w-3 text-blue-600" />
                            <span className="text-gray-900">Fit All Pins</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={clearAllMarkers}
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
                
                {/* Pins List */}
                <div className="max-h-64 overflow-y-auto">
                  {locations.map((location, index) => (
                    <motion.div
                      key={location.id}
                      className={`border-b border-gray-50 last:border-b-0 transition-colors ${
                        selectedLocation?.id === location.id 
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
                              style={{ backgroundColor: location.color || '#D2966E' }}
                            />
                          </motion.div>
                          
                          {/* Pin info - clickable area */}
                          <motion.div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedLocation(location);
                              map.current?.flyTo({
                                center: [location.longitude, location.latitude],
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
                              {selectedLocation?.id === location.id && (
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
                              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                            </p>
                          </motion.div>
                          
                          {/* Quick actions */}
                          <div className="flex items-center gap-1">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLocation(location);
                                map.current?.flyTo({
                                  center: [location.longitude, location.latitude],
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
                                removeLocation(location.id!);
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
                {locations.length >= maxPins && (
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
            className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-sm z-[80] border border-gray-200"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: selectedLocation.color || '#D2966E' }}
                  />
                  <p className="font-medium text-xs sm:text-sm">Selected Location</p>
                </div>
                <p className="text-muted-foreground text-xs break-words">
                  {selectedLocation.address || `${selectedLocation.latitude}, ${selectedLocation.longitude}`}
                </p>
              </div>
              {allowMultiple && locations.length > 1 && (
                <motion.button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title="Close"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-3 w-3" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 