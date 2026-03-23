import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 300, height: 100 }, aspectRatio: 3 },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText);
        });
      },
      () => {}
    ).catch((err) => {
      setError("Nuk mund të hapet kamera. Sigurohuni që keni dhënë leje.");
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-4 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Skanoni Barkodin (ISBN)</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive text-center py-8">{error}</p>
        ) : (
          <div id="barcode-reader" className="rounded-lg overflow-hidden" />
        )}
        <p className="text-xs text-muted-foreground text-center">
          Vendoseni barkodin EAN-13 brenda kornizës
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
