import {
  AppShell,
  AspectRatio,
  Burger,
  Button,
  Container,
  Group,
  Title,
  Text,
  UnstyledButton,
  Image,
  Card,
  Badge,
  Flex,
  Stack,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "../components/module.css/MobileNavbar.module.css";
import HeaderMegaMenu from "../components/HeaderComponent/header";
import { useState } from "react";
import { useUserStore } from "../utils/auth";
import CartButton from "../components/CartButtonComponent/cartButton";
import OrderButton from "../components/OrderButtonComponent/orderButton";
import HeaderNav from "../components/HeaderComponent/headerNav";
import { Carousel } from "@mantine/carousel";

export default function IndexPage() {
  const [opened, { toggle }] = useDisclosure();
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, profilePicture, fetchUserData, isLoggedout } = useUserStore();

  function handleAddToCart(productId: number, quantity: number): void {
    console.log("Nothing to do here. Just a placeholder.");
  }
  const [openedNav, setOpenedNav] = useState(false);

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

      <AppShell.Main p={0}>
        <Container fluid p={0} m={0}>
          <Carousel
            height={600}
            loop
            withControls
            styles={{
              indicator: {
                backgroundColor: "white",
              },
            }}
          >
            <Carousel.Slide>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="1.mp4" type="video/mp4" />
              </video>
            </Carousel.Slide>
            <Carousel.Slide>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="2.mp4" type="video/mp4" />
              </video>
            </Carousel.Slide>
            <Carousel.Slide>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="3.mp4" type="video/mp4" />
              </video>
            </Carousel.Slide>
            <Carousel.Slide>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="4.mp4" type="video/mp4" />
              </video>
            </Carousel.Slide>
            <Carousel.Slide>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="5.mp4" type="video/mp4" />
              </video>
            </Carousel.Slide>
          </Carousel>
        </Container>

        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            textAlign: "center",
          }}
        >
          <Title order={1}>𝚆𝚒𝚗𝚌𝚑 𝙿𝚘𝚒𝚗𝚝 𝙾𝚏𝚏𝚛𝚘𝚊𝚍 𝙷𝚘𝚞𝚜𝚎</Title>
          <Text>
            Ride along for D.I.Y maintenance, car review, off-roading, and car
            camping vlogs!
          </Text>
        </div>

        <Container fluid p={0} m={0} bg={"#738873"}>
  <Title ta={"center"} c={"white"} order={1} p={50} style={{ fontSize: "2.5rem" }}>
    Products Review
  </Title>
  <Flex
    direction={{ base: "column", sm: "row" }}
    gap={{ base: "sm", sm: "lg" }}
    justify={{ sm: "center" }}
    p={50}
    wrap="wrap"
  >
    {[
      {
        title: "4 Wax Battle Part 1",
        href: "https://www.youtube.com/watch?v=3GwQ2rXD1aI",
        img: "https://img.youtube.com/vi/3GwQ2rXD1aI/maxresdefault.jpg",
      },
      {
        title: "P&S Brake Buster Review",
        href: "https://www.youtube.com/watch?v=-83OdoaUVPo",
        img: "https://img.youtube.com/vi/-83OdoaUVPo/maxresdefault.jpg",
      },
      {
        title: "Car Shampoo Foam Battle",
        href: "https://www.youtube.com/watch?v=vO3kZWoGvWo&t=64s",
        img: "https://img.youtube.com/vi/vO3kZWoGvWo/maxresdefault.jpg",
      },
    ].map((product, index) => (
      <Card
        key={index}
        shadow="lg"
        padding="xl"
        radius="md"
        bg={"#8f9f8f"}
        c={"white"}
        style={{
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          border: "2px solid #ffffff",
          borderRadius: "10px",
          maxWidth: "300px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 10px 20px rgba(0, 0, 0, 0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <Card.Section
          component="a"
          href={product.href}
          style={{
            overflow: "hidden",
            borderRadius: "8px",
          }}
        >
          <Image
            src={product.img}
            h={200}
            alt={product.title}
            style={{
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLImageElement).style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLImageElement).style.transform = "scale(1)")
            }
          />
        </Card.Section>

        <Group justify="center" mt="md" mb="xs">
          <Text fw={700} ta="center" style={{ fontSize: "1.2rem" }}>
            {product.title}
          </Text>
        </Group>

        <Button
  variant="filled" // Use "filled" for a solid button
  color="red" // Set the button color to red
  fullWidth
  mt="md"
  radius="md"
  component="a"
  href={product.href}
>
  Watch Now
</Button>
      </Card>
    ))}
  </Flex>
