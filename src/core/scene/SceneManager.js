import * as THREE from 'three';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { EnvironmentShader } from './EnvironmentShader.js'; 

/**
 * Industry-Grade Cinematic Scene Manager v10.0 (OBSIDIAN TEMPEST)
 * Acts as the master clock and WebGL orchestrator for the cinematic systems.
 * Upgrades: Procedural IBL (Fixes Black Dragon), Precision sync, and Atmospheric Flash.
 */
export class SceneManager {
  static QualityTier = {
    LOW: { name: 'low', antialias: false, shadows: false, postProcessing: false, pixelRatioCap: 1.0, bloomStrength: 0, shadowResolution: 512 },
    MEDIUM: { name: 'medium', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 1.5, bloomStrength: 0.8, shadowResolution: 1024 },
    HIGH: { name: 'high', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 2.0, bloomStrength: 1.2, shadowResolution: 2048 },
    ULTRA: { name: 'ultra', antialias: true, shadows: true, postProcessing: true, pixelRatioCap: 2.0, bloomStrength: 1.5, shadowResolution: 4096 },
  };

  constructor(canvasSelector, options = {}) {
    this.canvas = document.querySelector(canvasSelector);
    if (!this.canvas) throw new Error(`SceneManager: Canvas "${canvasSelector}" not found`);

    const tierConfig = SceneManager.QualityTier[options.quality?.toUpperCase()] || SceneManager.QualityTier.HIGH;
    this.config = {
      quality: options.quality || 'high',
      enablePostProcessing: options.enablePostProcessing ?? true,
      enableShadows: options.enableShadows ?? true,
      autoAdjustQuality: options.autoAdjustQuality ?? true,
      enableFallback: options.enableFallback ?? true,
      stormIntensity: 0.7,
      ...tierConfig,
      ...options,
    };

    // Core Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.clock = new THREE.Clock(); 
    
    // Cinematic Systems (Injected later)
    this.environment = null; 
    this.cameraController = null;
    this.dragonController = null;
    this.lightning = null;
    this.flames = null;

    // State
    this.isInitialized = false;
    this.isContextLost = false;
    this.fallbackMode = false;
    this._scrollProgress = 0;
    
    this.performance = { startTime: 0, frameCount: 0, lastFpsCheck: performance.now(), currentFps: 60, consecutiveLowFps: 0 };
    this._eventListeners = {};
    
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this._onContextLost = this._onContextLost.bind(this);
    this._onContextRestored = this._onContextRestored.bind(this);
  }

