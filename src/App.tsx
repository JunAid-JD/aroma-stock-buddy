
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import RawMaterials from "@/pages/RawMaterials";
import PackagingGoods from "@/pages/PackagingGoods";
import FinishedGoods from "@/pages/FinishedGoods";
import LossRecords from "@/pages/LossRecords";
import PurchaseRecords from "@/pages/PurchaseRecords";
import ProductionBatches from "@/pages/ProductionBatches";
import NotFound from "@/pages/NotFound";
import "@/App.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="packaging-goods" element={<PackagingGoods />} />
          <Route path="finished-goods" element={<FinishedGoods />} />
          <Route path="loss-records" element={<LossRecords />} />
          <Route path="purchase-records" element={<PurchaseRecords />} />
          <Route path="production-batches" element={<ProductionBatches />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
