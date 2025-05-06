import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import Database from 'better-sqlite3';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  try {
    const dbPath = path.resolve(process.cwd(), '..', 'backend', 'db.sqlite3');
    const db = new Database(dbPath);
    const result = db.prepare('SELECT COUNT(*) as count FROM userapp_user').get();
    db.close();
    
    res.status(200).json({ count: result.count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ message: 'Failed to fetch user count', error: String(error) });
  }
}