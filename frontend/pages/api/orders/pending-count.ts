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
    
    // Try multiple variations of the status field to handle case sensitivity
    // and different possible column names
    let result;
    
    try {
      // Try with capital P in "Pending"
      result = db.prepare("SELECT COUNT(*) as count FROM ordersapp_order WHERE status = 'Pending'").get();
    } catch (e) {
      console.log("First query failed:", e);
      try {
        // Try alternate column name
        result = db.prepare("SELECT COUNT(*) as count FROM ordersapp_order WHERE order_status = 'Pending'").get();
      } catch (e) {
        console.log("Second query failed:", e);
        try {
          // Try lowercase pending
          result = db.prepare("SELECT COUNT(*) as count FROM ordersapp_order WHERE status = 'pending'").get();
        } catch (e) {
          console.log("Third query failed:", e);
          // Last resort - get all records and count in JS
          const orders = db.prepare("SELECT status FROM ordersapp_order").all();
          console.log("All orders status values:", orders.map(o => o.status));
          
          // Count pending orders manually (case insensitive)
          const pendingCount = orders.filter(o => 
            o.status && o.status.toLowerCase() === 'pending'
          ).length;
          
          result = { count: pendingCount };
        }
      }
    }
    
    db.close();
    
    console.log("Final result:", result);
    res.status(200).json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    res.status(200).json({ count: 0, error: String(error) });
  }
}