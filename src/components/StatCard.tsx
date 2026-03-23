import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const iconBgStyles = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-accent/15 text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

const valueBorderStyles = {
  default: "",
  primary: "border-l-4 border-l-primary",
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-accent",
  destructive: "border-l-4 border-l-destructive",
};

const StatCard = ({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn("rounded-xl p-5 shadow-smooth bg-card hover:shadow-elevated transition-shadow duration-300", valueBorderStyles[variant])}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", iconBgStyles[variant])}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </div>
  );
};

export default StatCard;
