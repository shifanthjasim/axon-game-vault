// db.js - Cloud Version for AXON SYSTEM
const API_BASE = '/api'; // This points to your Vercel Serverless Functions

export const db = {
  games: {
    // Fetches all 24 games from MongoDB Atlas
    toArray: async () => {
      const res = await fetch(`${API_BASE}/games`);
      return await res.json();
    },
    // Adds a new game to the cloud
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
    // Fetches your PS4 Slim and accessories from the cloud
    toArray: async () => {
      const res = await fetch(`${API_BASE}/hardware`);
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