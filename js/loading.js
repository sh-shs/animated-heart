/**
 * Loading Controller
 * Handles smooth 0% -> 100% counter, glowing progress bar, and "Ready ❤️" transition.
 */
class LoadingManager {
    constructor() {
        this.percentElement = document.getElementById('loading-percentage');
        this.barFillElement = document.getElementById('loading-bar-fill');
        this.statusElement = document.getElementById('loading-status');
        this.loadingTitle = document.getElementById('loading-title');
    }

    startLoading(onComplete) {
        if (window.CONFIG) {
            if (this.loadingTitle && window.CONFIG.loadingText) {
                this.loadingTitle.textContent = window.CONFIG.loadingText;
            }
        }

        const duration = (window.CONFIG && window.CONFIG.loadingDurationMs) || 3800;
        const startTime = performance.now();
        let isDone = false;

        const updateProgress = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            let progress = elapsedTime / duration;

            if (progress > 1) progress = 1;

            // Ease-out cubic curve for natural cinematic loading feel
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentPercent = Math.floor(easedProgress * 100);

            if (this.percentElement) {
                this.percentElement.textContent = currentPercent;
            }
            if (this.barFillElement) {
                this.barFillElement.style.width = `${currentPercent}%`;
            }

            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else if (!isDone) {
                isDone = true;
                this.handleComplete(onComplete);
            }
        };

        requestAnimationFrame(updateProgress);
    }

    handleComplete(onComplete) {
        if (this.statusElement) {
            this.statusElement.textContent = (window.CONFIG && window.CONFIG.loadingCompleteText) || "Ready ❤️";
            this.statusElement.classList.add('visible');
        }

        // Brief pause at 100% then trigger next screen
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 1200);
    }
}

window.loadingManager = null;
window.addEventListener('DOMContentLoaded', () => {
    window.loadingManager = new LoadingManager();
});
