import Dexie from 'dexie';

export const db = new Dexie('GameVault');

// Version 4: Supports Games and Hardware (Consoles/Accessories)
db.version(4).stores({
  games: '++id, title, studio, price, delivery, status, date',
  hardware: '++id, name, studio, type, price, delivery, status, date'
});