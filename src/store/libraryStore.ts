import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedPodcast {
  id: string;
  title: string;
  author: string;
  image: string;
}

interface LibraryState {
  followedPodcasts: SavedPodcast[];
  followPodcast: (podcast: SavedPodcast) => void;
  unfollowPodcast: (id: string) => void;
  isFollowed: (id: string) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      followedPodcasts: [],
      followPodcast: (podcast) => set((state) => {
        if (state.followedPodcasts.some(p => p.id === podcast.id)) return state;
        return { followedPodcasts: [...state.followedPodcasts, podcast] };
      }),
      unfollowPodcast: (id) => set((state) => ({
        followedPodcasts: state.followedPodcasts.filter(p => p.id !== id)
      })),
      isFollowed: (id) => get().followedPodcasts.some(p => p.id === id),
    }),
    {
      name: 'library-storage',
    }
  )
);
