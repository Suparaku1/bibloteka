import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-card text-card-foreground",
  primary: "bg-card text-card-foreground",
  success: "bg-card text-card-foreground",
  warning: "bg-card text-card-foreground",
  destructive: "bg-card text-card-foreground",
};

const iconVariantStyles = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

const StatCard = ({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) => {
  return (
    <div className={`rounded-lg p-5 shadow-smooth ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`flex items-center justify-center w-8 h-8 rounded-md ${iconVariantStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
};

export default StatCard;
