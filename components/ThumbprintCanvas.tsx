"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Check, RotateCcw } from "lucide-react";

interface ThumbprintData {
  image: string;       // base64 PNG
  timestamp: string;   // ISO
  userAgent: string;
}

interface ThumbprintCanvasProps {
  label: string;
  onConfirm: (data: ThumbprintData) => void;
  onCancel: () => void;
}

interface TouchSample {
  x: number;
  y: number;
  r: number;
  force: number;
}

export default function ThumbprintCanvas({ label, onConfirm, onCancel }: ThumbprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState(false);
  const samplesRef = useRef<TouchSample[]>([]);

  const W = 280;
  const H = 280;

  const drawSamples = useCallback((samples: TouchSample[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background ink blot zone (union of all touch areas)
    for (const { x, y, r, force } of samples) {
      const rx = Math.max(r * 1.1, 28);
      const ry = Math.max(r * 0.85, 22);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rx);
      grad.addColorStop(0, `rgba(15,15,60,${0.55 + force * 0.3})`);
      grad.addColorStop(0.5, `rgba(15,15,60,${0.35 + force * 0.2})`);
      grad.addColorStop(1, "rgba(15,15,60,0)");
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Fingerprint ridges drawn inside each blot area
    for (const { x, y, r, force } of samples) {
      const maxR = Math.max(r * 0.95, 24);
      const numRidges = 9;
      ctx.save();
      ctx.globalAlpha = 0.22 + force * 0.08;
      ctx.strokeStyle = "rgba(180,190,255,0.9)";
      for (let i = 1; i <= numRidges; i++) {
        const ratio = i / (numRidges + 1);
        const rxi = maxR * ratio * 1.05;
        const ryi = maxR * ratio * 0.8;
        // slight wave on each arc
        ctx.lineWidth = 0.8 + (1 - ratio) * 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y + ratio * 4, rxi, ryi, -0.15, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Pores (small dots along ridges)
      ctx.save();
      ctx.fillStyle = "rgba(220,230,255,0.45)";
      for (let i = 1; i <= numRidges; i++) {
        const ratio = i / (numRidges + 1);
        const rxi = maxR * ratio * 1.05;
        const ryi = maxR * ratio * 0.8;
        const numPores = Math.floor(4 + ratio * 6);
        for (let p = 0; p < numPores; p++) {
          const angle = (p / numPores) * Math.PI * 2 + ratio * 0.4;
          const px = x + Math.cos(angle) * rxi;
          const py = y + ratio * 4 + Math.sin(angle) * ryi;
          ctx.beginPath();
          ctx.arc(px, py, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    const newSamples: TouchSample[] = [];
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      newSamples.push({
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
        r: ((t as Touch & { radiusX?: number }).radiusX ?? 30),
        force: (t as Touch & { force?: number }).force ?? 0.6,
      });
    }
    samplesRef.current = newSamples;
    drawSamples(newSamples);
    setCaptured(true);
  }, [drawSamples]);

  // Mouse fallback for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const sample: TouchSample = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      r: 38,
      force: 0.7,
    };
    samplesRef.current = [sample];
    drawSamples([sample]);
    setCaptured(true);
  }, [drawSamples]);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    samplesRef.current = [];
    setCaptured(false);
  }, []);

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captured) return;
    onConfirm({
      image: canvas.toDataURL("image/png"),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [captured, onConfirm]);

  // Draw placeholder guide
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(100,100,180,0.2)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, 55, 65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(100,100,180,0.12)";
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Posez votre pouce ici", W / 2, H / 2 + 90);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-indigo-200 bg-gray-50"
           style={{ width: W, maxWidth: "100%" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="touch-none w-full"
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          style={{ cursor: "crosshair" }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Recommencer
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <X className="w-3.5 h-3.5" />
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={!captured}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Valider
        </button>
      </div>
    </div>
  );
}
