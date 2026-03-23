import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, Users, ArrowLeftRight, LayoutDashboard, Tags, PenTool, LogOut, ShieldCheck, X, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Paneli Kryesor" },
  { to: "/librat", icon: BookOpen, label: "Librat" },
  { to: "/nxenesit", icon: Users, label: "Nxënësit" },
  { to: "/huazimet", icon: ArrowLeftRight, label: "Huazimet" },
  { to: "/kategorite", icon: Tags, label: "Kategoritë" },
  { to: "/autoret", icon: PenTool, label: "Autorët" },
  { to: "/raportet", icon: BarChart3, label: "Raportet" },
  { to: "/adminat", icon: ShieldCheck, label: "Administratorët" },
];

interface AppSidebarProps {
  onClose?: () => void;
}

const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
              <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-base text-sidebar-accent-foreground tracking-tight">Biblioteka</h1>
              <p className="text-[11px] text-sidebar-muted">Shkolla Profesionale Elbasan</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent transition-colors">
              <X className="w-5 h-5 text-sidebar-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">Menuja</p>
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-[11px] font-semibold text-sidebar-accent-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-sidebar-muted truncate flex-1">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Dilni
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
