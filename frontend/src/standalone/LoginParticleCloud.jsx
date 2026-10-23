import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LoginParticleCloud.css";

const POINT_COUNT = 96;
const POD_RADIUS = 1.58;
const DATASPACE_EDGE_RADIUS = 0.92;
const NETWORK_SCALE = 1.54;
const LINE_DRAW_SECONDS = 3.6;
const LINE_CYCLE_SECONDS = 6.8;
const SELF_DIRECTION = new THREE.Vector3(-1, 0.04, 0.1).normalize();
const NODE_COLORS = [0xcbd5e1, 0xe2e8f0, 0xf8fafc, 0x93c5fd, 0xbfdbfe];

const getSourceRadius = (index) =>
  POD_RADIUS * (0.92 + ((index * 17) % 19) / 100);

const getEllipsoidPoint = (direction, radius) =>
  new THREE.Vector3(
    direction.x * radius * 1.18,
    direction.y * radius * 0.74,
    direction.z * radius * 0.98
  );

const getPointDirection = (index, total) => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(total - 1, 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * goldenAngle + 0.72;
  const direction = new THREE.Vector3(
    Math.cos(theta) * radius,
    y * 0.64,
    Math.sin(theta) * radius
  ).normalize();

  if (direction.dot(SELF_DIRECTION) > 0.68) {
    direction.x = Math.abs(direction.x);
    direction.y *= -0.8;
    direction.normalize();
  }

  return direction;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createSeededRandom = (seed) => {
  let current = seed;
  return () => {
    current |= 0;
    current = (current + 0x6d2b79f5) | 0;
    let next = Math.imul(current ^ (current >>> 15), 1 | current);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const createConnectionMesh = (start, end, radius, color, opacity) => {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12, 1, true);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);

  geometry.translate(0, length / 2, 0);
  mesh.position.copy(start);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  mesh.scale.y = 0.001;
  mesh.userData.baseOpacity = opacity;

  return mesh;
};

const createSignalLine = (startEntry, endEntry) => {
  const startDirection = startEntry.direction;
  const endDirection = endEntry.direction;
  const start = startEntry.position.clone().addScaledVector(startDirection, -0.08);
  const end = endEntry.position.clone().addScaledVector(endDirection, -0.08);
  const startEdge = getEllipsoidPoint(startDirection, DATASPACE_EDGE_RADIUS);
  const endEdge = getEllipsoidPoint(endDirection, DATASPACE_EDGE_RADIUS);
  const path = [start, startEdge, endEdge, end];
  const group = new THREE.Group();
  const segments = [];

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = createConnectionMesh(
      path[index],
      path[index + 1],
      0.018,
      0xff9f43,
      0.96
    );

    segment.renderOrder = 3;
    segments.push({ mesh: segment, index });
    group.add(segment);
  }

  group.userData = {
    segments,
    segmentCount: path.length - 1,
  };

  return group;
};

const createRandomSignalLine = (pointEntries, random, previousPair = "") => {
  let startIndex = 0;
  let endIndex = 1;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    startIndex = Math.floor(random() * pointEntries.length);
    endIndex = Math.floor(random() * pointEntries.length);
    const startEntry = pointEntries[startIndex];
    const endEntry = pointEntries[endIndex];
    const nextPair = `${startIndex}:${endIndex}`;

    if (
      startIndex !== endIndex &&
      nextPair !== previousPair &&
      startEntry.direction.dot(endEntry.direction) < 0.58
    ) {
      break;
    }
  }

  const signalLine = createSignalLine(pointEntries[startIndex], pointEntries[endIndex]);
  signalLine.userData.pairKey = `${startIndex}:${endIndex}`;
  return signalLine;
};

const disposeObject = (object) => {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
};

