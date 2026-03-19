import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, Users, ArrowLeftRight, LayoutDashboard, Tags, PenTool, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Paneli Kryesor" },
  { to: "/librat", icon: BookOpen, label: "Librat" },
  { to: "/nxenesit", icon: Users, label: "Nxënësit" },
  { to: "/huazimet", icon: ArrowLeftRight, label: "Huazimet" },
  { to: "/kategorite", icon: Tags, label: "Kategoritë" },
  { to: "/autoret", icon: PenTool, label: "Autorët" },
];

const AppSidebar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Biblioteka</h1>
            <p className="text-xs text-sidebar-muted">Shkolla Profesionale</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Dilni
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
