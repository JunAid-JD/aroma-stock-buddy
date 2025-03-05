
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, PackagePlus, Package, ShoppingCart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Dashboard = () => {
  // Fetch inventory summary
  const { data: inventorySummary } = useQuery({
    queryKey: ["inventorySummary"],
    queryFn: async () => {
      // Fetch raw materials count and total value
      const { data: rawMaterials, error: rawError } = await supabase
        .from("raw_materials")
        .select("quantity_in_stock, unit_cost, total_value");
      
      if (rawError) throw rawError;

      // Fetch packaging items count and total value
      const { data: packagingItems, error: packagingError } = await supabase
        .from("packaging_items")
        .select("quantity_in_stock, unit_cost, total_value");
      
      if (packagingError) throw packagingError;

      // Fetch finished products count and total value
      const { data: finishedProducts, error: finishedError } = await supabase
        .from("finished_products")
        .select("quantity_in_stock, unit_price, total_value");
      
      if (finishedError) throw finishedError;

      // Calculate total values
      const rawMaterialsValue = rawMaterials.reduce((sum, item) => 
        sum + (item.total_value || (item.quantity_in_stock * item.unit_cost)), 0);

      const packagingItemsValue = packagingItems.reduce((sum, item) => 
        sum + (item.total_value || (item.quantity_in_stock * item.unit_cost)), 0);

      const finishedProductsValue = finishedProducts.reduce((sum, item) => 
        sum + (item.total_value || (item.quantity_in_stock * item.unit_price)), 0);

      return {
        rawMaterials: {
          count: rawMaterials.length,
          value: rawMaterialsValue
        },
        packagingItems: {
          count: packagingItems.length,
          value: packagingItemsValue
        },
        finishedProducts: {
          count: finishedProducts.length,
          value: finishedProductsValue
        },
        totalValue: rawMaterialsValue + packagingItemsValue + finishedProductsValue
      };
    },
  });

  // Fetch low stock items
  const { data: lowStockItems } = useQuery({
    queryKey: ["lowStockItems"],
    queryFn: async () => {
      // Fetch low stock raw materials (quantity < reorder_point)
      const { data: rawLowStock, error: rawError } = await supabase
        .from("raw_materials")
        .select("name, quantity_in_stock, reorder_point")
        .lt("quantity_in_stock", "reorder_point")
        .order("name");
      
      if (rawError) throw rawError;

      // Fetch low stock packaging items (quantity < reorder_point)
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
            item_id
          )
        `)
        .order("production_date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // For each batch, fetch the product details
      const batchesWithProducts = await Promise.all(
        data.map(async (batch) => {
          const productItems = batch.production_batch_items || [];
          
          // Get product names for each batch item
          const productDetails = await Promise.all(
            productItems.map(async (item: any) => {
              const { data: product, error } = await supabase
                .from("finished_products")
                .select("name, sku")
                .eq("id", item.item_id)
                .single();
              
              if (error) {
                console.error("Error fetching product:", error);
                return { name: "Unknown Product", sku: "Unknown", quantity: item.quantity };
              }
              
              return { 
                name: product.name, 
                sku: product.sku, 
                quantity: item.quantity 
              };
            })
          );
          
          // Format the products string
          const productsString = productDetails
            .map(p => `${p.name} (${p.quantity})`)
            .join(", ");
          
          return {
            ...batch,
            products: productsString || "No products",
            productDetails
          };
        })
      );
      
      return batchesWithProducts;
    },
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Mock data for charts (or use real data when available)
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
        <p className="text-muted-foreground mb-6">
          Welcome to your inventory management system
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Raw Materials Value
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventorySummary ? formatCurrency(inventorySummary.rawMaterials.value) : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Packaging Value
            </CardTitle>
            <PackagePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventorySummary ? formatCurrency(inventorySummary.packagingItems.value) : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finished Goods Value
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventorySummary ? formatCurrency(inventorySummary.finishedProducts.value) : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventorySummary ? formatCurrency(inventorySummary.totalValue) : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>
            Items below reorder point ({lowStockItems ? 
              (lowStockItems.rawMaterials.length + lowStockItems.packagingItems.length) : 0} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockItems && lowStockItems.rawMaterials.length === 0 && lowStockItems.packagingItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No low stock items</p>
            )}
            
            {lowStockItems?.rawMaterials.map((item, index) => (
              <div key={`raw-${index}`} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Raw Material</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-500">{item.quantity_in_stock} in stock</p>
                  <p className="text-sm text-muted-foreground">Reorder point: {item.reorder_point}</p>
                </div>
              </div>
            ))}
            
            {lowStockItems?.packagingItems.map((item, index) => (
              <div key={`pkg-${index}`} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Packaging Item</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-500">{item.quantity_in_stock} in stock</p>
                  <p className="text-sm text-muted-foreground">Reorder point: {item.reorder_point}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            
            <div className="grid grid-cols-4 font-medium text-sm mb-2">
              <div>Batch #</div>
              <div>Products</div>
              <div>Date</div>
              <div>Status</div>
            </div>
            
            {recentBatches?.map((batch) => (
              <div key={batch.id} className="grid grid-cols-4 text-sm border-b pb-2">
                <div className="font-medium">{batch.batch_number || `Batch-${batch.id.substring(0, 8)}`}</div>
                <div>{batch.products}</div>
                <div>{new Date(batch.production_date).toLocaleDateString()}</div>
                <div className={`capitalize ${batch.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                  {batch.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
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
    </div>
  );
};

export default Dashboard;
