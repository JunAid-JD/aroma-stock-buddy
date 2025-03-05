
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Package, ShoppingBag, Truck } from "lucide-react";
import { Chart } from "@/components/ui/chart";

const Dashboard = () => {
  const [totalRawMaterialsValue, setTotalRawMaterialsValue] = useState(0);
  const [totalPackagingValue, setTotalPackagingValue] = useState(0);
  const [totalFinishedGoodsValue, setTotalFinishedGoodsValue] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Fetch inventory summary for raw materials
  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterialsSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, sku, quantity_in_stock, unit_cost, total_value, reorder_point");

      if (error) throw error;
      return data;
    },
  });

  // Fetch inventory summary for packaging items
  const { data: packagingItems } = useQuery({
    queryKey: ["packagingSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("id, name, type, size, quantity_in_stock, unit_cost, total_value, reorder_point");

      if (error) throw error;
      return data;
    },
  });

  // Fetch inventory summary for finished products
  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProductsSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku, quantity_in_stock, unit_price, total_value");

      if (error) throw error;
      return data;
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      // First try to get purchase records
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchase_records")
        .select(`
          id, 
          date, 
          quantity, 
          total_cost, 
          item_type,
          supplier,
          item_id
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (purchaseError) throw purchaseError;

      // Then get production batches
      const { data: productions, error: productionError } = await supabase
        .from("production_batches")
        .select(`
          id, 
          batch_number, 
          product_id, 
          production_date,
          status
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (productionError) throw productionError;

      // Combine and sort by date
      const combined = [
        ...(purchases || []).map((p) => ({
          ...p,
          type: "purchase",
          date: p.date,
        })),
        ...(productions || []).map((p) => ({
          ...p,
          type: "production",
          date: p.production_date,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combined.slice(0, 5);
    },
  });

  useEffect(() => {
    // Calculate total inventory values
    if (rawMaterials) {
      const totalRaw = rawMaterials.reduce(
        (sum, item) => sum + (item.total_value || 0),
        0
      );
      setTotalRawMaterialsValue(totalRaw);
    }

    if (packagingItems) {
      const totalPackaging = packagingItems.reduce(
        (sum, item) => sum + (item.total_value || 0),
        0
      );
      setTotalPackagingValue(totalPackaging);
    }

    if (finishedProducts) {
      const totalFinished = finishedProducts.reduce(
        (sum, item) => sum + (item.total_value || 0),
        0
      );
      setTotalFinishedGoodsValue(totalFinished);
    }

    // Calculate low stock items
    const lowStockRawMaterials = rawMaterials
      ? rawMaterials
          .filter((item) => item.quantity_in_stock <= item.reorder_point)
          .map((item) => ({
            ...item,
            type: "Raw Material",
            shortage: item.reorder_point - item.quantity_in_stock,
          }))
      : [];

    const lowStockPackaging = packagingItems
      ? packagingItems
          .filter((item) => item.quantity_in_stock <= item.reorder_point)
          .map((item) => ({
            ...item,
            type: "Packaging",
            shortage: item.reorder_point - item.quantity_in_stock,
          }))
      : [];

    // Combine and sort by shortage (most critical first)
    const combinedLowStock = [...lowStockRawMaterials, ...lowStockPackaging].sort(
      (a, b) => b.shortage - a.shortage
    );

    setLowStockItems(combinedLowStock.slice(0, 5)); // Top 5 most critical
  }, [rawMaterials, packagingItems, finishedProducts]);

  // Calculate total inventory value
  useEffect(() => {
    setTotalInventoryValue(
      totalRawMaterialsValue + totalPackagingValue + totalFinishedGoodsValue
    );
  }, [totalRawMaterialsValue, totalPackagingValue, totalFinishedGoodsValue]);

  // Define chart data
  const chartData = {
    series: [
      {
        name: "Inventory Value",
        data: [
          totalRawMaterialsValue,
          totalPackagingValue,
          totalFinishedGoodsValue,
        ],
      },
    ],
    options: {
      chart: {
        type: "bar",
        height: 250,
      },
      colors: ["#10B981", "#3B82F6", "#6366F1"],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: ["Raw Materials", "Packaging", "Finished Goods"],
      },
      yaxis: {
        title: {
          text: "Value (PKR)",
        },
      },
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              Combined value of all inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRawMaterialsValue)}</div>
            <p className="text-xs text-muted-foreground">
              {rawMaterials?.length || 0} different materials in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Packaging Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPackagingValue)}</div>
            <p className="text-xs text-muted-foreground">
              {packagingItems?.length || 0} different items in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finished Products
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFinishedGoodsValue)}</div>
            <p className="text-xs text-muted-foreground">
              {finishedProducts?.length || 0} products ready to sell
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Inventory Value Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Chart
              options={chartData.options}
              series={chartData.series}
              type="bar"
              height={250}
            />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items below reorder point</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-500 font-medium">
                          {item.quantity_in_stock}
                        </span>
                        /{item.reorder_point}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No low stock items
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest inventory movements and productions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions?.map((transaction) => (
                <TableRow key={`${transaction.type}-${transaction.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.type === "purchase"
                      ? "Purchase"
                      : "Production"}
                  </TableCell>
                  <TableCell>
                    {transaction.type === "purchase"
                      ? `${transaction.quantity} items from ${transaction.supplier}`
                      : `Batch ${transaction.batch_number}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.type === "purchase"
                      ? formatCurrency(transaction.total_cost)
                      : transaction.status}
                  </TableCell>
                </TableRow>
              ))}
              {!recentTransactions?.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No recent transactions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
