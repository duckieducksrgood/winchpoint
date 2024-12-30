import { AppShell, Burger, Group, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "../../components/module.css/MobileNavbar.module.css";
import AuthenticationImage from "../../components/AuthPagecomponents/authpage";
import HeaderMegaMenu from "../../components/HeaderComponent/header";

export default function AuthPage() {
  const [opened, { toggle }] = useDisclosure();
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <HeaderMegaMenu openedProp={toggle} />
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <UnstyledButton className={classes.control}>Home</UnstyledButton>
        <UnstyledButton className={classes.control}>Blog</UnstyledButton>
        <UnstyledButton className={classes.control}>Contacts</UnstyledButton>
        <UnstyledButton className={classes.control}>Support</UnstyledButton>
      </AppShell.Navbar>
      <AppShell.Main bg={"#B6C4B6"} p={0}>
        <AuthenticationImage />
      </AppShell.Main>
    </AppShell>
  );
}
