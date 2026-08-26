/**
 * Q-Learn Nexus - 3D Interactive Bloch Sphere Visualizer
 * Renders the statevector projection on the unit sphere for any selected single qubit
 * using HTML5 Canvas with smooth orbital rotation and basis state markers.
 * @license Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BlochCoordinate } from '../../types/quantum';
import { RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface BlochSphereViewProps {
  blochCoords?: BlochCoordinate[];
  blochCoordinates?: BlochCoordinate[];
  blochVectors?: BlochCoordinate[];
  qubits?: number;
  activeQubit?: number;
  onSelectQubit?: (qubit: number) => void;
}

export const BlochSphereView: React.FC<BlochSphereViewProps> = ({
  blochCoords,
  blochCoordinates,
  blochVectors,
  activeQubit = 0,
  onSelectQubit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedQubit, setSelectedQubit] = useState(activeQubit);
  const [rotX, setRotX] = useState(0.4); // Elevation angle
  const [rotY, setRotY] = useState(0.6); // Azimuth angle
  const [zoom, setZoom] = useState(1.0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const activeCoords = blochVectors || blochCoords || blochCoordinates || [];

  useEffect(() => {
    setSelectedQubit(activeQubit);
  }, [activeQubit]);

  const currentCoord = (activeCoords && activeCoords[selectedQubit]) || (activeCoords && activeCoords[0]) || {
    qubit: selectedQubit,
    x: 0,
    y: 0,
    z: 1,
    theta: 0,
    phi: 0,
    p0: 1,
    p1: 0,
  };

  // Canvas 3D Projection Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 110 * zoom;

    ctx.clearRect(0, 0, width, height);

    // 3D rotation projection helper
    const project3D = (x: number, y: number, z: number) => {
      // Rotate around Y axis (azimuth)
      const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      const y1 = y;
      const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

      // Rotate around X axis (elevation)
      const x2 = x1;
      const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);

      // Perspective projection
      const fov = 400;
      const scale = fov / (fov + z2 * radius);
      return {
        px: centerX + x2 * radius * scale,
        py: centerY - y2 * radius * scale, // Canvas Y is inverted
        pz: z2,
      };
    };

    // Draw background sphere shadow / ambient gradient
    const grad = ctx.createRadialGradient(centerX - 20, centerY - 20, 10, centerX, centerY, radius);
    grad.addColorStop(0, 'rgba(243, 240, 233, 0.8)');
    grad.addColorStop(0.7, 'rgba(232, 228, 218, 0.4)');
    grad.addColorStop(1, 'rgba(141, 164, 126, 0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Latitude / Longitude Guide Rings
    ctx.strokeStyle = '#D9D5CB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Equator Ring (Z = 0)
    ctx.beginPath();
    const equatorSteps = 48;
    for (let i = 0; i <= equatorSteps; i++) {
      const angle = (i / equatorSteps) * Math.PI * 2;
      const x = Math.cos(angle);
      const y = 0;
      const z = Math.sin(angle);
      const { px, py } = project3D(x, y, z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Prime Meridian Ring (X = 0)
    ctx.beginPath();
    for (let i = 0; i <= equatorSteps; i++) {
      const angle = (i / equatorSteps) * Math.PI * 2;
      const x = 0;
      const y = Math.sin(angle);
      const z = Math.cos(angle);
      const { px, py } = project3D(x, y, z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Coordinate Axes (X: Blue/Olive, Y: Green/Sage, Z: Dark Forest)
    const drawAxis = (x: number, y: number, z: number, label: string, color: string) => {
      const origin = project3D(0, 0, 0);
      const end = project3D(x * 1.35, y * 1.35, z * 1.35);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(label, end.px + 4, end.py + 4);
    };

    // Z-Axis (Vertical: |0> North Pole, |1> South Pole)
    drawAxis(0, 1, 0, '+Z (|0⟩)', '#2D3326');
    drawAxis(0, -1, 0, '-Z (|1⟩)', '#6D7268');

    // X-Axis (|+> and |->)
    drawAxis(1, 0, 0, '+X (|+⟩)', '#5A634E');
    drawAxis(-1, 0, 0, '-X (|−⟩)', '#8C857B');

    // Y-Axis (|+i> and |-i>)
    drawAxis(0, 0, 1, '+Y (|+i⟩)', '#8DA47E');

    // Draw State Vector Arrow r = (x, y, z)
    // Note: Standard physics Bloch: z is vertical, x and y are horizontal
    const { px: vecX, py: vecY } = project3D(currentCoord.x, currentCoord.z, currentCoord.y);
    const origin = project3D(0, 0, 0);

    // Glow line
    ctx.strokeStyle = '#5A634E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(vecX, vecY);
    ctx.stroke();

    // Arrow Tip Sphere
    ctx.fillStyle = '#8DA47E';
    ctx.beginPath();
    ctx.arc(vecX, vecY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2D3326';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Outer Sphere Rim
    ctx.strokeStyle = '#8DA47E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [currentCoord, rotX, rotY, zoom]);

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-1.4, Math.min(1.4, prev + dy * 0.01)));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div id="bloch-sphere-container" className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#2D3326]">Bloch Sphere Visualizer</h3>
          <p className="text-xs text-[#8C857B]">Interactive 3D Single-Qubit State Geometry</p>
        </div>

        {/* Qubit Selector Tabs */}
        {activeCoords.length > 1 && (
          <div className="flex items-center gap-1.5 bg-[#F3F0E9] p-1 rounded-2xl border border-[#E8E4DA]">
            {activeCoords.map((c) => (
              <button
                key={c.qubit}
                id={`bloch-select-qubit-${c.qubit}`}
                onClick={() => {
                  setSelectedQubit(c.qubit);
                  onSelectQubit?.(c.qubit);
                }}
                className={`px-3 py-1 text-xs font-mono rounded-xl transition-all ${
                  selectedQubit === c.qubit
                    ? 'bg-white text-[#5A634E] shadow-xs font-semibold'
                    : 'text-[#6D7268] hover:text-[#2D3326]'
                }`}
              >
                q[{c.qubit}]
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center min-h-[300px] bg-[#FDFCF9] rounded-2xl border border-[#E8E4DA]/60 overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="touch-none"
        />

        {/* Floating Rotation & Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-[#E8E4DA] shadow-xs">
          <button
            id="bloch-zoom-in"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 text-[#6D7268] hover:text-[#2D3326] rounded-lg hover:bg-[#F3F0E9]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="bloch-zoom-out"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 text-[#6D7268] hover:text-[#2D3326] rounded-lg hover:bg-[#F3F0E9]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="bloch-reset-view"
            onClick={() => {
              setRotX(0.4);
              setRotY(0.6);
              setZoom(1.0);
            }}
            className="p-1.5 text-[#6D7268] hover:text-[#2D3326] rounded-lg hover:bg-[#F3F0E9]"
            title="Reset Perspective"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-3 left-3 text-[11px] text-[#8C857B] bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E8E4DA] flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#8DA47E]" />
          <span>Drag to orbit</span>
        </div>
      </div>

      {/* Spherical Coordinates & State Breakdown */}
      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
        <div className="bg-[#F3F0E9] p-2.5 rounded-2xl border border-[#E8E4DA]">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Vector ⟨X⟩</span>
          <span className="text-sm font-mono font-semibold text-[#2D3326]">{currentCoord.x}</span>
        </div>
        <div className="bg-[#F3F0E9] p-2.5 rounded-2xl border border-[#E8E4DA]">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Vector ⟨Y⟩</span>
          <span className="text-sm font-mono font-semibold text-[#2D3326]">{currentCoord.y}</span>
        </div>
        <div className="bg-[#F3F0E9] p-2.5 rounded-2xl border border-[#E8E4DA]">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Vector ⟨Z⟩</span>
          <span className="text-sm font-mono font-semibold text-[#2D3326]">{currentCoord.z}</span>
        </div>
        <div className="bg-[#F3F0E9] p-2.5 rounded-2xl border border-[#E8E4DA]">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Angles (θ, φ)</span>
          <span className="text-xs font-mono font-semibold text-[#5A634E]">
            {((currentCoord.theta / Math.PI) * 180).toFixed(0)}°, {((currentCoord.phi / Math.PI) * 180).toFixed(0)}°
          </span>
        </div>
      </div>
    </div>
  );
};
