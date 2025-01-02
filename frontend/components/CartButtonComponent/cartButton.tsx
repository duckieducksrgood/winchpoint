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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";
import { notifications } from "@mantine/notifications";
import { IconShoppingCart, IconTrash } from "@tabler/icons-react";
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
  } = useSWR<ICart>("cart/", fetcher, { refreshInterval: 1000 });

  //pangadd ng proof of payment
  const [qrCodes, setQrCodes] = useState<
    { value: string; label: string; qr_code: string }[]
  >([]);
  const { data: qrData } = useSWR("qr/", fetcher);
  // Add these states inside the CartButton component
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<
    string | null
  >(null);

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
    profile_picture: null,
    delivery_address: "",
  });

  // Address States
  const [regions, setRegions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [provinces, setProvinces] = useState<
    { value: string; label: string }[]
  >([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<
    { value: string; label: string }[]
  >([]);
  const [barangays, setBarangays] = useState<
    { value: string; label: string }[]
  >([]);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCityMunicipality, setSelectedCityMunicipality] = useState<
    string | null
  >(null);
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
      await axios.delete("cart/", {
        data: { product_id: productId },
      });
      await mutate();
      notifications.show({
        title: "Success",
        message: "Item removed from cart",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to remove item",
        color: "red",
      });
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
      });
      return;
    }

    if (!selectedQrCode || !proofOfPayment) {
      notifications.show({
        title: "Error",
        message: "Please select a payment method and upload proof of payment",
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    // Convert array to comma-separated string
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
      closeCheckout();
      close();
      notifications.show({
        title: "Success",
        message: "Order placed successfully",
        color: "green",
      });
      setSelectedItems([]);
      setSelectedQrCode(null);
      setProofOfPayment(null);
      setProofOfPaymentPreview(null);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to place order",
        color: "red",
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
        color: "green",
      });
      setEditing(false);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to update address",
        color: "red",
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
    return <LoadingOverlay visible={true} />;
  }

  return (
    <>
      <Group>
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
          }}
        >
          Cart
          {cartData && cartData.items && cartData.items.length > 0 && (
            <Badge color="red" variant="filled" size="sm" ml={5}>
              {cartData.items.length}
            </Badge>
          )}
        </Button>
      </Group>

      <Modal
        centered
        opened={opened}
        onClose={close}
        title="Your Cart"
        size="lg"
      >
        <Stack>
          {cartData?.items.length === 0 && (
            <Text ta="center" c="dimmed">
              Your cart is empty
            </Text>
          )}
          {cartData?.items.map((item) => (
            <Checkbox.Card
              key={item.id}
              className={classes.root}
              radius="md"
              checked={selectedItems.includes(item.id)}
              onClick={() => handleItemSelect(item.id)}
            >
              <Group wrap="nowrap" align="flex-start">
                <Checkbox.Indicator />
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  width={80}
                  height={80}
                  radius="md"
                  fit="cover"
                />
                <div>
                  <Text className={classes.label}>{item.product.name}</Text>
                  <Text className={classes.description}>
                    Quantity: {item.quantity}
                  </Text>
                  <Text className={classes.description}>
                    Price: ₱{item.product.price * item.quantity}
                  </Text>
                </div>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.product.productID);
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Checkbox.Card>
          ))}
          {cartData && cartData.items && cartData.items.length > 0 && (
            <>
              <Center>
                <Pagination
                  total={Math.ceil(cartData.items.length / 5)}
                  value={activePage}
                  onChange={setPage}
                  mt="sm"
                />
              </Center>
              <Stack gap="xs" mt="md">
                <Text fw={500} ta="right">
                  Total Selected: ₱{calculateTotal()}
                </Text>
                <Button
                  fullWidth
                  color="green"
                  onClick={openCheckout}
                  disabled={selectedItems.length === 0}
                >
                  Checkout Selected Items ({selectedItems.length})
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Modal>

      {/* checkout modal */}
      <Modal
        centered
        opened={checkoutOpened}
        onClose={closeCheckout}
        title="Checkout"
        size="lg"
      >
        <Stack>
          <Group justify="apart">
            <Text>Delivery Address:</Text>
            <Button variant="subtle" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel Edit" : "Change Address"}
            </Button>
          </Group>
          {!editing ? (
            <TextInput
              value={userData.delivery_address}
              readOnly
              style={{ flex: 1 }}
            />
          ) : (
            <>
              <Select
                label="Region"
                placeholder="Select Region"
                data={regions}
                value={selectedRegion}
                onChange={handleRegionChange}
                searchable
                disabled={loadingAddress.region}
              />
              <Select
                label="Province"
                placeholder="Select Province"
                data={provinces}
                value={selectedProvince}
                onChange={handleProvinceChange}
                searchable
                disabled={!selectedRegion || loadingAddress.province}
              />
              <Select
                label="City/Municipality"
                placeholder="Select City/Municipality"
                data={citiesMunicipalities}
                value={selectedCityMunicipality}
                onChange={handleCityMunicipalityChange}
                searchable
                disabled={!selectedProvince || loadingAddress.cityMunicipality}
              />
              <Select
                label="Barangay"
                placeholder="Select Barangay"
                data={barangays}
                value={selectedBarangay}
                onChange={handleBarangayChange}
                searchable
                disabled={!selectedCityMunicipality || loadingAddress.barangay}
              />
              <TextInput
                label="Exact Address"
                placeholder="House/Building Number, Street Name"
                value={exactAddress}
                onChange={handleExactAddressChange}
              />
              <Group justify="right" mt="md">
                <Button variant="default" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button color="green" onClick={handleSaveAddress}>
                  Save
                </Button>
              </Group>
            </>
          )}
          <Text fw={500} ta="right">
            Total Amount: ₱{calculateTotal()}
          </Text>
          {/* // Add these elements inside the checkout modal's Stack component */}
          <Select
            label="Payment Method"
            placeholder="Select Payment Method"
            data={qrCodes}
            value={selectedQrCode}
            onChange={setSelectedQrCode}
            searchable
            clearable
          />
          {selectedQrCode && (
            <Image
              src={qrCodes.find((qr) => qr.value === selectedQrCode)?.qr_code}
              alt="QR Code"
              width={150}
              height={150}
              fit="contain"
              mb="md"
            />
          )}
          <FileInput
            label="Upload Proof of Payment"
            placeholder="Choose file"
            accept="image/*"
            onChange={handleProofOfPaymentChange}
            mb="md"
          />
          {proofOfPaymentPreview && (
            <Image
              src={proofOfPaymentPreview}
              alt="Proof of Payment Preview"
              w={150}
              h={50}
            />
          )}
          <Button
            fullWidth
            color="green"
            onClick={handleCheckout}
            disabled={selectedItems.length === 0 || (editing && !exactAddress)}
          >
            Confirm Order
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

export default CartButton;
