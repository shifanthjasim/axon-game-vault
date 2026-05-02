import Dexie from 'dexie';

// Initialize the GameVault database
export const db = new Dexie('GameVaultDB');

// Define schema: '++id' allows the Edit/Delete logic to work perfectly
db.version(1).stores({
  games: '++id, title, studio, price, delivery, status',
  hardware: '++id, name, studio, price, delivery, status'
});