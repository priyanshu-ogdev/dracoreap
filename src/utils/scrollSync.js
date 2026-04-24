import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Scroll Orchestrator v10.0 (AUTONOMOUS LOOPS)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Dynamic Target Hydration: Silently skips missing DOM nodes and auto-rebinds when the engine refreshes.
 * - Environmental Synergy: The Orchestrator now darkens/brightens the scene lighting based on the dragon's state.
 * - Cinematic State Fading: Passes autonomous state signals directly to the DragonController.
 */
export class ScrollSync {
  constructor(appSystems = {}) {
    this.systems = {
      camera: appSystems.cameraController || appSystems.camera || null,
      dragon: appSystems.dragonController || appSystems.dragon || null,
      environment: appSystems.environmentShader || appSystems.environment || null,
      lightning: appSystems.lightningParticles || appSystems.lightning || null,
      flames: appSystems.flames || null
    };

    this.state = {
      currentSection: 'waking',
      isLocked: true
    };

    this.triggers = [];
    this._init();
  }

  _init() {
    // Wait for the UI layout controllers (IntroSection, etc.) to fully mount the DOM
    setTimeout(() => {
      this.state.isLocked = false;
      this._setupParallaxRail();
      this._setupAutonomousStates();
      ScrollTrigger.refresh();
      console.log('[ScrollSync] Orchestrator Armed & Synchronized.');
    }, 1500);
  }

  /**
   * The Camera is the only object directly bound to the scrollbar for physical parallax.
   */
  _setupParallaxRail() {
    if (!this.systems.camera) return;

    this.masterTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.0, // Smooth interpolation
      onUpdate: (self) => {
        this.systems.camera.setScrollProgress(self.progress);
      }
    });
  }

  /**
   * Maps DOM sections to autonomous 3D loops and lighting states.
   */
  _setupAutonomousStates() {
    // 1. Clear any existing triggers if this is a hot-reload
    this.triggers.forEach(t => t.kill());
    this.triggers = [];

    // 2. Define the cinematic sequence
    const sequence = [
      { id: 'intro',    state: 'waking',   mood: 'bright' },
      { id: 'skills',   state: 'striking', mood: 'stormy' },
      { id: 'projects', state: 'flying',   mood: 'dark' },
      { id: 'about',    state: 'idle',     mood: 'dim' }, // Changed 'roaring' to idle for about section
      { id: 'contact',  state: 'idle',     mood: 'abyss' }
    ];

    sequence.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      
      // Dynamic Hydration: If a section doesn't exist yet, skip it without throwing errors
      if (!el) {
        console.warn(`[ScrollSync] Section #${cfg.id} not found in DOM. Skipping trigger.`);
        return; 
      }

      this.triggers.push(ScrollTrigger.create({
        trigger: el,
        start: "top 55%", // Trigger slightly before center
        end: "bottom 45%",
        onEnter: () => this._requestState(cfg.state, cfg.mood),
        onEnterBack: () => this._requestState(cfg.state, cfg.mood),
      }));
    });
  }

  /**
   * Fires a command to all 3D subsystems to transition to the new cinematic state.
   */
  _requestState(newState, mood) {
    if (this.state.isLocked || this.state.currentSection === newState) return;
    this.state.currentSection = newState;

    console.log(`[ScrollSync] Director Signal: Transition to ${newState.toUpperCase()} (${mood})`);

    // 1. Dragon State Machine
    if (this.systems.dragon && typeof this.systems.dragon.setState === 'function') {
      this.systems.dragon.setState(newState);
    }

    // 2. Lighting Synergy
    this._shiftLightingMood(mood);

    // 3. One-Shot VFX Events
    const dragonPos = this.systems.dragon?.dragonPosition || new THREE.Vector3(0,0,-2);
    
    if (newState === 'roaring') {
      if (this.systems.lightning) this.systems.lightning.triggerBurst(null, 3);
      if (this.systems.camera) this.systems.camera.triggerShake(2.0, 1.0);
    } else if (newState === 'striking') {
      if (this.systems.lightning) this.systems.lightning.triggerBurst(dragonPos, 1);
    }
  }

  /**
   * Smoothly interpolates the scene lighting based on the current section.
   */
  _shiftLightingMood(mood) {
    if (!this.systems.environment) return;

    const env = this.systems.environment;
    const tl = gsap.timeline();

    // These values target properties that should exist on your EnvironmentShader/Controller
    switch(mood) {
      case 'bright':
        tl.to(env, { ambientIntensity: 0.8, fogDensity: 0.02, duration: 1.5 });
        break;
      case 'stormy':
        tl.to(env, { ambientIntensity: 0.3, fogDensity: 0.05, duration: 1.0 });
        break;
      case 'dark':
        tl.to(env, { ambientIntensity: 0.1, fogDensity: 0.06, duration: 2.0 });
        break;
      case 'dim':
        tl.to(env, { ambientIntensity: 0.4, fogDensity: 0.04, duration: 1.5 });
        break;
      case 'abyss':
        tl.to(env, { ambientIntensity: 0.05, fogDensity: 0.08, duration: 2.5 });
        break;
    }
  }

  /**
   * Call this if the DOM heavily changes (e.g., expanding an accordion).
   */
  refresh() { 
    ScrollTrigger.refresh(); 
    this._setupAutonomousStates(); // Rebinds to any newly injected DOM nodes
  }

  dispose() {
    console.log('[ScrollSync] Shutting down Orchestrator...');
    if (this.masterTrigger) this.masterTrigger.kill();
    this.triggers.forEach(t => t.kill());
    this.triggers = [];
    gsap.killTweensOf(this.systems.environment);
  }
}