import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, TrendingUp, Clock, GraduationCap } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { format } from "date-fns";

const Dashboard = () => {
  const { data: libratCount } = useQuery({
    queryKey: ["librat-count"],
    queryFn: async () => {
      const { count } = await supabase.from("librat").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: huazimeAktive } = useQuery({
    queryKey: ["huazime-aktive"],
    queryFn: async () => {
      const { count } = await supabase.from("huazimet").select("*", { count: "exact", head: true }).eq("statusi", "aktiv");
      return count ?? 0;
    },
  });

  const { data: huazimeVonuara } = useQuery({
    queryKey: ["huazime-vonuara"],
    queryFn: async () => {
      const { count } = await supabase.from("huazimet").select("*", { count: "exact", head: true }).eq("statusi", "vonuar");
      return count ?? 0;
    },
  });

  const { data: nxenesitCount } = useQuery({
    queryKey: ["nxenesit-count"],
    queryFn: async () => {
      const { count } = await supabase.from("nxenesit").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: libratVlera } = useQuery({
    queryKey: ["librat-vlera"],
    queryFn: async () => {
      const { data } = await supabase.from("librat").select("cmimi, sasia");
      if (!data) return 0;
      return data.reduce((sum, l) => sum + (Number(l.cmimi || 0) * l.sasia), 0);
    },
  });

  const { data: huazimetVonuara } = useQuery({
    queryKey: ["huazimet-vonuara-lista"],
    queryFn: async () => {
      const { data } = await supabase
        .from("huazimet")
        .select("*, librat(titulli), nxenesit(emri, mbiemri)")
        .eq("statusi", "vonuar")
        .order("data_kthimit_parashikuar", { ascending: true })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: huazimetFundit } = useQuery({
    queryKey: ["huazimet-fundit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("huazimet")
        .select("*, librat(titulli), nxenesit(emri, mbiemri)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Paneli Kryesor</h2>
        <p className="text-sm text-muted-foreground mt-1">Përmbledhje e gjendjes së bibliotekës në kohë reale</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Gjithsej Libra" value={libratCount ?? 0} icon={BookOpen} variant="primary" />
        <StatCard title="Nxënës" value={nxenesitCount ?? 0} icon={GraduationCap} variant="default" />
        <StatCard title="Në Huazim" value={huazimeAktive ?? 0} icon={ArrowLeftRight} variant="warning" />
        <StatCard title="Vonuara" value={huazimeVonuara ?? 0} icon={AlertTriangle} variant="destructive" description={huazimeVonuara && huazimeVonuara > 0 ? "Kërkon vëmendje!" : undefined} />
        <StatCard title="Vlera Totale" value={`${(libratVlera ?? 0).toLocaleString("sq-AL")} L`} icon={TrendingUp} variant="success" />
      </div>

      {/* Alert bar for overdue */}
      {huazimetVonuara && huazimetVonuara.length > 0 && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-sm font-bold text-destructive">Libra të Vonuara — Kërkon Veprim ({huazimetVonuara.length})</h3>
          </div>
          <div className="space-y-2">
            {huazimetVonuara.map((h: any) => (
              <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-card rounded-lg px-4 py-2.5 shadow-smooth gap-1">
                <div>
                  <span className="font-semibold">{h.librat?.titulli}</span>
                  <span className="text-muted-foreground ml-2">— {h.nxenesit?.emri} {h.nxenesit?.mbiemri}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <Clock className="w-3.5 h-3.5" />
                  Afati: {format(new Date(h.data_kthimit_parashikuar), "dd.MM.yyyy")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent loans */}
      <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">Shtimet e Fundit</h3>
          <span className="text-[11px] text-muted-foreground">{huazimetFundit?.length || 0} huazimet e fundit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Libri</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Nxënësi</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Data</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statusi</th>
              </tr>
            </thead>
            <tbody>
              {huazimetFundit?.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{h.librat?.titulli}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{h.nxenesit?.emri} {h.nxenesit?.mbiemri}</td>
                  <td className="px-5 py-3 text-muted-foreground tabular-nums hidden md:table-cell">{format(new Date(h.data_marrjes), "dd.MM.yyyy")}</td>
                  <td className="px-5 py-3"><StatusBadge status={h.statusi} /></td>
                </tr>
              ))}
              {(!huazimetFundit || huazimetFundit.length === 0) && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title="Nuk ka huazime ende" description="Regjistroni huazimin e parë nga faqja Huazimet" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