export default function LoginParticleCloud({ label = "Solid Dataspace" } = {}) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const showFallback = () => {
      host.classList.add("login-particle-cloud--fallback");
      return () => host.classList.remove("login-particle-cloud--fallback");
    };
    if (typeof window.WebGL2RenderingContext === "undefined") return showFallback();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
    } catch {
      return showFallback();
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const network = new THREE.Group();
    network.scale.setScalar(NETWORK_SCALE);
    scene.add(network);

    const pointGroups = [];
    const pointEntries = [];
    const nodeGeometry = new THREE.SphereGeometry(0.023, 16, 10);
    const glowGeometry = new THREE.SphereGeometry(0.048, 16, 10);

    const createMaterial = (color, opacity, additive = false) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

    const addPoint = ({
      position,
      color,
      phase,
      baseScale = 1,
      connected = false,
    }) => {
      const group = new THREE.Group();
      group.position.copy(position);
      group.userData = {
        basePosition: position.clone(),
        phase,
        baseScale,
      };

      const glow = new THREE.Mesh(
        glowGeometry,
        createMaterial(color, connected ? 0.16 : 0.1, true)
      );
      const core = new THREE.Mesh(
        nodeGeometry,
        createMaterial(color, 0.96)
      );

      group.add(glow);
      group.add(core);
      network.add(group);
      pointGroups.push(group);
    };

    for (let index = 0; index < POINT_COUNT; index += 1) {
      const direction = getPointDirection(index, POINT_COUNT);
      const position = getEllipsoidPoint(direction, getSourceRadius(index));
      const color = NODE_COLORS[index % NODE_COLORS.length];
      pointEntries.push({ direction, position });
      addPoint({
        position,
        color,
        phase: index * 0.87,
        connected: index % 11 === 0 || index % 17 === 0,
      });
    }

    const lineRandom = createSeededRandom(Date.now() & 0xfffffff);
    let signalLine = createRandomSignalLine(pointEntries, lineRandom);
    let lineStartedAt = 0;
    network.add(signalLine);

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const worldPosition = new THREE.Vector3();
    const state = {
      currentX: -0.06,
      currentY: 0.22,
      targetX: -0.06,
      targetY: 0.22,
      pointerX: 0,
      pointerY: 0,
      hovered: false,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    let requestRender = () => {};

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      camera.aspect = width / height;
      camera.position.z = width < 540 ? 7.55 : 6.5;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestRender();
    };

    const setPointer = (event) => {
      const rect = host.getBoundingClientRect();
      state.pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      state.pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      requestRender();
    };

    const handlePointerEnter = (event) => {
      state.hovered = true;
      setPointer(event);
    };

    const handlePointerMove = (event) => {
      setPointer(event);

      if (!state.dragging) return;

      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;
      state.targetY += deltaX * 0.0075;
      state.targetX = clamp(state.targetX + deltaY * 0.005, -0.82, 0.82);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };

    const handlePointerDown = (event) => {
      state.dragging = true;
      state.hovered = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      host.classList.add("is-dragging");
      host.setPointerCapture?.(event.pointerId);
    };

    const stopDragging = (event) => {
      state.dragging = false;
      host.classList.remove("is-dragging");
      if (event?.pointerId) {
        host.releasePointerCapture?.(event.pointerId);
      }
    };

    const handlePointerLeave = (event) => {
      state.hovered = false;
      state.pointerX = 0;
      state.pointerY = 0;
      stopDragging(event);
    };

    host.addEventListener("pointerenter", handlePointerEnter);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("pointerup", stopDragging);
    host.addEventListener("pointercancel", stopDragging);
    host.addEventListener("pointerleave", handlePointerLeave);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    }
    window.addEventListener("resize", resize);
    resize();

    const startedAt = performance.now();
    let animationFrame = 0;

    const render = () => {
      animationFrame = 0;
      if (document.hidden) return;
      const elapsed = (performance.now() - startedAt) / 1000;
      const reducedMotion = Boolean(motionQuery?.matches);
      const hoverStrength = state.hovered ? 1 : 0;

      if (!reducedMotion) {
        state.targetY += state.hovered ? 0.00075 : 0.00054;
      }

      const desiredX =
        state.targetX + (state.dragging ? 0 : state.pointerY * 0.18 * hoverStrength);
      const desiredY =
        state.targetY + (state.dragging ? 0 : state.pointerX * 0.3 * hoverStrength);

      state.currentX = reducedMotion ? desiredX : state.currentX + (desiredX - state.currentX) * 0.075;
      state.currentY = reducedMotion ? desiredY : state.currentY + (desiredY - state.currentY) * 0.075;

      network.rotation.x = state.currentX;
      network.rotation.y = state.currentY;
      network.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.2) * 0.025;

      pointGroups.forEach((group) => {
        const { basePosition, phase, baseScale } = group.userData;
        const pulse = reducedMotion ? 1 : 1 + Math.sin(elapsed * 1.4 + phase) * 0.055;
        const orbit = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + phase) * 0.008;
        group.position.copy(basePosition).multiplyScalar(1 + orbit);
        group.scale.setScalar(baseScale * pulse);
      });

      network.updateMatrixWorld(true);
      pointGroups.forEach((group) => {
        group.getWorldPosition(worldPosition);
        group.visible = worldPosition.z >= -0.04;
      });

      if (!reducedMotion && elapsed - lineStartedAt >= LINE_CYCLE_SECONDS) {
        const previousPair = signalLine.userData.pairKey || "";
        network.remove(signalLine);
        disposeObject(signalLine);
        signalLine = createRandomSignalLine(pointEntries, lineRandom, previousPair);
        lineStartedAt = elapsed;
        network.add(signalLine);
      }

      const cycleAge = reducedMotion ? LINE_DRAW_SECONDS : elapsed - lineStartedAt;
      const fadeIn = clamp(cycleAge / 0.35, 0, 1);
      const fadeOut = clamp((LINE_CYCLE_SECONDS - cycleAge) / 1.1, 0, 1);
      const opacity = fadeIn * fadeOut;
      const progress = clamp(cycleAge / LINE_DRAW_SECONDS, 0, 1);

      signalLine.userData.segments.forEach(({ mesh, index }) => {
        const segmentProgress = clamp(
          progress * signalLine.userData.segmentCount - index,
          0,
          1
        );
        mesh.scale.y = Math.max(0.001, segmentProgress);
        mesh.material.opacity = mesh.userData.baseOpacity * opacity * segmentProgress;
      });

      renderer.render(scene, camera);
      if (!reducedMotion) requestRender();
    };

    requestRender = () => {
      if (!animationFrame && !document.hidden) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };
    const handleVisibility = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      requestRender();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery?.addEventListener?.("change", requestRender);
    requestRender();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery?.removeEventListener?.("change", requestRender);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
      host.removeEventListener("pointerenter", handlePointerEnter);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointerup", stopDragging);
      host.removeEventListener("pointercancel", stopDragging);
      host.removeEventListener("pointerleave", handlePointerLeave);
      disposeObject(network);
      nodeGeometry.dispose();
      glowGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="login-visual-band" aria-hidden="true">
      <div className="login-particle-cloud" ref={hostRef} />
      <div className="login-particle-cloud__label">{label}</div>
    </div>
  );
}
