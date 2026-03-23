import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Faqja nuk u gjet</p>
        <Button asChild>
          <Link to="/">Kthehu në Panelin Kryesor</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
