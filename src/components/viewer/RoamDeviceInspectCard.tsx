import React, { useState } from 'react';
import { WaypointDeviceData, RoamWaypoint, Hotspot } from '../../types';
import { 
  Activity, 
  Video as VideoIcon, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  ChevronRight, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Maximize2
} from 'lucide-react';

interface RoamDeviceInspectCardProps {
  waypoint: RoamWaypoint;
  deviceData?: WaypointDeviceData;
  hotspot?: Hotspot | null;
  stayRemainingSec: number;
  stayTotalSec: number;
  isPaused: boolean;
  onSkipStay: () => void;
  onOpenFullDetail?: () => void;
}

export const RoamDeviceInspectCard: React.FC<RoamDeviceInspectCardProps> = ({
  waypoint,
  deviceData,
  hotspot,
  stayRemainingSec,
  stayTotalSec,
  isPaused,
  onSkipStay,
  onOpenFullDetail
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(true);

  // Derive title, device name, metrics and video URL from either deviceData, waypoint, or associated hotspot
  const title = deviceData?.deviceName || waypoint.title || hotspot?.title || '智能化巡检设备';
  const deviceCode = deviceData?.deviceCode || (hotspot ? `DEV-${hotspot.id.slice(-4).toUpperCase()}` : 'IOT-AUTO-01');
  const status = deviceData?.status || 'normal';
  const videoUrl = deviceData?.videoUrl || hotspot?.content?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  
  const defaultMetrics = [
    { label: '运行负载', value: '46.8', unit: '%', status: 'normal' as const },
    { label: '工作温度', value: '37.4', unit: '°C', status: 'normal' as const },
    { label: '实时功耗', value: '2.14', unit: 'kW', status: 'normal' as const },
    { label: '通信时延', value: '1.8', unit: 'ms', status: 'normal' as const }
  ];

  const metrics = deviceData?.metrics && deviceData.metrics.length > 0
    ? deviceData.metrics
    : defaultMetrics;

  const progressPercent = stayTotalSec > 0
    ? Math.max(0, Math.min(100, ((stayTotalSec - stayRemainingSec) / stayTotalSec) * 100))
    : 100;

  return (
    <div
      id="roam-device-inspect-card"
      className="fixed top-20 right-4 sm:right-6 z-40 w-96 max-w-[calc(100vw-32px)] bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border border-sky-500/40 rounded-2xl shadow-2xl text-slate-900 dark:text-zinc-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto flex flex-col"
      style={{
        boxShadow: '0 20px 50px -10px rgba(14, 165, 233, 0.2), 0 0 20px -5px rgba(56, 189, 248, 0.15)'
      }}
    >
      {/* Top Banner: Stage badge + Dwell countdown bar */}
      <div className="bg-sky-500/10 border-b border-sky-500/20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-sky-500 animate-pulse" />
            设备热点驻留巡检
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
            {isPaused ? (
              <span className="text-amber-500 dark:text-amber-400 font-medium">已暂停</span>
            ) : (
              <span>停留 <strong className="text-sky-600 dark:text-sky-300 font-mono">{stayRemainingSec.toFixed(1)}s</strong></span>
            )}
          </span>
          <button
            type="button"
            onClick={onSkipStay}
            className="text-[11px] bg-sky-50 dark:bg-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-200 px-2 py-0.5 rounded-md border border-sky-300 dark:border-sky-400/30 transition-all flex items-center gap-0.5"
            title="跳过本次停留，立即前往下一站"
          >
            <span>跳过</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dwell Progress Line */}
      <div className="w-full bg-slate-200 dark:bg-zinc-800/80 h-1">
        <div 
          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Device Header Info */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-zinc-700">
                {deviceCode}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {status === 'normal' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>正常运行</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400">运行预警</span>
                  </>
                )}
              </span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1 leading-snug line-clamp-1">
              {title}
            </h4>
            {waypoint.caption && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {waypoint.caption}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Device Video / Monitoring Stream */}
      {videoUrl && showVideo && (
        <div className="relative bg-black aspect-video w-full overflow-hidden border-b border-slate-200 dark:border-zinc-800/80 group">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Overlay tags */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-0.5" />
            <span className="font-semibold text-red-400">LIVE</span>
            <span className="text-zinc-300">现场实况监控</span>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
              title={isMuted ? '开启声音' : '静音'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            </button>
          </div>

          <div className="absolute bottom-1 right-2 text-[10px] text-zinc-400 font-mono drop-shadow">
            1080P · 60FPS
          </div>
        </div>
      )}

      {/* Real-time Metrics Grid */}
      <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            实时传感器与运行数据
          </span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">采集周期: 100ms</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-sky-500/30 transition-colors shadow-xs dark:shadow-none"
            >
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{m.label}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">{m.unit}</span>
                )}
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer: Detail Link */}
      {onOpenFullDetail && (
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">已对准热点镜头中心</span>
          <button
            type="button"
            onClick={onOpenFullDetail}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 font-medium transition-colors"
          >
            <span>查看完整热点档案</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
