"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PALETTE = [
  0x68b5ff,
  0x4bdaed,
  0x9b88ff,
  0xd3a08d,
  0x61cdbb,
  0x69a5ff,
  0x58d2d0,
  0xd3a08d,
];

type Figure = {
  group: THREE.Group;
  target: HTMLElement;
  color: THREE.Color;
  materials: THREE.MeshBasicMaterial[];
  lines: THREE.LineBasicMaterial[];
  home: THREE.Vector3;
  intensity: number;
  index: number;
};

export function JobScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, 0.1, 40);
    camera.position.z = 20;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const figures: Figure[] = [];
    const geometries = new Set<THREE.BufferGeometry>();
    const pointerPosition = new THREE.Vector2(-1000, -1000);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let layoutFrame = 0;

    function disposeFigure(figure: Figure) {
      scene.remove(figure.group);
      figure.group.traverse((object) => {
        const geometry = (object as THREE.Mesh).geometry;
        if (geometry && geometries.has(geometry)) {
          geometry.dispose();
          geometries.delete(geometry);
        }
      });
      figure.materials.forEach((material) => material.dispose());
      figure.lines.forEach((material) => material.dispose());
    }

    function addBox(
      group: THREE.Group,
      color: THREE.Color,
      materials: THREE.MeshBasicMaterial[],
      lines: THREE.LineBasicMaterial[],
      position: [number, number, number],
      size: [number, number, number],
    ) {
      const geometry = new THREE.BoxGeometry(...size);
      geometries.add(geometry);
      const fillMaterial = new THREE.MeshBasicMaterial({
        color: color.clone().multiplyScalar(0.38),
        transparent: true,
        opacity: 0.055,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      fillMaterial.userData.baseColor = color.clone().multiplyScalar(0.38);
      fillMaterial.userData.activeColor = color.clone();
      fillMaterial.userData.baseOpacity = 0.055;
      fillMaterial.userData.activeOpacity = 0.2;
      materials.push(fillMaterial);
      const fill = new THREE.Mesh(geometry, fillMaterial);
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      geometries.add(edgeGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: color.clone().multiplyScalar(0.55),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        toneMapped: false,
      });
      edgeMaterial.userData.baseColor = color.clone().multiplyScalar(0.55);
      edgeMaterial.userData.activeColor = color.clone();
      edgeMaterial.userData.baseOpacity = 0.2;
      edgeMaterial.userData.activeOpacity = 0.9;
      lines.push(edgeMaterial);
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      fill.position.set(...position);
      edges.position.set(...position);
      group.add(fill, edges);
    }

    function addPath(
      group: THREE.Group,
      color: THREE.Color,
      lines: THREE.LineBasicMaterial[],
      points: [number, number, number][],
      closed = false,
    ) {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      );
      geometries.add(geometry);
      const material = new THREE.LineBasicMaterial({
        color: color.clone().multiplyScalar(0.55),
        transparent: true,
        opacity: 0.21,
        depthWrite: false,
        toneMapped: false,
      });
      material.userData.baseColor = color.clone().multiplyScalar(0.55);
      material.userData.activeColor = color.clone();
      material.userData.baseOpacity = 0.21;
      material.userData.activeOpacity = 0.9;
      lines.push(material);
      group.add(closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material));
    }

    function addRing(
      group: THREE.Group,
      color: THREE.Color,
      materials: THREE.MeshBasicMaterial[],
      lines: THREE.LineBasicMaterial[],
      position: [number, number, number],
      radius: number,
      tube = 0.018,
    ) {
      const geometry = new THREE.TorusGeometry(radius, tube, 8, 32);
      geometries.add(geometry);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: color.clone().multiplyScalar(0.45),
          transparent: true,
          opacity: 0.11,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      mesh.material.userData.baseColor = color.clone().multiplyScalar(0.45);
      mesh.material.userData.activeColor = color.clone();
      mesh.material.userData.baseOpacity = 0.11;
      mesh.material.userData.activeOpacity = 0.78;
      materials.push(mesh.material);
      const edgeGeometry = new THREE.EdgesGeometry(geometry, 12);
      geometries.add(edgeGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        toneMapped: false,
      });
      edgeMaterial.userData.baseColor = color.clone();
      edgeMaterial.userData.activeColor = color.clone();
      edgeMaterial.userData.baseOpacity = 0.34;
      edgeMaterial.userData.activeOpacity = 1;
      lines.push(edgeMaterial);
      mesh.position.set(...position);
      const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edge.position.copy(mesh.position);
      group.add(mesh, edge);
    }

    function addMarker(
      group: THREE.Group,
      color: THREE.Color,
      materials: THREE.MeshBasicMaterial[],
      lines: THREE.LineBasicMaterial[],
      position: [number, number, number],
      radius: number,
    ) {
      const geometry = new THREE.IcosahedronGeometry(radius, 1);
      geometries.add(geometry);
      const material = new THREE.MeshBasicMaterial({
        color: color.clone().multiplyScalar(0.4),
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      material.userData.baseColor = color.clone().multiplyScalar(0.4);
      material.userData.activeColor = color.clone();
      material.userData.baseOpacity = 0.16;
      material.userData.activeOpacity = 0.88;
      materials.push(material);
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      geometries.add(edgeGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        toneMapped: false,
      });
      edgeMaterial.userData.baseColor = color.clone();
      edgeMaterial.userData.activeColor = color.clone();
      edgeMaterial.userData.baseOpacity = 0.42;
      edgeMaterial.userData.activeOpacity = 1;
      lines.push(edgeMaterial);
      const mesh = new THREE.Mesh(geometry, material);
      const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      mesh.position.set(...position);
      edge.position.copy(mesh.position);
      group.add(mesh, edge);
    }

    function addCalendar(group: THREE.Group, color: THREE.Color, materials: THREE.MeshBasicMaterial[], lines: THREE.LineBasicMaterial[], withClock = false) {
      addBox(group, color, materials, lines, [0, 0, 0], [0.92, 0.78, 0.14]);
      addPath(group, color, lines, [[-0.46, 0.18, 0.08], [0.46, 0.18, 0.08]]);
      [-0.25, 0.25].forEach((x) => addBox(group, color, materials, lines, [x, 0.47, 0.07], [0.07, 0.21, 0.07]));
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          addBox(group, color, materials, lines, [-0.25 + column * 0.25, 0.04 - row * 0.16, 0.09], [0.065, 0.065, 0.045]);
        }
      }
      if (withClock) {
        addRing(group, color, materials, lines, [0.53, -0.29, 0.13], 0.17);
        addPath(group, color, lines, [[0.53, -0.29, 0.14], [0.53, -0.17, 0.14], [0.62, -0.29, 0.14]]);
      }
    }

    function buildFigure(index: number, color: THREE.Color) {
      const group = new THREE.Group();
      const materials: THREE.MeshBasicMaterial[] = [];
      const lines: THREE.LineBasicMaterial[] = [];

      if (index === 0) {
        addBox(group, color, materials, lines, [0, -0.08, 0], [1.02, 0.62, 0.24]);
        addBox(group, color, materials, lines, [0, 0.35, 0], [0.38, 0.2, 0.2]);
        addBox(group, color, materials, lines, [0, -0.08, 0.15], [0.12, 0.16, 0.06]);
        addPath(group, color, lines, [[-0.5, 0.02, 0.13], [0.5, 0.02, 0.13]]);
        [-0.4, 0.4].forEach((x) => {
          addMarker(group, color, materials, lines, [x, 0.16, 0.14], 0.035);
          addBox(group, color, materials, lines, [x, -0.43, 0], [0.13, 0.05, 0.06]);
          addPath(group, color, lines, [[x, -0.3, 0.13], [x, 0.15, 0.13]]);
        });
      } else if (index === 1) {
        const nodes: [number, number, number][] = [[-0.72, -0.34, 0], [-0.26, 0.22, 0.18], [0.26, -0.16, -0.16], [0.72, 0.32, 0.05]];
        addPath(group, color, lines, nodes);
        nodes.forEach((point, nodeIndex) => addMarker(group, color, materials, lines, point, nodeIndex === 3 ? 0.13 : 0.095));
        addRing(group, color, materials, lines, [0.72, 0.32, 0.1], 0.19);
      } else if (index === 2 || index === 7) {
        addCalendar(group, color, materials, lines, index === 7);
      } else if (index === 3) {
        addRing(group, color, materials, lines, [0, 0.13, 0.08], 0.45);
        const points: [number, number, number][] = [];
        for (let point = 0; point <= 10; point++) {
          const angle = point * Math.PI / 5 - Math.PI / 2;
          const radius = point % 2 ? 0.2 : 0.43;
          points.push([Math.cos(angle) * radius, Math.sin(angle) * radius + 0.13, 0.13]);
        }
        addPath(group, color, lines, points, true);
        addBox(group, color, materials, lines, [-0.11, -0.48, 0], [0.18, 0.34, 0.05]);
        addBox(group, color, materials, lines, [0.11, -0.48, 0], [0.18, 0.34, 0.05]);
      } else if (index === 4) {
        addBox(group, color, materials, lines, [-0.12, 0, 0], [0.78, 1.02, 0.11]);
        addPath(group, color, lines, [[0.19, 0.51, 0.06], [0.19, 0.29, 0.06], [0.4, 0.29, 0.06]]);
        [-0.22, -0.04, 0.14].forEach((y, row) => addPath(group, color, lines, [[-0.4, y, 0.07], [0.15 - row * 0.06, y, 0.07]]));
        addBox(group, color, materials, lines, [0.43, -0.29, 0.08], [0.3, 0.3, 0.07]);
        addPath(group, color, lines, [[0.43, -0.39, 0.13], [0.43, -0.19, 0.13], [0.33, -0.29, 0.13], [0.53, -0.29, 0.13]]);
      } else if (index === 5) {
        addBox(group, color, materials, lines, [-0.21, 0, 0], [0.72, 1, 0.1]);
        addPath(group, color, lines, [[-0.46, 0.29, 0.06], [-0.04, 0.29, 0.06]]);
        [-0.02, -0.19, -0.36].forEach((y, row) => addPath(group, color, lines, [[-0.48, y, 0.06], [0.02 - row * 0.04, y, 0.06]]));
        addRing(group, color, materials, lines, [0.39, -0.05, 0.12], 0.23, 0.026);
        addBox(group, color, materials, lines, [0.57, -0.36, 0.12], [0.4, 0.05, 0.05]);
        addPath(group, color, lines, [[0.3, -0.06, 0.13], [0.37, -0.14, 0.13], [0.5, 0.05, 0.13]]);
      } else {
        const stages: [number, number, number][] = [[-0.55, -0.04, 0], [0, 0.08, 0.08], [0.55, 0.22, 0]];
        stages.forEach(([x, y, z], stageIndex) => {
          addBox(group, color, materials, lines, [x, y, z], [0.34, 0.48, 0.12]);
          addPath(group, color, lines, [[x - 0.1, y + 0.09, z + 0.07], [x + 0.1, y + 0.09, z + 0.07], [x - 0.1, y - 0.03, z + 0.07], [x + 0.08, y - 0.03, z + 0.07]]);
          if (stageIndex < stages.length - 1) {
            const next = stages[stageIndex + 1];
            addPath(group, color, lines, [[x + 0.18, y, z], [next[0] - 0.18, next[1], next[2]]]);
          }
        });
      }

      group.scale.setScalar(index < 4 ? 0.56 : 0.64);
      scene.add(group);
      return { group, materials, lines };
    }

    function updateLayout() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const halfHeight = 5;
      const aspect = width / height;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      const targets = Array.from(document.querySelectorAll<HTMLElement>(".card, .auth-scene-target")).filter((target) => {
        const rect = target.getBoundingClientRect();
        return rect.width > 120 && rect.height > 90 && rect.bottom > 0 && rect.top < height;
      }).slice(0, PALETTE.length);

      while (figures.length > targets.length) {
        const figure = figures.pop()!;
        disposeFigure(figure);
      }

      targets.forEach((target, index) => {
        let figure = figures[index];
        if (!figure || figure.target !== target) {
          if (figure) {
            disposeFigure(figure);
          }
          const color = new THREE.Color(PALETTE[index]);
          const built = buildFigure(index, color);
          figure = { ...built, target, color, home: new THREE.Vector3(), intensity: 0, index };
          figures[index] = figure;
        }
        const rect = target.getBoundingClientRect();
        const x = (rect.left + rect.width * 0.83) / width;
        const y = (rect.top + rect.height * 0.53) / height;
        figure.group.position.set((x - 0.5) * halfHeight * 2 * aspect, (0.5 - y) * halfHeight * 2, index % 2 ? -0.7 : 0);
        figure.home.copy(figure.group.position);
        const scale = Math.min(1, Math.max(0.58, rect.width / 270));
        figure.group.scale.setScalar((index < 4 ? 0.56 : 0.64) * scale * 1.08);
      });
    }

    function queueLayout() {
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(updateLayout);
    }

    function onPointerMove(event: PointerEvent) {
      pointerPosition.set(event.clientX, event.clientY);
    }

    function animate(now: number) {
      animationFrame = requestAnimationFrame(animate);
      figures.forEach((figure) => {
        const rect = figure.target.getBoundingClientRect();
        const nearCard = pointerPosition.x >= rect.left - 12 && pointerPosition.x <= rect.right + 12
          && pointerPosition.y >= rect.top - 12 && pointerPosition.y <= rect.bottom + 12;
        const desired = nearCard ? 1 : 0;
        figure.intensity += (desired - figure.intensity) * 0.06;
        figure.materials.forEach((material) => {
          material.opacity = material.userData.baseOpacity + figure.intensity * (material.userData.activeOpacity - material.userData.baseOpacity);
          material.color.copy(material.userData.baseColor).lerp(material.userData.activeColor, figure.intensity);
        });
        figure.lines.forEach((material) => {
          material.opacity = material.userData.baseOpacity + figure.intensity * (material.userData.activeOpacity - material.userData.baseOpacity);
          material.color.copy(material.userData.baseColor).lerp(material.userData.activeColor, figure.intensity);
        });
        if (!reduceMotion.matches) {
          figure.group.rotation.y = now * (Math.PI * 2 / 16000) + figure.index * 0.12;
          figure.group.rotation.x = -0.1 + Math.sin(now * 0.0005 + figure.index) * 0.05;
          figure.group.position.y = figure.home.y + Math.sin(now * 0.0004 + figure.index) * 0.025;
        }
      });
      renderer.render(scene, camera);
    }

    const observer = new MutationObserver(queueLayout);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", queueLayout);
    window.addEventListener("scroll", queueLayout, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    updateLayout();
    animate(0);

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(layoutFrame);
      observer.disconnect();
      window.removeEventListener("resize", queueLayout);
      window.removeEventListener("scroll", queueLayout);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      renderer.dispose();
      figures.forEach(disposeFigure);
      geometries.forEach((geometry) => geometry.dispose());
    };
  }, []);

  return <canvas ref={canvasRef} className="app-scene-canvas" aria-hidden="true" />;
}
