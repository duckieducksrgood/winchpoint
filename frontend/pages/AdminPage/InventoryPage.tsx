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
  Container,
  Image,
  TextInput,
  NumberInput,
  Select,
  FileInput,
  LoadingOverlay,
  Title,
  Menu,
  AppShell,
  UnstyledButton,
  Autocomplete,
  Paper,
  SimpleGrid,
  ThemeIcon,
  Box,
  Progress,
  Switch,
  ScrollArea,
  Tooltip,
  Input // Add this import
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconEdit,
  IconPlus,
  IconChevronDown,
  IconPackage,
  IconSquareCheck,
  IconUsers,
  IconCalendar,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconBoxMultiple,
  IconCategory,
  IconShoppingCart,
  IconTags,
  IconPackageImport,
  // Add these new imports for sorting
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection from "../../utils/auth";
import classes from "./styles/InventoryPage.module.css";
import AdminFooter from "../../components/AdminComponents/AdminFooter";

interface Product {
  productID: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  subCategory: string;
}

interface Category {
  categoryID: number;
  name: string;
  description: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Animated counter component for dynamic number displays
const AnimatedCounter = ({ value, formatter = (val) => val }) => {
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
  }, [value]);
  
  return <>{formatter(count)}</>;
};

const InventoryPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [categoryModalOpened, setCategoryModalOpened] = useState(false);
  const [categoryEditModalOpened, setCategoryEditModalOpened] = useState(false);
  const [categoryDeleteModalOpened, setCategoryDeleteModalOpened] =
    useState(false);
  const [inventoryInfoModalOpened, setInventoryInfoModalOpened] = useState(false); // Add this state for the new modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    image: null,
    subCategory: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [visible, setVisible] = useState(false);
  const [openedNav, setOpenedNav] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data: products = [],
    error,
    mutate: mutateProducts,
  } = useSWR<Product[]>("inventory/", fetcher);
  
  const {
    data: categories = [], 
    error: categoryError,
    mutate: mutateCategories
  } = useSWR<Category[]>("category/", fetcher);

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch inventory",
      color: "red",
    });
  }
  
  if (categoryError) {
    notifications.show({
      title: "Error",
      message: categoryError.response?.data?.message || "Failed to fetch categories",
      color: "red",
    });
  }

  // Calculate key metrics for dashboard
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const lowStockProducts = products.filter(p => p.stock <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  
  // Calculate total inventory value
  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, product) => {
      const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0;
      const stock = typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock)) || 0;
      return sum + (price * stock);
    }, 0);
  }, [products]);
  
  // Categories with most products
  const topCategories = useMemo(() => {
    const categoryCounts = categories.map(category => {
      const count = products.filter(p => p.category === category.name).length;
      return { ...category, count };
    });
    return [...categoryCounts].sort((a, b) => b.count - a.count);
  }, [categories, products]);

  // Filter products based on search, category, and stock filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.productID.toString().includes(searchTerm);
        
      const matchesCategory = !filterCategory || product.category === filterCategory;
      const matchesLowStock = !showLowStock || product.stock <= 10;
      
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, filterCategory, showLowStock]);

  const sortData = <T extends Record<string, any>>(data: T[], field: string | null, direction: 'asc' | 'desc'): T[] => {
    if (!field) return data;
    
    return [...data].sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      // Handle string comparison case-insensitively
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      // Handle undefined or null values
      if (valueA === undefined || valueA === null) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined || valueB === null) return direction === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <IconArrowsSort size={14} opacity={0.5} />;
    return sortDirection === 'asc' ? 
      <IconSortAscending size={14} /> : 
      <IconSortDescending size={14} />;
  };

  const sortedProducts = useMemo(() => {
    return sortData(filteredProducts, sortField, sortDirection);
  }, [filteredProducts, sortField, sortDirection]);

  const sortedCategories = useMemo(() => {
    return sortData(categories, sortField, sortDirection);
  }, [categories, sortField, sortDirection]);

  const inventoryValueDetails = useMemo(() => {
    // Calculate inventory value by category
    const valueByCategory = categories.reduce((acc, category) => {
      const productsInCategory = products.filter(p => p.category === category.name);
      const categoryValue = productsInCategory.reduce((sum, product) => {
        const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0;
        const stock = typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock)) || 0;
        return sum + (price * stock);
      }, 0);
      
      return { ...acc, [category.name]: categoryValue };
    }, {});
    
    // Top products by value
    const productsByValue = [...products].map(product => ({
      ...product,
      totalValue: product.price * product.stock
    })).sort((a, b) => b.totalValue - a.totalValue);
    
    return {
      valueByCategory,
      topProducts: productsByValue.slice(0, 10),
      averageProductValue: totalInventoryValue / (products.length || 1)
    };
  }, [products, categories, totalInventoryValue]);

  const handleAddProduct = async () => {
    setVisible(true);

    let imageUrl: string | null = newProduct.image;

    if (files.length > 0) {
      const file = files[0];
      try {
        const response = await axios.post("generate-presigned-url/", {
          file_name: file.name,
          file_type: file.type,
        });

        const { url, fields } = response.data;

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append("file", file);

        await axios.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = `${url}/${fields.key}`;
      } catch (error) {
        notifications.show({
          message: "Failed to upload image",
          color: "red",
        });
        setVisible(false);
        return;
      }
    }

    try {
      await axios.post("inventory/", {
        ...newProduct,
        image: files.length > 0 ? files[0].name : newProduct.image,
      });
      notifications.show({
        message: "Product added successfully",
        color: "green",
      });
      setAddModalOpened(false);
      mutateProducts();
      setVisible(false);
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
        image: null,
        subCategory: "",
      });
      setFiles([]);
    } catch (error) {
      notifications.show({
        message: "Failed to add product",
        color: "red",
      });
      setVisible(false);
    }
  };

  const handleEditProduct = async () => {
    setVisible(true);

    if (!selectedProduct) return;

    let imageUrl = selectedProduct.image;

    if (files.length > 0) {
      const file = files[0];
      try {
        const response = await axios.post("generate-presigned-url/", {
          file_name: file.name,
          file_type: file.type,
        });

        const { url, fields } = response.data;

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append("file", file);

        await axios.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = `${url}/${fields.key}`;
      } catch (error) {
        notifications.show({
          message: "Failed to upload image",
          color: "red",
        });
        setVisible(false);
        return;
      }
    }

    try {
      const response = await axios.put("inventory/", {
        ...selectedProduct,
        productID: selectedProduct.productID,
        image: files.length > 0 ? files[0].name : selectedProduct.image,
      });
      notifications.show({
        message: "Product updated successfully",
        color: "green",
      });
      setEditModalOpened(false);
      mutateProducts();
      setVisible(false);
      setFiles([]);
    } catch (error) {
      notifications.show({
        message: "Failed to update product",
        color: "red",
      });
      setVisible(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await axios.delete("inventory/", {
        data: { productID: selectedProduct.productID },
      });
      notifications.show({
        message: "Product deleted successfully",
        color: "green",
      });
      setDeleteModalOpened(false);
      mutateProducts();
    } catch (error) {
      notifications.show({
        message: "Failed to delete product",
        color: "red",
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const response = await axios.post("category/", newCategory);
      notifications.show({
        message: "Category added successfully",
        color: "green",
      });
      setCategoryModalOpened(false);
      mutateCategories();
      setNewCategory({ name: "", description: "" });
    } catch (error) {
      notifications.show({
        message: "Failed to add category",
        color: "red",
      });
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await axios.put(`category/`, selectedCategory);
      notifications.show({
        message: "Category updated successfully",
        color: "green",
      });
      setCategoryEditModalOpened(false);
      mutateCategories();
      setNewCategory({ name: "", description: "" });
    } catch (error) {
      notifications.show({
        message: "Failed to update category",
        color: "red",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await axios.delete(`category/`, {
        data: { categoryID: selectedCategory.categoryID },
      });
      notifications.show({
        message: "Category deleted successfully",
        color: "green",
      });
      setCategoryDeleteModalOpened(false);
      mutateCategories();
    } catch (error) {
      notifications.show({
        message: "Failed to delete category",
        color: "red",
      });
    }
  };

  const renderProductRows = (products: Product[]) => {
    return products.map((product, index) => {
      const isLowStock = product.stock <= 5;
      const isOutOfStock = product.stock === 0;
      const delayClass = index < 10 ? classes[`rowDelay${index+1}`] : '';
      
      return (
        <Table.Tr key={product.productID} className={`${classes.tableRow} ${delayClass}`}>
          <Table.Td>{product.productID}</Table.Td>
          <Table.Td>
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name}
              width={50}
              height={50}
              radius="md"
              fit="contain"
              withPlaceholder
            />
          </Table.Td>
          <Table.Td>
            <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
              <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={product.name}>
                {product.name}
              </Text>
              {isOutOfStock && (
                <Badge color="red" size="xs" variant="filled">OUT</Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge color="orange" size="xs" variant="filled">LOW</Badge>
              )}
            </Group>
          </Table.Td>
          <Table.Td style={{ maxWidth: "200px" }}>
            <Text style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={product.description}>
              {product.description || "N/A"}
            </Text>
          </Table.Td>
          <Table.Td>₱{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price) || '0').toFixed(2)}</Table.Td>
          <Table.Td>
            <Text c={isOutOfStock ? "red" : isLowStock ? "orange" : undefined} fw={isLowStock ? 700 : undefined}>
              {product.stock}
            </Text>
          </Table.Td>
          <Table.Td>
            <Badge color="blue" variant="light">
              {product.category || "N/A"}
            </Badge>
          </Table.Td>
          <Table.Td>
            <Badge color="cyan" variant="light">
              {product.subCategory || "N/A"}
            </Badge>
          </Table.Td>
          <Table.Td>
            <Group gap={4} wrap="nowrap">
              <Tooltip label="Edit Product">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => {
                    setSelectedProduct(product);
                    setEditModalOpened(true);
                  }}
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete Product">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    setSelectedProduct(product);
                    setDeleteModalOpened(true);
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
      );
    });
  };

  const renderCategoryRows = (categories: Category[]) => {
    return categories.map((category, index) => {
      const productCount = products.filter(p => p.category === category.name).length;
      const delayClass = index < 10 ? classes[`rowDelay${index+1}`] : '';
      
      return (
        <Table.Tr key={category.categoryID} className={`${classes.tableRow} ${delayClass}`}>
          <Table.Td>{category.categoryID}</Table.Td>
          <Table.Td>{category.name}</Table.Td>
          <Table.Td style={{ maxWidth: "300px" }}>
            <Text style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={category.description}>
              {category.description || "N/A"}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" c="dimmed">{productCount} product{productCount !== 1 ? 's' : ''}</Text>
          </Table.Td>
          <Table.Td>
            <Group gap={4} wrap="nowrap">
              <Tooltip label="Edit Category">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCategoryEditModalOpened(true);
                  }}
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete Category">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCategoryDeleteModalOpened(true);
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
      );
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

      <AppShell.Main className={classes.main}>
        <Container size="xl" pt={80} pb={30} className={classes.container}>
          {/* Welcome Card with Stats */}
          <Paper radius="md" p="xl" mb="lg" withBorder className={classes.welcomeCard}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
              {/* Title Section */}
              <Box style={{ gridColumn: 'span 1 / span 2' }}>
                <Group align="center" noWrap>
                  <ThemeIcon size={48} radius="md" className={classes.dashboardIcon}>
                    <IconPackage size={24} />
                  </ThemeIcon>
                  <div>
                    <Text size="lg" fw={600} className={classes.fadeIn}>Inventory Management</Text>
                    <Title order={2} className={classes.heroTitle}>
                      Manage Products & Categories
                    </Title>
                    <Text size="sm" c="dimmed" className={classes.fadeInSecond} mt={5}>
                      Track inventory, manage products and organize categories efficiently
                    </Text>
                  </div>
                </Group>
              </Box>
              
              {/* Stat Cards */}
              <Paper withBorder p="md" radius="md" shadow="xs" className={classes.statCard}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" className={classes.statTitle}>Total Products</Text>
                  <ThemeIcon size={24} radius="xl" color="teal">
                    <IconBoxMultiple size={16} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt={20}>
                  <Title order={3} className={classes.counterNumber}>
                    <AnimatedCounter value={totalProducts} />
                  </Title>
                </Group>
                
                <Box mt={15}>
                  <Group position="apart" mb={5}>
                    <Text size="xs" c="dimmed">Available Stock</Text>
                    <Text size="xs" fw={500}>
                      {Math.round(((totalProducts - lowStockProducts) / totalProducts) * 100)}%
                    </Text>
                  </Group>
                  <Progress 
                    value={(totalProducts - lowStockProducts) / totalProducts * 100} 
                    size="xs" 
                    color="teal" 
                    radius="xl"
                  />
                </Box>
              </Paper>
              
              <Paper withBorder p="md" radius="md" shadow="xs" className={classes.statCard}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" className={classes.statTitle}>Low Stock Items</Text>
                  <ThemeIcon size={24} radius="xl" color="orange">
                    <IconPackageImport size={16} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt={20}>
                  <Title order={3} c="orange" className={classes.counterNumber}>
                    <AnimatedCounter value={lowStockProducts} />
                  </Title>
                  <Text c="orange" fz="sm" fw={500}>
                    <span>({Math.round((lowStockProducts / totalProducts) * 100)}%)</span>
                  </Text>
                </Group>
                
                <Box mt={15}>
                  <Group position="apart" mb={5}>
                    <Text size="xs" c="dimmed">Need Restock</Text>
                    <Text size="xs" fw={500} c="red">
                      {outOfStockProducts} out of stock
                    </Text>
                  </Group>
                  <Progress 
                    value={lowStockProducts / totalProducts * 100} 
                    size="xs" 
                    color="orange" 
                    radius="xl"
                  />
                </Box>
              </Paper>
              
              <Paper 
                withBorder 
                p="md" 
                radius="md" 
                shadow="xs" 
                className={classes.statCard}
                style={{ cursor: 'pointer' }}
                onClick={() => setInventoryInfoModalOpened(true)}
              >
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" className={classes.statTitle}>Inventory Value</Text>
                  <Group gap={4}>
                    <ThemeIcon size={24} radius="xl" color="grape">
                      <IconTags size={16} />
                    </ThemeIcon>
                    <IconChevronDown size={14} opacity={0.7} />
                  </Group>
                </Group>
                <Group align="flex-end" gap="xs" mt={20}>
                  <Title order={3} className={classes.counterNumber}>
                    <AnimatedCounter 
                      value={Math.floor(totalInventoryValue)} 
                      formatter={(val) => `₱${val.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`}
                    />
                  </Title>
                </Group>
                
                <Group position="apart" mt={15}>
                  <Text size="xs" c="dimmed">Categories</Text>
                  <Badge size="sm" radius="sm">{totalCategories}</Badge>
                </Group>
              </Paper>
            </SimpleGrid>
          </Paper>
          
          {/* Category Cards */}
          <Paper withBorder p="md" radius="md" mb="lg" className={classes.fadeInThird}>
            <Group justify="space-between" mb="lg">
              <Text fw={700} size="lg">Top Categories ({categories.length})</Text>
              <Button 
                variant="light" 
                leftSection={<IconPlus size={16} />} 
                onClick={() => setCategoryModalOpened(true)}
              >
                Add Category
              </Button>
            </Group>
            
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
              {topCategories.slice(0, 8).map((category) => {
                const productCount = products.filter(p => p.category === category.name).length;
                return (
                  <Paper
                    key={category.categoryID}
                    withBorder
                    p="sm"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setFilterCategory(category.name);
                      setActiveTab("products");
                    }}
                    className={classes.categoryCard}
                  >
                    <Group position="apart" noWrap>
                      <Text fw={600} size="sm" truncate>{category.name}</Text>
                      <Badge size="sm">{productCount}</Badge>
                    </Group>
                    <Text size="xs" color="dimmed" lineClamp={2} mt={4}>
                      {category.description || "No description"}
                    </Text>
                    <Progress 
                      value={productCount / (totalProducts || 1) * 100} 
                      size="xs" 
                      mt={10} 
                      color="blue" 
                      radius="xl"
                    />
                    <Group position="right" mt={8} spacing={5}>
                      <ActionIcon 
                        size="sm" 
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(category);
                          setCategoryEditModalOpened(true);
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Paper>

          {/* Integrated Tabs & Table Section */}
          <Card withBorder radius="md" p="lg" className={classes.fadeInFourth}>
            <Group justify="space-between" mb="lg">
              <Title order={3}>Inventory Management</Title>
              <Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => { 
                    if (activeTab === "products") {
                      setNewProduct({ name: "", description: "", price: 0, stock: 0, category: "", image: null, subCategory: "" });
                      setAddModalOpened(true);
                    } else {
                      setNewCategory({ name: "", description: "" });
                      setCategoryModalOpened(true);
                    }
                  }}
                  color="teal"
                  variant="filled"
                >
                  Add {activeTab === "products" ? "Product" : "Category"}
                </Button>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => activeTab === "products" ? mutateProducts() : mutateCategories()}
                  variant="light"
                >
                  Refresh
                </Button>
              </Group>
            </Group>

            {/* Enhanced Search and Filter Bar - Styled like UserManagementPage */}
            <Paper shadow="xs" p="sm" mb={16} withBorder className={classes.fadeInThird}>
              <Group gap="xs" align="center">
                <Input
                  placeholder="Search products..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  style={{ flexGrow: 1 }}
                />
                
                <Select
                  placeholder="Filter by category"
                  leftSection={<IconFilter size={16} />}
                  data={[
                    { value: '', label: 'All Categories' },
                    ...categories.map((category) => ({
                      value: category.name,
                      label: category.name,
                    }))
                  ]}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  clearable
                  style={{ width: "180px" }}
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
                    label={<Text size="sm" fw={500}>Low stock only</Text>}
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.currentTarget.checked)}
                    labelPosition="left"
                    color="orange"
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
                
                <Button
                  variant="subtle"
                  leftSection={<IconFilter size={16} />}
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory(null);
                    setShowLowStock(false);
                  }}
                >
                  Clear Filters
                </Button>
              </Group>
            </Paper>

            {/* Table with Integrated Tabs */}
            <Box className={classes.tableWrapper}>
              {/* Tab buttons inside table header */}
              <Box className={classes.tableTabHeader}>
                <Group>
                  <UnstyledButton 
                    className={`${classes.tableTab} ${activeTab === "products" ? classes.tableTabActive : ''}`}
                    onClick={() => setActiveTab("products")}
                  >
                    <Group gap={8}>
                      <IconBoxMultiple size={16} />
                      <span>Products</span>
                      <Badge size="sm" variant="filled" radius="xl">{products.length}</Badge>
                    </Group>
                  </UnstyledButton>
                  <UnstyledButton 
                    className={`${classes.tableTab} ${activeTab === "categories" ? classes.tableTabActive : ''}`}
                    onClick={() => setActiveTab("categories")}
                  >
                    <Group gap={8}>
                      <IconCategory size={16} />
                      <span>Categories</span>
                      <Badge size="sm" variant="filled" radius="xl">{categories.length}</Badge>
                    </Group>
                  </UnstyledButton>
                </Group>
              </Box>
              
              {/* Table Container with fixed height */}
              <Box className={classes.tableContainer}>
                {activeTab === "products" ? (
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead className={classes.tableHeader} style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <Table.Tr>
                        <Table.Th onClick={() => handleSort('productID')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>ID</span>
                            {getSortIcon('productID')}
                          </Group>
                        </Table.Th>
                        <Table.Th>Image</Table.Th>
                        <Table.Th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Name</span>
                            {getSortIcon('name')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Description</span>
                            {getSortIcon('description')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Price</span>
                            {getSortIcon('price')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Stock</span>
                            {getSortIcon('stock')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Category</span>
                            {getSortIcon('category')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('subCategory')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Sub Category</span>
                            {getSortIcon('subCategory')}
                          </Group>
                        </Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredProducts.length > 0 ? 
                        renderProductRows(sortedProducts) : 
                        <Table.Tr>
                          <Table.Td colSpan={9} align="center">
                            <div className={classes.emptyState}>
                              <IconBoxMultiple size={32} stroke={1.5} opacity={0.5} />
                              <Text mt="md" c="dimmed" size="sm">No products found. Try adjusting your filters.</Text>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      }
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead className={classes.tableHeader} style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <Table.Tr>
                        <Table.Th onClick={() => handleSort('categoryID')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>ID</span>
                            {getSortIcon('categoryID')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Name</span>
                            {getSortIcon('name')}
                          </Group>
                        </Table.Th>
                        <Table.Th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                          <Group position="apart" noWrap>
                            <span>Description</span>
                            {getSortIcon('description')}
                          </Group>
                        </Table.Th>
                        <Table.Th>Products</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {categories.length > 0 ? 
                        renderCategoryRows(sortedCategories) : 
                        <Table.Tr>
                          <Table.Td colSpan={5} align="center">
                            <div className={classes.emptyState}>
                              <IconCategory size={32} stroke={1.5} opacity={0.5} />
                              <Text mt="md" c="dimmed" size="sm">No categories found.</Text>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      }
                    </Table.Tbody>
                  </Table>
                )}
              </Box>
              
              {/* Table Footer */}
              <div className={classes.tableFooter}>
                <Group justify="space-between">
                  {activeTab === "products" ? (
                    <>
                      <Text size="sm" c="dimmed">
                        Showing {sortedProducts.length} of {products.length} products
                      </Text>
                      <Group gap={8}>
                        <Text size="sm" c="dimmed">Low Stock:</Text>
                        <Badge color="orange" size="sm">{lowStockProducts}</Badge>
                        <Text size="sm" c="dimmed" ml={8}>Out of Stock:</Text>
                        <Badge color="red" size="sm">{outOfStockProducts}</Badge>
                      </Group>
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Total {categories.length} categories
                    </Text>
                  )}
                </Group>
              </div>
            </Box>
          </Card>

          {/* Modals */}
          {/* Add Product Modal */}
          <Modal
            opened={addModalOpened}
            onClose={() => setAddModalOpened(false)}
            title={<Text fw={700} size="lg">Add New Product</Text>}
            centered
            size="md"
          >
            <Stack spacing="md">
              <TextInput
                label="Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.currentTarget.value })
                }
                required
              />
              <TextInput
                label="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.currentTarget.value,
                  })
                }
              />
              <NumberInput
                label="Price (₱)"
                value={newProduct.price}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, price: Number(value) || 0 })
                }
                required
                min={0}
                precision={2}
                prefixSections={<Text size="sm">₱</Text>}
              />
              <NumberInput
                label="Stock"
                value={newProduct.stock}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, stock: Number(value) || 0 })
                }
                required
                min={0}
              />
              <Select
                label="Category"
                data={categories.map((category) => ({
                  value: category.name,
                  label: category.name,
                }))}
                value={
                  newProduct.category ? newProduct.category.toString() : ""
                }
                onChange={(value) => {
                  setNewProduct({
                    ...newProduct,
                    category: value || "",
                  });
                }}
                clearable
                required
              />
              <Autocomplete
                label="Sub Category (Optional)"
                data={Array.from(
                  new Set(products.filter(p => p.subCategory).map((product) => product.subCategory))
                ).map((subCategory) => ({
                  value: subCategory,
                  label: subCategory,
                }))}
                placeholder="Select sub category or create new"
                value={newProduct.subCategory || ""}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, subCategory: value })
                }
                creatable
                getCreateLabel={(query) => `+ Create "${query}"`}
                onCreate={(query) => {
                  return query;
                }}
              />
              <FileInput
                label="Image"
                placeholder="Upload product image"
                onChange={(file) => setFiles(file ? [file] : [])}
                clearable
                accept="image/*"
              />
              <Button
                onClick={handleAddProduct}
                fullWidth
                mt="md"
                disabled={!newProduct.name || !newProduct.category}
              >
                Add Product
              </Button>
            </Stack>
          </Modal>

          {/* Edit Product Modal */}
          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title={<Text fw={700} size="lg">Edit Product: {selectedProduct?.name}</Text>}
            centered
            size="md"
          >
            {selectedProduct && (
              <Stack spacing="md">
                <TextInput
                  label="Name"
                  value={selectedProduct.name || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) =>
                      prev ? { ...prev, name: e.currentTarget.value } : prev
                    )
                  }
                  required
                />
                <TextInput
                  label="Description"
                  value={selectedProduct.description || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) =>
                      prev
                        ? { ...prev, description: e.currentTarget.value }
                        : prev
                    )
                  }
                />
                <NumberInput
                  label="Price (₱)"
                  value={selectedProduct.price || 0}
                  onChange={(value) =>
                    setSelectedProduct((prev) =>
                      prev ? { ...prev, price: Number(value) || 0 } : prev
                    )
                  }
                  required
                  min={0}
                  precision={2}
                  prefixSections={<Text size="sm">₱</Text>}
                />
                <NumberInput
                  label="Stock"
                  value={selectedProduct.stock || 0}
                  onChange={(value) =>
                    setSelectedProduct((prev) =>
                      prev ? { ...prev, stock: Number(value) || 0 } : prev
                    )
                  }
                  required
                  min={0}
                />
                <Select
                  label="Category"
                  data={categories.map((category) => ({
                    value: category.name,
                    label: category.name,
                  }))}
                  value={
                    selectedProduct.category
                      ? selectedProduct.category.toString()
                      : ""
                  }
                  onChange={(value) =>
                    setSelectedProduct((prev) =>
                      prev ? { ...prev, category: value || "" } : prev
                    )
                  }
                  clearable
                  required
                />
                <Autocomplete
                  label="Sub Category (Optional)"
                  data={Array.from(
                    new Set(products.filter(p => p.subCategory).map((product) => product.subCategory))
                  ).map((subCategory) => ({
                    value: subCategory,
                    label: subCategory,
                  }))}
                  value={selectedProduct.subCategory || ""}
                  placeholder="Select sub category or create new"
                  onChange={(value) =>
                    setSelectedProduct((prev) =>
                      prev ? { ...prev, subCategory: value } : prev
                    )
                  }
                  creatable
                  getCreateLabel={(query) => `+ Create "${query}"`}
                  onCreate={(query) => {
                    return query;
                  }}
                />
                <FileInput
                  label="Image"
                  placeholder="Upload new image (optional)"
                  onChange={(file) => setFiles(file ? [file] : [])}
                  clearable
                  accept="image/*"
                />
                {selectedProduct.image && (
                  <Box>
                    <Text size="sm" mb={10}>Current Image:</Text>
                    <Image
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      height={100}
                      width="auto"
                      fit="contain"
                    />
                  </Box>
                )}
                <Button 
                  onClick={handleEditProduct} 
                  fullWidth 
                  mt="md"
                  disabled={!selectedProduct.name || !selectedProduct.category}
                >
                  Save Changes
                </Button>
              </Stack>
            )}
          </Modal>

          {/* Delete Product Modal */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title={<Text fw={700} size="lg">Delete Product</Text>}
            centered
            size="sm"
          >
            <Text>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </Text>
            <Group position="right" mt="md">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpened(false)}
              >
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteProduct}>
                Delete
              </Button>
            </Group>
          </Modal>

          {/* Add Category Modal */}
          <Modal
            opened={categoryModalOpened}
            onClose={() => setCategoryModalOpened(false)}
            title={<Text fw={700} size="lg">Add Category</Text>}
            centered
            size="md"
          >
            <Stack spacing="md">
              <TextInput
                label="Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    name: e.currentTarget.value,
                  })
                }
                required
              />
              <TextInput
                label="Description"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.currentTarget.value,
                  })
                }
              />
              <Button 
                onClick={handleAddCategory} 
                fullWidth 
                mt="md"
                disabled={!newCategory.name}
              >
                Add Category
              </Button>
            </Stack>
          </Modal>

          {/* Edit Category Modal */}
          <Modal
            opened={categoryEditModalOpened}
            onClose={() => setCategoryEditModalOpened(false)}
            title={<Text fw={700} size="lg">Edit Category</Text>}
            centered
            size="md"
          >
            {selectedCategory && (
              <Stack spacing="md">
                <TextInput
                  label="Name"
                  value={selectedCategory.name || ""}
                  onChange={(e) =>
                    setSelectedCategory((prev) =>
                      prev ? { ...prev, name: e.currentTarget.value } : prev
                    )
                  }
                  required
                />
                <TextInput
                  label="Description"
                  value={selectedCategory.description || ""}
                  onChange={(e) =>
                    setSelectedCategory((prev) =>
                      prev
                        ? { ...prev, description: e.currentTarget.value }
                        : prev
                    )
                  }
                />
                <Button 
                  onClick={handleEditCategory} 
                  fullWidth 
                  mt="md"
                  disabled={!selectedCategory.name}
                >
                  Save Changes
                </Button>
              </Stack>
            )}
          </Modal>

          {/* Delete Category Modal */}
          <Modal
            opened={categoryDeleteModalOpened}
            onClose={() => setCategoryDeleteModalOpened(false)}
            title={<Text fw={700} size="lg">Delete Category</Text>}
            centered
            size="sm"
          >
            <Text>
              Are you sure you want to delete the category "{selectedCategory?.name}"?
            </Text>
            {selectedCategory && products.filter(p => p.category === selectedCategory.name).length > 0 && (
              <Text mt="sm" color="orange">
                Warning: This category contains {products.filter(p => p.category === selectedCategory.name).length} products.
                These products will become uncategorized.
              </Text>
            )}
            <Group position="right" mt="md">
              <Button
                variant="outline"
                onClick={() => setCategoryDeleteModalOpened(false)}
              >
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteCategory}>
                Delete Category
              </Button>
            </Group>
          </Modal>

          {/* Inventory Value Details Modal */}
          <Modal
            opened={inventoryInfoModalOpened}
            onClose={() => setInventoryInfoModalOpened(false)}
            title={<Text fw={700} size="lg">Inventory Value Breakdown</Text>}
            centered
            size="lg"
          >
            <Stack spacing="lg">
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">Total Inventory Value</Title>
                <Group position="apart">
                  <Text size="lg" fw={500}>Total Value:</Text>
                  <Text size="lg" fw={700} c="grape">
                    ₱{totalInventoryValue.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt={5}>
                  This is the sum of (price × stock) for all {products.length} products.
                </Text>
              </Paper>
              
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">Inventory Value by Category</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Products</Table.Th>
                      <Table.Th>Total Value</Table.Th>
                      <Table.Th>% of Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Object.entries(inventoryValueDetails.valueByCategory).sort((a, b) => b[1] - a[1]).map(([categoryName, value]) => {
                      const productsCount = products.filter(p => p.category === categoryName).length;
                      const percentage = (value / totalInventoryValue) * 100;
                      
                      return (
                        <Table.Tr key={categoryName}>
                          <Table.Td>{categoryName}</Table.Td>
                          <Table.Td>{productsCount}</Table.Td>
                          <Table.Td>
                            ₱{value.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </Table.Td>
                          <Table.Td>
                            <Group position="apart" noWrap spacing={5}>
                              <Text>{percentage.toFixed(1)}%</Text>
                              <Progress 
                                value={percentage} 
                                size="sm" 
                                color="grape" 
                                style={{ width: 60 }} 
                                radius="xl"
                              />
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
              
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">Top Products by Value</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Product Name</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Stock</Table.Th>
                      <Table.Th>Total Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {inventoryValueDetails.topProducts.map(product => (
                      <Table.Tr key={product.productID}>
                        <Table.Td>
                          <Group spacing="sm">
                            <Image 
                              src={product.image || "/placeholder.png"} 
                              width={30} 
                              height={30} 
                              radius="sm"
                              fit="contain"
                              withPlaceholder
                            />
                            <Text>{product.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>₱{(typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0).toFixed(2)}</Table.Td>
                        <Table.Td>{product.stock}</Table.Td>
                        <Table.Td>₱{(typeof product.totalValue === 'number' ? product.totalValue : parseFloat(String(product.totalValue)) || 0).toFixed(2)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
              
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">Quick Stats</Title>
                <SimpleGrid cols={3}>
                  <div>
                    <Text size="sm" c="dimmed">Average Value Per Product</Text>
                    <Text size="lg" fw={500}>
                      ₱{inventoryValueDetails.averageProductValue.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Out of Stock Value Loss</Text>
                    <Text size="lg" fw={500} c="red">
                      {outOfStockProducts} products
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Low Stock Value Risk</Text>
                    <Text size="lg" fw={500} c="orange">
                      {lowStockProducts - outOfStockProducts} products
                    </Text>
                  </div>
                </SimpleGrid>
              </Paper>
            </Stack>
          </Modal>
          
          {/* Footer */}
          <Box className={classes.footerSpacer} />
          <AdminFooter />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default withRoleProtection(InventoryPage, ["admin"]);
