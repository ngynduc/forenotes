import { useScrollReveal } from "@/hooks/useScrollReveal";

type Animation = "fade-up" | "fade-left" | "fade-right" | "fade-scale" | "fade";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  animation?: Animation;
  className?: string;
}

const hiddenStyles: Record<Animation, string> = {
  "fade-up": "translate-y-8 opacity-0",
  "fade-left": "-translate-x-8 opacity-0",
  "fade-right": "translate-x-8 opacity-0",
  "fade-scale": "scale-[0.97] opacity-0",
  fade: "opacity-0",
};

const visibleStyles: Record<Animation, string> = {
  "fade-up": "translate-y-0 opacity-100",
  "fade-left": "translate-x-0 opacity-100",
  "fade-right": "translate-x-0 opacity-100",
  "fade-scale": "scale-100 opacity-100",
  fade: "opacity-100",
};

export function Reveal({ children, delay = 0, animation = "fade-up", className = "" }: RevealProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(delay);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visible ? visibleStyles[animation] : hiddenStyles[animation]
      } ${className}`}
    >
      {children}
    </div>
  );
}
