
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import RawMaterials from "./pages/RawMaterials";
import PackagingGoods from "./pages/PackagingGoods";
import FinishedGoods from "./pages/FinishedGoods";
import PurchaseRecords from "./pages/PurchaseRecords";
import LossRecords from "./pages/LossRecords";
import ProductionHistory from "./pages/ProductionHistory";
import SKUDependencyMapping from "./pages/SKUDependencyMapping";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/raw-materials" element={<Layout><RawMaterials /></Layout>} />
        <Route path="/packaging-goods" element={<Layout><PackagingGoods /></Layout>} />
        <Route path="/finished-goods" element={<Layout><FinishedGoods /></Layout>} />
        <Route path="/purchase-records" element={<Layout><PurchaseRecords /></Layout>} />
        <Route path="/loss-records" element={<Layout><LossRecords /></Layout>} />
        <Route path="/production-history" element={<Layout><ProductionHistory /></Layout>} />
        <Route path="/sku-dependency-mapping" element={<Layout><SKUDependencyMapping /></Layout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
