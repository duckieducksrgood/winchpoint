import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the product ID from the request query
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  try {
    // Use your backend API URL here
    let backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';
    if (!backendUrl.endsWith('/')) backendUrl += '/';
    
    // Forward cookies for authentication if needed
    const cookie = req.headers.cookie || '';
    
    // Fetch all products from backend
    const { data: products } = await axios.get(backendUrl + 'inventory/', {
      headers: { cookie }
    });
    
    // Find the specific product by ID
    const product = products.find((p: any) => p.productID.toString() === id.toString());
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Return the product details
    res.status(200).json(product);
  } catch (err) {
    console.error('Product details API error:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
}