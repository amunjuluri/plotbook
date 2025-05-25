"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Database,
  Search,
  Building,
  DollarSign,
  MapPin,
  User,
  FileX,
  TrendingUp,
  Filter,
  Settings
} from 'lucide-react';
import { SavedProperty } from '@/hooks/useSavedProperties';
import { 
  reportGenerator,
  AVAILABLE_FIELDS,
  ReportField,
  ReportOptions 
} from '@/utils/reportGenerator';
import { toast } from 'sonner';

// Enhanced Separator component with gradient
const Separator = ({ className = "" }: { className?: string }) => (
  <div className={`h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent ${className}`} />
);

// Enhanced ScrollArea component
const ScrollArea = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}>
    {children}
  </div>
);

interface ReportBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savedProperties: SavedProperty[];
}

export function ReportBuilderDialog({ 
  isOpen, 
  onClose, 
  savedProperties 
}: ReportBuilderDialogProps) {
  const [reportTitle, setReportTitle] = useState('Property Portfolio Report');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'property.address',
    'property.city',
    'property.state',
    'property.propertyType',
    'property.currentValue'
  ]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [sortBy, setSortBy] = useState<string>('property.currentValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [propertySearch, setPropertySearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!propertySearch) return savedProperties;
    
    return savedProperties.filter(property => 
      property.property.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
      property.property.city?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      property.tags.some(tag => tag.toLowerCase().includes(propertySearch.toLowerCase())) ||
      property.notes?.toLowerCase().includes(propertySearch.toLowerCase())
    );
  }, [savedProperties, propertySearch]);

  // Group fields by category with better categorization
  const fieldsByCategory = useMemo(() => {
    const categories = ['basic', 'financial', 'location', 'ownership', 'personal'] as const;
    return categories.reduce((acc, category) => {
      acc[category] = AVAILABLE_FIELDS.filter(field => field.category === category);
      return acc;
    }, {} as Record<string, ReportField[]>);
  }, []);

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAllProperties = () => {
    const allIds = filteredProperties.map(p => p.id);
    setSelectedProperties(
      selectedProperties.length === allIds.length ? [] : allIds
    );
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleCategoryToggle = (category: string) => {
    const categoryFields = fieldsByCategory[category as keyof typeof fieldsByCategory];
    const categoryFieldKeys = categoryFields.map(f => f.key);
    const allSelected = categoryFieldKeys.every(key => selectedFields.includes(key));
    
    if (allSelected) {
      setSelectedFields(prev => prev.filter(key => !categoryFieldKeys.includes(key)));
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...categoryFieldKeys])]);
    }
  };

  const generateReport = async () => {
    if (selectedProperties.length === 0) {
      toast.error('Please select at least one property');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    const propertiesToExport = savedProperties.filter(p => 
      selectedProperties.includes(p.id)
    );

    const reportOptions: ReportOptions = {
      title: reportTitle,
      selectedFields,
      selectedProperties: propertiesToExport,
      format: exportFormat,
      sortBy,
      sortOrder
    };

    setIsGenerating(true);

    try {
      await reportGenerator.generateReport(reportOptions);
      toast.success(`Report generated successfully! ${exportFormat.toUpperCase()} file downloaded.`);
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return FileText;
      case 'excel': return FileSpreadsheet;
      case 'csv': return Database;
      case 'json': return Database;
      default: return FileText;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return Building;
      case 'financial': return DollarSign;
      case 'location': return MapPin;
      case 'ownership': return User;
      case 'personal': return FileX;
      default: return Building;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'basic': return 'Property Details';
      case 'financial': return 'Financial Information';
      case 'location': return 'Location Data';
      case 'ownership': return 'Ownership Records';
      case 'personal': return 'Personal Notes & Tags';
      default: return category;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] w-[95vw] overflow-hidden bg-gradient-to-br from-white to-gray-50 flex flex-col">
        <DialogHeader className="pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create Property Report
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Generate comprehensive reports from your saved properties with customizable fields and formats.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 py-6 overflow-hidden">
          <Tabs defaultValue="properties" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl flex-shrink-0">
              <TabsTrigger value="properties" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CheckSquare className="h-4 w-4" />
                Select Properties
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Filter className="h-4 w-4" />
                Choose Fields
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                Export Options
              </TabsTrigger>
            </TabsList>

            {/* Properties Selection Tab */}
            <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllProperties}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
                    >
                      {selectedProperties.length === filteredProperties.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      {selectedProperties.length === filteredProperties.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                      {selectedProperties.length} of {filteredProperties.length} selected
                    </Badge>
                  </div>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search properties by address, city, or tags..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: 'calc(100% - 120px)' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                    {filteredProperties.map((property) => (
                      <motion.div
                        key={property.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                          selectedProperties.includes(property.id) 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Checkbox
                                checked={selectedProperties.includes(property.id)}
                                onCheckedChange={() => handlePropertyToggle(property.id)}
                                className="mt-1 border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                                  {property.property.address}
                                </h4>
                                <p className="text-gray-600 mb-3 flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {property.property.city}, {property.property.state}
                                </p>
                                <div className="flex items-center gap-3 mb-4">
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    ${property.property.currentValue?.toLocaleString() || 'N/A'}
                                  </Badge>
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 capitalize">
                                    {property.property.propertyType}
                                  </Badge>
                                </div>
                                {property.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {property.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {property.tags.length > 3 && (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                        +{property.tags.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Fields Selection Tab */}
            <TabsContent value="fields" className="flex-1 overflow-hidden mt-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium text-base px-4 py-2">
                    {selectedFields.length} fields selected
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: 'calc(100% - 100px)' }}>
                  <div className="space-y-8 pb-4">
                    {Object.entries(fieldsByCategory).map(([category, fields]) => {
                      const allSelected = fields.every(field => selectedFields.includes(field.key));
                      const someSelected = fields.some(field => selectedFields.includes(field.key));
                      const IconComponent = getCategoryIcon(category);

                      return (
                        <div key={category} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={allSelected}
                                  ref={(ref) => {
                                    if (ref && 'indeterminate' in ref) {
                                      (ref as any).indeterminate = someSelected && !allSelected;
                                    }
                                  }}
                                  onCheckedChange={() => handleCategoryToggle(category)}
                                  className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {getCategoryLabel(category)}
                                </h3>
                                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                  {fields.filter(f => selectedFields.includes(f.key)).length}/{fields.length}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {fields.map((field) => (
                              <div
                                key={field.key}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                              >
                                <Checkbox
                                  id={field.key}
                                  checked={selectedFields.includes(field.key)}
                                  onCheckedChange={() => handleFieldToggle(field.key)}
                                  className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label
                                  htmlFor={field.key}
                                  className="text-sm font-medium cursor-pointer text-gray-700"
                                >
                                  {field.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Export Options Tab */}
            <TabsContent value="export" className="flex-1 overflow-hidden mt-0">
              <div className="h-full overflow-y-auto pr-4">
                <div className="space-y-8 pb-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <Label htmlFor="report-title" className="text-base font-semibold text-gray-900 mb-3 block">
                      Report Title
                    </Label>
                    <Input
                      id="report-title"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="Enter report title..."
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg"
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <Label className="text-base font-semibold text-gray-900 mb-4 block">Export Format</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'pdf', label: 'PDF Document', description: 'Professional formatted report with tables and summaries', color: 'from-red-500 to-red-600' },
                        { value: 'excel', label: 'Excel Spreadsheet', description: 'Editable data with multiple sheets and formulas', color: 'from-green-500 to-green-600' },
                        { value: 'csv', label: 'CSV File', description: 'Simple comma-separated values for data analysis', color: 'from-blue-500 to-blue-600' },
                        { value: 'json', label: 'JSON Data', description: 'Structured data format for developers', color: 'from-purple-500 to-purple-600' }
                      ].map((format) => {
                        const IconComponent = getFormatIcon(format.value);
                        return (
                          <motion.div
                            key={format.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                                exportFormat === format.value 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                              onClick={() => setExportFormat(format.value as any)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <div className={`w-12 h-12 bg-gradient-to-br ${format.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                    <IconComponent className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-lg mb-1">{format.label}</h4>
                                    <p className="text-sm text-gray-600">{format.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <Label className="text-base font-semibold text-gray-900 mb-3 block">Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select field to sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.filter(field => selectedFields.includes(field.key)).map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <Label className="text-base font-semibold text-gray-900 mb-3 block">Sort Order</Label>
                      <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending (Low to High)</SelectItem>
                          <SelectItem value="desc">Descending (High to Low)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-blue-900 mb-4 text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Report Summary
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">{selectedProperties.length}</div>
                          <div className="text-sm text-blue-700">Properties</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">{selectedFields.length}</div>
                          <div className="text-sm text-blue-700">Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">{exportFormat.toUpperCase()}</div>
                          <div className="text-sm text-blue-700">Format</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">{sortOrder === 'asc' ? '↑' : '↓'}</div>
                          <div className="text-sm text-blue-700">Sort Order</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-between pt-6 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="bg-white border-gray-300 hover:bg-gray-50">
            Cancel
          </Button>
          <Button 
            onClick={generateReport}
            disabled={isGenerating || selectedProperties.length === 0 || selectedFields.length === 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-8 py-3 text-base shadow-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
                />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-3" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 