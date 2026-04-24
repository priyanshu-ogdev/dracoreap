import * as THREE from 'three';

export class EnvironmentShader {
  constructor(scene, renderer, options = {}) {
    this.scene = scene;
    this.renderer = renderer;
    this.config = {
      qualityTier: options.qualityTier || 'high',
      resolution: options.resolution || new THREE.Vector2(window.innerWidth, window.innerHeight),
      ...options
    };

    this.mesh = null;
    this.material = null;
    this._init();
  }

  _init() {
    const { resolution, qualityTier } = this.config;
    const octaves = qualityTier === 'low' ? 3.0 : (qualityTier === 'medium' ? 4.0 : 5.0);

    this.material = new THREE.ShaderMaterial({
      transparent: false,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NoBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: resolution },
        uScrollProgress: { value: 0.0 },
        uStormIntensity: { value: 0.5 },
        uLightningFlash: { value: 0.0 },
        uDragonPos: { value: new THREE.Vector2(0.5, 0.5) },
        uOctaves: { value: octaves },
        uColorVoid: { value: new THREE.Color('#020205') },
        uColorCloud: { value: new THREE.Color('#1a1a24') },
        uColorCrack: { value: new THREE.Color('#ff2200') },
        // ⚡ FIX: Darkened the lightning color from pure cyan (#00ffff) to a deeper, stormier blue
        // to prevent Bloom pass blowout.
        uColorLightning: { value: new THREE.Color('#0088aa') }, 
        uColorWater: { value: new THREE.Color('#010208') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Use 1.0 to ensure it's at the maximum depth of the clip space
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uScrollProgress;
        uniform float uStormIntensity;
        uniform float uLightningFlash;
        uniform vec2 uDragonPos;
        uniform float uOctaves;
        uniform vec3 uColorVoid;
        uniform vec3 uColorCloud;
        uniform vec3 uColorCrack;
        uniform vec3 uColorLightning;
        uniform vec3 uColorWater;

        float hash12(vec2 p) {
          vec3 p3  = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix( mix( hash12( i + vec2(0.0,0.0) ), hash12( i + vec2(1.0,0.0) ), u.x),
                      mix( hash12( i + vec2(0.0,1.0) ), hash12( i + vec2(1.0,1.0) ), u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8); 
          for (int i = 0; i < 5; i++) {
            if (float(i) >= uOctaves) break;
            v += a * noise(p);
            p = rot * p * 2.1 + vec2(1.0);
            a *= 0.45; 
          }
          return v;
        }

        vec3 renderSky(vec2 uv, float time, float stormInt, float flash) {
          vec2 noiseUv = uv * 2.5 + vec2(time * 0.05, 0.0);
          float baseNoise = fbm(noiseUv);
          vec3 skyCol = mix(uColorVoid, uColorCloud, baseNoise);
          float ridge = 1.0 - abs(baseNoise * 2.0 - 1.0);
          float crackGlow = pow(ridge, 15.0) * (0.4 + stormInt); 
          skyCol = mix(skyCol, uColorCrack, crackGlow * 1.8);
          
          float lightningShape = fbm(uv * 5.0 - time * 1.2);
          
          // ⚡ FIX: Reduced the multiplier from 4.0 to 1.5 to prevent the 2D sky 
          // from creating a blinding halo behind the 3D dragon model.
          vec3 lCol = uColorLightning * flash * smoothstep(0.3, 0.7, uv.y) * pow(lightningShape, 3.5) * 1.5; 
          
          return skyCol + lCol;
        }

        vec3 renderWater(vec2 uv, float time, float stormInt, float horizon, float flash) {
          float depth = (horizon - uv.y) / horizon; 
          if (depth <= 0.0) return vec3(0.0); 
          vec2 waterUv = vec2(uv.x, depth);
          waterUv.x *= (1.0 + depth * 2.5);
          waterUv.x += sin(waterUv.y * 15.0 + time * 1.5) * 0.015 * depth;
          float ripples = fbm(waterUv * vec2(12.0, 4.0) - time * 1.0);
          vec3 waterCol = uColorWater;
          vec3 reflection = mix(uColorCrack * 0.15, uColorLightning, ripples * stormInt);
          waterCol += reflection * 0.35 * smoothstep(0.4, 0.85, ripples);
          
          // ⚡ FIX: Toned down water flash reflection as well (from 1.8 to 0.8)
          waterCol += uColorLightning * flash * pow(ripples, 5.0) * 0.8;
          return waterCol;
        }

        void main() {
          vec2 uv = vUv;
          float time = uTime * 0.15;
          float horizon = 0.28 + (uScrollProgress * 0.06);
          vec3 finalColor = (uv.y > horizon) ? 
            renderSky(uv, time, uStormIntensity, uLightningFlash) : 
            renderWater(uv, time, uStormIntensity, horizon, uLightningFlash);

          float fogFactor = smoothstep(0.0, 0.12, abs(uv.y - horizon));
          finalColor = mix(uColorCrack * 0.12, finalColor, fogFactor);

          finalColor += hash12(uv * uTime) * 0.04; 
          vec2 centerUv = uv - 0.5;
          centerUv.x *= uResolution.x / uResolution.y;
          finalColor *= smoothstep(1.0, 0.25, length(centerUv)); 

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -9999;
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    window.addEventListener('resize', this.resize.bind(this), { passive: true });
  }

  update(delta, params = {}) {
    if (!this.material) return;
    const u = this.material.uniforms;
    
    u.uTime.value = (u.uTime.value + delta) % 1000.0;

    if (params.scrollProgress !== undefined) u.uScrollProgress.value = params.scrollProgress;
    if (params.stormIntensity !== undefined) u.uStormIntensity.value = params.stormIntensity;
    if (params.lightningFlash !== undefined) u.uLightningFlash.value = params.lightningFlash;

    if (params.dragonPosition && params.camera) {
      const p = params.dragonPosition.clone();
      const vector = p.project(params.camera);
      
      if (vector.z > -1 && vector.z < 1) {
        const screenX = (vector.x + 1.0) / 2.0;
        const screenY = (vector.y + 1.0) / 2.0;
        u.uDragonPos.value.lerp(new THREE.Vector2(screenX, screenY), 0.1);
      }
    }
  }

  resize() {
    if (!this.material) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.material.uniforms.uResolution.value.set(w, h);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    if (this.material) this.material.dispose();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.scene.remove(this.mesh);
    }
  }
} 