'use client';

import React, { useState, useRef } from 'react';
import { MapSearch, PropertyLocation } from './MapSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MapSearchExample() {
  const [locations, setLocations] = useState<PropertyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PropertyLocation | null>(null);
  const addPinRef = useRef<((lat: number, lng: number, address?: string, color?: string) => void) | null>(null);
  
  // Form state for manual pin addition
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Example initial locations (optional)
  const exampleInitialLocations: PropertyLocation[] = [
    {
      id: 'example-1',
      latitude: 40.7589,
      longitude: -73.9851,
      address: 'Times Square, New York, NY',
      color: '#FF6B6B'
    },
    {
      id: 'example-2',
      latitude: 40.7505,
      longitude: -73.9934,
      address: 'Empire State Building, New York, NY',
      color: '#4ECDC4'
    }
  ];

  const handleLocationSelect = (location: PropertyLocation) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
  };

  const handleLocationsChange = (newLocations: PropertyLocation[]) => {
    console.log('Locations updated:', newLocations);
    setLocations(newLocations);
  };

  // Handle the addPin function from MapSearch
  const handleAddPinFunction = (addPinFunction: (lat: number, lng: number, address?: string, color?: string) => void) => {
    addPinRef.current = addPinFunction;
  };

  // Add pin manually with coordinates
  const addManualPin = () => {
    if (!addPinRef.current) return;
    
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    // Generate a random color for the pin
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addPinRef.current(lat, lng, manualAddress || undefined, randomColor);
    
    // Clear form
    setManualLat('');
    setManualLng('');
    setManualAddress('');
  };

  // Add some preset locations
  const addPresetLocation = (lat: number, lng: number, address: string, color: string) => {
    if (addPinRef.current) {
      addPinRef.current(lat, lng, address, color);
    }
  };

  return (
    <div className="w-full h-screen relative">
      <MapSearch
        // Single location callback
        onLocationSelect={handleLocationSelect}
        
        // Multiple locations callback
        onLocationsChange={handleLocationsChange}
        
        // Get the addPin function
        onAddPin={handleAddPinFunction}
        
        // Initial locations (optional)
        // initialLocations={exampleInitialLocations}
        
        // Multiple pins settings
        allowMultiple={true}  // Enable multiple pins (default: true)
        maxPins={8}          // Maximum number of pins (default: 10)
      />
      
      {/* Manual Pin Addition Panel */}
      <div className="absolute top-4 left-4 z-[95] bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-sm border border-gray-200">
        <h3 className="font-semibold mb-3 text-sm">Add Pin Manually</h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lat" className="text-xs">Latitude</Label>
              <Input
                id="lat"
                type="number"
                placeholder="40.7128"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="text-xs h-8"
                step="any"
                min="-90"
                max="90"
              />
            </div>
            <div>
              <Label htmlFor="lng" className="text-xs">Longitude</Label>
              <Input
                id="lng"
                type="number"
                placeholder="-74.0060"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="text-xs h-8"
                step="any"
                min="-180"
                max="180"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address" className="text-xs">Address (Optional)</Label>
            <Input
              id="address"
              placeholder="Custom location name"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          
          <Button 
            onClick={addManualPin}
            className="w-full h-8 text-xs"
            disabled={!manualLat || !manualLng}
          >
            Add Pin
          </Button>
        </div>
        
        {/* Preset locations */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium mb-2 text-gray-700">Quick Add:</p>
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addPresetLocation(40.7128, -74.0060, 'New York City', '#FF6B6B')}
              className="w-full h-7 text-xs"
            >
              NYC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addPresetLocation(34.0522, -118.2437, 'Los Angeles', '#4ECDC4')}
              className="w-full h-7 text-xs"
            >
              LA
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addPresetLocation(41.8781, -87.6298, 'Chicago', '#45B7D1')}
              className="w-full h-7 text-xs"
            >
              Chicago
            </Button>
          </div>
        </div>
      </div>
      
      {/* Current locations info */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[85] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-sm border border-gray-200">
          <h3 className="font-semibold mb-2 text-sm">Current Pins ({locations.length})</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {locations.map((location, index) => (
              <div key={location.id} className="text-xs flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: location.color || '#D2966E' }}
                />
                <span className="font-medium">Pin {index + 1}:</span>
                <span className="truncate">
                  {location.address || `${location.latitude}, ${location.longitude}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Example usage patterns:

// 1. Basic usage with multiple pins enabled (default)
export function BasicMultiplePinsExample() {
  return (
    <MapSearch
      onLocationsChange={(locations) => console.log('Locations:', locations)}
      allowMultiple={true}
      maxPins={10}
    />
  );
}

// 2. Single pin mode (like the original behavior)
export function SinglePinExample() {
  return (
    <MapSearch
      onLocationSelect={(location) => console.log('Selected:', location)}
      allowMultiple={false}
    />
  );
}

// 3. With initial locations
export function WithInitialLocationsExample() {
  const initialLocations: PropertyLocation[] = [
    {
      id: 'loc-1',
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York City, NY',
      color: '#FF6B6B'
    },
    {
      id: 'loc-2',
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles, CA',
      color: '#4ECDC4'
    }
  ];

  return (
    <MapSearch
      initialLocations={initialLocations}
      onLocationsChange={(locations) => console.log('Updated locations:', locations)}
      allowMultiple={true}
      maxPins={5}
    />
  );
}

// 4. Programmatic pin addition example
export function ProgrammaticPinExample() {
  const addPinRef = useRef<((lat: number, lng: number, address?: string, color?: string) => void) | null>(null);

  const addRandomPin = () => {
    if (!addPinRef.current) return;
    
    // Add a random pin in the continental US
    const lat = 25 + Math.random() * 25; // Between 25 and 50
    const lng = -125 + Math.random() * 50; // Between -125 and -75
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    addPinRef.current(lat, lng, `Random Location ${Date.now()}`, color);
  };

  return (
    <div className="w-full h-screen relative">
      <MapSearch
        onAddPin={(addPinFunction) => { addPinRef.current = addPinFunction; }}
        onLocationsChange={(locations) => console.log('Locations:', locations)}
        allowMultiple={true}
        maxPins={5}
      />
      
      <div className="absolute top-4 left-4 z-50">
        <Button onClick={addRandomPin}>
          Add Random Pin
        </Button>
      </div>
    </div>
  );
} 