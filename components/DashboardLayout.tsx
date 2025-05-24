"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Search,
  Bookmark,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems: NavItem[] = [
    {
      name: "Home",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      active: pathname === "/dashboard"
    },
    {
      name: "Search",
      href: "/dashboard/search",
      icon: <Search className="h-5 w-5" />,
      active: pathname === "/dashboard/search"
    },
    {
      name: "Saved",
      href: "/dashboard/saved",
      icon: <Bookmark className="h-5 w-5" />,
      active: pathname === "/dashboard/saved"
    },
    {
      name: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-5 w-5" />,
      active: pathname === "/dashboard/team"
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      active: pathname === "/dashboard/settings"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header with Logo and Collapse Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
            <h1 className="text-xl font-semibold">
              <span className="text-[#D2966E]">Plot</span>
              <span className="text-[#1E1433]">Book</span>
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                item.active
                  ? "bg-[#1E1433] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <span className={`${item.active ? "text-white" : "text-gray-500"} ${isCollapsed ? "mx-auto" : "mr-3"}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-2 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors group"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`h-5 w-5 text-gray-500 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
            {!isCollapsed && (
              <span className="truncate">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-hidden w-full h-full">
          {children}
        </main>
      </div>
    </div>
  );
} 