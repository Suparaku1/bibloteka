import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Autoret = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ emri_plote: "", biografi_shkurter: "" });

  const { data: autoret } = useQuery({
    queryKey: ["autoret"],
    queryFn: async () => { const { data } = await supabase.from("autoret").select("*").order("emri_plote"); return data ?? []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { emri_plote: form.emri_plote, biografi_shkurter: form.biografi_shkurter || null };
      if (editId) {
        const { error } = await supabase.from("autoret").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("autoret").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["autoret"] }); toast.success(editId ? "Autori u përditësua" : "Autori u shtua"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("autoret").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["autoret"] }); toast.success("Autori u fshi"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ emri_plote: "", biografi_shkurter: "" }); setEditId(null); setOpen(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Autorët</h2><p className="text-sm text-muted-foreground">Menaxhoni listën e autorëve</p></div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Shto Autor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Përditëso Autorin" : "Shto Autor të Ri"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Emri i Plotë *</Label><Input value={form.emri_plote} onChange={(e) => setForm({ ...form, emri_plote: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Biografi e Shkurtër</Label><Textarea value={form.biografi_shkurter} onChange={(e) => setForm({ ...form, biografi_shkurter: e.target.value })} rows={3} /></div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Shto"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg shadow-smooth bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Emri i Plotë</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Biografi</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Veprime</th>
            </tr></thead>
            <tbody>
              {autoret?.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-medium">{a.emri_plote}</td>
                  <td className="px-5 py-3 text-muted-foreground max-w-md truncate">{a.biografi_shkurter || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setForm({ emri_plote: a.emri_plote, biografi_shkurter: a.biografi_shkurter || "" }); setEditId(a.id); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!autoret || autoret.length === 0) && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">Nuk ka autorë ende</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Autoret;
