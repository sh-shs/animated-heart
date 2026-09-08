/**
 * Main Application Orchestrator & Screen Sequence Controller
 * Handles screen transitions: Welcome -> Loading -> Start -> Heart Canvas
 */
class AppController {
    constructor() {
        this.welcomeScreen = document.getElementById('screen-welcome');
        this.loadingScreen = document.getElementById('screen-loading');
        this.startScreen = document.getElementById('screen-start');
        this.mainScreen = document.getElementById('screen-main');

        this.btnOpen = document.getElementById('btn-open');
        this.btnStart = document.getElementById('btn-start');

        this.init();
    }

    init() {
        this.populateTexts();
        this.bindEvents();
    }

    populateTexts() {
        if (!window.CONFIG) return;

        const setElementText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) el.textContent = text;
        };

        setElementText('welcome-subtitle', window.CONFIG.welcomeSubtitle);
        setElementText('welcome-btn-text', window.CONFIG.openText);
        setElementText('loading-title', window.CONFIG.loadingText);
        setElementText('start-title', window.CONFIG.startTitle);
        setElementText('start-btn-text', window.CONFIG.startText);
        setElementText('final-title', window.CONFIG.finalTitle);
        setElementText('final-message', window.CONFIG.finalMessage);

        if (window.CONFIG.siteTitle) {
            document.title = window.CONFIG.siteTitle;
        }
    }

    bindEvents() {
        // OPEN Button Click
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', (e) => {
                this.createRipple(e, this.btnOpen);

                // Play music audio if configured
                if (window.audioManager && window.CONFIG && window.CONFIG.autoPlayMusicOnStart) {
                    window.audioManager.play();
                }

                setTimeout(() => {
                    this.switchScreen(this.welcomeScreen, this.loadingScreen, () => {
                        window.loadingManager.startLoading(() => {
                            this.switchScreen(this.loadingScreen, this.startScreen);
                        });
                    });
                }, 400);
            });
        }

        // START Button Click
        if (this.btnStart) {
            this.btnStart.addEventListener('click', (e) => {
                this.createRipple(e, this.btnStart);

                // Make sure audio is playing
                if (window.audioManager && window.CONFIG && window.CONFIG.autoPlayMusicOnStart) {
                    if (!window.audioManager.isPlaying) {
                        window.audioManager.play();
                    }
                }

                setTimeout(() => {
                    this.switchScreen(this.startScreen, this.mainScreen, () => {
                        // Start Heart Animation Sequence
                        if (window.heartEngine) {
                            window.heartEngine.start();
                        }
                    });
                }, 400);
            });
        }
    }

    createRipple(event, button) {
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const rippleContainer = button.querySelector('.ripple-container') || button;
        rippleContainer.appendChild(circle);

        setTimeout(() => circle.remove(), 800);
    }

    switchScreen(fromScreen, toScreen, onComplete) {
        if (fromScreen) {
            fromScreen.classList.remove('active');
            setTimeout(() => {
                fromScreen.classList.add('hidden');
                if (toScreen) {
                    toScreen.classList.remove('hidden');
                    // Force reflow
                    void toScreen.offsetWidth;
                    toScreen.classList.add('active');
                    if (onComplete) onComplete();
                }
            }, 800); // Matches CSS opacity transition duration
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController();
});
