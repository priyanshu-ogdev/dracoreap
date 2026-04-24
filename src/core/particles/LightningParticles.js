import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Industry-Grade Cinematic Lightning System v8.0 (CATACLYSM PROTOCOL)
 * Upgrades: Volumetric Trunk Stacking, Dynamic Light Pooling, Sky-Splitter Fractals.
 */
export class LightningParticles {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.config = {
      maxSegments: options.maxSegments ?? 4000, // Boosted for horizontal spider-webbing
      qualityTier: options.qualityTier || 'high',
      enableBranching: options.enableBranching ?? true,
      maxLights: 3, // Keep light pool small to protect GPU fill-rate
      ...options
    };

    if (this.config.qualityTier === 'low') this.config.maxSegments = 1000;
    else if (this.config.qualityTier === 'medium') this.config.maxSegments = 2000;

    this.lines = null;
    this.material = null;
    this.geometry = null;
    
    // The link to sync with the EnvironmentShader
    this.globalFlashIntensity = 0.0; 
    
    // Dynamic lighting pool
    this.lightPool = [];
    
    const maxVerts = this.config.maxSegments * 2;
    this.data = {
      positions: new Float32Array(maxVerts * 3),
      life: new Float32Array(maxVerts),
      intensity: new Float32Array(maxVerts),
      seed: new Float32Array(maxVerts)
    };

    this.nextIdx = 0; 
    this.stormIntensity = 0.4;

