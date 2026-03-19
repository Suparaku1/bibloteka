import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Kategorite = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ emri: "", kod_slug: "" });

  const { data: kategorite } = useQuery({
    queryKey: ["kategorite"],
    queryFn: async () => { const { data } = await supabase.from("kategorite").select("*").order("emri"); return data ?? []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { emri: form.emri, kod_slug: form.kod_slug || null };
      if (editId) {
        const { error } = await supabase.from("kategorite").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kategorite").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kategorite"] }); toast.success(editId ? "Kategoria u përditësua" : "Kategoria u shtua"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("kategorite").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kategorite"] }); toast.success("Kategoria u fshi"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ emri: "", kod_slug: "" }); setEditId(null); setOpen(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Kategoritë</h2><p className="text-sm text-muted-foreground">Menaxhoni kategoritë e librave</p></div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Shto Kategori</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Përditëso Kategorinë" : "Shto Kategori të Re"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Emri *</Label><Input value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Kodi (Slug)</Label><Input value={form.kod_slug} onChange={(e) => setForm({ ...form, kod_slug: e.target.value })} placeholder="p.sh. teknologji" /></div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Shto"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg shadow-smooth bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Emri</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kodi</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Veprime</th>
            </tr></thead>
            <tbody>
              {kategorite?.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-medium">{k.emri}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{k.kod_slug || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setForm({ emri: k.emri, kod_slug: k.kod_slug || "" }); setEditId(k.id); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(k.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!kategorite || kategorite.length === 0) && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">Nuk ka kategori ende</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Kategorite;
