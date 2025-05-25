import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface SavedProperty {
  id: string;
  propertyId: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  property: {
    id: string;
    address: string;
    propertyType: string;
    currentValue: number | null;
    squareFootage: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    yearBuilt: number | null;
    latitude: number;
    longitude: number;
    city: string | null;
    state: string;
    stateCode: string;
    owners: Array<{
      name: string | null;
      ownershipPercent: number;
    }>;
  };
}

export interface SavePropertyData {
  propertyId: string;
  notes?: string;
  tags?: string[];
}

export function useSavedProperties() {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved properties
  const fetchSavedProperties = useCallback(async (page = 1, limit = 20, tag?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (tag) {
        params.append('tag', tag);
      }

      const response = await fetch(`/api/properties/save?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch saved properties');
      }

      setSavedProperties(data.savedProperties);
      setAvailableTags(data.availableTags);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch saved properties';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if a property is saved
  const checkIfSaved = useCallback(async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/save/check?propertyId=${propertyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check saved status');
      }

      return data;
    } catch (err) {
      console.error('Error checking saved status:', err);
      return { isSaved: false, savedProperty: null };
    }
  }, []);

  // Save a property
  const saveProperty = useCallback(async (saveData: SavePropertyData) => {
    try {
      setError(null);

      const response = await fetch('/api/properties/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save property');
      }

      // Optimistically update the saved properties list
      setSavedProperties(prev => [data.savedProperty, ...prev]);

      // Update available tags if new tags were added
      if (saveData.tags && saveData.tags.length > 0) {
        setAvailableTags(prev => {
          const newTags = saveData.tags!.filter(tag => !prev.includes(tag));
          return [...prev, ...newTags].sort();
        });
      }

      toast.success('Property saved successfully!', {
        description: `${data.savedProperty.property.address} has been added to your saved properties.`
      });

      return data.savedProperty;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save property';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Remove a saved property
  const removeSavedProperty = useCallback(async (propertyId: string) => {
    try {
      setError(null);

      // Optimistically remove from the list
      const originalProperties = savedProperties;
      setSavedProperties(prev => prev.filter(sp => sp.propertyId !== propertyId));

      const response = await fetch(`/api/properties/save?propertyId=${propertyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update on error
        setSavedProperties(originalProperties);
        throw new Error(data.error || 'Failed to remove saved property');
      }

      toast.success('Property removed from saved list');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove saved property';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [savedProperties]);

  // Update saved property (notes/tags)
  const updateSavedProperty = useCallback(async (propertyId: string, updates: { notes?: string; tags?: string[] }) => {
    try {
      setError(null);

      // First remove the property, then save it again with updates
      await fetch(`/api/properties/save?propertyId=${propertyId}`, {
        method: 'DELETE',
      });

      const saveData: SavePropertyData = {
        propertyId,
        ...updates
      };

      return await saveProperty(saveData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update saved property';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [saveProperty]);

  // Get saved property by ID
  const getSavedProperty = useCallback((propertyId: string) => {
    return savedProperties.find(sp => sp.propertyId === propertyId);
  }, [savedProperties]);

  // Check if property is saved (from local state)
  const isPropertySaved = useCallback((propertyId: string) => {
    return savedProperties.some(sp => sp.propertyId === propertyId);
  }, [savedProperties]);

  return {
    savedProperties,
    availableTags,
    loading,
    error,
    fetchSavedProperties,
    checkIfSaved,
    saveProperty,
    removeSavedProperty,
    updateSavedProperty,
    getSavedProperty,
    isPropertySaved,
  };
} 