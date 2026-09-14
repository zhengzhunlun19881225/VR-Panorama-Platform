import React, { useState } from 'react';
import { Scene, VRProject, AssociatedProjectFloor } from '../../types';
import { 
  Image, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Layers, 
  Upload, 
  Check, 
  Sparkles, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  X
} from 'lucide-react';
import { generateProceduralEquirectangular, simulateTileGeneration } from '../../utils/panoramaHelper';

interface LeftScenesDrawerProps {
  project: VRProject;
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: (newScene: Scene) => void;
  onUpdateScene?: (sceneId: string, updated: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorderScene: (sceneId: string, direction: 'up' | 'down') => void;
  onDuplicateScene: (sceneId: string) => void;
  onSelectAssociatedFloor?: (floor: AssociatedProjectFloor) => void;
}

export const LeftScenesDrawer: React.FC<LeftScenesDrawerProps> = ({
  project,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onReorderScene,
  onDuplicateScene,
  onSelectAssociatedFloor
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'tech' | 'luxury' | 'museum' | 'nature' | 'cyber'>('tech');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit Scene Modal state
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editName, setEditName] = useState('');
  const [editPanoramaUrl, setEditPanoramaUrl] = useState('');

  const handleCreateScene = () => {
    if (!newSceneName.trim()) return;

    let panoramaUrl = customImageUrl.trim();
    if (!panoramaUrl) {
      panoramaUrl = generateProceduralEquirectangular(selectedTheme, newSceneName);
    }

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: newSceneName.trim(),
      sortOrder: project.scenes.length + 1,
      panoramaUrl: panoramaUrl,
      panoramaThumb: panoramaUrl,
      aspectRatio: '2:1',
      initialView: { yaw: 0, pitch: 0, fov: 75 },
      viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -75, pitchMax: 85, fovMin: 40, fovMax: 100 },
      autoRotate: true,
      autoRotateSpeed: 0.6,
      littlePlanet: true,
      littlePlanetDuration: 2.5,
      gyroscopeEnabled: true,
      tileInfo: simulateTileGeneration(20.5),
      bgm: { enabled: false, url: '', name: '', loop: true, volume: 40 },
      narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
      hotspots: []
    };

