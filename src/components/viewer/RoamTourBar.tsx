import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RoamTour, RoamWaypoint, Scene, Hotspot } from '../../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Compass, 
  MessageSquare, 
  X, 
  Gauge, 
  RotateCw, 
  CheckCircle, 
  RotateCcw,
  Sparkles,
  Navigation,
  Activity,
  ChevronRight,
  Eye
} from 'lucide-react';
import { RoamDeviceInspectCard } from './RoamDeviceInspectCard';

export type RoamStepType = 
  | 'rotating'     // 1. 自动旋转视角
  | 'panning'      // 2. 自动平移
  | 'scene_jump'   // 自动跳转全景点位
  | 'dwelling'     // 3. 到达设备热点停留、展示设备数据 / 视频
  | 'completed';   // 走完路线结束

interface RoamTourBarProps {
  roamTour: RoamTour;
  allScenes: Scene[];
  currentSceneId: string;
  onRotateView?: (
    deltaYaw: number, 
    durationSec: number, 
    onComplete: () => void
  ) => void;
  onPanView?: (
    targetYaw: number,
    targetPitch: number,
    targetFov: number,
    durationSec: number,
    onComplete: () => void
  ) => void;
  onJumpScene?: (
    targetSceneId: string, 
    onSceneReady?: () => void
  ) => void;
  onPauseTransition?: () => void;
  onResumeTransition?: () => void;
  onStopTransition?: () => void;
  onWaypointTrigger?: (
    waypoint: RoamWaypoint, 
    transitDurationSec: number, 
    onTransitComplete: () => void
  ) => void;
  onCloseTour?: () => void;
  onOpenHotspotModal?: (hotspot: Hotspot) => void;
  onHighlightHotspot?: (hotspotId: string | null) => void;
}

