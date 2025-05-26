"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Download,
  Map,
  Heart,
  BarChart3,
  UserPlus,
  Database,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'navigation' | 'data' | 'management' | 'reports';
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  userCount: number;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Navigation permissions
  {
    id: 'view_map_search',
    name: 'Map Search',
    description: 'Access to property map search functionality',
    icon: Map,
    category: 'navigation'
  },
  {
    id: 'view_saved_properties',
    name: 'Saved Properties',
    description: 'View and manage saved properties',
    icon: Heart,
    category: 'navigation'
  },
  {
    id: 'view_dashboard',
    name: 'Dashboard',
    description: 'Access to analytics dashboard',
    icon: BarChart3,
    category: 'navigation'
  },
  {
    id: 'view_team',
    name: 'Team Management',
    description: 'Access to team management (Admin only)',
    icon: Users,
    category: 'navigation'
  },
  
  // Data permissions
  {
    id: 'save_properties',
    name: 'Save Properties',
    description: 'Save properties to personal collection',
    icon: Heart,
    category: 'data'
  },
  {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export property data and reports',
    icon: Download,
    category: 'data'
  },
  {
    id: 'view_property_details',
    name: 'Property Details',
    description: 'View detailed property information',
    icon: Eye,
    category: 'data'
  },
  {
    id: 'access_database',
    name: 'Database Access',
    description: 'Direct access to property database',
    icon: Database,
    category: 'data'
  },
  
  // Management permissions
  {
    id: 'invite_users',
    name: 'Invite Users',
    description: 'Send invitations to new team members',
    icon: UserPlus,
    category: 'management'
  },
  {
    id: 'manage_roles',
    name: 'Manage Roles',
    description: 'Create and modify user roles',
    icon: Shield,
    category: 'management'
  },
  {
    id: 'edit_user_profiles',
    name: 'Edit User Profiles',
    description: 'Modify other users\' profiles and settings',
    icon: Edit,
    category: 'management'
  },
  {
    id: 'system_settings',
    name: 'System Settings',
    description: 'Access to system configuration',
    icon: Settings,
    category: 'management'
  },
  
  // Reports permissions
  {
    id: 'generate_reports',
    name: 'Generate Reports',
    description: 'Create and download property reports',
    icon: FileText,
    category: 'reports'
  },
  {
    id: 'view_analytics',
    name: 'View Analytics',
    description: 'Access to detailed analytics and insights',
    icon: BarChart3,
    category: 'reports'
  }
];

export function RoleManagementTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/team/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
        if (data.roles?.length > 0) {
          setSelectedRole(data.roles[0].id);
        }
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error loading roles');
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = async (roleId: string, permissions: string[]) => {
    try {
      const response = await fetch(`/api/team/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        setRoles(prev => 
          prev.map(role => 
            role.id === roleId ? { ...role, permissions } : role
          )
        );
        toast.success('Permissions updated successfully');
      } else {
        toast.error('Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Error updating permissions');
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions.includes(permissionId);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    updateRolePermissions(roleId, newPermissions);
  };

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return Map;
      case 'data': return Database;
      case 'management': return Users;
      case 'reports': return FileText;
      default: return Shield;
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === role.id ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`text-xs border ${getRoleColor(role.color)}`}>
                    {role.name}
                  </Badge>
                  <span className="text-sm text-gray-500">{role.userCount} users</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                <div className="text-xs text-gray-500">
                  {role.permissions.length} permissions
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Permission Management */}
      {selectedRoleData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {selectedRoleData.name} Permissions
                </CardTitle>
                <CardDescription>
                  Manage what {selectedRoleData.name.toLowerCase()} users can access and do
                </CardDescription>
              </div>
              <Badge className={`${getRoleColor(selectedRoleData.color)}`}>
                {selectedRoleData.userCount} users with this role
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {['navigation', 'data', 'management', 'reports'].map(category => {
                const categoryPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === category);
                const CategoryIcon = getCategoryIcon(category);
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <CategoryIcon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {category} Permissions
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                      {categoryPermissions.map(permission => {
                        const PermissionIcon = permission.icon;
                        const hasPermission = selectedRoleData.permissions.includes(permission.id);
                        
                        return (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <PermissionIcon className="h-5 w-5 text-gray-600" />
                              <div>
                                <Label className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-gray-600 mt-1">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={hasPermission}
                              onCheckedChange={() => togglePermission(selectedRoleData.id, permission.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 