import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

const EmptyState = ({ icon: Icon = Inbox, title, description, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
  </div>
);

export default EmptyState;
