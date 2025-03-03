
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DependencyForm from "@/components/dependency/DependencyForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch all finished products
const fetchFinishedProducts = async () => {
  const { data, error } = await supabase
    .from("finished_products")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

// Fetch all raw materials
const fetchRawMaterials = async () => {
  const { data, error } = await supabase
    .from("raw_materials")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

// Fetch all packaging materials - we need to query packaging_items not packaging_materials
const fetchPackagingMaterials = async () => {
  const { data, error } = await supabase
    .from("packaging_items")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

// Fetch dependencies for a specific finished product
const fetchDependencies = async (productId: string) => {
  if (!productId) return [];
  
  const { data, error } = await supabase
    .from("sku_dependencies")
    .select(`
      id,
      material_type,
      material_id,
      raw_material_id,
      packaging_item_id,
      quantity_required,
      raw_materials (id, name, sku, unit),
      packaging_items:packaging_item_id (id, name, sku)
    `)
    .eq("finished_product_id", productId);
  
  if (error) throw error;
  return data || [];
};

// Helper function to get material name based on type and ID
const getMaterialName = (dependency: any) => {
  if (dependency.material_type === 'raw') {
    return dependency.raw_materials?.name || 'Unknown Raw Material';
  } else if (dependency.material_type === 'packaging') {
    return dependency.packaging_items?.name || 'Unknown Packaging Material';
  }
  return 'Unknown Material';
};

// Helper function to get material SKU based on type and ID
const getMaterialSKU = (dependency: any) => {
  if (dependency.material_type === 'raw') {
    return dependency.raw_materials?.sku || '-';
  } else if (dependency.material_type === 'packaging') {
    return dependency.packaging_items?.sku || '-';
  }
  return '-';
};

// Helper function to get material unit based on type and ID
const getMaterialUnit = (dependency: any) => {
  if (dependency.material_type === 'raw') {
    return dependency.raw_materials?.unit || '-';
  } else if (dependency.material_type === 'packaging') {
    return 'pcs';
  }
  return '-';
};

const SKUDependencyMapping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [isEditingDependency, setIsEditingDependency] = useState(false);
  const [currentDependency, setCurrentDependency] = useState<any>(null);
  const [isDeletingDependency, setIsDeletingDependency] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSKU, setNewProductSKU] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");

  // Fetch finished products
  const { 
    data: finishedProducts, 
    isLoading: isLoadingProducts 
  } = useQuery({
    queryKey: ['finished_products'],
    queryFn: fetchFinishedProducts,
  });

  // Fetch raw materials
  const { 
    data: rawMaterials 
  } = useQuery({
    queryKey: ['raw_materials'],
    queryFn: fetchRawMaterials,
  });

  // Fetch packaging materials
  const { 
    data: packagingMaterials 
  } = useQuery({
    queryKey: ['packaging_materials'],
    queryFn: fetchPackagingMaterials,
  });

  // Fetch dependencies
  const { 
    data: dependencies, 
    isLoading: isLoadingDependencies 
  } = useQuery({
    queryKey: ['dependencies', selectedProduct],
    queryFn: () => fetchDependencies(selectedProduct || ''),
    enabled: !!selectedProduct,
  });

  // Mutation to create a new finished product
  const createProductMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const { data, error } = await supabase
        .from("finished_products")
        .insert([newProduct])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finished_products'] });
      setSelectedProduct(data.id);
      setIsCreatingProduct(false);
      setNewProductName("");
      setNewProductSKU("");
      setNewProductUnit("");
      toast({
        title: "Success",
        description: "Finished product created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create finished product",
        variant: "destructive",
      });
    },
  });

  // Mutation to add a new dependency
  const addDependencyMutation = useMutation({
    mutationFn: async (newDependency: any) => {
      console.log("Adding dependency:", newDependency);
      
      const dependencyData = {
        finished_product_id: selectedProduct,
        material_type: newDependency.material_type,
        quantity_required: newDependency.quantity_required,
      };
      
      // Add the correct field based on material type
      if (newDependency.material_type === 'raw') {
        Object.assign(dependencyData, { raw_material_id: newDependency.material_id });
      } else if (newDependency.material_type === 'packaging') {
        Object.assign(dependencyData, { packaging_item_id: newDependency.material_id });
      }
      
      const { data, error } = await supabase
        .from("sku_dependencies")
        .insert([dependencyData])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', selectedProduct] });
      setIsAddingDependency(false);
      toast({
        title: "Success",
        description: "Dependency added successfully",
      });
    },
    onError: (error) => {
      console.error("Error adding dependency:", error);
      toast({
        title: "Error",
        description: "Failed to add dependency",
        variant: "destructive",
      });
    },
  });

  // Mutation to update a dependency
  const updateDependencyMutation = useMutation({
    mutationFn: async ({ id, updatedDependency }: { id: string, updatedDependency: any }) => {
      console.log("Updating dependency:", id, updatedDependency);
      
      const dependencyData = {
        material_type: updatedDependency.material_type,
        quantity_required: updatedDependency.quantity_required,
      };
      
      // Add the correct field based on material type
      if (updatedDependency.material_type === 'raw') {
        Object.assign(dependencyData, { 
          raw_material_id: updatedDependency.material_id,
          packaging_item_id: null
        });
      } else if (updatedDependency.material_type === 'packaging') {
        Object.assign(dependencyData, { 
          packaging_item_id: updatedDependency.material_id,
          raw_material_id: null
        });
      }
      
      const { data, error } = await supabase
        .from("sku_dependencies")
        .update(dependencyData)
        .eq("id", id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', selectedProduct] });
      setIsEditingDependency(false);
      setCurrentDependency(null);
      toast({
        title: "Success",
        description: "Dependency updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating dependency:", error);
      toast({
        title: "Error",
        description: "Failed to update dependency",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a dependency
  const deleteDependencyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', selectedProduct] });
      setIsDeletingDependency(false);
      setCurrentDependency(null);
      toast({
        title: "Success",
        description: "Dependency removed successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting dependency:", error);
      toast({
        title: "Error",
        description: "Failed to remove dependency",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProductName.trim() || !newProductSKU.trim() || !newProductUnit.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    createProductMutation.mutate({
      name: newProductName.trim(),
      sku: newProductSKU.trim(),
      unit: newProductUnit.trim(),
      type: 'essential_oil',  // Default value
      quantity_in_stock: 0,
      unit_price: 0,
      volume_config: 'essential_10ml', // Default value
    });
  };

  const handleAddDependency = (formData: any) => {
    console.log("Form data for new dependency:", formData);
    
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }
    
    // Check if at least one valid dependency is specified
    const hasValidDependency = (formData.material_type && formData.material_id);
    
    if (!hasValidDependency) {
      toast({
        title: "Error",
        description: "Please specify at least one component dependency",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new dependency
    const newDependency = {
      material_type: formData.material_type,
      material_id: formData.material_id,
      quantity_required: parseFloat(formData.quantity_required) || 1
    };
    
    addDependencyMutation.mutate(newDependency);
  };

  const handleUpdateDependency = (formData: any) => {
    if (!currentDependency?.id) return;
    
    console.log("Form data for update dependency:", formData);
    
    const updatedDependency = {
      material_type: formData.material_type,
      material_id: formData.material_id,
      quantity_required: parseFloat(formData.quantity_required) || 1
    };
    
    updateDependencyMutation.mutate({
      id: currentDependency.id,
      updatedDependency: updatedDependency,
    });
  };

  const handleDeleteDependency = () => {
    if (!currentDependency?.id) return;
    
    deleteDependencyMutation.mutate(currentDependency.id);
  };

  const closeEditModal = () => {
    setIsEditingDependency(false);
    setCurrentDependency(null);
  };

  const closeDeleteModal = () => {
    setIsDeletingDependency(false);
    setCurrentDependency(null);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SKU Dependency Mapping</h1>
          <p className="text-muted-foreground">
            Manage component dependencies for finished products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Finished Products</CardTitle>
                <CardDescription>
                  Select a product to view its components
                </CardDescription>
              </div>
              <Dialog open={isCreatingProduct} onOpenChange={setIsCreatingProduct}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Finished Product</DialogTitle>
                    <DialogDescription>
                      Add a new finished product to manage its dependencies
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProduct}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={newProductSKU}
                          onChange={(e) => setNewProductSKU(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatingProduct(false)}
                        disabled={createProductMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Product"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {finishedProducts && finishedProducts.length > 0 ? (
                  finishedProducts.map((product: any) => (
                    <Button
                      key={product.id}
                      variant={selectedProduct === product.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleProductSelect(product.id)}
                    >
                      {product.name} ({product.sku})
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No finished products found.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dependencies</CardTitle>
                <CardDescription>
                  Components required for the selected product
                </CardDescription>
              </div>
              {selectedProduct && (
                <Dialog open={isAddingDependency} onOpenChange={setIsAddingDependency}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Component
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Component Dependency</DialogTitle>
                      <DialogDescription>
                        Specify the components required for this product
                      </DialogDescription>
                    </DialogHeader>
                    <DependencyForm
                      rawMaterialsList={rawMaterials || []}
                      packagingItemsList={packagingMaterials || []}
                      onSubmit={handleAddDependency}
                      onCancel={() => setIsAddingDependency(false)}
                      isSubmitting={addDependencyMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProduct ? (
              <div className="text-center py-6 text-muted-foreground">
                Select a finished product to view its components
              </div>
            ) : isLoadingDependencies ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : dependencies && dependencies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dependencies.map((dependency: any) => (
                    <TableRow key={dependency.id}>
                      <TableCell>{getMaterialName(dependency)}</TableCell>
                      <TableCell>{getMaterialSKU(dependency)}</TableCell>
                      <TableCell>
                        {dependency.material_type === 'raw' ? 'Raw Material' : 'Packaging'}
                      </TableCell>
                      <TableCell>
                        {dependency.quantity_required} {getMaterialUnit(dependency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentDependency(dependency);
                              setIsEditingDependency(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentDependency(dependency);
                              setIsDeletingDependency(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No dependencies found for this product
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dependency Dialog */}
      <Dialog open={isEditingDependency} onOpenChange={closeEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Component Dependency</DialogTitle>
            <DialogDescription>
              Update the component requirements for this product
            </DialogDescription>
          </DialogHeader>
          <DependencyForm
            rawMaterialsList={rawMaterials || []}
            packagingItemsList={packagingMaterials || []}
            onSubmit={handleUpdateDependency}
            onCancel={closeEditModal}
            isSubmitting={updateDependencyMutation.isPending}
            initialData={{
              material_type: currentDependency?.material_type,
              material_id: currentDependency?.material_type === 'raw' 
                ? currentDependency?.raw_material_id 
                : currentDependency?.packaging_item_id,
              quantity_required: currentDependency?.quantity_required,
            }}
            isEditing
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dependency Alert Dialog */}
      <AlertDialog open={isDeletingDependency} onOpenChange={closeDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this component dependency?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDependency}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDependencyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SKUDependencyMapping;
