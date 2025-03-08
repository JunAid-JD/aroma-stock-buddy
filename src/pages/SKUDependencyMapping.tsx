import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash, X, Search } from "lucide-react";
import { format } from "date-fns";

interface SKUDependency {
  id: string;
  finished_product_id: string;
  raw_material_id?: string;
  packaging_item_id?: string;
  item_type: 'raw_material' | 'packaging';
  quantity_required: number;
  created_at: string;
  updated_at: string;
  finished_product_sku?: string;
  finished_products?: {
    id: string;
    name: string;
    sku: string;
  };
  raw_materials?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  packaging_items?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface ComponentItem {
  id: string;
  material_id: string;
  material_type: 'raw' | 'packaging';
  quantity: number;
}

const fetchDependencies = async (searchQuery: string = '') => {
  let query = supabase
    .from("sku_dependencies")
    .select(`
      id,
      item_type,
      quantity_required,
      created_at,
      updated_at,
      finished_product_id,
      raw_material_id,
      packaging_item_id,
      finished_product_sku,
      finished_products:finished_product_id (id, name, sku),
      raw_materials (id, name, sku, unit),
      packaging_items:packaging_item_id (id, name, sku)
    `);

  if (searchQuery) {
    query = query.or(`
      finished_products.name.ilike.%${searchQuery}%,
      finished_products.sku.ilike.%${searchQuery}%,
      raw_materials.name.ilike.%${searchQuery}%,
      packaging_items.name.ilike.%${searchQuery}%
    `);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as SKUDependency[];
};

const fetchFinishedProducts = async () => {
  const { data, error } = await supabase
    .from("finished_products")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

const fetchRawMaterials = async () => {
  const { data, error } = await supabase
    .from("raw_materials")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

const fetchPackagingItems = async () => {
  const { data, error } = await supabase
    .from("packaging_items")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data || [];
};

const groupDependenciesByProduct = (dependencies: SKUDependency[]) => {
  const grouped: Record<string, {
    finished_product_id: string;
    finished_product_name: string;
    finished_product_sku: string;
    components: {
      id: string;
      name: string;
      sku: string;
      type: string;
      quantity: number;
      unit?: string;
    }[];
    created_at: string;
    updated_at: string;
  }> = {};

  dependencies.forEach(dep => {
    const productId = dep.finished_product_id;
    const productName = dep.finished_products?.name || 'Unknown Product';
    const productSku = dep.finished_products?.sku || 'Unknown SKU';
    
    if (!grouped[productId]) {
      grouped[productId] = {
        finished_product_id: productId,
        finished_product_name: productName,
        finished_product_sku: productSku,
        components: [],
        created_at: dep.created_at,
        updated_at: dep.updated_at
      };
    }

    if (dep.item_type === 'raw_material' && dep.raw_materials) {
      grouped[productId].components.push({
        id: dep.id,
        name: dep.raw_materials.name,
        sku: dep.raw_materials.sku,
        type: 'Raw Material',
        quantity: dep.quantity_required,
        unit: dep.raw_materials.unit
      });
    } else if (dep.item_type === 'packaging' && dep.packaging_items) {
      grouped[productId].components.push({
        id: dep.id,
        name: dep.packaging_items.name,
        sku: dep.packaging_items.sku || '-',
        type: 'Packaging',
        quantity: dep.quantity_required,
        unit: 'pcs'
      });
    }

    const depCreatedAt = new Date(dep.created_at);
    const depUpdatedAt = new Date(dep.updated_at);
    const groupCreatedAt = new Date(grouped[productId].created_at);
    const groupUpdatedAt = new Date(grouped[productId].updated_at);

    if (depCreatedAt < groupCreatedAt) {
      grouped[productId].created_at = dep.created_at;
    }
    if (depUpdatedAt > groupUpdatedAt) {
      grouped[productId].updated_at = dep.updated_at;
    }
  });

  return Object.values(grouped);
};

const SKUDependencyMapping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [finishedProductSku, setFinishedProductSku] = useState('');
  const [rawMaterialItems, setRawMaterialItems] = useState<ComponentItem[]>([]);
  const [packagingItems, setPackagingItems] = useState<ComponentItem[]>([]);
  const [skuValidationError, setSkuValidationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { data: dependencies, isLoading: isLoadingDependencies } = useQuery({
    queryKey: ['sku_dependencies', searchQuery],
    queryFn: () => fetchDependencies(searchQuery),
  });

  const { data: finishedProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['finished_products'],
    queryFn: fetchFinishedProducts,
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ['raw_materials'],
    queryFn: fetchRawMaterials,
  });

  const { data: packagingMaterials } = useQuery({
    queryKey: ['packaging_items'],
    queryFn: fetchPackagingItems,
  });

  const groupedDependencies = dependencies ? groupDependenciesByProduct(dependencies) : [];

  const addDependencyMutation = useMutation({
    mutationFn: async ({ productSku, rawMaterialItems, packagingItems }: {
      productSku: string,
      rawMaterialItems: ComponentItem[],
      packagingItems: ComponentItem[]
    }) => {
      const dependenciesToInsert = [];

      for (const item of rawMaterialItems) {
        if (item.material_id) {
          dependenciesToInsert.push({
            finished_product_sku: productSku,
            raw_material_id: item.material_id,
            packaging_item_id: null,
            item_type: 'raw_material',
            quantity_required: item.quantity
          });
        }
      }

      for (const item of packagingItems) {
        if (item.material_id) {
          dependenciesToInsert.push({
            finished_product_sku: productSku,
            raw_material_id: null,
            packaging_item_id: item.material_id,
            item_type: 'packaging',
            quantity_required: item.quantity
          });
        }
      }

      if (dependenciesToInsert.length === 0) {
        throw new Error("No dependencies specified");
      }

      const { data, error } = await supabase
        .from("sku_dependencies")
        .insert(dependenciesToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku_dependencies'] });
      toast({
        title: "Success",
        description: "Dependencies added successfully",
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error adding dependencies:", error);
      toast({
        title: "Error",
        description: "Failed to add dependencies",
        variant: "destructive",
      });
    },
  });

  const deleteDependencyMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("sku_dependencies")
        .delete()
        .eq("finished_product_id", productId);
      
      if (error) throw error;
      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku_dependencies'] });
      toast({
        title: "Success",
        description: "Dependencies removed successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedDependency(null);
    },
    onError: (error) => {
      console.error("Error deleting dependencies:", error);
      toast({
        title: "Error",
        description: "Failed to remove dependencies",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFinishedProductSku('');
    setRawMaterialItems([]);
    setPackagingItems([]);
    setSelectedProduct(null);
    setSkuValidationError(null);
    setDebugInfo(null);
  };

  const addRawMaterialItem = () => {
    setRawMaterialItems([
      ...rawMaterialItems,
      { id: crypto.randomUUID(), material_id: '', material_type: 'raw', quantity: 1 }
    ]);
  };

  const addPackagingItem = () => {
    setPackagingItems([
      ...packagingItems,
      { id: crypto.randomUUID(), material_id: '', material_type: 'packaging', quantity: 1 }
    ]);
  };

  const handleRawMaterialChange = (itemId: string, materialId: string) => {
    setRawMaterialItems(rawMaterialItems.map(item => 
      item.id === itemId ? { ...item, material_id: materialId } : item
    ));
  };

  const handleRawMaterialQuantityChange = (itemId: string, quantity: number) => {
    setRawMaterialItems(rawMaterialItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handlePackagingChange = (itemId: string, materialId: string) => {
    setPackagingItems(packagingItems.map(item => 
      item.id === itemId ? { ...item, material_id: materialId } : item
    ));
  };

  const handlePackagingQuantityChange = (itemId: string, quantity: number) => {
    setPackagingItems(packagingItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const removeRawMaterialItem = (itemId: string) => {
    setRawMaterialItems(rawMaterialItems.filter(item => item.id !== itemId));
  };

  const removePackagingItem = (itemId: string) => {
    setPackagingItems(packagingItems.filter(item => item.id !== itemId));
  };

  const validateSku = () => {
    setSkuValidationError(null);
    setDebugInfo(null);
    
    const trimmedSku = finishedProductSku.trim();
    
    if (!trimmedSku) {
      setSkuValidationError("Please enter a product SKU");
      return false;
    }
    
    const isFgFormat = trimmedSku.startsWith('FG-');
    
    setDebugInfo({
      enteredSku: trimmedSku,
      isUuid: false,
      isFgFormat,
      availableSkus: finishedProducts?.map(p => p.sku),
    });
    
    if (!isFgFormat) {
      setSkuValidationError("Invalid SKU format. SKU should start with 'FG-' (e.g., FG-mango12345)");
      return false;
    }
    
    return trimmedSku;
  };

  const handleSubmit = async () => {
    console.log("Submitting form with SKU:", finishedProductSku);
    
    const validSku = validateSku();
    if (!validSku) {
      return;
    }

    console.log("Using SKU:", validSku);

    const validRawMaterials = rawMaterialItems.filter(item => item.material_id);
    const validPackagingItems = packagingItems.filter(item => item.material_id);

    if (validRawMaterials.length === 0 && validPackagingItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one component",
        variant: "destructive",
      });
      return;
    }

    addDependencyMutation.mutate({
      productSku: validSku,
      rawMaterialItems: validRawMaterials,
      packagingItems: validPackagingItems
    });
  };

  const viewDependency = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsViewDialogOpen(true);
  };

  const confirmDeleteDependency = (dependency: any) => {
    setSelectedDependency(dependency);
    setIsDeleteDialogOpen(true);
  };

  const executeDeletion = () => {
    if (selectedDependency) {
      deleteDependencyMutation.mutate(selectedDependency.finished_product_id);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('sku-dependencies-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sku_dependencies'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sku_dependencies'] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SKU Dependency Mapping</h1>
            <p className="text-muted-foreground">
              Map finished products to their raw material and packaging requirements
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Dependency
          </Button>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dependencies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FG SKU</TableHead>
                <TableHead>Components</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDependencies ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : groupedDependencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No dependencies found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                groupedDependencies.map((dependency) => (
                  <TableRow key={dependency.finished_product_id}>
                    <TableCell className="font-medium">
                      {dependency.finished_product_sku}
                      <div className="text-xs text-muted-foreground mt-1">
                        {dependency.finished_product_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewDependency(dependency)}
                      >
                        {dependency.components.length} components
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(dependency.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(dependency.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewDependency(dependency)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteDependency(dependency)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add SKU Dependency</DialogTitle>
            <DialogDescription>
              Define the components required to produce a finished product.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-medium mb-2">Finished Product SKU</h3>
              <Input
                placeholder="Enter finished product SKU (e.g., FG-mango12345)"
                value={finishedProductSku}
                onChange={(e) => setFinishedProductSku(e.target.value)}
                className={skuValidationError ? "border-red-500" : ""}
              />
              {skuValidationError && (
                <p className="text-red-500 text-sm mt-1">{skuValidationError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                SKUs must start with "FG-" (e.g., FG-mango12345). You can create dependencies for new products.
              </p>
              
              {debugInfo && (
                <div className="mt-2 p-2 bg-gray-100 text-xs rounded">
                  <p>Debug Info: Entered SKU: {debugInfo.enteredSku}</p>
                  <p>Is UUID format: {debugInfo.isUuid ? 'Yes' : 'No'}</p>
                  <p>Is FG- format: {debugInfo.isFgFormat ? 'Yes' : 'No'}</p>
                  <p>Available SKUs: {debugInfo.availableSkus?.join(', ') || 'None'}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Raw Materials</h3>
              {rawMaterialItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <select
                      className="w-full p-2 rounded-md border"
                      value={item.material_id}
                      onChange={(e) => handleRawMaterialChange(item.id, e.target.value)}
                    >
                      <option value="">Select raw material</option>
                      {rawMaterials?.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    className="w-24"
                    value={item.quantity}
                    onChange={(e) => handleRawMaterialQuantityChange(item.id, parseFloat(e.target.value) || 1)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRawMaterialItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={addRawMaterialItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Raw Material
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-2">Packaging Items</h3>
              {packagingItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <select
                      className="w-full p-2 rounded-md border"
                      value={item.material_id}
                      onChange={(e) => handlePackagingChange(item.id, e.target.value)}
                    >
                      <option value="">Select packaging item</option>
                      {packagingMaterials?.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.sku || 'No SKU'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="w-24"
                    value={item.quantity}
                    onChange={(e) => handlePackagingQuantityChange(item.id, parseInt(e.target.value) || 1)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePackagingItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={addPackagingItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Packaging Item
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={addDependencyMutation.isPending}
            >
              {addDependencyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Components</DialogTitle>
            <DialogDescription>
              {selectedDependency && (
                <>
                  Components for {selectedDependency.finished_product_name} ({selectedDependency.finished_product_sku})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDependency?.components.map((component: any) => (
                  <TableRow key={component.id}>
                    <TableCell>
                      {component.name}
                      <div className="text-xs text-muted-foreground">
                        {component.sku}
                      </div>
                    </TableCell>
                    <TableCell>{component.type}</TableCell>
                    <TableCell>
                      {component.quantity} {component.unit || 'pcs'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all dependencies for product 
              {selectedDependency && ` "${selectedDependency.finished_product_name}" (${selectedDependency.finished_product_sku})`}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeletion}
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
