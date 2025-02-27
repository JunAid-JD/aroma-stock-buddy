
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const columns = [
  { key: "date", label: "Date", isDate: true },
  { key: "item_name", label: "Item" },
  { key: "item_type", label: "Type" },
  { key: "quantity", label: "Quantity Lost" },
  { key: "reason", label: "Reason" },
  { key: "cost_impact", label: "Cost Impact" },
];

const LossRecords = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItemType, setSelectedItemType] = useState<string>("");

  const { data: lossRecords, isLoading } = useQuery({
    queryKey: ["lossRecords"],
    queryFn: async () => {
      const { data: records, error } = await supabase
        .from("loss_records")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;

      const itemPromises = records.map(async (record) => {
        let itemName = 'Unknown Item';
        
        if (record.item_type === 'raw_material') {
          const { data } = await supabase
            .from('raw_materials')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        } else if (record.item_type === 'packaging') {
          const { data } = await supabase
            .from('packaging_items')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        } else if (record.item_type === 'finished_product') {
          const { data } = await supabase
            .from('finished_products')
            .select('name')
            .eq('id', record.item_id)
            .single();
          if (data) itemName = data.name;
        }

        return {
          ...record,
          item_name: itemName,
          cost_impact: record.cost_impact ? `Rs. ${record.cost_impact.toFixed(2)}` : 'Calculating...'
        };
      });

      return Promise.all(itemPromises);
    },
  });

  // Listen for realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loss_records'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDeleteClick = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from("loss_records")
        .delete()
        .eq("id", selectedRecord.id);
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: "Record deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record.",
        variant: "destructive",
      });
    }
  };

  const { data: items } = useQuery({
    queryKey: ["allItems"],
    queryFn: async () => {
      const [rawMaterials, packagingItems, finishedProducts] = await Promise.all([
        supabase.from("raw_materials").select("id, name"),
        supabase.from("packaging_items").select("id, name, type, size"),
        supabase.from("finished_products").select("id, name"),
      ]);

      return {
        raw_material: rawMaterials.data || [],
        packaging: packagingItems.data?.map(item => ({
          ...item,
          name: `${item.name} (${item.type} - ${item.size})`
        })) || [],
        finished_product: finishedProducts.data || [],
      };
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      item_id: formData.get("item_id") as string,
      item_type: formData.get("item_type") as "raw_material" | "packaging" | "finished_product",
      quantity: parseFloat(formData.get("quantity") as string),
      reason: formData.get("reason") as string,
      date: new Date().toISOString(),
    };

    try {
      if (selectedRecord) {
        const { error } = await supabase
          .from("loss_records")
          .update(data)
          .eq("id", selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loss_records")
          .insert(data);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["lossRecords"] });
      await queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      await queryClient.invalidateQueries({ queryKey: ["packagingItems"] });
      await queryClient.invalidateQueries({ queryKey: ["finishedProducts"] });
      
      toast({
        title: "Success",
        description: `Record ${selectedRecord ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedRecord(null);
      setSelectedItemType("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.