// db.js - Senior Engineer Cloud Implementation
const API_BASE = '/api';

export const db = {
  games: {
    toArray: async () => {
      const res = await fetch(`${API_BASE}/games`);
      if (!res.ok) throw new Error('Failed to fetch games');
      return await res.json();
    },
    add: async (game) => {
      const res = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      return await res.json();
    },
    // NEW: Update existing game in the cloud
    update: async (id, game) => {
      const res = await fetch(`${API_BASE}/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      if (!res.ok) throw new Error('Failed to update game');
      return await res.json();
    },
    // NEW: Delete game from the cloud
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/games/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete game');
      return true;
    }
  },
  hardware: {
    toArray: async () => {
      const res = await fetch(`${API_BASE}/hardware`);
      if (!res.ok) throw new Error('Failed to fetch hardware');
      return await res.json();
    },
    add: async (item) => {
      const res = await fetch(`${API_BASE}/hardware`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return await res.json();
    },
    // NEW: Update hardware in the cloud
    update: async (id, item) => {
      const res = await fetch(`${API_BASE}/hardware/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Failed to update hardware');
      return await res.json();
    },
    // NEW: Delete hardware from the cloud
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/hardware/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete hardware');
      return true;
    }
  }
};