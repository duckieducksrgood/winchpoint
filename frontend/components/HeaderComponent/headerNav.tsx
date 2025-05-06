import {
  Stack,
  Anchor,
  Button,
  Box,
  Avatar,
  Title,
  Burger,
  Group,
} from "@mantine/core";
import { useUserStore, logout } from "../../utils/auth";
import classes from "./HeaderMegaMenu.module.css";

interface HeaderNavProps {
  openedNav?: boolean;
  setOpenedNav?: (value: boolean) => void;
}

export default function HeaderNav({ openedNav, setOpenedNav }: HeaderNavProps) {
  const { role, isLoggedout } = useUserStore();

  return (
    <Box
      style={{
        borderBottom: "0.5px solid #cab3a8",
        position: "fixed",
        width: "100%",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundImage: 'url("/greenpat.jpg")',
      }}
      hiddenFrom="sm"
    >
      <Box className={classes.header}>
        <Group justify="space-between" align="center" w="100%">
          <Group>
            <Avatar
              src="/patch.png"
              alt="Mantine logo"
              w={40}
              h={40}
              component="a"
              href="/"
            />
            <Title c="white" order={3}>
            𝑾𝒊𝒏𝒄𝒉 𝑷𝒐𝒊𝒏𝒕 𝑶𝒇𝒇𝒓𝒐𝒂𝒅 𝑯𝒐𝒖𝒔𝒆
            </Title>
          </Group>
          <Burger
            opened={openedNav}
            onClick={() => setOpenedNav?.(!openedNav)}
            size="sm"
            color="white"
          />
        </Group>

        {openedNav && (
          <Stack
            gap="xs"
            p="md"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              position: "absolute",
              width: "100%",
              left: 0,
              top: "100%",
            }}
          >
            {role === "admin" ? (
              <>
                <Anchor
                  href="/AdminPage/InventoryPage"
                  className={classes.mobileLink}
                >
                  Inventory
                </Anchor>
                <Anchor
                  href="/AdminPage/OrderPage"
                  className={classes.mobileLink}
                >
                  Orders
                </Anchor>
                <Anchor
                  href="/AdminPage/UserManagementPage"
                  className={classes.mobileLink}
                >
                  User Management
                </Anchor>
              </>
            ) : (
              <>
                <Anchor href="/" className={classes.mobileLink}>
                  Home
                </Anchor>
                <Anchor href="/ProductPage/page" className={classes.mobileLink}>
                  Merch
                </Anchor>
                <Anchor href="/AboutPage/page" className={classes.mobileLink}>
                  More Info
                </Anchor>
              </>
            )}
            {isLoggedout ? (
              <Button
                fullWidth
                variant="default"
                component="a"
                href="/AuthPage/page"
              >
                Log in
              </Button>
            ) : (
              <Button fullWidth variant="default" onClick={logout}>
                Logout
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
