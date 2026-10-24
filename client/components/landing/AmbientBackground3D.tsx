'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AmbientBackground3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return;
    } catch (_) {
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Performance optimization for background
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 1. Cosmic Stardust Particle System (Drifting across the whole landing page)
    const particleCount = 380;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Dominant Color #C80552
    const colorAccent = new THREE.Color(0xC80552);
    const colorWhite = new THREE.Color(0xffffff);
    const colorMuted = new THREE.Color(0x71717a);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread across a tall volume matching page scroll depth
      const x = (Math.random() - 0.5) * 36;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 24 - 4;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      velocities[i3] = (Math.random() - 0.5) * 0.004;
      velocities[i3 + 1] = (Math.random() * 0.006 + 0.002);
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;

      // Color distribution: 40% accent, 35% white, 25% muted
      const rand = Math.random();
      let c = colorMuted;
      if (rand < 0.45) {
        c = colorAccent;
      } else if (rand < 0.75) {
        c = colorWhite;
      }

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circular particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(200, 5, 82, 0.7)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTex = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 2. Subtle Cryptographic Geometric Wireframes (Deep in background)
    // Wireframe Icosahedron node
    const icoGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const wireMat1 = new THREE.MeshBasicMaterial({
      color: 0xC80552,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const icoMesh = new THREE.Mesh(icoGeo, wireMat1);
    icoMesh.position.set(7, -6, -8);
    scene.add(icoMesh);

    // Wireframe Torus ring
    const torusGeo = new THREE.TorusGeometry(3.2, 0.45, 12, 36);
    const wireMat2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const torusMesh = new THREE.Mesh(torusGeo, wireMat2);
    torusMesh.position.set(-8, 8, -12);
    torusMesh.rotation.x = Math.PI / 3;
    scene.add(torusMesh);

    // Wireframe Octahedron
    const octGeo = new THREE.OctahedronGeometry(2.0, 1);
    const wireMat3 = new THREE.MeshBasicMaterial({
      color: 0xC80552,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const octMesh = new THREE.Mesh(octGeo, wireMat3);
    octMesh.position.set(-6, -18, -10);
    scene.add(octMesh);

    // Scroll & Mouse Parallax State
    let scrollY = window.scrollY;
    let targetScrollY = scrollY;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth scroll lerp
      scrollY += (targetScrollY - scrollY) * 0.05;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Parallax camera movement based on scroll depth & mouse
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const scrollProgress = scrollY / maxScroll; // 0 to 1

      // Move camera gently downwards as user scrolls down the landing page
      camera.position.y = -scrollProgress * 22 + currentMouseY * 0.6;
      camera.position.x = currentMouseX * 0.8;
      camera.lookAt(currentMouseX * 0.4, camera.position.y - 0.5, 0);

      // Slow geometric rotations
      if (!prefersReduced) {
        icoMesh.rotation.x = elapsed * 0.12;
        icoMesh.rotation.y = elapsed * 0.18;

        torusMesh.rotation.y = elapsed * 0.09;
        torusMesh.rotation.z = elapsed * 0.06;

        octMesh.rotation.y = -elapsed * 0.15;
        octMesh.rotation.x = elapsed * 0.1;

        // Particle drifting
        const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          // Slowly drift upward/downward and float
          posArray[i3] += velocities[i3];
          posArray[i3 + 1] += velocities[i3 + 1] + Math.sin(elapsed + i) * 0.003;
          posArray[i3 + 2] += velocities[i3 + 2];

          // Wrap around volume
          if (posArray[i3 + 1] > 26) posArray[i3 + 1] = -26;
          if (posArray[i3] > 18) posArray[i3] = -18;
          if (posArray[i3] < -18) posArray[i3] = 18;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
      icoGeo.dispose();
      wireMat1.dispose();
      torusGeo.dispose();
      wireMat2.dispose();
      octGeo.dispose();
      wireMat3.dispose();
      renderer.dispose();

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden"
    />
  );
}
