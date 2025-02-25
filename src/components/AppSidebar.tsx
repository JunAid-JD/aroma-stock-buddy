
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Package,
  PackageOpen,
  AlertTriangle,
  ShoppingCart,
  History,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Boxes, label: "Raw Materials", to: "/raw-goods" },
    { icon: Package, label: "Packaging", to: "/packaging-goods" },
    { icon: PackageOpen, label: "Finished Goods", to: "/finished-goods" },
    { icon: Network, label: "SKU Dependencies", to: "/sku-mapping" },
    { icon: AlertTriangle, label: "Loss Records", to: "/loss-records" },
    { icon: ShoppingCart, label: "Purchase Records", to: "/purchase-records" },
    { icon: History, label: "Production History", to: "/production-history" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-4 text-xl font-semibold">
        Inventory Management
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 w-full px-6 py-2",
                      isActive && "bg-muted"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;

