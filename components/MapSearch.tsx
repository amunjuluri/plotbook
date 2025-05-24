'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, Satellite, Map } from "lucide-react";

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

  return (
    <div className="relative w-full h-full">
      {/* Search box positioned on top of map */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative w-80">
          <Input
            placeholder="Search for an address or location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg focus:border-[#D2966E] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#D2966E] transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#D2966E] transition-colors"
            type="button"
          >
            <SearchIcon className="h-4 w-4"/>
          </button>
        </div>
      </div>

      {/* Map style toggle button positioned on bottom-right */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          onClick={toggleMapStyle}
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-gray-50 focus:outline-none"
          title={isSatellite ? "Switch to Standard View" : "Switch to Satellite View"}
        >
          {isSatellite ? <Map className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Map container taking full space */}
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-red-500">{mapError}</p>
        </div>
      ) : (
        <div 
          ref={mapContainer}
          style={mapContainerStyle}
          className="w-full h-full"
        />
      )}
      
      {/* Selected location info positioned at bottom */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-sm z-10 border border-gray-200">
          <p className="font-medium text-sm">Selected Location:</p>
          <p className="text-muted-foreground text-xs">{selectedLocation.address || `${selectedLocation.latitude}, ${selectedLocation.longitude}`}</p>
        </div>
      )}
    </div>
  );
} 