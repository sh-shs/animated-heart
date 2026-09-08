/**
 * Configuration Options for the Cinematic Interactive Romantic Experience
 * Modify any values here to customize the website text, timing, particle densities, and colors.
 */
window.CONFIG = {
    // Website & UI Texts
    siteTitle: "For Someone Special ❤️",
    openText: "OPEN",
    welcomeSubtitle: "Something special is waiting for you...",
    loadingText: "Preparing something special...",
    loadingCompleteText: "Ready ❤️",
    startTitle: "Are you ready?",
    startText: "START",
    finalTitle: "For Someone Special ❤️",
    finalMessage: "Some things are better felt than explained.",

    // Audio Settings
    musicFile: "assets/music.mp3",
    autoPlayMusicOnStart: true,
    audioVolume: 0.5,

    // Loading Screen Settings
    loadingDurationMs: 3800, // Duration in milliseconds for 0% to 100%

    // Heart Animation Settings
    heartSizeScale: 1.0,      // Scale multiplier for heart size
    outlineParticleCount: 350, // Particles making up the outline path
    fillParticleCount: 1800,   // Particles filling the interior
    floatingParticleCount: 120, // Particles floating around the heart
    mobileParticleScale: 0.6,  // Reduction multiplier on smaller screens for performance

    // Color Palette
    colors: {
        primaryPink: "#ff3366",
        softPink: "#ff6699",
        brightRose: "#ff99bb",
        goldGlow: "#ffd700",
        whiteGlow: "#ffffff"
    },

    // Camera & Lighting Timing
    cameraZoomDelayMs: 6000,   // When camera zoom / bright glow activates after heart starts building
    textRevealDelayMs: 9500     // When text reveals after heart construction completes
};
