import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  VRProject, 
  Scene, 
  Hotspot, 
  ViewAngle, 
  FloorMap, 
  AssociatedProjectFloor, 
  RoamWaypoint,
  RoamTour
} from './types';
import { initialProjects } from './data/mockProjects';
import { PanoramaViewer, PanoramaViewerRef } from './components/viewer/PanoramaViewer';
import { HotspotModal } from './components/viewer/HotspotModal';
import { SandplayMap } from './components/viewer/SandplayMap';
import { RoamTourBar } from './components/viewer/RoamTourBar';
import { ProjectListView } from './components/projects/ProjectListView';
import { EditorHeader } from './components/editor/EditorHeader';
import { LeftScenesDrawer } from './components/editor/LeftScenesDrawer';
import { RightPropertyPanel } from './components/editor/RightPropertyPanel';
import { ProjectBasicInfoModal } from './components/projects/ProjectBasicInfoModal';
import { ShareModal } from './components/projects/ShareModal';
import { generateProceduralEquirectangular } from './utils/panoramaHelper';
import { ThemeToggle } from './components/common/ThemeToggle';
import { 
  Eye, 
  Map, 
  Route, 
  Compass, 
  Lock, 
  Check, 
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronDown,
  Share2,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from 'lucide-react';

const SHARE_HASH_PREFIX = '#preview-';
const PROJECT_STORAGE_KEY = 'vr_platform_projects';
const PROJECT_ASSET_VERSION_KEY = 'vr_platform_asset_version';
const PROJECT_ASSET_VERSION = 'tech-hq-panoramas-2026-09-15';

function getSharedProjectId(): string | null {
  if (!window.location.hash.startsWith(SHARE_HASH_PREFIX)) return null;

  try {
    return decodeURIComponent(window.location.hash.slice(SHARE_HASH_PREFIX.length));
  } catch {
    return null;
  }
}

function normalizeProjects(rawProjects: VRProject[]): VRProject[] {
  return rawProjects.map((p) => ({
    ...p,
    roamTour: {
      ...p.roamTour,
      enabled: p.roamTour?.enabled ?? true,
      loop: p.roamTour?.loop ?? true,
      waypoints: (p.roamTour?.waypoints || []).map((wp) => {
        const yaw = Number.isFinite(wp.yaw) ? wp.yaw! : (Number.isFinite(wp.view?.yaw) ? wp.view!.yaw : 0);
        const pitch = Number.isFinite(wp.pitch) ? wp.pitch! : (Number.isFinite(wp.view?.pitch) ? wp.view!.pitch : 0);
        const fov = Number.isFinite(wp.fov) ? wp.fov! : (Number.isFinite(wp.view?.fov) ? wp.view!.fov : 75);
        return {
          ...wp,
          yaw,
          pitch,
          fov,
          view: { yaw, pitch, fov }
        };
      })
    }
  }));
}

function migrateBundledProjectAssets(projects: VRProject[]): VRProject[] {
  const bundledProject = initialProjects.find((project) => project.id === 'proj-tech-hq');
  if (!bundledProject) return projects;

  const bundledScenes = new Map(bundledProject.scenes.map((scene) => [scene.id, scene]));
  return projects.map((project) => {
    if (project.id !== bundledProject.id) return project;

    return {
      ...project,
      coverImage: bundledProject.coverImage,
      scenes: project.scenes.map((scene) => {
        const bundledScene = bundledScenes.get(scene.id);
        return bundledScene
          ? {
              ...scene,
              panoramaUrl: bundledScene.panoramaUrl,
              panoramaThumb: bundledScene.panoramaThumb
            }
          : scene;
      })
    };
  });
}

export default function App() {
  // State: Projects list with LocalStorage fallback
  const [projects, setProjects] = useState<VRProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (saved) {
        const savedProjects = normalizeProjects(JSON.parse(saved));
        if (localStorage.getItem(PROJECT_ASSET_VERSION_KEY) !== PROJECT_ASSET_VERSION) {
          localStorage.setItem(PROJECT_ASSET_VERSION_KEY, PROJECT_ASSET_VERSION);
          return migrateBundledProjectAssets(savedProjects);
        }
        return savedProjects;
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    return normalizeProjects(initialProjects);
  });

  // Navigation State
  const initialSharedProject = projects.find((project) => project.id === getSharedProjectId());
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'preview'>(
    initialSharedProject ? 'preview' : 'list'
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(
    initialSharedProject?.id || projects[0]?.id || ''
  );
  const [activeSceneId, setActiveSceneId] = useState<string>(
    initialSharedProject?.scenes[0]?.id || ''
  );

  // Active Project & Scene Computations
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const currentScene = currentProject?.scenes.find((s) => s.id === activeSceneId) || currentProject?.scenes[0];

  // Editor Sub-States
  const [currentLiveView, setCurrentLiveView] = useState<ViewAngle>({ yaw: 0, pitch: 0, fov: 75 });
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [activeModalHotspot, setActiveModalHotspot] = useState<Hotspot | null>(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  
  // Viewer overlays toggles
  const [isSandplayOpen, setIsSandplayOpen] = useState(false);
  const [isRoamTourPlaying, setIsRoamTourPlaying] = useState(false);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);

  // Modals
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [basicInfoTargetProject, setBasicInfoTargetProject] = useState<VRProject | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetProject, setShareTargetProject] = useState<VRProject | null>(null);

  // Password Protection Gate for Preview
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preview Mode Scene Selector Dropdown
  const [showPreviewSceneMenu, setShowPreviewSceneMenu] = useState(false);

  // Viewer reference to command camera movement
  const viewerRef = useRef<PanoramaViewerRef>(null);

  // Effective Roam Tour: Uses project's defined roamTour, or dynamically synthesizes one from scenes
  const effectiveRoamTour: RoamTour = useMemo(() => {
    if (currentProject?.roamTour && currentProject.roamTour.waypoints && currentProject.roamTour.waypoints.length > 0) {
      return currentProject.roamTour;
    }
    if (!currentProject || currentProject.scenes.length === 0) {
      return { enabled: true, autoStart: false, loop: true, speed: 1.0, waypoints: [] };
    }
    // Dynamic fallback waypoints from all scenes in this project
    const generated: RoamWaypoint[] = currentProject.scenes.map((sc, idx) => {
      const inspectHs = sc.hotspots.find(h => h.type !== 'scene_jump') || sc.hotspots[0];
      return {
        id: `auto-wp-${sc.id}-${idx}`,
        sceneId: sc.id,
        title: `${sc.name} · 全景点位`,
        yaw: inspectHs ? inspectHs.position.yaw : sc.initialView.yaw,
        pitch: inspectHs ? inspectHs.position.pitch : sc.initialView.pitch,
        fov: sc.initialView.fov,
        view: {
          yaw: inspectHs ? inspectHs.position.yaw : sc.initialView.yaw,
          pitch: inspectHs ? inspectHs.position.pitch : sc.initialView.pitch,
          fov: sc.initialView.fov,
        },
        transitDuration: 1.8,
        stayDuration: 4.0,
        caption: `正在自动导览至：${sc.name}，自动巡检热点与全景视角。`,
        targetHotspotId: inspectHs?.id,
        deviceData: inspectHs ? {
          deviceName: `${sc.name} - 智能感知监测站`,
          deviceCode: `SYS-${sc.id.slice(-4).toUpperCase()}`,
          status: 'normal',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          videoTitle: `${sc.name} 现场运行视讯`,
          metrics: [
            { label: '系统状态', value: '正常运行', unit: '', status: 'normal' },
            { label: '全景视角', value: `${Math.round(inspectHs.position.yaw)}°`, unit: '', status: 'normal' },
            { label: '监测热点', value: `${sc.hotspots.length}`, unit: '个', status: 'normal' },
            { label: '数据传输', value: '1.2', unit: 'Gbps', status: 'normal' },
          ]
        } : undefined
      };
    });
    return {
      enabled: true,
      autoStart: false,
      loop: true,
      speed: 1.0,
      waypoints: generated,
    };
  }, [currentProject]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sync activeSceneId when project changes
  useEffect(() => {
    if (currentProject && currentProject.scenes.length > 0) {
      if (!currentProject.scenes.some((s) => s.id === activeSceneId)) {
        setActiveSceneId(currentProject.scenes[0].id);
      }
    }
  }, [currentProject, activeSceneId]);

  useEffect(() => {
    const openSharedProject = () => {
      const sharedProjectId = getSharedProjectId();
      if (!sharedProjectId) return;

      const sharedProject = projects.find((project) => project.id === sharedProjectId);
      if (!sharedProject) return;

      setActiveProjectId(sharedProject.id);
      setActiveSceneId(sharedProject.scenes[0]?.id || '');
      setIsPasswordUnlocked(false);
      setPasswordInput('');
      setPasswordError(false);
      setViewMode('preview');
    };

    window.addEventListener('hashchange', openSharedProject);
    return () => window.removeEventListener('hashchange', openSharedProject);
  }, [projects]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [projects]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // --- Project CRUD Operations ---
  const handleCreateProject = () => {
    const newId = `project-${Date.now()}`;
    const defaultPanorama = generateProceduralEquirectangular('tech', '新项目开场全景');

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: '1F 迎宾大堂',
      sortOrder: 1,
      panoramaUrl: defaultPanorama,
      panoramaThumb: defaultPanorama,
      aspectRatio: '2:1',
      initialView: { yaw: 0, pitch: 0, fov: 75 },
      viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -75, pitchMax: 85, fovMin: 40, fovMax: 100 },
      autoRotate: true,
      autoRotateSpeed: 0.6,
      littlePlanet: true,
      littlePlanetDuration: 2.5,
      gyroscopeEnabled: true,
      tileInfo: {
        totalResolution: '8192×4096',
        tileLevels: [
          { level: 'L0 缩略图', resolution: '512×256', chunks: 1, size: '78 KB' },
          { level: 'L1 低清层', resolution: '1024×512', chunks: 4, size: '390 KB' },
          { level: 'L2 标准层', resolution: '2048×1024', chunks: 16, size: '1.7 MB' },
          { level: 'L3 高清层', resolution: '4096×2048', chunks: 64, size: '5.8 MB' },
          { level: 'L4 超清瓦片', resolution: '8192×4096', chunks: 256, size: '19.2 MB' }
        ],
        tileSize: 512,
        format: 'webp',
        compressedPercent: 82
      },
      bgm: { enabled: false, url: '', name: '', loop: true, volume: 40 },
      narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
      hotspots: []
    };

    const newProject: VRProject = {
      id: newId,
      name: `新建 VR 全景项目 #${projects.length + 1}`,
      description: '沉浸式三维全景空间与交互体验展示',
      coverImage: defaultPanorama,
      keywords: ['全景漫游', 'VR空间', '智能展厅'],
      copyright: '© 2026 全景平台 版权所有',
      accessPermission: 'public',
      status: 'draft',
      isArchived: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      visits: 0,
      scenes: [newScene],
      currentSceneId: newScene.id,
      currentFloorId: 'floor-1',
      associatedFloors: [],
      floorMaps: [
        {
          id: 'floor-1',
          name: '1F 平面展位图',
          level: 1,
          mapUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
          points: [{ sceneId: newScene.id, x: 50, y: 50 }]
        }
      ],
      roamTour: {
        enabled: true,
        autoStart: false,
        loop: true,
        waypoints: [
          {
            id: 'wp-1',
            sceneId: newScene.id,
            yaw: 0,
            pitch: 0,
            fov: 75,
            transitDuration: 3,
            stayDuration: 4,
            title: '主视角起步',
            caption: '欢迎莅临沉浸式全景空间，点击画面热点可进行交互体验。'
          }
        ]
      }
    };

    setProjects([newProject, ...projects]);
    setActiveProjectId(newId);
    setActiveSceneId(newScene.id);
    setViewMode('editor');
    showToast('新项目创建成功！');
  };

  const handleDuplicateProject = (projectId: string) => {
    const original = projects.find((p) => p.id === projectId);
    if (!original) return;
    const duplicated: VRProject = {
      ...JSON.parse(JSON.stringify(original)),
      id: `project-${Date.now()}`,
      name: `${original.name} (副本)`,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      visits: 0
    };
    setProjects([duplicated, ...projects]);
    showToast('项目副本已生成！');
  };

  const handleArchiveProject = (projectId: string) => {
    setProjects(
      projects.map((p) => (p.id === projectId ? { ...p, isArchived: !p.isArchived } : p))
    );
    showToast('项目归档状态已更新');
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('确定要删除该VR全景项目吗？此操作不可恢复。')) {
      setProjects(projects.filter((p) => p.id !== projectId));
      showToast('项目已成功删除');
    }
  };

  const handleSaveBasicInfo = (updatedFields: Partial<VRProject>) => {
    if (!basicInfoTargetProject) return;
    setProjects(
      projects.map((p) => (p.id === basicInfoTargetProject.id ? { ...p, ...updatedFields } : p))
    );
    showToast('项目基础信息已更新！');
  };

  // --- Scene Operations ---
  const handleAddScene = (newScene: Scene) => {
    if (!currentProject) return;
    const updatedScenes = [...currentProject.scenes, newScene];

    // Add point to default floor map
    const updatedFloors = (currentProject.floorMaps || []).map((fl, idx) => {
      if (idx === 0) {
        return {
          ...fl,
          points: [
            ...fl.points,
            {
              sceneId: newScene.id,
              x: Math.min(85, 20 + updatedScenes.length * 15),
              y: 50
            }
          ]
        };
      }
      return fl;
    });

    const updatedProject: VRProject = {
      ...currentProject,
      scenes: updatedScenes,
      floorMaps: updatedFloors,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
    setActiveSceneId(newScene.id);
    showToast(`场景「${newScene.name}」已添加并完成多级瓦片预处理`);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!currentProject || currentProject.scenes.length <= 1) {
      alert('项目至少需保留一个全景场景');
      return;
    }
    const filteredScenes = currentProject.scenes.filter((s) => s.id !== sceneId);
    const updatedProject: VRProject = {
      ...currentProject,
      scenes: filteredScenes,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
    if (activeSceneId === sceneId) {
      setActiveSceneId(filteredScenes[0].id);
    }
    showToast('场景已删除');
  };

  const handleReorderScene = (sceneId: string, direction: 'up' | 'down') => {
    if (!currentProject) return;
    const scenes = [...currentProject.scenes];
    const index = scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const temp = scenes[index];
    scenes[index] = scenes[targetIndex];
    scenes[targetIndex] = temp;

    const updatedProject = { ...currentProject, scenes };
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
  };

  const handleDuplicateScene = (sceneId: string) => {
    if (!currentProject) return;
    const originalScene = currentProject.scenes.find((s) => s.id === sceneId);
    if (!originalScene) return;

    const duplicatedScene: Scene = {
      ...JSON.parse(JSON.stringify(originalScene)),
      id: `scene-${Date.now()}`,
      name: `${originalScene.name} (复制)`
    };

    const updatedScenes = [...currentProject.scenes, duplicatedScene];
    const updatedProject = { ...currentProject, scenes: updatedScenes };
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
    setActiveSceneId(duplicatedScene.id);
    showToast('场景已成功复制');
  };

  const handleUpdateCurrentScene = (updatedFields: Partial<Scene>) => {
    if (!currentProject || !currentScene) return;
    const updatedScenes = currentProject.scenes.map((s) =>
      s.id === currentScene.id ? { ...s, ...updatedFields } : s
    );
    const updatedProject = { ...currentProject, scenes: updatedScenes };
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
  };

  const handleUpdateSceneById = (sceneId: string, updatedFields: Partial<Scene>) => {
    if (!currentProject) return;
    const updatedScenes = currentProject.scenes.map((s) =>
      s.id === sceneId ? { ...s, ...updatedFields } : s
    );
    const updatedProject = { ...currentProject, scenes: updatedScenes };
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)));
    showToast('场景已成功更新');
  };

  // --- Hotspot Operations ---
  const handleAddHotspotAtCurrentView = () => {
    if (!currentScene || !currentProject) return;

    const newHotspot: Hotspot = {
      id: `hs-${Date.now()}`,
      title: '新建热点',
      type: 'info_richtext',
      position: {
        yaw: Math.round(currentLiveView.yaw * 10) / 10,
        pitch: Math.round(currentLiveView.pitch * 10) / 10
      },
      style: {
        icon: 'info',
        size: 'md',
        color: '#0ea5e9',
        hoverEffect: 'pulse'
      },
      content: {
        title: '新建热点详情',
        richText: '此处是空间中的核心亮点展示区域，可在此介绍建筑空间结构、陈列设施或艺术藏品。',
        images: []
      }
    };

    const updatedHotspots = [...currentScene.hotspots, newHotspot];
    handleUpdateCurrentScene({ hotspots: updatedHotspots });
    setSelectedHotspot(newHotspot);
    setIsPlacingHotspot(false);
    showToast('热点已添加至当前画面中心');
  };

  const handleCanvasClickPlaceHotspot = (coords: { yaw: number; pitch: number }) => {
    if (!isPlacingHotspot || !currentScene || !currentProject) return;

    const newHotspot: Hotspot = {
      id: `hs-${Date.now()}`,
      title: '新建热点',
      type: 'info_richtext',
      position: { yaw: Math.round(coords.yaw * 10) / 10, pitch: Math.round(coords.pitch * 10) / 10 },
      style: {
        icon: 'info',
        size: 'md',
        color: '#0ea5e9',
        hoverEffect: 'pulse'
      },
      content: {
        title: '探索此区域',
        richText: '此处是空间中的核心亮点展示区域，可在此介绍建筑空间结构、陈列设施或艺术藏品。',
        images: []
      }
    };

    const updatedHotspots = [...currentScene.hotspots, newHotspot];
    handleUpdateCurrentScene({ hotspots: updatedHotspots });
    setSelectedHotspot(newHotspot);
    setIsPlacingHotspot(false);
    showToast('热点已放置于全景画面中，请在右侧面板编辑详情');
  };

  const handleUpdateHotspot = (updatedHotspot: Hotspot) => {
    if (!currentScene) return;
    const updatedHotspots = currentScene.hotspots.map((hs) =>
      hs.id === updatedHotspot.id ? updatedHotspot : hs
    );
    handleUpdateCurrentScene({ hotspots: updatedHotspots });
    setSelectedHotspot(updatedHotspot);
  };

  const handleUpdateHotspotPosition = (hotspotId: string, position: { yaw: number; pitch: number }) => {
    if (!currentScene) return;
    const updatedHotspots = currentScene.hotspots.map((hs) =>
      hs.id === hotspotId ? { ...hs, position } : hs
    );
    handleUpdateCurrentScene({ hotspots: updatedHotspots });
    if (selectedHotspot?.id === hotspotId) {
      setSelectedHotspot({ ...selectedHotspot, position });
    }
  };

  const handleDeleteHotspot = (hotspotId: string) => {
    if (!currentScene) return;
    const updatedHotspots = currentScene.hotspots.filter((hs) => hs.id !== hotspotId);
    handleUpdateCurrentScene({ hotspots: updatedHotspots });
    if (selectedHotspot?.id === hotspotId) {
      setSelectedHotspot(null);
    }
    showToast('热点已删除');
  };

  const handleHotspotClickInViewer = (hotspot: Hotspot) => {
    if (viewMode === 'editor' && !isPlacingHotspot) {
      // In editor mode, selecting it opens property panel editor
      setSelectedHotspot(hotspot);
      return;
    }

    // In preview mode
    if (hotspot.type === 'scene_jump' && hotspot.targetSceneId) {
      // Execute scene jump
      setActiveSceneId(hotspot.targetSceneId);
      const landing = hotspot.targetLandingView || hotspot.targetView;
      if (landing) {
        const targetFov = 'fov' in landing ? (landing as { fov?: number }).fov : undefined;
        viewerRef.current?.setView(landing.yaw, landing.pitch, targetFov, true);
      }
    } else {
      // Open Info/Media Modal
      setActiveModalHotspot(hotspot);
    }
  };

  // --- Roam Tour Operations ---
  const handleAddCurrentViewToRoam = () => {
    if (!currentProject || !currentScene) return;
    const safeYaw = Math.round(currentLiveView.yaw * 10) / 10;
    const safePitch = Math.round(currentLiveView.pitch * 10) / 10;
    const safeFov = Math.round((currentLiveView.fov || 75) * 10) / 10;

    const newWaypoint: RoamWaypoint = {
      id: `wp-${Date.now()}`,
      sceneId: currentScene.id,
      yaw: safeYaw,
      pitch: safePitch,
      fov: safeFov,
      view: {
        yaw: safeYaw,
        pitch: safePitch,
        fov: safeFov
      },
      transitDuration: 2.5,
      stayDuration: 3.5,
      title: `${currentScene.name} - 观察点`,
      caption: `导览视线已平滑过渡至${currentScene.name}，可继续浏览相关设施。`
    };

    const currentTour = currentProject.roamTour || { enabled: true, loop: true, waypoints: [] };
    const updatedTour = {
      ...currentTour,
      waypoints: [...currentTour.waypoints, newWaypoint]
    };

    setProjects(
      projects.map((p) => (p.id === currentProject.id ? { ...p, roamTour: updatedTour } : p))
    );
    showToast('已将当前场景与视角记录为导览途经点！');
  };

  const handleDeleteRoamWaypoint = (wpId: string) => {
    if (!currentProject) return;
    const updatedWaypoints = currentProject.roamTour.waypoints.filter((w) => w.id !== wpId);
    const updatedTour = { ...currentProject.roamTour, waypoints: updatedWaypoints };
    setProjects(
      projects.map((p) => (p.id === currentProject.id ? { ...p, roamTour: updatedTour } : p))
    );
  };

  const handleReorderRoamWaypoint = (wpId: string, direction: 'up' | 'down') => {
    if (!currentProject) return;
    const wps = [...currentProject.roamTour.waypoints];
    const index = wps.findIndex((w) => w.id === wpId);
    if (index === -1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= wps.length) return;

    const temp = wps[index];
    wps[index] = wps[targetIdx];
    wps[targetIdx] = temp;

    const updatedTour = { ...currentProject.roamTour, waypoints: wps };
    setProjects(
      projects.map((p) => (p.id === currentProject.id ? { ...p, roamTour: updatedTour } : p))
    );
  };

  const handleWaypointTrigger = (
    wp: RoamWaypoint,
    transitDurationSec: number = 1.2,
    onTransitComplete?: () => void
  ) => {
    const targetYaw = Number.isFinite(wp.yaw)
      ? wp.yaw!
      : Number.isFinite(wp.view?.yaw)
      ? wp.view!.yaw
      : 0;
    const targetPitch = Number.isFinite(wp.pitch)
      ? wp.pitch!
      : Number.isFinite(wp.view?.pitch)
      ? wp.view!.pitch
      : 0;
    const targetFov = Number.isFinite(wp.fov)
      ? wp.fov!
      : Number.isFinite(wp.view?.fov)
      ? wp.view!.fov
      : 75;

    if (wp.sceneId && wp.sceneId !== activeSceneId) {
      setActiveSceneId(wp.sceneId);
      // Allow the new scene to mount and update before triggering smooth view transition
      setTimeout(() => {
        viewerRef.current?.setView(
          targetYaw, 
          targetPitch, 
          targetFov, 
          true, 
          transitDurationSec, 
          onTransitComplete
        );
      }, 120);
    } else {
      viewerRef.current?.setView(
        targetYaw, 
        targetPitch, 
        targetFov, 
        true, 
        transitDurationSec, 
        onTransitComplete
      );
    }
  };

  // --- Floor Switching / Associated Project Floor Switching ---
  const handleSelectAssociatedFloor = (af: AssociatedProjectFloor) => {
    const targetProj = projects.find((p) => p.id === af.projectId);
    if (targetProj && targetProj.scenes.length > 0) {
      setActiveProjectId(targetProj.id);
      setActiveSceneId(targetProj.scenes[0].id);
      showToast(`已联动切换至关联展区：${targetProj.name} (${af.floorName})`);
    }
  };

  // Preview Mode Password Verification
  const isLockedByPassword =
    viewMode === 'preview' &&
    currentProject.accessPermission === 'password' &&
    currentProject.accessPassword &&
    !isPasswordUnlocked;

  const handleUnlockPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === currentProject.accessPassword) {
      setIsPasswordUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div id="vr-panorama-app-root" className="h-screen w-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col overflow-hidden font-sans transition-colors duration-200">
      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl px-4 py-2 rounded-xl text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: PROJECTS LIST VIEW */}
      {viewMode === 'list' && (
        <ProjectListView
          projects={projects}
          onOpenProject={(pid) => {
            setActiveProjectId(pid);
            setViewMode('editor');
          }}
          onPreviewProject={(pid) => {
            setActiveProjectId(pid);
            setIsPasswordUnlocked(false);
            setViewMode('preview');
            const targetProj = projects.find((p) => p.id === pid);
            if (targetProj?.roamTour?.autoStart) {
              setIsRoamTourPlaying(true);
            }
          }}
          onDuplicateProject={handleDuplicateProject}
          onArchiveProject={handleArchiveProject}
          onDeleteProject={handleDeleteProject}
          onShareProject={(proj) => {
            setShareTargetProject(proj);
            setShowShareModal(true);
          }}
          onCreateProject={handleCreateProject}
          onEditBasicInfo={(proj) => {
            setBasicInfoTargetProject(proj);
            setShowBasicInfoModal(true);
          }}
        />
      )}

      {/* VIEW 2 & 3: VISUAL PANORAMA EDITOR & FULLSCREEN PREVIEW */}
      {(viewMode === 'editor' || viewMode === 'preview') && currentProject && currentScene && (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Header */}
          {viewMode === 'editor' ? (
            <EditorHeader
              project={currentProject}
              currentScene={currentScene}
              isPreviewMode={false}
              onTogglePreviewMode={() => {
                setViewMode('preview');
                if (currentProject.roamTour?.autoStart) {
                  setIsRoamTourPlaying(true);
                }
              }}
              onBackToList={() => setViewMode('list')}
              onSelectScene={(scId) => setActiveSceneId(scId)}
              onOpenBasicInfo={() => {
                setBasicInfoTargetProject(currentProject);
                setShowBasicInfoModal(true);
              }}
              onOpenShare={() => {
                setShareTargetProject(currentProject);
                setShowShareModal(true);
              }}
              onUpdateStatus={(status) => {
                setProjects(
                  projects.map((p) => (p.id === currentProject.id ? { ...p, status } : p))
                );
                showToast(`项目状态已切换为：${status === 'published' ? '已发布' : status === 'draft' ? '草稿' : '下线'}`);
              }}
              onManualSave={() => {
                setProjects(
                  projects.map((p) =>
                    p.id === currentProject.id
                      ? { ...p, updatedAt: new Date().toISOString().split('T')[0] }
                      : p
                  )
                );
                showToast('项目所有场景与全景热点配置已成功保存！');
              }}
              isRoamTourPlaying={isRoamTourPlaying}
              onToggleRoamTour={() => {
                const next = !isRoamTourPlaying;
                setIsRoamTourPlaying(next);
                if (!next) setHighlightedHotspotId(null);
                showToast(next ? '开启全景自动漫游导览' : '暂停漫游路线');
              }}
            />
          ) : (
            /* Immersive Preview Top Bar */
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-white backdrop-blur-md rounded-xl text-xs font-medium border border-slate-200/80 dark:border-zinc-700/80 flex items-center gap-1.5 shadow-xl transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-500" />
                  <span>返回编辑</span>
                </button>

                {/* Project Title & Scene Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPreviewSceneMenu(!showPreviewSceneMenu)}
                    className="bg-white/90 hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-slate-800 dark:text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 text-xs font-semibold shadow-xl flex items-center gap-2 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    <span className="max-w-[130px] sm:max-w-[200px] truncate">{currentProject.name} · {currentScene.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showPreviewSceneMenu && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in zoom-in-95 duration-150">
                      <div className="px-3 py-1 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">切换漫游场景</div>
                      {currentProject.scenes.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setActiveSceneId(s.id);
                            setShowPreviewSceneMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                            s.id === currentScene.id
                              ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 font-medium'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">{s.hotspots.length}热点</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Action Tools */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                {/* 1. Roam Tour Toggle Button */}
                <button
                  id="btn-preview-roam-tour"
                  type="button"
                  onClick={() => {
                    const nextPlaying = !isRoamTourPlaying;
                    setIsRoamTourPlaying(nextPlaying);
                    if (!nextPlaying) {
                      setHighlightedHotspotId(null);
                    }
                    showToast(nextPlaying ? '已启动 360° 全景自动漫游导览' : '已暂停自动漫游导览');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-xl ${
                    isRoamTourPlaying
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-indigo-400 shadow-indigo-500/30 ring-2 ring-indigo-400/40 font-semibold'
                      : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80'
                  }`}
                  title="开启/关闭全景自动漫游路线"
                >
                  <Route className={`w-4 h-4 ${isRoamTourPlaying ? 'text-amber-300 animate-pulse' : 'text-indigo-500 dark:text-indigo-400'}`} />
                  <span>{isRoamTourPlaying ? '漫游中' : '自动漫游'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isRoamTourPlaying
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {effectiveRoamTour.waypoints.length}点
                  </span>
                </button>

                {/* 2. Sandplay Map Toggle */}
                {currentProject.floorMaps && currentProject.floorMaps.length > 0 && (
                  <button
                    id="btn-preview-sandplay"
                    type="button"
                    onClick={() => setIsSandplayOpen(!isSandplayOpen)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-xl ${
                      isSandplayOpen
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/30'
                        : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80'
                    }`}
                    title="打开/收起平面沙盘地图"
                  >
                    <Map className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    <span className="hidden sm:inline">沙盘地图</span>
                  </button>
                )}

                {/* 3. Little Planet Effect */}
                <button
                  id="btn-preview-little-planet"
                  type="button"
                  onClick={() => {
                    viewerRef.current?.triggerLittlePlanet();
                    showToast('正在播放开场小行星缩放');
                  }}
                  className="px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80 backdrop-blur-md rounded-xl text-xs font-medium border shadow-xl flex items-center gap-1.5 transition-all"
                  title="播放开场小行星视角动效"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">小行星</span>
                </button>

                {/* 4. Share button */}
                <button
                  id="btn-preview-share"
                  type="button"
                  onClick={() => {
                    setShareTargetProject(currentProject);
                    setShowShareModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80 backdrop-blur-md rounded-xl text-xs font-medium border shadow-xl flex items-center gap-1.5 transition-all"
                  title="分享项目与生成二维码"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden md:inline">分享</span>
                </button>

                {/* 5. Fullscreen toggle */}
                <button
                  id="btn-preview-fullscreen"
                  type="button"
                  onClick={toggleFullscreen}
                  className="px-2 py-1.5 bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/80 backdrop-blur-md rounded-xl text-xs font-medium border shadow-xl flex items-center gap-1 transition-all"
                  title="切换全屏沉浸显示"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* 6. Theme toggle */}
                <ThemeToggle id="btn-preview-theme-toggle" />
              </div>
            </div>
          )}

          {/* Main Editor Body: Left Drawer + Center 3D Panorama + Right Property Panel */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* Left Scenes Drawer (only in editor mode) */}
            {viewMode === 'editor' && (
              <LeftScenesDrawer
                project={currentProject}
                activeSceneId={currentScene.id}
                onSelectScene={(scId) => setActiveSceneId(scId)}
                onAddScene={handleAddScene}
                onUpdateScene={handleUpdateSceneById}
                onDeleteScene={handleDeleteScene}
                onReorderScene={handleReorderScene}
                onDuplicateScene={handleDuplicateScene}
                onSelectAssociatedFloor={handleSelectAssociatedFloor}
              />
            )}

            {/* Center 3D VR Panorama Canvas */}
            <main className="flex-1 relative h-full bg-black min-w-0">
              {/* Password Gate Overlay (if in password-protected preview) */}
              {isLockedByPassword ? (
                <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="max-w-sm w-full bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-2xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-base text-white">受保护的全景项目</h3>
                    <p className="text-xs text-zinc-400">
                      该空间开启了私密访问保护，请输入访问密钥方可进入 360° 沉浸式漫游。
                    </p>
                    <form onSubmit={handleUnlockPassword} className="space-y-3">
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="输入访问密码 (如：8888)"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-center text-white"
                      />
                      {passwordError && (
                        <div className="text-rose-400 text-[11px]">密码错误，请重新输入</div>
                      )}
                      <button
                        type="submit"
                        className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
                      >
                        验证进入全景
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                  <PanoramaViewer
                    ref={viewerRef}
                    scene={currentScene}
                    allScenes={currentProject.scenes}
                    isEditorMode={viewMode === 'editor'}
                    selectedHotspotId={selectedHotspot?.id}
                    highlightHotspotId={highlightedHotspotId}
                    onSelectHotspot={(hs) => setSelectedHotspot(hs)}
                    onSceneJump={(targetSceneId, landingView) => {
                      setActiveSceneId(targetSceneId);
                      if (landingView) {
                        viewerRef.current?.setView(landingView.yaw, landingView.pitch, undefined, true);
                      }
                    }}
                    onHotspotClick={handleHotspotClickInViewer}
                    onUpdateHotspotPosition={handleUpdateHotspotPosition}
                    isPlacingHotspot={isPlacingHotspot}
                    onCameraAngleChange={(angles) => setCurrentLiveView(angles)}
                    onCanvasClickForHotspot={handleCanvasClickPlaceHotspot}
                  />

                  {/* Viewer Overlay Controls (Only shown in Editor Mode to prevent overlap with Preview Bar) */}
                  {viewMode === 'editor' && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                      {/* Sandplay Map Toggle Button */}
                      <button
                        id="btn-toggle-sandplay"
                        type="button"
                        onClick={() => setIsSandplayOpen(!isSandplayOpen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-lg ${
                          isSandplayOpen
                            ? 'bg-sky-500 text-white border-sky-400'
                            : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700/80'
                        }`}
                        title="打开/收起平面沙盘地图"
                      >
                        <Map className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                        <span>沙盘地图</span>
                      </button>

                      {/* Roam Tour Controller Toggle Button */}
                      <button
                        id="btn-toggle-roam-tour"
                        type="button"
                        onClick={() => {
                          const next = !isRoamTourPlaying;
                          setIsRoamTourPlaying(next);
                          if (!next) setHighlightedHotspotId(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-lg ${
                          isRoamTourPlaying
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30'
                            : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700/80'
                        }`}
                        title="开启/关闭自动漫游路线"
                      >
                        <Route className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span>漫游路线</span>
                      </button>
                    </div>
                  )}

                  {/* Sandplay 2D Interactive Floor Plan */}
                  {isSandplayOpen && currentProject.floorMaps && currentProject.floorMaps.length > 0 && (
                    <SandplayMap
                      floorMaps={currentProject.floorMaps}
                      currentFloorId={currentProject.currentFloorId || currentProject.floorMaps[0]?.id}
                      onSelectFloor={(floorId) => {
                        setProjects(
                          projects.map((p) => (p.id === currentProject.id ? { ...p, currentFloorId: floorId } : p))
                        );
                      }}
                      scenes={currentProject.scenes}
                      currentSceneId={currentScene.id}
                      currentYaw={currentLiveView.yaw}
                      onJumpToScene={(scId) => setActiveSceneId(scId)}
                      associatedFloors={currentProject.associatedFloors}
                      onSelectAssociatedFloor={handleSelectAssociatedFloor}
                      onClose={() => setIsSandplayOpen(false)}
                    />
                  )}

                  {/* Quick Roam Start Dock in Preview Mode when not yet playing */}
                  {viewMode === 'preview' && !isRoamTourPlaying && !isLockedByPassword && effectiveRoamTour.waypoints.length > 0 && (
                    <div
                      id="preview-quick-roam-dock"
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-2xl flex items-center gap-3 sm:gap-4 text-xs animate-in slide-in-from-bottom-4 duration-300 max-w-lg w-[92%] sm:w-auto"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                          <Route className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <span>开启全景自动漫游导览</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 rounded font-mono shrink-0">
                              {effectiveRoamTour.waypoints.length}个巡检点
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                            自动环视旋转、对焦设备热点与实时监控视频展示
                          </div>
                        </div>
                      </div>
                      <button
                        id="btn-quick-start-preview-roam"
                        type="button"
                        onClick={() => {
                          setIsRoamTourPlaying(true);
                          showToast('已启动 360° 全景自动漫游路线导览');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>开始漫游</span>
                      </button>
                    </div>
                  )}

                  {/* Roam Tour Player Bar (Available in both Editor & Preview mode) */}
                  {isRoamTourPlaying && effectiveRoamTour && effectiveRoamTour.waypoints.length > 0 && (
                    <RoamTourBar
                      roamTour={effectiveRoamTour}
                      allScenes={currentProject.scenes}
                      currentSceneId={currentScene.id}
                      onRotateView={(deltaYaw, durationSec, onComplete) => {
                        viewerRef.current?.rotateView(deltaYaw, durationSec, onComplete);
                      }}
                      onPanView={(targetYaw, targetPitch, targetFov, durationSec, onComplete) => {
                        viewerRef.current?.setView(targetYaw, targetPitch, targetFov, true, durationSec, onComplete);
                      }}
                      onJumpScene={(targetSceneId, onReady) => {
                        setActiveSceneId(targetSceneId);
                        setTimeout(() => {
                          onReady?.();
                        }, 260);
                      }}
                      onPauseTransition={() => {
                        viewerRef.current?.pauseTransition();
                      }}
                      onResumeTransition={() => {
                        viewerRef.current?.resumeTransition();
                      }}
                      onStopTransition={() => {
                        viewerRef.current?.stopTransition();
                      }}
                      onCloseTour={() => {
                        setIsRoamTourPlaying(false);
                        setHighlightedHotspotId(null);
                        showToast('已退出自动漫游导览');
                      }}
                      onOpenHotspotModal={(hs) => setActiveModalHotspot(hs)}
                      onHighlightHotspot={(hsId) => {
                        setHighlightedHotspotId(hsId);
                        if (!hsId) {
                          setSelectedHotspot(null);
                        } else {
                          const targetHs = currentScene.hotspots.find((h) => h.id === hsId);
                          if (targetHs) setSelectedHotspot(targetHs);
                        }
                      }}
                    />
                  )}
                </>
              )}
            </main>

            {/* Right Property Panel (only in editor mode) */}
            {viewMode === 'editor' && (
              <RightPropertyPanel
                scene={currentScene}
                allScenes={currentProject.scenes}
                currentLiveView={currentLiveView}
                onUpdateScene={handleUpdateCurrentScene}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={(hs) => setSelectedHotspot(hs)}
                onUpdateHotspot={handleUpdateHotspot}
                onDeleteHotspot={handleDeleteHotspot}
                isPlacingHotspot={isPlacingHotspot}
                onStartPlacingHotspot={() => setIsPlacingHotspot(true)}
                onCancelPlacingHotspot={() => setIsPlacingHotspot(false)}
                onAddHotspotAtCurrentView={handleAddHotspotAtCurrentView}
                roamTour={currentProject.roamTour}
                onUpdateRoamTour={(updatedTour) => {
                  setProjects(
                    projects.map((p) =>
                      p.id === currentProject.id
                        ? { ...p, roamTour: { ...p.roamTour, ...updatedTour } }
                        : p
                    )
                  );
                }}
                onAddCurrentViewToRoam={handleAddCurrentViewToRoam}
                onDeleteRoamWaypoint={handleDeleteRoamWaypoint}
                onReorderRoamWaypoint={handleReorderRoamWaypoint}
                onTestRoamTour={() => {
                  setIsRoamTourPlaying(true);
                  showToast('开始自动漫游路线播放');
                }}
                onPreviewHotspot={(hs) => setActiveModalHotspot(hs)}
              />
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: Interactive Hotspot Content (Rich text, Gallery, Video, Phone, Form, Link) */}
      <HotspotModal hotspot={activeModalHotspot} onClose={() => setActiveModalHotspot(null)} />

      {/* POPUP MODAL: Project Basic Info Settings */}
      {basicInfoTargetProject && (
        <ProjectBasicInfoModal
          project={basicInfoTargetProject}
          allProjects={projects}
          isOpen={showBasicInfoModal}
          onClose={() => {
            setShowBasicInfoModal(false);
            setBasicInfoTargetProject(null);
          }}
          onSave={handleSaveBasicInfo}
        />
      )}

      {/* POPUP MODAL: Share, QR Code & Embed IFrame */}
      {shareTargetProject && (
        <ShareModal
          project={shareTargetProject}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareTargetProject(null);
          }}
        />
      )}
    </div>
  );
}
