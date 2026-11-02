// Yüksek Performanslı Bağımsız Canvas Konfeti Efekti
// Piyasa Değeri Oyunu Rekor Kutlaması için

let activeAnimationId = null;

export function launchConfetti(canvas) {
  if (!canvas) return;

  if (activeAnimationId) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const count = 180;
  const pieces = [];
  const colors = [
    '#c5e782', // lime
    '#4ade80', // green
    '#fde047', // yellow
    '#38bdf8', // sky
    '#f43f5e', // rose
    '#a855f7', // purple
    '#fb923c', // orange
    '#ffffff'  // white
  ];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.4,
      width: Math.random() * 12 + 6,
      height: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 5 + 3,
      angle: Math.random() * 360,
      vAngle: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
      opacity: 1
    });
  }

  let frame = 0;
  const maxFrames = 320;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.09; // Yerçekimi
      p.vx *= 0.99; // Hava sürtünmesi
      p.angle += p.vAngle;

      // Ekran sonuna doğru yavaşça saydamlaş
      if (p.y > canvas.height * 0.75) {
        p.opacity = Math.max(0, p.opacity - 0.02);
      }

      if (p.y < canvas.height + 60 && p.opacity > 0) {
        alive++;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    frame++;
    if (alive > 0 && frame < maxFrames) {
      activeAnimationId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      activeAnimationId = null;
    }
  }

  render();
}

export function stopConfetti(canvas) {
  if (activeAnimationId) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
  }
}
