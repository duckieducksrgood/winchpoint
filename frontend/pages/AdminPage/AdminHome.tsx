import { 
  AppShell,
  Text,
  Title,
  Card,
  Group,
  Stack,
  Loader,
  Container,
  SimpleGrid,
  useMantineTheme,
  rem,
  Paper,
  RingProgress,
  Badge,
  Box,
  Progress,
  ThemeIcon,
  Modal,
  Button,
  Select,
  Divider,
  ActionIcon,
  Tooltip
} from "@mantine/core";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/router';
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import { 
  IconUsers, 
  IconPackage, 
  IconShoppingCart, 
  IconTrendingUp,
  IconChartBar,
  IconDashboard,
  IconClipboard,
  IconCurrencyPeso,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import withRoleProtection, { useUserStore } from "../../utils/auth";
import classes from "./styles/AdminHome.module.css";
import AdminFooter from "../../components/AdminComponents/AdminFooter";
import ExcelJS from 'exceljs';

interface AnimatedCounterProps {
  value: number | undefined;
  formatter?: (val: number) => string | number;}
const AnimatedCounter = ({ value, formatter = (val: number) => val }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (value === undefined) return;
    
    const duration = 1200;
    const startTime = Date.now();
    const startValue = count;
    const endValue = value;
    
    const animation = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };
    
    requestAnimationFrame(animation);
  }, [value, count]);
  
  return <>{formatter(count)}</>;
};

// Define interfaces for data
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  date_joined?: string;
  delivery_address?: string;
}

interface Product {
  productID: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  subCategory?: string;
}

