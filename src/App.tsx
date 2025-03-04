
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/toaster";
import FinishedGoods from "./pages/FinishedGoods";
import RawMaterials from "./pages/RawMaterials";
import PackagingGoods from "./pages/PackagingGoods";
import ProductionHistory from "./pages/ProductionHistory";
import PurchaseRecords from "./pages/PurchaseRecords";
import LossRecords from "./pages/LossRecords";
import SKUDependencyMapping from "./pages/SKUDependencyMapping";

import "./App.css";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="finished-goods" element={<FinishedGoods />} />
            <Route path="raw-materials" element={<RawMaterials />} />
            <Route path="packaging-goods" element={<PackagingGoods />} />
            <Route path="production-history" element={<ProductionHistory />} />
            <Route path="purchase-records" element={<PurchaseRecords />} />
            <Route path="loss-records" element={<LossRecords />} />
            <Route path="sku-dependency-mapping" element={<SKUDependencyMapping />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
