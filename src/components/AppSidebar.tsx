import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  Megaphone,
  Users,
  FolderOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  ChevronLeft,
  Menu,
  Shield,
  CreditCard,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Send SMS", icon: Send, path: "/send-sms" },
  { label: "SMS Campaigns", icon: Megaphone, path: "/campaigns" },
  { label: "Contacts", icon: Users, path: "/contacts" },
  { label: "Contact Groups", icon: FolderOpen, path: "/groups" },
  { label: "SMS Logs", icon: FileText, path: "/logs" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const adminMenuItems = [
  { label: "Admin Dashboard", icon: Shield, path: "/admin/dashboard" },
  { label: "Companies", icon: Building2, path: "/admin/companies" },
  { label: "Transactions", icon: CreditCard, path: "/admin/transactions" },
  { label: "Platform Settings", icon: Settings, path: "/admin/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const currentMenuItems = isAdminRoute ? adminMenuItems : menuItems;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground tracking-tight">TumaPrime SMS</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {currentMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          
          {/* Switch to User/Admin View */}
          {isAdmin && !isAdminRoute && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <Link
                to="/admin/dashboard"
                onClick={onMobileClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            </div>
          )}
          
          {isAdmin && isAdminRoute && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <Link
                to="/dashboard"
                onClick={onMobileClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                {!collapsed && <span>User Dashboard</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors lg:flex"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  );
}
