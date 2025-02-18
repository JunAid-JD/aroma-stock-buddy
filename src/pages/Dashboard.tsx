
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { format } from "date-fns";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const [rawMaterials, packaging, finished, batches] = await Promise.all([
        supabase.from("raw_materials").select("quantity_in_stock, unit_cost"),
        supabase.from("packaging_items").select("quantity_in_stock, unit_cost"),
        supabase.from("finished_products").select("quantity_in_stock, unit_price"),
        supabase.from("production_batches").select(`
          batch_number,
          status,
          production_date,
          production_batch_items (
            quantity,
            finished_products (
              name
            )
          )
        `).order('production_date', { ascending: false }).limit(5)
      ]);

      const rawValue = (rawMaterials.data || []).reduce((sum, item) => 
        sum + (item.quantity_in_stock * item.unit_cost), 0);
      
      const packagingValue = (packaging.data || []).reduce((sum, item) => 
        sum + (item.quantity_in_stock * item.unit_cost), 0);
      
      const finishedValue = (finished.data || []).reduce((sum, item) => 
        sum + (item.quantity_in_stock * item.unit_price), 0);

      return {
        rawValue,
        packagingValue,
        finishedValue,
        totalValue: rawValue + packagingValue + finishedValue,
        recentBatches: batches.data || []
      };
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.rawValue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packaging Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.packagingValue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished Goods Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.finishedValue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalValue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Production Batches</CardTitle>
          <CardDescription>Latest production batches and their status</CardDescription>
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
              {stats?.recentBatches.map((batch) => (
                <TableRow key={batch.batch_number}>
                  <TableCell>{batch.batch_number}</TableCell>
                  <TableCell>
                    {batch.production_batch_items?.map((item: any) => 
                      `${item.finished_products.name} (${item.quantity})`
                    ).join(", ")}
                  </TableCell>
                  <TableCell>{format(new Date(batch.production_date), "PPp")}</TableCell>
                  <TableCell className="capitalize">{batch.status}</TableCell>
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
