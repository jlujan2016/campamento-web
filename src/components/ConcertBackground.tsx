import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Fondo animado de concierto de rock:
// luces de escenario, público en silueta saltando, chispas y strobe
export default function ConcertBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Accesibilidad: si la persona pidió menos animaciones, no animamos
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Rendimiento: menos partículas y público en pantallas chicas
    const isMobile = window.innerWidth < 640;
    const PARTICLE_COUNT = isMobile ? 150 : 350;
    const CROWD_COUNT = isMobile ? 20 : 46;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    const setSize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    };
    setSize();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0405, 0.03);

    const camera = new THREE.PerspectiveCamera(
      62,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.5, 15);

    // ── Haces de luz del escenario (rojo/naranja/amarillo) ──
    const beamColors = [0xdc2626, 0xf97316, 0xfacc15, 0xdc2626, 0xf97316];
    const beams: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.ConeGeometry(1.4, 18, 20, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        color: beamColors[i],
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(geo, mat);
      beam.position.set((i - 2) * 4.2, 10, -8);
      beam.userData.phase = i * 1.7;
      beam.userData.speed = 1.2 + Math.random() * 1.4;
      beams.push(beam);
      scene.add(beam);
    }

    // ── Público en silueta (cabeza + cuerpo + brazo opcional) ──
    const crowd: THREE.Group[] = [];
    const crowdMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for (let c = 0; c < CROWD_COUNT; c++) {
      const grp = new THREE.Group();

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        crowdMat
      );
      head.position.y = 0.85;
      grp.add(head);

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.42, 1.1, 8),
        crowdMat
      );
      body.position.y = 0.1;
      grp.add(body);

      if (Math.random() > 0.35) {
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6),
          crowdMat
        );
        const side = Math.random() > 0.5 ? 1 : -1;
        arm.position.set(0.3 * side, 1.15, 0);
        arm.rotation.z = side * -0.35;
        arm.userData.isArm = true;
        arm.userData.phase = Math.random() * Math.PI * 2;
        grp.add(arm);
      }

      const row = Math.floor(c / 16);
      const xPos = ((c % 16) - 7.5) * 1.9 + (Math.random() - 0.5) * 0.8;
      grp.position.set(xPos, -5.2 - row * 0.9, 4 - row * 2.2);
      const s = 1.0 + row * 0.28;
      grp.scale.set(s, s, s);
      grp.userData.jumpPhase = Math.random() * Math.PI * 2;
      grp.userData.baseY = grp.position.y;
      crowd.push(grp);
      scene.add(grp);
    }

    // ── Chispas subiendo (pirotecnia) ──
    const pgeo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      pos[j * 3] = (Math.random() - 0.5) * 36;
      pos[j * 3 + 1] = Math.random() * 24 - 8;
      pos[j * 3 + 2] = (Math.random() - 0.5) * 16;
      vel[j] = 0.02 + Math.random() * 0.05;
    }
    pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sparks = new THREE.Points(
      pgeo,
      new THREE.PointsMaterial({
        color: 0xffa544,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(sparks);

    // ── Strobe (destello blanco aleatorio) ──
    const flash = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    flash.position.set(0, 2, -12);
    scene.add(flash);

    let t = 0;
    let nextStrobe = 3;
    let frameId = 0;

    const animate = () => {
      t += 0.013;

      beams.forEach(b => {
        b.rotation.z = Math.sin(t * b.userData.speed + b.userData.phase) * 0.7;
        (b.material as THREE.MeshBasicMaterial).opacity =
          0.08 + Math.abs(Math.sin(t * 2.2 + b.userData.phase)) * 0.14;
      });

      crowd.forEach(g => {
        g.position.y =
          g.userData.baseY + Math.abs(Math.sin(t * 3.2 + g.userData.jumpPhase)) * 0.35;
        g.children.forEach(child => {
          if (child.userData.isArm) {
            child.rotation.z = Math.sin(t * 4 + child.userData.phase) * 0.5 - 0.2;
          }
        });
      });

      const arr = sparks.geometry.attributes.position.array as Float32Array;
      for (let k = 0; k < PARTICLE_COUNT; k++) {
        arr[k * 3 + 1] += vel[k];
        if (arr[k * 3 + 1] > 16) arr[k * 3 + 1] = -8;
      }
      sparks.geometry.attributes.position.needsUpdate = true;

      const flashMat = flash.material as THREE.MeshBasicMaterial;
      if (t > nextStrobe) {
        flashMat.opacity = 0.18;
        nextStrobe = t + 2.5 + Math.random() * 3;
      }
      if (flashMat.opacity > 0) flashMat.opacity *= 0.85;

      camera.position.x = Math.sin(t * 0.25) * 1.5;
      camera.lookAt(0, 0, -2);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    if (reducedMotion) {
      // Sin animación: renderizamos un solo frame estático
      renderer.render(scene, camera);
    } else {
      animate();
    }

    // Pausar cuando la pestaña no está visible (ahorra batería)
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else if (!reducedMotion) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onResize = () => {
      setSize();
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Limpieza al desmontar el componente (importante en React)
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material;
          mat.dispose();
        }
      });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#0a0405' }}
    />
  );
}