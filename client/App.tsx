import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import LeadsDashboard from "./pages/LeadsDashboard";
import AddLeadsPage from "./pages/AddLeadsPage";
import AddSalesPersonPage from "./pages/AddSalesPersonPage";
import SalesPersonProfile from "./pages/SalesPersonProfile";
import SalesDashboard from "./pages/SalesDashboard";
import InvoiceList from "./pages/InvoiceList";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";

const queryClient = new QueryClient();

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-foreground mb-2">403</h1>
      <p className="text-muted-foreground mb-6">
        You don't have permission to access this page
      </p>
      <a
        href="/"
        className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
      >
        Go Home
      </a>
    </div>
  </div>
);

const AppContent = () => {
  useEffect(() => {
    // Seed database on app load
    fetch("/api/seed", { method: "POST" }).catch(() => {
      // Silently fail if seed endpoint is not available
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales-persons"
        element={
          <ProtectedRoute>
            <AddSalesPersonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leads"
        element={
          <ProtectedRoute>
            <LeadsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/add"
        element={
          <ProtectedRoute>
            <AddLeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-person"
        element={
          <ProtectedRoute>
            <SalesPersonProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales"
        element={
          <ProtectedRoute>
            <SalesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <SalesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute>
            <InvoiceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices/create"
        element={
          <ProtectedRoute>
            <CreateInvoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices/:id"
        element={
          <ProtectedRoute>
            <InvoiceDetail />
          </ProtectedRoute>
        }
      />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
