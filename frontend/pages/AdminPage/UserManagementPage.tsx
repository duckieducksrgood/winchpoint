import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconUsers,
  IconUserPlus,
  IconShieldCheck,
  IconUserCheck,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconRefresh,
  IconDashboard,
  IconUserCog,
  IconChevronDown,
} from "@tabler/icons-react";

import classes from "./styles/UserManagement.module.css";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection from "../../utils/auth";
import AdminFooter from '../../components/AdminComponents/AdminFooter';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  delivery_address: string;
  password?: string;
  date_joined?: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const UserManagementPage = () => {
  const { data: users = [], error, mutate } = useSWR<User[]>("users/", fetcher);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [activeTab, setActiveTab] = useState("all-users");
  const tabsListRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const [newUser, setNewUser] = useState<User>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    role: "customer",
    delivery_address: "",
    password: "",
  });

  const sortUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "first_name":
          comparison = a.first_name.localeCompare(b.first_name);
          break;
        case "last_name":
          comparison = a.last_name.localeCompare(b.last_name);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "username":
          comparison = a.username.localeCompare(b.username);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "id":
        default:
          comparison = a.id - b.id;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesRole = !filterRole || user.role === filterRole;

      const isNew =
        user.date_joined &&
        new Date(user.date_joined) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const matchesNewFilter = !showOnlyNew || isNew;

      return matchesSearch && matchesRole && matchesNewFilter;
    });

    return sortUsers(result);
  }, [users, searchTerm, filterRole, showOnlyNew, sortField, sortDirection]);

  useEffect(() => {
    if (tabsListRef.current) {
      const activeTabElement = tabsListRef.current.querySelector('[data-active="true"]');
      if (activeTabElement) {
        setIndicatorStyle({
          width: `${activeTabElement.offsetWidth}px`,
          left: `${activeTabElement.offsetLeft}px`,
        });
      }
    }
  }, [activeTab]);

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const customerUsers = users.filter((user) => user.role === "customer").length;

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
      mutate();
    } catch (error: any) {
      notifications.show({
        message:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to add user",
        color: "red",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const payload = {
      first_name: selectedUser.first_name,
      last_name: selectedUser.last_name,
      email: selectedUser.email,
      role: selectedUser.role,
      delivery_address: selectedUser.delivery_address,
    };

    try {
      const response = await axios.put(
        `users/?user_id=${selectedUser.id}`,
        payload
      );
      notifications.show({
        message: "User updated successfully",
        color: "green",
      });
      setEditModalOpened(false);
      mutate();
    } catch (error: any) {
      notifications.show({
        message:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to update user",
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
      mutate();
    } catch (error) {
      notifications.show({
        message: "Failed to delete user",
        color: "red",
      });
    }
  };

  const renderUserRows = (users: User[]) => {
    return users.map((user, index) => {
      const isNew =
        user.date_joined &&
        new Date(user.date_joined) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Limit delay classes to first 10 rows
      const delayClass = index < 10 ? classes[`rowDelay${index+1}`] : '';

      return (
        <Table.Tr key={user.id} className={`${classes.tableRow} ${delayClass}`}>
          <Table.Td>{user.id}</Table.Td>
          <Table.Td>
            <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.first_name}
              </div>
              {isNew && (
                <Tooltip
                  label={`Joined on: ${new Date(
                    user.date_joined || ""
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}`}
                >
                  <Badge
                    size="xs"
                    color="pink"
                    variant="filled"
                    style={{ flexShrink: 0, cursor: "help" }}
                  >
                    NEW
                  </Badge>
                </Tooltip>
              )}
            </Group>
          </Table.Td>
          <Table.Td>{user.last_name}</Table.Td>
          <Table.Td>
            <Tooltip label={user.email} disabled={user.email.length < 20}>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </Tooltip>
          </Table.Td>
          <Table.Td>{user.username}</Table.Td>
          <Table.Td style={{ minWidth: "80px", width: "12%" }}>
            <Badge
              color={user.role === "admin" ? "blue" : "green"}
              variant="light"
              fullWidth
              style={{
                display: "inline-block",
                width: "auto",
                padding: "0 8px",
                minWidth: "unset",
                textTransform: "capitalize",
              }}
            >
              {user.role}
            </Badge>
          </Table.Td>
          <Table.Td style={{ width: "26%" }}>
            <Tooltip label={user.delivery_address}>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal",
                  maxHeight: "60px",
                  lineHeight: "1.4",
                  wordBreak: "break-word",
                }}
              >
                {user.delivery_address}
              </div>
            </Tooltip>
          </Table.Td>
          <Table.Td>
            <Group>
              <Tooltip label="Edit User">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => {
                    setSelectedUser(user);
                    setEditModalOpened(true);
                  }}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete User">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    setSelectedUser(user);
                    setDeleteModalOpened(true);
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
      );
    });
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

      <AppShell.Main className={classes.main}>
        <Container size="xl" pt={80} pb={30} className={classes.container}>
          {/* Hero Section with Key Metrics - Fixed Icon Position */}
          <Paper radius="md" p="xl" mb="lg" withBorder className={classes.heroSection}>
            <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
              {/* Welcome Message with Fixed Icon */}
              <div style={{ gridColumn: 'span 2' }}>
                <Group align="center" noWrap>
                  <div className={classes.iconContainer}>
                    <ThemeIcon size={48} radius="md" className={classes.dashboardIcon}>
                      <IconUserCog size={24} />
                    </ThemeIcon>
                  </div>
                  <div>
                    <Text size="lg" fw={600} className={classes.fadeIn}>User Management</Text>
                    <Title order={2} className={classes.heroTitle}>Manage Your User Base</Title>
                    <Text mt={5} c="dimmed" size="sm" className={classes.fadeInSecond}>
                      Control access, manage accounts, and monitor user activity from a single dashboard.
                    </Text>
                  </div>
                </Group>
              </div>
              
              {/* Rest of the components remain unchanged */}
              <Paper withBorder p="md" radius="md" className={classes.statCard}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group align="center" gap={6}>
                      <IconUsers size={22} color="#228be6" />
                      <Text fw={500} size="sm">Total Users</Text>
                    </Group>
                    <Group align="baseline" mt={8} gap={5}>
                      <Text fw={800} size="xl" className={classes.counterNumber}>
                        {totalUsers}
                      </Text>
                      {users.filter(
                        (u) => u.date_joined && 
                        new Date(u.date_joined) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ).length > 0 && (
                        <Badge color="green" size="sm" variant="light" radius="sm">
                          +{users.filter(
                            (u) => u.date_joined && 
                            new Date(u.date_joined) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                          ).length} this month
                        </Badge>
                      )}
                    </Group>

                    {/* Admin/Customer distribution */}
                    <Box mt={12}>
                      <Group mb={4} position="apart">
                        <Text size="xs">Admins</Text>
                        <Text size="xs">Customers</Text>
                      </Group>
                      <Group gap={0}>
                        <Box 
                          w={`${(adminUsers / totalUsers) * 100}%`} 
                          h={8} 
                          bg="blue.6"
                          style={{ borderRadius: '4px 0 0 4px' }}
                        />
                        <Box 
                          w={`${(customerUsers / totalUsers) * 100}%`} 
                          h={8} 
                          bg="green.6" 
                          style={{ borderRadius: '0 4px 4px 0' }}
                        />
                      </Group>
                      <Group position="apart" mt={4}>
                        <Text size="xs" fw={500}>{adminUsers}</Text>
                        <Text size="xs" fw={500}>{customerUsers}</Text>
                      </Group>
                    </Box>
                  </div>
                </Group>
              </Paper>

              {/* Quick Actions Card */}
              <Paper withBorder p="md" radius="md" className={classes.actionCard}>
                <Group align="center" gap={6}>
                  <IconUserPlus size={22} color="#e64980" />
                  <Text fw={500} size="sm">Quick Actions</Text>
                </Group>
                
                <Group mt={12} grow>
                  <Button 
                    leftSection={<IconUserPlus size={18} />}
                    onClick={() => setAddModalOpened(true)}
                    className={classes.fadeInThird}
                  >
                    Add User
                  </Button>
                  
                  <Button 
                    variant="light" 
                    leftSection={<IconRefresh size={18} />}
                    onClick={() => mutate()}
                  >
                    Refresh
                  </Button>
                </Group>
                
                <Group mt={10} grow>
                  <Button 
                    variant="subtle"
                    leftSection={<IconFilter size={16} />}
                    onClick={() => {
                      setSearchTerm("");
                      setFilterRole(null);
                      setShowOnlyNew(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Group>
              </Paper>
            </SimpleGrid>
          </Paper>

          {/* Stats Visualization Row */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md" className={classes.fadeInSecond}>
            {/* Stats Card 1: Admin Users */}
            <Card shadow="sm" withBorder p="md" className={classes.statCard}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group align="center" gap={6}>
                    <IconShieldCheck size={16} color="#228be6" />
                    <Text fw={500} size="sm">Admin Users</Text>
                  </Group>
                  <Text fw={700} size="xl">
                    {adminUsers}
                  </Text>
                  <Text size="xs" c="dimmed" mt={5}>
                    {Math.round((adminUsers / totalUsers) * 100)}% of total user base
                  </Text>
                </div>
                <ThemeIcon size={40} radius="md" color="blue" variant="light">
                  <IconShieldCheck size={24} />
                </ThemeIcon>
              </Group>
            </Card>
            
            {/* Stats Card 2: Regular Customers */}
            <Card shadow="sm" withBorder p="md" className={classes.statCard}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group mb={6} gap={6}>
                    <IconUserCheck size={16} color="#40c057" />
                    <Text fw={500} size="sm">Customers</Text>
                  </Group>
                  <Text fw={700} size="xl">
                    {customerUsers}
                  </Text>
                  <Text size="xs" c="dimmed" mt={5}>
                    {Math.round((customerUsers / totalUsers) * 100)}% of total user base
                  </Text>
                </div>
                <ThemeIcon size={40} radius="md" color="green" variant="light">
                  <IconUserCheck size={24} />
                </ThemeIcon>
              </Group>
            </Card>
            
            {/* Stats Card 3: New Users (7 Days) */}
            <Card shadow="sm" withBorder p="md" className={classes.statCard}>
              <Group position="apart" align="flex-start">
                <div>
                  <Group mb={6} gap={6}>
                    <IconUserPlus size={16} color="#e64980" />
                    <Text fw={500} size="sm">New Users (7 Days)</Text>
                  </Group>
                  <Text fw={700} size="xl">
                    {users.filter(
                      user => 
                      user.date_joined && 
                      new Date(user.date_joined) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </Text>
                  
                  {/* Weekly trend visualization */}
                  <Box mt={10}>
                    <Group gap={2} align="flex-end">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const dayCount = users.filter(
                          user => 
                          user.date_joined && 
                          new Date(user.date_joined) > new Date(Date.now() - (7-i) * 24 * 60 * 60 * 1000) &&
                          new Date(user.date_joined) < new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000)
                        ).length;
                        const height = Math.max(3, Math.min(dayCount * 4, 16));
                        return (
                          <Box 
                            key={i}
                            w={6} 
                            h={height} 
                            bg={dayCount > 0 ? "#e64980" : "#f1f3f5"}
                            style={{ borderRadius: '1px' }}
                          />
                        );
                      })}
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>Last 7 days</Text>
                  </Box>
                </div>
                <ThemeIcon size={40} radius="md" color="pink" variant="light">
                  <IconUserPlus size={24} />
                </ThemeIcon>
              </Group>
            </Card>
            
            {/* Stats Card 4: User Distribution Donut */}
            <Card shadow="sm" withBorder p="md" className={classes.statCard}>
              <Group justify="space-between" mb={6}>
                <Group gap={6}>
                  <IconUsers size={16} color="#228be6" />
                  <Text fw={500} size="sm">User Distribution</Text>
                </Group>
              </Group>
              
              <Group position="center">
                {/* Donut chart visualization */}
                <Box style={{
                  position: 'relative',
                  height: 65,
                  width: 65,
                }}>
                  <Box style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      #228be6 0% ${(adminUsers / totalUsers) * 100}%, 
                      #40c057 ${(adminUsers / totalUsers) * 100}% 100%
                    )`,
                  }} />
                  
                  <Box style={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '50%',
                    height: '50%',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text fw={500} size="sm">
                      {totalUsers}
                    </Text>
                  </Box>
                </Box>
                
                {/* Legend */}
                <Stack spacing={5} ml={10}>
                  <Group spacing="xs">
                    <Box w={8} h={8} bg="#228be6" style={{ borderRadius: "2px" }} />
                    <Text size="xs">Admin: {adminUsers}</Text>
                  </Group>
                  <Group spacing="xs">
                    <Box w={8} h={8} bg="#40c057" style={{ borderRadius: "2px" }} />
                    <Text size="xs">Customer: {customerUsers}</Text>
                  </Group>
                </Stack>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Enhanced Search and Filter Bar */}
          <Paper shadow="xs" p="sm" mb={16} withBorder className={classes.fadeInThird}>
            <Group gap="xs" align="center">
              <Input
                placeholder="Search users..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ flexGrow: 1 }}
              />
              
              {/* Improved Sort Dropdown */}
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
                  <Stack spacing="md">
                    <Box>
                      <Text fw={600} size="sm" mb={10} c="dark">Sort By</Text>
                      
                      <Radio.Group 
                        value={sortField}
                        onChange={setSortField}
                        name="sortField"
                        spacing="xs"
                      >
                        <SimpleGrid cols={2} spacing="sm" verticalSpacing="xs">
                          <Radio value="id" label="ID" />
                          <Radio value="first_name" label="First Name" />
                          <Radio value="last_name" label="Last Name" />
                          <Radio value="username" label="Username" />
                          <Radio value="role" label="Role" />
                          <Radio value="email" label="Email" />
                        </SimpleGrid>
                      </Radio.Group>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Text fw={600} size="sm" mb={10} c="dark">Direction</Text>
                      <SegmentedControl
                        fullWidth
                        value={sortDirection}
                        onChange={setSortDirection}
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
                placeholder="Filter by role"
                leftSection={<IconFilter size={16} />}
                value={filterRole}
                onChange={setFilterRole}
                clearable
                data={[
                  { value: "admin", label: "Admin Users" },
                  { value: "customer", label: "Customers" },
                ]}
                style={{ width: "150px" }}
              />
              
              {/* Properly aligned Switch */}
              <Box 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  height: 36,  // Match the height of the other controls 
                  padding: '0 4px'
                }}
              >
                <Switch
                  label={<Text size="sm" fw={500}>New users only</Text>}
                  checked={showOnlyNew}
                  onChange={(event) => setShowOnlyNew(event.currentTarget.checked)}
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
                      margin: 0  // Remove any default margin
                    }
                  }}
                />
              </Box>
            </Group>
          </Paper>

          {/* Tabs with fixed height container */}
          <Tabs 
            value={activeTab}
            onChange={setActiveTab}
            className={`${classes.fadeInFourth} ${classes.tabs}`}
          >
            <Tabs.List mb="xs">
              <Tabs.Tab 
                value="all-users" 
                leftSection={<IconUsers size={16} />}
              >
                All Users
              </Tabs.Tab>
              <Tabs.Tab 
                value="admins" 
                leftSection={<IconShieldCheck size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl">{adminUsers}</Badge>
                }
              >
                Admins
              </Tabs.Tab>
              <Tabs.Tab 
                value="customers"
                leftSection={<IconUserCheck size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl">{customerUsers}</Badge>
                }
              >
                Customers
              </Tabs.Tab>
              <Tabs.Tab 
                value="new"
                leftSection={<IconUserPlus size={16} />}
                rightSection={
                  <Badge size="xs" variant="filled" radius="xl" color="pink">
                    {users.filter(
                      user => user.date_joined && 
                      new Date(user.date_joined) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </Badge>
                }
              >
                New Users
              </Tabs.Tab>
            </Tabs.List>

            {/* Wrap all tab panels in a container with fixed height */}
            <div className={classes.tabsContainer}>
              <Tabs.Panel 
                value="all-users" 
                className={classes.tabPanel}
                data-active={activeTab === "all-users"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer>
                      <Table striped highlightOnHover withTableBorder style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th style={{ width: "5%" }}>ID</Table.Th>
                            <Table.Th style={{ width: "12%" }}>First Name</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Last Name</Table.Th>
                            <Table.Th style={{ width: "15%" }}>Email</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Username</Table.Th>
                            <Table.Th style={{ width: "12%" }}>Role</Table.Th>
                            <Table.Th style={{ width: "26%" }}>Delivery Address</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredUsers.length > 0 ? (
                            renderUserRows(filteredUsers)
                          ) : (
                            <Table.Tr>
                              <Table.Td colSpan={8}>
                                <div className={classes.emptyState}>
                                  <IconUsers size={32} stroke={1.5} opacity={0.5} />
                                  <Text mt="md" c="dimmed" size="sm">No users found</Text>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  {/* Separate footer outside scrollable area */}
                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {filteredUsers.length} of {totalUsers} users
                      </Text>
                      <Button 
                        variant="subtle" 
                        compact 
                        leftSection={<IconUserPlus size={16} />}
                        onClick={() => setAddModalOpened(true)}
                      >
                        Add New User
                      </Button>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
              
              {/* Apply the same structure to other tab panels */}
              {/* For admins tab */}
              <Tabs.Panel 
                value="admins" 
                className={classes.tabPanel}
                data-active={activeTab === "admins"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer>
                      <Table striped highlightOnHover withTableBorder style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th style={{ width: "5%" }}>ID</Table.Th>
                            <Table.Th style={{ width: "12%" }}>First Name</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Last Name</Table.Th>
                            <Table.Th style={{ width: "15%" }}>Email</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Username</Table.Th>
                            <Table.Th style={{ width: "12%" }}>Role</Table.Th>
                            <Table.Th style={{ width: "26%" }}>Delivery Address</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {renderUserRows(users.filter(user => user.role === "admin"))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  {/* Separate footer outside scrollable area */}
                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {users.filter(user => user.role === "admin").length} admin users
                      </Text>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
              
              {/* For customers tab */}
              <Tabs.Panel 
                value="customers" 
                className={classes.tabPanel}
                data-active={activeTab === "customers"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer>
                      <Table striped highlightOnHover withTableBorder style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th style={{ width: "5%" }}>ID</Table.Th>
                            <Table.Th style={{ width: "12%" }}>First Name</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Last Name</Table.Th>
                            <Table.Th style={{ width: "15%" }}>Email</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Username</Table.Th>
                            <Table.Th style={{ width: "12%" }}>Role</Table.Th>
                            <Table.Th style={{ width: "26%" }}>Delivery Address</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {renderUserRows(users.filter(user => user.role === "customer"))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  {/* Separate footer outside scrollable area */}
                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {users.filter(user => user.role === "customer").length} customer users
                      </Text>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
              
              {/* For new users tab */}
              <Tabs.Panel 
                value="new" 
                className={classes.tabPanel}
                data-active={activeTab === "new"}
              >
                <Box className={classes.tableWrapper}>
                  <Box className={classes.tableContainer}>
                    <Table.ScrollContainer>
                      <Table striped highlightOnHover withTableBorder style={{ borderCollapse: "collapse" }}>
                        <Table.Thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                          <Table.Tr>
                            <Table.Th style={{ width: "5%" }}>ID</Table.Th>
                            <Table.Th style={{ width: "12%" }}>First Name</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Last Name</Table.Th>
                            <Table.Th style={{ width: "15%" }}>Email</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Username</Table.Th>
                            <Table.Th style={{ width: "12%" }}>Role</Table.Th>
                            <Table.Th style={{ width: "26%" }}>Delivery Address</Table.Th>
                            <Table.Th style={{ width: "10%" }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {renderUserRows(users.filter(
                            user => user.date_joined && 
                            new Date(user.date_joined) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  {/* Separate footer outside scrollable area */}
                  <div className={classes.tableFooter}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Showing {users.filter(
                          user => user.date_joined && 
                          new Date(user.date_joined) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length} new users (last 7 days)
                      </Text>
                    </Group>
                  </div>
                </Box>
              </Tabs.Panel>
            </div>
          </Tabs>

          <Modal
            opened={addModalOpened}
            onClose={() => setAddModalOpened(false)}
            title="Add User"
            centered
            size="md"
          >
            <Stack spacing="xs">
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
              <TextInput
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.currentTarget.value })
                }
                required
              />
              <Button onClick={handleAddUser} fullWidth>
                Add User
              </Button>
            </Stack>
          </Modal>

          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title="Edit User"
            centered
            size="md"
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
                  disabled
                  description="Username cannot be changed"
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
                <Button onClick={handleEditUser} fullWidth>
                  Update User
                </Button>
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
              <Text>Are you sure you want to delete this user?</Text>
              <Text fw={700}>
                {selectedUser
                  ? `${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.username})`
                  : ""}
              </Text>
              <Text size="sm" c="dimmed">
                This action cannot be undone.
              </Text>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpened(false)}
                >
                  Cancel
                </Button>
                <Button color="red" onClick={handleDeleteUser}>
                  Delete User
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Add extra spacing before footer */}
          <Box className={classes.footerSpacer} />
          
          {/* Add the footer component */}
          <AdminFooter />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default withRoleProtection(UserManagementPage, ["admin"]);