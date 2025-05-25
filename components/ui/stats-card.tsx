import React from 'react';
import { Card } from './card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  className = '' 
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className={`p-6 bg-white border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {change && (
            <p className={`text-sm font-medium ${getTrendColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className="ml-4 p-3 bg-gray-50 rounded-xl">
          <div className="text-gray-600">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
} 