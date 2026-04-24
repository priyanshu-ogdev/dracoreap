import * as THREE from 'three';

/**
 * Industry-Grade Procedural Obsidian Fire v8.0 (CINEMATIC PROTOCOL)
 * Upgrades: Thermodynamic color mapping, GPU fill-rate optimization, Swirl Physics.
 */
export class FlameParticles {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.config = {
      maxParticles: options.maxParticles ?? 300, 
      qualityTier: options.qualityTier || 'high',
      emissionZoneRadius: options.emissionZoneRadius ?? 6,
      ...options
    };
    
    if (this.config.qualityTier === 'low') this.config.maxParticles = 100;
    else if (this.config.qualityTier === 'medium') this.config.maxParticles = 200;
    
    this.instanceMesh = null;
    this.material = null;
    this.geometry = null;
    this.fireLight = null; // NEW: Dynamic lighting
    
    this.data = {
      positions: new Float32Array(this.config.maxParticles * 3),
      life: new Float32Array(this.config.maxParticles),
      size: new Float32Array(this.config.maxParticles),
      velocity: new Float32Array(this.config.maxParticles * 3),
      seed: new Float32Array(this.config.maxParticles),
      type: new Float32Array(this.config.maxParticles) 
    };
    
    this.lavaIntensity = 0.8;
    this.elapsedTime = 0;
    this._init();
  }

  _init() {
    const { maxParticles } = this.config;
    
    for (let i = 0; i < maxParticles; i++) {
      this._resetParticleData(i);
      this.data.life[i] = 0; 
    }

    const baseGeo = new THREE.PlaneGeometry(1, 1);
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.copy(baseGeo);
    baseGeo.dispose();

    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.data.life, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.data.seed, 1));
    this.geometry.setAttribute('aType', new THREE.BufferAttribute(this.data.type, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLavaIntensity: { value: this.lavaIntensity },
        
        // Upgraded Palette (Includes White-Hot cores)
        uColorCoreG: { value: new THREE.Color(0xffffff) },  // Searing White-Yellow
        uColorMidG: { value: new THREE.Color(0xff3300) },   // Bright Orange/Red
        uColorCoreD: { value: new THREE.Color(0x010002) },  // Obsidian Void
        uColorMidD: { value: new THREE.Color(0xcc0000) },   // Blood Red
        uColorSmoke: { value: new THREE.Color(0x050202) }   // Deep Ash
      },
      vertexShader: `
        attribute float aLife;
        attribute float aSeed;
        attribute float aType;
        
        uniform float uTime;
        
        varying vec2 vUv;
        varying float vAlpha;
        varying float vLife;
        varying float vSeed;
        varying float vType;
        varying vec2 vWindOffset;

        void main() {
          if (aLife <= 0.0) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0); 
            return;
          }

          vUv = uv;
          vLife = aLife;
          vSeed = aSeed;
          vType = aType;
          
          // Pre-calculate wind offset in vertex to save fragment compute
          vWindOffset = vec2(uTime * 0.2 + aSeed, -uTime * 0.8);
          
          // Smoother attack, delayed decay
          vAlpha = smoothstep(0.0, 0.15, aLife) * smoothstep(1.0, 0.3, aLife);
          
          // Spherical Billboarding (Optimized)
          vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          
          float rot = aSeed * 6.28 + uTime * (aType > 0.5 ? 0.5 : 2.0);
          float c = cos(rot);
          float s = sin(rot);
          vec2 rotatedPos = vec2(position.x * c - position.y * s, position.x * s + position.y * c);
          
          vec3 orient = rotatedPos.x * cameraRight + rotatedPos.y * cameraUp;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(orient, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uLavaIntensity;
        
        uniform vec3 uColorCoreG;
        uniform vec3 uColorMidG;
        uniform vec3 uColorCoreD;
        uniform vec3 uColorMidD;
        uniform vec3 uColorSmoke;
        
        varying vec2 vUv;
        varying float vAlpha;
        varying float vLife;
        varying float vSeed;
        varying float vType;
        varying vec2 vWindOffset;

        // Cheap 2D Noise replacing expensive FBM
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          if (vAlpha < 0.01) discard;

          vec2 uv = vUv - 0.5; 
          uv += vWindOffset * (1.0 - vLife); // Apply wind based on age
          
          // Single pass Simplex noise for organic shape
          float n = snoise(uv * 4.0 - vec2(0.0, uTime)) * 0.5 + 0.5;
          
          // SDF (Signed Distance Field) for tear-drop flame shape
          float dist = length(vec2(vUv.x - 0.5, (vUv.y - 0.2) * 1.5)); 
          
          float shape = n - (dist * 2.0);
          shape += (vLife * 0.6); 
          
          float fireMask = smoothstep(0.05, 0.25, shape);
          if (fireMask <= 0.01) discard;

          // THERMODYNAMIC COLOR CURVE (Non-linear)
          vec3 activeCore = mix(uColorCoreG, uColorCoreD, vType);
          vec3 activeMid = mix(uColorMidG, uColorMidD, vType);

          // Heat falls off exponentially from the center
          float heat = pow(smoothstep(0.0, 0.5, shape * vLife), 1.5);
          
          vec3 baseColor = mix(uColorSmoke, activeMid, smoothstep(0.0, 0.5, heat));
          vec3 finalColor = mix(baseColor, activeCore, smoothstep(0.6, 0.9, heat) * uLavaIntensity);
          
          float smokeAlphaFade = mix(heat, mix(0.4, 1.0, heat), vType); 
          
          gl_FragColor = vec4(finalColor, fireMask * vAlpha * smokeAlphaFade);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending, 
      depthWrite: false, 
      depthTest: true
    });

    this.instanceMesh = new THREE.InstancedMesh(this.geometry, this.material, maxParticles);
    this.instanceMesh.frustumCulled = false;
    this.scene.add(this.instanceMesh);

    // NEW: Flickering PointLight to illuminate the environment/dragon
    this.fireLight = new THREE.PointLight(0xff3300, 0, 20);
    this.scene.add(this.fireLight);
  }

  _resetParticleData(idx, dragonPos = null) {
    this.data.life[idx] = 0.3 + Math.random() * 0.4; // Tighter lifespan
    this.data.seed[idx] = Math.random();

    const isDragonFlame = dragonPos && Math.random() > 0.4;

    if (isDragonFlame) {
      this.data.type[idx] = 1.0; 
      this.data.size[idx] = Math.random() * 1.2 + 0.6; 
      
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0
      );
      
      this.data.positions[idx * 3] = dragonPos.x + offset.x;
      this.data.positions[idx * 3 + 1] = dragonPos.y + offset.y;
      this.data.positions[idx * 3 + 2] = dragonPos.z + offset.z;

      this.data.velocity[idx * 3] = offset.x * 2.0 - 1.5; 
      this.data.velocity[idx * 3 + 1] = offset.y * 1.0 + 1.5; 
      this.data.velocity[idx * 3 + 2] = offset.z * 2.0;

    } else {
      this.data.type[idx] = 0.0; 
      this.data.size[idx] = Math.random() * 0.6 + 0.2; 
      
      const angle = (Math.random() * Math.PI * 2); 
      const radius = Math.pow(Math.random(), 2) * 20.0; 
      
      this.data.positions[idx * 3] = Math.cos(angle) * radius;
      this.data.positions[idx * 3 + 1] = -10 + (Math.random() - 0.5) * 0.5; 
      this.data.positions[idx * 3 + 2] = Math.sin(angle) * radius;

      this.data.velocity[idx * 3] = -4.0 - Math.random() * 4.0; 
      this.data.velocity[idx * 3 + 1] = 2.0 + Math.random() * 3.0; // Higher initial bounce
      this.data.velocity[idx * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
  }

  update(delta, params = {}) {
    if (!this.instanceMesh) return;
    
    this.elapsedTime += delta;
    const { maxParticles } = this.config;
    this.lavaIntensity = params.lavaIntensity ?? this.lavaIntensity;
    
    const spawnRate = 60 * Math.max(0.2, this.lavaIntensity); 
    const spawnCount = Math.floor(delta * spawnRate) + (Math.random() < (delta * spawnRate) % 1 ? 1 : 0);
    
    const dragonPos = params.dragonPosition || null;

    for (let i = 0; i < spawnCount; i++) {
      const idx = Math.floor(Math.random() * maxParticles);
      if (this.data.life[idx] <= 0) {
        this._resetParticleData(idx, dragonPos);
      }
    }

    this.material.uniforms.uTime.value = this.elapsedTime;
    this.material.uniforms.uLavaIntensity.value = this.lavaIntensity;

    const dummy = new THREE.Object3D();
    const lifeAttr = this.geometry.attributes.aLife;

    // Light flickering based on noise and intensity
    if (this.fireLight) {
        if (dragonPos) this.fireLight.position.copy(dragonPos);
        const flicker = 0.8 + Math.sin(this.elapsedTime * 15.0) * 0.2;
        this.fireLight.intensity = this.lavaIntensity * 5.0 * flicker;
    }

    for (let i = 0; i < maxParticles; i++) {
      if (this.data.life[i] > 0) {
        const isDragon = this.data.type[i] > 0.5;
        this.data.life[i] -= delta * (isDragon ? 1.5 : 0.9); 
        
        if (isDragon) {
          // Fake turbulence/swirl for dragon fire
          this.data.velocity[i * 3] += Math.sin(this.elapsedTime * 5.0 + this.data.seed[i]) * 2.0 * delta; 
          this.data.velocity[i * 3 + 2] += Math.cos(this.elapsedTime * 5.0 + this.data.seed[i]) * 2.0 * delta;
        } else {
          this.data.velocity[i * 3 + 1] -= delta * 4.0; // Stronger gravity for embers
          if (this.data.positions[i * 3 + 1] < -10.5) {
            this.data.velocity[i * 3 + 1] *= -0.6; // Lossy bounce
            this.data.positions[i * 3 + 1] = -10.5;
            this.data.velocity[i * 3] *= 0.8; // Friction on water
          }
        }

        this.data.positions[i * 3] += this.data.velocity[i * 3] * delta;
        this.data.positions[i * 3 + 1] += this.data.velocity[i * 3 + 1] * delta;
        this.data.positions[i * 3 + 2] += this.data.velocity[i * 3 + 2] * delta;
        
        dummy.position.set(this.data.positions[i * 3], this.data.positions[i * 3 + 1], this.data.positions[i * 3 + 2]);
        
        const expansion = isDragon ? (1.0 + (1.0 - this.data.life[i]) * 0.8) : 1.0;
        dummy.scale.setScalar(this.data.size[i] * expansion);
        
        dummy.updateMatrix();
        this.instanceMesh.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -1000, 0); 
        dummy.updateMatrix();
        this.instanceMesh.setMatrixAt(i, dummy.matrix);
        this.data.life[i] = 0;
      }
    }

    this.instanceMesh.instanceMatrix.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  }

  triggerBurst(count = 50) {
    if (!this.instanceMesh) return;
    const burstCount = Math.min(count, this.config.maxParticles);
    
    for (let i = 0; i < burstCount; i++) {
      const idx = Math.floor(Math.random() * this.config.maxParticles);
      this._resetParticleData(idx, null); 
      this.data.velocity[idx * 3] -= 20.0 + Math.random() * 10.0; 
      this.data.velocity[idx * 3 + 1] += 8.0 + Math.random() * 5.0; 
      this.data.size[idx] *= 1.5; 
      this.data.life[idx] = 1.0; 
    }
  }

  dispose() {
    if (this.scene) {
        if (this.instanceMesh) this.scene.remove(this.instanceMesh);
        if (this.fireLight) this.scene.remove(this.fireLight);
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.instanceMesh = null;
  }
}