    this.update = this.update.bind(this);
    this._triggerStrike = this._triggerStrike.bind(this);
    this._init();
  }

  _init() {
    const maxVerts = this.config.maxSegments * 2;
    this.geometry = new THREE.BufferGeometry();
    
    for (let i = 0; i < maxVerts; i++) {
      this.data.positions[i * 3] = 0;
      this.data.positions[i * 3 + 1] = -1000; 
      this.data.positions[i * 3 + 2] = 0;
      this.data.life[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.data.positions, 3));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.data.life, 1));
    this.geometry.setAttribute('aIntensity', new THREE.BufferAttribute(this.data.intensity, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.data.seed, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlashBoost: { value: 0 },
        uCoreColor: { value: new THREE.Color(0xffffff) }, // Pure blinding white
        uEdgeColor: { value: new THREE.Color(0x00ccff) }  // Electric Cyan/Blue
      },
      vertexShader: `
        attribute float aLife;
        attribute float aIntensity;
        attribute float aSeed;
        
        uniform float uTime;
        
        varying float vAlpha;
        varying float vIntensity;

        void main() {
          vIntensity = aIntensity;
          
          if (aLife <= 0.0) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
            return;
          }

          // VIOLENT STROBE: High-frequency noise matched to the bolt's seed
          float strobeNoise = fract(sin(uTime * 60.0 + aSeed) * 43758.5453);
          float strobe = step(0.15, strobeNoise); // 85% ON chance for brutal flickering
          
          // Fast attack, exponential decay
          vAlpha = pow(aLife, 2.0) * strobe; 
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vIntensity;
        
        uniform vec3 uCoreColor;
        uniform vec3 uEdgeColor;
        uniform float uFlashBoost;

        void main() {
          if (vAlpha < 0.01) discard;
          
          vec3 baseColor = mix(uEdgeColor, uCoreColor, vIntensity);
          
          // CATACLYSMIC HDR OVERDRIVE
          float hdrMultiplier = 15.0 + (vIntensity * 20.0) + (uFlashBoost * 40.0);
          
          gl_FragColor = vec4(baseColor * hdrMultiplier, vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending, 
      depthWrite: false,
      depthTest: true
    });

    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.lines.frustumCulled = false;
    this.scene.add(this.lines);

    // Initialize Light Pool
    for(let i=0; i < this.config.maxLights; i++) {
        const light = new THREE.PointLight(0x00ccff, 0, 150);
        this.lightPool.push({ light: light, active: false, life: 0 });
        this.scene.add(light);
    }
  }

  _writeSegment(p1, p2, life, intensity, seed) {
    const idx = this.nextIdx;
    this.nextIdx = (this.nextIdx + 1) % this.config.maxSegments;

    const vIdx1 = idx * 2;
    const vIdx2 = idx * 2 + 1;

    this.data.positions[vIdx1 * 3] = p1.x;
    this.data.positions[vIdx1 * 3 + 1] = p1.y;
    this.data.positions[vIdx1 * 3 + 2] = p1.z;

    this.data.positions[vIdx2 * 3] = p2.x;
    this.data.positions[vIdx2 * 3 + 1] = p2.y;
    this.data.positions[vIdx2 * 3 + 2] = p2.z;

    this.data.life[vIdx1] = life;
    this.data.life[vIdx2] = life;
    this.data.intensity[vIdx1] = intensity;
    this.data.intensity[vIdx2] = intensity;
    this.data.seed[vIdx1] = seed;
    this.data.seed[vIdx2] = seed;
  }

  _addSegment(p1, p2, life, intensity, seed, isTrunk) {
    this._writeSegment(p1, p2, life, intensity, seed);

    if (isTrunk) {
      // VOLUMETRIC STACKING: Duplicate main trunk lines tightly to multiply HDR bloom
      for(let i=0; i<3; i++) {
          const offset = new THREE.Vector3((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8);
          this._writeSegment(p1.clone().add(offset), p2.clone().add(offset), life, intensity * 0.9, seed);
      }
    }
  }

  _generateBoltPath(start, end, segments, isBranch, boltSeed, altitudeY) {
    let currentPos = start.clone();
    const totalVector = end.clone().sub(start);
    const stepVector = totalVector.divideScalar(segments);
    
    const jitterMagnitude = stepVector.length() * (isBranch ? 1.8 : 1.2);
    const intensity = isBranch ? 0.3 + Math.random() * 0.3 : 1.0;
    const lifeDuration = isBranch ? 0.4 + Math.random() * 0.2 : 0.8; 

    for (let i = 0; i < segments; i++) {
      let nextPos = currentPos.clone().add(stepVector);
      
      // SKY-SPLITTER BIAS: High altitude branching prefers horizontal spread
      let spreadX = (Math.random() - 0.5) * jitterMagnitude;
      let spreadZ = (Math.random() - 0.5) * jitterMagnitude;
      let spreadY = (Math.random() - 0.5) * jitterMagnitude;
      
      if (currentPos.y > altitudeY * 0.7) {
          spreadX *= 2.5; 
          spreadZ *= 2.5;
          spreadY *= 0.3; // Flattens it out across the sky
      }

      nextPos.x += spreadX;
      nextPos.y += spreadY;
      nextPos.z += spreadZ;

      this._addSegment(currentPos, nextPos, lifeDuration, intensity, boltSeed, !isBranch);

      if (this.config.enableBranching && Math.random() > (isBranch ? 0.8 : 0.4)) { 
        const branchLength = Math.floor((segments - i) * (isBranch ? 0.5 : 0.8));
        if (branchLength > 2) {
          const branchEnd = nextPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            -20 - Math.random() * 30,
            (Math.random() - 0.5) * 60
          ));
          this._generateBoltPath(nextPos, branchEnd, branchLength, true, boltSeed, altitudeY);
        }
      }

      currentPos = nextPos;
    }
  }

  _activateLight(position, intensity) {
      const freeLight = this.lightPool.find(l => !l.active);
      if (freeLight) {
          freeLight.active = true;
          freeLight.life = 1.0;
          freeLight.light.position.copy(position);
          freeLight.light.intensity = intensity * 50.0;
      }
  }

  _triggerStrike(targetPos = null, isCataclysm = false) {
    const boltSeed = Math.random() * 100.0;

    const startX = (Math.random() - 0.5) * 200;
    const startZ = -50 + (Math.random() - 0.5) * 100;
    const spawnAltitude = 80 + Math.random() * 40;
    const startPos = new THREE.Vector3(startX, spawnAltitude, startZ);

    let endPos;
    if (targetPos) {
      endPos = targetPos.clone();
    } else {
      endPos = new THREE.Vector3(
        startX + (Math.random() - 0.5) * 80,
        -10, 
        startZ + (Math.random() - 0.5) * 80
      );
    }

    // Cataclysm strikes have way more segments to allow dense spider-webbing
    const segments = isCataclysm ? 30 : 15 + Math.floor(Math.random() * 10);
    this._generateBoltPath(startPos, endPos, segments, false, boltSeed, spawnAltitude);

    // Illuminate the environment
    this._activateLight(startPos, isCataclysm ? 2.0 : 1.0); // Flash the clouds
    if (targetPos) this._activateLight(targetPos, 2.0);     // Flash the impact point
    
    // Global flash for the EnvironmentShader
    this.globalFlashIntensity = isCataclysm ? 1.0 : 0.5;
  }

  update(delta, params = {}) {
    const { maxSegments } = this.config;
    this.stormIntensity = params.stormIntensity ?? this.stormIntensity;

    this.material.uniforms.uTime.value += delta;

    const strikeProbability = delta * this.stormIntensity * 0.6;
    if (Math.random() < strikeProbability) {
      this._triggerStrike();
    }

    // Decay the global flash variable smoothly so the environment fades nicely
    if (this.globalFlashIntensity > 0) {
        this.globalFlashIntensity -= delta * 3.0;
        this.globalFlashIntensity = Math.max(0, this.globalFlashIntensity);
    }

    // Update physical point lights
    for(let l of this.lightPool) {
        if(l.active) {
            l.life -= delta * 4.0;
            l.light.intensity = l.life * 50.0;
            if(l.life <= 0) {
                l.active = false;
                l.light.intensity = 0;
            }
        }
    }

    let needsUpdate = false;
    const maxVerts = maxSegments * 2;
    for (let i = 0; i < maxVerts; i++) {
      if (this.data.life[i] > 0) {
        this.data.life[i] -= delta * 2.5; 
        
        if (this.data.life[i] <= 0) {
          this.data.positions[i * 3 + 1] = -1000; 
          this.data.life[i] = 0;
        }
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.aLife.needsUpdate = true;
    }
  }

  triggerBurst(targetPos = null) {
    // The Sky-Splitter Sequence
    const burstCount = 6 + Math.floor(Math.random() * 4); 
    
    // One massive cataclysmic strike
    this._triggerStrike(targetPos, true);

    // Followed by rapid after-strikes
    for (let i = 1; i < burstCount; i++) {
      setTimeout(() => this._triggerStrike(targetPos, false), i * 60 + (Math.random()*20));
    }
    
    gsap.killTweensOf(this.material.uniforms.uFlashBoost);
    this.material.uniforms.uFlashBoost.value = 5.0; // Extreme HDR punch
    gsap.to(this.material.uniforms.uFlashBoost, { 
      value: 0, 
      duration: 1.2, 
      ease: 'power4.out' 
    });
  }

  dispose() {
    if (this.scene) {
        if (this.lines) this.scene.remove(this.lines);
        for(let l of this.lightPool) this.scene.remove(l.light);
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.lines = null;
  }
}