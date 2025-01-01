import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Divider,
  Image,
  Box,
  Stack,
  Grid,
  AppShell,
  UnstyledButton,
  Paper,
  Burger,
} from "@mantine/core";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import classes from "../../components/module.css/MobileNavbar.module.css";
import { useDisclosure } from "@mantine/hooks";
import { useUserStore } from "../../utils/auth";
import CartButton from "../../components/CartButtonComponent/cartButton";
import OrderButton from "../../components/OrderButtonComponent/orderButton";
import HeaderNav from "../../components/HeaderComponent/headerNav";

export default function AboutPage() {
  const { isLoggedout } = useUserStore();
  const [opened2, setOpened2] = useState(false);
  const [openedNav, setOpenedNav] = useState(false);

  function handleAddToCart(productId: number, quantity: number): void {
    console.log("Nothing to do here. Just a placeholder.");
  }

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

      <AppShell.Main bg="#B6C4B6">
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Box mb={50}>
              <Title order={1} ta="center" mb="md">
                𝐈𝐍𝐅𝐎 𝐀𝐁𝐎𝐔𝐓 𝐓𝐇𝐄 𝐏𝐑𝐎𝐆𝐑𝐀𝐌𝐌𝐄𝐑𝐒
              </Title>
              <Text ta="center" color="dimmed" size="lg">
                𝚃𝙷𝙴 𝙼𝙴𝙽, 𝚃𝙷𝙴 𝙼𝚈𝚃𝙷, 𝚃𝙷𝙴 𝙻𝙴𝙶𝙴𝙽𝙳 𝚃𝙷𝙴𝙼𝚂𝙴𝙻𝚅𝙴𝚂
              </Text>
            </Box>

            <Paper p="xl" radius="md" mb={30} bg="#B6C4B6">
              <Grid gutter={50} align="center">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack>
                    <Title order={2} style={{ color: "#222" }}>
                      𝗞𝗨𝗥𝗧 𝗟𝗔𝗪𝗥𝗘𝗡𝗖𝗘 𝗗. 𝗠𝗔𝗧𝗜𝗔𝗦
                    </Title>
                    <Text size="lg" style={{ color: "#333" }}>
                      👋 Hello there! I'm Matias, a passionate 4th-year BSIT
                      student at DLSUD, navigating the exciting world of
                      technology. As a typical college student, you'll often
                      find me immersed in books, coding challenges, and the
                      vibrant campus life.
                      <br />
                      <br />
                      💻 Currently honing my skills in web development, I enjoy
                      translating ideas into code. One of my recent projects is
                      this uazap page, a digital space where automotive
                      enthusiasts unite. From DIY car maintenance to off-roading
                      adventures, it's a journey through the gears and gadgets
                      that fuel our passion for the road.
                      <br />
                      <br />
                      🚗 When I'm not in front of the screen, I'm either
                      exploring the latest tech trends or gearing up for my next
                      coding challenge. Join me on this journey of bytes, bits,
                      and everything in between!
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Image
                    src="/akosikurt.jpg"
                    alt="Kurt Lawrence D. Matias"
                    radius="md"
                    h={400}
                    fit="cover"
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper bg="#B6C4B6" p="xl" radius="md">
              <Grid gutter={50} align="center">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack>
                    <Title order={2} style={{ color: "#222" }}>
                      𝗞𝗘𝗡 𝗦𝗔𝗧𝗢
                    </Title>
                    <Text size="lg" style={{ color: "#333" }}>
                      👋 Hi! I'm Ken Sato, a dedicated 4th-year BSIT student at
                      DLSUD. My journey in technology has been a thrilling ride
                      filled with learning and innovation. I thrive on solving
                      complex problems and bringing ideas to life through code.
                      <br />
                      <br />
                      💻 My current focus is on software development, where I
                      aim to create impactful solutions. This uazap page is one
                      of my collaborative projects, designed to connect
                      automotive enthusiasts. Whether it's about car care tips
                      or the latest in automotive tech, this platform is a hub
                      for all things automotive.
                      <br />
                      <br />
                      🚗 Outside of coding, I enjoy exploring new technologies
                      and staying updated with industry trends. I'm always ready
                      for the next challenge and excited to see where my tech
                      journey takes me next.
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Image
                    src="/akosiken.jpg"
                    alt="Ken Sato"
                    radius="md"
                    h={400}
                    fit="cover"
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </Stack>
        </Container>

        {!isLoggedout && (
          <Box style={{ position: "fixed", bottom: "2rem", right: "2rem" }}>
            <Stack gap="sm">
              <OrderButton />
              <CartButton onAddToCart={handleAddToCart} />
            </Stack>
          </Box>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
