'use client';

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ColorWheelProps {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

type AnyMouseEvent = MouseEvent | React.MouseEvent<HTMLCanvasElement>;

export function ColorWheel({ value, onChange, size = 200 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));

  // Convert HEX to HSV
  function hexToHsv(hex: string): HSV {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : Math.round((diff / max) * 100);
    const v = Math.round(max * 100);

    return { h, s, v };
  }

  // Convert HSV to HEX
  function hsvToHex(h: number, s: number, v: number): string {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v / 100 - c;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Draw the color wheel
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Outer hue ring
    for (let angle = 0; angle < 360; angle++) {
      const start = ((angle - 1) * Math.PI) / 180;
      const end = (angle * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.arc(centerX, centerY, radius * 0.6, end, start, true);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.6,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, `hsl(${angle}, 0%, 100%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Inner saturation / brightness
    const innerRadius = radius * 0.6;
    for (let r = 0; r < innerRadius; r++) {
      for (let angle = 0; angle < 360; angle += 2) {
        const x = centerX + r * Math.cos((angle * Math.PI) / 180);
        const y = centerY + r * Math.sin((angle * Math.PI) / 180);

        const s = (r / innerRadius) * 100;
        const v = Math.max(
          50,
          100 - (Math.abs(centerY - y) / innerRadius) * 50
        );

        ctx.fillStyle = `hsl(${hsv.h}, ${s}%, ${v}%)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Selector
    const selectorRadius = (hsv.s / 100) * innerRadius;
    const selectorAngle = (hsv.h * Math.PI) / 180;
    const selectorX = centerX + selectorRadius * Math.cos(selectorAngle);
    const selectorY = centerY + selectorRadius * Math.sin(selectorAngle);

    ctx.beginPath();
    ctx.arc(selectorX, selectorY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(selectorX, selectorY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv, size]);

  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  const handleColorChange = useCallback(
    (e: AnyMouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = size / 2;
      const centerY = size / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = size / 2 - 10;
      const innerRadius = radius * 0.6;

      if (distance <= radius && distance >= innerRadius) {
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        const newHsv = { ...hsv, h: Math.round(angle) };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
      } else if (distance < innerRadius) {
        const s = Math.min(100, (distance / innerRadius) * 100);
        const v = Math.max(50, 100 - (Math.abs(dy) / innerRadius) * 50);

        const newHsv = {
          ...hsv,
          s: Math.round(s),
          v: Math.round(v),
        };

        setHsv(newHsv);
        onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
      }
    },
    [hsv, size, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleColorChange(e);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleColorChange(e);
    },
    [isDragging, handleColorChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-crosshair rounded-full"
        onMouseDown={handleMouseDown}
      />
      <div className="text-center">
        <div className="text-white text-sm">
          HSV: {hsv.h}°, {hsv.s}%, {hsv.v}%
        </div>
        <div className="text-gray-400 text-sm font-mono">
          {hsvToHex(hsv.h, hsv.s, hsv.v).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
