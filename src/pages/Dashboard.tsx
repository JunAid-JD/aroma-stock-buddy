
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, Box, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
        supabase.from("raw_materials").select("id"),
        supabase.from("packaging_items").select("id"),
        supabase.from("finished_products").select("id"),
      ]);

      return {
        rawMaterialsCount: rawMaterials.data?.length || 0,
        packagingItemsCount: packagingItems.data?.length || 0,
        finishedProductsCount: finishedProducts.data?.length || 0,
        lowStockCount: 0 // This will be implemented later with a proper function
      };
    }
  });

  const { data: recentBatches } = useQuery({
    queryKey: ["recentBatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select(`
          *,
          production_batch_items (
            quantity,
            finished_products (
              name
            )
          )
        `)
        .order('production_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(batch => ({
        ...batch,
        products: batch.production_batch_items
          ?.map(item => `${item.finished_products.name} (${item.quantity})`)
          .join(", ") || "No items"
      }));
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your inventory management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rawMaterialsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total SKUs in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packaging Items</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.packagingItemsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Available items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.finishedProductsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">Items need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Production Batches</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest production batches and their status
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBatches?.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.batch_number}</TableCell>
                  <TableCell>{batch.products}</TableCell>
                  <TableCell>{format(new Date(batch.production_date), "PPp")}</TableCell>
                  <TableCell>{batch.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
