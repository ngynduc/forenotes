import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label?: string;
  isHub?: boolean;
}

const PARTICLE_COUNT = 90;
const MAX_DIST = 180;
const SPEED = 0.22;

const LABELED_ENTITIES = [
  "Case", "Case",
  "Incident", "Incident",
  "Finding", "Finding", "Finding",
  "Timeline", "Timeline",
  "Task", "Task",
  "Indicator", "Indicator",
  "Report",
  "Evidence",
  "Note",
  "MITRE Tag",
  "Entity",
  "Account",
  "System",
];

const HUBS = new Set(["Case", "Incident"]);

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const label = i < LABELED_ENTITIES.length ? LABELED_ENTITIES[i] : undefined;
      return {
        x: Math.random() * (canvas?.width ?? 800),
        y: Math.random() * (canvas?.height ?? 600),
        vx: (Math.random() - 0.5) * SPEED * 2 * dpr,
        vy: (Math.random() - 0.5) * SPEED * 2 * dpr,
        radius: (Math.random() * 1.5 + 0.8) * dpr,
        label,
        isHub: label ? HUBS.has(label) : false,
      };
    });

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      const threshold = MAX_DIST * dpr;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold) {
            const alpha = 1 - dist / threshold;
            const isLabeledEdge = particles[i].label && particles[j].label;
            ctx.strokeStyle = `rgba(45,212,191,${alpha * (isLabeledEdge ? 0.3 : 0.12)})`;
            ctx.lineWidth = isLabeledEdge ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        if (p.label) {
          const r = (p.isHub ? 5 : 3.5) * dpr;
          ctx.fillStyle = p.isHub ? "rgba(45,212,191,0.8)" : "rgba(45,212,191,0.55)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();

          if (p.isHub) {
            ctx.strokeStyle = "rgba(45,212,191,0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 4 * dpr, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.font = `${(p.isHub ? 11 : 9.5) * dpr}px "IBM Plex Sans", sans-serif`;
          ctx.fillStyle = p.isHub ? "rgba(45,212,191,0.7)" : "rgba(45,212,191,0.45)";
          ctx.textAlign = "center";
          ctx.fillText(p.label, p.x, p.y - r - 4 * dpr);
        } else {
          ctx.fillStyle = "rgba(45,212,191,0.2)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
