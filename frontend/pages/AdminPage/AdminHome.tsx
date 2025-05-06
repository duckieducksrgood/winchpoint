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
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import { 
  IconUsers, 
  IconPackage, 
  IconShoppingCart, 
  IconTrendingUp,
  IconChartBar,
  IconDashboard,
  IconClipboard
} from "@tabler/icons-react";
import { useUserStore } from "../../utils/auth";
import classes from "./styles/AdminHome.module.css";

export default function AdminHomePage() {
  const router = useRouter();
  const [openedNav, setOpenedNav] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(true);
  const [pendingOrdersError, setPendingOrdersError] = useState<string | null>(null);
  
  const theme = useMantineTheme();
  const { user } = useUserStore();
  
  const [productCount, setProductCount] = useState(58);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [revenue, setRevenue] = useState(9840);

  const loadingDelay = 300;

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/count');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setUserCount(data.count);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user count:', err);
        setError('Failed to load user count');
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, loadingDelay);
      }
    };

    fetchUserCount();
  }, []);
  
  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      try {
        setPendingOrdersLoading(true);
        const response = await fetch('/api/orders/pending-count');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setOrderCount(data.count);
        setPendingOrdersError(null);
      } catch (err) {
        console.error('Failed to fetch pending orders count:', err);
        setPendingOrdersError('Failed to load');
        setOrderCount(0);
      } finally {
        setTimeout(() => {
          setPendingOrdersLoading(false);
        }, loadingDelay);
      }
    };

    fetchPendingOrdersCount();
  }, []);
  
  const userPercentage = Math.min((userCount || 0) * 2, 100);
  const productPercentage = Math.min(productCount * 0.5, 100);
  const orderPercentage = Math.min((orderCount || 0) * 2, 100);

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
    console.log('Navigating to orders page...');
    router.push('/AdminPage/OrderPage').catch(err => {
      console.error('Navigation failed:', err);
    });
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

      <AppShell.Main p="lg" pt="xl" className={classes.main}>
        <Container size="xl" className={classes.container}>
          <Paper 
            radius="md" 
            p="xl" 
            mb="xl"
            className={classes.welcomeCard}
            withBorder
          >
            <Group justify="space-between" align="center">
              <div>
                <Text size="lg" c="dimmed" mb={5}>
                  {getGreeting()},
                </Text>
                <Title order={2} fw={700} className={classes.fadeIn}>
                  {user?.firstName || "Admin"}
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
              className={`${classes.statCard} ${classes.userCard}`}
              onClick={navigateToUsers}
            >
              <Group justify="apart" className={classes.cardHeader}>
                <IconUsers 
                  className={classes.statIcon} 
                  stroke={1.5} 
                />
                <Badge size="lg" radius="sm" variant="light" color="teal">USERS</Badge>
              </Group>
              
              {loading ? (
                <Loader size="sm" className={classes.loader} />
              ) : error ? (
                <Text c="red" size="sm">{error}</Text>
              ) : (
                <>
                  <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                    {userCount}
                  </Text>
                  <Text c="dimmed" size="xs" mt={5} mb="md">Total registered users</Text>
                  
                  <Progress 
                    value={userPercentage} 
                    color="teal" 
                    size="sm" 
                    radius="xl"
                    animated={!loading} 
                    className={classes.progressBar}
                  />
                  
                  <Group justify="space-between" mt={5}>
                    <Text size="xs" c="dimmed">Progress</Text>
                    <Text size="xs" fw={500}>{userPercentage}%</Text>
                  </Group>
                  
                  <Text size="xs" ta="right" mt="md" c="dimmed" style={{ fontStyle: 'italic' }}>
                    Click to manage users
                  </Text>
                </>
              )}
            </Card>
            
            <Card withBorder radius="md" padding="xl" className={classes.statCard}>
              <Group justify="apart" className={classes.cardHeader}>
                <IconPackage className={classes.statIcon} style={{ color: theme.colors.blue[6] }} stroke={1.5} />
                <Badge size="lg" radius="sm" variant="light" color="blue">PRODUCTS</Badge>
              </Group>
              
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                {productCount}
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
            </Card>
            
            <Card 
              withBorder 
              radius="md" 
              padding="xl" 
              className={`${classes.statCard} ${classes.orderCard}`} 
              onClick={navigateToOrders}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="apart" className={classes.cardHeader}>
                <IconClipboard className={classes.statIcon} style={{ color: theme.colors.violet[6] }} stroke={1.5} />
                <Badge size="lg" radius="sm" variant="light" color="violet">ORDERS</Badge>
              </Group>
              
              {pendingOrdersLoading ? (
                <Loader size="sm" className={classes.loader} />
              ) : pendingOrdersError ? (
                <Text c="red" size="sm">{pendingOrdersError}</Text>
              ) : (
                <>
                  <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                    {orderCount}
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
                </>
              )}
            </Card>
            
            <Card withBorder radius="md" padding="xl" className={classes.statCard}>
              <Group justify="apart" className={classes.cardHeader}>
                <IconTrendingUp className={classes.statIcon} style={{ color: theme.colors.green[6] }} stroke={1.5} />
                <Badge size="lg" radius="sm" variant="light" color="green">REVENUE</Badge>
              </Group>
              
              <Text fw={700} size="30px" mt="md" className={classes.counterValue}>
                ₱{revenue.toLocaleString()}
              </Text>
              <Text c="dimmed" size="xs" mt={5} mb="md">Monthly revenue</Text>
              
              <Group justify="apart" align="center">
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: 65, color: theme.colors.green[6] }]}
                  label={
                    <Text ta="center" size="sm" fw={700}>
                      65%
                    </Text>
                  }
                />
                <Box>
                  <Text size="xs" fw={500} mb={5}>Monthly Target</Text>
                  <Text size="sm" c="dimmed">₱15,000 Goal</Text>
                </Box>
              </Group>
            </Card>
          </SimpleGrid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}