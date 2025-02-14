
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Box, Archive, AlertTriangle } from "lucide-react";

const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // These will be replaced with real data later
  const dashboardData = [
    {
      title: "Raw Goods",
      value: "15",
      description: "Total SKUs in stock",
      icon: Box,
    },
    {
      title: "Packaging Goods",
      value: "24",
      description: "Available items",
      icon: Package,
    },
    {
      title: "Finished Goods",
      value: "42",
      description: "Ready for shipment",
      icon: Archive,
    },
    {
      title: "Low Stock Alerts",
      value: "3",
      description: "Items need attention",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your inventory management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest inventory movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>
              Current inventory levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stock charts coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
