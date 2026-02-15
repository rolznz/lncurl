import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WalletQRProps {
  uri: string;
}

export function WalletQR({ uri }: WalletQRProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground">
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={uri} size={200} />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Scan with <a href="https://getalby.com/alby-go" target="_blank" rel="noopener noreferrer" className="text-terminal hover:underline">Alby Go</a>
        </p>
      </CardContent>
    </Card>
  );
}
