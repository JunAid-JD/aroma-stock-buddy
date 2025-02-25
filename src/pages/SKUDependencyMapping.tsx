
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
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ItemFormDialog from "@/components/ItemFormDialog";

interface Component {
  id: string;
  name: string;
  quantity_required: number;
  quantity_per_unit: number;
  type: 'raw_material' | 'packaging';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FinishedProduct | null>(null);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["finishedProductsWithComponents"],
    queryFn: async () => {
      console.log("Fetching finished products with components...");
      
      // First, get all finished products
      const { data: productsData, error: productsError } = await supabase
        .from("finished_products")
        .select("*")
        .order("name");
      
      if (productsError) {
        console.error("Error fetching products:", productsError);
        throw productsError;
      }

      // Then, for each product, get its components
      const productsWithComponents = await Promise.all(
        productsData.map(async (product) => {
          const { data: components, error: componentsError } = await supabase
            .from("product_components")
            .select(`
              id,
              component_type,
              quantity_required,
              quantity_per_unit,
              raw_materials(id, name),
              packaging_items(id, name)
            `)
            .eq("finished_product_id", product.id);

          if (componentsError) {
            console.error("Error fetching components:", componentsError);
            throw componentsError;
          }

          // Transform components data
          const transformedComponents = components.map((component) => ({
            id: component.id,
            name: component.component_type === 'raw_material' 
              ? component.raw_materials?.name 
              : component.packaging_items?.name,
            quantity_required: component.quantity_required,
            quantity_per_unit: component.quantity_per_unit,
            type: component.component_type,
          }));

          return {
            ...product,
            components: transformedComponents,
          };
        })
      );

      console.log("Fetched products with components:", productsWithComponents);
      return productsWithComponents;
    },
  });

  const handleEdit = (product: FinishedProduct) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU Dependency Mapping</h2>
          <p className="text-muted-foreground">
            Manage relationships between finished products and their components
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Product
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Components</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>
                    {product.volume_config.replace(/_/g, ' ')
                      .replace(/(\w+)/, (s) => s.charAt(0).toUpperCase() + s.slice(1))}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.components.map((component) => (
                        <div key={component.id} className="text-sm">
                          <span className="font-medium">{component.name}</span>
                          {" - "}
                          <span className="text-muted-foreground">
                            {component.quantity_required} units 
                            {component.quantity_per_unit > 1 && ` (${component.quantity_per_unit} per unit)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={async (formData) => {
          // You already have the form submission logic in ItemFormDialog
          try {
            // Pass through the existing submission logic
            await handleSubmit(formData);
            setIsDialogOpen(false);
            setSelectedProduct(null);
            toast({
              title: "Success",
              description: `Product ${selectedProduct ? "updated" : "created"} successfully.`,
            });
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "An error occurred while saving the product.",
              variant: "destructive",
            });
          }
        }}
        item={selectedProduct}
        type="finished"
      />
    </div>
  );
};

export default SKUDependencyMapping;
