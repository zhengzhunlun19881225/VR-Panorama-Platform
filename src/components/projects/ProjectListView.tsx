import React, { useState } from 'react';
import { VRProject, ProjectStatus } from '../../types';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Copy, 
  Archive, 
  Trash2, 
  Share2, 
  MoreVertical, 
  Globe, 
  Lock, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface ProjectListViewProps {
  projects: VRProject[];
  onOpenProject: (projectId: string) => void;
  onPreviewProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onShareProject: (project: VRProject) => void;
  onCreateProject: () => void;
  onEditBasicInfo: (project: VRProject) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  onOpenProject,
  onPreviewProject,
  onDuplicateProject,
  onArchiveProject,
  onDeleteProject,
  onShareProject,
  onCreateProject,
  onEditBasicInfo
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus | 'archived'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'archived') {
      if (!p.isArchived) return false;
    } else {
      if (p.isArchived) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchTags = p.keywords.some((k) => k.toLowerCase().includes(q));
      return matchName || matchDesc || matchTags;
    }

    return true;
  });

  const getStatusBadge = (status: ProjectStatus, isArchived: boolean) => {
    if (isArchived) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
          <Archive className="w-3 h-3" />
          <span>已归档</span>
        </span>
      );
    }
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>已发布</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>草稿中</span>
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
            <AlertCircle className="w-3 h-3" />
            <span>已下线</span>
          </span>
        );
    }
  };

  const getPermissionBadge = (p: VRProject) => {
    switch (p.accessPermission) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400" title="公开访问">
            <Globe className="w-3 h-3 text-sky-400" />
            <span>公开</span>
          </span>
        );
      case 'password':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400" title="密码访问">
            <Lock className="w-3 h-3" />
            <span>密码</span>
          </span>
        );
      case 'internal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-purple-400" title="内部分享">
            <Users className="w-3 h-3" />
            <span>内部</span>
          </span>
        );
    }
  };

  return (
    <div id="project-list-view" className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="border-b border-slate-200 bg-white/85 dark:border-zinc-800/80 dark:bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md px-6 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-6 bg-sky-500 rounded-full inline-block" />
              VR 全景项目管理中心
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              集中管理您的 360° VR 空间、多场景漫游导览与高精度沙盘联动
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              id="btn-create-new-project"
              type="button"
              onClick={onCreateProject}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建 VR 全景项目</span>
            </button>
            <ThemeToggle id="btn-header-theme-toggle" />
          </div>
        </div>

        {/* Filter and View Mode Toolbar */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/60">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目名称、简介或关键词..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
            />
          </div>

          {/* Status Tabs and View Switcher */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              {[
                { id: 'all', label: '全部' },
                { id: 'published', label: '已发布' },
                { id: 'draft', label: '草稿' },
                { id: 'offline', label: '已下线' },
                { id: 'archived', label: '归档' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-sky-600 font-medium shadow-xs dark:bg-zinc-800 dark:text-sky-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List / Card Switcher */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                id="btn-view-card-mode"
                type="button"
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-sky-600 shadow-xs dark:bg-zinc-800 dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="卡片网格视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="btn-view-list-mode"
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-sky-600 shadow-xs dark:bg-zinc-800 dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title="列表表格视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Content Body */}
      <div className="max-w-7xl mx-auto w-full p-6 flex-1">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-slate-100/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 space-y-3">
            <Layers className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto" />
            <h3 className="text-slate-700 dark:text-zinc-300 font-medium text-sm">暂无匹配的全景项目</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">可尝试调整搜索关键词或重置状态筛选条件</p>
          </div>
        ) : viewMode === 'card' ? (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className="bg-white border border-slate-200/90 hover:border-sky-300 dark:bg-zinc-900/70 dark:border-zinc-800/80 dark:hover:border-zinc-700/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all group flex flex-col"
              >
                {/* Cover Banner */}
                <div
                  className="relative aspect-16/9 bg-zinc-950 cursor-pointer overflow-hidden"
                  onClick={() => onOpenProject(project.id)}
                >
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {getStatusBadge(project.status, project.isArchived)}
                    <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {getPermissionBadge(project)}
                    </div>
                  </div>

                  {/* Scene Count & PV pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      {project.scenes.length} 个全景场景
                    </span>
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      {project.visits.toLocaleString()} 浏览量
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => onOpenProject(project.id)}
                      className="font-semibold text-sm text-slate-900 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {project.description || '暂无项目描述'}
                    </p>

                    {/* Keywords */}
                    {project.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {project.keywords.slice(0, 3).map((k) => (
                          <span
                            key={k}
                            className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-transparent px-1.5 py-0.5 rounded"
                          >
                            #{k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.updatedAt}
                    </span>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPreviewProject(project.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="在线全景预览"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenProject(project.id)}
                        className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                        title="进入可视化编辑器"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onShareProject(project)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="获取分享链接"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpenId === project.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 rounded-xl shadow-2xl py-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                onEditBasicInfo(project);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <span>项目基础信息</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicateProject(project.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <span>复制项目</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onArchiveProject(project.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <span>{project.isArchived ? '取消归档' : '归档项目'}</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProject(project.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <span>删除项目</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="bg-white border border-slate-200 dark:bg-zinc-900/70 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400 font-medium">
                  <th className="p-3.5 pl-5">项目名称 / 封面</th>
                  <th className="p-3.5">状态</th>
                  <th className="p-3.5">权限</th>
                  <th className="p-3.5">场景数</th>
                  <th className="p-3.5">访问量 (PV)</th>
                  <th className="p-3.5">更新时间</th>
                  <th className="p-3.5 pr-5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black cursor-pointer border border-slate-200 dark:border-zinc-700/60"
                          onClick={() => onOpenProject(project.id)}
                        >
                          <img
                            src={project.coverImage}
                            alt={project.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div
                            onClick={() => onOpenProject(project.id)}
                            className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer text-xs"
                          >
                            {project.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1 max-w-xs">
                            {project.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">{getStatusBadge(project.status, project.isArchived)}</td>
                    <td className="p-3.5">{getPermissionBadge(project)}</td>
                    <td className="p-3.5 text-slate-700 dark:text-zinc-300 font-mono">{project.scenes.length} 场景</td>
                    <td className="p-3.5 text-slate-700 dark:text-zinc-300 font-mono">{project.visits.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-400 dark:text-zinc-400">{project.updatedAt}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onPreviewProject(project.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded"
                          title="预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.id)}
                          className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-950/40 rounded"
                          title="编辑"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(project.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded"
                          title="复制"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onShareProject(project)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40 rounded"
                          title="获取分享链接"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchiveProject(project.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded"
                          title={project.isArchived ? '取消归档' : '归档'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
