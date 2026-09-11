import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { formatTime, cn } from '../lib/utils';
import { Play, Pause, SkipForward, SkipBack, X, RotateCcw, RotateCw, Settings2, Shuffle, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FullPlayer({ onClose }: { onClose: () => void }) {
  const { currentEpisode, isPlaying, progress, duration, togglePlay, next, prev, seek, setPlaybackRate, playbackRate } = usePlayerStore();
  const [showSettings, setShowSettings] = useState(false);

  if (!currentEpisode) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-bg text-fg flex flex-col"
    >
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${currentEpisode.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      {/* Header with iOS Safe Area Top Padding */}
      <header className="relative z-20 flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="p-3 bg-surface hover:bg-surface-hover active:bg-surface-hover rounded-full transition min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation z-30 cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">Đang phát từ</span>
          <span className="text-sm font-semibold truncate max-w-[200px]">{currentEpisode.podcastTitle}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} 
          className="p-3 bg-surface hover:bg-surface-hover active:bg-surface-hover rounded-full transition min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation z-30 cursor-pointer"
          aria-label="Cài đặt phát"
        >
          <Settings2 className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-lg mx-auto w-full">
        {/* Artwork */}
        <div className="w-full aspect-square bg-surface rounded-3xl shadow-2xl overflow-hidden mb-10 border border-border-color">
          {currentEpisode.image && <img src={currentEpisode.image} alt={currentEpisode.title} className="w-full h-full object-cover" />}
        </div>
        
        {/* Title */}
        <div className="w-full text-left mb-8">
          <h2 className="text-2xl font-bold truncate">{currentEpisode.title}</h2>
          <p className="text-lg text-muted truncate">{currentEpisode.podcastTitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-8">
          <div 
            className="w-full h-2 bg-surface-hover rounded-full mb-3 cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-primary rounded-full relative group-hover:brightness-110 transition-colors"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 shadow-md" />
            </div>
          </div>
          <div className="flex justify-between text-xs font-medium text-muted font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between mb-8">
          <button className="text-muted hover:text-fg transition">
            <Shuffle className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-6 md:gap-8">
            <button onClick={prev} className="text-fg hover:text-fg/70 transition">
              <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" />
            </button>
            <button onClick={togglePlay} className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-fg text-bg rounded-full hover:scale-105 active:scale-95 transition shadow-lg">
              {isPlaying ? <Pause className="w-10 h-10 md:w-12 md:h-12 fill-current" /> : <Play className="w-10 h-10 md:w-12 md:h-12 fill-current ml-2" />}
            </button>
            <button onClick={next} className="text-fg hover:text-fg/70 transition">
              <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
            </button>
          </div>
          
          <button className="text-muted hover:text-fg transition">
            <Repeat className="w-6 h-6" />
          </button>
        </div>

        {/* Skip 15/30 */}
        <div className="flex gap-8 text-fg/70">
          <button onClick={() => seek(progress - 15)} className="flex flex-col items-center gap-1 hover:text-fg transition">
            <RotateCcw className="w-6 h-6" />
            <span className="text-[10px] font-bold">15</span>
          </button>
          <button onClick={() => seek(progress + 30)} className="flex flex-col items-center gap-1 hover:text-fg transition">
            <RotateCw className="w-6 h-6" />
            <span className="text-[10px] font-bold">30</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 right-0 bg-panel rounded-t-3xl p-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] z-40 shadow-2xl border-t border-border-color"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Cài đặt phát</h3>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-3 bg-surface hover:bg-surface-hover rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted mb-3">Tốc độ phát</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {rates.map(rate => (
                  <button 
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-bold text-sm transition shrink-0",
                      playbackRate === rate ? "bg-primary text-white" : "bg-surface hover:bg-surface-hover"
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted mb-3">Hẹn giờ ngủ</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => usePlayerStore.getState().setSleepTimer(null)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-sm transition shrink-0",
                    usePlayerStore.getState().sleepTimer === null ? "bg-primary text-white" : "bg-surface hover:bg-surface-hover"
                  )}
                >
                  Tắt
                </button>
                {[15, 30, 45, 60, 120].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => usePlayerStore.getState().setSleepTimer(mins)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-bold text-sm transition shrink-0",
                      usePlayerStore.getState().sleepTimer === mins ? "bg-primary text-white" : "bg-surface hover:bg-surface-hover"
                    )}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
