import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, BookOpen, ClipboardCheck, BookMarked } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";

type ViewMode = "lista" | "cinventarizuar";

const Librat = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchLetter, setSearchLetter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [openRegister, setOpenRegister] = useState(false);
  const [openInventory, setOpenInventory] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulli: "",
    autori_emer_mbiemer: "",
    cmimi: "",
    sasia: "1",
    data_regjistrimit: "",
    data_inventarizimit: "",
    zhaneri: "",
  });
  const [invForm, setInvForm] = useState({ liber_id: "", data_inventarizimit: "" });

  const { data: librat, isLoading } = useQuery({
    queryKey: ["librat", search, searchLetter, viewMode],
    queryFn: async () => {
      let query = supabase.from("librat").select("*").order("data_regjistrimit", { ascending: false });
      if (search) {
        query = query.or(`titulli.ilike.%${search}%,autori_emer_mbiemer.ilike.%${search}%,zhaneri.ilike.%${search}%`);
      }
      if (searchLetter) {
        query = query.ilike("autori_emer_mbiemer", `%${searchLetter}%`);
      }
      if (viewMode === "cinventarizuar") {
        query = query.not("data_inventarizimit", "is", null);
      }
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
    setForm({
      titulli: "",
      autori_emer_mbiemer: "",
      cmimi: "",
      sasia: "1",
      data_regjistrimit: "",
      data_inventarizimit: "",
      zhaneri: "",
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Librat</h2>
          <p className="text-sm text-muted-foreground">Program për Rregjistrimin e Librave në Bibliotekën e Shkollës</p>
        </div>
      </div>

      {/* Butonat kryesore si në Access */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => { resetForm(); setOpenRegister(true); }}>
          <Plus className="w-4 h-4 mr-2" />Rregjistimi i Librave
        </Button>
        <Button variant="outline" onClick={() => setOpenInventory(true)}>
          <ClipboardCheck className="w-4 h-4 mr-2" />Cinventarizimi i Librave
        </Button>
      </div>

      {/* Kërkimi sipas autorit */}
      <div className="rounded-lg shadow-smooth bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Kërkimi për librat sipas autorit ose lista totale e tyre</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Jepni germën e parë të mbiemrit të autorit të librit:</Label>
            <div className="flex gap-2">
              <Input
                className="w-40"
                value={searchLetter}
                onChange={(e) => setSearchLetter(e.target.value)}
                placeholder="p.sh. F"
                maxLength={5}
              />
              <Button size="sm" onClick={() => { setViewMode("lista"); }}>OK</Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearchLetter(""); setViewMode("lista"); }}>
            <BookOpen className="w-4 h-4 mr-2" />Lista e librave të bibliotekës
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSearchLetter(""); setViewMode("cinventarizuar"); }}>
            <BookMarked className="w-4 h-4 mr-2" />Lista e librave të cinventarizuar
          </Button>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Kërko libra..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Tabela e librave */}
      <div className="rounded-lg shadow-smooth bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Titulli</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Autori</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Çmimi</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sasia</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Dt. Regjistrimit</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Dt. Inventarizimit</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Zhaneri</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktive</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {librat?.map((lib: any) => (
                <tr key={lib.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-medium">{lib.titulli}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lib.autori_emer_mbiemer}</td>
                  <td className="px-5 py-3 tabular-nums">{lib.cmimi ? `${Number(lib.cmimi).toFixed(0)} Lekë` : "—"}</td>
                  <td className="px-5 py-3 tabular-nums">{lib.sasia}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(lib.data_regjistrimit).toLocaleDateString("sq-AL")}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lib.data_inventarizimit ? new Date(lib.data_inventarizimit).toLocaleDateString("sq-AL") : "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lib.zhaneri || "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={lib.sasia > 0 ? "gjendje" : "huazuar"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(lib)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(lib.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!librat || librat.length === 0) && !isLoading && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Nuk ka libra ende. Shtoni librin e parë.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog: Rregjistimi i një libri në Bibliotekë */}
      <Dialog open={openRegister} onOpenChange={(v) => { if (!v) resetForm(); setOpenRegister(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Përditëso Librin" : "Rregjistrimi i një libri në Bibliotekë"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Titulli: *</Label>
              <Input value={form.titulli} onChange={(e) => setForm({ ...form, titulli: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Emër Mbiemër Autori: *</Label>
              <Input value={form.autori_emer_mbiemer} onChange={(e) => setForm({ ...form, autori_emer_mbiemer: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Çmimi:</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" step="1" value={form.cmimi} onChange={(e) => setForm({ ...form, cmimi: e.target.value })} className="flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">Lekë</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nr. Kopje: *</Label>
                <Input type="number" min="1" value={form.sasia} onChange={(e) => setForm({ ...form, sasia: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data e Rregjistrimit: *</Label>
              <Input type="date" value={form.data_regjistrimit ? form.data_regjistrimit.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, data_regjistrimit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Zhaneri:</Label>
              <Input value={form.zhaneri} onChange={(e) => setForm({ ...form, zhaneri: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Duke ruajtur..." : editId ? "Përditëso" : "Rregjistro"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                {editId ? "Anulo" : "Anullo Rregjistrimin"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpenRegister(false)}>
                Mbyll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cinventarizimi i një libri */}
      <Dialog open={openInventory} onOpenChange={setOpenInventory}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cinventarizimi i një libri</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); inventoryMutation.mutate(); }} className="space-y-6">
            <div className="space-y-2">
              <Label>Titulli i librit që do cinventarizohet:</Label>
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
              <Label>Data e Crregjistrimit:</Label>
              <Input
                type="date"
                value={invForm.data_inventarizimit}
                onChange={(e) => setInvForm({ ...invForm, data_inventarizimit: e.target.value })}
              />
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button type="submit" disabled={inventoryMutation.isPending || !invForm.liber_id}>
                {inventoryMutation.isPending ? "Duke ruajtur..." : "OK"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpenInventory(false)}>
                Mbyll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Librat;
