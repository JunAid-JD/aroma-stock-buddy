
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  Box,
  Layers,
  Package,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  History,
  Map,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useMobile();
  const location = useLocation();

  const routes: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Raw Materials",
      href: "/raw-materials",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Packaging Goods",
      href: "/packaging-goods",
      icon: <Box className="h-5 w-5" />,
    },
    {
      title: "Finished Goods",
      href: "/finished-goods",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Production History",
      href: "/production-history",
      icon: <History className="h-5 w-5" />,
    },
    {
      title: "Purchase Records",
      href: "/purchase-records",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Loss Records",
      href: "/loss-records",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "SKU Dependency Mapping",
      href: "/sku-dependency-mapping",
      icon: <Map className="h-5 w-5" />,
    },
  ];

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={`relative overflow-hidden border-r pt-14 transition-all duration-300 data-[state=closed]:w-16 md:data-[state=closed]:w-16 ${
        isOpen ? "w-64" : "w-[70px]"
      } h-full flex flex-col`}
    >
      <div className="flex h-[53px] items-center justify-center border-b">
        <ShoppingBag className="h-6 w-6" />
        {isOpen && (
          <span className="ml-2 text-xl font-semibold">Inventory</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 overflow-auto">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant="ghost"
            className={cn(
              "justify-start h-12",
              location.pathname === route.href && "bg-muted",
              !isOpen && "justify-center px-2 md:px-2"
            )}
            asChild
          >
            <Link to={route.href}>
              {route.icon}
              {isOpen && <span className="ml-2">{route.title}</span>}
            </Link>
          </Button>
        ))}
      </div>
      <div className="p-4 flex justify-end border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (!isMobile) {
              setIsOpen(!isOpen);
            }
          }}
          className="w-8 h-8"
        >
          <ChevronIcon
            className={cn("transition-transform", !isOpen && "rotate-180")}
          />
        </Button>
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
