import { useEffect, useRef } from "react";
const THEME_CONFETTI = ["#0EA5E9", "#5B9EC9", "#22C55E", "#F97316", "#EAB308", "#38bdf8", "#E2F0FF"];

export default function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pieces    = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    pieces.current = Array.from({ length: 140 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height * 0.3 - canvas.height * 0.3,
      w:     Math.random() * 9 + 4,
      h:     Math.random() * 4 + 2,
      color: THEME_CONFETTI[Math.floor(Math.random() * THEME_CONFETTI.length)],
      vx:    (Math.random() - 0.5) * 4.5,
      vy:    Math.random() * 3.5 + 2,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.22,
      life:  1,
      decay: Math.random() * 0.007 + 0.003,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.current.forEach((p) => {
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        p.life  -= p.decay;
        if (p.y > canvas.height) { p.y = -10; p.life = 1; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    const stop = setTimeout(() => cancelAnimationFrame(animRef.current), 4500);
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(stop); };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:999 }}
    />
  );
}
