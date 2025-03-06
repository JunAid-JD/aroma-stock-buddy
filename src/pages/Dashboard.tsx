
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  Line, 
  LineChart as RechartsLineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";

const fetchInventoryStats = async () => {
  const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
    supabase.from('raw_materials').select('quantity_in_stock, reorder_point').then(res => res.data),
    supabase.from('packaging_items').select('quantity_in_stock, reorder_point').then(res => res.data),
    supabase.from('finished_products').select('quantity_in_stock').then(res => res.data)
  ]);

  const rawMaterialsLow = rawMaterials?.filter(item => item.quantity_in_stock < item.reorder_point).length || 0;
  const packagingItemsLow = packagingItems?.filter(item => item.quantity_in_stock < item.reorder_point).length || 0;
  
  return {
    rawMaterialsCount: rawMaterials?.length || 0,
    packagingItemsCount: packagingItems?.length || 0,
    finishedProductsCount: finishedProducts?.length || 0,
    rawMaterialsLow,
    packagingItemsLow
  };
};

const fetchRecentProduction = async () => {
  const { data, error } = await supabase
    .from('production_batches')
    .select(`
      id,
      batch_number,
      status,
      production_date,
      product_id,
      finished_products!inner (
        id,
        name,
        sku
      )
    `)
    .order('production_date', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
};

const fetchRecentPurchases = async () => {
  const { data, error } = await supabase
    .from('purchase_records')
    .select('*, raw_materials(*), packaging_items(*), finished_products(*)')
    .order('date', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
};

// Custom chart components to replace the imported ones
const BarChart = ({ 
  data, 
  index, 
  categories, 
  colors, 
  valueFormatter, 
  className 
}: { 
  data: any[]; 
  index: string; 
  categories: string[]; 
  colors: string[]; 
  valueFormatter: (value: number) => string; 
  className?: string; 
}) => {
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <RechartsBarChart data={data}>
        <XAxis dataKey={index} />
        <YAxis />
        <Tooltip formatter={(value: any) => valueFormatter(value)} />
        {categories.map((category, i) => (
          <Bar 
            key={category} 
            dataKey={category} 
            fill={colors[i] || '#3b82f6'} 
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

const LineChart = ({ 
  data, 
  index, 
  categories, 
  colors, 
  valueFormatter, 
  className 
}: { 
  data: any[]; 
  index: string; 
  categories: string[]; 
  colors: string[]; 
  valueFormatter: (value: number) => string; 
  className?: string; 
}) => {
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <RechartsLineChart data={data}>
        <XAxis dataKey={index} />
        <YAxis />
        <Tooltip formatter={(value: any) => valueFormatter(value)} />
        {categories.map((category, i) => (
          <Line 
            key={category} 
            type="monotone" 
            dataKey={category} 
            stroke={colors[i] || '#10b981'} 
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const { data: inventoryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: fetchInventoryStats,
  });

  const { data: recentProduction, isLoading: productionLoading } = useQuery({
    queryKey: ['recent-production'],
    queryFn: fetchRecentProduction,
  });

  const { data: recentPurchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['recent-purchases'],
    queryFn: fetchRecentPurchases,
  });

  // Demo data for charts
  const inventoryData = [
    { name: 'Raw Materials', value: inventoryStats?.rawMaterialsCount || 0 },
    { name: 'Packaging', value: inventoryStats?.packagingItemsCount || 0 },
    { name: 'Finished Products', value: inventoryStats?.finishedProductsCount || 0 },
  ];

  const productionData = [
    { name: 'Jan', value: 3 },
    { name: 'Feb', value: 5 },
    { name: 'Mar', value: 2 },
    { name: 'Apr', value: 7 },
    { name: 'May', value: 4 },
    { name: 'Jun', value: 6 },
  ];

  const getItemName = (purchase: any) => {
    if (purchase.item_type === 'raw_material' && purchase.raw_materials) {
      return purchase.raw_materials.name;
    } else if (purchase.item_type === 'packaging' && purchase.packaging_items) {
      return purchase.packaging_items.name;
    } else if (purchase.item_type === 'finished_product' && purchase.finished_products) {
      return purchase.finished_products.name;
    }
    return 'Unknown Item';
  };

  return (
    <TabsContent value="dashboard" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(inventoryStats?.rawMaterialsCount || 0) + 
                   (inventoryStats?.packagingItemsCount || 0) + 
                   (inventoryStats?.finishedProductsCount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {inventoryStats?.rawMaterialsCount} raw materials, {inventoryStats?.packagingItemsCount} packaging items, {inventoryStats?.finishedProductsCount} finished products
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <BarChart 
              data={inventoryData} 
              index="name"
              categories={['value']}
              colors={['blue']}
              valueFormatter={(value) => `${value} items`}
              className="aspect-[4/3]" 
            />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(inventoryStats?.rawMaterialsLow || 0) + (inventoryStats?.packagingItemsLow || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {inventoryStats?.rawMaterialsLow} raw materials and {inventoryStats?.packagingItemsLow} packaging items below reorder point
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2 flex justify-center">
            <Badge variant={inventoryStats && (inventoryStats.rawMaterialsLow + inventoryStats.packagingItemsLow > 5) ? "destructive" : "outline"} className="px-3 py-1">
              {inventoryStats && (inventoryStats.rawMaterialsLow + inventoryStats.packagingItemsLow > 5) ? "Action Required" : "Stock Levels OK"}
            </Badge>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monthly</div>
            <p className="text-xs text-muted-foreground">
              Production batches per month
            </p>
          </CardContent>
          <CardFooter className="p-2">
            <LineChart 
              data={productionData} 
              index="name"
              categories={['value']}
              colors={['green']}
              valueFormatter={(value) => `${value} batches`}
              className="aspect-[4/3]" 
            />
          </CardFooter>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Production</CardTitle>
            <CardDescription>
              Latest production batches processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productionLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProduction && recentProduction.length > 0 ? (
                    recentProduction.map((batch: any) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.batch_number}</TableCell>
                        <TableCell>{batch.finished_products?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            batch.status === 'completed' 
                              ? 'default' 
                              : batch.status === 'in_progress' 
                                ? 'secondary' 
                                : 'outline'
                          }>
                            {batch.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No recent production batches found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>
              Latest inventory items purchased
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchasesLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchases && recentPurchases.length > 0 ? (
                    recentPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{getItemName(purchase)}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>${purchase.total_cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No recent purchases found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default Dashboard;
