
import {
  PackageOpen,
  Package,
  ShoppingCart,
  History,
  Home,
  FileBarChart,
  AlertTriangle,
  Link,
  LogOut,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    link: "/dashboard",
  },
  {
    title: "Raw Materials",
    icon: Package,
    link: "/raw-materials",
  },
  {
    title: "Packaging Goods",
    icon: Package,
    link: "/packaging-goods",
  },
  {
    title: "Finished Goods",
    icon: PackageOpen,
    link: "/finished-goods",
  },
  {
    title: "Production History",
    icon: History,
    link: "/production-history",
  },
  {
    title: "Purchase Records",
    icon: ShoppingCart,
    link: "/purchase-records",
  },
  {
    title: "Loss Records",
    icon: AlertTriangle,
    link: "/loss-records",
  },
  {
    title: "SKU Dependency Mapping",
    icon: Link,
    link: "/sku-dependency-mapping",
  },
];

export const AppSidebar = () => {
  const isMobile = useIsMobile();

  return (
    <aside className="min-w-[240px] md:min-w-[280px] border-r h-screen overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <FileBarChart className="h-8 w-8" />
          <h1 className="text-xl font-bold">Inventory System</h1>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <RouterLink
              key={item.title}
              to={item.link}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </RouterLink>
          ))}
        </nav>
        
        <RouterLink
          to="/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 mt-auto border-t pt-4"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </RouterLink>
      </div>
    </aside>
  );
};

export default AppSidebar;
