import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success("Kontrolloni email-in tuaj për të konfirmuar llogarinë.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Sistemi i Bibliotekës</h1>
          <p className="text-sm text-muted-foreground mt-1">Shkolla Profesionale Elbasan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-lg shadow-smooth bg-card">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@shembull.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Fjalëkalimi</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Duke u përpunuar..." : isSignUp ? "Regjistrohu" : "Hyr"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Keni llogari?" : "Nuk keni llogari?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? "Hyni" : "Regjistrohuni"}
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Krijuar nga Esmerald Suparaku
        </p>
      </div>
    </div>
  );
};

export default Login;
