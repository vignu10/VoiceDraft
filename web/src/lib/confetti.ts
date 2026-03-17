/**
 * Lightweight confetti celebration effect
 * Simple canvas-based implementation without external dependencies
 */

export interface ConfettiOptions {
  count?: number;
  colors?: string[];
  duration?: number;
}

const defaultColors = [
  'oklch(0.52 0.28 285)', // primary-500
  'oklch(0.62 0.22 38)',  // accent-500
  'oklch(0.68 0.24 350)', // pink-500
  'oklch(0.58 0.20 145)', // success-500
  'oklch(0.72 0.24 75)',  // warning-500
];

export function celebrate(options: ConfettiOptions = {}): () => void {
  const {
    count = 100,
    colors = defaultColors,
    duration = 3000,
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // Style canvas
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(canvas);

  // Set canvas size
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Confetti particle class
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;

    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -20;
      this.vx = (Math.random() - 0.5) * 8;
      this.vy = Math.random() * 5 + 3;
      this.size = Math.random() * 8 + 4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
      this.opacity = 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // gravity
      this.rotation += this.rotationSpeed;
      this.opacity -= 0.003;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }

    isDead(): boolean {
      return this.opacity <= 0 || this.y > canvas.height + 20;
    }
  }

  // Create particles
  const particles: Particle[] = [];
  let spawned = 0;
  const spawnInterval = setInterval(() => {
    if (spawned < count) {
      particles.push(new Particle());
      spawned++;
    } else {
      clearInterval(spawnInterval);
    }
  }, 20);

  // Animation loop
  let animationId: number;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cancelAnimationFrame(animationId);
      cleanup();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }

    // Continue if there are particles or time remaining
    if (particles.length > 0 || elapsed < duration) {
      animationId = requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  };

  animate();

  // Cleanup function
  const cleanup = () => {
    clearInterval(spawnInterval);
    window.removeEventListener('resize', resizeCanvas);
    canvas.remove();
  };

  return cleanup;
}
