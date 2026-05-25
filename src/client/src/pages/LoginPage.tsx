import { FormEvent, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/use-auth";
import logo from "@/assets/forenotes_logo.png";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const NODE_COUNT = 60;
const MAX_DIST = 150;
const NODE_SPEED = 0.3;
const SHOW_DEMO_CREDENTIALS = import.meta.env.VITE_FORENOTES_DEMO_MODE === "1";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener("resize", resize);

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * NODE_SPEED * 2,
      vy: (Math.random() - 0.5) * NODE_SPEED * 2,
      radius: Math.random() * 2 + 1,
    }));
    nodesRef.current = nodes;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST * devicePixelRatio) {
            const alpha = 1 - dist / (MAX_DIST * devicePixelRatio);
            ctx.strokeStyle = `rgba(15,118,110,${alpha * 0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = "rgba(15,118,110,0.35)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
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
    />
  );
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login.mutateAsync({ username, password });
      onLoginSuccess();
    } catch (err) {
      setError(getLoginErrorMessage(err));
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d1512] px-4 py-10 text-[#17201d]">
      <ParticleCanvas />
      <section className="relative z-10 w-full max-w-[420px] rounded-[24px] border border-[#1e3530] bg-white/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="mb-6 flex flex-col items-center">
          <img src={logo} alt="Forenotes" className="mb-2 h-32 w-auto" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-[#66716d]">
            Use your incident workspace credentials to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={login.isPending}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={login.isPending}
              required
            />
          </div>

          {error && (
            <p className="rounded-[12px] border border-[#f2c8c2] bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">
              {error}
            </p>
          )}

          <Button type="submit" className="h-10 w-full active:scale-[0.96]" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Login"}
          </Button>
        </form>

        {SHOW_DEMO_CREDENTIALS && (
          <p className="mt-5 rounded-[14px] bg-[#f7f9f7] px-3 py-2 text-xs text-[#66716d]">
            Demo users include <span className="font-mono text-[#40514d]">lead / lead123</span>.
          </p>
        )}
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("disabled")) {
    return "Your account is disabled.";
  }
  if (message.toLowerCase().includes("invalid username or password")) {
    return "Invalid username or password.";
  }
  return "Unable to login. Please try again.";
}