export const RoamTourBar: React.FC<RoamTourBarProps> = ({
  roamTour,
  allScenes,
  currentSceneId,
  onRotateView,
  onPanView,
  onJumpScene,
  onPauseTransition,
  onResumeTransition,
  onStopTransition,
  onWaypointTrigger,
  onCloseTour,
  onOpenHotspotModal,
  onHighlightHotspot
}) => {
  const waypoints = roamTour.waypoints || [];
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(roamTour.speed || 1.0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<RoamStepType>('rotating');
  const [stayRemainingSec, setStayRemainingSec] = useState(3.5);
  const [stayTotalSec, setStayTotalSec] = useState(3.5);
  const [showCaption, setShowCaption] = useState(true);

  // Interval, timeout and state tracking refs
  const dwellIntervalRef = useRef<number | null>(null);
  const stepTimeoutRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const stepRef = useRef<RoamStepType>(step);
  const currentIndexRef = useRef(currentIndex);

  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  stepRef.current = step;
  currentIndexRef.current = currentIndex;

  const currentWaypoint = waypoints[currentIndex];

  // Associated scene & hotspot finding
  const waypointScene = allScenes.find((s) => s.id === currentWaypoint?.sceneId) ||
    allScenes.find((s) => s.id === currentSceneId);
  
  const currentHotspot: Hotspot | null = waypointScene
    ? (currentWaypoint?.targetHotspotId
        ? waypointScene.hotspots.find((h) => h.id === currentWaypoint.targetHotspotId) || null
        : waypointScene.hotspots.find((h) => h.type !== 'scene_jump') || waypointScene.hotspots[0] || null)
    : null;

  // Clear all running timers
  const clearAllTimers = useCallback(() => {
    if (dwellIntervalRef.current) {
      window.clearInterval(dwellIntervalRef.current);
      dwellIntervalRef.current = null;
    }
    if (stepTimeoutRef.current) {
      window.clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
  }, []);

  // Forward declarations of sequence execution functions
  const executeSequenceForWaypoint = useCallback((index: number) => {
    if (index < 0 || index >= waypoints.length) {
      if (roamTour.loop) {
        index = 0;
      } else {
        setStep('completed');
        setIsPlaying(false);
        onHighlightHotspot?.(null);
        return;
      }
    }

    clearAllTimers();
    setCurrentIndex(index);
    const wp = waypoints[index];
    if (!wp) return;

    // Check if scene jump is required first
    const needsSceneJump = wp.sceneId && wp.sceneId !== currentSceneId;

    if (needsSceneJump && onJumpScene) {
      setStep('scene_jump');
      onHighlightHotspot?.(null);
      onJumpScene(wp.sceneId, () => {
        // Scene jumped and mounted, now start sequence: 1. Rotate View -> 2. Pan View -> 3. Dwell & Inspect
        proceedToRotate(wp, index);
      });
    } else {
      // Same scene: start sequence directly
      proceedToRotate(wp, index);
    }
  }, [waypoints, roamTour.loop, currentSceneId, onJumpScene, onHighlightHotspot, clearAllTimers]);

  // Step 1: 自动旋转视角 (Auto-rotating View)
  const proceedToRotate = (wp: RoamWaypoint, index: number) => {
    setStep('rotating');
    onHighlightHotspot?.(null);

    const rotateSec = Math.max(0.6, 1.8 / speedRef.current);

    if (onRotateView) {
      // Smooth panoramic scan of 45 degrees
      onRotateView(45, rotateSec, () => {
        proceedToPan(wp, index);
      });
    } else if (onWaypointTrigger) {
      // Fallback
      onWaypointTrigger(wp, rotateSec, () => {
        proceedToDwell(wp, index);
      });
    } else {
      stepTimeoutRef.current = window.setTimeout(() => {
        proceedToPan(wp, index);
      }, rotateSec * 1000);
    }
  };

  // Step 2: 自动平移视角 (Auto-panning to Hotspot)
  const proceedToPan = (wp: RoamWaypoint, index: number) => {
    setStep('panning');
    // Highlight target hotspot during panning
    if (wp.targetHotspotId) {
      onHighlightHotspot?.(wp.targetHotspotId);
    }

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

    const baseTransit = Number.isFinite(wp.transitDuration) ? wp.transitDuration : 1.6;
    const panSec = Math.max(0.5, baseTransit / speedRef.current);

    if (onPanView) {
      onPanView(targetYaw, targetPitch, targetFov, panSec, () => {
        proceedToDwell(wp, index);
      });
    } else if (onWaypointTrigger) {
      onWaypointTrigger(wp, panSec, () => {
        proceedToDwell(wp, index);
      });
    } else {
      stepTimeoutRef.current = window.setTimeout(() => {
        proceedToDwell(wp, index);
      }, panSec * 1000);
    }
  };

  // Step 3: 到达设备热点停留、展示设备数据 / 视频 (Hotspot Dwell & Inspect)
  const proceedToDwell = (wp: RoamWaypoint, index: number) => {
    setStep('dwelling');
    if (wp.targetHotspotId) {
      onHighlightHotspot?.(wp.targetHotspotId);
    }

    const baseStay = Number.isFinite(wp.stayDuration) ? wp.stayDuration : 3.5;
    const effectiveStaySec = Math.max(1.0, baseStay / speedRef.current);
    setStayTotalSec(effectiveStaySec);
    setStayRemainingSec(effectiveStaySec);

    startDwellCountdown(effectiveStaySec, index);
  };

  // Dwell countdown interval loop
  const startDwellCountdown = (initialSec: number, forIndex: number) => {
    if (dwellIntervalRef.current) {
      window.clearInterval(dwellIntervalRef.current);
      dwellIntervalRef.current = null;
    }
    let remaining = initialSec;

    dwellIntervalRef.current = window.setInterval(() => {
      if (!isPlayingRef.current) return; // Paused

      const step = 0.1;
      remaining -= step;
      setStayRemainingSec(Math.max(0, remaining));

      if (remaining <= 0) {
        if (dwellIntervalRef.current) {
          window.clearInterval(dwellIntervalRef.current);
          dwellIntervalRef.current = null;
        }
        // Advance to next waypoint or complete tour
        const nextIdx = forIndex + 1;
        if (nextIdx < waypoints.length) {
          executeSequenceForWaypoint(nextIdx);
        } else if (roamTour.loop) {
          executeSequenceForWaypoint(0);
        } else {
          setStep('completed');
          setIsPlaying(false);
          onHighlightHotspot?.(null);
        }
      }
    }, 100);
  };

  // Start tour immediately on mount
  useEffect(() => {
    if (waypoints.length > 0) {
      executeSequenceForWaypoint(0);
    }
    return () => {
      clearAllTimers();
      onStopTransition?.();
      onHighlightHotspot?.(null);
    };
  }, []);

  // Pause / Resume Toggle
  const handleTogglePlay = () => {
    if (step === 'completed') {
      setIsPlaying(true);
      executeSequenceForWaypoint(0);
      return;
    }

    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);

    if (nextPlay) {
      // Resume
      onResumeTransition?.();
      if (step === 'rotating' || step === 'panning' || step === 'scene_jump') {
        // Re-execute current waypoint cleanly if was interrupted
        executeSequenceForWaypoint(currentIndex);
      }
    } else {
      // Pause
      onPauseTransition?.();
    }
  };

  // Speed Adjustment (0.5x, 1.0x, 1.5x, 2.0x)
  const handleSetSpeed = (newSpeed: number) => {
    const oldSpeed = speed;
    setSpeed(newSpeed);
    speedRef.current = newSpeed;

    // Rescale remaining dwell time if currently dwelling
    if (step === 'dwelling' && stayRemainingSec > 0) {
      const ratio = oldSpeed / newSpeed;
      const newRemaining = Math.max(0.5, stayRemainingSec * ratio);
      const newTotal = Math.max(0.5, stayTotalSec * ratio);
      setStayRemainingSec(newRemaining);
      setStayTotalSec(newTotal);
      if (dwellIntervalRef.current) {
        window.clearInterval(dwellIntervalRef.current);
        dwellIntervalRef.current = null;
      }
      startDwellCountdown(newRemaining, currentIndex);
    }
  };

  // Skip / Next Waypoint
  const handleNext = () => {
    clearAllTimers();
    onStopTransition?.();
    const nextIdx = (currentIndex + 1) % waypoints.length;
    executeSequenceForWaypoint(nextIdx);
  };

  // Previous Waypoint
  const handlePrev = () => {
    clearAllTimers();
    onStopTransition?.();
    const prevIdx = (currentIndex - 1 + waypoints.length) % waypoints.length;
    executeSequenceForWaypoint(prevIdx);
  };

  // Skip current dwell stay and move to next
  const handleSkipStay = () => {
    handleNext();
  };

  if (!waypoints || waypoints.length === 0) return null;

  return (
    <>
      {/* 1. DEVICE INSPECTION / DATA / VIDEO CARD (Active during dwelling stage) */}
      {step === 'dwelling' && currentWaypoint && (
        <RoamDeviceInspectCard
          waypoint={currentWaypoint}
          deviceData={currentWaypoint.deviceData}
          hotspot={currentHotspot}
          stayRemainingSec={stayRemainingSec}
          stayTotalSec={stayTotalSec}
          isPaused={!isPlaying}
          onSkipStay={handleSkipStay}
          onOpenFullDetail={
            currentHotspot && onOpenHotspotModal
              ? () => onOpenHotspotModal(currentHotspot)
              : undefined
          }
        />
      )}

      {/* 2. TOUR COMPLETED CARD (when finished and loop is false) */}
      {step === 'completed' && (
        <div
          id="roam-tour-completed-modal"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl px-6 py-5 shadow-2xl text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200 min-w-[320px]"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">漫游路线导览已完成</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              已全自动巡检全部 {waypoints.length} 个全景点位，并完成设备数据与监控视频展示。
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(true);
                executeSequenceForWaypoint(0);
              }}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新播放漫游</span>
            </button>
            {onCloseTour && (
              <button
                type="button"
                onClick={onCloseTour}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 text-xs transition-colors"
              >
                退出漫游
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTROLLER BOTTOM FLOATING DOCK */}
      <div
        id="roam-tour-player-container"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[95%] sm:w-auto flex flex-col items-center gap-2 pointer-events-auto"
      >
        {/* Caption / Narration Banner */}
        {showCaption && currentWaypoint?.caption && (
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-slate-800 dark:text-zinc-100 text-xs shadow-2xl flex items-center gap-2.5 max-w-xl animate-in slide-in-from-bottom-2 duration-200">
            <MessageSquare className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="leading-relaxed flex-1">{currentWaypoint.caption}</span>
            <button
              type="button"
              onClick={() => setShowCaption(false)}
              className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5 rounded transition-colors"
              title="关闭字幕"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Player Navigation & Multi-Stage Status Bar */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl flex flex-col gap-2 w-full sm:w-auto">
          {/* Upper Row: 3-Stage Progress Visualizer */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80 text-[11px]">
            {/* Step 1: 自动旋转视角 */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                step === 'rotating'
                  ? 'bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-400/40 font-medium'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <RotateCw className={`w-3 h-3 ${step === 'rotating' && isPlaying ? 'animate-spin' : ''}`} />
              <span>1. 自动旋转视角</span>
            </div>

            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-600 shrink-0" />

            {/* Step 2: 自动平移 */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                step === 'panning' || step === 'scene_jump'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/40 font-medium'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Compass className={`w-3 h-3 ${step === 'panning' && isPlaying ? 'animate-pulse' : ''}`} />
              <span>2. 自动平移{step === 'scene_jump' ? '(跨场景)' : ''}</span>
            </div>

            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-600 shrink-0" />

            {/* Step 3: 到达设备停留展示 */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                step === 'dwelling'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 font-medium'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-500" />
              <span>3. 设备停留展示</span>
              {step === 'dwelling' && (
                <span className="font-mono text-[10px] ml-0.5 bg-emerald-500 text-white px-1 rounded-full">
                  {stayRemainingSec.toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Lower Row: Playback Controls, Speed Selector, Waypoint Selector */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 justify-between">
            {/* Status & Counter Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                  {currentWaypoint?.title || '自动漫游点位'}
                </span>
              </div>

              <span className="text-[11px] bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                {currentIndex + 1}/{waypoints.length}
              </span>
            </div>

            {/* Playback Controls (Prev, Play/Pause, Next) */}
            <div className="flex items-center gap-1">
              <button
                id="btn-roam-prev"
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="上一个点位"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                id="btn-roam-play-toggle"
                type="button"
                onClick={handleTogglePlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                }`}
                title={isPlaying ? '暂停漫游播放' : '继续自动漫游'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                )}
              </button>

              <button
                id="btn-roam-next"
                type="button"
                onClick={handleNext}
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="下一个点位"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Selector (0.5x, 1.0x, 1.5x, 2.0x) */}
            <div className="flex items-center gap-1 px-2 border-l border-r border-slate-200 dark:border-zinc-800">
              <Gauge className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                {[0.5, 1.0, 1.5, 2.0].map((sVal) => (
                  <button
                    key={sVal}
                    type="button"
                    onClick={() => handleSetSpeed(sVal)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                      speed === sVal
                        ? 'bg-sky-500 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                    title={`漫游速度: ${sVal}倍速`}
                  >
                    {sVal}x
                  </button>
                ))}
              </div>
            </div>

            {/* Waypoint Selectable Tabs */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xs scrollbar-none">
              {waypoints.map((wp, idx) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => {
                    clearAllTimers();
                    onStopTransition?.();
                    executeSequenceForWaypoint(idx);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                    currentIndex === idx
                      ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-300 dark:border-sky-400/40 font-medium'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                  title={wp.title}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span className="max-w-[70px] truncate">{wp.title || `点位 ${idx + 1}`}</span>
                </button>
              ))}
            </div>

            {/* Close Tour Button */}
            {onCloseTour && (
              <button
                type="button"
                onClick={onCloseTour}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs ml-auto sm:ml-0 transition-colors"
                title="退出漫游导览"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
