import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { SavedProperty } from '@/hooks/useSavedProperties';

export interface ReportField {
  key: string;
  label: string;
  category: 'basic' | 'financial' | 'location' | 'ownership' | 'personal';
  type: 'text' | 'number' | 'currency' | 'date' | 'array';
  format?: (value: any, property?: any) => string;
}

export interface ReportOptions {
  title: string;
  selectedFields: string[];
  selectedProperties: SavedProperty[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const AVAILABLE_FIELDS: ReportField[] = [
  // Basic Property Information
  {
    key: 'property.address',
    label: 'Address',
    category: 'basic',
    type: 'text'
  },
  {
    key: 'property.city',
    label: 'City',
    category: 'basic',
    type: 'text'
  },
  {
    key: 'property.state',
    label: 'State',
    category: 'basic',
    type: 'text'
  },
  {
    key: 'property.propertyType',
    label: 'Property Type',
    category: 'basic',
    type: 'text'
  },
  {
    key: 'property.squareFootage',
    label: 'Square Footage',
    category: 'basic',
    type: 'number',
    format: (value: any) => value ? `${value.toLocaleString()} sq ft` : 'N/A'
  },
  {
    key: 'property.bedrooms',
    label: 'Bedrooms',
    category: 'basic',
    type: 'number'
  },
  {
    key: 'property.bathrooms',
    label: 'Bathrooms',
    category: 'basic',
    type: 'number'
  },
  {
    key: 'property.yearBuilt',
    label: 'Year Built',
    category: 'basic',
    type: 'number'
  },

  // Financial Information
  {
    key: 'property.currentValue',
    label: 'Current Value',
    category: 'financial',
    type: 'currency',
    format: (value: any) => value ? `$${value.toLocaleString()}` : 'N/A'
  },
  {
    key: 'pricePerSqFt',
    label: 'Price per Sq Ft',
    category: 'financial',
    type: 'currency',
    format: (value: any, property: any) => {
      if (property?.currentValue && property?.squareFootage) {
        const price = property.currentValue / property.squareFootage;
        return `$${Math.round(price)}`;
      }
      return 'N/A';
    }
  },

  // Location Information
  {
    key: 'property.latitude',
    label: 'Latitude',
    category: 'location',
    type: 'number',
    format: (value: any) => value?.toFixed(6)
  },
  {
    key: 'property.longitude',
    label: 'Longitude',
    category: 'location',
    type: 'number',
    format: (value: any) => value?.toFixed(6)
  },

  // Ownership Information
  {
    key: 'property.owners',
    label: 'Owners',
    category: 'ownership',
    type: 'array',
    format: (value: any) => value?.map((owner: any) => owner.name || 'Unknown').join(', ') || 'N/A'
  },

  // Personal Data
  {
    key: 'notes',
    label: 'Notes',
    category: 'personal',
    type: 'text'
  },
  {
    key: 'tags',
    label: 'Tags',
    category: 'personal',
    type: 'array',
    format: (value: any) => Array.isArray(value) ? value.join(', ') : ''
  },
  {
    key: 'createdAt',
    label: 'Date Saved',
    category: 'personal',
    type: 'date',
    format: (value: any) => new Date(value).toLocaleDateString()
  }
];

export class PropertyReportGenerator {
  private getFieldValue(property: SavedProperty, fieldKey: string): any {
    const keys = fieldKey.split('.');
    let value = property as any;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) break;
    }
    
    return value;
  }

