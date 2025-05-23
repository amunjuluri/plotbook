'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

// CSS styles for map
const mapContainerStyle = {
  position: 'absolute' as const,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: '100%',
  height: '100%'
};

// Use environment variable for Mapbox token with fallback
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYW5hbmRtdW5qdWx1cmkiLCJhIjoiY21hcGh3cHY4MGdkZjJqczNzaGQwbjRrbiJ9.0Ku8xuOZeSjD7Oojk7L6vQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

export interface PropertyLocation {
  latitude: number;
  longitude: number;
  address?: string;
  id?: string;
}

interface MapSearchProps {
  onLocationSelect?: (location: PropertyLocation) => void;
  initialLocation?: PropertyLocation;
  selectedLocation?: PropertyLocation | null;
  showMapOnly?: boolean;
  showFloatingSearch?: boolean;
  properties?: PropertyLocation[]; // Support for multiple property markers
}

export function MapSearch({ 
  onLocationSelect, 
  initialLocation, 
  selectedLocation,
  showMapOnly = false,
  showFloatingSearch = false,
  properties = []
}: MapSearchProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map()); // Support multiple markers
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<PropertyLocation | null>(initialLocation || selectedLocation || null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    console.log('Initializing map with container:', mapContainer.current);
    
    try {
      // Initial center based on props or default to NYC
      const startLocation = initialLocation || selectedLocation;
      const initialCenter = startLocation 
        ? [startLocation.longitude, startLocation.latitude]
        : [-74.0060, 40.7128]; // Default to NYC
      
      // Initialize the map
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter as [number, number],
        zoom: startLocation ? 15 : 12,
      });
      
      // Set the map instance ref
      map.current = mapInstance;
      
      // Add controls
      mapInstance.addControl(new mapboxgl.NavigationControl());
      
      // Handle map loading
      mapInstance.on('load', () => {
        console.log('Map loaded successfully!');
        
        // Add marker if initial location provided
        if (startLocation) {
          addMarker(startLocation.longitude, startLocation.latitude, startLocation.id || 'main', 'main');
        }
        
        // Add all property markers
        properties.forEach((property, index) => {
          addMarker(property.longitude, property.latitude, property.id || `property-${index}`, 'property');
        });
      });
      
      // Handle map clicks for property selection
      mapInstance.on('click', (e) => {
        const clickedLocation: PropertyLocation = {
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
          id: `clicked-${Date.now()}`
        };
        
        // Reverse geocode to get address
        reverseGeocode(e.lngLat.lng, e.lngLat.lat, clickedLocation);
      });
      
      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error loading map');
      });
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
    
    // Cleanup
    return () => {
      if (map.current) {
        // Clean up all markers
        markers.current.forEach(marker => marker.remove());
        markers.current.clear();
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLocation, selectedLocation]);

  // Update property markers when properties change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing property markers
    markers.current.forEach((marker, id) => {
      if (id.startsWith('property-')) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Add new property markers
    properties.forEach((property, index) => {
      addMarker(property.longitude, property.latitude, property.id || `property-${index}`, 'property');
    });
  }, [properties]);
  
  // Create or update marker with support for different types
  const addMarker = (longitude: number, latitude: number, id: string, type: 'main' | 'property' = 'main') => {
    if (!map.current) return;
    
    // Remove existing marker with same ID if it exists
    const existingMarker = markers.current.get(id);
    if (existingMarker) {
      existingMarker.remove();
    }
    
    // Create marker element with different styles based on type
    const el = document.createElement('div');
    el.className = `custom-marker ${type}-marker`;
    
    if (type === 'main') {
      // Main selected location marker (larger, blue)
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3B82F6';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      el.style.cursor = 'pointer';
      el.style.zIndex = '1000';
    } else {
      // Property marker (smaller, green)
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#10B981';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      el.style.cursor = 'pointer';
      el.style.zIndex = '999';
      
      // Add click handler for property markers
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const property = properties.find(p => (p.id || `property-${properties.indexOf(p)}`) === id);
        if (property && onLocationSelect) {
          onLocationSelect(property);
        }
      });
    }
    
    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });
    
    // Create and add new marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(map.current);
    
    // Store marker reference
    markers.current.set(id, marker);
  };

  // Reverse geocoding function
  const reverseGeocode = async (longitude: number, latitude: number, location: PropertyLocation) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          location.address = data.features[0].place_name;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    // Add marker and notify parent
    addMarker(longitude, latitude, location.id || 'clicked', 'main');
    setCurrentLocation(location);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };
  
  // Update map when selectedLocation changes
  useEffect(() => {
    if (!map.current || !selectedLocation) return;
    
    setCurrentLocation(selectedLocation);
    
    // Fly to location with animation
    map.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 15,
      essential: true
    });
    
    // Add marker
    addMarker(selectedLocation.longitude, selectedLocation.latitude, selectedLocation.id || 'selected', 'main');
  }, [selectedLocation]);
  
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
    addMarker(initialLocation.longitude, initialLocation.latitude, initialLocation.id || 'initial', 'main');
    
    // Update selected location state
    setCurrentLocation(initialLocation);
  }, [initialLocation]);
  
  const handleSearch = async () => {
    if (!map.current || !searchQuery.trim()) return;
    
    try {
      // Use Mapbox Geocoding API with better parameters
      const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `limit=1&` +
        `types=address,poi,place,locality,neighborhood&` +
        `country=US`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle Mapbox geocoding response
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const location: PropertyLocation = {
          latitude,
          longitude,
          address: data.features[0].place_name,
          id: data.features[0].id
        };
        
        console.log('Found location:', location);
        
        // Update state
        setCurrentLocation(location);
        
        // Update map
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 15,
          essential: true
        });
        
        // Add marker
        addMarker(location.longitude, location.latitude, location.id || 'search', 'main');
        
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

  // If showing map only, return just the map
  if (showMapOnly) {
    return (
      <div className="h-full w-full relative">
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-red-500">{mapError}</p>
          </div>
        ) : (
          <div 
            ref={mapContainer}
            style={mapContainerStyle}
            className="h-full w-full"
          />
        )}
        
        {/* Optional floating search */}
        {showFloatingSearch && (
          <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:w-96 z-10">
            <Card className="p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search addresses, cities, landmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Current location info */}
              {currentLocation && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <p className="font-medium text-blue-900">Selected:</p>
                  <p className="text-blue-700 truncate">
                    {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Default layout with search and map
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search for an address or location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      
      <Card className="flex-1 relative min-h-[500px]">
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-red-500">{mapError}</p>
          </div>
        ) : (
          <div 
            ref={mapContainer}
            style={mapContainerStyle}
            className="rounded-md overflow-hidden"
          />
        )}
      </Card>
      
      {currentLocation && (
        <div className="mt-4 text-sm">
          <p className="font-medium">Selected Location:</p>
          <p className="text-muted-foreground">{currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`}</p>
        </div>
      )}
    </div>
  );
} 