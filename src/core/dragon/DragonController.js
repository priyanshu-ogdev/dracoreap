import * as THREE from 'three';

/**
 * Industry-Grade Cinematic Dragon Controller v20.0 (CRIMSON LEVIATHAN)
 * * Architectural Upgrades:
 * - Native Engine Injection: Eradicated all fake white particles and custom line generators. The controller now injects bone coordinates directly into the `LightningParticles` engine's `_generateBoltPath`, wrapping the body in true Cataclysm-grade HDR lightning.
 * - Pure Gold Scales: Scale material is now 100% metallic pure gold (#ffd700) to perfectly contrast the wet crimson-black chassis.
 */
export class DragonController {
  constructor(scene, gltf, vfxConfig = {}) {
    this.scene = scene;
    this.model = gltf.scene;
    this.animations = gltf.animations;
    
    this.flames = vfxConfig.flames || null;
    this.lightning = vfxConfig.lightning || null; 

    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.currentState = 'waking'; 

    this.dragonGroup = new THREE.Group();
    this.headTracker = new THREE.Object3D(); 
    
    this.rootBone = null;
    this.bindPoseLocal = new THREE.Vector3(); 
    this.isTreadmillCalibrated = false;

    this.dragonPosition = new THREE.Vector3();
    this.magmaMaterials = []; 
    
    // Track specific bones to act as lightning rods
    this.sparkBones = []; 
    
    this._init();
  }

  _init() {
    this._frameSubject();
    this._paintModel();
    this._attachBoneTrackers();
    this._setupAutonomousAnimations();

    this.scene.add(this.dragonGroup);
    console.log('[DragonController] Crimson Leviathan Armed. Native Lightning Injection Engaged.');
  }

  _frameSubject() {
    this.model.scale.setScalar(0.35); 
    this.dragonGroup.add(this.model);
    this.dragonGroup.position.set(0, -8.0, -4.0); 
  }

