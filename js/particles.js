/**
 * Background Ambient Floating Particle System
 * Operates on `#bg-canvas` to provide subtle glowing dust and ambient atmosphere.
 */
class AmbientParticles {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 40 : 85;
        this.animationFrameId = null;

        this.mouse = { x: null, y: null, targetX: null, targetY: null };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = e.clientX;
            this.mouse.targetY = e.clientY;
        });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.targetX = e.touches[0].clientX;
                this.mouse.targetY = e.touches[0].clientY;
            }
        });

        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.particleCount = window.innerWidth < 768 ? 40 : 85;
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }

    createParticles() {
        this.particles = [];
        const colors = [
            'rgba(255, 51, 102, ',
            'rgba(255, 102, 153, ',
            'rgba(255, 153, 204, ',
            'rgba(255, 215, 0, '
        ];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.8 + 0.6,
                baseColor: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.5 + 0.1,
                speedY: -(Math.random() * 0.4 + 0.1),
                speedX: (Math.random() - 0.5) * 0.3,
                pulseSpeed: Math.random() * 0.02 + 0.005,
                pulseAngle: Math.random() * Math.PI * 2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Smooth mouse position interpolation
        if (this.mouse.targetX !== null) {
            if (this.mouse.x === null) {
                this.mouse.x = this.mouse.targetX;
                this.mouse.y = this.mouse.targetY;
            } else {
                this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
                this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
            }
        }

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.y += p.speedY;
            p.x += p.speedX;

            // Pulse opacity
            p.pulseAngle += p.pulseSpeed;
            const currentAlpha = p.alpha + Math.sin(p.pulseAngle) * 0.15;
            const clampedAlpha = Math.max(0.05, Math.min(0.8, currentAlpha));

            // Wrap around screen edges
            if (p.y < -10) {
                p.y = this.canvas.height + 10;
                p.x = Math.random() * this.canvas.width;
            }
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;

            // Subtle mouse repulsion / movement
            let offsetX = 0;
            let offsetY = 0;
            if (this.mouse.x !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    offsetX = (dx / dist) * force * 15;
                    offsetY = (dy / dist) * force * 15;
                }
            }

            // Draw glowing ambient dot
            this.ctx.beginPath();
            this.ctx.arc(p.x + offsetX, p.y + offsetY, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.baseColor + clampedAlpha + ')';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 51, 102, 0.5)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

window.ambientParticles = null;
window.addEventListener('DOMContentLoaded', () => {
    window.ambientParticles = new AmbientParticles();
});
