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
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection from "../../utils/auth";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  delivery_address: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const UserManagementPage = () => {
  const { data: users = [], error, mutate } = useSWR<User[]>("users/", fetcher);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<User>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    role: "customer",
    delivery_address: "",
  });

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch users",
      color: "red",
    });
  }

  const handleAddUser = async () => {
    try {
      const response = await axios.post("register/", newUser);
      notifications.show({
        message: "User added successfully",
        color: "green",
      });
      setAddModalOpened(false);
      mutate(); // Refresh the data
    } catch (error) {
      notifications.show({
        message: "Failed to add user",
        color: "red",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.put(
        `users/?user_id=${selectedUser.id}`,
        selectedUser
      );
      notifications.show({
        message: "User updated successfully",
        color: "green",
      });
      setEditModalOpened(false);
      mutate(); // Refresh the data
    } catch (error: any) {
      // Show backend error if available
      notifications.show({
        message: "Failed to update user",
        color: "red",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.delete(`users/?user_id=${selectedUser.id}`);
      notifications.show({
        message: "User deleted successfully",
        color: "green",
      });
      setDeleteModalOpened(false);
      mutate(); // Refresh the data
    } catch (error) {
      notifications.show({
        message: "Failed to delete user",
        color: "red",
      });
    }
  };

  const renderUserRows = (users: User[]) => {
    return users.map((user) => (
      <Table.Tr key={user.id}>
        <Table.Td>{user.id}</Table.Td>
        <Table.Td>{user.first_name}</Table.Td>
        <Table.Td>{user.last_name}</Table.Td>
        <Table.Td>{user.email}</Table.Td>
        <Table.Td>{user.username}</Table.Td>
        <Table.Td>{user.role}</Table.Td>
        <Table.Td>{user.delivery_address}</Table.Td>
        <Table.Td>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                setSelectedUser(user);
                setEditModalOpened(true);
              }}
            >
              Edit
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => {
                setSelectedUser(user);
                setDeleteModalOpened(true);
              }}
            >
              Delete
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    ));
  };
  const [openedNav, setOpenedNav] = useState(false);

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

      <AppShell.Main bg={"#B6C4B6"}>
        <Container fluid p={20}>
          <Group justify="apart" mb="md">
            <Title order={2}>User Management</Title>
            <Button onClick={() => setAddModalOpened(true)}>Add User</Button>
          </Group>
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>First Name</Table.Th>
                  <Table.Th>Last Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Username</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Delivery Address</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderUserRows(users)}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Modal
            opened={addModalOpened}
            onClose={() => setAddModalOpened(false)}
            title="Add User"
            centered
          >
            <Stack>
              <TextInput
                label="First Name"
                value={newUser.first_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, first_name: e.currentTarget.value })
                }
              />
              <TextInput
                label="Last Name"
                value={newUser.last_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, last_name: e.currentTarget.value })
                }
              />
              <TextInput
                label="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.currentTarget.value })
                }
              />
              <TextInput
                label="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.currentTarget.value })
                }
              />
              <Select
                label="Role"
                data={[
                  { value: "admin", label: "Admin" },
                  { value: "customer", label: "Customer" },
                ]}
                value={newUser.role}
                onChange={(value) =>
                  setNewUser({ ...newUser, role: value || "customer" })
                }
              />
              <TextInput
                label="Delivery Address"
                value={newUser.delivery_address}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    delivery_address: e.currentTarget.value,
                  })
                }
              />
              <Button onClick={handleAddUser}>Add User</Button>
            </Stack>
          </Modal>

          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title="Edit User"
            centered
          >
            {selectedUser && (
              <Stack>
                <TextInput
                  label="First Name"
                  value={selectedUser.first_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      first_name: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="Last Name"
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="Email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      email: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="Username"
                  value={selectedUser.username}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      username: e.currentTarget.value,
                    })
                  }
                />
                <Select
                  label="Role"
                  data={[
                    { value: "admin", label: "Admin" },
                    { value: "customer", label: "Customer" },
                  ]}
                  value={selectedUser.role}
                  onChange={(value) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: value || "customer",
                    })
                  }
                />
                <TextInput
                  label="Delivery Address"
                  value={selectedUser.delivery_address}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      delivery_address: e.currentTarget.value,
                    })
                  }
                />
                <Button onClick={handleEditUser}>Update User</Button>
              </Stack>
            )}
          </Modal>

          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title="Delete User"
            centered
          >
            <Stack>
              <p>Are you sure you want to delete this user?</p>
              <Button color="red" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </Stack>
          </Modal>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
export default withRoleProtection(UserManagementPage, ["admin"]);
