import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Nxenesit = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ emri: "", mbiemri: "", klasa: "", nr_amzes: "", email: "", nr_telefoni: "" });

  const { data: nxenesit, isLoading } = useQuery({
    queryKey: ["nxenesit", search],
    queryFn: async () => {
      let query = supabase.from("nxenesit").select("*").order("mbiemri");
      if (search) query = query.or(`emri.ilike.%${search}%,mbiemri.ilike.%${search}%,nr_amzes.ilike.%${search}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        emri: form.emri,
        mbiemri: form.mbiemri,
        klasa: form.klasa || null,
        nr_amzes: form.nr_amzes || null,
        email: form.email || null,
        nr_telefoni: form.nr_telefoni || null,
      };
      if (editId) {
        const { error } = await supabase.from("nxenesit").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("nxenesit").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nxenesit"] });
      toast.success(editId ? "Nxënësi u përditësua" : "Nxënësi u shtua");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nxenesit").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["nxenesit"] }); toast.success("Nxënësi u fshi"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ emri: "", mbiemri: "", klasa: "", nr_amzes: "", email: "", nr_telefoni: "" }); setEditId(null); setOpen(false); };

  const startEdit = (n: any) => {
    setForm({ emri: n.emri, mbiemri: n.mbiemri, klasa: n.klasa || "", nr_amzes: n.nr_amzes || "", email: n.email || "", nr_telefoni: n.nr_telefoni || "" });
    setEditId(n.id); setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Nxënësit</h2>
          <p className="text-sm text-muted-foreground">Menaxhoni listën e nxënësve</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Shto Nxënës</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Përditëso Nxënësin" : "Shto Nxënës të Ri"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Emri *</Label><Input value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Mbiemri *</Label><Input value={form.mbiemri} onChange={(e) => setForm({ ...form, mbiemri: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Klasa</Label><Input value={form.klasa} onChange={(e) => setForm({ ...form, klasa: e.target.value })} placeholder="p.sh. 12-A" /></div>
                <div className="space-y-2"><Label>Nr. Amzës</Label><Input value={form.nr_amzes} onChange={(e) => setForm({ ...form, nr_amzes: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nr. Telefoni</Label><Input type="tel" value={form.nr_telefoni} onChange={(e) => setForm({ ...form, nr_telefoni: e.target.value })} placeholder="p.sh. 069 123 4567" /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Shto"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Kërko nxënës..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg shadow-smooth bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nr. Amzës</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Emri</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mbiemri</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Klasa</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nr. Telefoni</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {nxenesit?.map((n: any) => (
                <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-mono text-xs tabular-nums">{n.nr_amzes || "—"}</td>
                  <td className="px-5 py-3 font-medium">{n.emri}</td>
                  <td className="px-5 py-3">{n.mbiemri}</td>
                  <td className="px-5 py-3 text-muted-foreground">{n.klasa || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{n.email || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{n.nr_telefoni || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(n)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(n.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!nxenesit || nxenesit.length === 0) && !isLoading && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Nuk ka nxënës ende</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Nxenesit;
