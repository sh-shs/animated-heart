/**
 * Audio Manager with Web Audio API Fallback
 * Handles background music playback, volume fading, and soft ambient synth pad fallback.
 */
class AudioManager {
    constructor() {
        this.audioElement = document.getElementById('bg-music');
        this.toggleBtn = document.getElementById('audio-toggle');
        this.iconElement = this.toggleBtn ? this.toggleBtn.querySelector('.audio-icon') : null;

        this.isPlaying = false;
        this.audioCtx = null;
        this.isFallbackSynthRunning = false;
        this.synthGain = null;
        this.oscillators = [];

        this.init();
    }

    init() {
        if (!this.toggleBtn) return;

        if (window.CONFIG && window.CONFIG.musicFile) {
            const sourceEl = this.audioElement.querySelector('source');
            if (sourceEl) sourceEl.src = window.CONFIG.musicFile;
        }

        this.audioElement.volume = (window.CONFIG && window.CONFIG.audioVolume) || 0.5;

        // Toggle button listener
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });

        // Error handling on audio element to trigger synthesized ambient audio fallback
        this.audioElement.addEventListener('error', () => {
            console.log("Audio file missing or restricted. Ready to use ambient synth pad fallback on user interaction.");
        });
    }

    showButton() {
        if (this.toggleBtn) {
            this.toggleBtn.classList.remove('hidden');
        }
    }

    play() {
        this.showButton();

        // Attempt playing audio element
        const playPromise = this.audioElement.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI(true);
            }).catch(err => {
                console.log("HTML5 Audio play prevented/failed. Starting synthesized ambient audio fallback:", err);
                this.startAmbientSynth();
            });
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audioElement.pause();
            if (this.isFallbackSynthRunning) {
                this.stopAmbientSynth();
            }
            this.isPlaying = false;
            this.updateUI(false);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    updateUI(playing) {
        if (!this.toggleBtn || !this.iconElement) return;
        if (playing) {
            this.toggleBtn.classList.add('playing');
            this.iconElement.textContent = '🔊';
        } else {
            this.toggleBtn.classList.remove('playing');
            this.iconElement.textContent = '🔇';
        }
    }

    /**
     * Web Audio API Synthesized Ambient Chords (Fallback when no music.mp3 exists)
     */
    startAmbientSynth() {
        if (this.isFallbackSynthRunning) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!this.audioCtx) {
                this.audioCtx = new AudioContext();
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            // F frequencies (Hz) for a dreamy romantic ambient chord (Fmaj9 / A minor)
            const freqs = [174.61, 220.00, 261.63, 329.63, 392.00, 523.25];

            this.synthGain = this.audioCtx.createGain();
            this.synthGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
            // Fade in over 3 seconds
            this.synthGain.gain.exponentialRampToValueAtTime(0.15, this.audioCtx.currentTime + 3);

            // Filter for warm soft tone
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);

            this.synthGain.connect(filter);
            filter.connect(this.audioCtx.destination);

            this.oscillators = freqs.map((freq) => {
                const osc = this.audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

                // Subtle LFO modulation for organic warmth
                const lfo = this.audioCtx.createOscillator();
                lfo.frequency.setValueAtTime(0.2 + Math.random() * 0.1, this.audioCtx.currentTime);
                const lfoGain = this.audioCtx.createGain();
                lfoGain.gain.setValueAtTime(1.5, this.audioCtx.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start();

                osc.connect(this.synthGain);
                osc.start();
                return osc;
            });

            this.isFallbackSynthRunning = true;
            this.isPlaying = true;
            this.updateUI(true);
        } catch (e) {
            console.error("Failed to start Web Audio ambient fallback:", e);
        }
    }

    stopAmbientSynth() {
        if (!this.isFallbackSynthRunning || !this.synthGain || !this.audioCtx) return;

        this.synthGain.gain.setValueAtTime(this.synthGain.gain.value, this.audioCtx.currentTime);
        this.synthGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1);

        setTimeout(() => {
            this.oscillators.forEach(osc => osc.stop());
            this.oscillators = [];
            this.isFallbackSynthRunning = false;
        }, 1000);
    }
}

window.audioManager = null;
window.addEventListener('DOMContentLoaded', () => {
    window.audioManager = new AudioManager();
});
