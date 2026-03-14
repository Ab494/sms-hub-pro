import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import SendSmsPage from "@/pages/SendSmsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import ContactsPage from "@/pages/ContactsPage";
import GroupsPage from "@/pages/GroupsPage";
import SmsLogsPage from "@/pages/SmsLogsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/send-sms" element={<SendSmsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/logs" element={<SmsLogsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
