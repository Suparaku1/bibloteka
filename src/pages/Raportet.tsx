import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileDown, Filter, BookOpen, TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import { format } from "date-fns";

const COLORS = ["hsl(220,60%,25%)", "hsl(43,96%,56%)", "hsl(152,69%,31%)", "hsl(0,72%,51%)", "hsl(220,14%,60%)", "hsl(280,60%,50%)", "hsl(180,60%,40%)", "hsl(30,80%,50%)"];

const Raportet = () => {
  const [periudha, setPeriudha] = useState<string>("te-gjitha");
  const [viti, setViti] = useState<string>("");
  const [muaji, setMuaji] = useState<string>("");
  const [autori, setAutori] = useState<string>("");
  const [cmimiMin, setCmimiMin] = useState<string>("");
  const [cmimiMax, setCmimiMax] = useState<string>("");
  const [zhaneri, setZhaneri] = useState<string>("");
  const [tab, setTab] = useState<"libra" | "huazime">("libra");

  const { data: librat, isLoading: loadingLibra } = useQuery({
    queryKey: ["raportet-librat"],
    queryFn: async () => {
      const { data } = await supabase.from("librat").select("*").order("data_regjistrimit", { ascending: false });
      return data ?? [];
    },
  });

  const { data: huazimet, isLoading: loadingHuazime } = useQuery({
    queryKey: ["raportet-huazimet"],
    queryFn: async () => {
      const { data } = await supabase.from("huazimet").select("*, librat(titulli, autori_emer_mbiemer), nxenesit(emri, mbiemri)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Unique values for filters
  const autoretUnike = useMemo(() => {
    if (!librat) return [];
    return [...new Set(librat.map((l: any) => l.autori_emer_mbiemer))].sort();
  }, [librat]);

  const zhaneret = useMemo(() => {
    if (!librat) return [];
    return [...new Set(librat.map((l: any) => l.zhaneri).filter(Boolean))].sort();
  }, [librat]);

  const vitet = useMemo(() => {
    if (!librat) return [];
    return [...new Set(librat.map((l: any) => new Date(l.data_regjistrimit).getFullYear()))].sort((a, b) => b - a);
  }, [librat]);

  // Filtered data
  const libratFiltruara = useMemo(() => {
    if (!librat) return [];
    return librat.filter((l: any) => {
      const dt = new Date(l.data_regjistrimit);
      if (viti && viti !== "all" && dt.getFullYear().toString() !== viti) return false;
      if (muaji && muaji !== "all" && (dt.getMonth() + 1).toString() !== muaji) return false;
      if (autori && autori !== "all" && l.autori_emer_mbiemer !== autori) return false;
      if (cmimiMin && Number(l.cmimi || 0) < Number(cmimiMin)) return false;
      if (cmimiMax && Number(l.cmimi || 0) > Number(cmimiMax)) return false;
      if (zhaneri && zhaneri !== "all" && l.zhaneri !== zhaneri) return false;
      return true;
    });
  }, [librat, viti, muaji, autori, cmimiMin, cmimiMax, zhaneri]);

  // Chart: Most borrowed books
  const topHuazime = useMemo(() => {
    if (!huazimet) return [];
    const counts: Record<string, { name: string; count: number }> = {};
    huazimet.forEach((h: any) => {
      const title = h.librat?.titulli || "Pa titull";
      if (!counts[title]) counts[title] = { name: title.length > 25 ? title.slice(0, 25) + "…" : title, count: 0 };
      counts[title].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [huazimet]);

  // Chart: Books by year
  const libratSipasVitit = useMemo(() => {
    if (!libratFiltruara) return [];
    const counts: Record<string, number> = {};
    libratFiltruara.forEach((l: any) => {
      const y = new Date(l.data_regjistrimit).getFullYear().toString();
      counts[y] = (counts[y] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => Number(a) - Number(b)).map(([vit, count]) => ({ vit, count }));
  }, [libratFiltruara]);

  // Chart: by genre
  const libratSipasZhanerit = useMemo(() => {
    if (!libratFiltruara) return [];
    const counts: Record<string, number> = {};
    libratFiltruara.forEach((l: any) => {
      const z = l.zhaneri || "Pa zhaneri";
      counts[z] = (counts[z] || 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, value }));
  }, [libratFiltruara]);

  // Stats
  const stats = useMemo(() => {
    const total = libratFiltruara.length;
    const totalKopje = libratFiltruara.reduce((s, l: any) => s + (l.sasia || 0), 0);
    const totalVlera = libratFiltruara.reduce((s, l: any) => s + (Number(l.cmimi || 0) * (l.sasia || 1)), 0);
    const avgCmimi = total > 0 ? totalVlera / totalKopje : 0;
    return { total, totalKopje, totalVlera, avgCmimi };
  }, [libratFiltruara]);

  const exportCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    const header = columns.map(c => c.label).join(",");
    const rows = data.map(r => columns.map(c => {
      let val = c.key.includes(".") ? c.key.split(".").reduce((o: any, k) => o?.[k], r) : r[c.key];
      if (val === null || val === undefined) val = "";
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) val = `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLibrat = () => {
    exportCSV(libratFiltruara, `librat_raport_${format(new Date(), "yyyy-MM-dd")}.csv`, [
      { key: "titulli", label: "Titulli" },
      { key: "autori_emer_mbiemer", label: "Autori" },
      { key: "cmimi", label: "Çmimi (Lekë)" },
      { key: "sasia", label: "Sasia" },
      { key: "data_regjistrimit", label: "Data Regjistrimit" },
      { key: "data_inventarizimit", label: "Data Inventarizimit" },
      { key: "zhaneri", label: "Zhaneri" },
    ]);
  };

  const exportHuazimet = () => {
    if (!huazimet) return;
    exportCSV(huazimet, `huazimet_raport_${format(new Date(), "yyyy-MM-dd")}.csv`, [
      { key: "librat.titulli", label: "Libri" },
      { key: "nxenesit.emri", label: "Emri Nxënësit" },
      { key: "nxenesit.mbiemri", label: "Mbiemri Nxënësit" },
      { key: "data_marrjes", label: "Data Marrjes" },
      { key: "data_kthimit_parashikuar", label: "Afati Kthimit" },
      { key: "data_kthimit_real", label: "Data Kthimit Real" },
      { key: "statusi", label: "Statusi" },
    ]);
  };

  const resetFilters = () => {
    setViti(""); setMuaji(""); setAutori(""); setCmimiMin(""); setCmimiMax(""); setZhaneri("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Raportet</h2>
          <p className="text-sm text-muted-foreground mt-1">Analiza dhe statistika të bibliotekës</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLibrat}>
            <FileDown className="w-4 h-4 mr-2" />Eksporto Librat (CSV)
          </Button>
          <Button variant="outline" onClick={exportHuazimet}>
            <FileDown className="w-4 h-4 mr-2" />Eksporto Huazimet (CSV)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl shadow-smooth bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Filtrat</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto text-xs">Pastro Filtrat</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Viti</Label>
            <Select value={viti} onValueChange={setViti}>
              <SelectTrigger><SelectValue placeholder="Të gjitha" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha</SelectItem>
                {vitet.map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Muaji</Label>
            <Select value={muaji} onValueChange={setMuaji}>
              <SelectTrigger><SelectValue placeholder="Të gjithë" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjithë</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i).toLocaleDateString("sq-AL", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Autori</Label>
            <Select value={autori} onValueChange={setAutori}>
              <SelectTrigger><SelectValue placeholder="Të gjithë" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjithë</SelectItem>
                {autoretUnike.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Çmimi Min (Lekë)</Label>
            <Input type="number" min="0" value={cmimiMin} onChange={e => setCmimiMin(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Çmimi Max (Lekë)</Label>
            <Input type="number" min="0" value={cmimiMax} onChange={e => setCmimiMax(e.target.value)} placeholder="∞" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Zhaneri</Label>
            <Select value={zhaneri} onValueChange={setZhaneri}>
              <SelectTrigger><SelectValue placeholder="Të gjithë" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjithë</SelectItem>
                {zhaneret.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-card shadow-smooth p-4 border-l-4 border-primary">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tituj të Filtruar</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-card shadow-smooth p-4 border-l-4 border-accent">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Kopje Gjithsej</p>
          <p className="text-2xl font-bold mt-1">{stats.totalKopje.toLocaleString("sq-AL")}</p>
        </div>
        <div className="rounded-xl bg-card shadow-smooth p-4 border-l-4 border-green-500">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Vlera Totale</p>
          <p className="text-2xl font-bold mt-1">{stats.totalVlera.toLocaleString("sq-AL")} L</p>
        </div>
        <div className="rounded-xl bg-card shadow-smooth p-4 border-l-4 border-orange-400">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Çmimi Mesatar</p>
          <p className="text-2xl font-bold mt-1">{stats.avgCmimi.toFixed(0)} L</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most borrowed */}
        <div className="rounded-xl shadow-smooth bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Librat Më të Huazuar</h3>
          </div>
          {topHuazime.length === 0 ? (
            <EmptyState title="Nuk ka huazime ende" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topHuazime} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,89%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "12px" }} />
                <Bar dataKey="count" name="Huazime" fill="hsl(220,60%,25%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By year */}
        <div className="rounded-xl shadow-smooth bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Librat sipas Vitit të Regjistrimit</h3>
          </div>
          {libratSipasVitit.length === 0 ? (
            <EmptyState title="Nuk ka të dhëna" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={libratSipasVitit} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,89%)" />
                <XAxis dataKey="vit" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "12px" }} />
                <Bar dataKey="count" name="Libra" fill="hsl(43,96%,56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By genre pie */}
        <div className="rounded-xl shadow-smooth bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Shpërndarja sipas Zhanerit</h3>
          </div>
          {libratSipasZhanerit.length === 0 ? (
            <EmptyState title="Nuk ka zhanere" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={libratSipasZhanerit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 1 }} style={{ fontSize: 11 }}>
                  {libratSipasZhanerit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filtered table */}
      <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">Rezultatet e Filtruara ({libratFiltruara.length} libra)</h3>
        </div>
        {loadingLibra ? (
          <TableSkeleton columns={7} rows={5} />
        ) : libratFiltruara.length === 0 ? (
          <EmptyState icon={BookOpen} title="Nuk ka rezultate" description="Ndryshoni filtrat për të parë librat" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Titulli</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Autori</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Çmimi</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Sasia</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Dt. Regj.</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Zhaneri</th>
                </tr>
              </thead>
              <tbody>
                {libratFiltruara.slice(0, 100).map((l: any) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{l.titulli}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.autori_emer_mbiemer}</td>
                    <td className="px-4 py-3 tabular-nums hidden md:table-cell">{l.cmimi ? `${Number(l.cmimi).toLocaleString("sq-AL")} L` : "—"}</td>
                    <td className="px-4 py-3 tabular-nums hidden md:table-cell">{l.sasia}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground hidden lg:table-cell">{format(new Date(l.data_regjistrimit), "dd.MM.yyyy")}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{l.zhaneri || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {libratFiltruara.length > 100 && (
              <div className="px-5 py-3 text-xs text-muted-foreground text-center border-t border-border">
                Duke shfaqur 100 nga {libratFiltruara.length} libra. Eksportoni CSV për listën e plotë.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Raportet;
