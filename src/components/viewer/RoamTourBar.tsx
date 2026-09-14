import React, { useEffect, useState, useRef } from 'react';
import { RoamTour, RoamWaypoint } from '../../types';
import { Play, Pause, SkipForward, SkipBack, Compass, MessageSquare, X } from 'lucide-react';

interface RoamTourBarProps {
  roamTour: RoamTour;
  onWaypointTrigger: (waypoint: RoamWaypoint) => void;
  onCloseTour?: () => void;
}

export const RoamTourBar: React.FC<RoamTourBarProps> = ({
  roamTour,
  onWaypointTrigger,
  onCloseTour
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCaption, setShowCaption] = useState(true);
  const timerRef = useRef<number | null>(null);

  const waypoints = roamTour.waypoints || [];
  const currentWaypoint = waypoints[currentIndex];

  const playWaypoint = (index: number) => {
    if (index < 0 || index >= waypoints.length) return;
    setCurrentIndex(index);
    const wp = waypoints[index];
    onWaypointTrigger(wp);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPlaying) {
      const transit = Number.isFinite(wp.transitDuration) ? wp.transitDuration : 2.5;
      const stay = Number.isFinite(wp.stayDuration) ? wp.stayDuration : 3.5;
      const totalTimeMs = (transit + stay) * 1000;
      timerRef.current = window.setTimeout(() => {
        if (index + 1 < waypoints.length) {
          playWaypoint(index + 1);
        } else if (roamTour.loop) {
          playWaypoint(0);
        } else {
          setIsPlaying(false);
        }
      }, totalTimeMs);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playWaypoint(currentIndex);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying]);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % waypoints.length;
    playWaypoint(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + waypoints.length) % waypoints.length;
    playWaypoint(prevIdx);
  };

  if (!waypoints || waypoints.length === 0) return null;

  return (
    <div
      id="roam-tour-player-container"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90%] sm:w-auto flex flex-col items-center gap-2 pointer-events-auto"
    >
      {/* Waypoint Narration Caption Banner */}
      {showCaption && currentWaypoint?.caption && (
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-xl px-4 py-2 text-zinc-100 text-xs shadow-2xl flex items-center gap-2 max-w-xl animate-in slide-in-from-bottom-2 duration-200">
          <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="leading-relaxed">{currentWaypoint.caption}</span>
          <button
            type="button"
            onClick={() => setShowCaption(false)}
            className="text-zinc-500 hover:text-zinc-300 ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tour Controller Bar */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-800">
          <Compass className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-zinc-200">漫游导览</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
            {currentIndex + 1} / {waypoints.length}
          </span>
        </div>

        {/* Play / Pause / Skip Controls */}
        <div className="flex items-center gap-1">
          <button
            id="btn-roam-prev"
            type="button"
            onClick={handlePrev}
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="上一个导览点"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            id="btn-roam-play-toggle"
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-all shadow-lg shadow-sky-500/20"
            title={isPlaying ? '暂停导览' : '开始自动漫游'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            id="btn-roam-next"
            type="button"
            onClick={handleNext}
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="下一个导览点"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Waypoint Pills */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 overflow-x-auto max-w-xs">
          {waypoints.map((wp, idx) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => playWaypoint(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                currentIndex === idx
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-400/50 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              {wp.title || `途经点 ${idx + 1}`}
            </button>
          ))}
        </div>

        {onCloseTour && (
          <button
            type="button"
            onClick={onCloseTour}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 text-xs ml-1"
            title="退出漫游导览"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
