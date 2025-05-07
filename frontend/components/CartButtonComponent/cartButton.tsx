import {
  Button,
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Pagination,
  Center,
  Image,
  Checkbox,
  TextInput,
  Select,
  LoadingOverlay,
  FileInput,
  Transition,
  Paper,
  Box,
  Title,
  Divider,
  Table,
  ThemeIcon,
  Tooltip,
  Card,
  Grid,
} from "@mantine/core";
import { useDisclosure, useViewportSize } from "@mantine/hooks";
import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingCart,
  IconTrash,
  IconArrowRight,
  IconMapPin,
  IconUpload,
  IconCheck,
  IconX,
  IconPackage,
} from "@tabler/icons-react";
import classes from "./Demo.module.css";
import {
  fetchRegions,
  fetchProvinces,
  fetchCitiesMunicipalities,
  fetchBarangays,
} from "../../utils/auth";

// Interfaces
interface IProduct {
  productID: number;
  name: string;
  price: number;
  image: string;
}

interface ICartItem {
  id: number;
  cart: number;
  product: IProduct;
  quantity: number;
}

interface ICart {
  cartID: number;
  customer: string;
  items: ICartItem[];
  date_added: string;
}

interface CartButtonProps {
  onAddToCart?: (productId: number, quantity: number) => void;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}

