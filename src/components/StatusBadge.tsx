import { cn } from "@/lib/utils";

type StatusType = "aktiv" | "kthyer" | "vonuar" | "gjendje" | "huazuar";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  aktiv: { label: "Aktiv", className: "bg-warning/10 text-warning" },
  kthyer: { label: "Kthyer", className: "bg-success/10 text-success" },
  vonuar: { label: "Vonuar", className: "bg-destructive/10 text-destructive" },
  gjendje: { label: "I disponueshëm", className: "bg-success/10 text-success" },
  huazuar: { label: "I huazuar", className: "bg-warning/10 text-warning" },
};

const StatusBadge = ({ status }: { status: StatusType }) => {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
