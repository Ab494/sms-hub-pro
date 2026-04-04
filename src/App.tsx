import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Lazy load pages for code splitting
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const SendSmsPage = React.lazy(() => import("@/pages/SendSmsPage"));
const CampaignsPage = React.lazy(() => import("@/pages/CampaignsPage"));
const ContactsPage = React.lazy(() => import("@/pages/ContactsPage"));
const GroupsPage = React.lazy(() => import("@/pages/GroupsPage"));
const SmsLogsPage = React.lazy(() => import("@/pages/SmsLogsPage"));
const ReportsPage = React.lazy(() => import("@/pages/ReportsPage"));
const CreditsPage = React.lazy(() => import("@/pages/CreditsPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));
const AdminDashboardPage = React.lazy(() => import("@/pages/AdminDashboardPage"));
const AdminCompaniesPage = React.lazy(() => import("@/pages/AdminCompaniesPage"));
const AdminTransactionsPage = React.lazy(() => import("@/pages/AdminTransactionsPage"));
const AdminSettingsPage = React.lazy(() => import("@/pages/AdminSettingsPage"));
const WithdrawalsPage = React.lazy(() => import("@/pages/WithdrawalsPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/send-sms" element={<SendSmsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/logs" element={<SmsLogsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
