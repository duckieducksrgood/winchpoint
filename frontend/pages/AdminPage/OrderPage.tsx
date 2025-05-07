import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import {
  AppShell,
  Container,
  Group,
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Stack,
  Card,
  Text,
  SimpleGrid,
  Badge,
  Input,
  Divider,
  Box,
  ActionIcon,
  Tooltip,
  Paper,
  Switch,
  ThemeIcon,
  Tabs,
  Popover,
  Radio,
  SegmentedControl,
  Center,
  Menu,
  ScrollArea,
  Image,
  FileInput,
  Transition,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconPackage,
  IconTruckDelivery,
  IconShoppingCart,
  IconClipboardCheck,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconRefresh,
  IconDashboard,
  IconClock,
  IconChevronDown,
  IconCheck,
  IconX,
  IconFileInvoice,
  IconSend,
  IconCalendarTime,
  IconCash,
  IconQrcode,
  IconPhoto,
  IconCurrencyPeso,
  IconArrowBack,
  IconUpload,
  IconList,
  IconMail,
  IconHome,
  IconExternalLink,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import dayjs from "dayjs";

import classes from "./styles/OrderPage.module.css";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection, { decodeToken, useUserStore } from "../../utils/auth";
import AdminFooter from '../../components/AdminComponents/AdminFooter';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: string;
}

interface Order {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  } | number;
  order_items: OrderItem[];
  order_date: string;
  status: string;
  delivery_address: string;
  total_price: number;
  payment_method: string;
  proof_of_payment: string | null;
  tracking_number: string | null;
  special_instructions: string | null;
  customer: string;
  created_at: string;
  items: any[];
}

