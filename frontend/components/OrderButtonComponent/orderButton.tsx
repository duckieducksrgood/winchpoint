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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
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
} from "@tabler/icons-react";

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
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function OrderButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);

  const {
    data: orders = [],
    error,
    mutate,
  } = useSWR<IOrder[]>("orders/", fetcher, { refreshInterval: 1000 });

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch orders",
      color: "red",
    });
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      await axios.delete(`orders/`, {
        data: { order_id: orderId, status: "Cancelled" },
      });
      notifications.show({
        title: "Success",
        message: "Order cancelled",
        color: "green",
      });
      mutate(); // Re-fetch orders after cancellation
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to cancel order",
        color: "red",
      });
    } finally {
      setCancelModalOpened(false);
      setOrderToCancel(null);
    }
  };

  const iconStyle = { width: rem(12), height: rem(12) };

  // Update renderOrderRows function
  const renderOrderRows = (orders: IOrder[], showActions: boolean = true) => {
    return orders.map((order) => (
      <Table.Tr key={order.id}>
        <Table.Td>{order.id}</Table.Td>
        <Table.Td>
          {new Date(order.created_at).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </Table.Td>
        <Table.Td>₱{order.total_price}</Table.Td>
        <Table.Td>{order.payment_method || "N/A"}</Table.Td>
        <Table.Td>
          {order.proof_of_payment ? (
            <IconCheck color="green" size={20} />
          ) : (
            <IconX color="red" size={20} />
          )}
        </Table.Td>
        <Table.Td>{order.order_delivery_address}</Table.Td>
        <Table.Td>
          {order.tracking_number ? (
            order.tracking_number
          ) : order.status === "Cancelled" ? (
            <Text>Cancelled</Text>
          ) : (
            <Tooltip label="Wait for admin and check email">
              <Text>Pending</Text>
            </Tooltip>
          )}
        </Table.Td>
        {showActions && (
          <Table.Td>
            {order.status === "Pending" &&
              (order.tracking_number ? (
                <Tooltip label="Cannot cancel, tracking number assigned">
                  <Text>Tracking Assigned</Text>
                </Tooltip>
              ) : (
                <Tooltip label="Wait for admin to verify payment or cancel">
                  <Button
                    color="red"
                    onClick={() => {
                      setOrderToCancel(order.id);
                      setCancelModalOpened(true);
                    }}
                  >
                    Cancel
                  </Button>
                </Tooltip>
              ))}
          </Table.Td>
        )}
      </Table.Tr>
    ));
  };

  // Update table headers in all three panels
  const getTableHeaders = (showActions: boolean = true) => (
    <Table.Tr>
      <Table.Th>Order ID</Table.Th>
      <Table.Th>Date</Table.Th>
      <Table.Th>Total Price</Table.Th>
      <Table.Th>Payment Method</Table.Th>
      <Table.Th>Paid</Table.Th>
      <Table.Th>Delivery Address</Table.Th>
      <Table.Th>Tracking Number</Table.Th>
      {showActions && <Table.Th>Action</Table.Th>}
    </Table.Tr>
  );

  const pendingOrders = orders.filter((order) => order.status === "Pending");
  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  );

  return (
    <>
      <Button
        leftSection={<IconShoppingCart size={20} />}
        size="lg"
        radius="xl"
        onClick={open}
        style={{
          position: "fixed",
          bottom: "6rem", // Adjusted to be above the Cart button
          right: "2rem",
          zIndex: 1000,
        }}
      >
        Orders
      </Button>

      <Modal opened={opened} onClose={close} title="Your Orders" size="lg">
        <Tabs variant="outline" radius="xs" defaultValue="pending">
          <Tabs.List>
            <Tabs.Tab
              value="pending"
              leftSection={<IconPhoto style={iconStyle} />}
            >
              Pending
            </Tabs.Tab>
            <Tabs.Tab
              value="completed"
              leftSection={<IconMessageCircle style={iconStyle} />}
            >
              Completed
            </Tabs.Tab>
            <Tabs.Tab
              value="cancelled"
              leftSection={<IconSettings style={iconStyle} />}
            >
              Cancelled
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            {pendingOrders.length === 0 ? (
              <Text ta="center" c="dimmed">
                No pending orders yet!
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={500}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                >
                  <Table.Thead>{getTableHeaders(true)}</Table.Thead>
                  <Table.Tbody>
                    {renderOrderRows(pendingOrders, true)}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="completed">
            {completedOrders.length === 0 ? (
              <Text ta="center" c="dimmed">
                No completed orders yet!
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={500}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                >
                  <Table.Thead>{getTableHeaders(false)}</Table.Thead>
                  <Table.Tbody>
                    {renderOrderRows(completedOrders, false)}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="cancelled">
            {cancelledOrders.length === 0 ? (
              <Text ta="center" c="dimmed">
                No cancelled orders yet!
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={500}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                >
                  <Table.Thead>{getTableHeaders(false)}</Table.Thead>
                  <Table.Tbody>
                    {renderOrderRows(cancelledOrders, false)}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>

      <Modal
        opened={cancelModalOpened}
        onClose={() => setCancelModalOpened(false)}
        title="Cancel Order"
      >
        <Text>Are you sure you want to cancel this order?</Text>
        <Group justify="right" mt="md">
          <Button variant="outline" onClick={() => setCancelModalOpened(false)}>
            No
          </Button>
          <Button
            color="red"
            onClick={() => orderToCancel && handleCancelOrder(orderToCancel)}
          >
            Yes, cancel it
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export default OrderButton;
