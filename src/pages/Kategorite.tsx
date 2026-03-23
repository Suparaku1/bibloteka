import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Tags } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";

const Kategorite = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ emri: "", kod_slug: "" });

  const { data: kategorite, isLoading } = useQuery({
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kategoritë</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Menaxhoni kategoritë e librave
            {kategorite && <span className="ml-2 font-semibold text-foreground">({kategorite.length} gjithsej)</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Shto Kategori</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Përditëso Kategorinë" : "Shto Kategori të Re"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Emri *</Label><Input value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Kodi (Slug)</Label><Input value={form.kod_slug} onChange={(e) => setForm({ ...form, kod_slug: e.target.value })} placeholder="p.sh. teknologji" /></div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Anulo</Button>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Shto"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton columns={3} rows={5} />
      ) : !kategorite || kategorite.length === 0 ? (
        <div className="rounded-xl shadow-smooth bg-card">
          <EmptyState icon={Tags} title="Nuk ka kategori ende" description="Shtoni kategorinë e parë duke klikuar butonin 'Shto Kategori'" />
        </div>
      ) : (
        <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Emri</th>
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Kodi</th>
                <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Veprime</th>
              </tr></thead>
              <tbody>
                {kategorite.map((k) => (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 sm:px-5 py-3 font-medium">{k.emri}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">{k.kod_slug || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setForm({ emri: k.emri, kod_slug: k.kod_slug || "" }); setEditId(k.id); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <ConfirmDialog
                          onConfirm={() => deleteMutation.mutate(k.id)}
                          title="Fshi Kategorinë?"
                          description={`Jeni i sigurt që dëshironi të fshini "${k.emri}"?`}
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

export default Kategorite;
