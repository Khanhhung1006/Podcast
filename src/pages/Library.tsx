import React from 'react';
import { Link } from 'react-router-dom';
import { useLibraryStore } from '../store/libraryStore';
import { Library as LibraryIcon } from 'lucide-react';

export default function Library() {
  const { followedPodcasts } = useLibraryStore();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-3xl font-bold mb-10 flex items-center gap-3">
        <LibraryIcon className="w-8 h-8 text-primary" />
        Thư viện của bạn
      </h1>

      {followedPodcasts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <LibraryIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-6">Bạn chưa theo dõi kênh podcast nào.</p>
          <Link to="/search" className="inline-block bg-primary text-white font-semibold px-8 py-3 rounded-full transition hover:scale-105 active:scale-95 shadow-lg">
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {followedPodcasts.map((podcast) => (
            <Link to={`/podcast/${podcast.id}`} key={podcast.id} className="group bg-surface hover:bg-surface-hover p-4 rounded-xl transition-all duration-300">
              <div className="aspect-square rounded-lg bg-surface mb-4 overflow-hidden shadow-lg group-hover:shadow-2xl transition border border-border-color">
                {podcast.image && <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <h3 className="font-semibold text-sm md:text-base text-fg truncate">{podcast.title}</h3>
              <p className="text-xs text-muted truncate mt-1">{podcast.author}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