</Container>

        <Container fluid p={0} m={0} bg={"#b6c4b6"}>
          <Stack justify="column" align="center" gap="md" p={250}>
            <Title ta={"center"} c={"black"} order={1}>
              Empowering Your Automotive Journey
            </Title>
            <Text ta={"center"} c={"black"} w={500}>
              From DIY Mastery to Off-Road Thrills and Serene Car Camping
              Escapades. Join us as we rev up your passion for cars, skills in
              maintenance, and the thrill of exploration on and off the road.
              Your adventure begins with 𝐖𝐢𝐧𝐜𝐡 𝐏𝐨𝐢𝐧𝐭 𝐎𝐟𝐟𝐫𝐨𝐚𝐝 𝐇𝐨𝐮𝐬𝐞!
            </Text>
          </Stack>
        </Container>

          <Container fluid p={0} m={0} bg={"#738873"}>
            <Title ta={"center"} c={"white"} order={1} p={100}>
              𝗢𝗙𝗙-𝗥𝗢𝗔𝗗𝗜𝗡𝗚
            </Title>
            <Flex
              direction={{ base: "column", sm: "row" }}
              gap={{ base: "sm", sm: "lg" }}
              justify={{ sm: "center" }}
              p={50}
            >
              <Card
                shadow="sm"
                padding="xl"
                radius="md"
                bg={"#8f9f8f"}
                c={"white"}
              >
                <Card.Section
                  component="a"
                  href="https://www.youtube.com/watch?v=bQwWBingo00"
                >
                  <Image
                    src="https://img.youtube.com/vi/bQwWBingo00/maxresdefault.jpg"
                    h={160}
                    alt="Norway"
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500}>
                    𝗖𝗮𝗿 𝗖𝗮𝗺𝗽𝗶𝗻𝗴 & 𝗢𝗳𝗳 𝗥𝗼𝗮𝗱𝗶𝗻𝗴 𝗮𝘁 <br />
                    𝗥𝗶𝘃𝗲𝗿 𝗥𝗮𝗻𝗰𝗵
                  </Text>
                </Group>

                <Button
                  variant="outline"
                  color="white"
                  fullWidth
                  mt="md"
                  radius="md"
                  component="a"
                  href="https://www.youtube.com/watch?v=bQwWBingo00"
                >
                  Watch Now
                </Button>
              </Card>

              <Card
                shadow="sm"
                padding="xl"
                radius="md"
                bg={"#8f9f8f"}
                c={"white"}
              >
                <Card.Section
                  component="a"
                  href="https://www.youtube.com/watch?v=DfAARf8OZiM"
                >
                  <Image
                    src="https://img.youtube.com/vi/DfAARf8OZiM/maxresdefault.jpg"
                    h={160}
                    alt="Norway"
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500}>
                    𝗢𝗳𝗳 𝗥𝗼𝗮𝗱𝗶𝗻𝗴 𝗶𝗻 𝘁𝗵𝗲 𝗖𝗶𝘁𝘆❗ <br />| 𝟮𝟬𝟮𝟯 𝟰𝗫𝟰 𝗘𝘅𝗽𝗼 𝗣𝗵𝗶𝗹𝗶𝗽𝗽𝗶𝗻𝗲𝘀
                  </Text>
                </Group>

                <Button
                  variant="outline"
                  color="white"
                  fullWidth
                  mt="md"
                  radius="md"
                  component="a"
                  href="https://www.youtube.com/watch?v=DfAARf8OZiM"
                >
                  Watch Now
                </Button>
              </Card>

              <Card
                shadow="sm"
                padding="xl"
                radius="md"
                bg={"#8f9f8f"}
                c={"white"}
              >
                <Card.Section
                  component="a"
                  href="https://www.youtube.com/watch?v=a24DKf4LkSU"
                >
                  <Image
                    src="https://img.youtube.com/vi/a24DKf4LkSU/maxresdefault.jpg"
                    h={160}
                    alt="Norway"
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text ta={"center"} fw={500}>
                    𝗣𝗶𝗰𝗼 𝗱𝗲 𝗟𝗼𝗿𝗼 𝗧𝗿𝗮𝗶𝗹 | 𝗠𝗮𝗿𝗮𝗴𝗼𝗻𝗱𝗼𝗻 <br />| 𝗛𝗶𝗹𝘂𝘅 𝗖𝗼𝗻𝗾𝘂𝗲𝘀𝘁 𝟰𝘅𝟰 |
                    𝗠𝘂𝗱𝗱𝘆 𝗧𝗿𝗮𝗶𝗹
                  </Text>
                </Group>

                <Button
                  variant="outline"
                  color="white"
                  fullWidth
                  mt="md"
                  radius="md"
                  component="a"
                  href="https://www.youtube.com/watch?v=a24DKf4LkSU"
                >
                  Watch Now
                </Button>
              </Card>
            </Flex>
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
