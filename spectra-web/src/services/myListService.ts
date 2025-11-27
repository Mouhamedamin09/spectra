import type { MediaItem } from '../types';

const MY_LIST_KEY = 'spectra_my_list';

export const myListService = {
  // Get all items from My List
  getAll: (): MediaItem[] => {
    try {
      const stored = localStorage.getItem(MY_LIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load My List:', error);
      return [];
    }
  },

  // Add item to My List
  add: (item: MediaItem): void => {
    try {
      const current = myListService.getAll();
      // Check if item already exists
      if (!current.find(i => i.id === item.id)) {
        current.push(item);
        localStorage.setItem(MY_LIST_KEY, JSON.stringify(current));
      }
    } catch (error) {
      console.error('Failed to add to My List:', error);
    }
  },

  // Remove item from My List
  remove: (itemId: string): void => {
    try {
      const current = myListService.getAll();
      const filtered = current.filter(i => i.id !== itemId);
      localStorage.setItem(MY_LIST_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from My List:', error);
    }
  },

  // Check if item is in My List
  isInList: (itemId: string): boolean => {
    const current = myListService.getAll();
    return current.some(i => i.id === itemId);
  },

  // Toggle item in My List
  toggle: (item: MediaItem): boolean => {
    if (myListService.isInList(item.id)) {
      myListService.remove(item.id);
      return false;
    } else {
      myListService.add(item);
      return true;
    }
  }
};
