
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowDownIcon, ArrowUpIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["inventoryStats"],
    queryFn: async () => {
      // Fetch raw materials total
      const { data: rawMaterials, error: rmError } = await supabase
        .from("raw_materials")
        .select("total_value");
      
      if (rmError) throw rmError;
      
      // Fetch packaging items total
      const { data: packagingItems, error: piError } = await supabase
        .from("packaging_items")
        .select("total_value");
      
      if (piError) throw piError;
      
      // Fetch finished products total
      const { data: finishedProducts, error: fpError } = await supabase
        .from("finished_products")
        .select("total_value");
      
      if (fpError) throw fpError;
      
      // Calculate totals
      const rawMaterialsTotal = rawMaterials.reduce((acc, item) => acc + (item.total_value || 0), 0);
      const packagingItemsTotal = packagingItems.reduce((acc, item) => acc + (item.total_value || 0), 0);
      const finishedProductsTotal = finishedProducts.reduce((acc, item) => acc + (item.total_value || 0), 0);
      const inventoryValue = rawMaterialsTotal + packagingItemsTotal + finishedProductsTotal;
      
      return {
        rawMaterialsTotal,
        packagingItemsTotal,
        finishedProductsTotal,
        inventoryValue
      };
    },
  });

  const { data: recentBatches, isLoading: isLoadingBatches, error: batchesError } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      try {
        // Fix the relationship error by explicitly specifying the foreign key relationship to use
        const { data, error } = await supabase
          .from("production_batches")
          .select(`
            id,
            batch_number,
            status,
            created_at,
            finished_products:product_id(id, name, sku)
          `)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (error) {
          console.error("Error fetching recent batches:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching recent batches:", error);
        throw error;
      }
    },
  });

  const chartData = [
    { name: "Raw Materials", value: stats?.rawMaterialsTotal || 0 },
    { name: "Packaging", value: stats?.packagingItemsTotal || 0 },
    { name: "Finished Goods", value: stats?.finishedProductsTotal || 0 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.inventoryValue?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.rawMaterialsTotal?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Raw materials value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packaging</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.packagingItemsTotal?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Packaging items value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished Goods</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.finishedProductsTotal?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Finished products value</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Value Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']}
                  />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Production Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {batchesError ? (
              <p className="text-red-500">Error loading recent batches</p>
            ) : isLoadingBatches ? (
              <p>Loading...</p>
            ) : recentBatches && recentBatches.length > 0 ? (
              <div className="space-y-4">
                {recentBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{batch.batch_number}</p>
                      <p className="text-sm text-gray-500">
                        {batch.finished_products && batch.finished_products.id ? 
                          `${batch.finished_products.name || 'Unknown'} (${batch.finished_products.sku || 'Unknown'})` : 
                          'Unknown product'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      batch.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {batch.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent batches found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
