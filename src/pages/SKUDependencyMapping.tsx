
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import ItemFormDialog from "@/components/ItemFormDialog";
import { useToast } from "@/components/ui/use-toast";

interface Component {
  id: string;
  name: string;
  quantity_required: number;
  quantity_per_unit: number;
  type: "raw_material" | "packaging";
}

interface FinishedProduct {
  id: string;
  name: string;
  sku: string;
  type: string;
  volume_config: string;
  components: Component[];
}

const SKUDependencyMapping = () => {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<FinishedProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: finishedProducts, refetch } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("finished_products")
        .select(`
          *,
          components:product_components(
            id,
            quantity_required,
            quantity_per_unit,
            component_type,
            raw_materials:raw_material_id(id, name),
            packaging_items:packaging_item_id(id, name)
          )
        `)
        .order("name");

      if (error) throw error;

      return products.map((product) => ({
        ...product,
        components: product.components.map((component: any) => ({
          id: component.id,
          name: component.raw_materials?.name || component.packaging_items?.name,
          quantity_required: component.quantity_required,
          quantity_per_unit: component.quantity_per_unit,
          type: component.component_type,
        })),
      }));
    },
  });

  const handleEdit = (product: FinishedProduct) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from("product_components")
        .update({
          quantity_required: data.quantity_required,
          quantity_per_unit: data.quantity_per_unit,
        })
        .eq("id", data.id);

      if (error) throw error;

      await refetch();
      toast({
        title: "Success",
        description: "Component updated successfully",
      });
    } catch (error) {
      console.error("Error updating component:", error);
      toast({
        title: "Error",
        description: "Failed to update component",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SKU Dependencies</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Components</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finishedProducts?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>{product.volume_config}</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    {product.components.map((component) => (
                      <li key={component.id}>
                        {component.name} ({component.quantity_required} {component.type === 'raw_material' ? 'ml' : 'units'})
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    Edit Components
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedProduct && (
        <ItemFormDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
          onSubmit={handleSubmit}
          item={selectedProduct}
          type="finished"
        />
      )}
    </div>
  );
};

export default SKUDependencyMapping;
