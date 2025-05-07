import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Image,
  Box,
  Stack,
  Grid,
  AppShell,
  Paper,
  Group,
  Card,
  Flex,
  Badge,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconCode,
  IconDeviceLaptop,
  IconBrandReact,
  IconUser,
  IconSchool,
  IconBriefcase,
  IconCar,
  IconMountain,
  IconTool,
  IconCompass,
} from "@tabler/icons-react";
import HeaderMegaMenu from "../../components/HeaderComponent/header";
import { useUserStore } from "../../utils/auth";
import CartButton from "../../components/CartButtonComponent/cartButton";
import OrderButton from "../../components/OrderButtonComponent/orderButton";
import HeaderNav from "../../components/HeaderComponent/headerNav";

export default function AboutPage() {
  const { isLoggedout } = useUserStore();
  const [openedNav, setOpenedNav] = useState(false);
  const theme = useMantineTheme();

  function handleAddToCart(productId: number, quantity: number): void {
    console.log("Nothing to do here. Just a placeholder.");
  }

  const programmers = [
    {
      name: "Kurt Lawrence D. Matias",
      image: "/akosikurt.jpg",
      role: "Frontend Developer",
      bio: `Hello there! I'm Matias, a passionate 4th-year BSIT student at DLSUD, navigating the exciting world of technology. As a typical college student, you'll often find me immersed in books, coding challenges, and the vibrant campus life.

      Currently honing my skills in web development, I enjoy translating ideas into code. One of my recent projects is this Winch Point Offroad House platform, a digital space where off-road enthusiasts unite. From trail navigation to vehicle modifications, it's a journey through the gear and equipment that fuel our passion for off-road adventures.
      
      When I'm not in front of the screen, I'm either exploring the latest tech trends or gearing up for my next coding challenge. Join me on this journey of bytes, bits, and everything in between!`,
      skills: ["React", "TypeScript", "UI/UX Design", "Responsive Web Development"],
      social: {
        github: "https://github.com/username",
        linkedin: "https://linkedin.com/in/username",
      },
    },
    {
      name: "Ken Sato",
      image: "/akosiken.jpg",
      role: "Backend Developer",
      bio: `Hi! I'm Ken Sato, a dedicated 4th-year BSIT student at DLSUD. My journey in technology has been a thrilling ride filled with learning and innovation. I thrive on solving complex problems and bringing ideas to life through code.

      My current focus is on software development, where I aim to create impactful solutions. This Winch Point Offroad House platform is one of my collaborative projects, designed to connect off-road enthusiasts. Whether it's about trail maps or the latest in 4x4 tech, this platform is a hub for all things off-road.
      
      Outside of coding, I enjoy exploring new technologies and staying updated with industry trends. I'm always ready for the next challenge and excited to see where my tech journey takes me next.`,
      skills: ["Python", "Django", "Database Design", "API Development"],
      social: {
        github: "https://github.com/username",
        linkedin: "https://linkedin.com/in/username",
      },
    },
  ];

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

      <AppShell.Main bg="#f8f9fa">
        <Box
          pt={100}
          pb={60}
          style={{
            backgroundColor: "#3A4D39",
            backgroundImage: "linear-gradient(135deg, #3A4D39 0%, #4F6F52 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          <Container size="lg">
            <Grid align="center" justify="center" gutter={50}>
              <Grid.Col span={{ base: 12, md: 10 }}>
                <Box style={{ zIndex: 2, position: "relative" }}>
                  <Group justify="center" mb="md">
                    <div style={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.15)", 
                      borderRadius: "50%", 
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <IconMountain size={42} stroke={1.5} />
                    </div>
                  </Group>
                  <Title 
                    order={1} 
                    ta="center" 
                    mb="md" 
                    ff="'Poppins', sans-serif" 
                    fw={800}
                    style={{ 
                      fontSize: "2.8rem",
                      letterSpacing: "-0.5px",
                      textShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)" 
                    }}
                  >
                    Meet Our Team
                  </Title>
                  <Text 
                    ta="center" 
                    size="xl" 
                    c="gray.1" 
                    maw={700} 
                    mx="auto"
                    fw={400}
                    lh={1.6}
                    style={{ 
                      textShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
                      opacity: 0.95
                    }}
                  >
                    The passionate developers behind <span style={{ fontWeight: 600 }}>Winch Point Offroad House</span> — where off-road adventure meets cutting-edge technology
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Container>
          
          {/* Decorative elements */}
          <Box 
            style={{ 
              position: "absolute", 
              bottom: -15, 
              right: -15, 
              opacity: 0.15, 
              transform: "rotate(15deg)" 
            }}
          >
            <IconMountain size={160} stroke={1} />
          </Box>
          <Box 
            style={{ 
              position: "absolute", 
              top: -20, 
              left: -20, 
              opacity: 0.1, 
              transform: "rotate(-15deg)" 
            }}
          >
            <IconCompass size={120} stroke={1} />
          </Box>
        </Box>

        <Container size="lg" py="xl">
          <Stack gap={50}>
            {programmers.map((programmer, index) => (
              <Card
                key={index}
                shadow="sm"
                padding="xl"
                radius="md"
                withBorder
                bg="white"
                style={{
                  transition: "transform 0.3s ease",
                  ":hover": {
                    transform: "translateY(-5px)"
                  }
                }}
              >
                <Grid gutter={40}>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Box>
                      <Image
                        src={programmer.image}
                        alt={programmer.name}
                        radius="md"
                        height={320}
                        fit="cover"
                        mb="md"
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Group justify="center" gap="md">
                        <Box 
                          component="a" 
                          href={programmer.social.github} 
                          target="_blank"
                          style={{
                            backgroundColor: "#f0f0f0",
                            borderRadius: "50%",
                            padding: "10px",
                            display: "flex",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "#e0e0e0",
                              transform: "translateY(-3px)"
                            }
                          }}
                        >
                          <IconBrandGithub size={24} />
                        </Box>
                        <Box 
                          component="a" 
                          href={programmer.social.linkedin} 
                          target="_blank"
                          style={{
                            backgroundColor: "#f0f0f0",
                            borderRadius: "50%",
                            padding: "10px",
                            display: "flex",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "#e0e0e0",
                              transform: "translateY(-3px)"
                            }
                          }}
                        >
                          <IconBrandLinkedin size={24} color="#0077B5" />
                        </Box>
                      </Group>
                    </Box>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="md">
                      <Group justify="apart" align="center">
                        <Title order={2} ff="'Poppins', sans-serif" fw={700}>
                          {programmer.name}
                        </Title>
                        <Badge 
                          size="lg" 
                          color="green" 
                          variant="filled"
                          leftSection={<IconBriefcase size={14} />}
                          style={{
                            textTransform: "none",
                            fontSize: "0.9rem"
                          }}
                        >
                          {programmer.role}
                        </Badge>
                      </Group>

                      <Group gap="xs">
                        <IconSchool size={18} color={theme.colors.green[6]} />
                        <Text size="sm" fw={500} c="dimmed">BSIT Student at De La Salle University - Dasmariñas</Text>
                      </Group>

                      <Text 
                        size="md" 
                        style={{ 
                          whiteSpace: 'pre-line', 
                          lineHeight: 1.7,
                          color: theme.colors.dark[7]
                        }}
                        mt="sm"
                      >
                        {programmer.bio}
                      </Text>

                      <Box mt="md">
                        <Group mb="sm" align="center">
                          <IconCode size={18} color={theme.colors.green[6]} />
                          <Text fw={600} c={theme.colors.dark[8]}>Skills</Text>
                        </Group>
                        <Flex gap="xs" wrap="wrap">
                          {programmer.skills.map((skill, i) => (
                            <Badge 
                              key={i} 
                              size="md" 
                              radius="md" 
                              variant="outline" 
                              color={i % 2 === 0 ? "green" : "teal"}
                              style={{ fontWeight: 500 }}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            ))}

            <Card 
              shadow="sm" 
              padding="xl" 
              radius="md" 
              withBorder
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
              }}
            >
              <Group justify="center" gap="md" mb="lg">
                <Box
                  style={{
                    backgroundColor: theme.colors.green[0],
                    borderRadius: "50%",
                    padding: 12,
                    display: "flex"
                  }}
                >
                  <IconCar size={34} color={theme.colors.green[6]} />
                </Box>
                <Title order={3} ff="'Poppins', sans-serif" fw={700}>
                  About Winch Point Offroad House
                </Title>
              </Group>
              <Text 
                size="md" 
                ta="center" 
                maw={700} 
                mx="auto" 
                lh={1.8}
                c="dark.7"
                style={{ fontSize: "1.05rem" }}
              >
                Winch Point Offroad House is a premier destination for off-road enthusiasts,
                providing specialized equipment, parts, and expertise for adventure-seeking drivers.
                From rugged terrain accessories to performance upgrades for 4x4 vehicles,
                our platform connects off-roading communities with quality products and knowledge.
                Built with modern web technologies, we offer a seamless experience for exploring
                off-road gear, sharing trail experiences, and connecting with fellow enthusiasts.
              </Text>
              <Group justify="center" mt="xl" gap={50}>
                <Group gap="xs" align="center">
                  <Box
                    style={{
                      backgroundColor: theme.colors.green[0],
                      borderRadius: "50%",
                      padding: 10,
                      display: "flex"
                    }}
                  >
                    <IconTool size={22} color={theme.colors.green[6]} />
                  </Box>
                  <Text size="md" fw={600} c="dark.7">Quality Equipment</Text>
                </Group>
                <Group gap="xs" align="center">
                  <Box
                    style={{
                      backgroundColor: theme.colors.green[0],
                      borderRadius: "50%",
                      padding: 10,
                      display: "flex"
                    }}
                  >
                    <IconCompass size={22} color={theme.colors.green[6]} />
                  </Box>
                  <Text size="md" fw={600} c="dark.7">Trail Expertise</Text>
                </Group>
                <Group gap="xs" align="center">
                  <Box
                    style={{
                      backgroundColor: theme.colors.green[0],
                      borderRadius: "50%",
                      padding: 10,
                      display: "flex"
                    }}
                  >
                    <IconMountain size={22} color={theme.colors.green[6]} />
                  </Box>
                  <Text size="md" fw={600} c="dark.7">Adventure Community</Text>
                </Group>
              </Group>
            </Card>
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