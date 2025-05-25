"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
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
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white border-r border-gray-200 flex flex-col shadow-sm"
      >
        {/* Header with Logo and Collapse Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-cal-sans font-bold"
              >
                <span className="text-[#D2966E]">Plot</span>
                <span className="text-[#1E1433]">Book</span>
              </motion.h1>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  item.active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={`${item.active ? "text-white" : "text-gray-500 group-hover:text-gray-700"} ${isCollapsed ? "mx-auto" : "mr-3"}`}>
                  {item.icon}
                </span>
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-2 py-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`h-5 w-5 text-gray-500 group-hover:text-gray-700 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="truncate"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50">
        <main className="flex-1 overflow-auto w-full h-full">
          {children}
        </main>
      </div>
    </div>
  );
} 