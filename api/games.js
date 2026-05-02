import { MongoClient, ObjectId } from 'mongodb';

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
      const result = await games.insertOne(req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      // Use the ObjectId imported at the top
      await games.updateOne(
        { _id: new ObjectId(id) }, 
        { $set: req.body }
      );
      return res.status(200).json({ message: 'Updated' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await games.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Deleted' });
    }

  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message });
  }
}