interface QRModel {
  id: number;
  qr_code: string;
  type: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Helper function to calculate percentage
const calculatePercentage = (count: number, total: number) => {
  return total > 0 ? Math.round((count / total) * 100) : 0;
};

// Fix the AnimatedCounter component
interface AnimatedCounterProps {
  value: number;
  formatter?: (val: number) => string | number;
}

const AnimatedCounter = ({ value, formatter = (val: number) => val }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
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

// Helper function to check if a date is from today
const isDateFromToday = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  
  const orderDate = new Date(dateString);
  const currentDate = new Date();
  
  return orderDate.getDate() === currentDate.getDate() &&
         orderDate.getMonth() === currentDate.getMonth() &&
         orderDate.getFullYear() === currentDate.getFullYear();
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  return (
    <Badge
      color={status === "Pending" ? "yellow" : status === "Completed" ? "green" : "red"}
      variant="light"
    >
      {status}
    </Badge>
  );
};

const OrderPage = () => {
  // Data fetching
  const { data: orders = [], error, mutate } = useSWR<Order[]>("orders/", fetcher);
  const { data: qrCodes = [], mutate: qrCodeMutate } = useSWR<QRModel[]>("qr/", fetcher);
  const { data: users = [] } = useSWR<User[]>("users/", fetcher);

  // Helper must be inside the component to access users
  const getUsername = (order: Order) => {
    let userId = typeof order.user === "object" && order.user !== null ? order.user.id : order.user;
    if (!userId && order.customer && !isNaN(Number(order.customer))) {
      userId = Number(order.customer);
    }
    const user = users.find(u => u.id === userId);
    // Add '@' before username if found
    return user?.username
      ? `@${user.username}`
      : (typeof order.user === "object" && order.user?.username
          ? `@${order.user.username}`
          : (typeof order.customer === "string" ? order.customer : "No username"));
  };
  
  // General state
  const [openedNav, setOpenedNav] = useState(false);
  const [activeTab, setActiveTab] = useState("pending-orders");

  // Add these missing states to fix the error
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Pending");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [addQrModalOpen, setAddQrModalOpen] = useState(false);
  const [revenueBreakdownModalOpen, setRevenueBreakdownModalOpen] = useState(false);
  
  // Selected data state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<string>("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrType, setQrType] = useState<string | null>(null);
  
  // Revenue filter state
  const [revenueFilter, setRevenueFilter] = useState<string>("all");
  
  // Count orders by status
  const pendingOrders = orders.filter((order) => order.status === "Pending").length;
  const completedOrders = orders.filter((order) => order.status === "Completed").length;
  const cancelledOrders = orders.filter((order) => order.status === "Cancelled").length;
  const totalOrders = orders.length;

  // Get today's orders
  const todayOrders = orders.filter(order => isDateFromToday(order.created_at)).length;
  
  // Calculate total revenue based on filter - improved to be more accurate
  const filteredRevenueOrders = useMemo(() => {
    return orders.filter(order => {
      // Exclude cancelled orders and orders without dates
      if (order.status === "Cancelled" || !order.created_at) return false;
      
      // Only include orders that have proof of payment
      if (!order.proof_of_payment) return false;
      
      const orderDate = new Date(order.created_at);

      // Filter based on time period
      if (revenueFilter === "all") return true;

      if (revenueFilter === "today") {
        return isDateFromToday(order.created_at);
      }

      if (revenueFilter === "month") {
        return (
          orderDate.getFullYear() === new Date().getFullYear() &&
          orderDate.getMonth() === new Date().getMonth()
        );
      }

      if (revenueFilter === "year") {
        return orderDate.getFullYear() === new Date().getFullYear();
      }

      if (revenueFilter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return orderDate >= sevenDaysAgo && orderDate <= new Date();
      }

      return true;
    });
  }, [orders, revenueFilter]);

  const totalRevenue = filteredRevenueOrders.reduce(
    (sum, order) => sum + (parseFloat(order.total_price?.toString()) || 0), 
    0
  );

  // Filter orders based on search, status, and other filters
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch = 
          (typeof order.user === "object" && order.user?.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (typeof order.user === "object" && order.user?.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm) ||
          (typeof order.user === "object" && order.user?.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (typeof order.user === "object" && order.user?.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (order.customer?.toString() || "").includes(searchTerm);
        
        let matchesStatus = true;
        if (filterStatus) {
          matchesStatus = order.status === filterStatus;
        } else if (activeTab !== "all-orders") {
          switch (activeTab) {
            case "pending-orders":
              matchesStatus = order.status === "Pending";
              break;
            case "completed-orders":
              matchesStatus = order.status === "Completed";
              break;
            case "cancelled-orders":
              matchesStatus = order.status === "Cancelled";
              break;
          }
        }
        
        const matchesPaymentMethod = !paymentMethodFilter || order.payment_method === paymentMethodFilter;
        const isToday = !showOnlyToday || isDateFromToday(order.created_at);
        
        return matchesSearch && matchesStatus && matchesPaymentMethod && isToday;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch(sortField) {
          case "id":
            comparison = a.id - b.id;
            break;
          case "customer":
            comparison = (a.customer?.toString() || "").localeCompare(b.customer?.toString() || "");
            break;
          case "status":
            comparison = (a.status || "").localeCompare(b.status || "");
            break;
          case "total_price":
            const priceA = parseFloat(a.total_price?.toString()) || 0;
            const priceB = parseFloat(b.total_price?.toString()) || 0;
            comparison = priceA - priceB;
            break;
          case "created_at":
          default:
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            comparison = dateA - dateB;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [orders, searchTerm, filterStatus, paymentMethodFilter, showOnlyToday, sortField, sortDirection, activeTab]);

  // Order actions
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewModalOpened(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditModalOpened(true);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setLoading(true);
      
      const updatedOrder = {
        order_id: orderId,
        status: newStatus,
      };
      
      await axios.put(`orders/`, updatedOrder);
      
      notifications.show({
        title: "Success",
        message: `Order #${orderId} status updated to ${newStatus}`,
        color: "green",
      });
      mutate();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update order status",
        color: "red",
      });
    } finally {
      setLoading(false);
      setConfirmModalOpened(false);
    }
  };

  const confirmStatusChange = (order: Order, newStatus: string) => {
    setSelectedOrder(order);
    setConfirmAction(newStatus);
    setConfirmModalOpened(true);
  };
  
  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      
      const updatedOrder = {
        order_id: selectedOrder.id,
        status: selectedOrder.status,
        tracking_number: selectedOrder.tracking_number || "",
      };
      
      await axios.put(`orders/`, updatedOrder);
      
      notifications.show({
        title: "Order Updated",
        message: `Order #${selectedOrder.id} status updated to ${selectedOrder.status}`,
        color: "green",
      });
      
      setEditModalOpened(false);
      await mutate(undefined, { revalidate: true });
    } catch (error: any) {
      console.error("Error updating order:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      notifications.show({
        title: "Error",
        message: error.response?.data?.detail || "Failed to update order status",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOrder((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : null
    );
  };

  const handleSelectChange = (value: string | null, name: string) => {
    if (value === null) return;
    setSelectedOrder((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleSaveQrCode = async () => {
    if (!qrFile) return;

    try {
      setLoading(true);
      const presignedUrlResponse = await axios.post(
        "generate_presigned_url_payment/",
        {
          file_name: qrFile.name,
          file_type: qrFile.type,
        }
      );

      const { url, fields } = presignedUrlResponse.data;

      const uploadData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        uploadData.append(key, value as string);
      });
      uploadData.append("file", qrFile);

      await axios.post(url, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const formData = new FormData();
      formData.append("file_name", qrFile.name);
      formData.append("type", qrType as string);
      await axios.put("qr/", formData);
      
      notifications.show({
        title: "QR Code Updated",
        message: "QR Code has been updated successfully",
        color: "blue",
      });
      setQrModalOpen(false);
      qrCodeMutate();
      setQrFile(null);
      setQrType(null);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to update QR Code",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQrCode = async () => {
    if (!qrFile || !qrType) return;

    try {
      setLoading(true);
      const presignedUrlResponse = await axios.post(
        "generate_presigned_url_payment/",
        {
          file_name: qrFile.name,
          file_type: qrFile.type,
        }
      );

      const { url, fields } = presignedUrlResponse.data;

      const uploadData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        uploadData.append(key, value as string);
      });
      uploadData.append("file", qrFile);

      await axios.post(url, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const formData = new FormData();
      formData.append("file_name", qrFile.name);
      formData.append("type", qrType);
      await axios.post("qr/", formData);
      
      notifications.show({
        title: "QR Code Added",
        message: "A new QR Code has been added successfully",
        color: "blue",
      });
      setAddQrModalOpen(false);
      qrCodeMutate();
      setQrFile(null);
      setQrType(null);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to add QR Code",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOrderRows = (orders: Order[]) => {
    return orders.map((order, index) => {
      const isToday = isDateFromToday(order.created_at);
      
      const delayClass = index < 10 ? classes[`rowDelay${index+1}`] : '';
      
      return (
        <Table.Tr key={order.id} className={`${classes.tableRow} ${delayClass}`}>
          <Table.Td>{order.id}</Table.Td>
          <Table.Td>
            <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
              {order.customer || (typeof order.user === "object" ? `${(order.user?.first_name || '')} ${(order.user?.last_name || '')}` : '')}
              {isToday && (
                <Tooltip
                  label={`New order from today: ${order.created_at ? new Date(order.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                  }) : 'Unknown time'}`}
                >
                  <Badge
                    size="xs"
                    color="indigo"
                    variant="light"
                    radius="sm"
                    px={6}
                    style={{ 
                      flexShrink: 0, 
                      cursor: "help", 
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      textTransform: 'none',
                      fontSize: '10px'
                    }}
                  >
                    New
                  </Badge>
                </Tooltip>
              )}
            </Group>
          </Table.Td>
          <Table.Td>
            <Tooltip label={getUsername(order)}>
              <div style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "150px"
              }}>
                {getUsername(order)}
              </div>
            </Tooltip>
          </Table.Td>
          <Table.Td>₱{(parseFloat(order.total_price?.toString()) || 0).toFixed(2)}</Table.Td>
          <Table.Td>
            {order.created_at ? dayjs(order.created_at).format("YYYY-MM-DD HH:mm:ss") : "No date"}
          </Table.Td>
          <Table.Td>
            <OrderStatusBadge status={order.status} />
          </Table.Td>
          <Table.Td>
            {order.payment_method || "Unknown"}
          </Table.Td>
          <Table.Td>
            {order.proof_of_payment ? (
              <IconCheck color="green" />
            ) : (
              <IconX color="red" />
            )}
          </Table.Td>
          <Table.Td>
            {order.tracking_number || "None yet"}
          </Table.Td>
          <Table.Td style={{ width: "15%" }}>
            <Group gap={4} justify="left">
              <Tooltip label="View Order Details">
                <ActionIcon
                  onClick={() => handleViewOrder(order)}
                  variant="subtle"
                  color="blue"
                >
                  <IconFileInvoice size={18} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Edit Order">
                <ActionIcon
                  onClick={() => handleEditOrder(order)}
                  variant="subtle"
                  color="blue"
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
      );
    });
  };

  return (
    <div className={classes.pageWrapper}>
      <HeaderMegaMenu openedNav={openedNav} setOpenedNav={setOpenedNav} />
      
      <div className={classes.main}>
        <Container size="xl" pt={50} pb={30} className={classes.container}>
          <Paper radius="md" p="xl" mb="lg" withBorder className={classes.welcomeCard}>
            <SimpleGrid cols={{ base: 1, sm: 4 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Group align="center" wrap="nowrap">
                  <div className={classes.iconContainer}>
                    <ThemeIcon size={48} radius="md" className={classes.dashboardIcon}>
                      <IconTruckDelivery size={24} />
                    </ThemeIcon>
                  </div>
                  <div>
                    <Text size="lg" fw={600} className={classes.fadeIn}>Order Management</Text>
                    <Title order={2} className={classes.heroTitle}>Process Customer Orders</Title>
                    <Text mt={5} c="dimmed" size="sm" className={classes.fadeInSecond}>
                      Track, update, and manage orders from receipt to delivery.
                    </Text>
                  </div>
                </Group>
              </div>

              <Paper withBorder p="md" radius="md" className={classes.statCard}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group align="center" gap="xs">
                      <IconPackage size={22} color="#228be6" />
                      <Text fw={500} size="sm">Total Orders</Text>
                    </Group>
                    <Group align="baseline" mt={8} gap={5}>
                      <Text fw={800} size="xl" className={classes.counterNumber}>
                        {totalOrders}
                      </Text>
                      {todayOrders > 0 && (
                        <Badge color="green" size="sm" variant="light" radius="sm">
                          +{todayOrders} today
                        </Badge>
                      )}
                    </Group>

                    <Box mt={12}>
                      <Group mb={4} justify="space-between" gap={5}>
                        <Text size="xs">Pending</Text>
                        <Text size="xs">Completed</Text>
                        <Text size="xs">Cancelled</Text>
                      </Group>
                      <Group gap={0}>
                        <Box 
                          w={`${totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}%`} 
                          h={8} 
                          bg="yellow.6"
                          style={{ borderRadius: '4px 0 0 0' }}
                        />
                        <Box 
                          w={`${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%`} 
                          h={8} 
                          bg="green.6"
                        />
                        <Box 
                          w={`${totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0}%`} 
                          h={8} 
                          bg="red.6" 
                          style={{ borderRadius: '0 4px 0 0' }}
                        />
                      </Group>
                    </Box>
                  </div>
                </Group>
              </Paper>

              <Paper withBorder p="md" radius="md" className={classes.statCard}>
                <Tabs
                  value={revenueFilter}
                  onChange={setRevenueFilter}
                  variant="pills"
                  radius="md"
                  classNames={{
                    list: classes.revenueTabsList,
                    tab: classes.revenueTab,
                  }}
                  className={classes.revenueTabs}
                >
                  <Tabs.List>
                    <Tabs.Tab value="all">All Time</Tabs.Tab>
                    <Tabs.Tab value="today">Today</Tabs.Tab>
                    <Tabs.Tab value="7days">7 Days</Tabs.Tab>
                    <Tabs.Tab value="month">Month</Tabs.Tab>
                    <Tabs.Tab value="year">Year</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
                
                <Box mt={14} mb={8}>
                  <Group align="center" gap="xs">
                    <ThemeIcon 
                      size={32} 
                      radius="xl" 
                      variant="light" 
                      color="blue"
                    >
                      <IconCurrencyPeso size={18} />
                    </ThemeIcon>
                    <Text fw={500} size="sm">Total Revenue</Text>
                  </Group>
                </Box>
                
                <Text 
                  fw={800} 
                  size="xl" 
                  className={classes.counterNumber}
                  style={{ 
                    fontSize: '28px', 
                    lineHeight: 1.2,
                    cursor: 'pointer' 
                  }}
                  onClick={() => setRevenueBreakdownModalOpen(true)}
                >
                  <AnimatedCounter 
                    value={Math.floor(totalRevenue)} 
                    formatter={(val) => `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Tooltip label="Click to see revenue breakdown">
                    <IconChevronDown size={14} style={{ marginLeft: 5 }} />
                  </Tooltip>
                </Text>
                
                <Transition mounted={!!revenueFilter} transition="slide-up" duration={250} timingFunction="ease">
                  {(styles) => (
                    <Box style={styles} mt={12}>
                      <Badge 
                        size="md" 
                        variant="dot" 
                        color="blue" 
                        fullWidth
                      >
                        {revenueFilter === "all" ? "All Time Revenue" : 
                         revenueFilter === "today" ? "Today's Revenue" :
                         revenueFilter === "month" ? "This Month's Revenue" :
                         revenueFilter === "7days" ? "Last 7 Days Revenue" : 
                         "This Year's Revenue"}
                      </Badge>
                    </Box>
                  )}
                </Transition>
                
                <Group mt={14} grow>
                  <Button 
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => mutate()}
                    variant="subtle"
                    color="blue"
                    className={classes.fadeInThird}
                    size="xs"
                  >
                    Refresh Data
                  </Button>
                </Group>
              </Paper>
            </SimpleGrid>
          </Paper>

          <SimpleGrid cols={4} mb="md" spacing="md" className={classes.fadeInThird} breakpoints={[
            { maxWidth: 'md', cols: 2 },
            { maxWidth: 'xs', cols: 1 }
          ]}>
            <Paper withBorder p="md" radius="md" className={classes.counterCard}>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" fw={500} size="xs" tt="uppercase" mb={5}>
                    Total Orders
                  </Text>
                  <Text fw={700} size="xl" className={classes.counterNumber}>
                    <AnimatedCounter value={totalOrders} />
                  </Text>
                </div>
                <ThemeIcon 
                  size={48} 
                  radius="md" 
                  variant="light" 
                  color="blue"
                  className={classes.counterIcon}
                >
                  <IconPackage size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" className={classes.counterCard}>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" fw={500} size="xs" tt="uppercase" mb={5}>
                    Pending Orders
                  </Text>
                  <Text fw={700} size="xl" className={classes.counterNumber}>
                    <AnimatedCounter value={pendingOrders} />
                  </Text>
                  <Text size="xs" mt={5} c="yellow">
                    {calculatePercentage(pendingOrders, totalOrders)}% of total
                  </Text>
                </div>
                <ThemeIcon 
                  size={48} 
                  radius="md" 
                  variant="light" 
                  color="yellow" 
                  className={classes.counterIcon}
                >
                  <IconClock size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" className={classes.counterCard}>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" fw={500} size="xs" tt="uppercase" mb={5}>
                    Completed Orders
                  </Text>
                  <Text fw={700} size="xl" className={classes.counterNumber}>
                    <AnimatedCounter value={completedOrders} />
                  </Text>
                  <Text size="xs" mt={5} c="green">
                    {calculatePercentage(completedOrders, totalOrders)}% of total
                  </Text>
                </div>
                <ThemeIcon 
                  size={48} 
                  radius="md" 
                  variant="light" 
                  color="green" 
                  className={classes.counterIcon}
                >
                  <IconCheck size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" className={classes.counterCard}>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" fw={500} size="xs" tt="uppercase" mb={5}>
                    Cancelled Orders
                  </Text>
                  <Text fw={700} size="xl" className={classes.counterNumber}>
                    <AnimatedCounter value={cancelledOrders} />
                  </Text>
                  <Text size="xs" mt={5} c="red">
                    {calculatePercentage(cancelledOrders, totalOrders)}% of total
                  </Text>
                </div>
                <ThemeIcon 
                  size={48} 
                  radius="md" 
                  variant="light" 
                  color="red" 
                  className={classes.counterIcon}
                >
                  <IconX size={24} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          <Paper shadow="xs" p="sm" mb={16} withBorder className={classes.fadeInThird}>
            <Group gap="xs" align="center">
              <Input
                placeholder="Search orders..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ flexGrow: 1 }}
              />
              
              <Popover position="bottom" shadow="md" width={260} withinPortal>
                <Popover.Target>
                  <Button 
                    variant="light" 
                    rightSection={<IconChevronDown size={16} />}
                    leftSection={sortDirection === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                  >
                    Sort: {sortField.replace('_', ' ')}
                  </Button>
                </Popover.Target>
                
                <Popover.Dropdown p="md">
                  <Stack gap="md">
                    <Box>
                      <Text fw={600} size="sm" mb={10} c="dark">Sort By</Text>
                      
                      <Radio.Group 
                        value={sortField}
                        onChange={setSortField}
                        name="sortField"
                     >
                        <SimpleGrid cols={2} spacing="sm" verticalSpacing="xs" style={{ gap: 'xs' }}>
                          <Radio value="id" label="Order ID" />
                          <Radio value="created_at" label="Order Date" />
                          <Radio value="status" label="Status" />
                          <Radio value="customer" label="Customer" />
                          <Radio value="total_price" label="Total Price" />
                        </SimpleGrid>
                      </Radio.Group>
                    </Box>
                    
                    <Divider />
                    
                    <Box>tDirection(value as "asc" | "desc")
                      <Text fw={600} size="sm" mb={10} c="dark">Direction</Text>
                      <SegmentedControl
                        fullWidth
                        value={sortDirection}
                        onChange={(value) => setSortDirection(value as "asc" | "desc")}
                        data={[
                          {
                            value: 'asc',
                            label: (
                              <Center>
                                <IconSortAscending size={16} />
                                <Box ml={6}>Ascending</Box>
                              </Center>
                            ),
                          },
                          {
                            value: 'desc',
                            label: (
                              <Center>
                                <IconSortDescending size={16} />
                                <Box ml={6}>Descending</Box>
                              </Center>
                            ),
                          },
                        ]}
                      />
                    </Box>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
              
              <Select
                placeholder="Filter by payment method"
                leftSection={<IconFilter size={16} />}
                value={paymentMethodFilter}
                onChange={setPaymentMethodFilter}
                clearable
                data={
                  Array.isArray(qrCodes)
                    ? qrCodes.map((qr) => ({ value: qr.type, label: qr.type }))
                    : []
                }
                style={{ width: "180px" }}
              />
              
              <Box 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  height: 36,
                  padding: '0 4px'
                }}
              >
                <Switch
                  label={<Text size="sm" fw={500}>Today's orders only</Text>}
                  checked={showOnlyToday}
                  onChange={(event) => setShowOnlyToday(event.currentTarget.checked)}
                  labelPosition="left"
                  styles={{
                    root: {
                      alignItems: 'center', 
                      display: 'flex'
                    },
                    label: {
                      fontWeight: 500,
                      fontSize: '14px',
                      color: 'var(--mantine-color-dark-9)',
                      paddingRight: '8px',
                      margin: 0
                    }
                  }}
                />
              </Box>
            </Group>
          </Paper>

          <Group justify="right" mb={16}>
            <Menu>
              <Menu.Target>
                <Button leftSection={<IconQrcode size={18} />} variant="light">
                  Manage QR Codes
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setQrModalOpen(true)} leftSection={<IconEdit size={16} />}>
                  Update QR Code
                </Menu.Item>
                <Menu.Item onClick={() => setAddQrModalOpen(true)} leftSection={<IconPhoto size={16} />}>
                  Add QR Code
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <Tabs 
            value={filterStatus}
            onChange={(value) => setFilterStatus(value || "Pending")}
            className={`${classes.fadeInFourth} ${classes.tabs}`}
          >
            <Tabs.List mb="xs">
              <Tabs.Tab
                value="Pending"
                leftSection={<IconClock size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl" color="yellow">
                    <AnimatedCounter value={pendingOrders} />
                  </Badge>
                }
              >
                Pending
              </Tabs.Tab>
              <Tabs.Tab 
                value="Completed"
                leftSection={<IconCheck size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl" color="green">{completedOrders}</Badge>
                }
              >
                Completed
              </Tabs.Tab>
              <Tabs.Tab 
                value="Cancelled"
                leftSection={<IconX size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl" color="red">{cancelledOrders}</Badge>
                }
              >
                Cancelled
              </Tabs.Tab>
            </Tabs.List>

            <div className={classes.tabsContainer}>
              <Tabs.Panel 
                value="Pending" 
                className={classes.tabPanel}
                data-active={filterStatus === "Pending"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer minWidth={1200}>
                      <Table striped highlightOnHover withTableBorder withColumnBorders style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Customer</Table.Th>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Total Price</Table.Th>
                            <Table.Th>Created At</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Payment Method</Table.Th>
                            <Table.Th>Paid</Table.Th>
                            <Table.Th>Tracking Number</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredOrders.length > 0 ? (
                            renderOrderRows(filteredOrders)
                          ) : (
                            <Table.Tr>
                              <Table.Td colSpan={10}>
                                <div className={classes.emptyState}>
                                  <Stack align="center" gap="xs">
                                    <IconClock size={32} stroke={1.5} color="var(--mantine-color-gray-5)" />
                                    <Text c="dimmed" size="sm">No pending orders found</Text>
                                  </Stack>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {filteredOrders.length} {filterStatus ? filterStatus.toLowerCase() : ''} orders
                      </Text>
                      <Button 
                        variant="subtle" 
                        size="sm" 
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => mutate()}
                      >
                        Refresh Orders
                      </Button>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
              
              <Tabs.Panel 
                value="Completed" 
                className={classes.tabPanel}
                data-active={filterStatus === "Completed"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer minWidth={1200}>
                      <Table striped highlightOnHover withTableBorder withColumnBorders style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Customer</Table.Th>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Total Price</Table.Th>
                            <Table.Th>Created At</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Payment Method</Table.Th>
                            <Table.Th>Paid</Table.Th>
                            <Table.Th>Tracking Number</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredOrders.length > 0 ? (
                            renderOrderRows(filteredOrders)
                          ) : (
                            <Table.Tr>
                              <Table.Td colSpan={10}>
                                <div className={classes.emptyState}>
                                  <Stack align="center" gap="xs">
                                    <IconCheck size={32} stroke={1.5} color="var(--mantine-color-gray-5)" />
                                    <Text c="dimmed" size="sm">No completed orders found</Text>
                                  </Stack>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {filteredOrders.length} {filterStatus ? filterStatus.toLowerCase() : ''} orders
                      </Text>
                      <Button 
                        variant="subtle" 
                        size="sm" 
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => mutate()}
                      >
                        Refresh Orders
                      </Button>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
              
              <Tabs.Panel 
                value="Cancelled" 
                className={classes.tabPanel}
                data-active={filterStatus === "Cancelled"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer minWidth={1200}>
                      <Table striped highlightOnHover withTableBorder withColumnBorders style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Customer</Table.Th>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Total Price</Table.Th>
                            <Table.Th>Created At</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Payment Method</Table.Th>
                            <Table.Th>Paid</Table.Th>
                            <Table.Th>Tracking Number</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredOrders.length > 0 ? (
                            renderOrderRows(filteredOrders)
                          ) : (
                            <Table.Tr>
                              <Table.Td colSpan={10}>
                                <div className={classes.emptyState}>
                                  <Stack align="center" gap="xs">
                                    <IconX size={32} stroke={1.5} color="var(--mantine-color-gray-5)" />
                                    <Text c="dimmed" size="sm">No cancelled orders found</Text>
                                  </Stack>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {filteredOrders.length} {filterStatus ? filterStatus.toLowerCase() : ''} orders
                      </Text>
                      <Button 
                        variant="subtle" 
                        size="sm" 
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => mutate()}
                      >
                        Refresh Orders
                      </Button>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
            </div>
          </Tabs>

          {/* View Order Modal - Improved Professional Design */}
          <Modal
            opened={viewModalOpened}
            onClose={() => setViewModalOpened(false)}
            title={selectedOrder ? <Text fw={700} size="lg">Order #{selectedOrder.id} Details</Text> : "Order Details"}
            size="lg"
            transitionProps={{ transition: 'fade', duration: 300 }}
            overlayProps={{ blur: 3 }}
          >
            {selectedOrder && (
              <>
                <Tabs defaultValue="details" className={classes.viewOrderTabs}>
                  <Tabs.List mb="md">
                    <Tabs.Tab value="details" leftSection={<IconFileInvoice size={16} />}>
                      Order Details
                    </Tabs.Tab>
                    {selectedOrder.proof_of_payment && (
                      <Tabs.Tab value="payment" leftSection={<IconCash size={16} />}>
                        Payment
                      </Tabs.Tab>
                    )}
                  </Tabs.List>
                
                  <Tabs.Panel value="details">
                    <SimpleGrid cols={2} styles={{ root: { '@media (max-width: 576px)': { gridTemplateColumns: '1fr' } } }} spacing="lg">
                      <Paper withBorder p="md" radius="md" className={classes.viewOrderPanel}>
                        <Box mb="xs" pb={5} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          <Group justify="space-between">
                            <Text fw={600} size="sm">Customer Information</Text>
                            <Badge 
                              size="sm" 
                              color={selectedOrder.status === "Pending" ? "yellow" : selectedOrder.status === "Completed" ? "green" : "red"}
                            >
                              {selectedOrder.status}
                            </Badge>
                          </Group>
                        </Box>
                        
                        <Box py={10} className={classes.viewOrderCustomer}>
                          <Text fw={600} size="lg" mb={4}>
                            {selectedOrder.customer || (typeof selectedOrder.user === "object" ? 
                              `${(selectedOrder.user?.first_name || '')} ${(selectedOrder.user?.last_name || '')}` : '')}
                          </Text>
                          <Text size="sm" c="blue" mb="md">{getUsername(selectedOrder)}</Text>
                        </Box>
                        
                        {typeof selectedOrder.user === "object" && selectedOrder.user?.email && (
                          <Group mt={5}>
                            <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                              <IconMail size={12} />
                            </ThemeIcon>
                            <Text size="sm">{selectedOrder.user.email}</Text>
                          </Group>
                        )}
                        
                        {selectedOrder.delivery_address && (
                          <Group mt={12}>
                            <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                              <IconHome size={12} />
                            </ThemeIcon>
                            <Text size="sm" style={{ flex: 1 }}>{selectedOrder.delivery_address}</Text>
                          </Group>
                        )}
                      </Paper>
                      
                      <Paper withBorder p="md" radius="md" className={classes.viewOrderPanel}>
                        <Box mb="xs" pb={5} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          <Text fw={600} size="sm">Order Information</Text>
                        </Box>

                        <SimpleGrid cols={2} mt={12} spacing="xs">
                          <Text size="sm" c="dimmed">Order ID:</Text>
                          <Text size="sm" fw={500}>#{selectedOrder.id}</Text>
                          
                          <Text size="sm" c="dimmed">Date:</Text>
                          <Text size="sm" fw={500}>
                            {selectedOrder.created_at ? dayjs(selectedOrder.created_at).format("YYYY-MM-DD HH:mm") : "Unknown"}
                          </Text>
                          
                          <Text size="sm" c="dimmed">Payment Method:</Text>
                          <Text size="sm" fw={500}>{selectedOrder.payment_method || "Unknown"}</Text>
                          
                          <Text size="sm" c="dimmed">Tracking Number:</Text>
                          <Text size="sm" fw={500}>
                            {selectedOrder.tracking_number || 
                              <Badge size="sm" color="gray" variant="outline">None assigned</Badge>
                            }
                          </Text>

                          <Text size="sm" c="dimmed">Payment Status:</Text>
                          <Box>
                            {selectedOrder.proof_of_payment ? (
                              <Badge size="sm" color="green" variant="light">Paid</Badge>
                            ) : (
                              <Badge size="sm" color="red" variant="light">Unpaid</Badge>
                            )}
                          </Box>
                          
                          <Text size="sm" c="dimmed">Total Amount:</Text>
                          <Text size="sm" fw={700}>₱{(parseFloat(selectedOrder.total_price?.toString()) || 0).toFixed(2)}</Text>
                        </SimpleGrid>

                        {selectedOrder.special_instructions && (
                          <Box mt={20}>
                            <Text size="sm" fw={500} mb={5}>Special Instructions:</Text>
                            <Paper p="xs" withBorder bg="gray.0" radius="sm">
                              <Text size="sm" style={{ fontStyle: 'italic' }}>{selectedOrder.special_instructions}</Text>
                            </Paper>
                          </Box>
                        )}
                      </Paper>
                    </SimpleGrid>
                  </Tabs.Panel>
                  
                  {selectedOrder.proof_of_payment && (
                    <Tabs.Panel value="payment">
                      <Paper withBorder p="md" radius="md" className={classes.viewOrderPanel}>
                        <Box mb="xs" pb={5} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          <Text fw={600} size="sm">Proof of Payment</Text>
                        </Box>
                        
                        <Center my={20}>
                          <Image
                            src={`${selectedOrder.proof_of_payment}`}
                            alt="Proof of Payment"
                            fit="contain"
                            height={250}
                            withPlaceholder
                            style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                          />
                        </Center>
                        
                        <Group justify="center">
                          <Button 
                            variant="light" 
                            component="a" 
                            href={selectedOrder.proof_of_payment} 
                            target="_blank"
                            leftSection={<IconExternalLink size={16} />}
                          >
                            View Full Image
                          </Button>
                        </Group>
                      </Paper>
                    </Tabs.Panel>
                  )}
                </Tabs>
                
                <Group justify="space-between" mt={20}>
                  <Button variant="default" onClick={() => setViewModalOpened(false)}>
                    Close
                  </Button>
                  <Group>
                    {selectedOrder.status !== "Completed" && (
                      <Button 
                        variant="outline" 
                        color="green"
                        onClick={() => {
                          setViewModalOpened(false);
                          confirmStatusChange(selectedOrder, "Completed");
                        }}
                        leftSection={<IconClipboardCheck size={16} />}
                      >
                        Mark as Completed
                      </Button>
                    )}
                    <Button 
                      leftSection={<IconEdit size={16} />} 
                      onClick={() => {
                        setViewModalOpened(false);
                        setSelectedOrder(selectedOrder);
                        setEditModalOpened(true);
                      }}
                    >
                      Edit Order
                    </Button>
                  </Group>
                </Group>
              </>
            )}
          </Modal>

          {/* Edit Order Modal */}
          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title={selectedOrder ? <Text fw={700} size="lg">Edit Order #{selectedOrder.id}</Text> : "Edit Order"}
            size="md"
            transitionProps={{ transition: 'fade', duration: 300 }}
            overlayProps={{ blur: 3 }}
          >
            {selectedOrder && (
              <>
                <Paper withBorder p="md" radius="md" mb="md" className={classes.editOrderPanel}>
                  <Box mb="xs" pb={5} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Group justify="space-between">
                      <Text fw={600} size="sm">Order Information</Text>
                      <Badge 
                        size="sm" 
                        color={selectedOrder.status === "Pending" ? "yellow" : selectedOrder.status === "Completed" ? "green" : "red"}
                      >
                        Current: {selectedOrder.status}
                      </Badge>
                    </Group>
                  </Box>
                  
                  <Stack spacing="lg" mt={15}>
                    <Box>
                      <Text size="sm" fw={500} mb={5}>Customer</Text>
                      <Paper p="xs" withBorder bg="gray.0" radius="sm">
                        <Text size="sm" fw={600}>
                          {selectedOrder.customer || (typeof selectedOrder.user === "object" ? 
                            `${(selectedOrder.user?.first_name || '')} ${(selectedOrder.user?.last_name || '')}` : '')}
                          {' '}
                          <Text span size="xs" c="blue" fw={400} style={{ verticalAlign: 'middle' }}>
                            ({getUsername(selectedOrder)})
                          </Text>
                        </Text>
                      </Paper>
                    </Box>
                    
                    <TextInput
                      label="Tracking Number"
                      name="tracking_number"
                      value={selectedOrder.tracking_number || ""}
                      onChange={handleInputChange}
                      placeholder="Enter tracking number"
                      icon={<IconTruckDelivery size={16} />}
                      description="Enter courier tracking number for this order"
                    />
                    
                    <Select
                      label="Status"
                      name="status"
                      value={selectedOrder.status}
                      onChange={(value) => handleSelectChange(value, "status")}
                      data={[
                        { value: "Pending", label: "Pending" },
                        { value: "Completed", label: "Completed" },
                        { value: "Cancelled", label: "Cancelled" },
                      ]}
                      description="Change the current status of this order"
                    />
                  </Stack>
                </Paper>
                
                <Paper withBorder p="md" radius="md" mb="md" className={classes.editOrderPanel}>
                  <Box mb="xs" pb={5} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text fw={600} size="sm">Order Summary</Text>
                  </Box>
                  
                  <SimpleGrid cols={2} mt={12} spacing="xs">
                    <Text size="sm" c="dimmed">Order Date:</Text>
                    <Text size="sm" fw={500}>
                      {selectedOrder.created_at ? dayjs(selectedOrder.created_at).format("YYYY-MM-DD HH:mm") : "Unknown"}
                    </Text>
                    
                    <Text size="sm" c="dimmed">Payment Method:</Text>
                    <Text size="sm" fw={500}>{selectedOrder.payment_method || "Unknown"}</Text>
                    
                    <Text size="sm" c="dimmed">Total Amount:</Text>
                    <Text size="sm" fw={700}>₱{(parseFloat(selectedOrder.total_price?.toString()) || 0).toFixed(2)}</Text>
                    
                    <Text size="sm" c="dimmed">Payment Status:</Text>
                    <Box>
                      {selectedOrder.proof_of_payment ? (
                        <Badge size="sm" color="green" variant="light">Paid</Badge>
                      ) : (
                        <Badge size="sm" color="red" variant="light">Unpaid</Badge>
                      )}
                    </Box>
                  </SimpleGrid>
                </Paper>
                
                <Group justify="space-between" mt={20}>
                  <Button variant="default" onClick={() => setEditModalOpened(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveOrder} 
                    loading={loading}
                    leftSection={<IconDeviceFloppy size={16} />}
                  >
                    Save Changes
                  </Button>
                </Group>
              </>
            )}
          </Modal>

          {/* Confirmation Modal */}
          <Modal
            opened={confirmModalOpened}
            onClose={() => setConfirmModalOpened(false)}
            title={<Text fw={600}>Confirm Status Change</Text>}
          >
            {selectedOrder && (
              <Stack>
                <Text>
                  Are you sure you want to change order #{selectedOrder.id} status to{" "}
                  <Badge
                    color={
                      confirmAction === "Pending" ? "yellow" :
                      confirmAction === "Completed" ? "green" :
                      "red"
                    }
                    variant="light"
                    style={{ textTransform: "capitalize" }}
                  >
                    {confirmAction}
                  </Badge>
                  ?
                </Text>
                <Group justify="right" mt="md">
                  <Button variant="outline" onClick={() => setConfirmModalOpened(false)}>
                    Cancel
                  </Button>
                  <Button
                    color={
                      confirmAction === "Pending" ? "yellow" :
                      confirmAction === "Completed" ? "green" :
                      "red"
                    }
                    onClick={() => handleStatusUpdate(selectedOrder.id, confirmAction)}
                    loading={loading}
                  >
                    Confirm
                  </Button>
                </Group>
              </Stack>
            )}
          </Modal>

          {/* QR Code Update Modal */}
          <Modal
            opened={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            title="Update QR Code"
          >
            <Select
              label="QR Code Type"
              placeholder="Select QR Code Type"
              value={qrType}
              onChange={setQrType}
              data={
                Array.isArray(qrCodes)
                  ? qrCodes.map((qr) => ({ value: qr.type, label: qr.type }))
                  : []
              }
              clearable
              mb="md"
            />
            {qrCodes && qrType && (
              <>
                <Text size="lg" mb="md">
                  Do you want to update the QR Code?
                </Text>
                <Text size="lg" mb="md">
                  QR Code Type: {qrType}
                </Text>
                <Image
                  src={`${qrCodes.find((qr) => qr.type === qrType)?.qr_code}`}
                  alt="QR Code"
                  mb="md"
                  fit="contain"
                  height={200}
                />
              </>
            )}
            <FileInput
              label="Upload QR Code"
              placeholder="Choose file"
              accept="image/*"
              onChange={setQrFile}
              mb="md"
              leftSection={<IconPhoto size={16} />}
            />
            <Button 
              onClick={handleSaveQrCode} 
              mt="md" 
              loading={loading}
              leftSection={<IconCheck size={16} />}
              fullWidth
            >
              Save QR Code
            </Button>
          </Modal>

          {/* Add QR Code Modal */}
          <Modal
            opened={addQrModalOpen}
            onClose={() => setAddQrModalOpen(false)}
            title="Add QR Code"
          >
            <TextInput
              label="QR Code Type"
              placeholder="Enter QR Code Type"
              value={qrType || ""}
              onChange={(e) => setQrType(e.currentTarget.value)}
              mb="md"
            />
            <FileInput
              label="Upload QR Code"
              placeholder="Choose file"
              accept="image/*"
              onChange={setQrFile}
              mb="md"
              leftSection={<IconPhoto size={16} />}
            />
            <Button 
              onClick={handleAddQrCode} 
              mt="md"
              loading={loading}
              leftSection={<IconCheck size={16} />}
              fullWidth
            >
              Add QR Code
            </Button>
          </Modal>

          {/* Revenue Breakdown Modal */}
          <Modal
            opened={revenueBreakdownModalOpen}
            onClose={() => setRevenueBreakdownModalOpen(false)}
            title={<Text fw={600}>Revenue Breakdown ({revenueFilter === "all" ? "All Time" : 
                    revenueFilter === "today" ? "Today" : 
                    revenueFilter === "month" ? "This Month" :
                    revenueFilter === "7days" ? "Last 7 Days" : "This Year"})</Text>}
            size="lg"
          >
            <Text size="sm" mb="md">Total Revenue: <strong>₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></Text>
            
            <ScrollArea h={400}>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Order ID</Table.Th>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredRevenueOrders.length > 0 ? (
                    filteredRevenueOrders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>#{order.id}</Table.Td>
                        <Table.Td>
                          {order.customer || (typeof order.user === "object" ? 
                            `${(order.user?.first_name || '')} ${(order.user?.last_name || '')}` : '')}
                        </Table.Td>
                        <Table.Td>{order.created_at ? dayjs(order.created_at).format("YYYY-MM-DD") : "Unknown"}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              order.status === "Pending" ? "yellow" :
                              order.status === "Completed" ? "green" : "red"
                            }
                            variant="light"
                            size="sm"
                          >
                            {order.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fw={500}>₱{(parseFloat(order.total_price?.toString()) || 0).toFixed(2)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                        <Text c="dimmed">No orders in this period</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th colSpan={4} style={{ textAlign: 'right' }}>Total:</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </ScrollArea>
            
            <Group justify="right" mt="md">
              <Button onClick={() => setRevenueBreakdownModalOpen(false)}>Close</Button>
            </Group>
          </Modal>

          <Box className={classes.footerSpacer} />
          <AdminFooter />
        </Container>
      </div>
    </div>
  );
};

export default withRoleProtection(OrderPage, ["admin"]);