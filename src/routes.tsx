
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RawMaterials from "@/pages/RawMaterials";
import PackagingGoods from "@/pages/PackagingGoods";
import FinishedGoods from "@/pages/FinishedGoods";
import LossRecords from "@/pages/LossRecords";
import PurchaseRecords from "@/pages/PurchaseRecords";
import ProductionHistory from "@/pages/ProductionHistory";
import NotFound from "@/pages/NotFound";

// Protected Route component to handle authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <>
            <Route index element={<Dashboard />} />
            <Route path="raw-goods" element={<RawMaterials />} />
            <Route path="packaging-goods" element={<PackagingGoods />} />
            <Route path="finished-goods" element={<FinishedGoods />} />
            <Route path="loss-records" element={<LossRecords />} />
            <Route path="purchase-records" element={<PurchaseRecords />} />
            <Route path="production-history" element={<ProductionHistory />} />
          </>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
