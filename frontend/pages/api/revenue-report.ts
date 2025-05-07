import { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import axios from 'axios'; // Use plain axios for server-side

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use your backend API URL here (force http for local dev)
    let backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';
    if (!backendUrl.endsWith('/')) backendUrl += '/';
    // Forward cookies for authentication if needed
    const cookie = req.headers.cookie || '';

    // Fetch orders from backend
    const { data: orders } = await axios.get(backendUrl + 'orders/', {
      headers: { cookie },
      // If you use Bearer token, forward Authorization header instead
      // headers: { Authorization: req.headers.authorization || '' }
    });

    // Group by month and sum revenue
    const monthly: Record<string, { total: number; count: number }> = {};
    (orders || []).forEach((order: any) => {
      if (!order || order.status !== 'Completed') return;
      const date = new Date(order.created_at);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { total: 0, count: 0 };
      monthly[key].total += Number(order.total_price) || 0;
      monthly[key].count += 1;
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Revenue Report');
    sheet.addRow(['Month', 'Order Count', 'Total Revenue']);
    if (Object.keys(monthly).length === 0) {
      sheet.addRow(['No Data', 0, 0]);
    } else {
      Object.entries(monthly).forEach(([month, { count, total }]) => {
        sheet.addRow([month, count, total]);
      });
    }

    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue_report.xlsx"');
    res.status(200).end(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
}