  _detectCapabilities() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { antialias: false }) || canvas.getContext('webgl', { antialias: false });
      if (!gl) return { webgl: false, performance: 'low', renderer: 'none' };
      const renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isLowEnd = /Intel HD Graphics|AMD Radeon R[3-5]|Mali-4|Adreno [3-4]|PowerVR/i.test(renderer);
      return { webgl: true, webgl2: !!canvas.getContext('webgl2'), maxTextureSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, 4096), isMobile, isLowEnd, performance: isLowEnd || isMobile ? 'low' : 'high', renderer };
    } catch (error) {
      return { webgl: false, performance: 'low', renderer: 'error' };
    }
  }

  _applyCanvasStyles() {
    if (this.canvas.parentElement !== document.body) {
      document.body.appendChild(this.canvas);
    }
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '-1'; 
    this.canvas.style.pointerEvents = 'none'; 
    this.canvas.style.display = 'block';
  }

  async setup() {
    console.log('[SceneManager] Stage Armed. Synchronized with Protocol v10.0');
    
    try {
      this._applyCanvasStyles();
      this.capabilities = this._detectCapabilities();
      
      if (!this.capabilities.webgl && this.config.enableFallback) return this._enableFallbackMode();
      
      if (this.config.autoAdjustQuality && this.capabilities.performance === 'low') this._applyQualityTier('low');
      else this._applyQualityTier(this.config.quality);
      
      await this._setupRenderer(); // MUST setup renderer before PMREM
      await this._setupScene();
      await this._setupCamera();
      
      // ⚡ CRITICAL FIX: Generate environment reflection map for the dragon's scales
      this._setupEnvironmentMap();

      await this._setupLighting();      
      
      if (this.config.postProcessing && this.config.enablePostProcessing) {
        await this._setupPostProcessing();
      }

      // Initialize the core environment (Void + Ocean)
      this.environment = new EnvironmentShader(this.scene, this.renderer, this.config);
      
      // 🛑 THE CRITICAL FIX: Prevent Three.js from deleting the sky and push it back
      if (this.environment.mesh) {
        this.environment.mesh.frustumCulled = false;
        this.environment.mesh.renderOrder = -1000;
      }
      
      this._setupEventHandlers();
      
      this.isInitialized = true;
      this.performance.startTime = performance.now(); 
      
      this._emit('ready', { scene: this.scene, camera: this.camera, renderer: this.renderer });
      return this;
      
    } catch (error) {
      console.error('❌ SceneManager setup failed:', error);
      if (this.config.enableFallback && !this.fallbackMode) return this._enableFallbackMode();
      throw error;
    }
  }

  /**
   * Generates a virtual lighting studio in the background.
   * This is REQUIRED for MeshPhysicalMaterial to reflect color properly.
   */
  _setupEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create a virtual "Studio" scene for reflection data
    const envScene = new THREE.Scene();
    const bg = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide })
    );
    envScene.add(bg);

    // Add high-contrast white light sources for the chrome/metallic parts to reflect
    const light1 = new THREE.PointLight(0xffffff, 50);
    light1.position.set(5, 5, 5);
    envScene.add(light1);

    const envMap = pmremGenerator.fromScene(envScene).texture;
    this.scene.environment = envMap;
    this.scene.environmentIntensity = 1.0;
  }

  async _enableFallbackMode() {
    this.fallbackMode = true;
    this.config.enablePostProcessing = false;
    this.config.enableShadows = false;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#010409'); 
    
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 12);
    
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    
    await this._setupLighting();
    
    this.isInitialized = true;
    this._emit('ready', { scene: this.scene, camera: this.camera, fallback: true });
    return this;
  }

  _applyQualityTier(tierName) {
    const tier = SceneManager.QualityTier[tierName.toUpperCase()] || SceneManager.QualityTier.HIGH;
    Object.assign(this.config, tier);
    this.config.quality = tier.name;
  }

  async _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.name = 'ObsidianTempest_Stage';
    this.scene.background = new THREE.Color('#010205'); 
  }

  async _setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.name = 'CinematicCamera';
    this.camera.position.set(0, 1.5, 6);
  }

  async _setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    // Key Light to showcase the Dragon's base colors
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = this.config.enableShadows;
    if (this.config.enableShadows) {
      keyLight.shadow.mapSize.width = this.config.shadowResolution;
      keyLight.shadow.mapSize.height = this.config.shadowResolution;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(keyLight);

    // ⚡ FIX: Replaced the overpowering blue light with a Golden rim light
    const rimLight = new THREE.DirectionalLight('#ffc800', 1.0);
    rimLight.position.set(-10, 10, -10);
    this.scene.add(rimLight);
  }

  async _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias,
      alpha: false, 
      powerPreference: 'high-performance',
      stencil: false,
      precision: 'highp' // ⚡ CRITICAL FIX: Forces High Precision to avoid Shader Errors
    });

    this.renderer.sortObjects = true;
    this.renderer.setClearColor(new THREE.Color('#010205'), 1.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; 
    
    if (this.config.shadows && this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.canvas.addEventListener('webglcontextlost', this._onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);
  }

  _onContextLost(event) {
    event.preventDefault();
    this.isContextLost = true;
  }

  _onContextRestored() {
    this.isContextLost = false;
    if (this.renderer) this.renderer.resetState();
  }

  async _setupPostProcessing() {
    if (!this.config.postProcessing || this.fallbackMode) return;

    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));

      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      if (this.config.bloomStrength > 0) {
        this._bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          this.config.bloomStrength, 
          0.6,
          1.5  
        );
        this.composer.addPass(this._bloomPass);
      }

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);

    } catch (error) {
      console.warn('[SceneManager] Post-processing setup failed, falling back:', error);
      this.composer = null;
      this.config.postProcessing = false;
    }
  }
  
  injectControllers(cameraCtrl, dragonCtrl, lightningVFX, flamesVFX) {
      this.cameraController = cameraCtrl;
      this.dragonController = dragonCtrl;
      this.lightning = lightningVFX;
      this.flames = flamesVFX;
  }

  setScrollProgress(progress) {
    this._scrollProgress = Math.min(1, Math.max(0, progress));
    
    if (this.cameraController) this.cameraController.setScrollProgress(this._scrollProgress);
    // Dragon is autonomous, no longer scrubbed
  }

  async _setupEventHandlers() {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.resize(window.innerWidth, window.innerHeight), 100);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    this._cleanupHandlers = () => {
      window.removeEventListener('resize', handleResize);
      this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
      clearTimeout(resizeTimeout);
    };
  }

  resize(width, height) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
    
    if (this.composer && this.config.postProcessing) {
      this.composer.setSize(width, height);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatioCap));
      if (this._bloomPass) this._bloomPass.resolution.set(width, height);
    }
    
    if (this.environment) this.environment.resize();
  }

  startLoop() {
    const loop = () => { this._rafId = requestAnimationFrame(loop); this.render(); };
    loop();
  }

  stopLoop() { if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; } }

  render() {
    if (this.isContextLost || !this.isInitialized) return;
    this._updatePerformanceMetrics();

    const delta = Math.min(this.clock.getDelta(), 0.1); 

    const currentFlash = this.lightning ? this.lightning.globalFlashIntensity : 0;
    
    // ⚡ FIX: Sync global exposure to the lightning flashes for massive impact
    if (currentFlash > 0.1) {
        this.renderer.toneMappingExposure = 1.0 + (currentFlash * 1.5);
    } else {
        this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, 1.0, 0.1);
    }

    const dragonPos = this.dragonController ? this.dragonController.dragonPosition : null;

    if (this.cameraController) this.cameraController.update(delta, dragonPos);
    if (this.dragonController) this.dragonController.update(delta);
    if (this.lightning) this.lightning.update(delta, { stormIntensity: this.config.stormIntensity });
    if (this.flames) this.flames.update(delta, { dragonPosition: dragonPos });

    if (this.environment) {
      this.environment.update(delta, {
        scrollProgress: this._scrollProgress,
        stormIntensity: this.config.stormIntensity,
        lightningFlash: currentFlash,
        camera: this.camera,
        dragonPosition: dragonPos || new THREE.Vector3(0,0,0)
      });
    }

    try {
      if (this.composer && this.config.postProcessing && !this.fallbackMode) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error('[SceneManager] Render error. Safely disabling composer:', error);
      if (this.composer) {
        this.config.postProcessing = false;
        this.composer.dispose();
        this.composer = null;
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  _updatePerformanceMetrics() {
    const now = performance.now();
    if (now - this.performance.startTime < 5000) {
      this.performance.lastFpsCheck = now;
      this.performance.frameCount = 0;
      return; 
    }
    this.performance.frameCount++;
    const elapsed = now - this.performance.lastFpsCheck;
    if (elapsed >= 1000) {
      this.performance.currentFps = Math.round((this.performance.frameCount * 1000) / elapsed);
      this.performance.frameCount = 0;
      this.performance.lastFpsCheck = now;
      if (this.config.autoAdjustQuality) {
        if (this.performance.currentFps < 30) {
          this.performance.consecutiveLowFps++;
          if (this.performance.consecutiveLowFps >= 3) {
            this._downgradeQuality();
            this.performance.consecutiveLowFps = 0;
          }
        } else if (this.performance.currentFps > 45) {
          this.performance.consecutiveLowFps = 0;
        }
      }
    }
  }

  _downgradeQuality() {
    const tiers = Object.keys(SceneManager.QualityTier).map(k => k.toLowerCase());
    const currentIndex = tiers.indexOf(this.config.quality);
    if (currentIndex > 0) {
      const newQuality = tiers[currentIndex - 1];
      console.warn(`[SceneManager] Thermal Throttling Detected. Downgrading WebGL quality to [${newQuality.toUpperCase()}]`);
      this._applyQualityTier(newQuality);
      const newPixelRatio = Math.min(window.devicePixelRatio, this.config.pixelRatioCap);
      if (this.renderer) {
        this.renderer.setPixelRatio(newPixelRatio);
      }
      if (this.composer) {
        if (!this.config.postProcessing) {
          this.composer.dispose();
          this.composer = null;
        } else {
          this.composer.setPixelRatio(newPixelRatio);
          this.composer.passes.forEach(pass => {
            if (pass instanceof UnrealBloomPass) {
              pass.strength = this.config.bloomStrength;
            }
          });
        }
      }
    }
  }

  _emit(event, data) {
    (this._eventListeners[event] || []).forEach(cb => { try { cb(data); } catch(e) {} });
  }

  dispose() {
    this.stopLoop();
    if (this._cleanupHandlers) this._cleanupHandlers();
    
    if (this.environment) this.environment.dispose();
    if (this.lightning) this.lightning.dispose();
    if (this.flames) this.flames.dispose();
    if (this.cameraController) this.cameraController.dispose();
    if (this.dragonController) this.dragonController.dispose();

    if (this.composer) { this.composer.dispose(); this.composer = null; }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.renderer.context = null;
      this.renderer.domElement = null;
    }
    if (this.scene) {
      this.scene.traverse(object => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          Array.isArray(object.material) ? object.material.forEach(m => m.dispose()) : object.material.dispose();
        }
      });
      this.scene.clear();
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.isInitialized = false;
  }
}