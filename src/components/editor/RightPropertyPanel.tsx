import React, { useState } from 'react';
import { Scene, Hotspot, ViewAngle, HotspotType, RoamWaypoint, RoamTour } from '../../types';
import { 
  Eye, 
  Settings2, 
  MapPin, 
  Route, 
  Layers, 
  RotateCw, 
  Sparkles, 
  Smartphone, 
  Music, 
  Mic, 
  Plus, 
  Trash2, 
  Navigation, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ExternalLink, 
  Phone, 
  Send, 
  Save, 
  Check, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Upload,
  X
} from 'lucide-react';
import { generateProceduralEquirectangular, simulateTileGeneration } from '../../utils/panoramaHelper';

interface RightPropertyPanelProps {
  scene: Scene;
  allScenes: Scene[];
  currentLiveView: ViewAngle;
  onUpdateScene: (updated: Partial<Scene>) => void;
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  onUpdateHotspot: (updatedHotspot: Hotspot) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  isPlacingHotspot: boolean;
  onStartPlacingHotspot: () => void;
  onCancelPlacingHotspot: () => void;
  onAddHotspotAtCurrentView?: () => void;
  roamTour: RoamTour;
  onUpdateRoamTour: (updated: Partial<RoamTour>) => void;
  onAddCurrentViewToRoam: () => void;
  onDeleteRoamWaypoint: (wpId: string) => void;
  onReorderRoamWaypoint: (wpId: string, direction: 'up' | 'down') => void;
  onTestRoamTour: () => void;
  onPreviewHotspot?: (hotspot: Hotspot) => void;
}

