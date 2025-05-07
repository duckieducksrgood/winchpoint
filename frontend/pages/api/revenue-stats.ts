import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use your backend API URL here
    let backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';
    if (!backendUrl.endsWith('/')) backendUrl += '/';
    
    // Forward cookies for authentication if needed
    const cookie = req.headers.cookie || '';

    // Fetch orders from backend
    const { data: orders } = await axios.get(backendUrl + 'orders/', {
      headers: { cookie }
    });

    // Define different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Calculate revenue by period, using the same filtering logic as OrderPage component
    const result = {
      all: 0,
      today: 0,
      week: 0,
      month: 0,
      year: 0,
      orderCount: 0,
      pendingCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      todayOrderCount: 0
    };

    // Process orders 
    orders.forEach((order: any) => {
      // Count all orders
      result.orderCount++;
      
      // Count by status
      if (order.status === 'Pending') result.pendingCount++;
      else if (order.status === 'Completed') result.completedCount++;
      else if (order.status === 'Cancelled') result.cancelledCount++;
      
      // Check if today's order
      const orderDate = order.created_at ? new Date(order.created_at) : null;
      if (orderDate && orderDate >= today) {
        result.todayOrderCount++;
      }
      
      // Revenue calculations - IMPORTANT: only include orders with proof_of_payment
      if (order.status !== 'Cancelled' && order.proof_of_payment) {
        const orderAmount = parseFloat(order.total_price?.toString() || '0');
        
        // All time revenue
        result.all += orderAmount;
        
        // Only continue if we have a valid date
        if (orderDate) {
          // Today's revenue
          if (orderDate >= today) {
            result.today += orderAmount;
          }
          
          // Week revenue
          if (orderDate >= sevenDaysAgo) {
            result.week += orderAmount;
          }
          
          // Month revenue
          if (orderDate >= monthStart) {
            result.month += orderAmount;
          }
          
          // Year revenue
          if (orderDate >= yearStart) {
            result.year += orderAmount;
          }
        }
      }
    });

    // Format the numbers as currency
    Object.keys(result).forEach(key => {
      const typedKey = key as keyof typeof result;
      if (typeof result[typedKey] === 'number' && 
          ['all', 'today', 'week', 'month', 'year'].includes(key)) {
        result[typedKey] = parseFloat(result[typedKey].toFixed(2));
      }
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Revenue API error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
}