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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import useSWR, { mutate } from "swr";
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
} from "@tabler/icons-react";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import withRoleProtection from "../../utils/auth";

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

const InventoryPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [categoryModalOpened, setCategoryModalOpened] = useState(false);
  const [categoryEditModalOpened, setCategoryEditModalOpened] = useState(false);
  const [categoryDeleteModalOpened, setCategoryDeleteModalOpened] =
    useState(false);
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
  const [addProductButtonDisabled, setAddProductButtonDisabled] =
    useState(true);
  const [openedNav, setOpenedNav] = useState(false);

  const {
    data: products = [],
    error,
    mutate,
  } = useSWR<Product[]>("inventory/", fetcher);
  const { data: categories = [], mutate: mutateCategory } = useSWR<Category[]>(
    "category/",
    fetcher
  );

  if (error) {
    notifications.show({
      title: "Error",
      message: error.response?.data?.message || "Failed to fetch inventory",
      color: "red",
    });
  }

  const handleAddProduct = async () => {
    setVisible(true); // Show loading overlay

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
        setVisible(false); // Hide loading overlay
        return;
      }
    }

    try {
      const response = await axios.post("inventory/", {
        ...newProduct,
        image: files.length > 0 ? files[0].name : newProduct.image,
      });
      notifications.show({
        message: "Product added successfully",
        color: "green",
      });
      setAddModalOpened(false);
      mutate(); // Refresh the data
      setVisible(false); // Hide loading overlay
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
        image: null,
        subCategory: "",
      }); // Clear the form
      setFiles([]); // Clear the file input
    } catch (error) {
      notifications.show({
        message: "Failed to add product",
        color: "red",
      });
      setVisible(false); // Hide loading overlay
    }
  };

  const handleEditProduct = async () => {
    setVisible(true); // Show loading overlay

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
        setVisible(false); // Hide loading overlay
        return;
      }
    }

    try {
      const response = await axios.put("inventory/", {
        ...selectedProduct,
        productID: selectedProduct.productID, // Ensure productID is included in the body
        image: files.length > 0 ? files[0].name : selectedProduct.image,
      });
      notifications.show({
        message: "Product updated successfully",
        color: "green",
      });
      setEditModalOpened(false);
      mutate(); // Refresh the data
      setVisible(false); // Hide loading overlay
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
        image: null,
        subCategory: "",
      }); // Clear the form
      setFiles([]); // Clear the file input
    } catch (error) {
      notifications.show({
        message: "Failed to update product",
        color: "red",
      });
      setVisible(false); // Hide loading overlay
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await axios.delete("inventory/", {
        data: { productID: selectedProduct.productID }, // Include productID in request body
      });
      notifications.show({
        message: "Product deleted successfully",
        color: "green",
      });
      setDeleteModalOpened(false);
      mutate(); // Refresh the data
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
      mutateCategory(); // Refresh the data
      setNewCategory({ name: "", description: "" }); // Clear the form
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
      mutateCategory(); // Refresh the data
      setNewCategory({ name: "", description: "" }); // Clear the form
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
      mutateCategory(); // Refresh the data
    } catch (error) {
      notifications.show({
        message: "Failed to delete category",
        color: "red",
      });
    }
  };

  const renderProductRows = (products: Product[]) => {
    return products.map((product) => (
      <Table.Tr key={product.productID}>
        <Table.Td>{product.productID}</Table.Td>
        <Table.Td>
          <Image
            src={product.image}
            alt={product.name}
            width={50}
            height={50}
          />
        </Table.Td>
        <Table.Td>{product.name}</Table.Td>
        <Table.Td>{product.description}</Table.Td>
        <Table.Td>{product.price}</Table.Td>
        <Table.Td>{product.stock}</Table.Td>
        <Table.Td>{product.category}</Table.Td>
        <Table.Td>{product.subCategory}</Table.Td>

        <Table.Td>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                setSelectedProduct(product);
                setEditModalOpened(true);
              }}
            >
              Edit
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => {
                setSelectedProduct(product);
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

  const renderCategoryRows = (categories: Category[]) => {
    return categories.map((category) => (
      <Table.Tr key={category.categoryID}>
        <Table.Td>{category.categoryID}</Table.Td>
        <Table.Td>{category.name}</Table.Td>
        <Table.Td>{category.description}</Table.Td>
        <Table.Td>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                setSelectedCategory(category);
                setCategoryEditModalOpened(true);
              }}
            >
              Edit
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => {
                setSelectedCategory(category);
                setCategoryDeleteModalOpened(true);
              }}
            >
              Delete
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    ));
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
      <HeaderMegaMenu openedNav={openedNav} setOpenedNav={setOpenedNav} />
      <AppShell.Navbar py="md" px={4}>
        <HeaderNav openedNav={openedNav} setOpenedNav={setOpenedNav} />
      </AppShell.Navbar>

      <AppShell.Main bg={"#B6C4B6"}>
        <Container fluid p={20}>
          <LoadingOverlay visible={visible} />
          <Group justify="apart" mb="md">
            <Title order={2}>Inventory Management</Title>
            <Menu
              transitionProps={{ transition: "pop-top-right" }}
              position="top-end"
              width={220}
              withinPortal
            >
              <Menu.Target>
                <Button
                  rightSection={<IconChevronDown size={18} stroke={1.5} />}
                  pr={12}
                >
                  Create new
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={
                    <IconPackage size={16} color="blue" stroke={1.5} />
                  }
                  onClick={() => setAddModalOpened(true)}
                >
                  Product
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconSquareCheck size={16} color="pink" stroke={1.5} />
                  }
                  onClick={() => setCategoryModalOpened(true)}
                >
                  Category
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Title order={3} mb="md">
            Products
          </Title>
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Image</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Stock</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Sub Category</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderProductRows(products)}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Title order={3} mt="xl" mb="md">
            Categories
          </Title>
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderCategoryRows(categories)}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {/* add product modal */}
          <Modal
            opened={addModalOpened}
            onClose={() => setAddModalOpened(false)}
            title="Add Product"
            centered
          >
            <Stack>
              <TextInput
                label="Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.currentTarget.value })
                }
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
                label="Price"
                value={newProduct.price}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, price: Number(value) || 0 })
                }
              />
              <NumberInput
                label="Stock"
                value={newProduct.stock}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, stock: Number(value) || 0 })
                }
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
                  setAddProductButtonDisabled(false);
                }}
              />
              <Autocomplete
                label="Sub Category"
                data={[
                  ...Array.from(
                    new Set(products.map((product) => product.subCategory))
                  ),
                ].map((subCategory) => ({
                  value: subCategory,
                  label: subCategory,
                }))}
                placeholder="Select sub category or type to create a new one"
                onChange={(value) =>
                  setNewProduct({ ...newProduct, subCategory: value })
                }
              />
              <FileInput
                label="Image"
                placeholder="Upload image"
                onChange={(file) => setFiles(file ? [file] : [])}
              />
              <Button
                disabled={addProductButtonDisabled}
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </Stack>
          </Modal>

          {/* edit product modal */}
          <Modal
            opened={editModalOpened}
            onClose={() => setEditModalOpened(false)}
            title="Edit Product"
            centered
          >
            <Stack>
              <TextInput
                label="Name"
                value={selectedProduct?.name || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, name: e.currentTarget.value } : prev
                  )
                }
              />
              <TextInput
                label="Description"
                value={selectedProduct?.description || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev
                      ? { ...prev, description: e.currentTarget.value }
                      : prev
                  )
                }
              />
              <NumberInput
                label="Price"
                value={selectedProduct?.price || 0}
                onChange={(value) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, price: Number(value) || 0 } : prev
                  )
                }
              />
              <NumberInput
                label="Stock"
                value={selectedProduct?.stock || 0}
                onChange={(value) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, stock: Number(value) || 0 } : prev
                  )
                }
              />
              <Select
                label="Category"
                data={categories.map((category) => ({
                  value: category.name,
                  label: category.name,
                }))}
                value={
                  selectedProduct?.category
                    ? selectedProduct.category.toString()
                    : ""
                }
                onChange={(value) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, category: value || "" } : prev
                  )
                }
              />
              <Autocomplete
                label="Sub Category"
                data={Array.from(
                  new Set(products.map((product) => product.subCategory))
                ).map((subCategory) => ({
                  value: subCategory,
                  label: subCategory,
                }))}
                value={selectedProduct?.subCategory || ""}
                placeholder="Select sub category or type to create a new one"
                onChange={(value) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, subCategory: value } : prev
                  )
                }
              />
              <FileInput
                label="Image"
                placeholder="Upload a new image"
                onChange={(file) => setFiles(file ? [file] : [])}
              />
              <Button onClick={handleEditProduct}>Save Changes</Button>
            </Stack>
          </Modal>

          {/* delete product modal */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title="Delete Product"
            centered
          >
            <Text>Are you sure you want to delete this product?</Text>
            <Group justify="right" mt="md">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpened(false)}
              >
                No
              </Button>
              <Button color="red" onClick={handleDeleteProduct}>
                Yes, delete it
              </Button>
            </Group>
          </Modal>

          {/* category edit modal */}
          <Modal
            opened={categoryEditModalOpened}
            onClose={() => setCategoryEditModalOpened(false)}
            title="Edit Category"
            centered
          >
            <Stack>
              <TextInput
                label="Name"
                value={selectedCategory?.name || ""}
                onChange={(e) =>
                  setSelectedCategory((prev) =>
                    prev ? { ...prev, name: e.currentTarget.value } : prev
                  )
                }
              />
              <TextInput
                label="Description"
                value={selectedCategory?.description || ""}
                onChange={(e) =>
                  setSelectedCategory((prev) =>
                    prev
                      ? { ...prev, description: e.currentTarget.value }
                      : prev
                  )
                }
              />
              <Button onClick={handleEditCategory}>Save Changes</Button>
            </Stack>
          </Modal>

          {/* category delete modal */}
          <Modal
            opened={categoryDeleteModalOpened}
            onClose={() => setCategoryDeleteModalOpened(false)}
            title="Delete Category"
            centered
          >
            <Text>Are you sure you want to delete this category?</Text>
            <Group justify="right" mt="md">
              <Button
                variant="outline"
                onClick={() => setCategoryDeleteModalOpened(false)}
              >
                No
              </Button>
              <Button color="red" onClick={handleDeleteCategory}>
                Yes, delete it
              </Button>
            </Group>
          </Modal>

          {/* add category modal */}
          <Modal
            opened={categoryModalOpened}
            onClose={() => setCategoryModalOpened(false)}
            title="Add Category"
            centered
          >
            <Stack>
              <TextInput
                label="Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    name: e.currentTarget.value,
                  })
                }
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
              <Button onClick={handleAddCategory}>Add Category</Button>
            </Stack>
          </Modal>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default withRoleProtection(InventoryPage, ["admin"]);