export const RightPropertyPanel: React.FC<RightPropertyPanelProps> = ({
  scene,
  allScenes,
  currentLiveView,
  onUpdateScene,
  selectedHotspot,
  onSelectHotspot,
  onUpdateHotspot,
  onDeleteHotspot,
  isPlacingHotspot,
  onStartPlacingHotspot,
  onCancelPlacingHotspot,
  onAddHotspotAtCurrentView,
  roamTour,
  onUpdateRoamTour,
  onAddCurrentViewToRoam,
  onDeleteRoamWaypoint,
  onReorderRoamWaypoint,
  onTestRoamTour,
  onPreviewHotspot
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'hotspots' | 'roam' | 'tiles'>('view');
  const [saveToast, setSaveToast] = useState(false);
  const [sceneImageUrlInput, setSceneImageUrlInput] = useState('');
  const [hotspotImageUrlInput, setHotspotImageUrlInput] = useState('');

  const handleSetCurrentAsInitialView = () => {
    onUpdateScene({
      initialView: {
        yaw: Math.round(currentLiveView.yaw * 10) / 10,
        pitch: Math.round(currentLiveView.pitch * 10) / 10,
        fov: Math.round(currentLiveView.fov * 10) / 10
      }
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Scene Panorama Image Upload
  const handleSceneImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onUpdateScene({
          panoramaUrl: dataUrl,
          panoramaThumb: dataUrl,
          tileOptimization: simulateTileGeneration(24.5)
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySceneImageUrl = () => {
    if (!sceneImageUrlInput.trim()) return;
    const newUrl = sceneImageUrlInput.trim();
    onUpdateScene({
      panoramaUrl: newUrl,
      panoramaThumb: newUrl,
      tileOptimization: simulateTileGeneration(18.5)
    });
    setSceneImageUrlInput('');
  };

  // Hotspot Images Upload & Gallery
  const handleHotspotImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedHotspot) return;
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const currentImages = selectedHotspot.content?.images || [];
    let loadedCount = 0;
    const newImages: string[] = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          newImages.push(dataUrl);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          onUpdateHotspot({
            ...selectedHotspot,
            content: {
              ...selectedHotspot.content,
              title: selectedHotspot.title,
              images: [...currentImages, ...newImages]
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddHotspotImageUrl = () => {
    if (!selectedHotspot || !hotspotImageUrlInput.trim()) return;
    const currentImages = selectedHotspot.content?.images || [];
    onUpdateHotspot({
      ...selectedHotspot,
      content: {
        ...selectedHotspot.content,
        title: selectedHotspot.title,
        images: [...currentImages, hotspotImageUrlInput.trim()]
      }
    });
    setHotspotImageUrlInput('');
  };

  const handleDeleteHotspotImage = (indexToDelete: number) => {
    if (!selectedHotspot || !selectedHotspot.content?.images) return;
    const updated = selectedHotspot.content.images.filter((_, idx) => idx !== indexToDelete);
    onUpdateHotspot({
      ...selectedHotspot,
      content: {
        ...selectedHotspot.content,
        title: selectedHotspot.title,
        images: updated
      }
    });
  };

  return (
    <aside
      id="right-property-panel"
      className="w-80 sm:w-96 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col h-full shrink-0 z-30 select-none overflow-hidden text-slate-800 dark:text-zinc-100"
    >
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('view')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'view'
              ? 'bg-white text-sky-600 shadow-sm dark:bg-zinc-800 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>基础视角</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hotspots')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            activeTab === 'hotspots'
              ? 'bg-white text-sky-600 shadow-sm dark:bg-zinc-800 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>热点管理</span>
          {scene.hotspots.length > 0 && (
            <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 px-1.5 py-0.2 rounded-full">
              {scene.hotspots.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roam')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'roam'
              ? 'bg-white text-sky-600 shadow-sm dark:bg-zinc-800 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>漫游导览</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tiles')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tiles'
              ? 'bg-white text-sky-600 shadow-sm dark:bg-zinc-800 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>瓦片优化</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-zinc-300 text-xs">
        {/* ================= TAB 1: 基础视角 ================= */}
        {activeTab === 'view' && (
          <div className="space-y-5">
            {/* 场景名称与全景底图修改 */}
            <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-sky-400" />
                  场景基础信息与底图修改
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">实时更新</span>
              </div>

              {/* 场景名称输入 */}
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">场景名称</label>
                <input
                  type="text"
                  value={scene.name}
                  onChange={(e) => onUpdateScene({ name: e.target.value })}
                  placeholder="如：1F 科技展厅"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              {/* 全景底图修改 */}
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1.5">全景底图 (2:1 等距矩形)</label>
                <div className="space-y-2">
                  <div className="flex gap-2.5 items-center bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                    <div className="w-24 h-14 rounded-lg overflow-hidden bg-black relative border border-zinc-700 shrink-0">
                      <img
                        src={scene.panoramaThumb || scene.panoramaUrl}
                        alt={scene.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0.5 right-1 text-[8px] bg-black/70 text-zinc-300 px-1 rounded">2:1</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 rounded-lg text-[11px] font-medium transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>上传本地 2:1 全景图</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSceneImageUpload}
                        />
                      </label>
                      <div className="text-[10px] text-zinc-500">支持 4K/8K 等距柱状全景原图</div>
                    </div>
                  </div>

                  {/* URL 方式更换 */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={sceneImageUrlInput}
                      onChange={(e) => setSceneImageUrlInput(e.target.value)}
                      placeholder="或输入全景图 URL..."
                      className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-[11px] text-zinc-200"
                    />
                    <button
                      type="button"
                      onClick={handleApplySceneImageUrl}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-medium"
                    >
                      更换
                    </button>
                  </div>

                  {/* 快速预设底图 */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-zinc-400">或选用高质量全景预设风格：</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'tech', label: '科技空间' },
                        { id: 'luxury', label: '豪华大堂' },
                        { id: 'museum', label: '艺术展厅' },
                        { id: 'nature', label: '生态天台' },
                        { id: 'cyber', label: '赛博夜景' }
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            const newUrl = generateProceduralEquirectangular(theme.id as any, scene.name);
                            onUpdateScene({
                              panoramaUrl: newUrl,
                              panoramaThumb: newUrl,
                              tileOptimization: simulateTileGeneration(20.0)
                            });
                          }}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-[11px] text-zinc-300 text-center transition-colors"
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Camera vs Initial View Box */}
            <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  当前实时镜头视角
                </span>
                <span className="text-[10px] text-zinc-500">跟随画布移动</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">水平 Yaw</div>
                  <div className="font-mono text-sm font-semibold text-sky-400">{Math.round(currentLiveView.yaw)}°</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">俯仰 Pitch</div>
                  <div className="font-mono text-sm font-semibold text-sky-400">{Math.round(currentLiveView.pitch)}°</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">视场 FOV</div>
                  <div className="font-mono text-sm font-semibold text-sky-400">{Math.round(currentLiveView.fov)}°</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSetCurrentAsInitialView}
                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20"
              >
                {saveToast ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saveToast ? '已保存为开场视角！' : '设当前视角为场景初始视角'}</span>
              </button>

              <div className="text-[10px] text-zinc-500 text-center">
                保存后，访客进入本场景时将默认以此角度朝向呈现
              </div>
            </div>

            {/* View Limits (左右 / 上下边界) */}
            <div className="space-y-3">
              <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                视角边界限制 (限制访客自由旋转范围)
              </label>

              <div className="space-y-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">俯仰 Pitch 上下限</span>
                    <span className="font-mono text-zinc-300">
                      {scene.viewLimits?.pitchMin ?? -75}° ~ {scene.viewLimits?.pitchMax ?? 85}°
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="-90"
                      max="0"
                      value={scene.viewLimits?.pitchMin ?? -75}
                      onChange={(e) =>
                        onUpdateScene({
                          viewLimits: { ...scene.viewLimits, pitchMin: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-sky-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={scene.viewLimits?.pitchMax ?? 85}
                      onChange={(e) =>
                        onUpdateScene({
                          viewLimits: { ...scene.viewLimits, pitchMax: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">视场角缩放 FOV 范围</span>
                    <span className="font-mono text-zinc-300">
                      {scene.viewLimits?.fovMin ?? 40}° ~ {scene.viewLimits?.fovMax ?? 100}°
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="25"
                      max="60"
                      value={scene.viewLimits?.fovMin ?? 40}
                      onChange={(e) =>
                        onUpdateScene({
                          viewLimits: { ...scene.viewLimits, fovMin: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-sky-500"
                    />
                    <input
                      type="range"
                      min="70"
                      max="120"
                      value={scene.viewLimits?.fovMax ?? 100}
                      onChange={(e) =>
                        onUpdateScene({
                          viewLimits: { ...scene.viewLimits, fovMax: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Rotate & Little Planet */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-200">全景特效与传感器</label>

              <div className="space-y-2">
                {/* Auto Rotate */}
                <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-medium text-zinc-200">自动旋转</div>
                      <div className="text-[10px] text-zinc-500">访客无操作时平缓自转漫游</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={scene.autoRotate}
                    onChange={(e) => onUpdateScene({ autoRotate: e.target.checked })}
                    className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                  />
                </div>

                {scene.autoRotate && (
                  <div className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-800/40 flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">自转速度</span>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={scene.autoRotateSpeed}
                      onChange={(e) => onUpdateScene({ autoRotateSpeed: Number(e.target.value) })}
                      className="w-32 accent-sky-500"
                    />
                  </div>
                )}

                {/* Little Planet */}
                <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-medium text-zinc-200">开场小行星效果</div>
                      <div className="text-[10px] text-zinc-500">进入时从宏观球形俯冲平滑过渡</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={scene.littlePlanet}
                    onChange={(e) => onUpdateScene({ littlePlanet: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Gyroscope */}
                <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-medium text-zinc-200">陀螺仪重力感应</div>
                      <div className="text-[10px] text-zinc-500">移动端随手机倾斜变换全景视角</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={scene.gyroscopeEnabled}
                    onChange={(e) => onUpdateScene({ gyroscopeEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Audio: BGM & Narration */}
            <div className="space-y-3">
              <label className="font-semibold text-zinc-200">全局音频与语音解说</label>

              {/* BGM */}
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-sky-400" />
                    背景音乐 (BGM)
                  </span>
                  <input
                    type="checkbox"
                    checked={scene.bgm.enabled}
                    onChange={(e) =>
                      onUpdateScene({
                        bgm: { ...scene.bgm, enabled: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                  />
                </div>
                {scene.bgm.enabled && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={scene.bgm.name}
                      placeholder="音乐名称"
                      onChange={(e) =>
                        onUpdateScene({
                          bgm: { ...scene.bgm, name: e.target.value }
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">音量大小</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scene.bgm.volume}
                        onChange={(e) =>
                          onUpdateScene({
                            bgm: { ...scene.bgm, volume: Number(e.target.value) }
                          })
                        }
                        className="w-32 accent-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Narration */}
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-rose-400" />
                    语音讲解员解说
                  </span>
                  <input
                    type="checkbox"
                    checked={scene.narration.enabled}
                    onChange={(e) =>
                      onUpdateScene({
                        narration: { ...scene.narration, enabled: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                  />
                </div>
                {scene.narration.enabled && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={scene.narration.name}
                      placeholder="讲解音频名称"
                      onChange={(e) =>
                        onUpdateScene({
                          narration: { ...scene.narration, name: e.target.value }
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 热点管理 ================= */}
        {activeTab === 'hotspots' && (
          <div className="space-y-4">
            {/* Add Hotspot Action Buttons */}
            <div className="space-y-2">
              {onAddHotspotAtCurrentView && (
                <button
                  id="btn-add-hotspot-center"
                  type="button"
                  onClick={onAddHotspotAtCurrentView}
                  className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>在当前画面中心快速添加热点</span>
                </button>
              )}

              {!isPlacingHotspot ? (
                <button
                  id="btn-trigger-add-hotspot"
                  type="button"
                  onClick={onStartPlacingHotspot}
                  className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>在全景画面中点选落点</span>
                </button>
              ) : (
                <div className="p-3 bg-sky-950/60 border border-sky-500/50 rounded-xl text-center space-y-2 animate-pulse">
                  <div className="font-medium text-sky-200 text-xs">正在拾取全景位置</div>
                  <p className="text-[11px] text-sky-300/80">点击左侧全景画面中的任意位置即可落点</p>
                  <button
                    type="button"
                    onClick={onCancelPlacingHotspot}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px]"
                  >
                    取消点选
                  </button>
                </div>
              )}
            </div>

            {/* Selected Hotspot Edit Form */}
            {selectedHotspot ? (
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-sky-500/50 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    编辑选中热点
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onPreviewHotspot && selectedHotspot.type !== 'scene_jump' && (
                      <button
                        type="button"
                        onClick={() => onPreviewHotspot(selectedHotspot)}
                        className="px-2 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/40 text-sky-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                        title="预览弹窗效果"
                      >
                        <Eye className="w-3 h-3" />
                        <span>预览弹窗</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteHotspot(selectedHotspot.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition-colors"
                      title="删除热点"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hotspot Title */}
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">热点标题 / 提示语</label>
                  <input
                    type="text"
                    value={selectedHotspot.title}
                    onChange={(e) =>
                      onUpdateHotspot({
                        ...selectedHotspot,
                        title: e.target.value,
                        content: {
                          ...selectedHotspot.content,
                          title: e.target.value
                        }
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                {/* Position fine-tuning */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                    <div>
                      <label className="block text-zinc-400 text-[10px] mb-0.5">水平角 Yaw</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="-180"
                          max="180"
                          value={Math.round(selectedHotspot.position.yaw)}
                          onChange={(e) =>
                            onUpdateHotspot({
                              ...selectedHotspot,
                              position: {
                                ...selectedHotspot.position,
                                yaw: Number(e.target.value)
                              }
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">°</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[10px] mb-0.5">俯仰角 Pitch</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="-90"
                          max="90"
                          value={Math.round(selectedHotspot.position.pitch)}
                          onChange={(e) =>
                            onUpdateHotspot({
                              ...selectedHotspot,
                              position: {
                                ...selectedHotspot.position,
                                pitch: Number(e.target.value)
                              }
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white text-center"
                        />
                        <span className="text-zinc-500 text-[10px]">°</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-sky-400/90 flex items-center gap-1 px-1">
                    <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>提示：在全景画面中可直接按住该热点图标拖动修改位置</span>
                  </div>
                </div>

                {/* Hotspot Type */}
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">热点功能类型</label>
                  <select
                    value={selectedHotspot.type}
                    onChange={(e) =>
                      onUpdateHotspot({
                        ...selectedHotspot,
                        type: e.target.value as HotspotType
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="scene_jump">🚀 场景跳转热点</option>
                    <option value="info_richtext">📄 图文介绍热点</option>
                    <option value="info_image">🖼️ 图片画廊热点</option>
                    <option value="info_video">🎬 视频播放热点</option>
                    <option value="info_audio">🎵 语音音频热点</option>
                    <option value="info_link">🔗 外部网页链接</option>
                    <option value="info_phone">📞 电话拨打热点</option>
                    <option value="info_form">📝 在线表单预约</option>
                  </select>
                </div>

                {/* Dynamic Configuration based on Type */}
                {selectedHotspot.type === 'scene_jump' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">跳转目标场景</label>
                    <select
                      value={selectedHotspot.targetSceneId || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          targetSceneId: e.target.value
                        })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="">-- 请选择目标场景 --</option>
                      {allScenes
                        .filter((s) => s.id !== scene.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedHotspot.type === 'info_richtext' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">富文本正文描述</label>
                    <textarea
                      rows={3}
                      value={selectedHotspot.content?.richText || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          content: {
                            ...selectedHotspot.content,
                            title: selectedHotspot.title,
                            richText: e.target.value
                          }
                        })
                      }
                      placeholder="输入图文热点展示的详细介绍内容..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                )}

                {selectedHotspot.type === 'info_image' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">画廊简述或导语 (可选)</label>
                    <textarea
                      rows={2}
                      value={selectedHotspot.content?.description || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          content: {
                            ...selectedHotspot.content,
                            title: selectedHotspot.title,
                            description: e.target.value
                          }
                        })
                      }
                      placeholder="如：展品多角度特写、设计实景对比等..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                )}

                {/* Hotspot Image Upload & Gallery (for info_image, info_richtext, or general hotspots) */}
                {selectedHotspot.type !== 'scene_jump' && (
                  <div className="space-y-2.5 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-200 text-xs font-medium flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        热点展示图片 / 画廊
                      </label>
                      <span className="text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-500/30">
                        {(selectedHotspot.content?.images?.length || 0)} 张图片
                      </span>
                    </div>

                    {/* Upload button & file input */}
                    <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传本地热点图片 (支持多选)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleHotspotImageFileUpload}
                      />
                    </label>

                    {/* Image URL Input */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={hotspotImageUrlInput}
                        onChange={(e) => setHotspotImageUrlInput(e.target.value)}
                        placeholder="或输入图片 URL..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddHotspotImageUrl}
                        className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs font-medium"
                      >
                        添加
                      </button>
                    </div>

                    {/* Thumbnail gallery */}
                    {selectedHotspot.content?.images && selectedHotspot.content.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {selectedHotspot.content.images.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative group aspect-square rounded-lg overflow-hidden bg-black border border-zinc-700">
                            <img
                              src={imgUrl}
                              alt={`热点配图 ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteHotspotImage(imgIdx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                              title="删除此图片"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic text-center py-1">
                        暂无图片，上传后访客点击热点可在弹窗中查看大图与画廊
                      </p>
                    )}
                  </div>
                )}

                {selectedHotspot.type === 'info_video' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">视频播放地址 (MP4 / WebM)</label>
                    <input
                      type="text"
                      value={selectedHotspot.content?.videoUrl || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          content: {
                            ...selectedHotspot.content,
                            title: selectedHotspot.title,
                            videoUrl: e.target.value
                          }
                        })
                      }
                      placeholder="https://..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                {selectedHotspot.type === 'info_link' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">链接地址 (URL)</label>
                    <input
                      type="text"
                      value={selectedHotspot.content?.linkUrl || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          content: {
                            ...selectedHotspot.content,
                            title: selectedHotspot.title,
                            linkUrl: e.target.value
                          }
                        })
                      }
                      placeholder="https://example.com"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                {selectedHotspot.type === 'info_phone' && (
                  <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <label className="block text-zinc-300 text-[11px]">拨打热线号码</label>
                    <input
                      type="tel"
                      value={selectedHotspot.content?.phone || ''}
                      onChange={(e) =>
                        onUpdateHotspot({
                          ...selectedHotspot,
                          content: {
                            ...selectedHotspot.content,
                            title: selectedHotspot.title,
                            phone: e.target.value
                          }
                        })
                      }
                      placeholder="400-880-9966"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                {/* Hotspot Custom Style: Color & Size & Hover Effect */}
                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <label className="block text-zinc-300 text-[11px]">自定义热点外观与动效</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">图标大小</span>
                      <select
                        value={selectedHotspot.style.size}
                        onChange={(e) =>
                          onUpdateHotspot({
                            ...selectedHotspot,
                            style: { ...selectedHotspot.style, size: e.target.value as 'sm' | 'md' | 'lg' }
                          })
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mt-1"
                      >
                        <option value="sm">小 (28px)</option>
                        <option value="md">中 (36px)</option>
                        <option value="lg">大 (48px)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500">Hover 悬停效果</span>
                      <select
                        value={selectedHotspot.style.hoverEffect}
                        onChange={(e) =>
                          onUpdateHotspot({
                            ...selectedHotspot,
                            style: { ...selectedHotspot.style, hoverEffect: e.target.value as any }
                          })
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mt-1"
                      >
                        <option value="pulse">脉冲涟漪</option>
                        <option value="tooltip">悬浮提示条</option>
                        <option value="bounce">弹跳反馈</option>
                        <option value="card">卡片浮现</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500">主题色</span>
                    <div className="flex items-center gap-2 mt-1">
                      {['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() =>
                            onUpdateHotspot({
                              ...selectedHotspot,
                              style: { ...selectedHotspot.style, color: c }
                            })
                          }
                          className={`w-6 h-6 rounded-full transition-transform ${
                            selectedHotspot.style.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectHotspot(null)}
                  className="w-full py-1.5 text-center text-zinc-400 hover:text-zinc-200 text-[11px]"
                >
                  完成当前热点配置
                </button>
              </div>
            ) : (
              /* Hotspots List in this Scene */
              <div className="space-y-2">
                <div className="text-zinc-400 text-[11px] font-medium">当前场景热点列表 ({scene.hotspots.length})</div>
                {scene.hotspots.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800">
                    暂无热点，点击上方按钮在全景中落点
                  </div>
                ) : (
                  scene.hotspots.map((hs) => (
                    <div
                      key={hs.id}
                      onClick={() => onSelectHotspot(hs)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 text-xs"
                          style={{ backgroundColor: hs.style.color || '#0ea5e9' }}
                        >
                          {hs.type === 'scene_jump' ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        </span>
                        <div className="truncate">
                          <div className="font-medium text-zinc-200 truncate">{hs.title}</div>
                          <div className="text-[10px] text-zinc-500">
                            Yaw: {Math.round(hs.position.yaw)}° | Pitch: {Math.round(hs.position.pitch)}°
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-sky-400" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: 漫游导览 ================= */}
        {activeTab === 'roam' && (
          <div className="space-y-4">
            <div className="space-y-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">自动漫游路线模式</div>
                  <div className="text-[10px] text-zinc-500">按预设轨迹自动切换场景与镜头视线</div>
                </div>
                <input
                  type="checkbox"
                  checked={roamTour.enabled}
                  onChange={(e) => onUpdateRoamTour({ enabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">循环路线漫游 (Loop)</span>
                <input
                  type="checkbox"
                  checked={roamTour.loop || false}
                  onChange={(e) => onUpdateRoamTour({ loop: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">漫游播放速率</span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  {[0.5, 1.0, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onUpdateRoamTour({ speed: s })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                        (roamTour.speed || 1.0) === s
                          ? 'bg-sky-500 text-white font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAddCurrentViewToRoam}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>添加当前场景与视角为途经点</span>
            </button>

            {roamTour.waypoints.length > 0 && (
              <button
                type="button"
                onClick={onTestRoamTour}
                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-sky-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-sky-500/30"
              >
                <Route className="w-4 h-4" />
                <span>立即运行测试漫游播放</span>
              </button>
            )}

            {/* Waypoints sequence list */}
            <div className="space-y-2">
              <div className="text-zinc-400 text-[11px] font-medium">
                导览途经点序列 ({roamTour.waypoints.length})
              </div>

              {roamTour.waypoints.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800">
                  暂未添加导览路线点，请点击上方按钮记录
                </div>
              ) : (
                roamTour.waypoints.map((wp, idx) => {
                  const targetScene = allScenes.find((s) => s.id === wp.sceneId);
                  return (
                    <div
                      key={wp.id}
                      className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-zinc-200">{wp.title || `导览点 ${idx + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onReorderRoamWaypoint(wp.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                            title="上移"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => onReorderRoamWaypoint(wp.id, 'down')}
                            disabled={idx === roamTour.waypoints.length - 1}
                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                            title="下移"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRoamWaypoint(wp.id)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 flex flex-wrap items-center gap-2">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                          {targetScene?.name || '未知场景'}
                        </span>
                        <span>
                          {wp.transitDuration}s平移 + {wp.stayDuration}s停留
                        </span>
                        {wp.deviceData && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>含设备指标 / 监控视频</span>
                          </span>
                        )}
                      </div>

                      {wp.caption && (
                        <p className="text-[10px] text-zinc-400 bg-zinc-900/80 p-1.5 rounded border border-zinc-800/80">
                          {wp.caption}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: 瓦片优化 ================= */}
        {activeTab === 'tiles' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">2:1 等距矩形瓦片金字塔</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                  已优化就绪
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                上传 2:1 全景原图后，系统自动进行多分辨率切片（Multi-resolution Tiling），首屏加载加速达 84%，节省移动端 90% 带宽。
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-medium text-zinc-400">瓦片层级详情</div>
              {(scene.tileInfo?.tileLevels || [
                { level: 'L0 缩略图', resolution: '512×256', chunks: 1, size: '84 KB (秒开首屏)' },
                { level: 'L1 低清层', resolution: '1024×512', chunks: 4, size: '420 KB' },
                { level: 'L2 标准层', resolution: '2048×1024', chunks: 16, size: '1.8 MB' },
                { level: 'L3 高清层', resolution: '4096×2048', chunks: 64, size: '6.2 MB' },
                { level: 'L4 超清瓦片', resolution: '8192×4096', chunks: 256, size: '21.0 MB (分块按需)' }
              ]).map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-lg border border-zinc-800/60 text-[11px]"
                >
                  <div>
                    <span className="font-medium text-zinc-200">{t.level}</span>
                    <span className="text-zinc-500 ml-2">({t.resolution})</span>
                  </div>
                  <span className="text-sky-400 font-mono text-[10px]">{t.size}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新分析并生成瓦片切片</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
