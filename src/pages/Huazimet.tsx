import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Search, ArrowLeftRight } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Statusi = Database["public"]["Enums"]["statusi_huazimit"];

const Huazimet = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ liber_id: "", nxenes_id: "" });
  const [filter, setFilter] = useState<string>("te-gjitha");

  const { data: huazimet, isLoading } = useQuery({
    queryKey: ["huazimet", filter, search],
    queryFn: async () => {
      let query = supabase.from("huazimet").select("*, librat(titulli), nxenesit(emri, mbiemri)").order("created_at", { ascending: false });
      if (filter !== "te-gjitha") query = query.eq("statusi", filter as Statusi);
      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];
      if (!search) return data;
      const s = search.toLowerCase();
      return data.filter((h: any) =>
        h.librat?.titulli?.toLowerCase().includes(s) ||
        `${h.nxenesit?.emri} ${h.nxenesit?.mbiemri}`.toLowerCase().includes(s)
      );
    },
  });

  const { data: libratGjendje } = useQuery({
    queryKey: ["librat-gjendje"],
    queryFn: async () => {
      const { data } = await supabase.from("librat").select("id, titulli, sasia").gt("sasia", 0).order("titulli");
      return data ?? [];
    },
  });

  const { data: nxenesit } = useQuery({
    queryKey: ["nxenesit-list"],
    queryFn: async () => {
      const { data } = await supabase.from("nxenesit").select("id, emri, mbiemri").order("mbiemri");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Huazimet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Menaxhoni huazimet e librave
            {huazimet && <span className="ml-2 font-semibold text-foreground">({huazimet.length} gjithsej)</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Regjistro Huazim</Button>
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
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
                <Button type="submit" disabled={createMutation.isPending || !form.liber_id || !form.nxenes_id}>
                  {createMutation.isPending ? "Duke regjistruar..." : "Regjistro"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {[{ value: "te-gjitha", label: "Të gjitha" }, { value: "aktiv", label: "Aktive" }, { value: "kthyer", label: "Kthyer" }, { value: "vonuar", label: "Vonuara" }].map((f) => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Kërko huazime..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={6} />
      ) : !huazimet || huazimet.length === 0 ? (
        <div className="rounded-xl shadow-smooth bg-card">
          <EmptyState icon={ArrowLeftRight} title="Nuk ka huazime" description="Regjistroni huazimin e parë duke klikuar butonin 'Regjistro Huazim'" />
        </div>
      ) : (
        <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Libri</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Nxënësi</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Data Marrjes</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Afati</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statusi</th>
                  <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {huazimet.map((h: any) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 sm:px-5 py-3 font-medium">
                      <div>{h.librat?.titulli}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{h.nxenesit?.emri} {h.nxenesit?.mbiemri}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">{h.nxenesit?.emri} {h.nxenesit?.mbiemri}</td>
                    <td className="px-4 sm:px-5 py-3 tabular-nums hidden md:table-cell">{format(new Date(h.data_marrjes), "dd.MM.yyyy")}</td>
                    <td className="px-4 sm:px-5 py-3 tabular-nums hidden md:table-cell">{format(new Date(h.data_kthimit_parashikuar), "dd.MM.yyyy")}</td>
                    <td className="px-4 sm:px-5 py-3"><StatusBadge status={h.statusi} /></td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      {(h.statusi === "aktiv" || h.statusi === "vonuar") && (
                        <Button variant="outline" size="sm" onClick={() => returnMutation.mutate(h.id)} disabled={returnMutation.isPending}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Kthe
                        </Button>
                      )}
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

export default Huazimet;
