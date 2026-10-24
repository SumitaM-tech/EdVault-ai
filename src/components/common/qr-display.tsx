import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  /** The text to encode. For credentials this is the public verification URL. */
  value: string;
  size?: number;
}

/** A standards-compliant QR code (scannable by any phone camera). */
export default function QRCode({ value, size = 200 }: QRCodeProps) {
  return (
    <div className="inline-block rounded-lg bg-white p-2" data-testid="qr-code">
      <QRCodeSVG value={value} size={size} level="M" bgColor="#ffffff" fgColor="#000000" />
    </div>
  );
}

export function QRDisplay({ payload }: { payload: string; label?: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-center">
        <QRCode value={payload} size={180} />
      </div>
      <p className="text-xs text-center text-slate-500 break-all">{payload}</p>
    </div>
  );
}
