"use client";

import { useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface QualityLevel {
  height: number;
  index: number;
}

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  qualityLevels: QualityLevel[];
  currentQuality: number;
  showControls: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onQualityChange: (levelIndex: number) => void;
  onToggleFullscreen: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  qualityLevels,
  currentQuality,
  showControls,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onQualityChange,
  onToggleFullscreen,
}: VideoControlsProps) {
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"speed" | "quality" | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  function handleSeekBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(percent * duration);
  }

  function handleSettingsClick() {
    if (showSettings) {
      setShowSettings(false);
      setSettingsTab(null);
    } else {
      setShowSettings(true);
      setSettingsTab(null);
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-12 transition-opacity duration-300",
        showControls ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Seek bar */}
      <div
        ref={seekBarRef}
        className="group/seek relative mb-2 h-1 cursor-pointer rounded-full bg-white/30 transition-all hover:h-1.5"
        onClick={handleSeekBarClick}
      >
        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Progress */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover/seek:opacity-100"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-white/80"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        {/* Volume */}
        <div className="group/vol flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-white/80"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-white group-hover/vol:block [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            aria-label="Volume"
          />
        </div>

        {/* Time */}
        <span className="select-none text-xs text-white/90">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings menu (speed + quality) */}
        <div className="relative">
          <button
            type="button"
            onClick={handleSettingsClick}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-white/80"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {showSettings && (
            <div className="absolute bottom-full right-0 mb-2 w-48 overflow-hidden rounded-lg bg-black/90 py-1 text-sm text-white shadow-lg backdrop-blur">
              {settingsTab === null && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2 hover:bg-white/10"
                    onClick={() => setSettingsTab("speed")}
                  >
                    <span>Speed</span>
                    <span className="text-white/60">{playbackRate}x</span>
                  </button>
                  {qualityLevels.length > 0 && (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2 hover:bg-white/10"
                      onClick={() => setSettingsTab("quality")}
                    >
                      <span>Quality</span>
                      <span className="text-white/60">
                        {currentQuality === -1
                          ? "Auto"
                          : `${qualityLevels.find((l) => l.index === currentQuality)?.height ?? ""}p`}
                      </span>
                    </button>
                  )}
                </>
              )}

              {settingsTab === "speed" && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-white/60 hover:bg-white/10"
                    onClick={() => setSettingsTab(null)}
                  >
                    ← Speed
                  </button>
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={cn(
                        "flex w-full items-center px-4 py-2 hover:bg-white/10",
                        playbackRate === rate && "font-medium text-blue-400",
                      )}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSettings(false);
                        setSettingsTab(null);
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </>
              )}

              {settingsTab === "quality" && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-white/60 hover:bg-white/10"
                    onClick={() => setSettingsTab(null)}
                  >
                    ← Quality
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center px-4 py-2 hover:bg-white/10",
                      currentQuality === -1 && "font-medium text-blue-400",
                    )}
                    onClick={() => {
                      onQualityChange(-1);
                      setShowSettings(false);
                      setSettingsTab(null);
                    }}
                  >
                    Auto
                  </button>
                  {qualityLevels.map((level) => (
                    <button
                      key={level.index}
                      type="button"
                      className={cn(
                        "flex w-full items-center px-4 py-2 hover:bg-white/10",
                        currentQuality === level.index && "font-medium text-blue-400",
                      )}
                      onClick={() => {
                        onQualityChange(level.index);
                        setShowSettings(false);
                        setSettingsTab(null);
                      }}
                    >
                      {level.height}p
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-white/80"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