    onAddScene(newScene);
    setNewSceneName('');
    setCustomImageUrl('');
    setShowAddModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImageUrl(dataUrl);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <aside
        id="left-scenes-drawer"
        className={`bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col h-full shrink-0 z-30 transition-all duration-300 select-none text-slate-800 dark:text-zinc-100 ${
          isCollapsed ? 'w-12' : 'w-64 sm:w-72'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/40">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span className="font-semibold text-xs text-slate-900 dark:text-white">场景列表与楼层</span>
              <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.2 rounded-full border border-slate-200 dark:border-zinc-700">
                {project.scenes.length}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded mx-auto transition-colors"
            title={isCollapsed ? '展开场景列表' : '折叠面板'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsed view indicator */}
        {isCollapsed ? (
          <div className="flex-1 py-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setShowAddModal(true);
              }}
              className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center hover:bg-sky-500 shadow-md shadow-sky-600/20"
              title="新增场景"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="border-t border-slate-200 dark:border-zinc-800 w-6 my-1" />
            {project.scenes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectScene(s.id)}
                className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-transform ${
                  s.id === activeSceneId ? 'border-sky-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={s.name}
              >
                <img src={s.panoramaThumb} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Action Bar: Add Scene */}
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
              <button
                id="btn-open-add-scene-modal"
                type="button"
                onClick={() => setShowAddModal(true)}
                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增 2:1 全景场景</span>
              </button>
            </div>

            {/* Scenes Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {project.scenes.map((s, idx) => {
                const isActive = s.id === activeSceneId;
                return (
                  <div
                    key={s.id}
                    id={`scene-item-${s.id}`}
                    onClick={() => onSelectScene(s.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/80 shadow-md shadow-sky-500/10'
                        : 'bg-slate-50/70 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex gap-2.5 items-center">
                      {/* Panorama 2:1 Thumbnail */}
                      <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-black relative border border-slate-300 dark:border-zinc-700/60 shadow-xs">
                        <img
                          src={s.panoramaThumb}
                          alt={s.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0.5 right-1 text-[8px] bg-black/70 text-zinc-300 px-1 rounded">
                          2:1
                        </span>
                      </div>

                      {/* Scene Title & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-medium truncate ${isActive ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-zinc-200'}`}>
                            {s.name}
                          </h4>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-500 flex items-center gap-2 mt-1">
                          <span>{s.hotspots.length} 个热点</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400/90">瓦片已优化</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Tools on Hover / Active */}
                    <div className={`mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-zinc-400 text-xs ${
                      isActive ? 'flex' : 'hidden group-hover:flex'
                    }`}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderScene(s.id, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-white rounded hover:bg-zinc-800 disabled:opacity-20"
                          title="上移"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderScene(s.id, 'down');
                          }}
                          disabled={idx === project.scenes.length - 1}
                          className="p-1 hover:text-white rounded hover:bg-zinc-800 disabled:opacity-20"
                          title="下移"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingScene(s);
                            setEditName(s.name);
                            setEditPanoramaUrl(s.panoramaUrl);
                          }}
                          className="p-1 hover:text-sky-400 rounded hover:bg-zinc-800"
                          title="修改场景名称与底图"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateScene(s.id);
                          }}
                          className="p-1 hover:text-white rounded hover:bg-zinc-800"
                          title="复制场景"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {project.scenes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteScene(s.id);
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                          title="删除场景"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floor and Cross-Project Association Section */}
            {project.associatedFloors && project.associatedFloors.length > 0 && (
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 space-y-2">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-400" />
                  <span>关联项目楼层联动</span>
                </div>
                <div className="space-y-1">
                  {project.associatedFloors.map((af) => (
                    <button
                      key={af.id}
                      type="button"
                      onClick={() => onSelectAssociatedFloor?.(af)}
                      className="w-full text-left p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">{af.floorName}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {af.level > 0 ? `${af.level}F` : `B${Math.abs(af.level)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Add Scene Dialog / Modal */}
      {showAddModal && (
        <div
          id="add-scene-modal"
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-900 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-500" />
                新增 360° VR 全景场景
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Scene Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">场景名称</label>
              <input
                type="text"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder="例如：2F 沉浸式数字研讨室"
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Upload or Preset 2:1 Panorama */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                上传 2:1 等距矩形全景原图 (Equirectangular)
              </label>

              <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/60 dark:bg-zinc-950/40 transition-colors">
                <Upload className="w-6 h-6 text-sky-500" />
                <span className="text-xs text-slate-700 dark:text-zinc-300">
                  {isUploading ? '正在处理全景图...' : '点击或拖拽上传 2:1 全景图片'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  支持 JPG / PNG，建议分辨率 4096×2048 或 8192×4096
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {customImageUrl && (
                <div className="rounded-lg overflow-hidden border border-emerald-500/50 p-2 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">已选择全景图，系统将自动生成多分辨率瓦片</span>
                </div>
              )}
            </div>

            {/* Preset Atmosphere Selector */}
            {!customImageUrl && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  或选用内置 360° 空间预设风格
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tech', label: '科技未来' },
                    { id: 'luxury', label: '轻奢会展' },
                    { id: 'cyber', label: '赛博空间' },
                    { id: 'nature', label: '生态天台' },
                    { id: 'museum', label: '文博古韵' }
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setSelectedTheme(thm.id as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                        selectedTheme === thm.id
                          ? 'bg-sky-50 dark:bg-sky-600/30 border-sky-400 text-sky-700 dark:text-sky-200'
                          : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {thm.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-xl text-xs transition-colors"
              >
                取消
              </button>
              <button
                id="btn-confirm-create-scene"
                type="button"
                onClick={handleCreateScene}
                disabled={!newSceneName.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium shadow-md shadow-sky-600/20 transition-colors"
              >
                立即创建并切片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Scene Info & Panorama Image */}
      {editingScene && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 max-w-md w-full rounded-2xl p-5 space-y-4 shadow-2xl text-slate-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-500" />
                修改场景名称与底图
              </h3>
              <button
                type="button"
                onClick={() => setEditingScene(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scene Name */}
            <div>
              <label className="block text-xs text-slate-700 dark:text-zinc-300 mb-1">场景名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入场景名称"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            {/* Current Panorama Preview */}
            <div>
              <label className="block text-xs text-slate-700 dark:text-zinc-300 mb-1">当前全景底图 (2:1)</label>
              <div className="aspect-[2/1] rounded-xl overflow-hidden bg-black border border-slate-300 dark:border-zinc-800 relative shadow-xs">
                <img
                  src={editPanoramaUrl || editingScene.panoramaUrl}
                  alt={editName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-2 text-[9px] bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded">
                  2:1 等距矩形
                </span>
              </div>
            </div>

            {/* Upload Local Image */}
            <div>
              <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-600/20 dark:hover:bg-sky-600/30 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/40 rounded-xl text-xs font-medium transition-colors">
                <Upload className="w-4 h-4" />
                <span>上传新的本地 2:1 全景图</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) setEditPanoramaUrl(dataUrl);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>

            {/* Or URL input */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500 dark:text-zinc-400">或输入全景图 URL 地址</label>
              <input
                type="text"
                value={editPanoramaUrl}
                onChange={(e) => setEditPanoramaUrl(e.target.value)}
                placeholder="https://... 或 data:image/..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            {/* Or Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">或选用高质量预设场景风格：</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'tech', label: '科技空间' },
                  { id: 'luxury', label: '豪华大堂' },
                  { id: 'museum', label: '艺术展厅' },
                  { id: 'nature', label: '生态天台' },
                  { id: 'cyber', label: '赛博夜景' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const newUrl = generateProceduralEquirectangular(preset.id as any, editName || editingScene.name);
                      setEditPanoramaUrl(newUrl);
                    }}
                    className="p-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-center transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingScene(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-xl text-xs transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingScene || !onUpdateScene) return;
                  const finalUrl = editPanoramaUrl || editingScene.panoramaUrl;
                  onUpdateScene(editingScene.id, {
                    name: editName.trim() || editingScene.name,
                    panoramaUrl: finalUrl,
                    panoramaThumb: finalUrl,
                    tileOptimization: simulateTileGeneration(22.0)
                  });
                  setEditingScene(null);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors"
              >
                保存场景修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
