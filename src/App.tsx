
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RawMaterials from "@/pages/RawMaterials";
import PackagingGoods from "@/pages/PackagingGoods";
import FinishedGoods from "@/pages/FinishedGoods";
import LossRecords from "@/pages/LossRecords";
import PurchaseRecords from "@/pages/PurchaseRecords";
import ProductionHistory from "@/pages/ProductionHistory";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

const queryClient = new QueryClient();

// Protected Route component to handle authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="raw-goods" element={<RawMaterials />} />
                <Route path="packaging-goods" element={<PackagingGoods />} />
                <Route path="finished-goods" element={<FinishedGoods />} />
                <Route path="loss-records" element={<LossRecords />} />
                <Route path="purchase-records" element={<PurchaseRecords />} />
                <Route path="production-history" element={<ProductionHistory />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
