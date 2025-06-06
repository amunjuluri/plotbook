"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  UserPlus, 
  CheckCircle,
  Filter,
  Users,
  Crown,
  Settings,
  BarChart3,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    name: string;
  };
  lastActive?: string;
  status: 'active' | 'inactive' | 'pending';
  canAccessDashboard: boolean;
  canAccessSavedProperties: boolean;
  canAccessTeamManagement: boolean;
}

interface TeamMembersTabProps {
  onStatsUpdate: () => void;
  onInvite?: () => void;
}

export function TeamMembersTab({ onInvite }: TeamMembersTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, refetch: refetchUser } = useUser();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        toast.error('Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Error loading team members');
    } finally {
      setLoading(false);
    }
  };

  const handleTabPermissionChange = async (memberId: string, permission: string, value: boolean) => {
    try {
      const response = await fetch(`/api/team/members/${memberId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [permission]: value }),
      });

      if (response.ok) {
        setMembers(prev => 
          prev.map(member => 
            member.id === memberId ? { ...member, [permission]: value } : member
          )
        );
        toast.success('Tab permissions updated successfully');
        
        // If the current user's permissions were changed, refresh their session
        if (user?.id === memberId) {
          await refetchUser();
        }
      } else {
        toast.error('Failed to update tab permissions');
      }
    } catch (error) {
      console.error('Error updating tab permissions:', error);
      toast.error('Error updating tab permissions');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getTabPermissions = (member: TeamMember) => {
    return [
      {
        name: 'Dashboard',
        icon: BarChart3,
        color: 'text-blue-600',
        permission: 'canAccessDashboard',
        enabled: member.canAccessDashboard
      },
      {
        name: 'Saved Properties',
        icon: Heart,
        color: 'text-red-600',
        permission: 'canAccessSavedProperties',
        enabled: member.canAccessSavedProperties
      },
      {
        name: 'My Team',
        icon: Users,
        color: 'text-purple-600',
        permission: 'canAccessTeamManagement',
        enabled: member.canAccessTeamManagement
      }
    ];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'manager': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'engineer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'designer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'analyst': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3" />;
      case 'manager': return <Users className="h-3 w-3" />;
      case 'engineer': return <Settings className="h-3 w-3" />;
      case 'designer': return <BarChart3 className="h-3 w-3" />;
      case 'analyst': return <BarChart3 className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Active
          </Badge>
        );
      case 'inactive': 
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
            Inactive
          </Badge>
        );
      case 'pending': 
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
            Pending
          </Badge>
        );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Access Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Access Level
                </label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Access Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access Levels</SelectItem>
                    <SelectItem value="admin">Full Access (Admin)</SelectItem>
                    <SelectItem value="manager">Management Access</SelectItem>
                    <SelectItem value="engineer">Development Access</SelectItem>
                    <SelectItem value="designer">Design Access</SelectItem>
                    <SelectItem value="analyst">Analytics Access</SelectItem>
                    <SelectItem value="user">Basic Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-gray-200 gap-3 sm:gap-0">
            <p className="text-sm text-gray-600">
              Showing {filteredMembers.length} of {members.length} members
            </p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={onInvite}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredMembers.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">No team members found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start by inviting team members to join your organization.'
                }
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={onInvite}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredMembers.map((member) => {
              const tabPermissions = getTabPermissions(member);
              
              return (
                <Card key={member.id} className="border border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{member.name}</h3>
                            {getStatusBadge(member.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 truncate">{member.email}</p>
                          
                          {/* Tab Access Permissions */}
                          <div className="space-y-2 sm:space-y-3">
                            <p className="text-xs font-medium text-gray-700">Tab Access:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {tabPermissions.map((tab, index) => {
                                const IconComponent = tab.icon;
                                return (
                                  <div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${member.id}-${tab.permission}`}
                                      checked={tab.enabled}
                                      onCheckedChange={(checked) => 
                                        handleTabPermissionChange(member.id, tab.permission, checked as boolean)
                                      }
                                      className="flex-shrink-0"
                                    />
                                    <label 
                                      htmlFor={`${member.id}-${tab.permission}`}
                                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm cursor-pointer min-w-0"
                                    >
                                      <IconComponent className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${tab.color}`} />
                                      <span className="truncate">{tab.name}</span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                            <Badge className={`text-xs font-medium border ${getRoleColor(member.role)}`}>
                              <div className="flex items-center gap-1">
                                {getRoleIcon(member.role)}
                                <span className="hidden xs:inline">{member.role.charAt(0).toUpperCase() + member.role.slice(1)} Access</span>
                                <span className="xs:hidden">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                              </div>
                            </Badge>
                            {member.emailVerified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span className="hidden xs:inline">Verified</span>
                                <span className="xs:hidden">✓</span>
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              Joined {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500 sm:hidden">
                              {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 