import { AppShell, Burger, Group, Stack, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "../../components/module.css/MobileNavbar.module.css";
import AuthenticationImage from "../../components/AuthPagecomponents/authpage";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import CartButton from "../../components/CartButtonComponent/cartButton";
import OrderButton from "../../components/OrderButtonComponent/orderButton";
import { useUserStore } from "../../utils/auth";
import { useState } from "react";
import HeaderNav from "../../components/HeaderComponent/headerNav";

export default function AuthPage() {
  const [opened, { toggle }] = useDisclosure();
  const [openedNav, setOpenedNav] = useState(false);

  function handleAddToCart(productId: number, quantity: number): void {
    console.log("Nothing to do here. Just a placeholder.");
  }
  const { role, profilePicture, fetchUserData, isLoggedout } = useUserStore();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !openedNav },
      }}
      padding="md"
    >
      <AppShell.Header>
        <HeaderMegaMenu openedNav={openedNav} setOpenedNav={setOpenedNav} />
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <HeaderNav openedNav={openedNav} setOpenedNav={setOpenedNav} />
      </AppShell.Navbar>
      <AppShell.Main bg={"#B6C4B6"} p={0}>
        <AuthenticationImage />
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
