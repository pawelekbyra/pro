/**
 * BrickWall Module
 * Handles the interactive canvas brick wall for secret slides.
 * This implementation is based on the user-provided example, featuring
 * a physics-based explosion effect.
 */
import { Utils } from './utils.js';
import { UI } from './ui.js';

class BrickWall {
    constructor(canvas, onWallDestroyed) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onWallDestroyed = onWallDestroyed;

        this.bricks = [];
        this.animationFrameId = null;
        this.isDestroyed = false;

        this.config = {
            brickWidth: 60,
            brickHeight: 30,
            jointThickness: 1,
            brickColor: '#ffffff',
            jointColor: '#333333',
            gravity: 0.5,
            explosionRadius: 100,
            maxVelocity: 15
        };

        this.init();
    }

    init() {
        this.resize();
        this.createBricks();
        this.animate();
        this.setupListeners();
    }

    createBricks() {
        this.bricks = [];
        const { brickWidth, brickHeight, jointThickness } = this.config;
        const rows = Math.ceil(this.canvas.height / (brickHeight + jointThickness));
        const cols = Math.ceil(this.canvas.width / brickWidth) + 1;

        for (let row = 0; row < rows; row++) {
            const offset = (row % 2 === 0) ? 0 : (brickWidth + jointThickness) / 2;
            for (let col = -1; col < cols; col++) {
                const x = col * (brickWidth + jointThickness) + offset;
                const y = row * (brickHeight + jointThickness);
                if (x + brickWidth > 0 && x < this.canvas.width + brickWidth) {
                    this.bricks.push({
                        x, y,
                        width: brickWidth,
                        height: brickHeight,
                        isDestroyed: false,
                        vx: 0,
                        vy: 0,
                        rotation: 0,
                        rotationSpeed: 0
                    });
                }
            }
        }
    }

    drawBrick(brick) {
        this.ctx.save();
        this.ctx.translate(brick.x + brick.width / 2, brick.y + brick.height / 2);
        this.ctx.rotate(brick.rotation);
        this.ctx.fillStyle = this.config.brickColor;
        this.ctx.fillRect(-brick.width / 2, -brick.height / 2, brick.width, brick.height);
        this.ctx.strokeStyle = this.config.jointColor;
        this.ctx.lineWidth = this.config.jointThickness;
        this.ctx.strokeRect(-brick.width / 2, -brick.height / 2, brick.width, brick.height);
        this.ctx.restore();
    }

    updatePhysics(brick) {
        brick.vx *= 0.99; // Air resistance
        brick.vy += this.config.gravity;
        brick.x += brick.vx;
        brick.y += brick.vy;
        brick.rotation += brick.rotationSpeed;
    }

    triggerExplosion(clickX, clickY) {
        if (this.isDestroyed) return;

        const { explosionRadius, maxVelocity } = this.config;
        let bricksAffected = 0;

        this.bricks.forEach(brick => {
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            const dx = brickCenterX - clickX;
            const dy = brickCenterY - clickY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < explosionRadius && !brick.isDestroyed) {
                brick.isDestroyed = true;
                bricksAffected++;
                const strength = 1 - (distance / explosionRadius);
                const angle = Math.atan2(dy, dx);
                brick.vx = Math.cos(angle) * maxVelocity * strength * (0.8 + Math.random() * 0.4);
                brick.vy = Math.sin(angle) * maxVelocity * strength * (0.5 + Math.random() * 0.5) - (maxVelocity * strength * 0.5);
                brick.rotationSpeed = (Math.random() - 0.5) * 0.2;
            }
        });

        // If enough bricks are gone, consider the wall destroyed
        const destroyedCount = this.bricks.filter(b => b.isDestroyed).length;
        if (destroyedCount / this.bricks.length > 0.85) {
            this.destroyWall();
        }
    }

    animate() {
        this.ctx.fillStyle = this.config.jointColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let bricksOnScreen = false;
        this.bricks.forEach(brick => {
            if (brick.isDestroyed) {
                this.updatePhysics(brick);
            }
            // Only draw if brick is within view
            if (brick.y < this.canvas.height) {
                 this.drawBrick(brick);
                 if(!brick.isDestroyed) bricksOnScreen = true;
            }
        });

        // If all bricks are destroyed and have fallen off screen, stop the animation.
        if (this.isDestroyed && !bricksOnScreen) {
            // Animation can stop now.
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        }
    }

    destroyWall() {
        if(this.isDestroyed) return;
        this.isDestroyed = true;
        this.triggerExplosion(this.canvas.width / 2, this.canvas.height / 2); // Final explosion
        setTimeout(() => {
            if (this.onWallDestroyed) this.onWallDestroyed();
            UI.showAlert(Utils.getTranslation('wallDestroyedSuccess'));
            this.canvas.style.transition = 'opacity 0.5s';
            this.canvas.style.opacity = '0';
            setTimeout(() => this.canvas.style.display = 'none', 500);
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }, 1000); // Wait a bit for the final explosion to be seen
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.createBricks();
        }
    }

    setupListeners() {
        const handleInteraction = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            this.triggerExplosion(x, y);
        };

        this.canvas.addEventListener('click', handleInteraction);
        this.canvas.addEventListener('touchstart', handleInteraction);
    }
}

let activeWall = null;

export const BrickWallManager = {
    init(canvas) {
        if (activeWall) {
            cancelAnimationFrame(activeWall.animationFrameId);
            activeWall = null;
        }

        const onWallDestroyed = () => {
            const slide = canvas.closest('.webyx-section');
            if (slide) {
                slide.removeAttribute('data-is-interactive-wall');
                const video = slide.querySelector('video');
                if (video && video.paused) {
                    video.play().catch(err => console.error("Play failed after wall destroy", err));
                }
            }
            activeWall = null;
        };

        activeWall = new BrickWall(canvas, onWallDestroyed);
        return activeWall;
    },
    destroyActiveWall() {
        if (activeWall) {
            activeWall.destroyWall();
        }
    }
};
