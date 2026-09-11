import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { formatTime, cn } from '../lib/utils';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FullPlayer from './FullPlayer';

export default function MiniPlayer() {
  const { currentEpisode, isPlaying, progress, duration, togglePlay, next, prev } = usePlayerStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentEpisode) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[env(safe-area-inset-bottom)] md:bottom-4 left-0 right-0 z-50 p-2 sm:p-4 mb-16 md:mb-0 cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="mx-auto max-w-screen-md bg-panel-blur backdrop-blur-xl rounded-2xl p-2 sm:p-3 shadow-2xl border border-border-color flex items-center gap-3 sm:gap-4 overflow-hidden relative">
              
              {/* Progress Bar Background */}
              <div className="absolute bottom-0 left-0 h-1 bg-border-color w-full rounded-b-2xl">
                <div 
                  className="h-full bg-primary rounded-r-full transition-all duration-300 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl overflow-hidden bg-surface">
                {currentEpisode.image && (
                  <img src={currentEpisode.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-fg truncate">
                  {currentEpisode.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted truncate">
                  {currentEpisode.podcastTitle || 'Podcast'}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 pr-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="text-muted hover:text-fg transition hidden sm:block"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="h-10 w-10 sm:h-12 sm:w-12 bg-fg text-bg rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="text-muted hover:text-fg transition hidden sm:block"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && <FullPlayer onClose={() => setIsExpanded(false)} />}
      </AnimatePresence>
    </>
  );
}
