import React, { useState } from 'react';
import { VRProject, AccessPermission } from '../../types';
import { 
  FileText, 
  KeyRound, 
  Lock, 
  Globe, 
  Users, 
  Tag, 
  Image as ImageIcon, 
  Building, 
  X, 
  Save, 
  Plus, 
  Trash2 
} from 'lucide-react';

interface ProjectBasicInfoModalProps {
  project: VRProject;
  allProjects: VRProject[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Partial<VRProject>) => void;
}

export const ProjectBasicInfoModal: React.FC<ProjectBasicInfoModalProps> = ({
  project,
  allProjects,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [coverImage, setCoverImage] = useState(project.coverImage);
  const [keywords, setKeywords] = useState<string[]>(project.keywords || []);
  const [tagInput, setTagInput] = useState('');
  const [copyright, setCopyright] = useState(project.copyright);
  const [accessPermission, setAccessPermission] = useState<AccessPermission>(project.accessPermission);
  const [accessPassword, setAccessPassword] = useState(project.accessPassword || '');
  const [associatedFloors, setAssociatedFloors] = useState(project.associatedFloors || []);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!keywords.includes(tagInput.trim())) {
        setKeywords([...keywords, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag));
  };

  const handleAddAssociatedFloor = (targetProjectId: string, floorName: string, level: number) => {
    const targetProj = allProjects.find((p) => p.id === targetProjectId);
    if (!targetProj) return;

    setAssociatedFloors([
      ...associatedFloors,
      {
        id: `af-${Date.now()}`,
        projectId: targetProj.id,
        projectName: targetProj.name,
        floorName: floorName || `${level}F 关联展区`,
        level: level
      }
    ]);
  };

  const handleRemoveAssociatedFloor = (id: string) => {
    setAssociatedFloors(associatedFloors.filter((af) => af.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      coverImage,
      keywords,
      copyright,
      accessPermission,
      accessPassword: accessPermission === 'password' ? accessPassword : '',
      associatedFloors
    });
    onClose();
  };

  return (
    <div
      id="project-basic-info-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="project-basic-info-modal-content"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-base text-white">项目基础信息设置</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">项目标题 (Name)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入VR全景项目标题"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">项目简介 (Description)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简述该VR全景项目的特色亮点、地理区位或展览主题..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              项目封面图 (Cover Image URL)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="封面图地址或全景缩略图"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
              <div className="w-16 h-10 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          {/* Keywords / Tags */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              搜索关键词 (Keywords / 标签)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-800/80 border border-zinc-700 rounded-xl min-h-[38px]">
              {keywords.map((tag) => (
                <span
                  key={tag}
                  className="bg-zinc-700 text-zinc-200 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签按回车添加..."
                className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 flex-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Copyright */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">版权信息 (Copyright)</label>
            <input
              type="text"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              placeholder="例如：© 2026 XX数字科技有限公司 版权所有"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          {/* Access Permission */}
          <div className="space-y-2">
            <label className="font-medium text-zinc-300">访问权限控制</label>
            <div className="grid grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all ${
                  accessPermission === 'public'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="accessPermission"
                  value="public"
                  checked={accessPermission === 'public'}
                  onChange={() => setAccessPermission('public')}
                  className="hidden"
                />
                <Globe className="w-5 h-5" />
                <span className="font-medium">公开访问</span>
                <span className="text-[10px] text-zinc-500">任意访客均可直接浏览</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all ${
                  accessPermission === 'password'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="accessPermission"
                  value="password"
                  checked={accessPermission === 'password'}
                  onChange={() => setAccessPermission('password')}
                  className="hidden"
                />
                <KeyRound className="w-5 h-5" />
                <span className="font-medium">密码访问</span>
                <span className="text-[10px] text-zinc-500">输入指定密码后方可进入</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all ${
                  accessPermission === 'internal'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="accessPermission"
                  value="internal"
                  checked={accessPermission === 'internal'}
                  onChange={() => setAccessPermission('internal')}
                  className="hidden"
                />
                <Users className="w-5 h-5" />
                <span className="font-medium">内部分享</span>
                <span className="text-[10px] text-zinc-500">仅内部授权成员可见</span>
              </label>
            </div>

            {accessPermission === 'password' && (
              <div className="pt-2">
                <label className="text-zinc-400 text-[11px] block mb-1">设置访问密码</label>
                <input
                  type="text"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  placeholder="请输入访问密钥（如：8888）"
                  className="w-full bg-zinc-800 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-amber-300"
                />
              </div>
            )}
          </div>

          {/* Associated Project Floors */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                项目间关联联动 (作为跨楼层切换)
              </label>
            </div>
            <p className="text-[11px] text-zinc-500">
              可以将其他独立VR项目作为本项目的分栋或扩展楼层（如地下车库、附属展馆、天台观景台），在沙盘和场景切换时实现跨项目无缝漫游跳转。
            </p>

            <div className="space-y-1.5">
              {associatedFloors.map((af) => (
                <div
                  key={af.id}
                  className="p-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-zinc-200">{af.projectName}</span>
                    <span className="text-zinc-400 ml-2">→ {af.floorName}</span>
                    <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded ml-2">
                      {af.level > 0 ? `${af.level}F` : `B${Math.abs(af.level)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssociatedFloor(af.id)}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Association */}
            {allProjects.filter((p) => p.id !== project.id).length > 0 && (
              <div className="flex gap-2 items-center pt-1">
                <select
                  id="select-associate-project"
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 flex-1"
                  onChange={(e) => {
                    const pid = e.target.value;
                    if (pid) {
                      handleAddAssociatedFloor(pid, '关联楼层区', 2);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">-- 选择要关联的项目作为楼层 --</option>
                  {allProjects
                    .filter((p) => p.id !== project.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
            >
              取消
            </button>
            <button
              id="btn-save-project-basic-info"
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>保存基础信息</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
