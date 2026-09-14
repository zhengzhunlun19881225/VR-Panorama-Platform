import React, { useState } from 'react';
import { FloorMap, Scene, AssociatedProjectFloor } from '../../types';
import { Map, Layers, ChevronDown, Maximize2, Minimize2, Eye } from 'lucide-react';

interface SandplayMapProps {
  floorMaps: FloorMap[];
  currentFloorId?: string;
  onSelectFloor: (floorId: string) => void;
  scenes: Scene[];
  currentSceneId: string;
  currentYaw: number;
  onJumpToScene: (sceneId: string) => void;
  associatedFloors?: AssociatedProjectFloor[];
  onSelectAssociatedFloor?: (associatedFloor: AssociatedProjectFloor) => void;
  isEditorMode?: boolean;
  onUpdateSceneFloorPoint?: (sceneId: string, floorId: string, point: { x: number; y: number }) => void;
}

export const SandplayMap: React.FC<SandplayMapProps> = ({
  floorMaps,
  currentFloorId,
  onSelectFloor,
  scenes,
  currentSceneId,
  currentYaw,
  onJumpToScene,
  associatedFloors = [],
  onSelectAssociatedFloor,
  isEditorMode = false,
  onUpdateSceneFloorPoint
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  const activeFloor = floorMaps.find((f) => f.id === currentFloorId) || floorMaps[0];
  const currentScene = scenes.find((s) => s.id === currentSceneId);

  if (!activeFloor) return null;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditorMode || !onUpdateSceneFloorPoint || !currentSceneId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onUpdateSceneFloorPoint(currentSceneId, activeFloor.id, { x, y });
  };

  return (
    <div
      id="sandplay-mini-map-container"
      className={`fixed z-30 transition-all duration-300 pointer-events-auto ${
        isExpanded
          ? 'inset-6 sm:inset-12 bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-700 shadow-2xl flex flex-col p-4'
          : 'bottom-20 right-5 w-60 sm:w-72 bg-zinc-900/85 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xl overflow-hidden'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/90 select-none">
        <div className="relative">
          <button
            id="btn-sandplay-floor-dropdown"
            type="button"
            onClick={() => setShowFloorDropdown(!showFloorDropdown)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-sky-400 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{activeFloor.name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {/* Floor Selection Popover */}
          {showFloorDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 z-40 text-xs">
              <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                当前项目楼层
              </div>
              {floorMaps.map((floor) => (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => {
                    onSelectFloor(floor.id);
                    setShowFloorDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                    floor.id === activeFloor.id
                      ? 'bg-sky-500/20 text-sky-300 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{floor.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {floor.level > 0 ? `${floor.level}F` : `B${Math.abs(floor.level)}`}
                  </span>
                </button>
              ))}

              {associatedFloors.length > 0 && (
                <>
                  <div className="border-t border-zinc-800 my-1 pt-1 px-3 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <span>关联项目跨楼层</span>
                  </div>
                  {associatedFloors.map((af) => (
                    <button
                      key={af.id}
                      type="button"
                      onClick={() => {
                        onSelectAssociatedFloor?.(af);
                        setShowFloorDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between text-zinc-300 hover:bg-amber-950/40 hover:text-amber-200 transition-colors"
                    >
                      <span className="truncate">{af.projectName} · {af.floorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 shrink-0">
                        关联
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-white rounded hover:bg-zinc-800"
            title={isExpanded ? '缩小' : '放大沙盘'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:text-white rounded hover:bg-zinc-800 text-[10px]"
            >
              {isCollapsed ? '展开' : '折叠'}
            </button>
          )}
        </div>
      </div>

      {/* Map Body Canvas */}
      {!isCollapsed && (
        <div
          id="sandplay-map-viewport"
          className={`relative bg-zinc-950 overflow-hidden cursor-crosshair ${
            isExpanded ? 'flex-1 min-h-0' : 'aspect-4/3'
          }`}
          onClick={handleMapClick}
        >
          {/* Architectural Floor plan raster / background */}
          <img
            src={activeFloor.mapUrl}
            alt="Floor Map"
            className="w-full h-full object-cover opacity-70 filter brightness-90 contrast-125"
            referrerPolicy="no-referrer"
          />

          {/* Grid overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Scene Point Pins */}
          {scenes.map((sc) => {
            const point = sc.floorPoint || (activeFloor.points.find((p) => p.sceneId === sc.id));
            if (!point) return null;

            const isCurrent = sc.id === currentSceneId;

            return (
              <div
                key={sc.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToScene(sc.id);
                }}
              >
                {/* Real-time FOV Radar Fan Cone (Active Scene only) */}
                {isCurrent && (
                  <div
                    className="absolute -inset-10 pointer-events-none transition-transform duration-75 flex items-center justify-center"
                    style={{ transform: `rotate(${currentYaw}deg)` }}
                  >
                    <div
                      className="w-16 h-16 origin-center"
                      style={{
                        background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.5) 0%, rgba(14, 165, 233, 0) 70%)',
                        clipPath: 'polygon(50% 50%, 20% 0%, 80% 0%)',
                      }}
                    />
                  </div>
                )}

                {/* Radar pulse for active point */}
                {isCurrent && (
                  <span className="absolute -inset-1 rounded-full bg-sky-400 animate-ping opacity-75" />
                )}

                {/* Point Marker */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-transform shadow-md ${
                    isCurrent
                      ? 'bg-sky-500 border-white scale-125 ring-2 ring-sky-300'
                      : 'bg-zinc-700 border-zinc-300 group-hover:bg-amber-500 group-hover:scale-125'
                  }`}
                >
                  <Eye className={`w-2 h-2 ${isCurrent ? 'text-white' : 'text-zinc-300'}`} />
                </div>

                {/* Label Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                  <div className="bg-zinc-900/95 text-zinc-100 text-[10px] px-2 py-0.5 rounded shadow border border-zinc-700">
                    {sc.name}
                  </div>
                </div>
              </div>
            );
          })}

          {isEditorMode && (
            <div className="absolute bottom-2 left-2 pointer-events-none bg-zinc-900/80 px-2 py-0.5 rounded text-[10px] text-zinc-400 border border-zinc-700">
              编辑模式：点击平面图即可重设当前场景点位
            </div>
          )}
        </div>
      )}
    </div>
  );
};
