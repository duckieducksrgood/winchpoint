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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import { IconShoppingCart } from "@tabler/icons-react";
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
    fetcher,{refreshInterval: 1000}
  );
  const [opened, { toggle }] = useDisclosure();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [popoverOpened, setPopoverOpened] = useState<number | null>(null);
  const [selectedMerchSubcategory, setSelectedMerchSubcategory] = useState<
    string | null
  >(null);
  const [selectedPartsSubcategory, setSelectedPartsSubcategory] = useState<
    string | null
  >(null);
  const [openedNav, setOpenedNav] = useState(false);

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

  // Filter products by category and subcategory
  const merchProducts = products.filter(
    (product) =>
      product.category === "UAZAP Merch" &&
      (!selectedMerchSubcategory ||
        product.subCategory === selectedMerchSubcategory)
  );

  const carPartsProducts = products.filter(
    (product) =>
      product.category === "UAZAP Car Parts" &&
      (!selectedPartsSubcategory ||
        product.subCategory === selectedPartsSubcategory)
  );

  // Get unique subcategories
  const merchSubcategories = Array.from(
    new Set(
      products
        .filter((product) => product.category === "UAZAP Merch")
        .map((product) => product.subCategory)
    )
  ).filter(Boolean);

  const partsSubcategories = Array.from(
    new Set(
      products
        .filter((product) => product.category === "UAZAP Car Parts")
        .map((product) => product.subCategory)
    )
  ).filter(Boolean);

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

        <Container fluid p={0} m={0}>
          <Stack justify="column" gap="md">
            <Title
              order={1}
              ta="center"
              size={"60px"}
              c={"white"}
              component="a"
              p={100}
            >
              𝗨𝗔𝗭𝗔𝗣 𝗠𝗘𝗥𝗖𝗛
            </Title>

            <Center>
              <Select
                label="Filter by Subcategory"
                placeholder="Select subcategory"
                data={merchSubcategories.map((sub) => ({
                  value: sub,
                  label: sub,
                }))}
                value={selectedMerchSubcategory}
                onChange={setSelectedMerchSubcategory}
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
                  }}
                >
                  {merchProducts.map((product) => (
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
                      }}
                    >
                      <Card.Section
                        style={{ position: "relative", height: "200px" }}
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
                          style={{ flex: 1, textAlign: "center" }}
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
                            <Text component="span" td="line-through" c="dimmed">
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
                              onChange={(val) => setQuantity(Number(val) || 1)}
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

        <Container fluid p={0} m={0}>
          <Stack justify="column" gap="md">
            <Title
              order={1}
              ta="center"
              size={"60px"}
              c={"white"}
              component="a"
              p={100}
            >
              Car Care Products
            </Title>

            <Center>
              <Select
                label="Filter by Subcategory"
                placeholder="Select subcategory"
                data={partsSubcategories.map((sub) => ({
                  value: sub,
                  label: sub,
                }))}
                value={selectedPartsSubcategory}
                onChange={setSelectedPartsSubcategory}
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
                  }}
                >
                  {carPartsProducts.map((product) => (
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
                      }}
                    >
                      <Card.Section
                        style={{ position: "relative", height: "200px" }}
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
                          style={{ flex: 1, textAlign: "center" }}
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
                            <Text component="span" td="line-through" c="dimmed">
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
                              onChange={(val) => setQuantity(Number(val) || 1)}
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

        {isLoggedout ? null : (
          <Stack>
            <OrderButton />
            <CartButton onAddToCart={handleAddToCart} />
          </Stack>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
