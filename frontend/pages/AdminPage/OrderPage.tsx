import React, { useState } from "react";
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
  Image,
  FileInput,
  SimpleGrid,
  Menu,
  Text,
} from "@mantine/core";
import { IconEdit, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import { decodeToken, useUserStore } from "../../utils/auth";

interface Order {
  id: number;
  customer: string;
  status: string;
  created_at: string;
  total_price: number;
  payment_method: string;
  proof_of_payment: string | null;
  tracking_number: string | null;
  items: OrderItem[];
  special_instructions: string | null;
}

interface OrderItem {
  id: number;
  product: string;
  quantity: number;
  price: number;
}

interface QRModel {
  id: number;
  qr_code: string;
  type: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function OrderManagementPage() {
  const {
    data: orders = [],
    error,
    mutate,
  } = useSWR<Order[]>("orders/", fetcher);
  const { data: qrCodes = [], mutate: qrCodeMutate } = useSWR<QRModel[]>(
    "qr/",
    fetcher
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [addQrModalOpen, setAddQrModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [qrType, setQrType] = useState<string | null>(null);

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch orders",
      color: "red",
    });
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const handleRowClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOrderDetailsModalOpen(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    try {
      const updatedOrder = {
        order_id: selectedOrder.id,
        user: selectedOrder.customer,
        status: selectedOrder.status,
        total_price: selectedOrder.total_price,
        payment_method: selectedOrder.payment_method,
        tracking_number: selectedOrder.tracking_number,
      };

      await axios.put(`orders/`, updatedOrder);
      notifications.show({
        title: "Order Updated",
        message: `Order ${selectedOrder.id} has been updated successfully`,
        color: "blue",
      });
      setEditModalOpen(false);
      mutate();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to update order",
        color: "red",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOrder((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : null
    );
  };

  const handleSelectChange = (value: string, name: string) => {
    setSelectedOrder((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSaveQrCode = async () => {
    if (!qrFile) return;

    try {
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
      setQrModalOpen(false);
      qrCodeMutate();

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
    }
  };

  const handleAddQrCode = async () => {
    if (!qrFile || !qrType) return;

    try {
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
      setAddQrModalOpen(false);
      qrCodeMutate();

      notifications.show({
        title: "QR Code Added",
        message: "A new QR Code has been added successfully",
        color: "blue",
      });
      setAddQrModalOpen(false);
      qrCodeMutate();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to add QR Code",
        color: "red",
      });
    }
  };

  const rows = orders.map((order) => (
    <Table.Tr key={order.id} onClick={() => handleRowClick(order.id)}>
      <Table.Td>{order.id}</Table.Td>
      <Table.Td>{order.customer}</Table.Td>
      <Table.Td>{order.status}</Table.Td>
      <Table.Td>
        {dayjs(order.created_at).format("YYYY-MM-DD HH:mm:ss")}
      </Table.Td>
      <Table.Td>{order.total_price}</Table.Td>
      <Table.Td>{order.payment_method}</Table.Td>
      <Table.Td>
        {order.proof_of_payment ? (
          <IconCheck color="green" />
        ) : (
          <IconX color="red" />
        )}
      </Table.Td>
      <Table.Td>{order.tracking_number || "None yet"}</Table.Td>
      <Table.Td>
        {order.special_instructions || "No special Instruction."}
      </Table.Td>
      <Table.Td>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleEditOrder(order);
          }}
        >
          Edit
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <AppShell header={{ height: 60 }}>
      <HeaderMegaMenu />

      <AppShell.Main bg={"#B6C4B6"}>
        <Container fluid p={20}>
          <SimpleGrid cols={1}>
            <Text size="lg" w={500}>
              Orders
            </Text>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>CustomerID</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created At</Table.Th>
                  <Table.Th>Total Price</Table.Th>
                  <Table.Th>Payment Method</Table.Th>
                  <Table.Th>Paid</Table.Th>
                  <Table.Th>Tracking Number</Table.Th>
                  <Table.Th>Special Instructions</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </SimpleGrid>

          <Modal
            opened={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            title="Edit Order"
          >
            {selectedOrder && (
              <Stack>
                <TextInput
                  label="User"
                  name="user"
                  value={selectedOrder.customer}
                  onChange={handleInputChange}
                  mb="md"
                  disabled
                />
                <Select
                  label="Status"
                  name="status"
                  value={selectedOrder.status}
                  onChange={(value) =>
                    value && handleSelectChange(value, "status")
                  }
                  data={[
                    { value: "Pending", label: "Pending" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                  mb="md"
                />
                <TextInput
                  disabled
                  label="Total Price"
                  name="total_price"
                  value={selectedOrder.total_price}
                  onChange={handleInputChange}
                  mb="md"
                />
                <TextInput
                  disabled
                  label="Payment Method"
                  name="payment_method"
                  value={selectedOrder.payment_method}
                  onChange={handleInputChange}
                  mb="md"
                />
                <TextInput
                  label="Tracking Number"
                  name="tracking_number"
                  value={selectedOrder.tracking_number || ""}
                  onChange={handleInputChange}
                  mb="md"
                />
                {selectedOrder.proof_of_payment && (
                  <Image
                    src={`${selectedOrder.proof_of_payment}`}
                    alt="Proof of Payment"
                    mb="md"
                  />
                )}
                <Button onClick={handleSaveOrder} mt="md">
                  Save
                </Button>
              </Stack>
            )}
          </Modal>

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
                />
              </>
            )}
            <FileInput
              label="Upload QR Code"
              placeholder="Choose file"
              accept="image/*"
              onChange={setQrFile}
              mb="md"
            />
            <Button onClick={handleSaveQrCode} mt="md">
              Save QR Code
            </Button>
          </Modal>

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
            />
            <Button onClick={handleAddQrCode} mt="md">
              Add QR Code
            </Button>
          </Modal>

          <Menu>
            <Menu.Target>
              <Button mt={50}>Manage QR Code</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setQrModalOpen(true)}>
                Update QR
              </Menu.Item>
              <Menu.Item onClick={() => setAddQrModalOpen(true)}>
                Add QR
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