  private formatFieldValue(field: ReportField, value: any, property: SavedProperty): string {
    if (value === undefined || value === null) return 'N/A';
    
    if (field.format) {
      return field.format(value, property.property);
    }
    
    switch (field.type) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : String(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : new Date(value).toLocaleDateString();
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  }

  private prepareData(options: ReportOptions): any[] {
    const { selectedFields, selectedProperties } = options;
    const fields = AVAILABLE_FIELDS.filter(field => selectedFields.includes(field.key));
    
    let data = selectedProperties.map(property => {
      const row: any = {};
      fields.forEach(field => {
        const value = this.getFieldValue(property, field.key);
        row[field.label] = this.formatFieldValue(field, value, property);
        row[`_raw_${field.key}`] = value; // Keep raw value for sorting
      });
      return row;
    });

    // Apply sorting if specified
    if (options.sortBy) {
      const sortField = fields.find(f => f.key === options.sortBy);
      if (sortField) {
        data.sort((a, b) => {
          const aVal = a[`_raw_${options.sortBy!}`];
          const bVal = b[`_raw_${options.sortBy!}`];
          
          let comparison = 0;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else {
            comparison = String(aVal || '').localeCompare(String(bVal || ''));
          }
          
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
    }

    // Remove raw values from final data
    return data.map(row => {
      const cleanRow: any = {};
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_raw_')) {
          cleanRow[key] = row[key];
        }
      });
      return cleanRow;
    });
  }

  async generatePDF(options: ReportOptions): Promise<void> {
    const data = this.prepareData(options);
    const fields = AVAILABLE_FIELDS.filter(field => options.selectedFields.includes(field.key));
    
    const doc = new jsPDF({
      orientation: fields.length > 6 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(options.title, 20, 25);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Properties: ${options.selectedProperties.length}`, 20, 42);

    // Add table
    const headers = fields.map(field => field.label);
    const rows = data.map(row => 
      fields.map(field => row[field.label] || 'N/A')
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Light gray
      },
      columnStyles: fields.reduce((acc, field, index) => {
        if (field.type === 'currency' || field.type === 'number') {
          acc[index] = { halign: 'right' };
        }
        return acc;
      }, {} as any)
    });

    // Add summary if applicable
    if (data.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total Properties: ${data.length}`, 20, finalY + 10);
      
      // Calculate totals for currency fields
      const currencyFields = fields.filter(f => f.type === 'currency');
      currencyFields.forEach((field, index) => {
        const total = options.selectedProperties.reduce((sum, property) => {
          const value = this.getFieldValue(property, field.key);
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        
        if (total > 0) {
          doc.text(`Total ${field.label}: $${total.toLocaleString()}`, 20, finalY + 20 + (index * 7));
        }
      });
    }

    doc.save(`${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  }

  generateExcel(options: ReportOptions): void {
    const data = this.prepareData(options);
    const fields = AVAILABLE_FIELDS.filter(field => options.selectedFields.includes(field.key));
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const colWidths = fields.map(field => ({
      wch: Math.max(field.label.length + 5, 15)
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    
    // Summary sheet
    const summaryData = [
      { Metric: 'Total Properties', Value: options.selectedProperties.length },
      { Metric: 'Report Generated', Value: new Date().toLocaleDateString() },
      { Metric: 'Report Title', Value: options.title }
    ];
    
    // Add totals for currency fields
    const currencyFields = fields.filter(f => f.type === 'currency');
    currencyFields.forEach(field => {
      const total = options.selectedProperties.reduce((sum, property) => {
        const value = this.getFieldValue(property, field.key);
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      
      if (total > 0) {
        summaryData.push({
          Metric: `Total ${field.label}`,
          Value: `$${total.toLocaleString()}`
        });
      }
    });
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Save file
    XLSX.writeFile(wb, `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
  }

  generateCSV(options: ReportOptions): void {
    const data = this.prepareData(options);
    
    // Convert to CSV
    const fields = AVAILABLE_FIELDS.filter(field => options.selectedFields.includes(field.key));
    const headers = fields.map(field => field.label);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        fields.map(field => {
          const value = row[field.label] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  }

  generateJSON(options: ReportOptions): void {
    const data = this.prepareData(options);
    
    const reportData = {
      metadata: {
        title: options.title,
        generatedAt: new Date().toISOString(),
        totalProperties: options.selectedProperties.length,
        fields: options.selectedFields
      },
      properties: data
    };
    
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
  }

  async generateReport(options: ReportOptions): Promise<void> {
    switch (options.format) {
      case 'pdf':
        await this.generatePDF(options);
        break;
      case 'excel':
        this.generateExcel(options);
        break;
      case 'csv':
        this.generateCSV(options);
        break;
      case 'json':
        this.generateJSON(options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }
}

export const reportGenerator = new PropertyReportGenerator(); 