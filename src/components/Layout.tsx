import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Settings } from 'lucide-react';
import MiniPlayer from './MiniPlayer';
import { cn } from '../lib/utils';
import { usePlayerStore } from '../store/playerStore';

export default function Layout() {
  const location = useLocation();
  const { currentEpisode } = usePlayerStore();

  const navItems = [
    { path: '/', icon: Home, label: 'Trang chủ' },
    { path: '/search', icon: Search, label: 'Tìm kiếm' },
    { path: '/library', icon: Library, label: 'Thư viện' },
    { path: '/settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="flex h-screen w-full bg-bg text-fg flex-col md:flex-row overflow-hidden relative">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-64 bg-bg border-r border-border-color flex-col p-6 z-10 shrink-0">
        <Link to="/" className="text-2xl font-bold mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-fg text-bg rounded-full flex items-center justify-center font-black">Y</div>
          YÊU THU PODCAST
        </Link>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                location.pathname === item.path ? "bg-surface-hover text-fg" : "text-muted hover:text-fg hover:bg-surface"
              )}
            >
              <item.icon className="w-6 h-6" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 overflow-y-auto pb-24 md:pb-6 relative",
        currentEpisode ? "pb-40 md:pb-32" : ""
      )}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-panel-blur backdrop-blur-lg border-t border-border-color flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] z-40">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              location.pathname === item.path ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <MiniPlayer />
    </div>
  );
}
