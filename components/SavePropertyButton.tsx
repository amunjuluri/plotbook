'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { SavePropertyDialog } from './SavePropertyDialog';
import { PropertyLocation } from './EnhancedMapSearch';
import { toast } from 'sonner';

interface SavePropertyButtonProps {
  property: PropertyLocation;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onSaveStateChange?: (isSaved: boolean) => void;
}

export function SavePropertyButton({ 
  property, 
  variant = 'outline', 
  size = 'sm',
  showText = true,
  className = '',
  onSaveStateChange
}: SavePropertyButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const { checkIfSaved, removeSavedProperty, isPropertySaved } = useSavedProperties();

  // Check if property is saved when component mounts or property changes
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!property?.id) return;
      
      try {
        setCheckingStatus(true);
        
        // First check local state
        const localIsSaved = isPropertySaved(property.id);
        if (localIsSaved) {
          setIsSaved(true);
          setCheckingStatus(false);
          return;
        }

        // Then check server
        const result = await checkIfSaved(property.id);
        setIsSaved(result.isSaved);
        
        if (onSaveStateChange) {
          onSaveStateChange(result.isSaved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSavedStatus();
  }, [property?.id, checkIfSaved, isPropertySaved, onSaveStateChange]);

  const handleClick = async () => {
    if (!property || isLoading || checkingStatus) return;

    if (isSaved) {
      // Remove from saved properties
      try {
        setIsLoading(true);
        await removeSavedProperty(property.id);
        setIsSaved(false);
        
        if (onSaveStateChange) {
          onSaveStateChange(false);
        }
      } catch (error) {
        // Error is handled by the hook
        console.error('Failed to remove saved property:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show save dialog
      setShowSaveDialog(true);
    }
  };

  const handleSaveSuccess = () => {
    setIsSaved(true);
    setShowSaveDialog(false);
    
    if (onSaveStateChange) {
      onSaveStateChange(true);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 px-3 text-xs';
      case 'lg': return 'h-12 px-6 text-base';
      default: return 'h-10 px-4 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <motion.button
          onClick={handleClick}
          disabled={isLoading || checkingStatus}
          className={`relative p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isSaved ? 'Remove from saved properties' : 'Save property'}
        >
          {isLoading || checkingStatus ? (
            <Loader2 className={`${getIconSize()} animate-spin`} />
          ) : (
            <motion.div
              animate={{ 
                scale: isSaved ? [1, 1.2, 1] : 1,
                rotate: isSaved ? [0, -10, 10, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                className={`${getIconSize()} ${isSaved ? 'fill-current' : ''}`} 
              />
            </motion.div>
          )}
        </motion.button>

        <SavePropertyDialog
          property={property}
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveSuccess}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        disabled={isLoading || checkingStatus}
        className={`${getButtonSize()} ${
          isSaved 
            ? 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' 
            : ''
        } ${className}`}
      >
        {isLoading || checkingStatus ? (
          <Loader2 className={`${getIconSize()} mr-2 animate-spin`} />
        ) : (
          <motion.div
            animate={{ 
              scale: isSaved ? [1, 1.2, 1] : 1,
              rotate: isSaved ? [0, -10, 10, 0] : 0
            }}
            transition={{ duration: 0.3 }}
            className="mr-2"
          >
            <Heart 
              className={`${getIconSize()} ${isSaved ? 'fill-current text-pink-600' : ''}`} 
            />
          </motion.div>
        )}
        {showText && (
          <span>
            {isLoading 
              ? 'Saving...' 
              : isSaved 
              ? 'Saved' 
              : 'Save'
            }
          </span>
        )}
      </Button>

      <SavePropertyDialog
        property={property}
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveSuccess}
      />
    </>
  );
} 