export function CartButton({ onAddToCart }: CartButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [checkoutOpened, { open: openCheckout, close: closeCheckout }] =
    useDisclosure(false);
  const [activePage, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const {
    data: cartData,
    error,
    mutate,
  } = useSWR<ICart>("cart/", fetcher, { refreshInterval: 3000 });

  // Scroll position state for animation - Matched with OrderButton
  const [scrollPosition, setScrollPosition] = useState(0);
  const [buttonPosition, setButtonPosition] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const { height: viewportHeight } = useViewportSize();

  // Animation states
  const [transitioning, setTransitioning] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment">(
    "address"
  );

  //Payment related states
  const [qrCodes, setQrCodes] = useState<
    { value: string; label: string; qr_code: string }[]
  >([]);
  const { data: qrData } = useSWR("qr/", fetcher);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<
    string | null
  >(null);

  // Smooth button animation - Matched with OrderButton
  const updateButtonPosition = useCallback(() => {
    const targetPosition = window.scrollY;
    let currentPosition = buttonPosition;
    const distance = (targetPosition - currentPosition) * 0.1;

    if (Math.abs(distance) > 0.5) {
      currentPosition += distance;
      setButtonPosition(currentPosition);
      animationFrame.current = requestAnimationFrame(updateButtonPosition);
    } else {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    }
  }, [buttonPosition]);

  // Handle scroll events - Matched with OrderButton
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);

      if (animationFrame.current === null) {
        animationFrame.current = requestAnimationFrame(updateButtonPosition);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updateButtonPosition]);

  useEffect(() => {
    if (qrData) {
      setQrCodes(
        qrData.map((qr: { id: number; type: string; qr_code: string }) => ({
          value: qr.type,
          label: qr.type,
          qr_code: qr.qr_code,
        }))
      );
    }
  }, [qrData]);

  // Add this function inside the CartButton component
  const handleProofOfPaymentChange = (file: File | null) => {
    setProofOfPayment(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfPaymentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofOfPaymentPreview(null);
    }
  };

  // User Data State
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    delivery_address: "",
  });

  // Address States
  const [regions, setRegions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>(
    []
  );
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<
    { value: string; label: string }[]
  >([]);
  const [barangays, setBarangays] = useState<{ value: string; label: string }[]>(
    []
  );

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCityMunicipality, setSelectedCityMunicipality] =
    useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [exactAddress, setExactAddress] = useState<string>("");

  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
    null
  );
  const [selectedProvinceName, setSelectedProvinceName] = useState<
    string | null
  >(null);
  const [selectedCityMunicipalityName, setSelectedCityMunicipalityName] =
    useState<string | null>(null);
  const [selectedBarangayName, setSelectedBarangayName] = useState<
    string | null
  >(null);

  // UI States
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState({
    region: false,
    province: false,
    cityMunicipality: false,
    barangay: false,
  });

  // Processing state
  const [processingOrder, setProcessingOrder] = useState(false);

  // Load Regions Effect
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingAddress((prev) => ({ ...prev, region: true }));
      const regionsData = await fetchRegions();
      setRegions(
        regionsData.map((region: { code: string; name: string }) => ({
          value: region.code,
          label: region.name,
        }))
      );
      setLoadingAddress((prev) => ({ ...prev, region: false }));
    };
    loadRegions();
  }, []);

  // Load Profile Data Effect
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data } = await axios.get("profile/");
        setUserData(data);
        setLoading(false);

        if (data.delivery_address) {
          const [exact, region, province, city, barangay] =
            data.delivery_address.split(", ");
          setExactAddress(exact || "");
          setSelectedRegionName(region || null);
          setSelectedProvinceName(province || null);
          setSelectedCityMunicipalityName(city || null);
          setSelectedBarangayName(barangay || null);
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Failed to fetch user data",
          color: "red",
          icon: <IconX size={18} />,
        });
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  // Address Update Functions
  const updateDeliveryAddress = (
    region: string | null,
    province: string | null,
    cityMunicipality: string | null,
    barangay: string | null,
    exactAddress: string
  ) => {
    const deliveryAddress = [
      exactAddress,
      region,
      province,
      cityMunicipality,
      barangay,
    ]
      .filter(Boolean)
      .join(", ");

    setUserData((prev) => ({ ...prev, delivery_address: deliveryAddress }));
    setExactAddress(exactAddress);
  };

  // Function to get items for current page
  const getVisibleItems = () => {
    if (!cartData?.items) return [];
    const itemsPerPage = 5;
    const startIndex = (activePage - 1) * itemsPerPage;
    return cartData.items.slice(startIndex, startIndex + itemsPerPage);
  };

  const handleRegionChange = async (regionCode: string | null) => {
    const region = regions.find((r) => r.value === regionCode);
    setSelectedRegion(regionCode);
    setSelectedRegionName(region ? region.label : null);
    setProvinces([]);
    setCitiesMunicipalities([]);
    setBarangays([]);
    setSelectedProvince(null);
    setSelectedCityMunicipality(null);
    setSelectedBarangay(null);
    setSelectedProvinceName(null);
    setSelectedCityMunicipalityName(null);
    setSelectedBarangayName(null);

    if (regionCode) {
      setLoadingAddress((prev) => ({ ...prev, province: true }));
      const provincesData = await fetchProvinces(regionCode);
      setProvinces(
        provincesData.map((province: { code: string; name: string }) => ({
          value: province.code,
          label: province.name,
        }))
      );
      setLoadingAddress((prev) => ({ ...prev, province: false }));
    }

    updateDeliveryAddress(
      region ? region.label : null,
      null,
      null,
      null,
      exactAddress
    );
  };

  const handleProvinceChange = async (provinceCode: string | null) => {
    const province = provinces.find((p) => p.value === provinceCode);
    setSelectedProvince(provinceCode);
    setSelectedProvinceName(province ? province.label : null);
    setCitiesMunicipalities([]);
    setBarangays([]);
    setSelectedCityMunicipality(null);
    setSelectedBarangay(null);
    setSelectedCityMunicipalityName(null);
    setSelectedBarangayName(null);

    if (provinceCode) {
      setLoadingAddress((prev) => ({ ...prev, cityMunicipality: true }));
      const citiesMunicipalitiesData = await fetchCitiesMunicipalities(
        provinceCode
      );
      setCitiesMunicipalities(
        citiesMunicipalitiesData.map(
          (city: { code: string; name: string }) => ({
            value: city.code,
            label: city.name,
          })
        )
      );
      setLoadingAddress((prev) => ({ ...prev, cityMunicipality: false }));
    }

    updateDeliveryAddress(
      selectedRegionName,
      province ? province.label : null,
      null,
      null,
      exactAddress
    );
  };

  const handleCityMunicipalityChange = async (
    cityMunicipalityCode: string | null
  ) => {
    const cityMunicipality = citiesMunicipalities.find(
      (c) => c.value === cityMunicipalityCode
    );
    setSelectedCityMunicipality(cityMunicipalityCode);
    setSelectedCityMunicipalityName(
      cityMunicipality ? cityMunicipality.label : null
    );
    setBarangays([]);
    setSelectedBarangay(null);
    setSelectedBarangayName(null);

    if (cityMunicipalityCode) {
      setLoadingAddress((prev) => ({ ...prev, barangay: true }));
      const barangaysData = await fetchBarangays(cityMunicipalityCode);
      setBarangays(
        barangaysData.map((barangay: { code: string; name: string }) => ({
          value: barangay.code,
          label: barangay.name,
        }))
      );
      setLoadingAddress((prev) => ({ ...prev, barangay: false }));
    }

    updateDeliveryAddress(
      selectedRegionName,
      selectedProvinceName,
      cityMunicipality ? cityMunicipality.label : null,
      null,
      exactAddress
    );
  };

  const handleBarangayChange = (barangayCode: string | null) => {
    const barangay = barangays.find((b) => b.value === barangayCode);
    setSelectedBarangay(barangayCode);
    setSelectedBarangayName(barangay ? barangay.label : null);
    updateDeliveryAddress(
      selectedRegionName,
      selectedProvinceName,
      selectedCityMunicipalityName,
      barangay ? barangay.label : null,
      exactAddress
    );
  };

  const handleExactAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExactAddress(e.target.value);
    updateDeliveryAddress(
      selectedRegionName,
      selectedProvinceName,
      selectedCityMunicipalityName,
      selectedBarangayName,
      e.target.value
    );
  };

  // Cart Functions
  const handleRemoveItem = async (productId: number) => {
    try {
      setTransitioning(true);
      await axios.delete("cart/", {
        data: { product_id: productId },
      });
      await mutate();
      notifications.show({
        title: "Success",
        message: "Item removed from cart",
        color: "teal",
        icon: <IconCheck size={18} />,
      });
      setTimeout(() => setTransitioning(false), 300);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to remove item",
        color: "red",
        icon: <IconX size={18} />,
      });
      setTransitioning(false);
    }
  };

  const handleItemSelect = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateTotal = () => {
    return (
      cartData?.items
        ?.filter((item) => selectedItems.includes(item.id))
        .reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        ) || 0
    );
  };

  const handleCheckout = async () => {
    if (!userData.delivery_address) {
      notifications.show({
        title: "Error",
        message: "Please set a delivery address",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    if (!selectedQrCode || !proofOfPayment) {
      notifications.show({
        title: "Error",
        message: "Please select a payment method and upload proof of payment",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setProcessingOrder(true);
    const formData = new FormData();
    formData.append("items", selectedItems.join(","));
    formData.append("delivery_address", userData.delivery_address);
    formData.append("total_price", calculateTotal().toString());
    formData.append("payment_method", selectedQrCode);
    if (proofOfPayment) {
      formData.append("proof_of_payment", proofOfPayment);
    }

    try {
      await axios.post("orders/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await mutate();

      notifications.show({
        title: "Order Placed",
        message: "Your order has been successfully placed!",
        color: "teal",
        icon: <IconCheck size={18} />,
      });

      setSelectedItems([]);
      setSelectedQrCode(null);
      setProofOfPayment(null);
      setProofOfPaymentPreview(null);
      setCheckoutStep("address");

      setTimeout(() => {
        closeCheckout();
        close();
        setProcessingOrder(false);
      }, 500);
    } catch (error: any) {
      setProcessingOrder(false);
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to place order",
        color: "red",
        icon: <IconX size={18} />,
      });
    }
  };

  const handleSaveAddress = async () => {
    try {
      const response = await axios.put("profile/", {
        delivery_address: userData.delivery_address,
      });
      setUserData(response.data);
      notifications.show({
        title: "Success",
        message: "Address updated successfully",
        color: "teal",
        icon: <IconCheck size={18} />,
      });
      setEditing(false);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to update address",
        color: "red",
        icon: <IconX size={18} />,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    const [exact, region, province, city, barangay] =
      userData.delivery_address.split(", ");
    setExactAddress(exact || "");
    setSelectedRegionName(region || null);
    setSelectedProvinceName(province || null);
    setSelectedCityMunicipalityName(city || null);
    setSelectedBarangayName(barangay || null);
  };

  if (loading) {
    return <LoadingOverlay visible={true} overlayProps={{ blur: 2 }} />;
  }

  return (
    <>
      {/* Cart Button - Matched with OrderButton */}
      <Button
        leftSection={<IconShoppingCart size={20} />}
        size="lg"
        radius="xl"
        onClick={open}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 1000,
          transform: isHovered
            ? `translateY(${buttonPosition * 0.05}px) scale(1.05)`
            : `translateY(${buttonPosition * 0.05}px)`,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          background: "linear-gradient(45deg, #228be6, #4dabf7)",
          border: "none",
        }}
        className={classes.orderButton} // Using same class as OrderButton
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Cart
        {cartData && cartData.items && cartData.items.length > 0 && (
          <Badge
            color="red"
            variant="filled"
            size="sm"
            ml={5}
            className={classes.orderBadge} // Using same class as OrderButton
          >
            {cartData.items.length}
          </Badge>
        )}
      </Button>

      {/* Cart Modal - Matched with OrderButton */}
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
            Your Shopping Cart
          </Title>
        }
        size="xl" // Changed from "lg" to "xl" for more space
        className={classes.orderModal} // Using same class as OrderButton
        transitionProps={{ duration: 300, transition: "slide-down" }}
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay visible={transitioning} overlayProps={{ blur: 2 }} />
        <Stack>
          {!cartData?.items || cartData.items.length === 0 ? (
            <Paper p="xl" radius="md" className={classes.emptyOrdersMessage}>
              <Text ta="center" c="dimmed" size="lg">
                Your cart is empty
              </Text>
            </Paper>
          ) : (
            <>
              <Paper p="md" radius="md" className={classes.tableContainer}>
                {getVisibleItems().map((item, index) => (
                  <Transition
                    key={item.id}
                    mounted={true}
                    transition="fade"
                    duration={300}
                    exitDuration={100}
                    timingFunction={`cubic-bezier(0.4, 0, 0.2, 1)`}
                    onEnter={() => new Promise(resolve => setTimeout(resolve, index * 50))}
                  >
                    {(styles) => (
                      <Card
                        withBorder
                        radius="md"
                        mb="md"
                        style={{
                          ...styles,
                          transition: "all 0.2s ease",
                          backgroundColor: selectedItems.includes(item.id)
                            ? "rgba(44, 136, 152, 0.1)"
                            : undefined,
                        }}
                        className={classes.cartItemCard}
                      >
                        <Grid align="center">
                          <Grid.Col span={1}>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleItemSelect(item.id)}
                              radius="xl"
                              size="md"
                            />
                          </Grid.Col>

                          <Grid.Col span={2}>
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              width={70}
                              height={70}
                              radius="md"
                              fit="cover"
                            />
                          </Grid.Col>

                          <Grid.Col span={4}>
                            <Text size="md" fw={500} lineClamp={2}>
                              {item.product.name}
                            </Text>
                          </Grid.Col>

                          <Grid.Col span={2} style={{ textAlign: "center" }}>
                            <Badge size="lg" variant="outline" radius="sm">
                              ₱{item.product.price.toLocaleString()}
                            </Badge>
                          </Grid.Col>

                          <Grid.Col span={1} style={{ textAlign: "center" }}>
                            <Text fw={500} size="sm">
                              x{item.quantity}
                            </Text>
                          </Grid.Col>

                          <Grid.Col span={2} style={{ textAlign: "right" }}>
                            <Text fw={700} size="md" c="teal">
                              ₱{(item.product.price * item.quantity).toLocaleString()}
                            </Text>
                          </Grid.Col>

                          <Grid.Col span={1} style={{ textAlign: "right" }}>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.product.productID);
                              }}
                              style={{
                                transition: "transform 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Grid.Col>
                        </Grid>
                      </Card>
                    )}
                  </Transition>
                ))}
              </Paper>

              {/* Pagination */}
              <Center my="md">
                <Pagination
                  total={Math.max(
                    1,
                    Math.ceil((cartData?.items?.length || 0) / 5)
                  )}
                  value={activePage}
                  onChange={setPage}
                  radius="md"
                  size="md"
                  withEdges
                />
              </Center>

              {/* Summary and checkout button */}
              <Card withBorder radius="md" p="md" className={classes.cartSummary}>
                <Group justify="apart" mb="xs">
                  <Text fw={600} size="lg">
                    Selected Items ({selectedItems.length} of {cartData.items.length})
                  </Text>
                </Group>

                <Divider my="sm" />

                {selectedItems.length > 0 ? (
                  <>
                    <Stack gap="xs" mb="md">
                      {cartData.items
                        .filter((item) => selectedItems.includes(item.id))
                        .map((item) => (
                          <Group key={item.id} justify="apart">
                            <Text size="sm" lineClamp={1}>
                              {item.product.name} (x{item.quantity})
                            </Text>
                            <Text size="sm" fw={500}>
                              ₱{(item.product.price * item.quantity).toLocaleString()}
                            </Text>
                          </Group>
                        ))}
                    </Stack>
                    <Divider my="sm" />
                  </>
                ) : (
                  <Text c="dimmed" ta="center" mb="md">
                    Select items from your cart to proceed
                  </Text>
                )}

                <Group justify="space-between" mb="md">
                  <Text fw={700} size="lg">
                    Total Amount
                  </Text>
                  <Text fw={700} size="xl" c="teal">
                    ₱{calculateTotal().toLocaleString()}
                  </Text>
                </Group>

                <Button
                  fullWidth
                  style={{
                    background: "linear-gradient(45deg, #12b886, #38d9a9)",
                    border: "none",
                    transition: "transform 0.3s",
                  }}
                  size="lg"
                  radius="md"
                  onClick={openCheckout}
                  disabled={selectedItems.length === 0}
                  rightSection={<IconArrowRight size={18} />}
                  className={classes.checkoutButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Card>
            </>
          )}
        </Stack>
      </Modal>

      {/* Checkout Modal with Steps */}
      <Modal
        centered
        opened={checkoutOpened}
        onClose={() => {
          if (processingOrder) return;
          setTransitioning(true);
          setTimeout(() => {
            closeCheckout();
            setCheckoutStep("address");
            setTransitioning(false);
          }, 300);
        }}
        title={
          <Title order={3} className={classes.modalTitle}>
            {checkoutStep === "address"
              ? "Delivery Details"
              : "Payment Information"}
          </Title>
        }
        size="lg"
        className={classes.orderModal}
        transitionProps={{ duration: 300, transition: "fade" }}
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay
          visible={processingOrder || transitioning}
          overlayProps={{ blur: 3 }}
        />

        {checkoutStep === "address" ? (
          <Stack>
            <Paper p="md" radius="md" withBorder>
              <Group justify="apart" mb="md">
                <Text fw={600} size="md">
                  <IconMapPin
                    size={18}
                    style={{ marginRight: 8, verticalAlign: "text-bottom" }}
                  />
                  Delivery Address
                </Text>
                <Button variant="subtle" onClick={() => setEditing(!editing)} radius="md" size="sm">
                  {editing ? "Cancel" : "Change"}
                </Button>             
                </Group>

              {!editing ? (
                <Paper p="sm" bg="rgba(0,0,0,0.03)" radius="sm">
                  <Text size="md">
                    {userData.delivery_address || "No address set"}
                  </Text>
                </Paper>
              ) : (
                <Box>
                  <Select
                    label="Region"
                    placeholder="Select Region"
                    data={regions}
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    searchable
                    disabled={loadingAddress.region}
                    radius="md"
                    mb="sm"
                  />
                  <Select
                    label="Province"
                    placeholder="Select Province"
                    data={provinces}
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    searchable
                    disabled={!selectedRegion || loadingAddress.province}
                    radius="md"
                    mb="sm"
                  />
                  <Select
                    label="City/Municipality"
                    placeholder="Select City/Municipality"
                    data={citiesMunicipalities}
                    value={selectedCityMunicipality}
                    onChange={handleCityMunicipalityChange}
                    searchable
                    disabled={
                      !selectedProvince || loadingAddress.cityMunicipality
                    }
                    radius="md"
                    mb="sm"
                  />
                  <Select
                    label="Barangay"
                    placeholder="Select Barangay"
                    data={barangays}
                    value={selectedBarangay}
                    onChange={handleBarangayChange}
                    searchable
                    disabled={!selectedCityMunicipality || loadingAddress.barangay}
                    radius="md"
                    mb="sm"
                  />
                  <TextInput
                    label="Exact Address"
                    placeholder="House/Building Number, Street Name"
                    value={exactAddress}
                    onChange={handleExactAddressChange}
                    radius="md"
                    mb="sm"
                  />
                  <Group justify="right" mt="md">
                    <Button variant="default" onClick={handleCancelEdit} radius="md">
                      Cancel
                    </Button>
                    <Button
                      color="teal"
                      onClick={handleSaveAddress}
                      radius="md"
                      style={{
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      Save Address
                    </Button>
                  </Group>
                </Box>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="md" mb="md">
                Order Summary
              </Text>

              {selectedItems.length > 0 && cartData?.items && (
                <Stack gap="xs">
                  {cartData.items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item, index) => (
                      <Transition
                        key={item.id}
                        mounted={true}
                        transition="fade"
                        duration={300}
                        timingFunction={`cubic-bezier(0.25, 0.4, 0.55, ${0.8 + index * 0.05})`}
                        exitDuration={100}
                      >
                        {(styles) => (
                          <Group
                            key={item.id}
                            justify="apart"
                            style={styles}
                          >
                            <Text size="sm" lineClamp={1}>
                              {item.product.name} x{item.quantity}
                            </Text>
                            <Text size="sm" fw={500}>
                              ₱{(item.product.price * item.quantity).toLocaleString()}
                            </Text>
                          </Group>
                        )}
                      </Transition>
                    ))}
                  <Divider my="sm" />
                  <Group justify="space-between">
                    <Text fw={600}>Total Amount</Text>
                    <Text fw={700} size="lg" c="teal">
                      ₱{calculateTotal().toLocaleString()}
                    </Text>
                  </Group>
                </Stack>
              )}
            </Paper>

            <Button
              fullWidth
              style={{
                background: "linear-gradient(45deg, #12b886, #38d9a9)",
                border: "none",
                transition: "transform 0.3s",
              }}
              size="lg"
              mt="md"
              radius="md"
              onClick={() => setCheckoutStep("payment")}
              disabled={
                !userData.delivery_address || userData.delivery_address === ""
              }
              rightSection={<IconArrowRight size={18} />}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Continue to Payment
            </Button>
          </Stack>
        ) : (
          <Stack>
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="md" mb="lg">
                Select Payment Method
              </Text>

              <Select
                label="Payment Method"
                placeholder="Select Payment Method"
                data={qrCodes}
                value={selectedQrCode}
                onChange={setSelectedQrCode}
                searchable
                clearable
                radius="md"
                mb="md"
              />

              {selectedQrCode && (
                <Transition
                  mounted={!!selectedQrCode}
                  transition="fade"
                  duration={300}
                >
                  {(styles: React.CSSProperties) => (
                  <Center mb="lg" style={styles}>
                    <Box>
                    <Image
                      src={
                      qrCodes.find((qr) => qr.value === selectedQrCode)
                        ?.qr_code
                      }
                      alt="QR Code"
                      width={200}
                      height={200}
                      fit="contain"
                      style={{
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Text ta="center" size="sm" c="dimmed" mt="xs">
                      Scan to pay with {selectedQrCode}
                    </Text>
                    </Box>
                  </Center>
                  )}
                </Transition>
              )}

              <FileInput
                label="Upload Proof of Payment"
                placeholder="Choose file"
                accept="image/*"
                onChange={handleProofOfPaymentChange}
                radius="md"
                leftSection={<IconUpload size={16} />}
              />

              {proofOfPaymentPreview && (
                <Transition
                  mounted={!!proofOfPaymentPreview}
                  transition="fade"
                  duration={300}
                >
                  {(styles: React.CSSProperties) => (
                    <Box mt="md" style={styles}>
                      <Text size="sm" fw={500} mb="xs">
                        Payment Proof Preview:
                      </Text>
                      <Image
                        src={proofOfPaymentPreview}
                        alt="Proof of Payment Preview"
                        height={150}
                        radius="md"
                        fit="contain"
                        style={{
                          border: "1px solid #e9ecef",
                          borderRadius: "8px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        }}
                      />
                    </Box>
                  )}
                </Transition>
              )}
            </Paper>

            <Group grow mt="lg">
              <Button
                variant="outline"
                color="gray"
                onClick={() => setCheckoutStep("address")}
                radius="md"
                size="lg"
              >
                Back to Address
              </Button>
              <Button
                style={{
                  background: "linear-gradient(45deg, #12b886, #38d9a9)",
                  border: "none",
                  transition: "transform 0.3s",
                }}
                onClick={handleCheckout}
                disabled={
                  selectedItems.length === 0 || !selectedQrCode || !proofOfPayment
                }
                radius="md"
                size="lg"
              >
                Place Order
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default CartButton;