import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 1. Utilities & Managers
import { dataManager } from './utils/jsonLoader.js'; 
import { responsiveManager } from './utils/responsive.js';
import { a11yManager } from './utils/accessibility.js';
import { ScrollSync } from './utils/scrollSync.js';

// 2. WebGL Core Systems
import { SceneManager } from './core/scene/SceneManager.js';
import { CameraController } from './core/camera/CameraController.js';
import { DragonController } from './core/dragon/DragonController.js';
import { FlameParticles } from './core/particles/FlameParticles.js';
import { LightningParticles } from './core/particles/LightningParticles.js';

// 3. DOM Section Controllers (Updated to src/sections/*)
import * as IntroSection from './sections/IntroSection.js';
// import { WorkExperienceSection } from './sections/WorkExperienceSection.js';
// import { CertificateSection } from './sections/CertificateSection.js';
import { SkillsSection } from './sections/SkillsSection.js';
import { ProjectsSection } from './sections/ProjectsSection.js';
import { AboutSection } from './sections/AboutSection.js';
import { ContactSection } from './sections/ContactSection.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Application Bootstrapper v12.0 (OBSIDIAN TEMPEST)
 * * Architectural Upgrades:
 * - Hard Vertical Floor: Dropped all Y-coordinates significantly (-4.5 to -5.5) to prevent the dragon from clipping the top of the screen.
 * - Deep Cinematic Zoom: Pushed the Projects section Z-coordinate to -13.0 to frame the entire dragon while it flies.
 */
class App {
  constructor() {
    this.systems = {};
    this.sections = {};
    this.data = null;
    this.gltf = null;
    
    this.loaderOverlay = document.getElementById('global-loader');
    this.loaderSubtext = this.loaderOverlay?.querySelector('.loader-subtext');

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this._renderLoop = this._renderLoop.bind(this);
  }

  async boot() {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    console.log('⚡ IGNITING OBSIDIAN TEMPEST ARCHITECTURE ⚡');
    
    try {
      const canvasEl = document.getElementById('webgl-canvas');
      if (a11yManager && canvasEl) a11yManager.registerWebGLCanvas(canvasEl);

      const sysConfig = responsiveManager.getSystemConfig();
      
      this._updateLoaderText('Decrypting Profile Data...');
      this.data = await dataManager.load('/data/portfolio_data.json');
      
      await this._loadDragonGeometry();
      await this._initWebGL(sysConfig);
      
      this._mountSections();
      
      // Unified flight orchestration for all viewport sections
      this._orchestrateDynamicFlight();

      this.systems.scrollSync = new ScrollSync(this.systems);

      requestAnimationFrame(this._renderLoop);

      setTimeout(() => {
        this._removeLoader();
      }, 500);

    } catch (error) {
      console.error('❌ CRITICAL SYSTEM FAILURE:', error);
      this._showFatalError(error);
    }
  }

  async _loadDragonGeometry() {
    return new Promise((resolve, reject) => {
      this._updateLoaderText('Summoning Sovereign Geometry... 0%');
      const loader = new GLTFLoader();

      loader.load(
        '/assets/models/dragon.glb',
        (gltf) => {
          this.gltf = gltf;
          resolve();
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
            this._updateLoaderText(`Summoning Sovereign Geometry... ${percentComplete}%`);
          }
        },
        (error) => reject(new Error(`Failed to load Dragon.glb: ${error.message}`))
      );
    });
  }

  async _initWebGL(sysConfig) {
    this._updateLoaderText('Igniting WebGL Shaders...');

    this.systems.sceneManager = new SceneManager('#webgl-canvas', {
      quality: sysConfig.qualityTier,
      enablePostProcessing: sysConfig.enablePostProcessing,
      enableShadows: sysConfig.enableShadows,
      stormIntensity: 0.7
    });
    await this.systems.sceneManager.setup();

    const coreScene = this.systems.sceneManager.scene;
    const coreCamera = this.systems.sceneManager.camera;

    this.systems.flames = new FlameParticles(coreScene, {
      maxParticles: sysConfig.flameParticleCount,
      qualityTier: sysConfig.qualityTier
    });
    
    this.systems.lightning = new LightningParticles(coreScene, {
      maxSegments: sysConfig.maxLightningSegments,
      qualityTier: sysConfig.qualityTier
    });

    this.systems.dragon = new DragonController(coreScene, this.gltf, {
      flames: this.systems.flames,
      lightning: this.systems.lightning,
      enableShadows: sysConfig.enableShadows,
      qualityTier: sysConfig.qualityTier
    });

    this.systems.camera = new CameraController(coreCamera, {
      reducedMotion: this.isReducedMotion
    });

    this.systems.sceneManager.injectControllers(
      this.systems.camera, 
      this.systems.dragon, 
      this.systems.lightning, 
      this.systems.flames
    );
  }

  _mountSections() {
    this._updateLoaderText('Forging DOM Architecture...');

    const domNodes = {
      intro: document.getElementById('intro'),
      workExp: document.getElementById('work-experience'),
      certificates: document.getElementById('certificates'),
      skills: document.getElementById('skills'),
      projects: document.getElementById('projects'),
      about: document.getElementById('about'),
      contact: document.getElementById('contact')
    };

    // Hydrate controllers (will gracefully skip missing DOM nodes)
    if (domNodes.intro) this.sections.intro = new IntroSection.IntroSection(domNodes.intro, this.data.profile, this.systems);
    // if (domNodes.workExp) this.sections.workExp = new WorkExperienceSection(domNodes.workExp, this.data.work_experience);
    // if (domNodes.certificates) this.sections.certificates = new CertificateSection(domNodes.certificates, this.data.certificates);
    if (domNodes.skills) this.sections.skills = new SkillsSection(domNodes.skills, this.data.skills);
    if (domNodes.projects) this.sections.projects = new ProjectsSection(domNodes.projects, this.data.projects, this.systems);
    if (domNodes.about) this.sections.about = new AboutSection(domNodes.about, this.data, this.systems);
    if (domNodes.contact) this.sections.contact = new ContactSection(domNodes.contact, this.data, this.systems);

    Object.values(this.sections).forEach(section => {
      if (section && typeof section.init === 'function') section.init();
    });
  }

  /**
   * ⚡ DYNAMIC CINEMATIC FLIGHT CHOREOGRAPHER ⚡
   */
