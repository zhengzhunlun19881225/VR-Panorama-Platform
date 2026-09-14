import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { Scene, Hotspot, ViewAngle, HotspotType } from '../../types';
import { yawPitchToVector3, vector3ToYawPitch, worldToScreenCoords } from '../../utils/panoramaHelper';
import { 
  Compass, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Smartphone,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  Image as ImageIcon,
  Video,
  Music,
  ExternalLink,
  Phone,
  HelpCircle,
  Plus,
  Move
} from 'lucide-react';

export interface PanoramaViewerRef {
  setView: (yaw: number, pitch: number, fov?: number, animated?: boolean) => void;
  triggerLittlePlanet: () => void;
}

interface PanoramaViewerProps {
  scene: Scene;
  allScenes?: Scene[];
  isEditorMode?: boolean;
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: Hotspot | null) => void;
  onSceneJump?: (targetSceneId: string, landingView?: { yaw: number; pitch: number }) => void;
  onHotspotClick?: (hotspot: Hotspot) => void;
  onAddHotspotAtPosition?: (pos: { yaw: number; pitch: number }) => void;
  onCanvasClickForHotspot?: (pos: { yaw: number; pitch: number }) => void;
  isPlacingHotspot?: boolean;
  onViewChange?: (view: ViewAngle) => void;
  onCameraAngleChange?: (view: ViewAngle) => void;
  activeRoamTarget?: { view: ViewAngle; duration: number } | null;
  onUpdateHotspotPosition?: (hotspotId: string, position: { yaw: number; pitch: number }) => void;
}

