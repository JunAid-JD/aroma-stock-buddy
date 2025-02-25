
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

const AppSidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="left"
        className="w-[300px] border-r px-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Inventory Management</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full py-6">
          <div className="space-y-1">
            <NavLink to="/" end>
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
            </NavLink>
            <NavLink to="/raw-goods">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <Boxes className="mr-2 h-4 w-4" />
                  Raw Materials
                </Button>
              )}
            </NavLink>
            <NavLink to="/packaging-goods">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Packaging
                </Button>
              )}
            </NavLink>
            <NavLink to="/finished-goods">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <PackageOpen className="mr-2 h-4 w-4" />
                  Finished Goods
                </Button>
              )}
            </NavLink>
            <NavLink to="/sku-mapping">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <Network className="mr-2 h-4 w-4" />
                  SKU Dependencies
                </Button>
              )}
            </NavLink>
            <NavLink to="/loss-records">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Loss Records
                </Button>
              )}
            </NavLink>
            <NavLink to="/purchase-records">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Records
                </Button>
              )}
            </NavLink>
            <NavLink to="/production-history">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-6",
                    isActive && "bg-muted"
                  )}
                >
                  <History className="mr-2 h-4 w-4" />
                  Production History
                </Button>
              )}
            </NavLink>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