_orchestrateDynamicFlight() {
    const dragonGroup = this.systems.dragon?.dragonGroup;
    const controller = this.systems.dragon;
    if (!dragonGroup || !controller || this.isReducedMotion) return;

    // REMOVED work-experience and certificates
    const sectionIds = ['intro', 'skills', 'projects', 'about', 'contact'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    const flightPath = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.8, 
      }
    });

    // 5 WAYPOINTS to match the 5 remaining sections
    const waypoints = [
      { pos: { x: 0, y: -5.5, z: -4.0 }, rot: { x: 0, y: 0, z: 0 } },           // Intro
      { pos: { x: 3.5, y: -5.0, z: -5.0 }, rot: { x: 0.2, y: 0.3, z: 0 } },     // Skills
      { pos: { x: -4.5, y: -5.5, z: -13.0 }, rot: { x: 0.0, y: -0.8, z: 0.2 } },// Projects 
      { pos: { x: 2.0, y: -5.0, z: -6.0 }, rot: { x: 0.2, y: 0.2, z: 0 } },     // About
      { pos: { x: 0, y: -5.5, z: -4.0 }, rot: { x: 0, y: 0, z: 0 } }            // Contact
    ];

    sections.forEach((section, index) => {
      const wp = waypoints[index] || waypoints[waypoints.length - 1];
      
      if (index > 0) {
        flightPath.to(dragonGroup.position, { ...wp.pos, ease: "sine.inOut" }, index);
        flightPath.to(dragonGroup.rotation, { ...wp.rot, ease: "sine.inOut" }, index);
      }

      let state = 'flying';
      if (section.id === 'intro') state = 'waking';
      if (section.id === 'skills') state = 'striking';
      if (section.id === 'contact') state = 'roaring'; 

      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => controller.setState(state),
        onEnterBack: () => controller.setState(state),
      });
    });
  }
  
  _renderLoop(timestamp) {
    requestAnimationFrame(this._renderLoop);
    this.systems.sceneManager.render(); 
  }

  _updateLoaderText(text) {
    if (this.loaderSubtext) this.loaderSubtext.innerText = text;
  }

  _removeLoader() {
    if (!this.loaderOverlay) return;
    
    gsap.to(this.loaderOverlay, {
      opacity: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        this.loaderOverlay.remove();
      }
    });
  }

  _showFatalError(error) {
    const errorMsg = error.stack || error.message;
    document.body.innerHTML = `
      <div style="color:#00ffff; padding: 2rem; font-family: monospace; background: #010204; height: 100vh; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 1.5rem; z-index: 99999; position: relative;">
        <h2 style="color:#ff3300; border-bottom: 1px solid #ff3300; padding-bottom: 0.5rem; text-transform: uppercase;">Core Overheat: System Boot Failure</h2>
        <pre style="white-space: pre-wrap; background: rgba(0,255,255,0.05); padding: 1rem; border-radius: 4px; max-width: 800px; line-height: 1.5;">${errorMsg}</pre>
        <button onclick="location.reload()" style="background:rgba(0,255,255,0.1); color:#00ffff; border:1px solid #00ffff; padding:10px 20px; cursor:pointer; font-family: monospace; text-transform: uppercase; letter-spacing: 2px;">Re-Initialize Protocol</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.boot();
});