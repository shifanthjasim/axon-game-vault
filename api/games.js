import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const database = client.db('GameVault');
    const games = database.collection('games');

    if (req.method === 'GET') {
      const allGames = await games.find({}).toArray();
      return res.status(200).json(allGames);
    }

    if (req.method === 'POST') {
      const newGame = req.body;
      const result = await games.insertOne(newGame);
      return res.status(201).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}