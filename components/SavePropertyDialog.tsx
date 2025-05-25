'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, FileText, Save, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSavedProperties, SavePropertyData } from '@/hooks/useSavedProperties';
import { PropertyLocation } from './EnhancedMapSearch';

interface SavePropertyDialogProps {
  property: PropertyLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedProperty: any) => void;
}

export function SavePropertyDialog({ property, isOpen, onClose, onSave }: SavePropertyDialogProps) {
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { saveProperty, availableTags, getSavedProperty } = useSavedProperties();

  // Reset form when dialog opens/closes or property changes
  useEffect(() => {
    if (isOpen && property) {
      // Check if property is already saved and populate form
      const savedProperty = getSavedProperty(property.id);
      if (savedProperty) {
        setNotes(savedProperty.notes || '');
        setTags(savedProperty.tags || []);
      } else {
        setNotes('');
        setTags([]);
      }
      setNewTag('');
    }
  }, [isOpen, property, getSavedProperty]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
  };

  const handleSave = async () => {
    if (!property) return;

    try {
      setSaving(true);

      const saveData: SavePropertyData = {
        propertyId: property.id,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      const savedProperty = await saveProperty(saveData);
      
      if (onSave) {
        onSave(savedProperty);
      }
      
      onClose();
    } catch (error) {
      // Error is handled by the hook with toast
      console.error('Failed to save property:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  if (!property) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl z-[201] border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Save Property</h2>
                  <p className="text-sm text-gray-500">Add to your saved properties</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Property Preview */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-start gap-3">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm mt-2 flex-shrink-0"
                  style={{ backgroundColor: property.color || '#10b981' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1">
                    {property.address}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {property.city}, {property.stateCode}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {property.propertyType !== 'location' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {property.formattedValue}
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                      {property.propertyType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Notes Section */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes (Optional)
                </Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this property..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  rows={3}
                  disabled={saving}
                />
              </div>

              {/* Tags Section */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags (Optional)
                </Label>
                
                {/* Add New Tag */}
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    disabled={saving}
                  />
                  <Button
                    onClick={handleAddTag}
                    size="sm"
                    variant="outline"
                    disabled={!newTag.trim() || saving}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag, index) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-500 hover:text-blue-700 ml-1"
                          disabled={saving}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableTags
                        .filter(tag => !tags.includes(tag))
                        .slice(0, 6)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleSuggestedTag(tag)}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
                            disabled={saving}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Property
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 