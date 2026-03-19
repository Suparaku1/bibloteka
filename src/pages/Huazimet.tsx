import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Statusi = Database["public"]["Enums"]["statusi_huazimit"];

const Huazimet = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ liber_id: "", nxenes_id: "" });
  const [filter, setFilter] = useState<string>("te-gjitha");

  const { data: huazimet, isLoading } = useQuery({
    queryKey: ["huazimet", filter],
    queryFn: async () => {
      let query = supabase.from("huazimet").select("*, librat(titulli), nxenesit(emri, mbiemri)").order("created_at", { ascending: false });
      if (filter !== "te-gjitha") query = query.eq("statusi", filter as Statusi);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: libratGjendje } = useQuery({
    queryKey: ["librat-gjendje"],
    queryFn: async () => {
      const { data, error } = await supabase.from("librat").select("id, titulli, sasia").gt("sasia", 0).order("titulli");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: nxenesit } = useQuery({
    queryKey: ["nxenesit-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nxenesit").select("id, emri, mbiemri").order("mbiemri");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("huazimet").insert({ liber_id: form.liber_id, nxenes_id: form.nxenes_id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["huazimet"] });
      queryClient.invalidateQueries({ queryKey: ["librat"] });
      queryClient.invalidateQueries({ queryKey: ["librat-gjendje"] });
      toast.success("Huazimi u regjistrua me sukses");
      setForm({ liber_id: "", nxenes_id: "" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const returnMutation = useMutation({
    mutationFn: async (huazimiId: string) => {
      const { error } = await supabase
        .from("huazimet")
        .update({ statusi: "kthyer" as Statusi, data_kthimit_real: new Date().toISOString() })
        .eq("id", huazimiId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["huazimet"] });
      queryClient.invalidateQueries({ queryKey: ["librat-gjendje"] });
      toast.success("Libri u kthye me sukses");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Huazimet</h2>
          <p className="text-sm text-muted-foreground">Menaxhoni huazimet e librave</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Regjistro Huazim</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Regjistro Huazim të Ri</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Libri *</Label>
                <Select value={form.liber_id} onValueChange={(v) => setForm({ ...form, liber_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Zgjidhni librin" /></SelectTrigger>
                  <SelectContent>{libratGjendje?.map((l) => <SelectItem key={l.id} value={l.id}>{l.titulli} ({l.sasia} kopje)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nxënësi *</Label>
                <Select value={form.nxenes_id} onValueChange={(v) => setForm({ ...form, nxenes_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Zgjidhni nxënësin" /></SelectTrigger>
                  <SelectContent>{nxenesit?.map((n) => <SelectItem key={n.id} value={n.id}>{n.emri} {n.mbiemri}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.liber_id || !form.nxenes_id}>
                {createMutation.isPending ? "Duke regjistruar..." : "Regjistro Huazimin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {[{ value: "te-gjitha", label: "Të gjitha" }, { value: "aktiv", label: "Aktive" }, { value: "kthyer", label: "Kthyer" }, { value: "vonuar", label: "Vonuara" }].map((f) => (
          <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg shadow-smooth bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Libri</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nxënësi</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Marrjes</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Afati</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statusi</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {huazimet?.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-medium">{h.librat?.titulli}</td>
                  <td className="px-5 py-3 text-muted-foreground">{h.nxenesit?.emri} {h.nxenesit?.mbiemri}</td>
                  <td className="px-5 py-3 tabular-nums">{format(new Date(h.data_marrjes), "dd MMM yyyy")}</td>
                  <td className="px-5 py-3 tabular-nums">{format(new Date(h.data_kthimit_parashikuar), "dd MMM yyyy")}</td>
                  <td className="px-5 py-3"><StatusBadge status={h.statusi} /></td>
                  <td className="px-5 py-3 text-right">
                    {h.statusi === "aktiv" && (
                      <Button variant="outline" size="sm" onClick={() => returnMutation.mutate(h.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Kthe
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {(!huazimet || huazimet.length === 0) && !isLoading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Nuk ka huazime</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Huazimet;