export const PanoramaViewer = forwardRef<PanoramaViewerRef, PanoramaViewerProps>(({
  scene,
  allScenes = [],
  isEditorMode = false,
  selectedHotspotId = null,
  onSelectHotspot,
  onSceneJump,
  onHotspotClick,
  onAddHotspotAtPosition,
  onCanvasClickForHotspot,
  isPlacingHotspot = false,
  onViewChange,
  onCameraAngleChange,
  activeRoamTarget = null,
  onUpdateHotspotPosition
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const scene3DRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const audioBgRef = useRef<HTMLAudioElement | null>(null);
  const audioNarrationRef = useRef<HTMLAudioElement | null>(null);

  // Viewport camera state
  const [yaw, setYaw] = useState<number>(scene.initialView.yaw);
  const [pitch, setPitch] = useState<number>(scene.initialView.pitch);
  const [fov, setFov] = useState<number>(scene.initialView.fov);

  const [hotspotScreenPositions, setHotspotScreenPositions] = useState<
    { id: string; x: number; y: number; isBehind: boolean }[]
  >([]);

  // Interactive controls state
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(scene.autoRotate);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlayingPlanetAnimation, setIsPlayingPlanetAnimation] = useState<boolean>(false);

  // Hotspot Drag Interaction Tracking (in Editor Mode)
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);
  const draggedHotspotRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);
  const justDraggedRef = useRef<boolean>(false);

  // Drag interaction tracking for camera
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const viewStateRef = useRef({
    yaw: Number.isFinite(scene.initialView?.yaw) ? scene.initialView.yaw : 0,
    pitch: Number.isFinite(scene.initialView?.pitch) ? scene.initialView.pitch : 0,
    fov: Number.isFinite(scene.initialView?.fov) ? scene.initialView.fov : 75
  });

  // Dedicated refs to track and cancel animation frames
  const transitionAnimIdRef = useRef<number | null>(null);
  const roamAnimIdRef = useRef<number | null>(null);
  const planetAnimIdRef = useRef<number | null>(null);
  
  // Stably keep current scene & dynamic flags accessible to the renderLoop closure
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const isAutoRotatingRef = useRef(scene.autoRotate);
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  const isPlayingPlanetAnimationRef = useRef(false);
  useEffect(() => {
    isPlayingPlanetAnimationRef.current = isPlayingPlanetAnimation;
  }, [isPlayingPlanetAnimation]);

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotating((prev) => {
      const next = !prev;
      isAutoRotatingRef.current = next;
      return next;
    });
  }, []);

  // Update viewStateRef when state updates
  useEffect(() => {
    viewStateRef.current = { yaw, pitch, fov };
    onViewChange?.({ yaw, pitch, fov });
    onCameraAngleChange?.({ yaw, pitch, fov });
  }, [yaw, pitch, fov, onViewChange, onCameraAngleChange]);

  // Window pointer move and up listeners while dragging a hotspot
  useEffect(() => {
    if (!draggingHotspotId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!draggedHotspotRef.current || !containerRef.current || !cameraRef.current) return;
      const dx = e.clientX - draggedHotspotRef.current.startX;
      const dy = e.clientY - draggedHotspotRef.current.startY;
      if (Math.hypot(dx, dy) > 4) {
        draggedHotspotRef.current.hasMoved = true;
        justDraggedRef.current = true;
      }

      if (draggedHotspotRef.current.hasMoved) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
        const dir = raycaster.ray.direction.clone().multiplyScalar(500);
        const coords = vector3ToYawPitch(dir);
        coords.yaw = Math.round(coords.yaw * 10) / 10;
        coords.pitch = Math.max(-85, Math.min(85, Math.round(coords.pitch * 10) / 10));

        // Immediately update sceneRef.current for instantaneous 60fps visual responsiveness
        if (sceneRef.current) {
          sceneRef.current = {
            ...sceneRef.current,
            hotspots: sceneRef.current.hotspots.map((h) =>
              h.id === draggedHotspotRef.current!.id ? { ...h, position: coords } : h
            )
          };
        }

        onUpdateHotspotPosition?.(draggedHotspotRef.current.id, coords);
      }
    };

    const handleWindowPointerUp = () => {
      if (draggedHotspotRef.current) {
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 150);
        draggedHotspotRef.current = null;
        setDraggingHotspotId(null);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggingHotspotId, onUpdateHotspotPosition]);

  useImperativeHandle(ref, () => ({
    setView: (newYaw: number, newPitch: number, newFov?: number, animated: boolean = false) => {
      // Always cancel any ongoing transition
      if (transitionAnimIdRef.current) {
        cancelAnimationFrame(transitionAnimIdRef.current);
        transitionAnimIdRef.current = null;
      }

      const safeTargetYaw = Number.isFinite(newYaw)
        ? newYaw
        : (Number.isFinite(viewStateRef.current.yaw) ? viewStateRef.current.yaw : 0);
      const safeTargetPitch = Number.isFinite(newPitch)
        ? Math.max(-85, Math.min(85, newPitch))
        : (Number.isFinite(viewStateRef.current.pitch) ? viewStateRef.current.pitch : 0);
      const safeTargetFov = Number.isFinite(newFov)
        ? Math.max(30, Math.min(110, newFov!))
        : (Number.isFinite(viewStateRef.current.fov) ? viewStateRef.current.fov : 75);

      if (animated) {
        const startYaw = Number.isFinite(viewStateRef.current.yaw) ? viewStateRef.current.yaw : 0;
        const startPitch = Number.isFinite(viewStateRef.current.pitch) ? viewStateRef.current.pitch : 0;
        const startFov = Number.isFinite(viewStateRef.current.fov) ? viewStateRef.current.fov : 75;

        // Calculate shortest angle delta for yaw rotation
        let diffYaw = safeTargetYaw - startYaw;
        while (diffYaw > 180) diffYaw -= 360;
        while (diffYaw < -180) diffYaw += 360;

        const diffPitch = safeTargetPitch - startPitch;
        const diffFov = safeTargetFov - startFov;
        const startTime = performance.now();
        const duration = 1200;

        const animateTransition = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          const nextY = startYaw + diffYaw * ease;
          const nextP = startPitch + diffPitch * ease;
          const nextF = startFov + diffFov * ease;

          setYaw(Number.isFinite(nextY) ? nextY : safeTargetYaw);
          setPitch(Number.isFinite(nextP) ? nextP : safeTargetPitch);
          setFov(Number.isFinite(nextF) ? nextF : safeTargetFov);

          if (progress < 1) {
            transitionAnimIdRef.current = requestAnimationFrame(animateTransition);
          } else {
            transitionAnimIdRef.current = null;
            setYaw(safeTargetYaw);
            setPitch(safeTargetPitch);
            setFov(safeTargetFov);
          }
        };
        transitionAnimIdRef.current = requestAnimationFrame(animateTransition);
      } else {
        setYaw(safeTargetYaw);
        setPitch(safeTargetPitch);
        setFov(safeTargetFov);
      }
    },
    triggerLittlePlanet: () => {
      triggerLittlePlanetAnimation(scene.initialView, scene.littlePlanetDuration || 2.5);
    }
  }));

  // Handle scene change & initial little planet animation
  useEffect(() => {
    if (transitionAnimIdRef.current) {
      cancelAnimationFrame(transitionAnimIdRef.current);
      transitionAnimIdRef.current = null;
    }
    if (roamAnimIdRef.current) {
      cancelAnimationFrame(roamAnimIdRef.current);
      roamAnimIdRef.current = null;
    }
    if (planetAnimIdRef.current) {
      cancelAnimationFrame(planetAnimIdRef.current);
      planetAnimIdRef.current = null;
    }

    const initYaw = Number.isFinite(scene.initialView?.yaw) ? scene.initialView.yaw : 0;
    const initPitch = Number.isFinite(scene.initialView?.pitch) ? scene.initialView.pitch : 0;
    const initFov = Number.isFinite(scene.initialView?.fov) ? scene.initialView.fov : 75;

    setYaw(initYaw);
    setPitch(initPitch);
    setFov(initFov);
    setIsAutoRotating(scene.autoRotate);

    // If little planet is enabled, perform opening zoom from top-down or wide planet
    if (scene.littlePlanet) {
      triggerLittlePlanetAnimation(scene.initialView, scene.littlePlanetDuration || 2.5);
    }
  }, [scene.id]);

  const triggerLittlePlanetAnimation = useCallback((targetView: ViewAngle, durationSec: number = 2.5) => {
    if (planetAnimIdRef.current) {
      cancelAnimationFrame(planetAnimIdRef.current);
      planetAnimIdRef.current = null;
    }

    setIsPlayingPlanetAnimation(true);
    // Start at Little Planet projection: look straight down, high FOV
    const startPitch = -85;
    const startFov = 115;
    const destPitch = Number.isFinite(targetView?.pitch) ? targetView.pitch : 0;
    const destFov = Number.isFinite(targetView?.fov) ? targetView.fov : 75;
    const startTime = performance.now();
    const durationMs = durationSec * 1000;

    const animatePlanet = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentPitch = startPitch + (destPitch - startPitch) * ease;
      const currentFov = startFov + (destFov - startFov) * ease;

      setPitch(Number.isFinite(currentPitch) ? currentPitch : destPitch);
      setFov(Number.isFinite(currentFov) ? currentFov : destFov);

      if (progress < 1) {
        planetAnimIdRef.current = requestAnimationFrame(animatePlanet);
      } else {
        planetAnimIdRef.current = null;
        setPitch(destPitch);
        setFov(destFov);
        setIsPlayingPlanetAnimation(false);
      }
    };

    planetAnimIdRef.current = requestAnimationFrame(animatePlanet);
  }, []);

  // Handle Roam Tour smooth camera movement
  useEffect(() => {
    if (!activeRoamTarget) return;

    if (roamAnimIdRef.current) {
      cancelAnimationFrame(roamAnimIdRef.current);
      roamAnimIdRef.current = null;
    }

    const startTime = performance.now();
    const durationMs = (activeRoamTarget.duration || 3) * 1000;
    const startYaw = Number.isFinite(viewStateRef.current.yaw) ? viewStateRef.current.yaw : 0;
    const startPitch = Number.isFinite(viewStateRef.current.pitch) ? viewStateRef.current.pitch : 0;
    const startFov = Number.isFinite(viewStateRef.current.fov) ? viewStateRef.current.fov : 75;

    const targetYaw = Number.isFinite(activeRoamTarget.view?.yaw) ? activeRoamTarget.view.yaw : startYaw;
    const targetPitch = Number.isFinite(activeRoamTarget.view?.pitch) ? activeRoamTarget.view.pitch : startPitch;
    const targetFov = Number.isFinite(activeRoamTarget.view?.fov) ? activeRoamTarget.view.fov : startFov;

    // Handle wrap-around for yaw shortest path
    let diffYaw = targetYaw - startYaw;
    while (diffYaw > 180) diffYaw -= 360;
    while (diffYaw < -180) diffYaw += 360;

    const animateRoam = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / durationMs);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      const nextY = startYaw + diffYaw * ease;
      const nextP = startPitch + (targetPitch - startPitch) * ease;
      const nextF = startFov + (targetFov - startFov) * ease;

      setYaw(Number.isFinite(nextY) ? nextY : targetYaw);
      setPitch(Number.isFinite(nextP) ? nextP : targetPitch);
      setFov(Number.isFinite(nextF) ? nextF : targetFov);

      if (p < 1) {
        roamAnimIdRef.current = requestAnimationFrame(animateRoam);
      } else {
        roamAnimIdRef.current = null;
        setYaw(targetYaw);
        setPitch(targetPitch);
        setFov(targetFov);
      }
    };

    roamAnimIdRef.current = requestAnimationFrame(animateRoam);

    return () => {
      if (roamAnimIdRef.current) {
        cancelAnimationFrame(roamAnimIdRef.current);
        roamAnimIdRef.current = null;
      }
    };
  }, [activeRoamTarget]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene & Camera
    const scene3D = new THREE.Scene();
    scene3DRef.current = scene3D;

    const camera = new THREE.PerspectiveCamera(scene.initialView.fov, width / height, 0.1, 1500);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Inverted Sphere for 360 panorama
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene3D.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    let animationFrameId: number;

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      // Auto rotation with live ref values
      if (isAutoRotatingRef.current && !isDraggingRef.current && !isPlayingPlanetAnimationRef.current) {
        const speed = sceneRef.current.autoRotateSpeed || 0.6;
        setYaw((prev) => {
          const safePrev = Number.isFinite(prev) ? prev : 0;
          let next = safePrev + speed * 0.12;
          if (next > 180) next -= 360;
          return next;
        });
      }

      if (cameraRef.current && rendererRef.current && scene3DRef.current) {
        const cam = cameraRef.current;
        let currentYaw = viewStateRef.current.yaw;
        let currentPitch = viewStateRef.current.pitch;
        let currentFov = viewStateRef.current.fov;

        // Bulletproof defense against NaN
        if (!Number.isFinite(currentYaw)) {
          currentYaw = 0;
          setYaw(0);
        }
        if (!Number.isFinite(currentPitch)) {
          currentPitch = 0;
          setPitch(0);
        }
        if (!Number.isFinite(currentFov)) {
          currentFov = 75;
          setFov(75);
        }

        cam.fov = currentFov;
        cam.updateProjectionMatrix();

        // Calculate look direction
        const phi = THREE.MathUtils.degToRad(90 - currentPitch);
        const theta = THREE.MathUtils.degToRad(currentYaw);
        const targetX = 500 * Math.sin(phi) * Math.sin(theta);
        const targetY = 500 * Math.cos(phi);
        const targetZ = -500 * Math.sin(phi) * Math.cos(theta);

        cam.lookAt(targetX, targetY, targetZ);
        rendererRef.current.render(scene3DRef.current, cam);

        // Project Hotspots onto screen coordinates using latest sceneRef.current
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const currentHotspots = sceneRef.current.hotspots || [];
          const positions = currentHotspots.map((hs) => {
            const pos3D = yawPitchToVector3(hs.position.yaw, hs.position.pitch, 480);
            const screen = worldToScreenCoords(pos3D, cam, rect.width, rect.height);
            return {
              id: hs.id,
              x: screen.x,
              y: screen.y,
              isBehind: screen.isBehind
            };
          });
          setHotspotScreenPositions(positions);
        }
      }
    };

    renderLoop();

    // Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Load / Update Sphere Panorama Texture
  useEffect(() => {
    if (!sphereMeshRef.current) return;
    const mesh = sphereMeshRef.current;

    textureLoaderRef.current.load(
      scene.panoramaUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1; // Correct inverted projection
        texture.colorSpace = THREE.SRGBColorSpace;
        mesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      },
      undefined,
      (err) => {
        console.warn('Failed to load panorama image texture, using fallback color', err);
      }
    );
  }, [scene.panoramaUrl]);

  // Audio Playback
  useEffect(() => {
    if (audioBgRef.current) {
      if (scene.bgm.enabled && scene.bgm.url && !isMuted) {
        audioBgRef.current.src = scene.bgm.url;
        audioBgRef.current.volume = (scene.bgm.volume || 40) / 100;
        audioBgRef.current.loop = scene.bgm.loop !== false;
        audioBgRef.current.play().catch(() => {});
      } else {
        audioBgRef.current.pause();
      }
    }
  }, [scene.bgm, isMuted]);

  // Mouse & Touch Drag Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    // Click on canvas cancels auto-rotation and ongoing transitions
    if (isAutoRotatingRef.current) {
      setIsAutoRotating(false);
      isAutoRotatingRef.current = false;
    }
    if (transitionAnimIdRef.current) {
      cancelAnimationFrame(transitionAnimIdRef.current);
      transitionAnimIdRef.current = null;
    }

    if (isPlacingHotspot) return;
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    const currentFov = Number.isFinite(fov) ? fov : 75;
    const sensitivity = (currentFov / 75) * 0.18;

    setYaw((prevYaw) => {
      const safePrevYaw = Number.isFinite(prevYaw) ? prevYaw : 0;
      let nextYaw = safePrevYaw - deltaX * sensitivity;
      if (nextYaw > 180) nextYaw -= 360;
      if (nextYaw < -180) nextYaw += 360;
      // Clamp within limits if defined
      const min = scene.viewLimits?.yawMin ?? -180;
      const max = scene.viewLimits?.yawMax ?? 180;
      if (min > -180 || max < 180) {
        nextYaw = Math.max(min, Math.min(max, nextYaw));
      }
      return Number.isFinite(nextYaw) ? nextYaw : 0;
    });

    setPitch((prevPitch) => {
      const safePrevPitch = Number.isFinite(prevPitch) ? prevPitch : 0;
      let nextPitch = safePrevPitch + deltaY * sensitivity;
      const min = scene.viewLimits?.pitchMin ?? -85;
      const max = scene.viewLimits?.pitchMax ?? 85;
      const clamped = Math.max(min, Math.min(max, nextPitch));
      return Number.isFinite(clamped) ? clamped : 0;
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    const minFov = scene.viewLimits?.fovMin ?? 30;
    const maxFov = scene.viewLimits?.fovMax ?? 105;

    setFov((prevFov) => {
      const safePrevFov = Number.isFinite(prevFov) ? prevFov : 75;
      return Math.max(minFov, Math.min(maxFov, safePrevFov + zoomDelta));
    });
  };

  // Click on Canvas to add hotspot when in Add mode
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isPlacingHotspot) {
      // If auto-rotating and user clicks canvas, cancel rotation
      if (isAutoRotatingRef.current) {
        setIsAutoRotating(false);
        isAutoRotatingRef.current = false;
      }
      return;
    }

    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    let coords: { yaw: number; pitch: number };
    const intersects = sphereMeshRef.current ? raycaster.intersectObject(sphereMeshRef.current) : [];
    if (intersects.length > 0) {
      coords = vector3ToYawPitch(intersects[0].point);
    } else {
      // Reliable ray direction calculation fallback
      const dir = raycaster.ray.direction.clone().multiplyScalar(500);
      coords = vector3ToYawPitch(dir);
    }

    onAddHotspotAtPosition?.(coords);
    onCanvasClickForHotspot?.(coords);
  };

  // Hotspot Icon Helper
  const getHotspotIcon = (type: HotspotType, iconStyle: string) => {
    switch (type) {
      case 'scene_jump':
        return <Navigation className="w-4 h-4 text-white transform rotate-45" />;
      case 'info_richtext':
        return <Info className="w-4 h-4 text-white" />;
      case 'info_image':
        return <ImageIcon className="w-4 h-4 text-white" />;
      case 'info_video':
        return <Video className="w-4 h-4 text-white" />;
      case 'info_audio':
        return <Music className="w-4 h-4 text-white" />;
      case 'info_link':
        return <ExternalLink className="w-4 h-4 text-white" />;
      case 'info_phone':
        return <Phone className="w-4 h-4 text-white" />;
      case 'info_form':
        return <Sparkles className="w-4 h-4 text-white" />;
      default:
        return <HelpCircle className="w-4 h-4 text-white" />;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="panorama-viewer-wrapper"
      className="relative w-full h-full select-none overflow-hidden bg-zinc-950 flex items-center justify-center cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      {/* Hidden Audio Elements */}
      <audio ref={audioBgRef} />
      <audio ref={audioNarrationRef} />

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Crosshair when placing hotspot */}
      {isPlacingHotspot && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="w-10 h-10 border-2 border-dashed border-sky-400 rounded-full animate-ping opacity-60" />
          <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center bg-sky-500/60 backdrop-blur-xs">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div className="absolute top-6 px-4 py-1.5 rounded-full bg-sky-600/90 text-white text-xs shadow-lg backdrop-blur-sm">
            点击全景任意位置，即可在该视角添加热点
          </div>
        </div>
      )}

      {/* Render Hotspot HTML Overlays with Smooth 3D-to-2D Positioning */}
      {hotspotScreenPositions.map((pos) => {
        if (pos.isBehind) return null;
        const hotspot = scene.hotspots.find((h) => h.id === pos.id);
        if (!hotspot) return null;

        const isSelected = selectedHotspotId === hotspot.id;
        const isBeingDragged = draggingHotspotId === hotspot.id;
        const sizeClasses =
          hotspot.style.size === 'sm'
            ? 'w-8 h-8'
            : hotspot.style.size === 'lg'
            ? 'w-12 h-12'
            : 'w-10 h-10';

        return (
          <div
            key={hotspot.id}
            id={`hotspot-marker-${hotspot.id}`}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-75 group ${
              isBeingDragged
                ? 'cursor-grabbing scale-125 z-40'
                : isEditorMode
                ? 'cursor-grab hover:scale-115'
                : 'cursor-pointer hover:scale-115'
            }`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`
            }}
            onPointerDown={(e) => {
              if (isAutoRotatingRef.current) {
                setIsAutoRotating(false);
                isAutoRotatingRef.current = false;
              }
              if (isEditorMode) {
                e.stopPropagation();
                onSelectHotspot?.(hotspot);
                draggedHotspotRef.current = {
                  id: hotspot.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  hasMoved: false
                };
                setDraggingHotspotId(hotspot.id);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditorMode) {
                if (!justDraggedRef.current) {
                  onSelectHotspot?.(hotspot);
                }
              } else {
                // In preview mode
                if (hotspot.type === 'scene_jump' && hotspot.targetSceneId) {
                  onSceneJump?.(hotspot.targetSceneId, hotspot.targetLandingView);
                } else {
                  onHotspotClick?.(hotspot);
                }
              }
            }}
          >
            {/* Pulsing Ripple Effect */}
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none ${
                isBeingDragged ? 'ring-4 ring-sky-400 bg-sky-500' : ''
              }`}
              style={{ backgroundColor: hotspot.style.color || '#0ea5e9' }}
            />

            {/* Hotspot Outer Ring & Body */}
            <div
              className={`${sizeClasses} rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-200 ${
                isBeingDragged
                  ? 'ring-4 ring-sky-400 shadow-sky-500/60 scale-110'
                  : isSelected
                  ? 'ring-4 ring-amber-400 scale-110 shadow-amber-500/40'
                  : 'group-hover:scale-115 group-hover:shadow-sky-500/30'
              }`}
              style={{
                backgroundColor: hotspot.style.color || '#0284c7'
              }}
            >
              {getHotspotIcon(hotspot.type, hotspot.style.icon)}
            </div>

            {/* Active Dragging Real-time Floating Coordinates Pill */}
            {isBeingDragged && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-sky-950/95 text-sky-200 border border-sky-400 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-40 animate-bounce">
                <Move className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span>水平 {hotspot.position.yaw}° · 俯仰 {hotspot.position.pitch}°</span>
              </div>
            )}

            {/* Hover Tooltip / Title Card */}
            {!isBeingDragged && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 whitespace-nowrap">
                <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-zinc-100 px-2.5 py-1.5 rounded-md text-xs shadow-xl flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{hotspot.title}</span>
                    {hotspot.type === 'scene_jump' && (
                      <span className="text-[10px] text-sky-400 bg-sky-950/80 px-1 py-0.5 rounded">跳转</span>
                    )}
                  </div>
                  {isEditorMode ? (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Move className="w-2.5 h-2.5 text-sky-400" /> 按住拖拽修改位置
                    </span>
                  ) : (
                    <span className="text-[10px] text-sky-400 font-medium">
                      {hotspot.type === 'scene_jump' ? '点击跳转场景' : '点击查看详情'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating HUD Quick Controls on Canvas */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Real-time Angle Readout Badge */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-lg px-3 py-1.5 text-xs text-zinc-300 shadow-md flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Yaw: <strong className="text-zinc-100">{Math.round(yaw)}°</strong></span>
          <span className="text-zinc-600">|</span>
          <span>Pitch: <strong className="text-zinc-100">{Math.round(pitch)}°</strong></span>
          <span className="text-zinc-600">|</span>
          <span>FOV: <strong className="text-zinc-100">{Math.round(fov)}°</strong></span>
        </div>

        {/* Auto-rotate toggle */}
        <button
          id="btn-viewer-auto-rotate"
          type="button"
          onClick={toggleAutoRotate}
          title={isAutoRotating ? '点击暂停自动旋转' : '开启自动旋转'}
          className={`p-2 rounded-lg border backdrop-blur-md text-xs transition-colors shadow-md flex items-center gap-1.5 ${
            isAutoRotating
              ? 'bg-sky-600/80 border-sky-400 text-white'
              : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAutoRotating ? '停止自转' : '自转'}</span>
        </button>

        {/* Little planet preview trigger */}
        {scene.littlePlanet && (
          <button
            id="btn-viewer-little-planet"
            type="button"
            onClick={() => triggerLittlePlanetAnimation(scene.initialView, scene.littlePlanetDuration || 2.5)}
            title="开场小行星效果预览"
            className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md text-xs transition-colors shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">小行星</span>
          </button>
        )}

        {/* Gyroscope toggle */}
        {scene.gyroscopeEnabled && (
          <button
            id="btn-viewer-gyro"
            type="button"
            onClick={() => setGyroActive(!gyroActive)}
            title="陀螺仪重力感应"
            className={`p-2 rounded-lg border backdrop-blur-md text-xs transition-colors shadow-md flex items-center gap-1.5 ${
              gyroActive
                ? 'bg-emerald-600/80 border-emerald-400 text-white'
                : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">陀螺仪</span>
          </button>
        )}

        {/* Audio Mute toggle */}
        {scene.bgm.enabled && (
          <button
            id="btn-viewer-audio"
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? '恢复声音' : '静音'}
            className={`p-2 rounded-lg border backdrop-blur-md text-xs transition-colors shadow-md flex items-center gap-1.5 ${
              !isMuted
                ? 'bg-zinc-900/80 border-zinc-700/60 text-sky-400'
                : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-500'
            }`}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Fullscreen toggle */}
        <button
          id="btn-viewer-fullscreen"
          type="button"
          onClick={toggleFullscreen}
          title="全屏全景漫游"
          className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md text-xs transition-colors shadow-md"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Active Scene Watermark / Name Pill at top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 text-zinc-100 px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{scene.name}</span>
        </div>
      </div>
    </div>
  );
});

PanoramaViewer.displayName = 'PanoramaViewer';
