import {
  AppShell,
  Container,
  Stack,
  Title,
  Text,
  Divider,
  Box,
  ScrollArea,
  Card,
  Badge,
  Image,
  Group,
  Button,
  Popover,
  Tooltip,
  NumberInput,
  Select,
  Center,
  LoadingOverlay,
  Modal,
  Grid,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import HeaderNav from "../../components/HeaderComponent/headerNav";
import OrderButton from "../../components/OrderButtonComponent/orderButton";
import CartButton from "../../components/CartButtonComponent/cartButton";
import { useUserStore } from "../../utils/auth";

interface Product {
  productID: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  onSale: boolean;
  salePrice: number;
  subCategory: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProductPage() {
  const { isLoggedout } = useUserStore();
  const { data: products = [], error } = useSWR<Product[]>(
    "inventory/",
    fetcher,
    { refreshInterval: 1000 }
  );
  const [opened, { toggle }] = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [popoverOpened, setPopoverOpened] = useState<number | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<
    Record<string, string | null>
  >({});
  const [openedNav, setOpenedNav] = useState(false);
  const [productDetailModalOpened, setProductDetailModalOpened] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    setLoading(true);
    try {
      await axios.post("cart/", {
        product_id: productId,
        quantity,
      });
      notifications.show({
        title: "Success",
        message: "Item added to cart",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to add item",
        color: "red",
      });
    } finally {
      setLoading(false);
      setPopoverOpened(null);
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(products.map((product) => product.category))
  ).filter(Boolean);

  // Get subcategories for each category
  const getSubcategoriesForCategory = (category: string) => {
    return Array.from(
      new Set(
        products
          .filter((product) => product.category === category)
          .map((product) => product.subCategory)
      )
    ).filter(Boolean);
  };

  // Filter products by category and subcategory
  const getProductsForCategory = (category: string) => {
    const selectedSubcategory = selectedSubcategories[category];

    return products.filter(
      (product) =>
        product.category === category &&
        (!selectedSubcategory || product.subCategory === selectedSubcategory)
    );
  };

  // Handle subcategory filter change
  const handleSubcategoryChange = (category: string, value: string | null) => {
    setSelectedSubcategories((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // Function to view product details
  const openProductDetail = (product: Product) => {
    setViewingProduct(product);
    setProductDetailModalOpened(true);
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
        <Container fluid p={0} m={0}>
          <Stack justify="column" gap="md">
            <Title order={1} ta="center" size={"60px"} c={"white"}>
              Shop in Style
            </Title>
            <Text ta="center" c={"rgba(255, 255, 255, .5)"} size={"20px"}>
              Car Care Products & Merch!
            </Text>
            <Divider my={"xl"} mx={150} color="black" />
          </Stack>
        </Container>

        {categories.map((category) => (
          <Container fluid p={0} m={0} key={category}>
            <Stack justify="column" gap="md">
              <Title
                order={1}
                ta="center"
                size={"60px"}
                c={"white"}
                component="a"
                p={100}
              >
                {category}
              </Title>

              <Center>
                <Select
                  label="Filter by Subcategory"
                  placeholder="Select subcategory"
                  data={getSubcategoriesForCategory(category).map((sub) => ({
                    value: sub,
                    label: sub,
                  }))}
                  value={selectedSubcategories[category] || null}
                  onChange={(value: string | null) => handleSubcategoryChange(category, value)}
                  clearable
                  style={{ width: 200 }}
                />
              </Center>

              <ScrollArea type="scroll" scrollbarSize={12} offsetScrollbars>
                <Box
                  p={100}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    overflowX: "auto",
                  }}
                >
                  <Box
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {getProductsForCategory(category).map((product) => (
                      <Card
                        shadow="sm"
                        padding="lg"
                        key={product.productID}
                        radius="md"
                        style={{
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          flexDirection: "column",
                          height: "400px", // Fixed height
                          width: "300px", // Fixed width
                          margin: "10px",
                        }}
                      >
                        <Card.Section
                          style={{ position: "relative", height: "200px", cursor: "pointer" }}
                          onClick={() => openProductDetail(product)}
                        >
                          {product.onSale && (
                            <Badge
                              color="green"
                              variant="filled"
                              style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                zIndex: 1,
                              }}
                            >
                              Sale
                            </Badge>
                          )}
                          <Image
                            src={product.image}
                            alt={product.name}
                            height={160}
                            fit="cover"
                            style={{ objectFit: "cover", height: "100%" }}
                          />
                        </Card.Section>

                        <Group justify="apart" mt="md" mb="xs" gap={10}>
                          <Title
                            order={5}
                            style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
                            onClick={() => openProductDetail(product)}
                          >
                            {product.name}
                          </Title>
                        </Group>

                        <Text
                          size="md"
                          c="dimmed"
                          style={{ textAlign: "center" }}
                        >
                          {product.salePrice > 0 ? (
                            <>
                              <Text
                                component="span"
                                td="line-through"
                                c="dimmed"
                              >
                                ₱{product.price}
                              </Text>{" "}
                              <Text component="span" c="red">
                                ₱{product.salePrice}
                              </Text>
                            </>
                          ) : (
                            `₱${product.price}`
                          )}
                        </Text>
                        <Popover
                          width={200}
                          position="bottom"
                          withArrow
                          shadow="md"
                          opened={popoverOpened === product.productID}
                          onClose={() => setPopoverOpened(null)}
                          closeOnClickOutside
                        >
                          <Popover.Target>
                            <Tooltip
                              label={
                                product.stock > 0
                                  ? `In stock: ${product.stock}`
                                  : "Out of stock"
                              }
                              position="top"
                            >
                              <Button
                                disabled={product.stock === 0 || isLoggedout}
                                variant="outline"
                                fullWidth
                                mt="auto"
                                radius="md"
                                style={{ marginTop: "auto" }}
                                onClick={() =>
                                  setPopoverOpened(
                                    popoverOpened === product.productID
                                      ? null
                                      : product.productID
                                  )
                                }
                              >
                                Add to cart
                              </Button>
                            </Tooltip>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack>
                              <NumberInput
                                value={quantity}
                                onChange={(val: number | string | null) =>
                                  setQuantity(Number(val) || 1)
                                }
                                min={1}
                                max={product.stock}
                                label="Quantity"
                              />
                              <Button
                                onClick={() =>
                                  handleAddToCart(product.productID, quantity)
                                }
                                loading={loading}
                              >
                                Add to cart
                              </Button>
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Card>
                    ))}
                  </Box>
                </Box>
              </ScrollArea>
              <Divider my={"xl"} mx={150} color="black" />
            </Stack>
          </Container>
        ))}

        {isLoggedout ? null : (
          <Stack>
            <OrderButton />
            <CartButton onAddToCart={handleAddToCart} />
          </Stack>
        )}

        {/* Product Detail Modal */}
        <Modal
          opened={productDetailModalOpened}
          onClose={() => setProductDetailModalOpened(false)}
          size="lg"
          padding="xl"
          radius="md"
          centered
          withCloseButton
          overlayProps={{
            opacity: 0.55,
            blur: 3,
          }}
          title={
            <Title order={2} fw={700}>
              {viewingProduct?.name}
            </Title>
          }
        >
          {viewingProduct && (
            <>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card p="md" radius="md" withBorder>
                    <Card.Section>
                      <Image 
                        src={viewingProduct.image} 
                        height={300} 
                        alt={viewingProduct.name} 
                        fit="contain" 
                      />
                    </Card.Section>
                    
                    {viewingProduct.subCategory && (
                      <Badge mt="md" size="sm" variant="light">
                        {viewingProduct.subCategory}
                      </Badge>
                    )}
                    
                    <Badge mt="sm" size="sm" color="blue" variant="light">
                      {viewingProduct.category}
                    </Badge>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md" h="100%">
                    <div>
                      <Text fw={500} size="sm" c="dimmed" mb={5}>PRICE</Text>
                      <Group gap="xs" align="center">
                        {viewingProduct.onSale && viewingProduct.salePrice > 0 ? (
                          <>
                            <Text c="dimmed" td="line-through" size="xl" fw={500}>
                              ₱{(typeof viewingProduct.price === 'number' ? viewingProduct.price : parseFloat(String(viewingProduct.price)) || 0).toFixed(2)}
                            </Text>
                            <Text size="xl" fw={700} c="red">
                              ₱{(typeof viewingProduct.salePrice === 'number' ? viewingProduct.salePrice : parseFloat(String(viewingProduct.salePrice)) || 0).toFixed(2)}
                            </Text>
                            <Badge color="green" variant="filled" size="sm">
                              SALE
                            </Badge>
                          </>
                        ) : (
                          <Text size="xl" fw={700}>
                            ₱{(typeof viewingProduct.price === 'number' ? viewingProduct.price : parseFloat(String(viewingProduct.price)) || 0).toFixed(2)}
                          </Text>
                        )}
                      </Group>
                    </div>

                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="sm" c="dimmed" mb={5}>DESCRIPTION</Text>
                      <Paper p="md" withBorder radius="md" style={{ backgroundColor: "#f9f9f9", minHeight: '120px' }}>
                        <Text style={{ whiteSpace: 'pre-line' }}>
                          {viewingProduct.description || "No description available."}
                        </Text>
                      </Paper>
                    </div>
                    
                    <div>
                      <Text fw={500} size="sm" c="dimmed" mb={5}>AVAILABILITY</Text>
                      <Group>
                        <Text>
                          {viewingProduct.stock > 0 
                            ? `${viewingProduct.stock} in stock` 
                            : "Out of stock"}
                        </Text>
                        {viewingProduct.stock > 0 && viewingProduct.stock <= 5 && (
                          <Badge color="orange">Low stock</Badge>
                        )}
                        {viewingProduct.stock === 0 && (
                          <Badge color="red">Out of stock</Badge>
                        )}
                      </Group>
                    </div>

                    {!isLoggedout && viewingProduct.stock > 0 && (
                      <>
                        <Divider />
                        <Paper p="md" withBorder radius="md" bg="rgba(0, 0, 0, 0.03)">
                          <Group align="flex-end">
                            <NumberInput
                              label="Quantity"
                              value={quantity}
                              onChange={(val) => setQuantity(Number(val) || 1)}
                              min={1}
                              max={viewingProduct.stock}
                              style={{ width: '120px' }}
                            />
                            <Button
                              variant="filled"
                              radius="md"
                              size="md"
                              onClick={() => {
                                handleAddToCart(viewingProduct.productID, quantity);
                                setProductDetailModalOpened(false);
                              }}
                              loading={loading}
                              disabled={viewingProduct.stock === 0}
                              style={{ flex: 1 }}
                            >
                              Add to Cart
                            </Button>
                          </Group>
                        </Paper>
                      </>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>
            </>
          )}
        </Modal>
      </AppShell.Main>
    </AppShell>
  );
}
