'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hero3DCanvasProps {
  mode?: 'guard' | 'scan' | 'anchor';
  onModeChange?: (mode: 'guard' | 'scan' | 'anchor') => void;
}

// GLSL 3D Simplex Noise Shader Code
const SIMPLEX_NOISE_GLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

const VERTEX_SHADER = `
${SIMPLEX_NOISE_GLSL}

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uNoiseDensity;
uniform vec2 uMouse;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  // Base multi-octave organic wave distortion
  float n1 = snoise(position * uNoiseDensity + vec3(uTime * uSpeed * 0.45));
  float n2 = snoise(position * (uNoiseDensity * 2.1) + vec3(uTime * uSpeed * 0.85)) * 0.45;
  float n3 = snoise(position * (uNoiseDensity * 4.2) + vec3(uTime * uSpeed * 1.2)) * 0.22;
  
  // Interactive mouse bulge / warp
  vec3 mouseWorld = vec3(uMouse.x * 2.5, uMouse.y * 2.5, 1.2);
  float distToMouse = length(position - mouseWorld);
  float mouseWave = exp(-distToMouse * 0.8) * 0.35;

  float displacement = (n1 + n2 + n3) * uNoiseStrength + mouseWave;
  vDisplacement = displacement;

  vec3 newPosition = position + normal * displacement;

  // Analytical normal perturbation
  vec3 approxNormal = normalize(normal + vec3(n2, n1, n3) * 0.4);
  vNormal = normalize(normalMatrix * approxNormal);

  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uColorAccent; // #C80552 (Solace Crimson)
uniform vec3 uColorDeep;   // #080a10 (Deep Obsidian)
uniform vec3 uColorRim;    // Specular warm highlight
uniform float uScanMode;   // 0.0 to 1.0 scanner ripple

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel calculation: high at grazing angles to create the liquid glass membrane rim
  float NdotV = max(dot(normal, viewDir), 0.0);
  float fresnel = 1.0 - NdotV;
  float fresnelRim = pow(fresnel, 2.5);
  float sharpEdgeGlow = pow(fresnel, 5.0);

  // Primary directional light (simulating upper-overhead light from Dribbble design)
  vec3 lightDir = normalize(vec3(0.2, 1.2, 0.7));
  vec3 halfVector = normalize(lightDir + viewDir);
  float NdotH = max(dot(normal, halfVector), 0.0);
  float specular = pow(NdotH, 36.0);

  // Secondary soft bounce light from below
  vec3 bounceDir = normalize(vec3(-0.3, -1.0, 0.4));
  float bounce = max(dot(normal, bounceDir), 0.0) * 0.25;

  // Base liquid color blending deep dark core with dominant crimson rim
  vec3 color = mix(uColorDeep, uColorAccent, fresnelRim * 0.88);

  // Specular rim highlights (matching the golden-crimson crest in the reference)
  color += uColorRim * specular * 1.95;
  color += uColorAccent * sharpEdgeGlow * 1.6;
  color += uColorAccent * bounce;

  // Surface tension micro-glow on wave crests
  color += uColorAccent * max(vDisplacement, 0.0) * 0.25;

  // Scanner mode pulse (when active)
  if (uScanMode > 0.01) {
    float scanPulse = sin(vWorldPosition.y * 8.0 - uTime * 6.0) * 0.5 + 0.5;
    color += uColorAccent * scanPulse * uScanMode * 0.7;
  }

  // Alpha transparency (crystal clear center, luminous glowing outer membrane)
  float alpha = clamp(0.75 + fresnelRim * 0.25 + specular * 0.6, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

export default function Hero3DCanvas({ mode = 'guard', onModeChange }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<'guard' | 'scan' | 'anchor'>(mode);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Verify WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch (_) {
      setWebGlSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, -0.2, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Group for mouse parallax tilt & rotation
    const blobGroup = new THREE.Group();
    scene.add(blobGroup);

    // Dominant Brand Colors:
    // Accent #C80552 -> RGB [0.784, 0.02, 0.322]
    // Rim highlight -> Warm luminous light [1.0, 0.88, 0.72]
    // Deep obsidian -> [0.035, 0.045, 0.07]
    const uColorAccent = new THREE.Color(0xC80552);
    const uColorRim = new THREE.Color(0xffdfb8);
    const uColorDeep = new THREE.Color(0x0a0c13);

    // 1. High-Density Organic Liquid Mesh
    // High subdivision sphere for ultra-smooth fluid displacement
    const liquidGeometry = new THREE.SphereGeometry(1.85, 128, 128);

    const liquidUniforms = {
      uTime: { value: 0 },
      uSpeed: { value: prefersReducedMotion ? 0.15 : 0.65 },
      uNoiseStrength: { value: 0.34 },
      uNoiseDensity: { value: 0.85 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorAccent: { value: uColorAccent },
      uColorRim: { value: uColorRim },
      uColorDeep: { value: uColorDeep },
      uScanMode: { value: 0.0 },
    };

    const liquidMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: liquidUniforms,
      transparent: true,
      side: THREE.FrontSide,
    });

    const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
    blobGroup.add(liquidMesh);

    // 2. Inner Refractive Core (Dark crystalline kernel adding depth)
    const innerCoreGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xC80552,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    blobGroup.add(innerCore);

    // 3. Stardust Particle System (Cosmic floating particles from Dribbble shot)
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePos[i3] = (Math.random() - 0.5) * 14;
      particlePos[i3 + 1] = (Math.random() - 0.5) * 10;
      particlePos[i3 + 2] = (Math.random() - 0.5) * 8 - 1;
      particleScales[i] = Math.random() * 0.035 + 0.015;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    // Particle Material with Soft Circular Point
    const canvasParticle = document.createElement('canvas');
    canvasParticle.width = 32;
    canvasParticle.height = 32;
    const ctx = canvasParticle.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(200, 5, 82, 0.8)');
      gradient.addColorStop(1, 'rgba(200, 5, 82, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvasParticle);

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: particleTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction Physics with Smooth Damping (Lerp)
    const targetMouse = { x: 0, y: 0 };
    const currentMouse = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let prevPointerPos = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouse.x = x;
      targetMouse.y = y;

      if (isDragging) {
        const deltaX = e.clientX - prevPointerPos.x;
        const deltaY = e.clientY - prevPointerPos.y;
        targetRotationY += deltaX * 0.006;
        targetRotationX += deltaY * 0.006;
        prevPointerPos = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevPointerPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const handleMouseLeave = () => {
      targetMouse.x = 0;
      targetMouse.y = 0;
      isDragging = false;
      setIsInteracting(false);
    };

    // Mobile Touch Support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        targetMouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        targetMouse.y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;

      // Update liquid shader uniforms
      liquidUniforms.uTime.value = elapsedTime;
      liquidUniforms.uMouse.value.set(currentMouse.x, currentMouse.y);

      // Mode-dependent speed and scan pulse
      if (mode === 'scan') {
        liquidUniforms.uScanMode.value = THREE.MathUtils.lerp(liquidUniforms.uScanMode.value, 1.0, 0.1);
        liquidUniforms.uSpeed.value = 1.1;
      } else if (mode === 'anchor') {
        liquidUniforms.uScanMode.value = THREE.MathUtils.lerp(liquidUniforms.uScanMode.value, 0.0, 0.1);
        liquidUniforms.uSpeed.value = 0.35;
      } else {
        liquidUniforms.uScanMode.value = THREE.MathUtils.lerp(liquidUniforms.uScanMode.value, 0.0, 0.1);
        liquidUniforms.uSpeed.value = prefersReducedMotion ? 0.2 : 0.65;
      }

      // Parallax Tilt & Auto Rotation
      const autoRotateY = prefersReducedMotion ? 0 : elapsedTime * 0.12;
      blobGroup.rotation.y = autoRotateY + targetRotationY + currentMouse.x * 0.35;
      blobGroup.rotation.x = targetRotationX - currentMouse.y * 0.25;

      // Gentle floating sine wave motion
      blobGroup.position.y = -0.15 + Math.sin(elapsedTime * 0.8) * 0.08;

      // Inner Core Counter-Rotation
      innerCore.rotation.x = -elapsedTime * 0.25;
      innerCore.rotation.y = elapsedTime * 0.35;

      // Stardust particle subtle drift
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);

      liquidGeometry.dispose();
      liquidMaterial.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      renderer.dispose();

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [mode]);

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[540px] lg:min-h-[620px] flex items-center justify-center select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full absolute inset-0 cursor-${isInteracting ? 'grabbing' : 'grab'} transition-opacity duration-700`}
      />

      {/* Non-WebGL Fallback */}
      {!webGlSupported && (
        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center bg-white/80 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 mb-4 animate-pulse">
            <span className="font-mono font-black text-xs">SOLACE</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
            Soroban Fluid Core Active
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            WebGL hardware acceleration is disabled in your browser. All static AST and Protocol 22 invariant verifications continue running with full fidelity.
          </p>
        </div>
      )}

      {/* Mode Switcher Pill Control (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-white/80 dark:bg-[#111726]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-[11px] font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveMode('guard');
            onModeChange?.('guard');
          }}
          className={`px-3 py-1 rounded-full transition cursor-pointer ${
            activeMode === 'guard'
              ? 'bg-accent text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Fluid Core
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode('scan');
            onModeChange?.('scan');
          }}
          className={`px-3 py-1 rounded-full transition cursor-pointer ${
            activeMode === 'scan'
              ? 'bg-accent text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pulse Scan
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode('anchor');
            onModeChange?.('anchor');
          }}
          className={`px-3 py-1 rounded-full transition cursor-pointer ${
            activeMode === 'anchor'
              ? 'bg-accent text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ledger Anchor
        </button>
      </div>
    </div>
  );
}
