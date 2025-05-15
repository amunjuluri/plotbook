"use client";

import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Users, 
  Building, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  ChevronRight,
  CalendarDays,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  // In a real app, these would come from your API
  const stats = [
    {
      title: "Total Users",
      value: "4,891",
      change: "+12.4%",
      isPositive: true,
      icon: <Users className="h-7 w-7" />,
      iconColor: "bg-blue-50 text-blue-500",
      period: "from last month",
    },
    {
      title: "Properties",
      value: "12,584",
      change: "+5.2%",
      isPositive: true,
      icon: <Building className="h-7 w-7" />,
      iconColor: "bg-purple-50 text-purple-600",
      period: "from last month",
    },
    {
      title: "Revenue",
      value: "$59,342",
      change: "-3.1%",
      isPositive: false,
      icon: <DollarSign className="h-7 w-7" />,
      iconColor: "bg-green-50 text-green-500",
      period: "from last month",
    },
  ];

  // Recent user signups
  const recentUsers = [
    { id: 1, name: "Emma Wilson", email: "emma@example.com", date: "Today, 2:45 PM" },
    { id: 2, name: "James Miller", email: "james@example.com", date: "Today, 10:23 AM" },
    { id: 3, name: "Olivia Martinez", email: "olivia@example.com", date: "Yesterday, 4:17 PM" },
    { id: 4, name: "Noah Taylor", email: "noah@example.com", date: "Yesterday, 1:52 PM" },
    { id: 5, name: "Sophia Brown", email: "sophia@example.com", date: "May 20, 2023" },
  ];

  // Recent properties added
  const recentProperties = [
    { id: 1, address: "123 Main St, San Francisco, CA", status: "Active", price: "$1,250,000", date: "Today, 3:12 PM" },
    { id: 2, address: "456 Park Ave, New York, NY", status: "Pending", price: "$2,750,000", date: "Today, 11:30 AM" },
    { id: 3, address: "789 Oak Dr, Austin, TX", status: "Active", price: "$575,000", date: "Yesterday, 5:45 PM" },
    { id: 4, address: "101 Pine Rd, Seattle, WA", status: "Sold", price: "$825,000", date: "Yesterday, 2:20 PM" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-base text-gray-500">
            Overview and key metrics of your PlotBook platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="flex items-center gap-1"
            style={{ backgroundColor: '#1E1433' }}
          >
            <CalendarDays className="h-4 w-4" />
            <span>May 2023</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-200 p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.iconColor}`}>
                  {stat.icon}
                </div>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  stat.isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {stat.isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {stat.title} <span className="text-xs">({stat.period})</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-7">
        {/* Recent Users Card */}
        <Card className="col-span-1 border-gray-200 p-0 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Users</CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                New users that have signed up recently
              </CardDescription>
            </div>
            <Link href="/admin/users" className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">{user.date}</span>
                  <button className="ml-2 p-1 rounded-full hover:bg-gray-100">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-4 flex justify-center">
            <Button
              variant="ghost"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View more users
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Recent Properties Card */}
        <Card className="col-span-1 border-gray-200 p-0 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Properties</CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                New properties added to the platform
              </CardDescription>
            </div>
            <Link href="/admin/properties" className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="whitespace-nowrap px-6 py-3">Address</th>
                  <th className="whitespace-nowrap px-6 py-3">Status</th>
                  <th className="whitespace-nowrap px-6 py-3">Price</th>
                  <th className="whitespace-nowrap px-6 py-3">Added</th>
                  <th className="whitespace-nowrap px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentProperties.map((property) => (
                  <tr key={property.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      {property.address}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          property.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : property.status === "Pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {property.price}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {property.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 p-4 flex justify-center">
            <Button
              variant="ghost"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View more properties
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-gray-200 p-0 bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-full bg-white text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900">Manage Users</h3>
              <p className="text-sm text-purple-700 max-w-[25ch]">
                View, edit, and manage all users on the platform
              </p>
              <Button
                variant="outline"
                className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-200"
              >
                Go to Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 p-0 bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-full bg-white text-blue-600">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Manage Properties</h3>
              <p className="text-sm text-blue-700 max-w-[25ch]">
                Add, edit, or remove properties from the database
              </p>
              <Button
                variant="outline"
                className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                Go to Properties
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 p-0 bg-gradient-to-br from-green-50 to-green-100 border-none">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-full bg-white text-green-600">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">Platform Settings</h3>
              <p className="text-sm text-green-700 max-w-[25ch]">
                Configure and customize platform settings
              </p>
              <Button
                variant="outline"
                className="mt-2 border-green-300 text-green-700 hover:bg-green-200"
              >
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 