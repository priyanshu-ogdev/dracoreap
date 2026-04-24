import * as THREE from 'three';
import gsap from 'gsap';

/**
 * LightingSetup v8.0 – "Pure Cinematic Directional"
 * ═══════════════════════════════════════════════════════════════════════
 * * Architectural Upgrades:
 * - PointLight Purge: Completely eradicated `SpineGlow` and `OceanGlow` PointLights. These were reflecting off the metallic scales and looking like rogue white particles.
 * - Strict Directional Lighting: The scene now relies entirely on Hemisphere and Directional lights to guarantee smooth, professional shading with zero hot-spot blowouts.
 * - Flawless State Transitions: Fixed the scroll-up/scroll-down glitch by ensuring only global environment intensities scale during transitions.
 */
export class LightingSetup {
  static StatePresets = {
    sleeping: {
      ambient: 0.6,       // neutral dark gray
      key: 1.2,           // warm white
      rift: 0.1,          // barely visible red fill
      rim: 0.8,           // subtle cyan rim
      shadowIntensity: 0.4,
      colorTemp: 4500,    // warm white
    },
    waking: {
      ambient: 0.4,
      key: 1.0,
      rift: 0.15,
      rim: 1.2,
      shadowIntensity: 0.6,
      colorTemp: 5500,
    },
    flying: {
      ambient: 0.2,
      key: 0.8,
      rift: 0.2,
      rim: 1.8,
      shadowIntensity: 0.8,
      colorTemp: 6500,
    },
    striking: {
      ambient: 0.1,
      key: 0.4,
      rift: 0.25,
      rim: 2.5,
      shadowIntensity: 1.0,
      colorTemp: 7500,
    },
    roaring: {
      ambient: 0.25,
      key: 1.2,
      rift: 0.3,
      rim: 3.0,
      shadowIntensity: 1.0,
      colorTemp: 6000,
    },
    aggressive: {
      ambient: 0.25,
      key: 2.0,
      rift: 0.35,
      rim: 4.0,
      shadowIntensity: 1.0,
      colorTemp: 8000,
    }
  };

  constructor(scene, options = {}) {
    this.scene = scene;
    this.config = {
      qualityTier: options.qualityTier || 'high',
      enableShadows: options.enableShadows ?? true,
      lightningFlashDuration: options.lightningFlashDuration ?? 1.2,
      enableColorTempShift: options.enableColorTempShift ?? true,
      ...options
    };

    this.lights = {
      ambient: null,      // Hemisphere – neutral dark gray base
      key: null,          // Directional – primary warm white key
      riftFill: null,     // Directional – extremely subtle atmospheric fill
      rim: null,          // Directional – cyan edge rim
    };

    this.globalFlashState = { value: 0.0 };
    this.currentState = 'sleeping';
    this.lightningActive = false;
    this._eventListeners = {};

    this.update = this.update.bind(this);
    this.triggerLightningFlash = this.triggerLightningFlash.bind(this);

    console.log('[LightingSetup] v8.0 – Pure Cinematic Directional Armed.');
  }

  setup() {
    this._createAmbient();
    this._createKeyLight();
    this._createRiftFillLight();
    this._createRimLight();
    this._applyQualityTier();
    this.setState('waking', { duration: 0 }); // Start awake by default for intro alignment
  }

  _createAmbient() {
    // Neutral dark gray (top) and near-black (bottom). Zero color tint to let shaders shine.
    this.lights.ambient = new THREE.HemisphereLight(0x222222, 0x050505, 0.6);
    this.lights.ambient.name = 'NeutralHemisphere';
    this.scene.add(this.lights.ambient);
  }

  _createKeyLight() {
    // Warm white directional light
    this.lights.key = new THREE.DirectionalLight(0xfff5e6, 1.2);
    this.lights.key.name = 'WarmKeyLight';
    this.lights.key.position.set(-12, 25, 18);
    this.lights.key.castShadow = this.config.enableShadows;
    
    if (this.config.enableShadows) {
      this.lights.key.shadow.mapSize.set(2048, 2048);
      this.lights.key.shadow.camera.near = 0.5;
      this.lights.key.shadow.camera.far = 100;
      const d = 20;
      this.lights.key.shadow.camera.left = -d;
      this.lights.key.shadow.camera.right = d;
      this.lights.key.shadow.camera.top = d;
      this.lights.key.shadow.camera.bottom = -d;
      this.lights.key.shadow.bias = -0.0005;
      this.lights.key.shadow.normalBias = 0.05;
    }
    this.scene.add(this.lights.key);
  }

  _createRiftFillLight() {
    // Very weak directional fill to give shadows depth
    this.lights.riftFill = new THREE.DirectionalLight(0x442222, 0.15);
    this.lights.riftFill.name = 'SubtleRiftFill';
    this.lights.riftFill.position.set(12, 18, -8);
    this.scene.add(this.lights.riftFill);
  }

  _createRimLight() {
    // Sharp edge lighting from behind
    this.lights.rim = new THREE.DirectionalLight(0x226688, 0.8);
    this.lights.rim.name = 'SubtleRim';
    this.lights.rim.position.set(-8, 5, -22);
    this.scene.add(this.lights.rim);
  }

