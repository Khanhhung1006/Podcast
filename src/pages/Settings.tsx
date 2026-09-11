import React from 'react';
import { Moon, Sun, Monitor, Clock, Check } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { cn } from '../lib/utils';

interface SettingsProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export default function Settings({ theme, setTheme }: SettingsProps) {
  const { sleepTimer, setSleepTimer } = usePlayerStore();

  const themes = [
    { id: 'dark', name: 'Giao diện Tối', icon: Moon },
    { id: 'sand', name: 'Vàng Cát Trang Nhã', icon: Sun },
  ];

  const sleepOptions = [
    { label: 'Tắt', value: null },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
    { label: '120 phút', value: 120 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-10">Cài đặt</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Giao diện
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                theme === t.id 
                  ? "border-primary bg-surface-hover" 
                  : "border-transparent bg-surface hover:bg-surface-hover"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  theme === t.id ? "bg-primary text-bg" : "bg-bg text-fg"
                )}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-fg">{t.name}</span>
              </div>
              {theme === t.id && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Hẹn giờ ngủ (Tự động dừng phát)
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sleepOptions.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => setSleepTimer(opt.value)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all font-semibold",
                sleepTimer === opt.value 
                  ? "border-primary bg-primary text-bg" 
                  : "border-transparent bg-surface text-fg hover:bg-surface-hover"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {sleepTimer && (
          <p className="mt-4 text-sm text-primary font-medium">
            Ứng dụng sẽ tự động dừng sau {sleepTimer} phút nữa.
          </p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Thông tin ứng dụng</h2>
        <div className="bg-surface p-6 rounded-2xl">
          <p className="text-muted text-sm leading-relaxed mb-4">
            VN Podcast là một ứng dụng nghe Podcast đa nền tảng, mã nguồn mở, được thiết kế để mang lại trải nghiệm nhẹ nhàng và trực quan nhất.
          </p>
          <p className="text-muted text-sm mb-1">Phiên bản: 1.0.0</p>
          <p className="text-muted text-sm">Phát triển với React & Tailwind CSS.</p>
        </div>
      </section>
    </div>
  );
}
