import QRCode from 'qrcode';

/** Render a QR code as a PNG data URL for the given verification URL. */
export async function qrDataUrl(text: string, size = 160): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: {
      dark: '#0a0f15',
      light: '#ffffff',
    },
  });
}

/** Draw a downloadable certificate PNG including the QR code. */
export async function downloadCertificatePng(options: {
  holderName: string;
  issuedAt: string;
  verificationUrl: string;
  totalXp: number;
}): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0f1724');
  gradient.addColorStop(1, '#1a2438');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(82, 168, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  ctx.fillStyle = '#52a8ff';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('ShellCraft', 72, 96);

  ctx.fillStyle = '#f4f7fb';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText('Certificate of Completion', 72, 160);

  ctx.fillStyle = '#9aa9ba';
  ctx.font = '400 20px system-ui, sans-serif';
  ctx.fillText('Linux Fundamentals — All 5 Labs Mastered', 72, 200);

  ctx.fillStyle = '#f4a62a';
  ctx.font = '600 34px system-ui, sans-serif';
  ctx.fillText(options.holderName, 72, 280);

  ctx.fillStyle = '#c8d4e0';
  ctx.font = '400 18px system-ui, sans-serif';
  const issuedLabel = new Date(options.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(`Issued ${issuedLabel}`, 72, 330);
  ctx.fillText(`Total XP: ${options.totalXp}`, 72, 360);

  ctx.fillStyle = '#8b5cf6';
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText('Scan to verify authenticity', 72, 520);

  const qr = await qrDataUrl(options.verificationUrl, 180);
  const image = await loadImage(qr);
  ctx.drawImage(image, canvas.width - 252, canvas.height - 252, 180, 180);

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shellcraft-certificate-${options.holderName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
