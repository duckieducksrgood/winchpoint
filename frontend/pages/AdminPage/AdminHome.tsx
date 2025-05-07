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
  ThemeIcon
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
  IconCash,
  IconCurrencyPeso
} from "@tabler/icons-react";
import withRoleProtection, { useUserStore } from "../../utils/auth";
import classes from "./styles/AdminHome.module.css";
import AdminFooter from "../../components/AdminComponents/AdminFooter";

interface AnimatedCounterProps {
  value: number | undefined;
  formatter?: (val: number) => string | number;
}









// Helper component for animated counters








const AnimatedCounter = ({ value, formatter = (val: number) => val }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (value === undefined || value === null) return;
    
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
  }, [value]);
  
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

function AdminHomePage() {
  const router = useRouter();
  const [openedNav, setOpenedNav] = useState(false);
  const theme = useMantineTheme();
  const { user } = useUserStore();

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
  
  // Calculate revenue (from completed orders)
  const totalRevenue = useMemo(() => {
    return completedOrders.reduce((sum, order) => {
      const price = typeof order.total_price === 'number' 
        ? order.total_price 
        : parseFloat(String(order.total_price)) || 0;
      return sum + price;
    }, 0);
  }, [completedOrders]);
  
  // Calculate revenue target achievement (assuming a monthly target of ₱20,000)
  const revenueTarget = 20000;
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
              padding="xl" 
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
              padding="xl" 
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
              padding="xl" 
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
            <Card withBorder radius="md" padding="xl" className={`${classes.statCard} ${classes.fadeInFourth}`}>
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
            </Card>
          </SimpleGrid>
          {/* Order Statistics Card */}
          <Title order={3} mt={40} mb="lg" className={classes.sectionTitle}>Order Statistics</Title>
          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
            <Card withBorder radius="md" padding="xl" className={`${classes.statCard} ${classes.fadeIn}`}>
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
                  radius="xl" value={0}                >
                  <Progress.Section value={orderPercentage} color="green" />
                  <Progress.Section value={100 - orderPercentage} color="yellow" />
                </Progress>
                <Group justify="space-between" mt={5}>
                  <Text size="xs" c="green">Completed: {completedOrders.length}</Text>
                  <Text size="xs" c="yellow">Pending: {pendingOrders.length}</Text>
                </Group>
              </Box>
            </Card>
            
            <Card withBorder radius="md" padding="xl" className={`${classes.statCard} ${classes.fadeInSecond}`}>
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
            
            <Card withBorder radius="md" padding="xl" className={`${classes.statCard} ${classes.fadeInThird}`}>








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
      </AppShell.Main>
    </AppShell>
  );
}

export default withRoleProtection(AdminHomePage, ["admin"]);