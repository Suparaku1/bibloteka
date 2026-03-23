import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, BookOpen, ClipboardCheck, BookMarked, ScanBarcode, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import BarcodeScanner from "@/components/BarcodeScanner";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import { toast } from "sonner";

type ViewMode = "lista" | "cinventarizuar";

const Librat = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchLetter, setSearchLetter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [openRegister, setOpenRegister] = useState(false);
  const [openInventory, setOpenInventory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulli: "", autori_emer_mbiemer: "", cmimi: "", sasia: "1",
    data_regjistrimit: "", data_inventarizimit: "", zhaneri: "",
  });
  const [isbnInput, setIsbnInput] = useState("");
  const [invForm, setInvForm] = useState({ liber_id: "", data_inventarizimit: "" });

  const { data: librat, isLoading } = useQuery({
    queryKey: ["librat", search, searchLetter, viewMode],
    queryFn: async () => {
      let query = supabase.from("librat").select("*").order("data_regjistrimit", { ascending: false });
      if (search) query = query.or(`titulli.ilike.%${search}%,autori_emer_mbiemer.ilike.%${search}%,zhaneri.ilike.%${search}%`);
      if (searchLetter) query = query.ilike("autori_emer_mbiemer", `${searchLetter}%`);
      if (viewMode === "cinventarizuar") query = query.not("data_inventarizimit", "is", null);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: libratPerInventar } = useQuery({
    queryKey: ["librat-per-inventar"],
    queryFn: async () => {
      const { data } = await supabase.from("librat").select("id, titulli, autori_emer_mbiemer").order("titulli");
      return data ?? [];
    },
  });

  const lookupISBN = async (isbn: string) => {
    setIsbnLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("isbn-lookup", { body: { isbn } });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      setForm((prev) => ({
        ...prev,
        titulli: data.titulli || prev.titulli,
        autori_emer_mbiemer: data.autori || prev.autori_emer_mbiemer,
        zhaneri: data.zhaneri || prev.zhaneri,
      }));
      toast.success(`Libri u gjet: ${data.titulli}`);
    } catch {
      toast.error("Gabim gjatë kërkimit të ISBN");
    } finally {
      setIsbnLoading(false);
    }
  };

  const handleBarcodeScan = (code: string) => {
    setShowScanner(false);
    setIsbnInput(code);
    setOpenRegister(true);
    lookupISBN(code);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        titulli: form.titulli,
        autori_emer_mbiemer: form.autori_emer_mbiemer,
        cmimi: form.cmimi ? Number(form.cmimi) : null,
        sasia: Number(form.sasia),
        data_regjistrimit: form.data_regjistrimit || new Date().toISOString(),
        data_inventarizimit: form.data_inventarizimit || null,
        zhaneri: form.zhaneri || null,
      };
      if (editId) {
        const { error } = await supabase.from("librat").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("librat").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["librat"] });
      toast.success(editId ? "Libri u përditësua" : "Libri u regjistrua me sukses");
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inventoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("librat")
        .update({ data_inventarizimit: invForm.data_inventarizimit || new Date().toISOString() })
        .eq("id", invForm.liber_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["librat"] });
      queryClient.invalidateQueries({ queryKey: ["librat-per-inventar"] });
      toast.success("Libri u cinventarizua me sukses");
      setInvForm({ liber_id: "", data_inventarizimit: "" });
      setOpenInventory(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("librat").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["librat"] });
      toast.success("Libri u fshi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ titulli: "", autori_emer_mbiemer: "", cmimi: "", sasia: "1", data_regjistrimit: "", data_inventarizimit: "", zhaneri: "" });
    setIsbnInput("");
    setEditId(null);
    setOpenRegister(false);
  };

  const startEdit = (lib: any) => {
    setForm({
      titulli: lib.titulli,
      autori_emer_mbiemer: lib.autori_emer_mbiemer,
      cmimi: lib.cmimi?.toString() || "",
      sasia: lib.sasia?.toString() || "1",
      data_regjistrimit: lib.data_regjistrimit ? lib.data_regjistrimit.slice(0, 16) : "",
      data_inventarizimit: lib.data_inventarizimit ? lib.data_inventarizimit.slice(0, 16) : "",
      zhaneri: lib.zhaneri || "",
    });
    setEditId(lib.id);
    setOpenRegister(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Librat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Program për Rregjistrimin e Librave në Bibliotekën e Shkollës
          {librat && <span className="ml-2 font-semibold text-foreground">({librat.length} gjithsej)</span>}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button onClick={() => { resetForm(); setOpenRegister(true); }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Rregjistro Libër
        </Button>
        <Button variant="outline" onClick={() => setShowScanner(true)}>
          <ScanBarcode className="w-4 h-4 mr-2" />Skano Barkodin
        </Button>
        <Button variant="outline" onClick={() => setOpenInventory(true)}>
          <ClipboardCheck className="w-4 h-4 mr-2" />Cinventarizimi
        </Button>
        <Button variant="outline" onClick={() => {
          if (!librat || librat.length === 0) return;
          const header = "Titulli,Autori,Çmimi (Lekë),Sasia,Data Regjistrimit,Data Inventarizimit,Zhaneri";
          const rows = librat.map((l: any) => [
            `"${(l.titulli || "").replace(/"/g, '""')}"`,
            `"${(l.autori_emer_mbiemer || "").replace(/"/g, '""')}"`,
            l.cmimi || "",
            l.sasia || "",
            l.data_regjistrimit ? new Date(l.data_regjistrimit).toLocaleDateString("sq-AL") : "",
            l.data_inventarizimit ? new Date(l.data_inventarizimit).toLocaleDateString("sq-AL") : "",
            `"${(l.zhaneri || "").replace(/"/g, '""')}"`
          ].join(","));
          const csv = [header, ...rows].join("\n");
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "librat.csv"; a.click();
          URL.revokeObjectURL(url);
          toast.success("Lista u eksportua me sukses");
        }}>
          <BookOpen className="w-4 h-4 mr-2" />Eksporto CSV
        </Button>
      </div>

      {/* Search panel */}
      <div className="rounded-xl shadow-smooth bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold">Kërkimi për librat sipas autorit ose lista totale</h3>
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Shkronja e parë e mbiemrit të autorit:</Label>
            <div className="flex gap-2">
              <Input className="w-28 sm:w-32" value={searchLetter} onChange={(e) => setSearchLetter(e.target.value)} placeholder="p.sh. F" maxLength={5} />
              <Button size="sm" onClick={() => setViewMode("lista")}>OK</Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearchLetter(""); setViewMode("lista"); }}>
            <BookOpen className="w-4 h-4 mr-2" />Lista e plotë
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSearchLetter(""); setViewMode("cinventarizuar"); }}>
            <BookMarked className="w-4 h-4 mr-2" />Të cinventarizuarat
          </Button>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Kërko libra..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={8} rows={6} />
      ) : !librat || librat.length === 0 ? (
        <div className="rounded-xl shadow-smooth bg-card">
          <EmptyState icon={BookOpen} title="Nuk ka libra ende" description="Shtoni librin e parë duke klikuar butonin 'Rregjistro Libër'" />
        </div>
      ) : (
        <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Titulli</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Autori</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Çmimi</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Sasia</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Dt. Regjistrimit</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Dt. Inventarizimit</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Zhaneri</th>
                  <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {librat.map((lib: any) => (
                  <tr key={lib.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 sm:px-5 py-3 font-medium">
                      <div>{lib.titulli}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{lib.autori_emer_mbiemer}</div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">{lib.autori_emer_mbiemer}</td>
                    <td className="px-4 sm:px-5 py-3 tabular-nums hidden md:table-cell">{lib.cmimi ? `${Number(lib.cmimi).toLocaleString("sq-AL")} L` : "—"}</td>
                    <td className="px-4 sm:px-5 py-3 tabular-nums hidden lg:table-cell">{lib.sasia}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground tabular-nums hidden lg:table-cell">{new Date(lib.data_regjistrimit).toLocaleDateString("sq-AL")}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground tabular-nums hidden xl:table-cell">{lib.data_inventarizimit ? new Date(lib.data_inventarizimit).toLocaleDateString("sq-AL") : "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground hidden md:table-cell">{lib.zhaneri || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(lib)}><Pencil className="w-4 h-4" /></Button>
                        <ConfirmDialog
                          onConfirm={() => deleteMutation.mutate(lib.id)}
                          title="Fshi Librin?"
                          description={`Jeni i sigurt që dëshironi të fshini "${lib.titulli}"? Ky veprim nuk mund të zhbëhet.`}
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

      {/* Barcode Scanner */}
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}

      {/* Dialog: Register book */}
      <Dialog open={openRegister} onOpenChange={(v) => { if (!v) resetForm(); setOpenRegister(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg">{editId ? "Përditëso Librin" : "Rregjistrimi i një Libri"}</DialogTitle></DialogHeader>
          
          {!editId && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <Label className="text-xs font-semibold">Kërkim automatik me ISBN (opsionale)</Label>
              <div className="flex gap-2">
                <Input placeholder="p.sh. 9780141187761" value={isbnInput} onChange={(e) => setIsbnInput(e.target.value)} className="flex-1" />
                <Button type="button" size="sm" onClick={() => lookupISBN(isbnInput)} disabled={isbnLoading || !isbnInput}>
                  {isbnLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kërko"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowScanner(true)}>
                  <ScanBarcode className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Titulli *</Label>
              <Input value={form.titulli} onChange={(e) => setForm({ ...form, titulli: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Emër Mbiemër Autori *</Label>
              <Input value={form.autori_emer_mbiemer} onChange={(e) => setForm({ ...form, autori_emer_mbiemer: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Çmimi</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" step="1" value={form.cmimi} onChange={(e) => setForm({ ...form, cmimi: e.target.value })} className="flex-1" />
                  <span className="text-xs font-semibold text-muted-foreground">Lekë</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nr. Kopje *</Label>
                <Input type="number" min="1" value={form.sasia} onChange={(e) => setForm({ ...form, sasia: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data e Rregjistrimit</Label>
                <Input type="date" value={form.data_regjistrimit ? form.data_regjistrimit.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, data_regjistrimit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Zhaneri</Label>
                <Input value={form.zhaneri} onChange={(e) => setForm({ ...form, zhaneri: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>Anulo</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90">
                {saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Rregjistro"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Inventory */}
      <Dialog open={openInventory} onOpenChange={setOpenInventory}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cinventarizimi i një Libri</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); inventoryMutation.mutate(); }} className="space-y-6">
            <div className="space-y-2">
              <Label>Titulli i librit:</Label>
              <Select value={invForm.liber_id} onValueChange={(v) => setInvForm({ ...invForm, liber_id: v })}>
                <SelectTrigger><SelectValue placeholder="Zgjidhni librin" /></SelectTrigger>
                <SelectContent>
                  {libratPerInventar?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.titulli} — {l.autori_emer_mbiemer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data e Cinventarizimit:</Label>
              <Input type="date" value={invForm.data_inventarizimit} onChange={(e) => setInvForm({ ...invForm, data_inventarizimit: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenInventory(false)}>Anulo</Button>
              <Button type="submit" disabled={inventoryMutation.isPending || !invForm.liber_id}>
                {inventoryMutation.isPending ? "Duke ruajtur..." : "Cinventarizo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Librat;
