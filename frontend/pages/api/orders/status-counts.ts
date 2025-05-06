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
    
    // Get counts of orders by status
    const query = `
      SELECT status, COUNT(*) as count 
      FROM ordersapp_order 
      GROUP BY status
    `;
    
    const results = db.prepare(query).all();
    db.close();
    
    res.status(200).json({ 
      statusCounts: results,
      pendingCount: results.find(r => r.status === 'pending')?.count || 0
    });
  } catch (error) {
    console.error('Error fetching order status counts:', error);
    res.status(500).json({ error: String(error) });
  }
}