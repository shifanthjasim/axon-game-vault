import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const collection = client.db('GameVault').collection('hardware');
    if (req.method === 'GET') {
      const data = await collection.find({}).toArray();
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const result = await collection.insertOne(req.body);
      return res.status(201).json(result);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}