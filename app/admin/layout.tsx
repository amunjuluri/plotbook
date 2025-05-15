"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import {
  Users,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Building,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if mobile on mount and add resize listener
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Properties",
      href: "/admin/properties",
      icon: <Building className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-gray-200 py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
          <h1 className="ml-3 text-xl font-semibold">
            <span style={{ color: "#D2966E" }}>Plot</span>
            <span style={{ color: "#1E1433" }}>Book</span>
            <span className="text-gray-600 font-normal ml-2">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 transform lg:relative lg:translate-x-0",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:-translate-x-[calc(100%-16px)]",
            isMobile && isSidebarOpen ? "w-full" : "",
            !isMobile && !isSidebarOpen ? "lg:w-16" : "lg:w-64"
          )}
        >
          {/* Desktop logo */}
          <div className="hidden lg:flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1
              className={cn(
                "text-xl font-semibold transition-opacity",
                !isSidebarOpen && "lg:opacity-0"
              )}
            >
              <span style={{ color: "#D2966E" }}>Plot</span>
              <span style={{ color: "#1E1433" }}>Book</span>
              <span className="text-gray-600 font-normal ml-2">Admin</span>
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:block hidden"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                  pathname === item.href &&
                    "bg-purple-50 text-purple-700 hover:bg-purple-50"
                )}
              >
                {item.icon}
                <span
                  className={cn(
                    "text-sm font-medium transition-opacity",
                    !isSidebarOpen && "lg:hidden"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Log out button at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                !isSidebarOpen && "lg:justify-center"
              )}
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
              <span
                className={cn(
                  "text-sm font-medium transition-opacity",
                  !isSidebarOpen && "lg:hidden"
                )}
              >
                Log out
              </span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            isMobile && isSidebarOpen ? "opacity-30 lg:opacity-100" : "opacity-100",
            !isMobile && !isSidebarOpen ? "ml-16" : "ml-0 lg:ml-0"
          )}
          onClick={() => isMobile && isSidebarOpen && setIsSidebarOpen(false)}
        >
          {/* Desktop header */}
          <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 ml-4">
                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  A
                </div>
                <div className="hidden xl:block">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-500">admin@plotbook.com</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content wrapper */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
} 