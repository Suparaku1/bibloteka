import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Search, PenTool } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";

const Autoret = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ emri_plote: "", biografi_shkurter: "" });

  const { data: autoret, isLoading } = useQuery({
    queryKey: ["autoret", search],
    queryFn: async () => {
      let query = supabase.from("autoret").select("*").order("emri_plote");
      if (search) query = query.ilike("emri_plote", `%${search}%`);
      const { data } = await query;
      return data ?? [];
    },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Autorët</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Menaxhoni listën e autorëve
            {autoret && <span className="ml-2 font-semibold text-foreground">({autoret.length} gjithsej)</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Shto Autor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Përditëso Autorin" : "Shto Autor të Ri"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Emri i Plotë *</Label><Input value={form.emri_plote} onChange={(e) => setForm({ ...form, emri_plote: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Biografi e Shkurtër</Label><Textarea value={form.biografi_shkurter} onChange={(e) => setForm({ ...form, biografi_shkurter: e.target.value })} rows={3} /></div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Anulo</Button>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Shto"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Kërko autorë..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <TableSkeleton columns={3} rows={5} />
      ) : !autoret || autoret.length === 0 ? (
        <div className="rounded-xl shadow-smooth bg-card">
          <EmptyState icon={PenTool} title="Nuk ka autorë ende" description="Shtoni autorin e parë duke klikuar butonin 'Shto Autor'" />
        </div>
      ) : (
        <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Emri i Plotë</th>
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Biografi</th>
                <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Veprime</th>
              </tr></thead>
              <tbody>
                {autoret.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 sm:px-5 py-3 font-medium">{a.emri_plote}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground max-w-md truncate hidden sm:table-cell">{a.biografi_shkurter || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setForm({ emri_plote: a.emri_plote, biografi_shkurter: a.biografi_shkurter || "" }); setEditId(a.id); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <ConfirmDialog
                          onConfirm={() => deleteMutation.mutate(a.id)}
                          title="Fshi Autorin?"
                          description={`Jeni i sigurt që dëshironi të fshini "${a.emri_plote}"?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Autoret;