  _applyQualityTier() {
    const tier = this.config.qualityTier;
    if (tier === 'low') {
      this.config.enableShadows = false;
      if (this.lights.key) this.lights.key.castShadow = false;
    } else if (tier === 'medium') {
      if (this.lights.key) this.lights.key.shadow.mapSize.set(1024, 1024);
    }
  }

  setState(state, options = {}) {
    if (this.currentState === state && options.duration !== 0) return;
    const preset = LightingSetup.StatePresets[state];
    if (!preset) return;

    const prev = this.currentState;
    this.currentState = state;
    const duration = options.duration ?? 1.5;
    const ease = options.ease || 'power2.inOut';

    gsap.killTweensOf([
      this.lights.ambient,
      this.lights.key,
      this.lights.riftFill,
      this.lights.rim
    ]);

    // Smoothly interpolate directional intensities based on scroll section
    gsap.to(this.lights.ambient, { intensity: preset.ambient, duration, ease });
    gsap.to(this.lights.key, { intensity: preset.key, duration, ease });
    gsap.to(this.lights.riftFill, { intensity: preset.rift, duration, ease });
    gsap.to(this.lights.rim, { intensity: preset.rim, duration, ease });

    if (this.config.enableColorTempShift) {
      const color = this._tempToRGB(preset.colorTemp);
      gsap.to(this.lights.key.color, {
        r: color.r, g: color.g, b: color.b,
        duration: duration * 0.8, ease
      });
    }

    this._emit('stateChange', { state, prev });
  }

  /**
   * ⚡ GLOBAL ENVIRONMENTAL STRIKE
   * Flashes the global directional lights to simulate lightning illuminating the sky.
   */
  triggerLightningFlash() {
    if (this.lightningActive) return;
    this.lightningActive = true;

    const preset = LightingSetup.StatePresets[this.currentState] || LightingSetup.StatePresets.flying;
    const baseKeyInt = preset.key;
    const peakKeyInt = baseKeyInt + 12.0; 

    const tl = gsap.timeline({ onComplete: () => { this.lightningActive = false; } });

    // Pre-strikes (rapid flicker)
    tl.to(this.lights.key, { intensity: peakKeyInt * 0.4, duration: 0.05, ease: "none" })
      .to(this.lights.key, { intensity: 0, duration: 0.05, ease: "none" })
      .to(this.lights.key, { intensity: peakKeyInt * 0.7, duration: 0.03, ease: "none" })
      .to(this.lights.key, { intensity: 0, duration: 0.05, ease: "none" });

    // Main strike flash (global exposure spike)
    tl.to(this.lights.key.color, { r: 1.0, g: 1.0, b: 1.0, duration: 0.05 }, "<");
    tl.to(this.lights.key, { intensity: peakKeyInt, duration: 0.08, ease: "power4.out" });
    tl.to(this.globalFlashState, { value: 1.0, duration: 0.08, ease: "power4.out" }, "<");

    tl.to(this.lights.ambient, { intensity: Math.min(preset.ambient + 0.4, 1.2), duration: 0.08, ease: "power2.out" }, "<");
    tl.to(this.lights.rim, { intensity: preset.rim + 2.0, duration: 0.08, ease: "power2.out" }, "<");

    // Smooth decay back to the section's preset
    tl.to(this.lights.key, { intensity: preset.key, duration: this.config.lightningFlashDuration, ease: "expo.out" });
    
    const baseColor = this._tempToRGB(preset.colorTemp);
    tl.to(this.lights.key.color, { r: baseColor.r, g: baseColor.g, b: baseColor.b, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.lights.ambient, { intensity: preset.ambient, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.lights.rim, { intensity: preset.rim, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");
    tl.to(this.globalFlashState, { value: 0.0, duration: this.config.lightningFlashDuration, ease: "expo.out" }, "<");

    this._emit('lightningFlash', { timestamp: performance.now() });
  }

  update(delta, context = {}) {
    // Track the Key Light Target to the dragon so shadows remain crisp
    if (context.dragonPosition && this.lights.key.target) {
      this.lights.key.target.position.lerp(context.dragonPosition, 0.1);
      this.lights.key.target.updateMatrixWorld();
    }
  }

  setQualityTier(tier) {
    this.config.qualityTier = tier;
    this._applyQualityTier();
  }

  _tempToRGB(temp) {
    const t = temp / 100;
    let r, g, b;
    if (t <= 66) {
      r = 255;
      g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(t) - 161.1195681661));
      b = t <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(t - 10) - 305.0447927307));
    } else {
      r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(t - 60, -0.1332047592)));
      g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(t - 60, -0.0755148492)));
      b = 255;
    }
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.error(e); }
    });
  }

  on(event, cb) {
    if (!this._eventListeners[event]) this._eventListeners[event] = [];
    this._eventListeners[event].push(cb);
    return () => {
      this._eventListeners[event] = this._eventListeners[event].filter(c => c !== cb);
    };
  }

  dispose() {
    gsap.killTweensOf([
      this.lights.ambient,
      this.lights.key,
      this.lights.riftFill,
      this.lights.rim,
      this.globalFlashState
    ]);
    if (this.lights.key?.color) gsap.killTweensOf(this.lights.key.color);

    Object.values(this.lights).forEach(l => {
      if (l?.isLight) {
        this.scene.remove(l);
      }
    });

    this._eventListeners = {};
  }
}