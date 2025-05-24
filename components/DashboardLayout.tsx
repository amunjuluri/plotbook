"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Search,
  Bookmark,
  Download,
  Users,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
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
      name: "Exports",
      href: "/dashboard/exports",
      icon: <Download className="h-5 w-5" />,
      active: pathname === "/dashboard/exports"
    },
    {
      name: "My Team",
      href: "/dashboard/team",
      icon: <Users className="h-5 w-5" />,
      active: pathname === "/dashboard/team"
    },
    {
      name: "Profile Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      active: pathname === "/dashboard/settings"
    },
    {
      name: "Usage Guide",
      href: "/dashboard/guide",
      icon: <BookOpen className="h-5 w-5" />,
      active: pathname === "/dashboard/guide"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-20 md:hidden p-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-6 py-6 flex items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-[#D2966E]">Plot</span>
              <span className="text-[#1E1433]">Book</span>
            </h1>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 mt-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  item.active
                    ? "bg-[#1E1433] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                } transition-colors`}
                onClick={() => {
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
              >
                <span className={`mr-3 ${item.active ? "text-white" : "text-[#1E1433]"}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3 text-[#1E1433]" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 transition-margin duration-300 h-full">
        <main className="p-4 md:p-8 h-full">
          {children}
        </main>
      </div>
    </div>
  );
} 