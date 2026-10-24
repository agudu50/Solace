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
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
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
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Track Theme (Light vs Dark Mode)
    let isDark = document.documentElement.classList.contains('dark');

    // 1. Cosmic Stardust Particle System
    const particleCount = 420;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Color definitions
    const colorAccent = new THREE.Color(0xC80552);
    const colorDarkWhite = new THREE.Color(0xffffff);
    const colorDarkSlate = new THREE.Color(0x64748b);
    const colorLightDark = new THREE.Color(0x0f172a);
    const colorLightSlate = new THREE.Color(0x475569);

    const updateParticleColors = (darkMode: boolean) => {
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const rand = (i % 10) / 10;
        let c = darkMode ? colorDarkSlate : colorLightSlate;
        if (rand < 0.45) {
          c = colorAccent;
        } else if (rand < 0.8) {
          c = darkMode ? colorDarkWhite : colorLightDark;
        }
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }
      const colorAttr = particleGeo.getAttribute('color') as THREE.BufferAttribute;
      if (colorAttr) colorAttr.needsUpdate = true;
    };

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 36;
      const y = (Math.random() - 0.5) * 44;
      const z = (Math.random() - 0.5) * 24 - 4;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      velocities[i3] = (Math.random() - 0.5) * 0.004;
      velocities[i3 + 1] = Math.random() * 0.005 + 0.002;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    updateParticleColors(isDark);

    // Circular particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(200, 5, 82, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTex = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.65 : 0.5,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 2. Multi-Section Cryptographic Hologram Wireframes (Distributed down the landing page)
    const wireframes: THREE.Mesh[] = [];

    // Helper to create wireframe node
    const createWireframe = (
      geo: THREE.BufferGeometry,
      color: number,
      opacity: number,
      pos: [number, number, number]
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      wireframes.push(mesh);
      return mesh;
    };

    // Hero Section Node: Icosahedron
    const ico1 = createWireframe(new THREE.IcosahedronGeometry(2.2, 1), 0xC80552, 0.08, [7.5, 1, -8]);
    // Features Node: Torus Loop
    const torus1 = createWireframe(new THREE.TorusGeometry(3.0, 0.4, 12, 36), 0xffffff, 0.05, [-8, -6, -11]);
    torus1.rotation.x = Math.PI / 3;
    // Simulator & Pipeline Node: Octahedron
    const oct1 = createWireframe(new THREE.OctahedronGeometry(2.0, 1), 0xC80552, 0.07, [8, -13, -9]);
    // Architecture Node: Dodecahedron
    const dodec1 = createWireframe(new THREE.DodecahedronGeometry(2.4, 1), 0xffffff, 0.05, [-7.5, -19, -10]);
    // Studio & Reports Node: Icosahedron
    const ico2 = createWireframe(new THREE.IcosahedronGeometry(2.1, 1), 0xC80552, 0.07, [7, -25, -9]);

    // Theme Mutation Observer to react to Light / Dark mode toggle in Navbar
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark');
      if (nowDark !== isDark) {
        isDark = nowDark;
        updateParticleColors(isDark);
        particleMat.opacity = isDark ? 0.65 : 0.5;
        particleMat.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
        particleMat.needsUpdate = true;

        wireframes.forEach((m) => {
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.opacity = isDark ? 0.08 : 0.06;
          mat.needsUpdate = true;
        });
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Parallax Scroll & Mouse Listeners
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
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth scroll lerp
      scrollY += (targetScrollY - scrollY) * 0.05;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Parallax camera movement based on page scroll depth
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const scrollProgress = scrollY / maxScroll; // 0 to 1

      // Camera smoothly tracks all the way down to y = -26 (covering the whole landing page)
      camera.position.y = -scrollProgress * 26 + currentMouseY * 0.5;
      camera.position.x = currentMouseX * 0.7;
      camera.lookAt(currentMouseX * 0.3, camera.position.y - 0.4, 0);

      // Slow geometric wireframe rotations
      if (!prefersReduced) {
        ico1.rotation.x = elapsed * 0.12;
        ico1.rotation.y = elapsed * 0.16;

        torus1.rotation.y = elapsed * 0.09;
        torus1.rotation.z = elapsed * 0.06;

        oct1.rotation.y = -elapsed * 0.14;
        oct1.rotation.x = elapsed * 0.09;

        dodec1.rotation.x = elapsed * 0.1;
        dodec1.rotation.y = -elapsed * 0.12;

        ico2.rotation.y = elapsed * 0.13;
        ico2.rotation.z = elapsed * 0.08;

        // Particle drifting with Camera-Relative Wrapping
        // This ensures the 3D stardust ALWAYS surrounds the screen from top to bottom
        const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const camY = camera.position.y;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posArray[i3] += velocities[i3];
          posArray[i3 + 1] += velocities[i3 + 1] + Math.sin(elapsed + i) * 0.003;
          posArray[i3 + 2] += velocities[i3 + 2];

          // Wrap particles relative to current Camera Y
          if (posArray[i3 + 1] > camY + 22) {
            posArray[i3 + 1] = camY - 22;
          } else if (posArray[i3 + 1] < camY - 22) {
            posArray[i3 + 1] = camY + 22;
          }

          if (posArray[i3] > 20) posArray[i3] = -20;
          if (posArray[i3] < -20) posArray[i3] = 20;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();

      wireframes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });

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
      className="fixed inset-0 pointer-events-none z-0 w-full h-full overflow-hidden"
    />
  );
}
