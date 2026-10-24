import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import QRCode from './qr-display';

describe('QRCode', () => {
  it('renders a real QR symbol (single SVG path), not a hash-derived grid of squares', () => {
    const { container } = render(<QRCode value="http://localhost:5173/verify/CRED-1" size={200} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('200');
    expect(svg!.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(svg!.querySelectorAll('rect').length).toBe(0);
  });

  it('encodes different values differently', () => {
    const a = render(<QRCode value="http://x/verify/CRED-A" />).container.innerHTML;
    const b = render(<QRCode value="http://x/verify/CRED-B" />).container.innerHTML;
    expect(a).not.toBe(b);
  });
});
