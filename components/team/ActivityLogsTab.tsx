"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Calendar,
  Shield,
  Eye,
  Edit,
  UserPlus,
  LogIn,
  LogOut,
  Settings,
  FileText,
  Heart,
  Map,
  Clock,
  Activity,
  Database,
  Users,
  Zap,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  action: string;
  actionType: 'auth' | 'data' | 'admin' | 'system';
  icon: string;
  timestamp: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    details: string;
  };
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'LogIn': LogIn,
  'LogOut': LogOut,
  'UserPlus': UserPlus,
  'Bookmark': Heart,
  'Eye': Eye,
  'Search': Map,
  'FileText': FileText,
  'Shield': Shield,
  'Edit': Edit,
  'Settings': Settings,
  'Download': Download,
  'Database': Database,
  'default': Activity
};

const ACTION_COLORS: Record<string, string> = {
  'auth': 'bg-blue-50 text-blue-700 border-blue-200',
  'data': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'admin': 'bg-red-50 text-red-700 border-red-200',
  'system': 'bg-purple-50 text-purple-700 border-purple-200'
};

export function ActivityLogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, [actionTypeFilter, dateFilter]);

  const fetchActivityLogs = async (pageNum = 1, reset = true) => {
    try {
      setLoading(pageNum === 1);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        search: searchTerm,
        actionType: actionTypeFilter,
        dateFilter: dateFilter
      });

      const response = await fetch(`/api/team/activity-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        
        if (reset) {
          setLogs(data.activities || []);
        } else {
          setLogs(prev => [...prev, ...(data.activities || [])]);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      } else {
        toast.error('Failed to fetch activity logs');
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Error loading activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchActivityLogs(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchActivityLogs(page + 1, false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        actionType: actionTypeFilter,
        dateFilter: dateFilter,
        format: 'csv'
      });

      const response = await fetch(`/api/team/activity-logs/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Activity logs exported successfully');
      } else {
        toast.error('Failed to export logs');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Error exporting logs');
    }
  };

  const getActionIcon = (iconName: string) => {
    const IconComponent = ACTION_ICONS[iconName] || ACTION_ICONS.default;
    return IconComponent;
  };

  const getActionTypeColor = (actionType: string) => {
    return ACTION_COLORS[actionType] || ACTION_COLORS.system;
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.metadata.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Activities
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
            </div>
            
            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      All Types
                    </div>
                  </SelectItem>
                  <SelectItem value="auth">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Authentication
                    </div>
                  </SelectItem>
                  <SelectItem value="data">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-emerald-600" />
                      Data Actions
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-red-600" />
                      Admin Actions
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      System Events
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      All Time
                    </div>
                  </SelectItem>
                  <SelectItem value="today">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Today
                    </div>
                  </SelectItem>
                  <SelectItem value="week">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      This Week
                    </div>
                  </SelectItem>
                  <SelectItem value="month">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      This Month
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} activities
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={exportLogs}
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No activity logs found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || actionTypeFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Activity logs will appear here as team members use the system.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredLogs.map((log, index) => {
              const ActionIcon = getActionIcon(log.icon);
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <Card className="hover:shadow-md transition-all duration-200 border-gray-200 hover:border-gray-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                            <AvatarImage src={log.user.avatar || undefined} alt={log.user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {log.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                              <ActionIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">{log.user.name}</span>
                                <Badge className={`text-xs font-medium border ${getActionTypeColor(log.actionType)}`}>
                                  {log.actionType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">{log.action}</p>
                              <p className="text-sm text-gray-500 mt-1">{log.metadata.details}</p>
                              {log.metadata.ipAddress && (
                                <div className="mt-2 text-xs text-gray-400">
                                  IP: {log.metadata.ipAddress}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {formatTimestamp(log.timestamp)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-8">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Activities'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 