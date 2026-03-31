import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import SendSmsPage from "@/pages/SendSmsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import ContactsPage from "@/pages/ContactsPage";
import GroupsPage from "@/pages/GroupsPage";
import SmsLogsPage from "@/pages/SmsLogsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminCompaniesPage from "@/pages/AdminCompaniesPage";
import AdminTransactionsPage from "@/pages/AdminTransactionsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import NotFound from "@/pages/NotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
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
