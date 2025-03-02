
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

export default function Dashboard() {
  const { data: rawMaterials, isLoading: isLoadingRawMaterials } = useQuery({
    queryKey: ["dashboardRawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("quantity_in_stock", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packagingItems, isLoading: isLoadingPackagingItems } = useQuery({
    queryKey: ["dashboardPackagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("*")
        .order("quantity_in_stock", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: finishedProducts, isLoading: isLoadingFinishedProducts } = useQuery({
    queryKey: ["dashboardFinishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .order("quantity_in_stock", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentBatches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ["dashboardRecentBatches"],
    queryFn: async () => {
      const { data: batches, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          production_batch_items (
            quantity,
            item_type,
            item_id
          ),
          finished_products (name)
        `)
        .order("production_date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (!batches || batches.length === 0) {
        return [];
      }

      // Extract finished product names
      return batches.map(batch => {
        const productName = batch.finished_products?.name || "Unknown Product";
        
        return {
          ...batch,
          productName: productName,
          formattedDate: format(parseISO(batch.production_date), 'MMM d, yyyy')
        };
      });
    },
  });

  // Inventory overview data for pie chart
  const inventoryData = [
    { name: 'Raw Materials', value: rawMaterials?.length || 0, color: '#0088FE' },
    { name: 'Packaging', value: packagingItems?.length || 0, color: '#00C49F' },
    { name: 'Finished Products', value: finishedProducts?.length || 0, color: '#FFBB28' },
  ];

  // Transform raw materials data for bar chart
  const rawMaterialsChartData = rawMaterials?.map(item => ({
    name: item.name,
    value: item.quantity_in_stock,
  })) || [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Inventory Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Packaging Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packagingItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Finished Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedProducts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total items in inventory</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw Materials Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rawMaterialsChartData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Production Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBatches ? (
            <div>Loading recent batches...</div>
          ) : recentBatches && recentBatches.length > 0 ? (
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{batch.batch_number}</div>
                    <div className="text-sm text-muted-foreground">{batch.productName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`capitalize text-sm ${
                      batch.status === 'completed' ? 'text-green-500' : 
                      batch.status === 'in_progress' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {batch.status}
                    </div>
                    <div className="text-xs text-muted-foreground">{batch.formattedDate}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No recent production batches found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
