import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Star, FolderInput, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  selectedIds: string[];
  categories: string[];
  onClear: () => void;
}

export function BulkProductActions({ selectedIds, categories, onClear }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [bulkCategory, setBulkCategory] = useState<string>("");

  const bulkUpdate = useMutation({
    mutationFn: async (patch: { featured?: boolean; category?: string }) => {
      const { error } = await supabase.from("products").update(patch).in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: `Updated ${selectedIds.length} products` });
      onClear();
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: `Deleted ${selectedIds.length} products` });
      onClear();
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-14 z-30 flex flex-wrap items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <Badge variant="default" className="text-sm">{selectedIds.length} selected</Badge>
      <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ featured: true })} disabled={bulkUpdate.isPending}>
        <Star className="h-4 w-4 mr-1" /> Feature
      </Button>
      <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ featured: false })} disabled={bulkUpdate.isPending}>
        Unfeature
      </Button>
      <div className="flex items-center gap-1">
        <Select value={bulkCategory} onValueChange={setBulkCategory}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Move to category..." /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" disabled={!bulkCategory || bulkUpdate.isPending}
          onClick={() => bulkUpdate.mutate({ category: bulkCategory })}>
          <FolderInput className="h-4 w-4" />
        </Button>
      </div>
      <Button size="sm" variant="destructive" onClick={() => {
        if (confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) bulkDelete.mutate();
      }} disabled={bulkDelete.isPending}>
        <Trash2 className="h-4 w-4 mr-1" /> Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="ml-auto">
        <X className="h-4 w-4 mr-1" /> Clear
      </Button>
    </div>
  );
}