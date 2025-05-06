import {
  Button,
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Card,
  Tabs,
  Table,
  rem,
  Tooltip,
  Transition,
  Paper,
  Box,
  Title,
  Divider,
  LoadingOverlay,
  ThemeIcon,
  Grid,
  Image,
} from "@mantine/core";
import { useDisclosure, useViewportSize } from "@mantine/hooks";
import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingCart,
  IconTrash,
  IconPhoto,
  IconMessageCircle,
  IconSettings,
  IconCheck,
  IconX,
  IconPackage,
  IconMapPin,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import classes from "./OrderButton.module.css";

// Interfaces
interface IProduct {
  productID: number;
  name: string;
  price: number;
  image: string;
}

interface IOrderItem {
  id: number;
  order: number;
  product: IProduct;
  quantity: number;
  price: number;
}

interface IOrder {
  id: number;
  customer: string;
  status: string;
  created_at: string;
  total_price: number;
  tracking_number: string;
  payment_method: string;
  proof_of_payment: string;
  items: IOrderItem[];
  order_delivery_address: string;
  refund_status?: "To Be Refunded" | "Refunded" | null;
  refund_proof?: string | null;
  refund_date?: string | null;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function OrderButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Scroll animation states
  const [scrollPosition, setScrollPosition] = useState(0);
  const [buttonPosition, setButtonPosition] = useState(0);
  const animationFrame = useRef<number | null>(null);
  const { height: viewportHeight } = useViewportSize();

  const {
    data: orders = [],
    error,
    mutate,
  } = useSWR<IOrder[]>("orders/", fetcher, { refreshInterval: 3000 });

  // Use this function to smoothly update the button position
  const updateButtonPosition = useCallback(() => {
    // Calculate the target position (current scroll position)
    const targetPosition = window.scrollY;
    
    // Get current button position
    let currentPosition = buttonPosition;
    
    // Calculate distance to move (with easing effect)
    const distance = (targetPosition - currentPosition) * 0.1;
    
    // Update button position with smooth easing
    if (Math.abs(distance) > 0.5) {
      currentPosition += distance;
      setButtonPosition(currentPosition);
      
      // Continue animation
      animationFrame.current = requestAnimationFrame(updateButtonPosition);
    } else {
      // Stop animation when close enough
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    }
  }, [buttonPosition]);