  _paintModel() {
    // 1. WET CRIMSON-BLACK BLOOD SHADER
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#010103'), 
      metalness: 0.1, 
      roughness: 0.9, 
      clearcoat: 0.2, 
      clearcoatRoughness: 0.5, 
      sheen: 1.0, 
      sheenColor: new THREE.Color('#ff0a2b'), 
      emissive: new THREE.Color('#550000'), 
      emissiveIntensity: 0.35, 
      envMapIntensity: 5.0 
    });

    // 2. BRILLIANT GOLDEN SCALES
    const scaleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffd700'), // Pure Gold Base
      metalness: 1.0, // 100% Metal
      roughness: 0.15, // Polished
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color('#994400'), // Deep golden heat
      emissiveIntensity: 1.5, 
      envMapIntensity: 2.5 
    });

    // 3. SEARING CRIMSON EYES
    const eyeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ff0000'), 
      emissive: new THREE.Color('#ff2200'), 
      emissiveIntensity: 15.0, 
      toneMapped: false 
    });

    this.model.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();

        // Purge baked-in low quality effects
        if (name.match(/particle|spark|fx|flame|fire|smoke|lightning|glow/)) {
          child.visible = false; return;
        }

        child.castShadow = true;
        child.receiveShadow = true;

        const origMat = child.material;
        let targetMat;

        if (name.includes('eye')) {
          targetMat = eyeMaterial.clone();
        } else if (name.match(/scale|armor|spine|claw|horn/)) {
          targetMat = scaleMaterial.clone();
          this.magmaMaterials.push(targetMat); 
        } else {
          targetMat = bodyMaterial.clone();
        }

        if (origMat && origMat.normalMap) targetMat.normalMap = origMat.normalMap;
        if (origMat && origMat.roughnessMap) targetMat.roughnessMap = origMat.roughnessMap;

        child.material = targetMat;
      }
    });
  }

  _attachBoneTrackers() {
    this.model.traverse(c => {
      if (c.isBone) {
        const name = c.name.toLowerCase();
        
        if (name.match(/head|jaw|mouth/) && !this.headTracker.parent) {
          c.add(this.headTracker);
          this.headTracker.position.set(0, -0.1, 1.0); 
        }
        if (name.match(/root|pelvis|hip|spine/) && !this.rootBone) {
          this.rootBone = c; 
        }

        // Register ~40% of the bones across the body to act as lightning connection nodes
        if (Math.random() > 0.6) {
          this.sparkBones.push(c);
        }
      }
    });

    if (!this.headTracker.parent) this.model.add(this.headTracker);
  }

  _setupAutonomousAnimations() {
    if (!this.animations || this.animations.length === 0) return;

    this.mixer = new THREE.AnimationMixer(this.model);
    const states = ['waking', 'striking', 'flying', 'roaring', 'idle'];

    if (this.animations.length >= 3) {
      states.forEach((state, idx) => {
        let clip = this.animations.find(a => a.name.toLowerCase().includes(state));
        if (!clip) clip = this.animations[Math.min(idx, this.animations.length - 1)]; 
        
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        this.actions[state] = action;
      });
    } else {
      const masterClip = this.animations[0];
      const duration = masterClip.duration; 
      
      if (duration > 5) {
        const chunk = duration / states.length;
        states.forEach((state, i) => {
          const start = i * chunk;
          const end = start + chunk;
          const subclip = THREE.AnimationUtils.subclip(masterClip, state, Math.floor(start * 30), Math.floor(end * 30), 30);
          const action = this.mixer.clipAction(subclip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          this.actions[state] = action;
        });
      } else {
        const action = this.mixer.clipAction(masterClip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        states.forEach(state => this.actions[state] = action);
      }
    }

    this.activeAction = this.actions['waking'];
    this.activeAction.setEffectiveTimeScale(1.6);
    this.activeAction.reset().play();
  }

  setState(newState) {
    if (this.currentState === newState || !this.actions[newState]) return;

    const prevAction = this.activeAction;
    const nextAction = this.actions[newState];

    if (prevAction === nextAction) {
      this.currentState = newState;
      this._onStateEnter(newState);
      return; 
    }

    nextAction.reset(); 
    nextAction.setEffectiveTimeScale(1.6);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (prevAction) {
      prevAction.crossFadeTo(nextAction, 0.4, true);
    }
    
    this.activeAction = nextAction;
    this.currentState = newState;

    this._onStateEnter(newState);
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    this.headTracker.getWorldPosition(this.dragonPosition);
    
    this._runTreadmillEngine(delta);
    this._handleThermalBreathing(delta);
    this._handleContinuousFlames(delta);
    this._handleNativeBodyLightning(delta); 
  }

  _runTreadmillEngine(delta) {
    if (!this.rootBone) return;

    if (!this.isTreadmillCalibrated) {
      this.bindPoseLocal.copy(this.rootBone.position);
      this.isTreadmillCalibrated = true;
      return;
    }

    const drift = new THREE.Vector3().subVectors(this.rootBone.position, this.bindPoseLocal);
    const scale = this.model.scale.x;
    
    this.model.position.x = -drift.x * scale;
    this.model.position.z = -drift.z * scale;
    this.model.position.y = -drift.y * scale * 0.15; 
  }

  _handleThermalBreathing(delta) {
    const time = performance.now() * 0.001;
    const pulse = (Math.sin(time * 3.5) + 1.0) * 0.5;

    let baseGlow = 1.5 + (pulse * 2.0);

    if (this.currentState === 'roaring') {
      baseGlow = 18.0 + (pulse * 12.0); 
    } else if (this.currentState === 'striking') {
      baseGlow = 8.0 + (pulse * 4.0);
    } else if (this.currentState === 'flying') {
      baseGlow = 6.0 + (pulse * 3.0); 
    }

    this.magmaMaterials.forEach(m => {
      if (m.emissiveIntensity !== undefined) {
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, baseGlow, 5.0 * delta);
      }
    });
  }

  _handleContinuousFlames(delta) {
    if (!this.flames) return;
    const targetLava = this.currentState === 'roaring' ? 1.0 : 0.1;
    this.flames.lavaIntensity = THREE.MathUtils.lerp(this.flames.lavaIntensity, targetLava, 3.0 * delta);
  }

  /**
   * ⚡ NATIVE LIGHTNING INJECTION
   * Directly hooks into the `LightningParticles._generateBoltPath` method you provided.
   * This draws real, jagged Cataclysm HDR lightning strictly between the physical bones of the dragon.
   */
  _handleNativeBodyLightning(delta) {
    if (!this.lightning || this.sparkBones.length < 2) return;

    let sparkChance = 0;
    let sparkCount = 1;

    // Ramp up the intensity based on the animation
    if (this.currentState === 'flying') { sparkChance = 0.2; sparkCount = 1; }
    if (this.currentState === 'striking') { sparkChance = 0.7; sparkCount = 3; }
    if (this.currentState === 'roaring') { sparkChance = 1.0; sparkCount = 6; } // Violent static

    if (Math.random() < sparkChance) {
      for (let i = 0; i < sparkCount; i++) {
        // Pick two random bones from the array
        const b1 = this.sparkBones[Math.floor(Math.random() * this.sparkBones.length)];
        const b2 = this.sparkBones[Math.floor(Math.random() * this.sparkBones.length)];

        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        b1.getWorldPosition(p1);
        b2.getWorldPosition(p2);

        const distance = p1.distanceTo(p2);

        // Ensure we only draw tight arcs across the body (not traversing too far or inside the exact same bone)
        if (distance < 5.0 && distance > 0.5) {
          // Injection: Call the LightningParticles internal path generator
          // _generateBoltPath(start, end, segments, isBranch, boltSeed, altitudeY)
          // We use only 3-4 segments so the bolts are tight and wrap the body naturally.
          this.lightning._generateBoltPath(p1, p2, 4, false, Math.random() * 100, p1.y);
        }
      }
    }
  }

  _onStateEnter(state) {
    switch(state) {
      case 'striking':
        // Sky-to-Ground Environmental Strike
        this.lightning?.triggerBurst(this.dragonPosition, 1);
        break;
      case 'roaring':
        // Sky-to-Ground Environmental Strike
        this.flames?.triggerBurst(400, this.dragonPosition);
        this.lightning?.triggerBurst(this.dragonPosition, 5); 
        break;
    }
  }

  dispose() {
    if (this.mixer) this.mixer.stopAllAction();
  }
}