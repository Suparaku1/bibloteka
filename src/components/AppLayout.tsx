import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kërko libra, nxënës, huazime..."
              className="pl-9 h-9 bg-secondary border-none text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Shkolla Profesionale Elbasan
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
