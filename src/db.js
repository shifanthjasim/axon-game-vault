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
    }
  }
};