  // Handle scroll events for order button animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      
      // Start the smooth animation if not already running
      if (animationFrame.current === null) {
        animationFrame.current = requestAnimationFrame(updateButtonPosition);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updateButtonPosition]);

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch orders",
      color: "red",
      icon: <IconX size={18} />
    });
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      setTransitioning(true);
      await axios.delete(`orders/`, {
        data: { order_id: orderId, status: "Cancelled" },
      });
      await mutate(); // Re-fetch orders after cancellation
      notifications.show({
        title: "Success",
        message: "Order cancelled successfully",
        color: "teal",
        icon: <IconCheck size={18} />
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to cancel order",
        color: "red",
        icon: <IconX size={18} />
      });
    } finally {
      setCancelModalOpened(false);
      setOrderToCancel(null);
      setTimeout(() => setTransitioning(false), 300);
    }
  };

  const pendingOrders = orders.filter((order) => order.status === "Pending");
  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  );

  const renderOrderRow = (order: IOrder) => (
    <Table.Tr key={order.id} className={classes.orderRow}>
      <Table.Td>
        {order.status === "Pending" && (
          <Text className={classes.pendingStatus}>Pending</Text>
        )}
        {order.status === "Completed" && (
          <Text className={classes.completedStatus}>Completed</Text>
        )}
        {order.status === "Cancelled" && (
          <Stack spacing={2}>
            <Text className={classes.cancelledStatus}>Cancelled</Text>
            {order.refund_status && (
              <Badge 
                color={order.refund_status === "Refunded" ? "green" : "orange"} 
                size="xs"
                variant="light"
              >
                {order.refund_status}
              </Badge>
            )}
          </Stack>
        )}
      </Table.Td>
    </Table.Tr>
  );

  const renderOrderDetails = (order: IOrder) => (
    <Card p="md" radius="md" className={classes.orderCard}>
      {order.status === "Cancelled" && (
        <Box mt={15}>
          <Divider my="xs" label="Refund Information" labelPosition="center" />
          <Group position="apart" mt="xs">
            <Text size="sm">Refund Status:</Text>
            <Badge
              color={order.refund_status === "Refunded" ? "green" : "orange"}
              variant="light"
            >
              {order.refund_status || "Not Processed"}
            </Badge>
          </Group>
          
          {order.refund_date && (
            <Group position="apart" mt="xs">
              <Text size="sm">Refund Date:</Text>
              <Text size="sm">{dayjs(order.refund_date).format("YYYY-MM-DD")}</Text>
            </Group>
          )}
          
          {order.refund_proof && (
            <>
              <Text size="sm" mt="md" mb={5}>Proof of Refund:</Text>
              <Image
                src={order.refund_proof}
                alt="Proof of Refund"
                height={120}
                fit="contain"
              />
            </>
          )}
        </Box>
      )}
    </Card>
  );

  return (
    <>
      <Button
        leftSection={<IconPackage size={20} />}
        size="lg"
        radius="xl"
        onClick={open}
        className={classes.orderButton}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "fixed",
          bottom: "6rem", // Adjusted to be above the Cart button
          right: "2rem",
          zIndex: 1000,
          transform: isHovered 
            ? `translateY(${buttonPosition * 0.05}px) scale(1.05)` 
            : `translateY(${buttonPosition * 0.05}px)`,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          background: "linear-gradient(45deg, #228be6, #4dabf7)",
          border: "none", // Match the CartButton border style
        }}
      >
        Orders
        {pendingOrders.length > 0 && (
          <Badge 
            color="red" 
            variant="filled" 
            size="sm" 
            ml={5}
            className={classes.orderBadge}
          >
            {pendingOrders.length}
          </Badge>
        )}
      </Button>

      <Modal 
        centered
        opened={opened} 
        onClose={() => {
          setTransitioning(true);
          setTimeout(() => {
            close();
            setTransitioning(false);
          }, 300);
        }}
        title={
          <Title order={3} className={classes.modalTitle}>
            Order History
          </Title>
        }
        size="xl"
        className={classes.orderModal}
        transitionProps={{ duration: 300, transition: 'slide-down' }}
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay visible={transitioning} overlayProps={{ blur: 2 }} />
        <Tabs variant="pills" radius="md" defaultValue="pending" className={classes.tabs}>
          <Tabs.List className={classes.tabsList}>
            <Tabs.Tab
              value="pending"
              leftSection={<IconPhoto style={{ width: rem(16), height: rem(16) }} />}
              className={classes.tabItem}
            >
              Pending
              {pendingOrders.length > 0 && (
                <Badge color="red" size="sm" variant="filled" ml={5}>
                  {pendingOrders.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab
              value="completed"
              leftSection={<IconCheck style={{ width: rem(16), height: rem(16) }} />}
              className={classes.tabItem}
            >
              Completed
            </Tabs.Tab>
            <Tabs.Tab
              value="cancelled"
              leftSection={<IconX style={{ width: rem(16), height: rem(16) }} />}
              className={classes.tabItem}
            >
              Cancelled
            </Tabs.Tab>
          </Tabs.List>

          {/* Pending Orders Tab */}
          <Tabs.Panel value="pending" pt="lg">
            {pendingOrders.length === 0 ? (
              <Paper p="xl" radius="md" className={classes.emptyOrdersMessage}>
                <Text ta="center" c="dimmed" size="lg">
                  No pending orders yet!
                </Text>
              </Paper>
            ) : (
              <Paper p="md" radius="md" className={classes.tableContainer}>
                <Box>
                  {pendingOrders.map((order, index) => (
                    <Transition
                      key={order.id}
                      mounted={true}
                      transition="fade"
                      duration={300}
                      exitDuration={100}
                      delay={index * 50}
                    >
                      {(styles) => (
                        <Card 
                          withBorder 
                          radius="md" 
                          mb="md" 
                          style={{
                            ...styles,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          className={classes.orderCard}
                        >
                          <Group position="apart" mb={8}>
                            <Group>
                              <Badge size="lg" variant="filled" radius="sm" color="blue">
                                Order #{order.id}
                              </Badge>
                              <Text size="sm" c="dimmed">
                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })}
                              </Text>
                            </Group>
                            <Group>
                              <Badge 
                                color={order.tracking_number ? "green" : "yellow"} 
                                variant="light"
                              >
                                {order.tracking_number ? "Shipping" : "Processing"}
                              </Badge>
                              <Text fw={700} size="lg" c="teal">
                                ₱{order.total_price.toLocaleString()}
                              </Text>
                            </Group>
                          </Group>
                          
                          <Divider my="xs" />
                          
                          <Grid>
                            <Grid.Col span={{ base: 12, sm: 7 }}>
                              <Text fw={500} size="sm" mb={5}>
                                <IconMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                Delivery Address
                              </Text>
                              <Text size="sm">{order.order_delivery_address}</Text>
                            </Grid.Col>
                            
                            <Grid.Col span={{ base: 12, sm: 5 }}>
                              <Stack spacing="xs">
                                <Group>
                                  <Text fw={500} size="sm">Payment:</Text>
                                  <Text size="sm">{order.payment_method || "N/A"}</Text>
                                  {order.proof_of_payment ? (
                                    <ThemeIcon color="green" radius="xl" size="sm" title="Payment confirmed">
                                      <IconCheck size={14} />
                                    </ThemeIcon>
                                  ) : (
                                    <ThemeIcon color="red" radius="xl" size="sm" title="Payment pending">
                                      <IconX size={14} />
                                    </ThemeIcon>
                                  )}
                                </Group>
                                
                                <Group>
                                  <Text fw={500} size="sm">Tracking:</Text>
                                  {order.tracking_number ? (
                                    <Text size="sm">{order.tracking_number}</Text>
                                  ) : (
                                    <Text size="sm" c="dimmed">Not assigned yet</Text>
                                  )}
                                </Group>
                              </Stack>
                            </Grid.Col>
                          </Grid>
                          
                          {order.items && order.items.length > 0 && (
                            <>
                              <Divider my="xs" label="Order Items" labelPosition="center" />
                              <Box style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                <Table verticalSpacing="xs" fontSize="sm">
                                  <Table.Tbody>
                                    {order.items.map(item => (
                                      <Table.Tr key={item.id}>
                                        <Table.Td style={{ width: '60%' }}>{item.product.name}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>x{item.quantity}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>₱{item.price.toLocaleString()}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Box>
                            </>
                          )}
                          
                          {order.status === "Pending" && !order.tracking_number && (
                            <Group position="right" mt="md">
                              <Button
                                color="red"
                                size="sm"
                                onClick={() => {
                                  setOrderToCancel(order.id);
                                  setCancelModalOpened(true);
                                }}
                                radius="md"
                                variant="light"
                                leftSection={<IconX size={14} />}
                              >
                                Cancel Order
                              </Button>
                            </Group>
                          )}
                        </Card>
                      )}
                    </Transition>
                  ))}
                </Box>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Completed Orders Tab - Same Card design */}
          <Tabs.Panel value="completed" pt="lg">
            {completedOrders.length === 0 ? (
              <Paper p="xl" radius="md" className={classes.emptyOrdersMessage}>
                <Text ta="center" c="dimmed" size="lg">
                  No completed orders yet!
                </Text>
              </Paper>
            ) : (
              <Paper p="md" radius="md" className={classes.tableContainer}>
                <Box>
                  {completedOrders.map((order, index) => (
                    <Transition
                      key={order.id}
                      mounted={true}
                      transition="fade"
                      duration={300}
                      exitDuration={100}
                      delay={index * 50}
                    >
                      {(styles) => (
                        <Card 
                          withBorder 
                          radius="md" 
                          mb="md" 
                          style={{
                            ...styles,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          className={classes.orderCard}
                        >
                          <Group position="apart" mb={8}>
                            <Group>
                              <Badge size="lg" variant="filled" radius="sm" color="blue">
                                Order #{order.id}
                              </Badge>
                              <Text size="sm" c="dimmed">
                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })}
                              </Text>
                            </Group>
                            <Group>
                              <Badge color="green" variant="light">Completed</Badge>
                              <Text fw={700} size="lg" c="teal">
                                ₱{order.total_price.toLocaleString()}
                              </Text>
                            </Group>
                          </Group>
                          
                          <Divider my="xs" />
                          
                          <Grid>
                            <Grid.Col span={{ base: 12, sm: 7 }}>
                              <Text fw={500} size="sm" mb={5}>
                                <IconMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                Delivery Address
                              </Text>
                              <Text size="sm">{order.order_delivery_address}</Text>
                            </Grid.Col>
                            
                            <Grid.Col span={{ base: 12, sm: 5 }}>
                              <Stack spacing="xs">
                                <Group>
                                  <Text fw={500} size="sm">Payment:</Text>
                                  <Text size="sm">{order.payment_method || "N/A"}</Text>
                                  <ThemeIcon color="green" radius="xl" size="sm" title="Payment confirmed">
                                    <IconCheck size={14} />
                                  </ThemeIcon>
                                </Group>
                                
                                <Group>
                                  <Text fw={500} size="sm">Tracking:</Text>
                                  <Text size="sm">{order.tracking_number || "N/A"}</Text>
                                </Group>
                              </Stack>
                            </Grid.Col>
                          </Grid>
                          
                          {order.items && order.items.length > 0 && (
                            <>
                              <Divider my="xs" label="Order Items" labelPosition="center" />
                              <Box style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                <Table verticalSpacing="xs" fontSize="sm">
                                  <Table.Tbody>
                                    {order.items.map(item => (
                                      <Table.Tr key={item.id}>
                                        <Table.Td style={{ width: '60%' }}>{item.product.name}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>x{item.quantity}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>₱{item.price.toLocaleString()}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Box>
                            </>
                          )}
                        </Card>
                      )}
                    </Transition>
                  ))}
                </Box>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Cancelled Orders Tab - Same Card design */}
          <Tabs.Panel value="cancelled" pt="lg">
            {cancelledOrders.length === 0 ? (
              <Paper p="xl" radius="md" className={classes.emptyOrdersMessage}>
                <Text ta="center" c="dimmed" size="lg">
                  No cancelled orders yet!
                </Text>
              </Paper>
            ) : (
              <Paper p="md" radius="md" className={classes.tableContainer}>
                <Box>
                  {cancelledOrders.map((order, index) => (
                    <Transition
                      key={order.id}
                      mounted={true}
                      transition="fade"
                      duration={300}
                      exitDuration={100}
                      delay={index * 50}
                    >
                      {(styles) => (
                        <Card 
                          withBorder 
                          radius="md" 
                          mb="md" 
                          style={{
                            ...styles,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          className={classes.orderCard}
                        >
                          <Group position="apart" mb={8}>
                            <Group>
                              <Badge size="lg" variant="filled" radius="sm" color="blue">
                                Order #{order.id}
                              </Badge>
                              <Text size="sm" c="dimmed">
                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })}
                              </Text>
                            </Group>
                            <Group>
                              <Badge color="red" variant="light">Cancelled</Badge>
                              <Text fw={700} size="lg" c="teal">
                                ₱{order.total_price.toLocaleString()}
                              </Text>
                            </Group>
                          </Group>
                          
                          <Divider my="xs" />
                          
                          <Grid>
                            <Grid.Col span={{ base: 12, sm: 7 }}>
                              <Text fw={500} size="sm" mb={5}>
                                <IconMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                Delivery Address
                              </Text>
                              <Text size="sm">{order.order_delivery_address}</Text>
                            </Grid.Col>
                            
                            <Grid.Col span={{ base: 12, sm: 5 }}>
                              <Text size="sm">
                                <Text span fw={500}>Payment:</Text> {order.payment_method || "N/A"}
                              </Text>
                            </Grid.Col>
                          </Grid>
                          
                          {order.items && order.items.length > 0 && (
                            <>
                              <Divider my="xs" label="Order Items" labelPosition="center" />
                              <Box style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                <Table verticalSpacing="xs" fontSize="sm">
                                  <Table.Tbody>
                                    {order.items.map(item => (
                                      <Table.Tr key={item.id}>
                                        <Table.Td style={{ width: '60%' }}>{item.product.name}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>x{item.quantity}</Table.Td>
                                        <Table.Td style={{ width: '20%' }}>₱{item.price.toLocaleString()}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Box>
                            </>
                          )}
                          {renderOrderDetails(order)}
                        </Card>
                      )}
                    </Transition>
                  ))}
                </Box>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>

      <Modal
        centered
        opened={cancelModalOpened}
        onClose={() => setCancelModalOpened(false)}
        title={
          <Title order={4} className={classes.modalTitle}>
            Cancel Order
          </Title>
        }
        className={classes.confirmationModal}
        transitionProps={{ duration: 300, transition: 'fade' }}
        overlayProps={{ blur: 3 }}
      >
        <Box className={classes.confirmationContent}>
          <Text size="md" mb="xl">Are you sure you want to cancel this order?</Text>
          <Group justify="right" mt="md">
            <Button 
              variant="outline" 
              onClick={() => setCancelModalOpened(false)}
              className={classes.noButton}
            >
              No, keep it
            </Button>
            <Button
              color="red"
              onClick={() => orderToCancel && handleCancelOrder(orderToCancel)}
              className={classes.yesButton}
            >
              Yes, cancel order
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}

export default OrderButton;