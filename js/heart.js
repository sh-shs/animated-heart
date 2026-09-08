/**
 * Particle Heart Engine (`js/heart.js`)
 * Generates and constructs an animated particle heart from scratch.
 * Sequence:
 * 1. Center glowing spark point appears.
 * 2. Particles trace along parametric heart outline equations.
 * 3. Interior fills gradually with glowing floating particles.
 * 4. Radial aura & camera zoom effect activate.
 * 5. Gentle heartbeat pulsing & interactive particle physics (bursts on click/tap, hover repulsion).
 * 6. Message reveal fade-up.
 */

class HeartEngine {
    constructor() {
        this.canvas = document.getElementById('heart-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.textContainer = document.getElementById('text-reveal-container');
        this.ambientGlow = document.getElementById('ambient-glow');

        this.isRunning = false;
        this.startTime = 0;
        this.animationFrameId = null;

        // Particle collections
        this.centerSpark = null;
        this.outlineParticles = [];
        this.fillParticles = [];
        this.floatingParticles = [];
        this.burstParticles = [];

        // Interaction state
        this.mouse = { x: -1000, y: -1000, isHovering: false };
        this.isMobile = window.innerWidth < 768;
        this.heartScale = 1.0;

        // Sequence timing / progress flags
        this.constructionProgress = 0; // 0 to 1
        this.textRevealed = false;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse / Touch Interactivity
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.isHovering = true;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.isHovering = false;
        });

        this.canvas.addEventListener('click', (e) => {
            this.createBurst(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
                this.createBurst(touch.clientX, touch.clientY);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
            }
        }, { passive: true });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.isMobile = window.innerWidth < 768;

        // Responsive Heart Size: Scale heart properly for phones, tablets, and desktop displays
        const baseScale = Math.min(this.canvas.width, this.canvas.height);
        const configScale = (window.CONFIG && window.CONFIG.heartSizeScale) || 1.0;
        this.heartScale = (baseScale / 45) * (this.isMobile ? 0.75 : 1.0) * configScale;

