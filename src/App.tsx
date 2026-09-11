/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import PodcastDetail from './pages/PodcastDetail';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Library from './pages/Library';
import { Howler } from 'howler';
import { usePlayerStore } from './store/playerStore';

export default function App() {
  const { sleepTimer, setSleepTimer, pause } = usePlayerStore();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'sand');

  // Apply Theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'sand') {
      document.documentElement.setAttribute('data-theme', 'sand');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Sleep Timer logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (sleepTimer !== null) {
      timeout = setTimeout(() => {
        pause();
        setSleepTimer(null);
      }, sleepTimer * 60 * 1000);
    }
    return () => clearTimeout(timeout);
  }, [sleepTimer, pause, setSleepTimer]);

  // PWA Setup for Audio
  useEffect(() => {
    // Unlock Audio Context on first interaction
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="podcast/:id" element={<PodcastDetail />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings theme={theme} setTheme={setTheme} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
