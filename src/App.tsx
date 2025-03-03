
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import RawMaterials from "@/pages/RawMaterials";
import PackagingGoods from "@/pages/PackagingGoods";
import FinishedGoods from "@/pages/FinishedGoods";
import ProductionHistory from "@/pages/ProductionHistory";
import LossRecords from "@/pages/LossRecords";
import PurchaseRecords from "@/pages/PurchaseRecords";
import SKUDependencyMapping from "@/pages/SKUDependencyMapping";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/providers/AuthProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="raw-materials" element={<RawMaterials />} />
                <Route path="packaging-goods" element={<PackagingGoods />} />
                <Route path="finished-goods" element={<FinishedGoods />} />
                <Route path="production-history" element={<ProductionHistory />} />
                <Route path="loss-records" element={<LossRecords />} />
                <Route path="purchase-records" element={<PurchaseRecords />} />
                <Route path="sku-dependency-mapping" element={<SKUDependencyMapping />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
