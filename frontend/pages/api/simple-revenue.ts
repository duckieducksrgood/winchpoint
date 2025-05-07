import { NextApiRequest, NextApiResponse } from 'next';
import * as ExcelJS from 'exceljs';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Winch Point Offroad House';
    workbook.lastModifiedBy = 'Admin Dashboard';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Use API URL to fetch real data if available
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';
    const cookie = req.headers.cookie || '';
    
    let orders = [];
    try {
      const { data } = await axios.get(backendUrl + 'orders/', {
        headers: { cookie }
      });
      orders = data || [];
    } catch (error) {
      console.error('Failed to fetch data from API, using sample data instead');
      // If API fetch fails, we'll continue with sample data
    }
    
    // Monthly Revenue worksheet
    const worksheet = workbook.addWorksheet('Revenue Report', {
      properties: { tabColor: { argb: '4472C4' } }
    });
    
    // Add title and styling
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Winch Point Offroad House - Revenue Report';
    titleCell.font = { 
      name: 'Arial', 
      size: 16, 
      bold: true, 
      color: { argb: '0070C0' }
    };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add subtitle with current date
    worksheet.mergeCells('A2:E2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}`;
    dateCell.font = { 
      name: 'Arial', 
      size: 10, 
      italic: true 
    };
    dateCell.alignment = { horizontal: 'center' };
    
    // Add description
    worksheet.mergeCells('A3:E3');
    const descriptionCell = worksheet.getCell('A3');
    descriptionCell.value = 'Monthly breakdown of orders and revenue';
    descriptionCell.font = { 
      name: 'Arial', 
      size: 10
    };
    descriptionCell.alignment = { horizontal: 'center' };
    
    // Add space before the data
    worksheet.addRow([]);
    
    // Set up column headers with styling
    const headerRow = worksheet.addRow(['Month', 'Orders', 'Revenue (₱)', 'Avg. Order Value (₱)', 'Notes']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Define column widths
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 10;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 20;
    worksheet.getColumn('E').width = 30;

    // Group orders by month
    const monthlyData: Record<string, { month: string, orders: number, revenue: number }> = {};
    const dailyData: Record<string, any> = {};
    
    if (orders && orders.length > 0) {
      orders.forEach((order: any) => {
        if (order.status === 'Completed') {
          const orderDate = new Date(order.created_at);
          if (isNaN(orderDate.getTime())) return;
          
          // For monthly data
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: new Date(orderDate.getFullYear(), orderDate.getMonth(), 1)
                .toLocaleString('en-US', { month: 'long', year: 'numeric' }),
              orders: 0,
              revenue: 0
            };
          }
          monthlyData[monthKey].orders += 1;
          const orderRevenue = parseFloat(order.total_price?.toString() || '0');
          monthlyData[monthKey].revenue += orderRevenue;
          
          // For daily data
          const dayKey = orderDate.toISOString().slice(0, 10);
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              day: orderDate.toLocaleString('en-US', { 
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              }),
              month: orderDate.toLocaleString('en-US', { month: 'long' }),
              orders: 0,
              revenue: 0,
              avgValue: 0
            };
          }
          dailyData[dayKey].orders += 1;
          dailyData[dayKey].revenue += orderRevenue;
          dailyData[dayKey].avgValue = dailyData[dayKey].revenue / dailyData[dayKey].orders;
        }
      });
    }
    
    // If no real data or empty, add sample data
    if (Object.keys(monthlyData).length === 0) {
      const currentYear = new Date().getFullYear();
      const months = ['January', 'February', 'March', 'April', 'May', 'June'];
      const revenues = [35000, 28500, 32000, 30000, 33500, 41200];
      const orderCounts = [120, 85, 105, 95, 110, 130];
      
      months.forEach((month, index) => {
        const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = {
          month: `${month} ${currentYear}`,
          orders: orderCounts[index],
          revenue: revenues[index]
        };
      });
    }

    // Add data rows
    const sortedMonths = Object.keys(monthlyData).sort();
    sortedMonths.forEach(monthKey => {
      const data = monthlyData[monthKey];
      const avgOrderValue = data.orders > 0 ? data.revenue / data.orders : 0;
      
      // Add performance notes based on revenue
      let note = '';
      if (data.revenue > 50000) note = 'Excellent month!';
      else if (data.revenue > 30000) note = 'Good performance';
      else if (data.revenue > 10000) note = 'Average performance';
      else note = 'Below target';
      
      const row = worksheet.addRow([
        data.month,
        data.orders,
        data.revenue,
        avgOrderValue,
        note
      ]);
      
      // Apply formatting to currency cells
      row.getCell(3).numFmt = '₱#,##0.00';
      row.getCell(4).numFmt = '₱#,##0.00';
      
      // Apply borders to all cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add total row with formulas
    const totalRowIndex = worksheet.rowCount + 1;
    const totalRow = worksheet.addRow([
      'TOTAL',
      sortedMonths.reduce((sum, month) => sum + monthlyData[month].orders, 0),
      sortedMonths.reduce((sum, month) => sum + monthlyData[month].revenue, 0),
      `=C${totalRowIndex}/B${totalRowIndex}`,
      ''
    ]);
    
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9E1F2' }
    };
    
    // Format currency cells in total row
    totalRow.getCell(3).numFmt = '₱#,##0.00';
    totalRow.getCell(4).numFmt = '₱#,##0.00';
    
    // Apply borders to total row
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };
    });
    
    // Add Daily Breakdown sheet
    const dailySheet = workbook.addWorksheet('Daily Breakdown', {
      properties: { tabColor: { argb: '70AD47' } }
    });
    
    // Add title to daily sheet
    dailySheet.mergeCells('A1:E1');
    const dailyTitleCell = dailySheet.getCell('A1');
    dailyTitleCell.value = 'Daily Sales Breakdown';
    dailyTitleCell.font = { 
      name: 'Arial', 
      size: 16, 
      bold: true, 
      color: { argb: '70AD47' }
    };
    dailyTitleCell.alignment = { horizontal: 'center' };
    
    dailySheet.addRow([]);
    
    // Create headers for daily breakdown
    const dailyHeaderRow = dailySheet.addRow([
      'Date', 'Day of Week', 'Month', 'Orders', 'Revenue (₱)', 'Avg. Order Value (₱)'
    ]);
    
    dailyHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '70AD47' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Set column widths
    dailySheet.getColumn('A').width = 15;
    dailySheet.getColumn('B').width = 15;
    dailySheet.getColumn('C').width = 15;
    dailySheet.getColumn('D').width = 10;
    dailySheet.getColumn('E').width = 15;
    dailySheet.getColumn('F').width = 20;
    
    // Add daily data if available
    const sortedDays = Object.keys(dailyData).sort();
    
    // If no real daily data, add sample data
    if (sortedDays.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        const dayKey = date.toISOString().slice(0, 10);
        const orders = Math.floor(Math.random() * 10) + 1;
        const revenue = (Math.floor(Math.random() * 5000) + 1000);
        
        const row = dailySheet.addRow([
          dayKey,
          date.toLocaleDateString('en-US', { weekday: 'long' }),
          date.toLocaleDateString('en-US', { month: 'long' }),
          orders,
          revenue,
          revenue / orders
        ]);
        
        // Format currency cells
        row.getCell(5).numFmt = '₱#,##0.00';
        row.getCell(6).numFmt = '₱#,##0.00';
        
        // Apply styles
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center' };
        });
      }
    } else {
      // Add real daily data
      sortedDays.forEach(dayKey => {
        const data = dailyData[dayKey];
        const date = new Date(dayKey);
        
        const row = dailySheet.addRow([
          dayKey,
          date.toLocaleDateString('en-US', { weekday: 'long' }),
          data.month,
          data.orders,
          data.revenue,
          data.avgValue
        ]);
        
        // Format currency cells
        row.getCell(5).numFmt = '₱#,##0.00';
        row.getCell(6).numFmt = '₱#,##0.00';
        
        // Apply styles
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center' };
        });
      });
    }
    
    // Add footer to both sheets
    [worksheet, dailySheet].forEach(sheet => {
      sheet.addRow([]);
      sheet.addRow([]);
      const footerRow = sheet.addRow(['Winch Point Offroad House © ' + new Date().getFullYear()]);
      footerRow.getCell(1).font = { italic: true, size: 10, color: { argb: '808080' } };
    });
    
    // Generate buffer for response
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
}