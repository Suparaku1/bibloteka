import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error("Email ose fjalëkalimi gabim.");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-primary-foreground/30" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-primary-foreground/20" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-accent/20" />
        </div>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-accent mx-auto mb-8">
            <BookOpen className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="font-display text-4xl text-primary-foreground mb-4">Biblioteka</h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Sistemi i Menaxhimit të Bibliotekës
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-sm">
            <Shield className="w-4 h-4" />
            Akses i kufizuar — vetëm administratori
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl text-foreground">Biblioteka</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-foreground">Mirësevini</h2>
            <p className="text-muted-foreground mt-1">Hyni për të menaxhuar bibliotekën</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl shadow-elevated bg-card">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@shembull.com" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Fjalëkalimi</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Duke u përpunuar...</> : "Hyr në Sistem"}
            </Button>
          </form>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">Shkolla Profesionale Elbasan</p>
            <p className="text-xs text-muted-foreground mt-1">Krijuar nga Esmerald Suparaku</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
