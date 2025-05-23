"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bookmark,
  Download,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}

export function DashboardLayout({ children, fullHeight = false }: DashboardLayoutProps) {
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

  const navItems: NavItem[] = [
    {
      name: "Search",
      href: "/dashboard",
      icon: <Search className="h-4 w-4" />,
      active: pathname === "/dashboard"
    },
    {
      name: "Saved",
      href: "/dashboard/saved",
      icon: <Bookmark className="h-4 w-4" />,
      active: pathname === "/dashboard/saved"
    },
    {
      name: "Exports",
      href: "/dashboard/exports",
      icon: <Download className="h-4 w-4" />,
      active: pathname === "/dashboard/exports"
    },
    {
      name: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-4 w-4" />,
      active: pathname === "/dashboard/team"
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
      active: pathname === "/dashboard/settings"
    }
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center border-b border-gray-200/30">
        <h1 className="text-lg font-bold">
          <span className="text-[#D2966E]">Plot</span>
          <span className="text-[#1E1433]">Book</span>
        </h1>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 mt-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
              item.active
                ? "bg-gradient-to-r from-[#1E1433] to-[#2A1B4B] text-white shadow-md"
                : "text-gray-700 hover:bg-white/60 hover:shadow-sm"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className={`mr-2 ${item.active ? "text-white" : "text-[#1E1433]"}`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-2 py-3 border-t border-gray-200/30">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600 h-9 px-3"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="font-medium text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[70]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white/95 backdrop-blur-xl shadow-2xl z-[80]"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/30">
                <h1 className="text-lg font-bold">
                  <span className="text-[#D2966E]">Plot</span>
                  <span className="text-[#1E1433]">Book</span>
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile Nav Content */}
              <div className="flex-1 flex flex-col">
                <nav className="flex-1 px-2 mt-3 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                        item.active
                          ? "bg-gradient-to-r from-[#1E1433] to-[#2A1B4B] text-white shadow-md"
                          : "text-gray-700 hover:bg-white/60 hover:shadow-sm"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className={`mr-3 ${item.active ? "text-white" : "text-[#1E1433]"}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Mobile Logout Button */}
                <div className="px-2 py-3 border-t border-gray-200/30">
                  <Button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600 h-11 px-3"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-medium">Logout</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-48 bg-white/95 backdrop-blur-xl shadow-xl border-r border-gray-200/30">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 overflow-hidden">
        {fullHeight ? (
          <main className="h-full w-full">
            {children}
          </main>
        ) : (
          <main className="h-full overflow-y-auto">
            <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </div>
  );
} 