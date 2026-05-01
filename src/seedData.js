import { db } from './db';

export const seedDatabase = async () => {
  const count = await db.games.count();
  if (count > 0) return; // Don't add duplicates if games already exist

  const initialGames = [
    { title: "Ghost of Tsushima", studio: "Sucker Punch", price: "7500", status: "Paid", date: "2026-04-01" },
    { title: "The Last of Us Part II", studio: "Naughty Dog", price: "6000", status: "Paid", date: "2026-03-15" },
    { title: "God of War", studio: "Santa Monica Studio", price: "4500", status: "Paid", date: "2026-02-10" },
    { title: "Spider-Man", studio: "Insomniac Games", price: "5000", status: "Paid", date: "2026-01-20" },
    { title: "Red Dead Redemption 2", studio: "Rockstar Games", price: "8500", status: "Paid", date: "2025-12-05" },
    { title: "Bloodborne", studio: "FromSoftware", price: "4000", status: "Paid", date: "2025-11-12" },
    { title: "Horizon Zero Dawn", studio: "Guerrilla Games", price: "3500", status: "Paid", date: "2025-10-30" },
    { title: "Uncharted 4: A Thief's End", studio: "Naughty Dog", price: "3000", status: "Paid", date: "2025-09-14" },
    { title: "Persona 5 Royal", studio: "Atlus", price: "9000", status: "Pending", date: "2026-04-28" },
    { title: "Final Fantasy VII Remake", studio: "Square Enix", price: "7000", status: "Paid", date: "2026-04-12" },
    { title: "The Witcher 3: Wild Hunt", studio: "CD Projekt Red", price: "4500", status: "Paid", date: "2026-01-05" },
    { title: "Elden Ring", studio: "FromSoftware", price: "12000", status: "Pending", date: "2026-04-29" },
    { title: "Grand Theft Auto V", studio: "Rockstar North", price: "5500", status: "Paid", date: "2026-02-22" },
    { title: "Detroit: Become Human", studio: "Quantic Dream", price: "3500", status: "Paid", date: "2026-03-01" },
    { title: "Ratchet & Clank", studio: "Insomniac Games", price: "2500", status: "Paid", date: "2025-08-15" }
    // ... You can manually add as many as you want here
  ];

  await db.games.bulkAdd(initialGames);
  console.log("Database Seeded Successfully!");
};