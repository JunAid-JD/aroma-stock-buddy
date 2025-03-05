
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CircleDollarSign, 
  Package, 
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [inventoryValue, setInventoryValue] = useState({
    rawMaterials: 0,
    packaging: 0,
    finishedProducts: 0,
    total: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Fetch raw materials
  const { data: rawMaterials } = useQuery({
    queryKey: ["rawMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch packaging items
  const { data: packagingItems } = useQuery({
    queryKey: ["packagingItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch finished products
  const { data: finishedProducts } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent purchase records
  const { data: purchases } = useQuery({
    queryKey: ["recentPurchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_records")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data.map(purchase => ({
        ...purchase,
        type: "purchase"
      }));
    },
  });

  // Fetch recent production batches
  const { data: productions } = useQuery({
    queryKey: ["recentProductions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select("*")
        .order("production_date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data.map(production => ({
        ...production,
        type: "production",
        date: production.production_date
      }));
    },
  });

  // Get raw materials that are below reorder point
  const rawMaterialsLowStock = rawMaterials?.filter(item => 
    item.quantity_in_stock <= item.reorder_point
  ) || [];

  // Get packaging items that are below reorder point
  const packagingItemsLowStock = packagingItems?.filter(item => 
    item.quantity_in_stock <= item.reorder_point
  ) || [];

  // Combine low stock items
  const lowStockItems = [...rawMaterialsLowStock, ...packagingItemsLowStock];

  // Calculate inventory statistics
  useEffect(() => {
    if (rawMaterials && packagingItems && finishedProducts) {
      const rawMaterialsValue = rawMaterials.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const packagingValue = packagingItems.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const finishedProductsValue = finishedProducts.reduce((sum, item) => sum + (item.total_value || 0), 0);
      
      setInventoryValue({
        rawMaterials: rawMaterialsValue,
        packaging: packagingValue,
        finishedProducts: finishedProductsValue,
        total: rawMaterialsValue + packagingValue + finishedProductsValue
      });
    }
  }, [rawMaterials, packagingItems, finishedProducts]);

  // Combine recent activities
  useEffect(() => {
    if (purchases && productions) {
      const combined = [...purchases, ...productions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setRecentActivity(combined);
    }
  }, [purchases, productions]);

  // Prepare data for inventory breakdown chart
  const inventoryBreakdownData = [
    { name: 'Raw Materials', value: inventoryValue.rawMaterials },
    { name: 'Packaging', value: inventoryValue.packaging },
    { name: 'Finished Products', value: inventoryValue.finishedProducts },
  ];

  // Format currency for PKR (Pakistani Rupees)
  const formatCurrency = (value: number) => {
    return `PKR ${value.toLocaleString('en-PK')}`;
  };

  // Get data for recent purchases chart
  const getLast7DaysPurchases = () => {
    if (!purchases) return [];
    
    const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'MMM dd'),
        amount: 0
      };
    }).reverse();
    
    purchases.forEach(purchase => {
      const purchaseDate = format(parseISO(purchase.date), 'yyyy-MM-dd');
      const dayData = lastSevenDays.find(day => day.date === purchaseDate);
      if (dayData) {
        dayData.amount += purchase.total_cost;
      }
    });
    
    return lastSevenDays;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your inventory and recent activity
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryValue.total)}</div>
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
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(inventoryValue.rawMaterials)} total value
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
            <div className="text-2xl font-bold">{packagingItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(inventoryValue.packaging)} total value
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
            <div className="text-2xl font-bold">{finishedProducts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(inventoryValue.finishedProducts)} total value
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Spending</CardTitle>
            <CardDescription>
              Purchase history for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getLast7DaysPurchases()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis tickFormatter={(value) => `PKR ${value}`} />
                <Tooltip 
                  formatter={(value) => [`PKR ${Number(value).toLocaleString('en-PK')}`, 'Amount']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Inventory Breakdown</CardTitle>
            <CardDescription>
              Distribution of inventory value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>
              Items below reorder point
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {item.quantity_in_stock} / {item.reorder_point}
                      </Badge>
                      <p className="text-xs">{formatCurrency(item.unit_cost)}</p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/purchase-records')}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Record Purchase
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">All items are above reorder point</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest purchases and production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="flex items-center">
                          {activity.type === "purchase" ? (
                            <Badge className="mr-2 bg-blue-500">Purchase</Badge>
                          ) : (
                            <Badge className="mr-2 bg-green-500">Production</Badge>
                          )}
                          {activity.type === "purchase" ? (
                            <p className="font-medium">{activity.supplier}</p>
                          ) : (
                            <p className="font-medium">Batch {activity.batch_number}</p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(activity.date), "PPP")}
                        </p>
                      </div>
                      <div className="text-right">
                        {activity.type === "purchase" && (
                          <p className="font-medium">{formatCurrency(activity.total_cost)}</p>
                        )}
                        {activity.type === "production" && (
                          <Badge variant={activity.status === "completed" ? "outline" : "secondary"}>
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ArrowUpRight className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="purchases" className="space-y-4">
                {purchases && purchases.length > 0 ? purchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{purchase.supplier}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(purchase.date), "PPP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(purchase.total_cost)}</p>
                      <p className="text-sm text-muted-foreground">
                        {purchase.quantity} units @ {formatCurrency(purchase.unit_cost)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No recent purchases</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="production" className="space-y-4">
                {productions && productions.length > 0 ? productions.map((production) => (
                  <div key={production.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">Batch {production.batch_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(production.production_date), "PPP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={production.status === "completed" ? "outline" : "secondary"}>
                        {production.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Package className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No recent production</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
