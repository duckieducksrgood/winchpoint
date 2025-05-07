import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { 
  AppShell, Container, Title, Card, Text, Group, Avatar, Loader, Button, 
  TextInput, Stack, Tabs, Divider, Paper, Box, Transition, Grid, 
  ThemeIcon, Badge, ActionIcon, rem, Table, LoadingOverlay, Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection, { useUserStore } from "../../utils/auth";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import { 
  IconAlertCircle, IconUser, IconMail, IconMapPin, IconId, IconEdit, 
  IconUserCircle, IconHistory, IconShield, IconDeviceFloppy,
  IconX, IconBuildingStore, IconUserCheck, IconSettings, IconCheck, IconPhoto
} from "@tabler/icons-react";
import classes from "./myaccount.module.css";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  delivery_address: string;
}

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

const MyAccount = () => {
  const [openedNav, setOpenedNav] = useState(false);
  const { user } = useUserStore();
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<User | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("profile");
  const [visible, { toggle }] = useDisclosure(true);

  // Fetch all users
  const { data: users = [], isLoading, mutate } = useSWR<User[]>("users/", fetcher);

  // Debug logs
  console.log("Auth store user:", user);
  console.log("All users:", users);

  // If no user in store, check JWT token from browser cookies
  useEffect(() => {
    const checkToken = async () => {
      try {
        const { data } = await axios.get("fetchdecodedtoken/");
        if (data && data.username) {
          console.log("Found username from token:", data.username);
          setSelectedUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    if (!user?.username && !selectedUsername) {
      checkToken();
    } else if (user?.username && !selectedUsername) {
      setSelectedUsername(user.username);
    }
  }, [user, selectedUsername]);

  // Using the selectedUsername to find the current user
  const currentUser = React.useMemo(() => {
    if (!users.length || (!selectedUsername && !user?.username)) {
      return null;
    }

    // Try to find by selectedUsername first, then fall back to user.username
    const username = selectedUsername || user?.username;
    let found = users.find(u => u.username === username);

    // Fallback for development
    if (!found && process.env.NODE_ENV === 'development') {
      found = users.find(u => u.username === 'test') || users[0];
      console.log("Using fallback user for development:", found?.username);
    }

    return found || null;
  }, [users, user, selectedUsername]);

  // Move the orders fetching here, AFTER currentUser is defined
  const { data: orders = [], isLoadingOrders } = useSWR<IOrder[]>(
    currentUser ? "orders/" : null, 
    fetcher
  );

  // Set the temp profile when we have a current user
  useEffect(() => {
    if (currentUser && !tempProfile) {
      setTempProfile(currentUser);
    }
  }, [currentUser, tempProfile]);

  // Update profile function
  const handleUpdateProfile = async () => {
    if (!tempProfile || !currentUser) return;

    try {
      await axios.put(`users/?user_id=${currentUser.id}`, {
        first_name: tempProfile.first_name,
        last_name: tempProfile.last_name,
        email: tempProfile.email,
        delivery_address: tempProfile.delivery_address || "",
      });

      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "teal",
        icon: <IconUserCheck size={16} />,
      });

      await mutate(); // Refresh users list
      setEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update profile",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  // User selector for development/testing
  const handleSelectUser = (username: string) => {
    setSelectedUsername(username);
    setTempProfile(null); // Reset temp profile when changing users
  };

  useEffect(() => {
    // If user is admin and the active tab is "history", switch to "profile"
    if (currentUser && currentUser.role === "admin" && activeTab === "history") {
      setActiveTab("profile");
    }
  }, [currentUser, activeTab]);

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

      <AppShell.Main bg={"transparent"} className={classes.accountBackground}>
        <Container size="lg" pt={60} pb={50}>
          <Paper shadow="sm" p="md" radius="md" mb={30} 
                 className={classes.fadeInFirst}
                 style={{ 
                   background: 'linear-gradient(45deg, #2c8898, #134e4a)', 
                   color: 'white' 
                 }}>
            <Group position="apart">
              <Group>
                <ThemeIcon size={36} radius="xl" variant="light" color="blue">
                  <IconUserCircle size={24} />
                </ThemeIcon>
                <div>
                  <Title order={2} ff="'Montserrat', sans-serif" fw={600}>
                    My Account
                  </Title>
                  <Text size="sm" c="rgba(255,255,255,0.8)" ff="'Open Sans', sans-serif">
                    Manage your personal information and settings
                  </Text>
                </div>
              </Group>
              {currentUser && (
                <Badge size="lg" radius="sm" variant="outline" color="blue">
                  {currentUser.role.toUpperCase()}
                </Badge>
              )}
            </Group>
          </Paper>

          {isLoading && (
            <Card p="xl" radius="md" withBorder shadow="sm" className={classes.fadeInSecond}>
              <Group position="center">
                <Loader size="lg" color="teal" />
                <Text size="lg" fw={500} c="dimmed">Loading account information...</Text>
              </Group>
            </Card>
          )}

          {!currentUser && !isLoading && (
            <Card shadow="sm" p="lg" radius="md" withBorder mb={20} bg="#FEF9E7"
                  className={classes.fadeInSecond}>
              <Group>
                <ThemeIcon color="yellow" size={40} radius="md">
                  <IconAlertCircle size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={600} mb={5} size="lg">User information not found</Text>
                  <Text size="sm">Please select a user from the list below:</Text>
                </div>
              </Group>
              <Group mt="lg">
                {users.map(u => (
                  <Button 
                    key={u.username}
                    variant={selectedUsername === u.username ? "filled" : "outline"}
                    onClick={() => handleSelectUser(u.username)}
                    size="sm"
                    radius="md"
                    color="blue"
                    leftSection={<IconUser size={14} />}
                    className={classes.socialLink}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    {u.username}
                  </Button>
                ))}
              </Group>
            </Card>
          )}

          {currentUser && (
            <Tabs value={activeTab} onChange={setActiveTab} radius="xs" 
                  mb={20} className={classes.fadeInSecond}>
              <Tabs.List grow>
                <Tabs.Tab value="profile" leftSection={<IconUser size={16}/>}>
                  Profile
                </Tabs.Tab>
                
                {/* Only show Order History tab if user is NOT admin */}
                {currentUser.role !== "admin" && (
                  <Tabs.Tab value="history" leftSection={<IconHistory size={16}/>}>
                    Order History
                  </Tabs.Tab>
                )}
                
                <Tabs.Tab value="settings" leftSection={<IconSettings size={16}/>}>
                  Settings
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          )}

          {currentUser && !editing && activeTab === "profile" && (
            <Transition mounted={true} transition="fade" duration={400} timingFunction="ease">
              {(styles) => (
                <Card shadow="sm" p="lg" radius="md" withBorder style={styles}
                      className={classes.fadeInThird}>
                  <Group position="apart" mb={20}>
                    <Title order={3} fw={600} ff="'Montserrat', sans-serif">
                      Personal Information
                    </Title>
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="lg"
                      onClick={() => setEditing(true)}
                      className={classes.socialIcon}
                    >
                      <IconEdit size={20} />
                    </ActionIcon>
                  </Group>
                  
                  <Grid gutter={30}>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Box ta="center" mb={10}>
                        <Avatar
                          radius="xl"
                          size={120}
                          color="blue"
                          className={classes.avatar}
                          style={{ 
                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            border: '4px solid white',
                            margin: '0 auto 15px',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                        </Avatar>
                        <Text fw={700} size="lg" ff="'Montserrat', sans-serif">
                          {currentUser.first_name} {currentUser.last_name}
                        </Text>
                        <Text c="dimmed" size="sm">@{currentUser.username}</Text>
                      </Box>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 8 }}>
                      <Stack spacing="lg">
                        <Paper p="md" radius="md" withBorder>
                          <Group spacing="xs" mb={5}>
                            <IconMail size={18} color="#2c8898" />
                            <Text fw={600} size="sm">Email Address</Text>
                          </Group>
                          <Text>{currentUser.email}</Text>
                        </Paper>
                        
                        <Paper p="md" radius="md" withBorder>
                          <Group spacing="xs" mb={5}>
                            <IconId size={18} color="#2c8898" />
                            <Text fw={600} size="sm">Username</Text>
                          </Group>
                          <Text>{currentUser.username}</Text>
                        </Paper>
                        
                        <Paper p="md" radius="md" withBorder>
                          <Group spacing="xs" mb={5}>
                            <IconShield size={18} color="#2c8898" />
                            <Text fw={600} size="sm">Account Type</Text>
                          </Group>
                          <Badge color="blue" size="md">
                            {currentUser.role.toUpperCase()}
                          </Badge>
                        </Paper>
                        
                        <Paper p="md" radius="md" withBorder>
                          <Group spacing="xs" mb={5}>
                            <IconMapPin size={18} color="#2c8898" />
                            <Text fw={600} size="sm">Delivery Address</Text>
                          </Group>
                          <Text>{currentUser.delivery_address || "No address provided"}</Text>
                        </Paper>
                      </Stack>
                    </Grid.Col>
                  </Grid>

                  <Divider my={20} />
                  
                  <Group position="center">
                    <Button
                      onClick={() => setEditing(true)}
                      variant="gradient"
                      gradient={{ from: 'teal', to: '#2c8898', deg: 45 }}
                      radius="md"
                      leftSection={<IconEdit size={16} />}
                      className={classes.loginButton}
                      style={{
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Edit Profile
                    </Button>
                  </Group>
                </Card>
              )}
            </Transition>
          )}

          {currentUser && activeTab === "profile" && editing && tempProfile && (
            <Card shadow="md" p="lg" radius="md" withBorder className={classes.fadeInThird}>
              <Group position="apart" mb={20}>
                <Title order={3} fw={600} ff="'Montserrat', sans-serif">
                  Edit Profile
                </Title>
              </Group>

              <Stack spacing="md">
                <Grid gutter={20}>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="First Name"
                      placeholder="Your first name"
                      icon={<IconUser size={16} />}
                      value={tempProfile.first_name}
                      onChange={(e) => setTempProfile({ ...tempProfile, first_name: e.currentTarget.value })}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Last Name"
                      placeholder="Your last name"
                      icon={<IconUser size={16} />}
                      value={tempProfile.last_name}
                      onChange={(e) => setTempProfile({ ...tempProfile, last_name: e.currentTarget.value })}
                    />
                  </Grid.Col>
                </Grid>

                <TextInput
                  label="Email"
                  placeholder="Your email address"
                  icon={<IconMail size={16} />}
                  value={tempProfile.email}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.currentTarget.value })}
                />

                <TextInput
                  label="Username"
                  placeholder="Your username"
                  icon={<IconId size={16} />}
                  value={tempProfile.username}
                  disabled
                  description="Username cannot be changed"
                />

                <TextInput
                  label="Delivery Address"
                  placeholder="Your delivery address"
                  icon={<IconMapPin size={16} />}
                  value={tempProfile.delivery_address || ""}
                  onChange={(e) => setTempProfile({ ...tempProfile, delivery_address: e.currentTarget.value })}
                />

                <Group position="right" mt={10}>
                  <Button 
                    variant="light" 
                    color="gray"
                    onClick={() => {
                      setEditing(false);
                      setTempProfile(currentUser);
                    }}
                    radius="md"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateProfile}
                    variant="gradient"
                    gradient={{ from: 'teal', to: '#2c8898', deg: 45 }}
                    radius="md"
                    leftSection={<IconDeviceFloppy size={16} />}
                    className={classes.loginButton}
                    style={{
                      transition: 'all 0.3s ease',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </Card>
          )}

          {currentUser && currentUser.role !== "admin" && activeTab === "history" && (
            <Card shadow="sm" p="lg" radius="md" withBorder className={classes.fadeInThird}>
              <Group position="apart" mb={20}>
                <Title order={3} fw={600} ff="'Montserrat', sans-serif">
                  Order History
                </Title>
              </Group>
              
              <LoadingOverlay visible={isLoadingOrders} overlayProps={{ blur: 2 }} />
              
              <Paper p="xs" radius="md" style={{ overflow: 'visible' }}>
                <Tabs variant="pills" radius="md" defaultValue="pending" className={classes.tabs}>
                  <Tabs.List className={classes.tabsList}>
                    <Tabs.Tab
                      value="pending"
                      leftSection={<IconPhoto size={16} />}
                    >
                      Pending
                      {orders?.filter(order => order.status === "Pending").length > 0 && (
                        <Badge color="red" size="sm" variant="filled" ml={5}>
                          {orders.filter(order => order.status === "Pending").length}
                        </Badge>
                      )}
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="completed"
                      leftSection={<IconCheck size={16} />}
                    >
                      Completed
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="cancelled"
                      leftSection={<IconX size={16} />}
                    >
                      Cancelled
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Pending Orders */}
                  <Tabs.Panel value="pending" pt="md">
                    {orders?.filter(order => order.status === "Pending").length === 0 ? (
                      <Paper p="xl" radius="md">
                        <Text ta="center" c="dimmed" size="lg">
                          No pending orders yet!
                        </Text>
                      </Paper>
                    ) : (
                      <Box style={{ overflow: 'auto', maxWidth: '100%' }}>
                        <Table
                          striped
                          highlightOnHover
                          withTableBorder
                          withColumnBorders
                          style={{ minWidth: '100%', tableLayout: 'fixed' }}
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: '8%' }}>ID</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Date</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Total</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Payment</Table.Th>
                              <Table.Th style={{ width: '8%' }}>Paid</Table.Th>
                              <Table.Th style={{ width: '30%' }}>Address</Table.Th>
                              <Table.Th style={{ width: '10%' }}>Tracking</Table.Th>
                              <Table.Th style={{ width: '8%' }}>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {orders
                              .filter(order => order.status === "Pending")
                              .map((order, index) => (
                                <Transition
                                  key={order.id}
                                  mounted={true}
                                  transition="fade"
                                  duration={300}
                                  exitDuration={100}
                                  timingFunction={`cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`} // Stagger animation with delay
                                >
                                  {(styles) => (
                                    <Table.Tr style={{ ...styles, transition: 'all 0.2s ease' }} className={classes.orderRow}>
                                      <Table.Td>{order.id}</Table.Td>
                                      <Table.Td>
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </Table.Td>
                                      <Table.Td style={{ color: '#2c8898', fontWeight: 500 }}>
                                        ₱{order.total_price.toLocaleString()}
                                      </Table.Td>
                                      <Table.Td>{order.payment_method || "N/A"}</Table.Td>
                                      <Table.Td>
                                        {order.proof_of_payment ? (
                                          <ThemeIcon color="green" radius="xl" size="sm">
                                            <IconCheck size={14} />
                                          </ThemeIcon>
                                        ) : (
                                          <ThemeIcon color="red" radius="xl" size="sm">
                                            <IconX size={14} />
                                          </ThemeIcon>
                                        )}
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        {order.order_delivery_address}
                                      </Table.Td>
                                      <Table.Td>
                                        {order.tracking_number ? (
                                          <Text>{order.tracking_number}</Text>
                                        ) : (
                                          <Tooltip label="Awaiting processing">
                                            <Badge color="gray" variant="outline" size="sm">Not assigned</Badge>
                                          </Tooltip>
                                        )}
                                      </Table.Td>
                                      <Table.Td>
                                        {!order.tracking_number && (
                                          <Button
                                            color="red"
                                            size="xs"
                                            variant="outline"
                                            onClick={() => {
                                              // Handle cancel
                                            }}
                                            style={{ 
                                              transition: 'transform 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        )}
                                      </Table.Td>
                                    </Table.Tr>
                                  )}
                                </Transition>
                              ))}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    )}
                  </Tabs.Panel>

                  {/* Completed Orders */}
                  <Tabs.Panel value="completed" pt="md">
                    {orders?.filter(order => order.status === "Completed").length === 0 ? (
                      <Paper p="xl" radius="md">
                        <Text ta="center" c="dimmed" size="lg">
                          No completed orders yet!
                        </Text>
                      </Paper>
                    ) : (
                      <Box style={{ overflow: 'auto', maxWidth: '100%' }}>
                        <Table
                          striped
                          highlightOnHover
                          withTableBorder
                          withColumnBorders
                          style={{ minWidth: '100%', tableLayout: 'fixed' }}
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: '8%' }}>ID</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Date</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Total</Table.Th>
                              <Table.Th style={{ width: '12%' }}>Payment</Table.Th>
                              <Table.Th style={{ width: '8%' }}>Paid</Table.Th>
                              <Table.Th style={{ width: '38%' }}>Address</Table.Th>
                              <Table.Th style={{ width: '10%' }}>Tracking</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {orders
                              .filter(order => order.status === "Completed")
                              .map((order, index) => (
                                <Transition
                                  key={order.id}
                                  mounted={true}
                                  transition="fade"
                                  duration={300}
                                  exitDuration={100}
                                  timingFunction={`cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`}
                                >
                                  {(styles) => (
                                    <Table.Tr style={{ ...styles, transition: 'all 0.2s ease' }}>
                                      <Table.Td>{order.id}</Table.Td>
                                      <Table.Td>
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </Table.Td>
                                      <Table.Td style={{ color: '#2c8898', fontWeight: 500 }}>
                                        ₱{order.total_price.toLocaleString()}
                                      </Table.Td>
                                      <Table.Td>{order.payment_method || "N/A"}</Table.Td>
                                      <Table.Td>
                                        <ThemeIcon color="green" radius="xl" size="sm">
                                          <IconCheck size={14} />
                                        </ThemeIcon>
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        {order.order_delivery_address}
                                      </Table.Td>
                                      <Table.Td>{order.tracking_number}</Table.Td>
                                    </Table.Tr>
                                  )}
                                </Transition>
                              ))}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    )}
                  </Tabs.Panel>

                  {/* Cancelled Orders */}
                  <Tabs.Panel value="cancelled" pt="md">
                    {orders?.filter(order => order.status === "Cancelled").length === 0 ? (
                      <Paper p="xl" radius="md">
                        <Text ta="center" c="dimmed" size="lg">
                          No cancelled orders yet!
                        </Text>
                      </Paper>
                    ) : (
                      <Box style={{ overflow: 'auto', maxWidth: '100%' }}>
                        <Table
                          striped
                          highlightOnHover
                          withTableBorder
                          withColumnBorders
                          style={{ minWidth: '100%', tableLayout: 'fixed' }}
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: '10%' }}>ID</Table.Th>
                              <Table.Th style={{ width: '20%' }}>Date</Table.Th>
                              <Table.Th style={{ width: '25%' }}>Total</Table.Th>
                              <Table.Th style={{ width: '25%' }}>Payment</Table.Th>
                              <Table.Th style={{ width: '20%' }}>Status</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {orders
                              .filter(order => order.status === "Cancelled")
                              .map((order, index) => (
                                <Transition
                                  key={order.id}
                                  mounted={true}
                                  transition="fade"
                                  duration={300}
                                  exitDuration={100}
                                  delay={index * 50}
                                >
                                  {(styles) => (
                                    <Table.Tr style={{ ...styles, transition: 'all 0.2s ease' }}>
                                      <Table.Td>{order.id}</Table.Td>
                                      <Table.Td>
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </Table.Td>
                                      <Table.Td style={{ color: '#2c8898', fontWeight: 500 }}>
                                        ₱{order.total_price.toLocaleString()}
                                      </Table.Td>
                                      <Table.Td>{order.payment_method || "N/A"}</Table.Td>
                                      <Table.Td>
                                        <Badge color="red" variant="filled">
                                          Cancelled
                                        </Badge>
                                      </Table.Td>
                                    </Table.Tr>
                                  )}
                                </Transition>
                              ))}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    )}
                  </Tabs.Panel>
                </Tabs>
              </Paper>
            </Card>
          )}

          {currentUser && activeTab === "settings" && (
            <Card shadow="sm" p="lg" radius="md" withBorder className={classes.fadeInThird}>
              <Group justify="apart" mb={20}>
                <Title order={3} fw={600} ff="'Montserrat', sans-serif">
                  Account Settings
                </Title>
                <Badge size="lg" color="blue">Coming Soon</Badge>
              </Group>
              <Group justify="center" py={50}>
                <Stack gap="md" align="center">
                  <ThemeIcon size={60} radius="md" color="gray.3">
                    <IconSettings size={40} />
                  </ThemeIcon>
                  <Text ta="center" c="dimmed">
                    Account settings will be available soon.
                  </Text>
                </Stack>
              </Group>
            </Card>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default withRoleProtection(MyAccount, ["customer", "admin"]);