'use client';
import { useEffect, useState } from 'react';

type Props = { size?: number };

export default function LogoLoading({ size = 128 }: Props) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      {/* Gradient & Marker tanımı */}
      <defs>
        <radialGradient id="wtxGrad" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#77B9FF" />
          <stop offset="100%" stopColor="#3C7DFF" />
        </radialGradient>

        {/* Ok marker */}
        <marker
          id="wtxArrow"
          markerUnits="userSpaceOnUse"
          markerWidth="28"
          markerHeight="28"
          refX="12"
          refY="14"
          orient="auto"
        >
          <path d="M0,0 L0,28 L24,14 Z" fill="#FFFFFF" />
        </marker>
      </defs>

      {/* Arka plan daire */}
      <circle cx="512" cy="512" r="420" fill="url(#wtxGrad)" />

      {/* Barlar */}
      <rect
        x="300" y="562" width="90" height="190" rx="18" fill="#fff"
        className={on ? 'wtx-rect wtx-rise delay-[0ms]' : ''}
      />
      <rect
        x="450" y="512" width="90" height="240" rx="18" fill="#fff"
        className={on ? 'wtx-rect wtx-rise delay-[500ms]' : ''}
      />
      <rect
        x="600" y="442" width="90" height="310" rx="18" fill="#fff"
        className={on ? 'wtx-rect wtx-rise delay-[1000ms]' : ''}
      />

      {/* Çizgi + ok marker */}
      <path
        d="M290 606 L430 486 L560 396 L640 456 L740 356"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        className={on ? 'wtx-draw' : ''}
        markerEnd="url(#wtxArrow)"
      />
    </svg>
  );
}