interface Order {
  id: number;
  user: number | User;
  customer?: string | number;
  status: string;
  created_at: string;
  updated_at: string;
  total_price: number;
  items?: any[];
}

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function RevenueReportModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [reportType, setReportType] = useState<string | null>("pdf");
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<string | null>(new Date().getFullYear().toString());
  
  const years = Array.from({ length: 5 }, (_, i) => {
    const yearValue = new Date().getFullYear() - i;
    return { value: yearValue.toString(), label: yearValue.toString() };
  });

  const handleDownload = async () => {
    if (!reportType || !year) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/orders/reports/revenue/?type=${reportType}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${document.cookie.split('jwt_access_token=')[1]?.split(';')[0]}`
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const extension = reportType === 'pdf' ? 'pdf' : 'xlsx';
      link.href = url;
      link.setAttribute('download', `revenue_report_${year}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifications.show({
        title: "Download Successful",
        message: `Revenue report (${reportType.toUpperCase()}) downloaded successfully.`,
        color: "green",
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: "Download Failed",
        message: "An error occurred while downloading the report.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="lg">Download Revenue Report</Text>}
      centered
      size="md"
    >
      <Stack>
        <Select
          label="Report Format"
          placeholder="Choose report format"
          data={[
            { value: "pdf", label: "PDF Document" },
            { value: "excel", label: "Excel Spreadsheet" },
          ]}
          value={reportType}
          onChange={setReportType}
          required
        />
        <Select
          label="Select Year"
          placeholder="Choose year for report"
          data={years}
          value={year}
          onChange={setYear}
          required
        />
        <Text size="sm" c="dimmed" mt={4}>
          The report will include monthly revenue data, order counts, and top selling products for the selected year.
        </Text>
        <Divider my={8} />
        <Group justify="space-between" mt={8}>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            loading={loading}
            disabled={!reportType || !year}
            color="green"
          >
            Download Report
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function AdminHomePage() {
  const router = useRouter();
  const [openedNav, setOpenedNav] = useState(false);
  const theme = useMantineTheme();
  const { user } = useUserStore();
  const [reportModalOpened, { open: openReportModal, close: closeReportModal }] = useDisclosure(false);

  // Fetch data from APIs using SWR
const { data: users = [] } = useSWR<User[]>("users/", fetcher);
const { data: products = [] } = useSWR<Product[]>("inventory/", fetcher);
const { data: orders = [] } = useSWR<Order[]>("orders/", fetcher);
  
  // Calculate key metrics
  const userCount = users.length;
  const productCount = products.length;
  
  // Order metrics
  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === "Pending");
  }, [orders]);
  
  const completedOrders = useMemo(() => {
    return orders.filter(order => order.status === "Completed");
  }, [orders]);
  
  // Calculate revenue (from completed orders with payment proof)
  const totalRevenue = useMemo(() => {
    return orders
      .filter(order => 
        // Only count orders that are:
        // 1. Completed status
        order.status === "Completed" &&
        // 2. Have a proof of payment (indicating they've actually paid)
        (order.items?.some(item => item.product?.price) || 
         typeof order.total_price === 'number' || 
         parseFloat(String(order.total_price)) > 0)
      )
      .reduce((sum, order) => {
        const price = typeof order.total_price === 'number' 
          ? order.total_price 
          : parseFloat(String(order.total_price)) || 0;
        return sum + price;
      }, 0);
  }, [orders]);
  
  // Calculate revenue target achievement (assuming a monthly target of ₱20,000)
  const revenueTarget = 350000;
  const revenuePercentage = Math.min(Math.round((totalRevenue / revenueTarget) * 100), 100);
  
  // Calculate percentages for progress bars
  const userPercentage = Math.min(Math.round((userCount / 100) * 100), 100);
  const productPercentage = Math.min(Math.round((productCount / 200) * 100), 100);
  const orderPercentage = orders.length > 0 
    ? Math.round((completedOrders.length / orders.length) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const navigateToUsers = () => {
    router.push('/AdminPage/UserManagementPage');
  };
  
  const navigateToOrders = () => {
    router.push('/AdminPage/OrderPage');
  };

  const navigateToInventory = () => {
    router.push('/AdminPage/InventoryPage');
  };

  // Function to generate and download Excel report directly in the browser
  const generateRevenueExcel = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'Winch Point Offroad House';
      workbook.lastModifiedBy = 'Admin Dashboard';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Add Monthly Overview worksheet
      const monthlySheet = workbook.addWorksheet('Monthly Revenue', {
        properties: { tabColor: { argb: '4472C4' } }
      });
      
      // Add title to the sheet
      monthlySheet.mergeCells('A1:E1');
      const titleCell = monthlySheet.getCell('A1');
      titleCell.value = 'Winch Point Offroad House - Revenue Report';
      titleCell.font = { 
        name: 'Arial', 
        size: 16, 
        bold: true, 
        color: { argb: '0070C0' }
      };
      titleCell.alignment = { horizontal: 'center' };
      
      // Add subtitle with current date
      monthlySheet.mergeCells('A2:E2');
      const dateCell = monthlySheet.getCell('A2');
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
      monthlySheet.mergeCells('A3:E3');
      const descriptionCell = monthlySheet.getCell('A3');
      descriptionCell.value = 'Monthly breakdown of orders and revenue';
      descriptionCell.font = { 
        name: 'Arial', 
        size: 10
      };
      descriptionCell.alignment = { horizontal: 'center' };
      
      // Add space before the data
      monthlySheet.addRow([]);
      
      // Set up column headers with styling
      const headerRow = monthlySheet.addRow(['Month', 'Orders', 'Revenue (₱)', 'Avg. Order Value (₱)', 'Notes']);
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
      monthlySheet.getColumn('A').width = 20;
      monthlySheet.getColumn('B').width = 10;
      monthlySheet.getColumn('C').width = 15;
      monthlySheet.getColumn('D').width = 20;
      monthlySheet.getColumn('E').width = 30;
      
      // Define interfaces for report data
      interface MonthlyReportData {
        month: string;
        orders: number;
        revenue: number;
        items: number;
      }
      
      interface DailyReportData {
        day: string;
        month: string;
        orders: number;
        revenue: number;
        avgValue: number;
      }
      
      // Group orders by month
      const monthlyData: Record<string, {
        month: string;
        orders: number;
        revenue: number;
        items: number;
      }> = {};
      
      const dailyData: Record<string, {
        day: string;
        month: string;
        orders: number;
        revenue: number;
        avgValue: number;
      }> = {};
      const currentYear = new Date().getFullYear();
      
      // Process orders and group by month and day
      orders.forEach(order => {
        if (order.status === 'Completed') {
          const orderDate = new Date(order.created_at);
          // Skip if not valid date
          if (isNaN(orderDate.getTime())) return;
          
          // Group by month
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: new Date(orderDate.getFullYear(), orderDate.getMonth(), 1)
                .toLocaleString('en-US', { month: 'long', year: 'numeric' }),
              orders: 0,
              revenue: 0,
              items: 0
            };
          }
          
          monthlyData[monthKey].orders += 1;
          const orderRevenue = parseFloat(order.total_price?.toString() || '0');
          monthlyData[monthKey].revenue += orderRevenue;
          
          // Group by day for daily breakdown
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

      // Add monthly data rows
      const sortedMonths = Object.keys(monthlyData).sort();
      
      // If no completed orders, add sample data
      if (sortedMonths.length === 0) {
        for (let i = 0; i < 6; i++) {
          const date = new Date(currentYear, i, 1);
          monthlySheet.addRow([
            date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            0,
            0,
            0,
            'No orders in this period'
          ]);
        }
      } else {
        sortedMonths.forEach(monthKey => {
          const data = monthlyData[monthKey];
          const avgOrderValue = data.orders > 0 ? data.revenue / data.orders : 0;
          
          // Add performance notes based on revenue
          let note = '';
          if (data.revenue > 50000) note = 'Excellent month!';
          else if (data.revenue > 30000) note = 'Good performance';
          else if (data.revenue > 10000) note = 'Average performance';
          else note = 'Below target';
          
          const row = monthlySheet.addRow([
            data.month,
            data.orders,
            data.revenue,
            avgOrderValue,
            note
          ]);
          
          // Apply formatting to numeric cells
          row.getCell(3).numFmt = '₱#,##0.00';
          row.getCell(4).numFmt = '₱#,##0.00';
          
          // Apply borders to all cells in the row
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
      }

      // Add total row with formulas and formatting
      const totalRowIndex = monthlySheet.rowCount + 1;
      const totalRow = monthlySheet.addRow([
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
      
      // Format total revenue and average cell
      totalRow.getCell(3).numFmt = '₱#,##0.00';
      totalRow.getCell(4).numFmt = '₱#,##0.00';
      
      // Apply borders to the total row
      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'double' },
          right: { style: 'thin' }
        };
      });
      
      // Add summary statistics section
      monthlySheet.addRow([]);
      monthlySheet.addRow([]);
      
      const summaryTitleRow = monthlySheet.addRow(['Revenue Summary Statistics']);
      summaryTitleRow.getCell(1).font = { bold: true, size: 12 };
      summaryTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      summaryTitleRow.getCell(1).font.color = { argb: 'FFFFFF' };
      
      monthlySheet.addRow(['Highest Monthly Revenue', `₱${Math.max(...sortedMonths.map(month => monthlyData[month].revenue)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
      monthlySheet.addRow(['Lowest Monthly Revenue', `₱${Math.min(...sortedMonths.map(month => monthlyData[month].revenue)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
      monthlySheet.addRow(['Average Monthly Revenue', `₱${(sortedMonths.reduce((sum, month) => sum + monthlyData[month].revenue, 0) / (sortedMonths.length || 1)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
      
      // Add visualization note instead of chart
      monthlySheet.addRow([]);
      const chartNoteRow = monthlySheet.addRow(['Note: Monthly revenue visualization is available in the admin dashboard.']);
      chartNoteRow.getCell(1).font = { italic: true, size: 10, color: { argb: '808080' } };
      
      // Add Daily Breakdown sheet
      const dailyBreakdownSheet = workbook.addWorksheet('Daily Breakdown', {
        properties: { tabColor: { argb: '70AD47' } } 
      });
      
      // Add title to the daily sheet
      dailyBreakdownSheet.mergeCells('A1:E1');
      const dailyTitleCell = dailyBreakdownSheet.getCell('A1');
      dailyTitleCell.value = 'Daily Order Breakdown';
      dailyTitleCell.font = { 
        name: 'Arial', 
        size: 16, 
        bold: true, 
        color: { argb: '70AD47' }
      };
      dailyTitleCell.alignment = { horizontal: 'center' };
      
      dailyBreakdownSheet.addRow([]);
      
      // Set up column headers for daily breakdown
      const dailyHeaderRow = dailyBreakdownSheet.addRow(['Date', 'Weekday', 'Month', 'Orders', 'Revenue (₱)', 'Avg. Order Value (₱)']);
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
      
      // Define column widths
      dailyBreakdownSheet.getColumn('A').width = 15;
      dailyBreakdownSheet.getColumn('B').width = 15;
      dailyBreakdownSheet.getColumn('C').width = 15;
      dailyBreakdownSheet.getColumn('D').width = 10;
      dailyBreakdownSheet.getColumn('E').width = 15;
      dailyBreakdownSheet.getColumn('F').width = 20;
      
      // Sort days chronologically
      const sortedDays = Object.keys(dailyData).sort();
      
      // If no data, add a message
      if (sortedDays.length === 0) {
        const noDataRow = dailyBreakdownSheet.addRow(['No daily sales data available', '', '', '', '', '']);
        noDataRow.getCell(1).font = { italic: true };
      } else {
        // Add each day's data
        sortedDays.forEach(day => {
          const data = dailyData[day];
          const date = new Date(day);
          
          const row = dailyBreakdownSheet.addRow([
            day, // ISO date format (YYYY-MM-DD)
            date.toLocaleDateString('en-US', { weekday: 'long' }),
            data.month,
            data.orders,
            data.revenue,
            data.avgValue
          ]);
          
          // Format currency cells
          row.getCell(5).numFmt = '₱#,##0.00';
          row.getCell(6).numFmt = '₱#,##0.00';
          
          // Apply borders to all cells in the row
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Align text in cells
            cell.alignment = { horizontal: 'center' };
          });
        });
      }
      
      // Add page footer with company info to both sheets
      [monthlySheet, dailyBreakdownSheet].forEach(sheet => {
        sheet.addRow([]);
        sheet.addRow([]);
        const footerRow = sheet.addRow(['Winch Point Offroad House © ' + new Date().getFullYear()]);
        footerRow.getCell(1).font = { italic: true, size: 10, color: { argb: '808080' } };
      });
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Winch_Point_Revenue_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success notification
      notifications.show({
        title: "Download Successful",
        message: "Enhanced revenue report downloaded successfully",
        color: "green"
      });
      
    } catch (error) {
      console.error("Error generating Excel:", error);
      notifications.show({
        title: "Download Failed",
        message: "Failed to generate revenue report. Please try again.",
        color: "red"
      });
    }
  };

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !openedNav },
      }}
    >
      <AppShell.Header>
        <HeaderMegaMenu openedNav={openedNav} setOpenedNav={setOpenedNav} />
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <HeaderNav openedNav={openedNav} setOpenedNav={setOpenedNav} />
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>
        <Container size="xl" pt={80} pb={30} className={classes.container}>
          <Paper 
            radius="md" 
            p="xl" 
            mb="xl"
            className={classes.welcomeCard}
            withBorder
          >
            <Group justify="space-between" align="center">
              <div>
                <Text size="lg" c="dimmed" mb={5} className={classes.fadeIn}>
                  {getGreeting()},
                </Text>
                <Title order={2} fw={700} className={classes.fadeIn}>
                  {user?.first_name || "Admin"}
                </Title>
                <Text mt="xs" c="dimmed" className={classes.fadeInSecond}>
                  Welcome to your dashboard. Here's what's happening with your store today.
                </Text>
              </div>
              <ThemeIcon 
                size={80} 
                radius="md" 
                className={classes.dashboardIcon}
              >
                <IconDashboard size={40} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Title order={3} mb="lg" className={classes.sectionTitle}>Overview</Title>
          
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <Card 
              withBorder 
              radius="md" 
              p="xl" 
              className={`${classes.statCard} ${classes.fadeIn}`}
              onClick={navigateToUsers}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" className={classes.cardHeader}>
                <ThemeIcon size={40} radius="md" color="teal" variant="light">
                  <IconUsers size={24} />
                </ThemeIcon>
                <Badge size="lg" radius="sm" variant="light" color="teal">USERS</Badge>
              </Group>
              
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                <AnimatedCounter value={userCount} />
              </Text>
              <Text c="dimmed" size="xs" mt={5} mb="md">Total registered users</Text>
              <Progress 
                value={userPercentage} 
                color="teal" 
                size="sm" 
                radius="xl"
                animated 
                className={classes.progressBar}
              />
              <Group justify="space-between" mt={5}>
                <Text size="xs" c="dimmed">Progress</Text>
                <Text size="xs" fw={500}>{userPercentage}%</Text>
              </Group>
              <Text size="xs" ta="right" mt="md" c="dimmed" style={{ fontStyle: 'italic' }}>
                Click to manage users
              </Text>
            </Card>
            <Card 
              withBorder 
              radius="md" 
              p="xl" 
              className={`${classes.statCard} ${classes.fadeInSecond}`}
              onClick={navigateToInventory}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" className={classes.cardHeader}>
                <ThemeIcon size={40} radius="md" color="blue" variant="light">
                  <IconPackage size={24} />
                </ThemeIcon>
                <Badge size="lg" radius="sm" variant="light" color="blue">PRODUCTS</Badge>
              </Group>
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                <AnimatedCounter value={productCount} />
              </Text>
              <Text c="dimmed" size="xs" mt={5} mb="md">Products in inventory</Text>
              <Progress 
                value={productPercentage} 
                color="blue" 
                size="sm" 
                radius="xl" 
                animated
                className={classes.progressBar}
              />
              <Group justify="space-between" mt={5}>
                <Text size="xs" c="dimmed">Capacity</Text>
                <Text size="xs" fw={500}>{productPercentage}%</Text>
              </Group>
              
              <Text size="xs" ta="right" mt="md" c="dimmed" style={{ fontStyle: 'italic' }}>
                Click to manage inventory
              </Text>
            </Card>
            <Card 
              withBorder 
              radius="md" 
              p="xl" 
              className={`${classes.statCard} ${classes.fadeInThird}`} 
              onClick={navigateToOrders}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between" className={classes.cardHeader}>
                <ThemeIcon size={40} radius="md" color="violet" variant="light">
                  <IconClipboard size={24} />
                </ThemeIcon>
                <Badge size="lg" radius="sm" variant="light" color="violet">ORDERS</Badge>
              </Group>
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                <AnimatedCounter value={pendingOrders.length} />
              </Text>
              <Text c="dimmed" size="xs" mt={5} mb="md">Pending orders</Text>
              <Progress 
                value={orderPercentage} 
                color="violet" 
                size="sm" 
                radius="xl" 
                animated
                className={classes.progressBar}
              />
              <Group justify="space-between" mt={5}>
                <Text size="xs" c="dimmed">Completion</Text>
                <Text size="xs" fw={500}>{orderPercentage}%</Text>
              </Group> 
              <Text size="xs" ta="right" mt="md" c="dimmed" style={{ fontStyle: 'italic' }}>
                Click to manage orders
              </Text>
            </Card>          
            <Card withBorder radius="md" p="xl" className={`${classes.statCard} ${classes.fadeInFourth}`}>
              <Group justify="space-between" className={classes.cardHeader}>
                <ThemeIcon size={40} radius="md" color="green" variant="light">
                  <IconCurrencyPeso size={24} />
                </ThemeIcon>
                <Badge size="lg" radius="sm" variant="light" color="green">REVENUE</Badge>
              </Group>
              
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                ₱<AnimatedCounter 
                  value={totalRevenue} 
                  formatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
              </Text>
              <Text c="dimmed" size="xs" mt={5} mb="md">Total revenue</Text>
              <Group justify="space-between" align="center">
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: revenuePercentage, color: theme.colors.green[6] }]}
                  label={
                    <Text ta="center" size="sm" fw={700}>
                      {revenuePercentage}%
                    </Text>
                  }
                />
                <Box>
                  <Text size="xs" fw={500} mb={5}>Target</Text>
                  <Text size="sm" c="dimmed">₱{revenueTarget.toLocaleString()} Goal</Text>
                </Box>
              </Group>
              <Button
                mt={16}
                color="green"
                fullWidth
                onClick={generateRevenueExcel}
              >
                Download Revenue Excel
              </Button>
            </Card>
          </SimpleGrid>
          {/* Order Statistics Card */}
          <Title order={3} mt={40} mb="lg" className={classes.sectionTitle}>Order Statistics</Title>
          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
            <Card withBorder radius="md" p="xl" className={`${classes.statCard} ${classes.fadeIn}`}>
                <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">Recent Orders</Text>
                <ThemeIcon size={30} radius="md" color="yellow" variant="light">
                  <IconShoppingCart size={18} />
                </ThemeIcon>
              </Group>
              
              <Text fw={700} size="28px" className={classes.counterValue}>
                <AnimatedCounter value={orders.filter(order => {
                  const orderDate = new Date(order.created_at || "");
                  const today = new Date();
                  return orderDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
                }).length} />
              </Text>
              <Text c="dimmed" size="xs">Orders today</Text>      
              <Box mt="md">
                <Group justify="space-between" mb={5}>
                  <Text size="xs">Order completion rate</Text>
                  <Text size="xs" fw={500}>{orderPercentage}%</Text>
                </Group>
                <Progress
                  size="sm"
                  radius="xl" value={0}                
                >
                  <Progress.Section value={orderPercentage} color="green" />
                  <Progress.Section value={100 - orderPercentage} color="yellow" />
                </Progress>
                <Group justify="space-between" mt={5}>
                  <Text size="xs" c="green">Completed: {completedOrders.length}</Text>
                  <Text size="xs" c="yellow">Pending: {pendingOrders.length}</Text>
                </Group>
              </Box>
            </Card>
            
            <Card withBorder radius="md" p="xl" className={`${classes.statCard} ${classes.fadeInSecond}`}>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">Sales Overview</Text>
                <ThemeIcon size={30} radius="md" color="cyan" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              
              <Text fw={700} size="28px" className={classes.counterValue}>
                <AnimatedCounter value={completedOrders.length} />
              </Text>
              <Text c="dimmed" size="xs">Total sales</Text>
              
             <Box mt="md">
                <Group justify="space-between" mb={5}>
                  <Text size="xs">Average order value</Text>
                  <Text size="xs" fw={500}>
                    ₱{completedOrders.length > 0 
                      ? Math.round(totalRevenue / completedOrders.length).toLocaleString() 
                      : 0}
                  </Text>
                </Group>
                
                <Progress
                  value={70}
                  size="sm"
                  radius="xl"
                  color="cyan"
                  animated
                />
                <Text size="xs" c="dimmed" mt={5}>
                  Based on {orders.length} total orders
                </Text>
              </Box>
            </Card>
            
            <Card withBorder radius="md" p="xl" className={`${classes.statCard} ${classes.fadeInThird}`}>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">Inventory Status</Text>
                <ThemeIcon size={30} radius="md" color="indigo" variant="light">
                  <IconChartBar size={18} />
                </ThemeIcon>
              </Group>
              
              <Text fw={700} size="28px" className={classes.counterValue}>
                <AnimatedCounter 
                  value={products.reduce((sum, product) => sum + (product.stock || 0), 0)} 
                  formatter={(val) => val.toLocaleString()}
                />
              </Text>
              <Text c="dimmed" size="xs">Items in stock</Text>
                            <Box mt="md">
                <Group justify="space-between" mb={5}>
                  <Text size="xs">Low stock items</Text>
                  <Text size="xs" fw={500}>
                    {products.filter(product => (product.stock || 0) <= 10).length} items
                  </Text>
                </Group>
                
                <Progress
                  value={Math.round((products.filter(product => (product.stock || 0) > 10).length / (productCount || 1)) * 100)}
                  size="sm"
                  radius="xl"
                  color="indigo"
                  animated
                />
               <Text size="xs" c="dimmed" mt={5}>
                  {Math.round((products.filter(product => (product.stock || 0) > 0).length / (productCount || 1)) * 100)}% of products available
                </Text>
              </Box>
            </Card>
          </SimpleGrid>

          {/* Add footer spacing */}
          <Box className={classes.footerSpacer} />
          <AdminFooter />
        </Container>
        <RevenueReportModal opened={reportModalOpened} onClose={closeReportModal} />
      </AppShell.Main>
    </AppShell>
  );
}

export default withRoleProtection(AdminHomePage, ["admin"]);