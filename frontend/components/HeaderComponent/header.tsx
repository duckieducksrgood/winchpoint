import {
  Group,
  Button,
  Text,
  Anchor,
  Divider,
  Box,
  Burger,
  Collapse,
  Avatar,
  Title,
  Container,
  Grid,
  useMantineTheme,
  BackgroundImage,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./HeaderMegaMenu.module.css";
import { logout, useUserStore } from "../../utils/auth";
import { useEffect, useState } from "react";
import { url } from "inspector";

interface HeaderMegaMenuProps {
  openedNav?: boolean;
  setOpenedNav?: (value: boolean) => void;
}
export default function HeaderMegaMenu({
  openedNav,
  setOpenedNav,
}: HeaderMegaMenuProps) {
  const { role, profilePicture, fetchUserData, isLoggedout } = useUserStore();
  const [openedAbout, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();

  useEffect(() => {
    fetchUserData(); // Fetch user data on mount
  }, []);

  // Notify parent component when `opened` state changes
  // useEffect(() => {
  //   if (openedProp) {
  //     openedProp(openedAbout);
  //   }
  // }, [openedAbout, openedProp]);

  return (
    <>
      <Box
        style={{
          borderBottom: "0.5px solid #cab3a8",
          position: "relative",
          zIndex: 1000,
          backgroundImage: 'url("/greenpat.jpg")',
        }}
        pos={"sticky"}
      >
        <Collapse in={openedAbout} style={{ zIndex: 1000 }}>
          <Container>
            <Grid>
              <Grid.Col span={8}>
                <h4 style={{ color: "white" }}>𝗔𝗕𝗢𝗨𝗧</h4>
                <Text c={"white"}>
                  🔧 𝘿.𝙄.𝙔 𝙈𝙖𝙞𝙣𝙩𝙚𝙣𝙖𝙣𝙘𝙚: Dive into the world of hands-on
                  automotive care with our detailed Do-It-Yourself maintenance
                  tutorials. From essential upkeep tasks to pro-level fixes, we
                  empower you to take control of your ride and enhance your DIY
                  skills.
                  <br />
                  <br />
                  🚗 𝘾𝙖𝙧 𝙍𝙚𝙫𝙞𝙚𝙬𝙨: Explore the latest rides and timeless classics
                  with our comprehensive car reviews. We dissect performance,
                  features, design, and overall driving experiences, ensuring
                  you're well-informed before hitting the road or making that
                  next big automotive decision.
                  <br />
                  <br />
                  🌲 𝙊𝙛𝙛-𝙍𝙤𝙖𝙙𝙞𝙣𝙜 𝘼𝙙𝙫𝙚𝙣𝙩𝙪𝙧𝙚𝙨: Join us on adrenaline-pumping
                  off-road escapades, where we push vehicles to their limits in
                  challenging terrains. Experience the thrill of conquering
                  nature's obstacles and discover the freedom that comes with
                  off-road exploration.
                  <br />
                  <br />
                  🏕️ 𝘾𝙖𝙧 𝘾𝙖𝙢𝙥𝙞𝙣𝙜 𝙑𝙡𝙤𝙜𝙨: Embark on a journey beyond the asphalt
                  as we blend the joy of driving with the serenity of camping.
                  Our car camping vlogs provide a glimpse into setting up the
                  perfect mobile campsite, exploring scenic locations, and
                  embracing the adventure of life on the road.
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <h4 style={{ color: "white" }}>𝗖𝗢𝗡𝗧𝗔𝗖𝗧𝗦</h4>
                <Stack>
                  <Anchor
                    href="https://www.instagram.com/uazap21/"
                    target="_blank"
                    underline="never"
                    style={{
                      textDecoration: "none",
                      color: "white", // Set text color to white
                      transition: "transform 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1)")
                    }
                  >
                    Follow on Instagram
                  </Anchor>

                  <Anchor
                    href="https://www.facebook.com/uazap21"
                    target="_blank"
                    underline="never"
                    style={{
                      textDecoration: "none",
                      color: "white", // Set text color to white
                      transition: "transform 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1)")
                    }
                  >
                    Like on Facebook
                  </Anchor>

                  <Anchor
                    href="https://www.youtube.com/c/uazap"
                    target="_blank"
                    underline="never"
                    style={{
                      textDecoration: "none",
                      color: "white", // Set text color to white
                      transition: "transform 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1)")
                    }
                  >
                    Subscribe on Youtube
                  </Anchor>

                  <Anchor
                    href="/Privacy"
                    target="_blank"
                    underline="never"
                    style={{
                      textDecoration: "none",
                      color: "white", // Set text color to white
                      transition: "transform 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.transform = "scale(1)")
                    }
                  >
                    More Info
                  </Anchor>
                </Stack>
              </Grid.Col>
            </Grid>
          </Container>
        </Collapse>
        <header className={classes.header}>
          <Group justify="space-between" h="100%">
            <Group>
              <Avatar
                src="/patch.png"
                alt="Mantine logo"
                w={60}
                h={60}
                component="a"
                href="/"
              />
              <Title c={"white"} order={1}>
                ㄩ 闩 Ⲍ 闩 尸
              </Title>
              <Burger
                onClick={() => setOpenedNav?.(!openedNav)}
                hiddenFrom="sm"
                size="sm"
                color="white"
              />
            </Group>
            <Group justify="flex-end" h="100%" gap={3} visibleFrom="sm">
              {/* pagadmimn */}
              {role === "admin" ? (
                <Group h="100%" gap={0} justify="center">
                  <Anchor
                    href="/AdminPage/InventoryPage"
                    className={classes.link}
                  >
                    Inventory
                  </Anchor>
                  <Anchor href="/AdminPage/OrderPage" className={classes.link}>
                    Orders
                  </Anchor>
                  <Anchor
                    href="/AdminPage/UserManagementPage"
                    className={classes.link}
                  >
                    User Management
                  </Anchor>
                </Group>
              ) : (
                <Group h="100%" gap={0}>
                  <Anchor href="/" className={classes.link}>
                    Home
                  </Anchor>
                  <Anchor href="/ProductPage/page" className={classes.link}>
                    Merch
                  </Anchor>
                  <Anchor href="/AboutPage/page" className={classes.link}>
                    More Info
                  </Anchor>
                </Group>
              )}

              <Burger color="white" opened={openedAbout} onClick={toggle} />
              {/* kung nakalogin ba */}
              {isLoggedout ? (
                <Group visibleFrom="sm">
                  <Button variant="default" component="a" href="/AuthPage/page">
                    Log in
                  </Button>
                </Group>
              ) : (
                <Group visibleFrom="sm">
                  <Button variant="default" onClick={logout}>
                    Logout
                  </Button>
                </Group>
              )}
            </Group>
          </Group>
        </header>
      </Box>
      
    </>
  );
}
