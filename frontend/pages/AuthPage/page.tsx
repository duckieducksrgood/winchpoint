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
import axios from "axios";
import { useRouter } from "next/router";

export default function AuthPage() {
  const [opened, { toggle }] = useDisclosure();
  const [openedNav, setOpenedNav] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { role, profilePicture, fetchUserData, isLoggedout, setUser } = useUserStore();

  function handleAddToCart(productId: number, quantity: number): void {
    console.log("Nothing to do here. Just a placeholder.");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("login/", {
        username,
        password,
      });

      // After successful login:
      setUser({
        username: response.data.username,
        role: response.data.role, // Include role if available
      });

      // Store token, redirect, etc.

      // Redirect to appropriate page
      router.push("/"); // or wherever
    } catch (error) {
      // Handle login error
    }
  };

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