        if (this.isRunning && this.outlineParticles.length > 0) {
            this.recalculateTargets();
        }
    }

    // Parametric Heart Point Equation:
    // x = 16 * sin^3(t)
    // y = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
    getHeartPoint(t) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return {
            x: x * this.heartScale + this.canvas.width / 2,
            y: y * this.heartScale + (this.canvas.height / 2 - 65)
        };
    }

    // Random point inside heart using rejection sampling
    getRandomInsideHeartPoint() {
        let pt = null;
        while (!pt) {
            const t = Math.random() * Math.PI * 2;
            const border = this.getHeartPoint(t);
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2 - 65;

            const r = Math.sqrt(Math.random()) * 0.95; // Radius fraction inside
            pt = {
                x: cx + (border.x - cx) * r,
                y: cy + (border.y - cy) * r
            };
        }
        return pt;
    }

    start() {
        this.isRunning = true;
        this.startTime = performance.now();
        this.setupParticleSystem();
        this.animate();
    }

    setupParticleSystem() {
        const particleScale = this.isMobile
            ? ((window.CONFIG && window.CONFIG.mobileParticleScale) || 0.6)
            : 1.0;

        const outlineCount = Math.floor(((window.CONFIG && window.CONFIG.outlineParticleCount) || 350) * particleScale);
        const fillCount = Math.floor(((window.CONFIG && window.CONFIG.fillParticleCount) || 1800) * particleScale);
        const floatCount = Math.floor(((window.CONFIG && window.CONFIG.floatingParticleCount) || 120) * particleScale);

        const cy = this.canvas.height / 2 - 65;

        // 1. Center Spark
        this.centerSpark = {
            x: this.canvas.width / 2,
            y: cy,
            radius: 3,
            alpha: 0,
            scale: 0.1
        };

        // 2. Outline Particles
        this.outlineParticles = [];
        for (let i = 0; i < outlineCount; i++) {
            const t = (i / outlineCount) * Math.PI * 2;
            const target = this.getHeartPoint(t);
            const angle = Math.random() * Math.PI * 2;
            const startDist = Math.random() * 300 + 100;

            this.outlineParticles.push({
                x: this.canvas.width / 2 + Math.cos(angle) * startDist,
                y: cy + Math.sin(angle) * startDist,
                targetX: target.x,
                targetY: target.y,
                t: t,
                vx: 0,
                vy: 0,
                radius: Math.random() * 1.8 + 1.2,
                color: (i % 5 === 0) ? '#ffffff' : (i % 2 === 0 ? '#ff6699' : '#ff3366'),
                alpha: 0,
                delay: (i / outlineCount) * 3200, // Staggered appearance around shape
                joined: false
            });
        }

        // 3. Fill Particles
        this.fillParticles = [];
        for (let i = 0; i < fillCount; i++) {
            const target = this.getRandomInsideHeartPoint();
            this.fillParticles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 50,
                y: cy + (Math.random() - 0.5) * 50,
                targetX: target.x,
                targetY: target.y,
                baseTargetX: target.x,
                baseTargetY: target.y,
                vx: 0,
                vy: 0,
                radius: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.85 ? '#ffd700' : (Math.random() > 0.4 ? '#ff3366' : '#ff6699'),
                alpha: 0,
                delay: 2800 + Math.random() * 2500, // Fill sequence delay
                speedFactor: Math.random() * 0.04 + 0.02,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // 4. Floating Ambient Particles around Heart
        this.floatingParticles = [];
        for (let i = 0; i < floatCount; i++) {
            this.floatingParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -(Math.random() * 0.5 + 0.2),
                radius: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.5 ? '#ff99bb' : '#ffffff',
                alpha: 0,
                delay: 4500 + Math.random() * 2000
            });
        }
    }

    recalculateTargets() {
        const outlineCount = this.outlineParticles.length;
        for (let i = 0; i < outlineCount; i++) {
            const p = this.outlineParticles[i];
            const target = this.getHeartPoint(p.t);
            p.targetX = target.x;
            p.targetY = target.y;
        }

        for (let i = 0; i < this.fillParticles.length; i++) {
            const p = this.fillParticles[i];
            const target = this.getRandomInsideHeartPoint();
            p.targetX = target.x;
            p.targetY = target.y;
            p.baseTargetX = target.x;
            p.baseTargetY = target.y;
        }
    }

    createBurst(x, y) {
        const burstCount = this.isMobile ? 25 : 45;
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.burstParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2.5 + 1.0,
                color: Math.random() > 0.3 ? '#ff3366' : '#ffd700',
                alpha: 1.0,
                decay: Math.random() * 0.025 + 0.015
            });
        }
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const elapsed = now - this.startTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Heartbeat pulse cycle calculation (Gentle emotional pulsing)
        let pulseScale = 1.0;
        let pulseGlow = 0;
        if (elapsed > 4500) {
            const pulseTime = (elapsed - 4500) * 0.0022;
            // Double-beat realistic heart pulse rhythm
            const pulseWave = Math.sin(pulseTime) + 0.3 * Math.sin(pulseTime * 2);
            pulseScale = 1 + Math.max(0, pulseWave) * 0.045;
            pulseGlow = Math.max(0, pulseWave) * 15;
        }

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2 - 65;

        // Stage 1: Center Glowing Spark (0 - 1500ms)
        if (elapsed < 3000) {
            const sparkAlpha = Math.min(1, elapsed / 800);
            const sparkRadius = (Math.sin(elapsed * 0.005) * 4 + 8);

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, sparkRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = '#ff3366';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Stage 2 & 3: Outline Construction
        for (let i = 0; i < this.outlineParticles.length; i++) {
            const p = this.outlineParticles[i];

            if (elapsed > p.delay) {
                p.alpha = Math.min(1, p.alpha + 0.04);

                // Lerp towards heart outline target with spring-like physics
                const dx = (cx + (p.targetX - cx) * pulseScale) - p.x;
                const dy = (cy + (p.targetY - cy) * pulseScale) - p.y;
                p.vx = p.vx * 0.85 + dx * 0.08;
                p.vy = p.vy * 0.85 + dy * 0.08;
                p.x += p.vx;
                p.y += p.vy;

                // Mouse Repulsion Effect
                if (this.mouse.isHovering) {
                    const mdx = p.x - this.mouse.x;
                    const mdy = p.y - this.mouse.y;
                    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                    if (mdist < 80) {
                        const force = (80 - mdist) / 80;
                        p.x += (mdx / mdist) * force * 8;
                        p.y += (mdy / mdist) * force * 8;
                    }
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.shadowBlur = 12 + pulseGlow;
                this.ctx.shadowColor = '#ff3366';
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.shadowBlur = 0;
            }
        }

        // Stage 4: Fill Particles (Gradually appearing inside)
        for (let i = 0; i < this.fillParticles.length; i++) {
            const p = this.fillParticles[i];

            if (elapsed > p.delay) {
                p.alpha = Math.min(0.85, p.alpha + 0.02);

                const scaledTargetX = cx + (p.baseTargetX - cx) * pulseScale;
                const scaledTargetY = cy + (p.baseTargetY - cy) * pulseScale;

                p.x += (scaledTargetX - p.x) * p.speedFactor;
                p.y += (scaledTargetY - p.y) * p.speedFactor;

                // Subtle internal vibration/pulse
                const floatOffset = Math.sin(now * 0.003 + p.pulseOffset) * 1.5;

                // Mouse Repulsion Effect
                let mx = 0, my = 0;
                if (this.mouse.isHovering) {
                    const mdx = p.x - this.mouse.x;
                    const mdy = p.y - this.mouse.y;
                    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                    if (mdist < 70) {
                        const force = (70 - mdist) / 70;
                        mx = (mdx / mdist) * force * 10;
                        my = (mdy / mdist) * force * 10;
                    }
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x + mx, p.y + floatOffset + my, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.shadowBlur = 8 + pulseGlow * 0.5;
                this.ctx.shadowColor = '#ff3366';
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.shadowBlur = 0;
            }
        }

        // Stage 5: Floating Particles radiating outward from heart
        for (let i = 0; i < this.floatingParticles.length; i++) {
            const p = this.floatingParticles[i];

            if (elapsed > p.delay) {
                p.alpha = Math.min(0.6, p.alpha + 0.01);
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < -10 || p.x < -10 || p.x > this.canvas.width + 10) {
                    p.y = cy + (Math.random() - 0.5) * 100;
                    p.x = cx + (Math.random() - 0.5) * 100;
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Render Click/Tap Particle Bursts
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const bp = this.burstParticles[i];
            bp.x += bp.vx;
            bp.y += bp.vy;
            bp.vx *= 0.95;
            bp.vy *= 0.95;
            bp.alpha -= bp.decay;

            if (bp.alpha <= 0) {
                this.burstParticles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = bp.color;
            this.ctx.globalAlpha = bp.alpha;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = bp.color;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
            this.ctx.shadowBlur = 0;
        }

        // Camera Zoom & Ambient Radial Lighting Activation
        const cameraDelay = (window.CONFIG && window.CONFIG.cameraZoomDelayMs) || 6000;
        if (elapsed > cameraDelay && this.ambientGlow) {
            this.ambientGlow.classList.add('active');
        }

        // Final Stage: Text Reveal
        const textDelay = (window.CONFIG && window.CONFIG.textRevealDelayMs) || 9500;
        if (elapsed > textDelay && !this.textRevealed && this.textContainer) {
            this.textRevealed = true;
            this.textContainer.classList.remove('hidden');
            // Force reflow
            void this.textContainer.offsetWidth;
            this.textContainer.classList.add('visible');
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

window.heartEngine = null;
window.addEventListener('DOMContentLoaded', () => {
    window.heartEngine = new HeartEngine();
});
