import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";

const Adminat = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ emri: "", mbiemri: "", email: "", password: "" });

  const { data: adminList, isLoading } = useQuery({
    queryKey: ["admin-details"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { action: "list" },
      });
      if (error) return [];
      return data?.admins || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { action: "create", email: form.email, password: form.password, emri: form.emri, mbiemri: form.mbiemri },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-details"] });
      toast.success("Admini u krijua me sukses");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-details"] });
      toast.success("Admini u fshi me sukses");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ emri: "", mbiemri: "", email: "", password: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Administratorët</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Menaxhoni administratorët e sistemit
            {adminList && <span className="ml-2 font-semibold text-foreground">({adminList.length} gjithsej)</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Shto Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Shto Administrator të Ri</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Emri *</Label><Input value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Mbiemri *</Label><Input value={form.mbiemri} onChange={(e) => setForm({ ...form, mbiemri: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Fjalëkalimi *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Anulo</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Duke krijuar..." : "Krijo Admin"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={3} />
      ) : !adminList || adminList.length === 0 ? (
        <div className="rounded-xl shadow-smooth bg-card">
          <EmptyState icon={ShieldCheck} title="Nuk ka administratorë" />
        </div>
      ) : (
        <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Emri</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Mbiemri</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Roli</th>
                  <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin: any) => (
                  <tr key={admin.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 sm:px-5 py-3 font-medium">{admin.emri || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 hidden sm:table-cell">{admin.mbiemri || "—"}</td>
                    <td className="px-4 sm:px-5 py-3 text-muted-foreground">{admin.email}</td>
                    <td className="px-4 sm:px-5 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      {admin.user_id !== user?.id ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Fshi Administratorin?</AlertDialogTitle>
                              <AlertDialogDescription>Ky veprim do të fshijë përgjithmonë llogarinë e {admin.email}. Nuk mund të zhbëhet.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulo</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(admin.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Fshi</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Ti</span>
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

export default Adminat;
