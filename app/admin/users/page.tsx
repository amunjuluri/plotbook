"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  ChevronDown, 
  Download,
  Pencil, 
  Trash2, 
  Ban,
  UnlockKeyhole,
  UserCog,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock user data - in a real app this would come from your API with pagination
  const users = [
    { 
      id: "u1", 
      name: "Emma Wilson", 
      email: "emma@example.com", 
      role: "user", 
      status: "active", 
      joined: "May 12, 2023",
      verified: true,
    },
    { 
      id: "u2", 
      name: "James Miller", 
      email: "james@example.com", 
      role: "user", 
      status: "active", 
      joined: "May 10, 2023",
      verified: true,
    },
    { 
      id: "u3", 
      name: "Olivia Martinez", 
      email: "olivia@example.com", 
      role: "admin", 
      status: "active", 
      joined: "Apr 28, 2023",
      verified: true,
    },
    { 
      id: "u4", 
      name: "Noah Taylor", 
      email: "noah@example.com", 
      role: "user", 
      status: "banned", 
      joined: "Mar 15, 2023",
      verified: true,
    },
    { 
      id: "u5", 
      name: "Sophia Brown", 
      email: "sophia@example.com", 
      role: "user", 
      status: "pending", 
      joined: "May 18, 2023",
      verified: false,
    },
    { 
      id: "u6", 
      name: "William Jones", 
      email: "william@example.com", 
      role: "user", 
      status: "active", 
      joined: "Jan 5, 2023",
      verified: true,
    },
    { 
      id: "u7", 
      name: "Isabella Garcia", 
      email: "isabella@example.com", 
      role: "admin", 
      status: "active", 
      joined: "Feb 20, 2023",
      verified: true,
    },
  ];

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    // Search term filter
    const matchesSearch = 
      searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-base text-gray-500">
            View and manage all users on your platform
          </p>
        </div>
        <div>
          <Button 
            className="flex items-center gap-2"
            style={{ backgroundColor: '#1E1433' }}
          >
            <UserCog className="h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search for specific users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <div className="relative">
                <select
                  className="w-full h-10 pl-3 pr-8 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <select
                  className="w-full h-10 pl-3 pr-8 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="banned">Banned</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
              <Button variant="ghost" className="h-10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Verified</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-purple-100 text-purple-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.joined}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button className="p-1 rounded-full hover:bg-gray-100" title="Edit User">
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {user.status === "banned" ? (
                          <button className="p-1 rounded-full hover:bg-gray-100" title="Unban User">
                            <UnlockKeyhole className="h-4 w-4 text-green-500" />
                          </button>
                        ) : (
                          <button className="p-1 rounded-full hover:bg-gray-100" title="Ban User">
                            <Ban className="h-4 w-4 text-orange-500" />
                          </button>
                        )}
                        
                        <button className="p-1 rounded-full hover:bg-gray-100" title="Delete User">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredUsers.length}</span> of{" "}
              <span className="font-medium">{filteredUsers.length}</span> results
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 