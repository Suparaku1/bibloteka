import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

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

  const { data: huazimetFundit } = useQuery({
    queryKey: ["huazimet-fundit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("huazimet")
        .select("*, librat(titulli), nxenesit(emri, mbiemri)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Paneli Kryesor</h2>
        <p className="text-sm text-muted-foreground">Përmbledhje e gjendjes së bibliotekës</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Libra Totale" value={libratCount ?? 0} icon={BookOpen} variant="primary" />
        <StatCard title="Huazime Aktive" value={huazimeAktive ?? 0} icon={ArrowLeftRight} variant="warning" />
        <StatCard title="Nxënës Total" value={nxenesitCount ?? 0} icon={Users} variant="success" />
        <StatCard title="Huazime të Vonuara" value={huazimeVonuara ?? 0} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="rounded-lg shadow-smooth bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Huazimet e Fundit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Libri</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nxënësi</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statusi</th>
              </tr>
            </thead>
            <tbody>
              {huazimetFundit?.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-150">
                  <td className="px-5 py-3 font-medium">{h.librat?.titulli}</td>
                  <td className="px-5 py-3 text-muted-foreground">{h.nxenesit?.emri} {h.nxenesit?.mbiemri}</td>
                  <td className="px-5 py-3 text-muted-foreground tabular-nums">{format(new Date(h.data_marrjes), "dd MMM yyyy")}</td>
                  <td className="px-5 py-3"><StatusBadge status={h.statusi} /></td>
                </tr>
              ))}
              {(!huazimetFundit || huazimetFundit.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Nuk ka huazime ende</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
