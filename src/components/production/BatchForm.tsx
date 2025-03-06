
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const batchFormSchema = z.object({
  finished_product_id: z.string().min(1, { message: "Please select a finished product." }),
  batch_number: z.string().min(2, {
    message: "Batch number must be at least 2 characters.",
  }),
  quantity_produced: z.number().min(1, {
    message: "Quantity produced must be at least 1.",
  }),
});

interface BatchFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

type BatchFormValues = z.infer<typeof batchFormSchema>;

const BatchForm = ({ onSubmit, onClose }: BatchFormProps) => {
  const { toast } = useToast();

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      finished_product_id: "",
      batch_number: "",
      quantity_produced: 1,
    },
  });

  const { data: finishedProducts, isLoading } = useQuery({
    queryKey: ["finishedProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finished_products")
        .select("id, name, sku")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Function to check if a finished product has dependencies
  const checkDependencies = async (productId: string) => {
    try {
      // First, get the product's SKU
      const { data: productData, error: productError } = await supabase
        .from("finished_products")
        .select("sku")
        .eq("id", productId)
        .single();
      
      if (productError) throw productError;
      
      // Check for dependencies using the SKU instead of ID
      const { data, error } = await supabase
        .from("sku_dependencies")
        .select("*")
        .eq("finished_product_sku", productData.sku)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Warning: No dependencies defined",
          description: `This product has no raw materials or packaging defined. Production may be inaccurate.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error: any) {
      console.error("Error checking dependencies:", error);
      return false;
    }
  };

  async function onSubmitHandler(values: BatchFormValues) {
    const hasDependencies = await checkDependencies(values.finished_product_id);
    if (!hasDependencies) {
      return;
    }

    await onSubmit({
      ...values,
      production_date: new Date(), // Automatically use current date/time
    });
    onClose();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="finished_product_id">Finished Product</Label>
          <Controller
            name="finished_product_id"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a finished product" />
                </SelectTrigger>
                <SelectContent>
                  {finishedProducts?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.finished_product_id && (
            <p className="text-sm text-red-500">
              {form.formState.errors.finished_product_id.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="batch_number">Batch Number</Label>
          <Input
            id="batch_number"
            type="text"
            {...form.register("batch_number")}
          />
          {form.formState.errors.batch_number && (
            <p className="text-sm text-red-500">
              {form.formState.errors.batch_number.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity_produced">Quantity Produced</Label>
          <Input
            id="quantity_produced"
            type="number"
            {...form.register("quantity_produced", { valueAsNumber: true })}
          />
          {form.formState.errors.quantity_produced && (
            <p className="text-sm text-red-500">
              {form.formState.errors.quantity_produced.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Submit</Button>
      </DialogFooter>
    </form>
  );
};

export default BatchForm;
