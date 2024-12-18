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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./HeaderMegaMenu.module.css";
import { logout, useUserStore } from "../../utils/auth";
import { useEffect } from "react";

interface HeaderMegaMenuProps {
  openedProp?: (value: boolean) => void; // Optional callback to send `opened` state externally
}

export default function HeaderMegaMenu({ openedProp }: HeaderMegaMenuProps) {
  const { role, profilePicture, fetchUserData, isLoading } = useUserStore();
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();

  useEffect(() => {
    fetchUserData(); // Fetch user data on mount
  }, []);

  // Notify parent component when `opened` state changes
  useEffect(() => {
    if (openedProp) {
      openedProp(opened);
    }
  }, [opened, openedProp]);

  return (
    <>
      <Box
        style={{
          borderBottom: "0.5px solid #cab3a8",
          position: "relative",
          zIndex: 1000,
        }}
        pos={"sticky"}
      >
        <Collapse in={opened} style={{ zIndex: 1000 }}>
          <Container>
            <Grid>
              <Grid.Col span={8}>
                <h4>𝗔𝗕𝗢𝗨𝗧</h4>
                <Text>
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
                <h4>𝗖𝗢𝗡𝗧𝗔𝗖𝗧𝗦</h4>
                <ul>
                  <li>
                    <Anchor
                      href="https://www.instagram.com/uazap21/"
                      target="_blank"
                    >
                      Follow on Instagram
                    </Anchor>
                  </li>
                  <li>
                    <Anchor
                      href="https://www.facebook.com/uazap21"
                      target="_blank"
                    >
                      Like on Facebook
                    </Anchor>
                  </li>
                  <li>
                    <Anchor
                      href="https://www.youtube.com/c/uazap"
                      target="_blank"
                    >
                      Subscribe on Youtube
                    </Anchor>
                  </li>
                  <li>
                    <Anchor href="/Privacy" target="_blank">
                      More Info
                    </Anchor>
                  </li>
                </ul>
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
              <Title order={1}>ㄩ 闩 Ⲍ 闩 尸</Title>
            </Group>
            <Group h="100%" gap={0} grow visibleFrom="sm">
              {role === "admin" ? (
                <Group h="100%" gap={0} justify="center">
                  <Anchor href="/ProductPage/page" className={classes.link}>
                    Flower Arrangement
                  </Anchor>
                  <Anchor href="/CustomerPage/page" className={classes.link}>
                    Customers
                  </Anchor>
                  <Anchor href="/AnalyticsPage/page" className={classes.link}>
                    Analytics
                  </Anchor>
                  <Anchor href="/OrderPage/page" className={classes.link}>
                    Orders
                  </Anchor>
                  <Anchor href="/SchedulesPage/page" className={classes.link}>
                    Schedules
                  </Anchor>
                </Group>
              ) : (
                <Group h="100%" gap={0} justify="center">
                  <Anchor href="/" className={classes.link}>
                    Home
                  </Anchor>
                  <Anchor href="/SchedulerPage/page" className={classes.link}>
                    Merch
                  </Anchor>
                  <Anchor href="/AboutPage/page" className={classes.link}>
                    More Info
                  </Anchor>
                </Group>
              )}
            </Group>

            {isLoading ? (
              <Group visibleFrom="sm">
                <Button variant="default" component="a" href="/AuthPage/page">
                  Log in
                </Button>
              </Group>
            ) : (
              <Group visibleFrom="sm">
                <Burger
                  opened={opened}
                  onClick={toggle}
                  aria-label="Toggle navigation"
                />
                <Avatar
                  variant="transparent"
                  radius="sm"
                  src={profilePicture}
                  component="a"
                  href="/ProfilePage/page"
                />
                <Button variant="default" onClick={logout}>
                  Logout
                </Button>
              </Group>
            )}
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
          </Group>
        </header>
      </Box>
    </>
  );
}
