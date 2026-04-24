import * as THREE from 'three';
import gsap from 'gsap';
import { a11yManager } from '../../utils/accessibility.js'; 

export class CameraController {
  constructor(camera, options = {}) {
    this.camera = camera;
    
    this.config = {
      parallaxStrength: options.parallaxStrength ?? 0.5, 
      parallaxDamping: options.parallaxDamping ?? 8.0, 
      shakeIntensity: options.shakeIntensity ?? 1.2, 
      fovBreathAmount: options.fovBreathAmount ?? 0.3, 
      fovBreathSpeed: options.fovBreathSpeed ?? 0.3,
      steadicamMass: options.steadicamMass ?? 12.0, 
      subjectTrackingStrength: 0.95, 
      ...options
    };

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);

    this.mouse = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.parallaxOffset = new THREE.Vector3(0, 0, 0);
    this.shakeOffset = new THREE.Vector3(0, 0, 0);
    
    this.basePosition = new THREE.Vector3();
    this.baseTarget = new THREE.Vector3();
    this.dampedTarget = new THREE.Vector3();
    
    this.targetScroll = 0;
    this.currentScroll = 0;
    
    this.trackedSubject = null;
    this.trackingOffset = new THREE.Vector3(0, 0, 0);
    this._subjectPos = new THREE.Vector3();
    this._tempVector = new THREE.Vector3();
    this.finalTarget = new THREE.Vector3();
    this.dummyCamera = new THREE.Object3D(); 
    
    this.isShaking = false;
    this.baseFov = 45; 
    this.camera.fov = this.baseFov;
    this.shakeFovOffset = 0;

    this._buildSplineTracks();

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onDeviceOrientation = this._onDeviceOrientation.bind(this);
    
    this._init();
  }

  _init() {
    if (!this.isReducedMotion) {
      if (this.isMobile && window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', this._onDeviceOrientation, { passive: true });
      } else {
        window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      }
    }
    
    this.positionCurve.getPoint(0, this.basePosition);
    this.targetOffsetCurve.getPoint(0, this.baseTarget);
    this.dampedTarget.copy(this.baseTarget);
    
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.dampedTarget);
  }

  // ⚡ LIFTED GAZE
  // Because the dragon is sitting at Y = -4.5, we offset the gaze up to Y = +3.5 to hit its head/chest
  setTrackedSubject(mesh, offset = new THREE.Vector3(0, 3.5, 0)) { 
    this.trackedSubject = mesh;
    this.trackingOffset.copy(offset);
  }

  _buildSplineTracks() {
    this.positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 7.0),      // Intro
      new THREE.Vector3(4.5, 1.0, 6.5),    // Skills
      new THREE.Vector3(-6.0, 0.5, 9.0),   // Projects: Wide out Z=9.0
      new THREE.Vector3(2.5, -2.0, 7.5),   // About: Low angle
      new THREE.Vector3(0, 1.0, 9.5)       // Contact: Full pull-back
    ]);
    this.positionCurve.curveType = 'centripetal'; 

    this.targetOffsetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.0, 0),        // Intro
      new THREE.Vector3(-1.0, 0.5, 0),     // Skills
      new THREE.Vector3(1.5, 1.0, 0),      // Projects
      new THREE.Vector3(-0.5, 1.5, 0),     // About
      new THREE.Vector3(0, 0.5, 0)         // Contact
    ]);
    this.targetOffsetCurve.curveType = 'centripetal';
  }

  _onMouseMove(event) {
    this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  _onDeviceOrientation(event) {
    if (!event.gamma || !event.beta) return;
    this.targetMouse.x = THREE.MathUtils.clamp(event.gamma / 45, -1, 1);
    this.targetMouse.y = THREE.MathUtils.clamp((event.beta - 45) / 45, -1, 1);
  }

  setScrollProgress(progress) {
    this.targetScroll = THREE.MathUtils.clamp(progress, 0, 1);
  }

  triggerShake(intensity = 1.0, duration = 0.6) {
    if (this.isShaking || this.isReducedMotion) return;
    this.isShaking = true;

    const shakeParams = { val: intensity };
    gsap.to(shakeParams, {
      val: 0, duration: duration, ease: "power2.out",
      onUpdate: () => {
        this.shakeOffset.x = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
        this.shakeOffset.y = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
        this.shakeOffset.z = (Math.random() - 0.5) * shakeParams.val * this.config.shakeIntensity;
      },
      onComplete: () => {
        this.shakeOffset.set(0, 0, 0);
        this.isShaking = false;
      }
    });

    gsap.fromTo(this, 
      { shakeFovOffset: -4 * intensity }, 
      { shakeFovOffset: 0, duration: duration, ease: "elastic.out(1, 0.3)" }
    );
  }

  update(delta, fallbackHeadPos = null) {
    const mass = this.isReducedMotion ? 20.0 : this.config.steadicamMass;
    this.currentScroll = THREE.MathUtils.lerp(this.currentScroll, this.targetScroll, 1.0 - Math.exp(-mass * delta));

    this.positionCurve.getPoint(this.currentScroll, this.basePosition);
    this.targetOffsetCurve.getPoint(this.currentScroll, this.baseTarget);

    if (this.trackedSubject) {
      this.trackedSubject.getWorldPosition(this._subjectPos);
      this._subjectPos.add(this.trackingOffset); 
      this._subjectPos.add(this.baseTarget); 
      this.baseTarget.lerp(this._subjectPos, this.config.subjectTrackingStrength);
    } else if (fallbackHeadPos && !this.isReducedMotion) {
      this._tempVector.copy(fallbackHeadPos);
      this.baseTarget.lerp(this._tempVector, this.config.subjectTrackingStrength);
    }

    this.dampedTarget.lerp(this.baseTarget, 1.0 - Math.exp(-15.0 * delta));

    if (!this.isReducedMotion) {
      this.mouse.lerp(this.targetMouse, 1.0 - Math.exp(-this.config.parallaxDamping * delta));
      this.parallaxOffset.x = -this.mouse.x * this.config.parallaxStrength;
      this.parallaxOffset.y = -this.mouse.y * this.config.parallaxStrength;
    }

    this.camera.position.copy(this.basePosition)
      .add(this.parallaxOffset)
      .add(this.shakeOffset);

    this._tempVector.copy(this.parallaxOffset).multiplyScalar(0.15); 
    this.finalTarget.copy(this.dampedTarget).add(this._tempVector);
    
    this.dummyCamera.position.copy(this.camera.position);
    this.dummyCamera.lookAt(this.finalTarget);
    
    this.camera.quaternion.slerp(this.dummyCamera.quaternion, 1.0 - Math.exp(-18.0 * delta));

    if (!this.isReducedMotion) {
      const time = performance.now() * 0.001; 
      const fovBreath = Math.sin(time * this.config.fovBreathSpeed) * this.config.fovBreathAmount;
      const targetFov = this.baseFov + fovBreath + this.shakeFovOffset;
      
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 1.0 - Math.exp(-8.0 * delta));
      this.camera.updateProjectionMatrix();
    }
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    gsap.killTweensOf(this);
  }
}