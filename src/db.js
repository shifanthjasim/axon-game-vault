// db.js - Optimized Cloud Implementation
const API_BASE = '/api';

export const db = {
  games: {
    toArray: async () => {
      const res = await fetch(`${API_BASE}/games`);
      return res.ok ? await res.json() : [];
    },
    add: async (game) => {
      const res = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      return await res.json();
    },
    update: async (id, game) => {
      // Fixed: Send ID as a query parameter to match your Vercel API
      const res = await fetch(`${API_BASE}/games?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      return await res.json();
    },
    delete: async (id) => {
      // Fixed: Match the handleDelete(item._id) call in App.jsx
      const res = await fetch(`${API_BASE}/games?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Cloud Delete Failed');
      return true;
    }
  },
  hardware: {
    toArray: async () => {
      const res = await fetch(`${API_BASE}/hardware`);
      return res.ok ? await res.json() : [];
    },
    add: async (item) => {
      const res = await fetch(`${API_BASE}/hardware`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return await res.json();
    },
    update: async (id, item) => {
      const res = await fetch(`${API_BASE}/hardware?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return await res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/hardware?id=${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  }
};