
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, PackagePlus, Package, ShoppingCart, Truck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Dashboard = () => {
  // Fetch inventory summary
  const { data: inventorySummary } = useQuery({
    queryKey: ["inventorySummary"],
    queryFn: async () => {
      // Fetch raw materials count
      const { data: rawCount, error: rawError } = await supabase
        .from("raw_materials")
        .select("id", { count: "exact", head: true });
      
      if (rawError) throw rawError;

      // Fetch packaging items count
      const { data: packagingCount, error: packagingError } = await supabase
        .from("packaging_items")
        .select("id", { count: "exact", head: true });
      
      if (packagingError) throw packagingError;

      // Fetch finished products count
      const { data: finishedCount, error: finishedError } = await supabase
        .from("finished_products")
        .select("id", { count: "exact", head: true });
      
      if (finishedError) throw finishedError;

      return {
        rawMaterials: rawCount.length,
        packagingItems: packagingCount.length,
        finishedProducts: finishedCount.length
      };
    },
  });

  // Fetch low stock items
  const { data: lowStockItems } = useQuery({
    queryKey: ["lowStockItems"],
    queryFn: async () => {
      // Fetch low stock raw materials
      const { data: rawLowStock, error: rawError } = await supabase
        .from("raw_materials")
        .select("name, quantity_in_stock, reorder_point")
        .lt("quantity_in_stock", "reorder_point")
        .order("name");
      
      if (rawError) throw rawError;

      // Fetch low stock packaging items
      const { data: packagingLowStock, error: packagingError } = await supabase
        .from("packaging_items")
        .select("name, quantity_in_stock, reorder_point")
        .lt("quantity_in_stock", "reorder_point")
        .order("name");
      
      if (packagingError) throw packagingError;

      return {
        rawMaterials: rawLowStock || [],
        packagingItems: packagingLowStock || []
      };
    },
  });

  // Fetch recent production batches
  const { data: recentBatches } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          production_batch_items (
            quantity,
            finished_products:item_id (
              name, sku
            )
          )
        `)
        .order("production_date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return data.map(batch => ({
        ...batch,
        items: batch.production_batch_items || [],
        productName: batch.production_batch_items?.[0]?.finished_products?.name || "Unknown",
        productSku: batch.production_batch_items?.[0]?.finished_products?.sku || "Unknown"
      }));
    },
  });

  // Mock data for charts
  const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 2780 },
    { month: 'May', sales: 1890 },
    { month: 'Jun', sales: 2390 },
    { month: 'Jul', sales: 3490 },
  ];

  const topProducts = [
    { name: 'Lavender Oil 10ml', quantity: 120 },
    { name: 'Rose Oil 10ml', quantity: 98 },
    { name: 'Tea Tree Oil 10ml', quantity: 86 },
    { name: 'Almond Oil 30ml', quantity: 72 },
    { name: 'Coconut Oil 70ml', quantity: 65 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary?.rawMaterials || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total unique raw materials
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Packaging Items
            </CardTitle>
            <PackagePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary?.packagingItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total unique packaging items
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finished Products
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary?.finishedProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total unique products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems ? 
                lowStockItems.rawMaterials.length + lowStockItems.packagingItems.length 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Monthly sales performance
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>
              Most popular products by quantity
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Production */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Production</CardTitle>
          <CardDescription>
            Latest production batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBatches?.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent production batches</p>
            )}
            
            {recentBatches?.map((batch) => (
              <div key={batch.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{batch.batch_number || "Batch #" + batch.id.substring(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{batch.productName || batch.productSku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{batch.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(batch.production_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
