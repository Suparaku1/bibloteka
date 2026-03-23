import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  onConfirm: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const ConfirmDialog = ({
  onConfirm,
  title = "Jeni i sigurt?",
  description = "Ky veprim nuk mund të zhbëhet.",
  children,
}: ConfirmDialogProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {children || (
        <Button variant="ghost" size="icon">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      )}
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Anulo</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Fshi
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
