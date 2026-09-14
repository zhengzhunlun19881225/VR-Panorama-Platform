import React, { useState } from 'react';
import { VRProject, Scene, FloorMap } from '../../types';
import { 
  ArrowLeft, 
  Eye, 
  Share2, 
  Settings, 
  Check, 
  ChevronDown, 
  Save, 
  Layers, 
  Building2,
  Send,
  Route
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface EditorHeaderProps {
  project: VRProject;
  currentScene: Scene;
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
  onBackToList: () => void;
  onSelectScene: (sceneId: string) => void;
  onOpenBasicInfo: () => void;
  onOpenShare: () => void;
  onUpdateStatus: (status: 'draft' | 'published' | 'offline') => void;
  onManualSave: () => void;
  isRoamTourPlaying?: boolean;
  onToggleRoamTour?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  project,
  currentScene,
  isPreviewMode,
  onTogglePreviewMode,
  onBackToList,
  onSelectScene,
  onOpenBasicInfo,
  onOpenShare,
  onUpdateStatus,
  onManualSave,
  isRoamTourPlaying = false,
  onToggleRoamTour
}) => {
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveClick = () => {
    onManualSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <header
      id="editor-top-header"
      className="h-14 bg-white border-b border-slate-200 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex items-center justify-between px-4 z-40 select-none shrink-0 transition-colors"
    >
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToList}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="返回项目列表"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">工作台</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white max-w-[160px] sm:max-w-xs truncate">
            {project.name}
          </span>
          <button
            type="button"
            onClick={onOpenBasicInfo}
            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-sky-400 dark:hover:bg-zinc-800 rounded transition-colors"
            title="编辑项目基础信息"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle: Scene Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSceneMenu(!showSceneMenu)}
          className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 dark:bg-zinc-950/80 dark:hover:bg-zinc-800/80 dark:border-zinc-700/80 dark:text-zinc-200 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 transition-colors shadow-xs"
        >
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-medium max-w-[120px] sm:max-w-[200px] truncate">{currentScene.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
        </button>

        {showSceneMenu && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-60 bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
            <div className="px-3 py-1 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">切换编辑场景</div>
            {project.scenes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelectScene(s.id);
                  setShowSceneMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                  s.id === currentScene.id
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 font-medium'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{s.hotspots.length}个热点</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Mode Switcher, Status, Share & Save & ThemeToggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Roam Tour Quick Toggle */}
        {onToggleRoamTour && (
          <button
            id="btn-header-roam-tour"
            type="button"
            onClick={onToggleRoamTour}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              isRoamTourPlaying
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold ring-2 ring-indigo-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700'
            }`}
            title="开启/关闭全自动漫游导览"
          >
            <Route className={`w-3.5 h-3.5 ${isRoamTourPlaying ? 'text-amber-300 animate-pulse' : 'text-indigo-500 dark:text-indigo-400'}`} />
            <span className="hidden sm:inline">{isRoamTourPlaying ? '漫游中' : '漫游导览'}</span>
          </button>
        )}

        {/* Preview / Edit Mode Toggle */}
        <button
          id="btn-toggle-editor-preview"
          type="button"
          onClick={onTogglePreviewMode}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            isPreviewMode
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isPreviewMode ? '退出沉浸预览' : '实时预览'}</span>
        </button>

        {/* Project Status Dropdown */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-1.5"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                project.status === 'published'
                  ? 'bg-emerald-500'
                  : project.status === 'draft'
                  ? 'bg-amber-500'
                  : 'bg-slate-400 dark:bg-zinc-500'
              }`}
            />
            <span>
              {project.status === 'published' ? '已发布' : project.status === 'draft' ? '草稿中' : '已下线'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-white border border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 rounded-xl shadow-2xl py-1 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus('published');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                已发布
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus('draft');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                设为草稿
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus('offline');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                下线停用
              </button>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onOpenShare}
          className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 dark:border-zinc-700 transition-colors"
          title="分享项目"
        >
          <Share2 className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden sm:inline">分享</span>
        </button>

        {/* Save Button */}
        <button
          id="btn-header-save"
          type="button"
          onClick={handleSaveClick}
          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all"
        >
          {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{justSaved ? '已保存' : '保存'}</span>
        </button>

        {/* Theme Toggle Button */}
        <ThemeToggle id="btn-editor-theme-toggle" />
      </div>
    </header>
  );
};
