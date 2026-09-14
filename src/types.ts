export type ProjectStatus = 'draft' | 'published' | 'offline';
export type AccessPermission = 'public' | 'password' | 'internal';

export interface ViewAngle {
  yaw: number;   // -180 to 180 degrees
  pitch: number; // -90 to 90 degrees
  fov: number;   // 30 to 110 degrees
}

export interface ViewLimits {
  yawMin: number;
  yawMax: number;
  pitchMin: number;
  pitchMax: number;
  fovMin: number;
  fovMax: number;
}

export type HotspotType = 
  | 'scene_jump' 
  | 'info_richtext' 
  | 'info_image' 
  | 'info_video' 
  | 'info_audio' 
  | 'info_link' 
  | 'info_phone' 
  | 'info_form';

export interface HotspotStyle {
  icon: 'arrow' | 'radar' | 'info' | 'image' | 'video' | 'music' | 'link' | 'phone' | 'sparkle' | 'pin';
  size: 'sm' | 'md' | 'lg';
  color: string;
  hoverEffect: 'pulse' | 'tooltip' | 'card' | 'bounce';
  customScale?: number;
}

export interface HotspotContent {
  title: string;
  description?: string;
  richText?: string;
  images?: string[];
  videoUrl?: string;
  audioUrl?: string;
  audioName?: string;
  linkUrl?: string;
  linkTitle?: string;
  phone?: string;
  formFields?: {
    id: string;
    label: string;
    type: 'text' | 'tel' | 'email' | 'date' | 'textarea';
    placeholder?: string;
    required: boolean;
  }[];
}

export interface Hotspot {
  id: string;
  title: string;
  type: HotspotType;
  position: {
    yaw: number;    // -180 to 180
    pitch: number;  // -90 to 90
  };
  style: HotspotStyle;
  targetSceneId?: string;
  targetLandingView?: {
    yaw: number;
    pitch: number;
  };
  targetView?: ViewAngle;
  content?: HotspotContent;
}

export interface SceneAudio {
  enabled: boolean;
  url: string;
  name: string;
  loop?: boolean;
  volume: number; // 0 to 100
  autoPlay?: boolean;
}

export interface TileOptimization {
  status?: 'optimized' | 'processing' | 'ready';
  totalResolution?: string;
  originalSize?: string; // e.g. "24.5 MB (8192x4096)"
  tileLevels: {
    level: string;
    resolution: string;
    chunks: number;
    size: string;
  }[];
  compressionRatio?: string;
  tileSize?: number;
  format?: string;
  compressedPercent?: number;
}

export interface Scene {
  id: string;
  name: string;
  sortOrder: number;
  panoramaUrl: string;
  panoramaThumb: string;
  aspectRatio: '2:1';
  initialView: ViewAngle;
  viewLimits: ViewLimits;
  autoRotate: boolean;
  autoRotateSpeed: number; // e.g. 0.5 to 3.0
  littlePlanet: boolean;
  littlePlanetDuration: number; // seconds
  gyroscopeEnabled: boolean;
  bgm: SceneAudio;
  narration: SceneAudio;
  hotspots: Hotspot[];
  tileInfo?: TileOptimization;
  floorId?: string;
  floorPoint?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
}

export interface DeviceMetric {
  label: string;
  value: string;
  unit?: string;
  status?: 'normal' | 'warning' | 'alert';
}

export interface WaypointDeviceData {
  deviceName: string;
  deviceType?: string;
  deviceCode?: string;
  status: 'normal' | 'warning' | 'offline';
  videoUrl?: string;
  videoTitle?: string;
  metrics?: DeviceMetric[];
  lastInspection?: string;
}

export interface RoamWaypoint {
  id: string;
  sceneId: string;
  title: string;
  view?: ViewAngle;
  yaw?: number;
  pitch?: number;
  fov?: number;
  transitDuration: number; // seconds to transition here
  stayDuration: number;    // seconds to dwell here
  caption?: string;
  targetHotspotId?: string;
  deviceData?: WaypointDeviceData;
}

export interface RoamTour {
  enabled: boolean;
  autoStart: boolean;
  loop: boolean;
  speed?: number;
  waypoints: RoamWaypoint[];
}

export interface FloorMapPoint {
  sceneId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface FloorMap {
  id: string;
  name: string;
  level: number;
  mapUrl: string;
  points: FloorMapPoint[];
}

export interface AssociatedProjectFloor {
  id: string;
  projectId: string;
  projectName: string;
  floorName: string;
  level: number;
}

export interface VRProject {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  keywords: string[];
  copyright: string;
  status: ProjectStatus;
  accessPermission: AccessPermission;
  accessPassword?: string;
  createdAt: string;
  updatedAt: string;
  visits: number;
  isArchived: boolean;
  scenes: Scene[];
  currentSceneId: string;
  roamTour: RoamTour;
  floorMaps: FloorMap[];
  currentFloorId?: string;
  associatedFloors: AssociatedProjectFloor[];
}
