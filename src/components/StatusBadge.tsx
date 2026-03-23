import { cn } from "@/lib/utils";

type StatusType = "aktiv" | "kthyer" | "vonuar" | "gjendje" | "huazuar";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  aktiv: { label: "Aktiv", className: "bg-accent/15 text-accent-foreground border border-accent/30" },
  kthyer: { label: "Kthyer", className: "bg-success/10 text-success border border-success/30" },
  vonuar: { label: "Vonuar", className: "bg-destructive/10 text-destructive border border-destructive/30" },
  gjendje: { label: "I disponueshëm", className: "bg-success/10 text-success border border-success/30" },
  huazuar: { label: "I huazuar", className: "bg-accent/15 text-accent-foreground border border-accent/30" },
};

const StatusBadge = ({ status }: { status: StatusType }) => {
  const config = statusConfig[status] || statusConfig.aktiv;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold", config.className)}>
      {status === "vonuar" && <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5 animate-pulse" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
