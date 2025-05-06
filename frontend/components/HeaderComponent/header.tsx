import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Container,
  Group,
  Anchor,
  Text,
  Avatar,
  Title,
  Button,
  Menu,
  Burger,
  Grid,
  Stack,
  Collapse,
  ThemeIcon,
  useMantineTheme,
  Transition,
  UnstyledButton
} from "@mantine/core";
import {
  IconChevronDown,
  IconLogin,
  IconLogout,
  IconUser,
  IconSettings,
  IconPackage,
  IconShoppingCart,
  IconMountain,
  IconCompass,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import withRoleProtection, { useUserStore, logout } from "../../utils/auth";
import classes from "./HeaderMegaMenu.module.css";
import useSWR from "swr";
import axios from "../../utils/axiosInstance";

interface HeaderMegaMenuProps {
  openedNav?: boolean;
  setOpenedNav?: (value: boolean) => void;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  delivery_address: string;
  profile_picture?: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function HeaderMegaMenu({
  openedNav,
  setOpenedNav,
}: HeaderMegaMenuProps) {
  const { role, user, isLoggedout, fetchUserData } = useUserStore();
  const [openedAbout, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();
  const router = useRouter();
  
  // States for navbar visibility
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  
  // Reference values that don't need re-renders
  const isScrolling = useRef(false);
  const isHovering = useRef(false);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const mouseLeaveTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Add this after your state and ref declarations
  const homeLink = role === "admin" ? "/AdminPage/AdminHome" : "/";

  // Fetch all users
  const { data: users = [] } = useSWR<User[]>("users/", fetcher);

  // FIXED: Check JWT token if user is not in store
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Try to get username from token
        const { data } = await axios.get("fetchdecodedtoken/");
        if (data && data.username) {
          console.log("✅ Found username from token:", data.username);
          setSelectedUsername(data.username);
        }
      } catch (error) {
        console.log("❌ No valid token found");
        
        // As a fallback, check if there's a valid cookie
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const userCookie = cookies.find(c => c.trim().startsWith('user='));
          if (userCookie) {
            try {
              const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
              if (userData?.username) {
                console.log("📝 Found username from cookie:", userData.username);
                setSelectedUsername(userData.username);
              }
            } catch (e) {
              console.error("Failed to parse user cookie", e);
            }
          }
        }
      }
    };
    
    if (!user?.username && !selectedUsername) {
      checkToken();
    } else if (user?.username && !selectedUsername) {
      setSelectedUsername(user.username);
    }
  }, [user, selectedUsername]);

  // FIXED: Find the current user using selectedUsername from token or store
  const currentUser = React.useMemo(() => {
    if (!users.length || (!selectedUsername && !user?.username)) {
      return null;
    }
    
    // Try to find by selectedUsername first (from token), then fall back to user.username (from store)
    const username = selectedUsername || user?.username;
    let found = users.find(u => u.username === username);
    
    return found || null;
  }, [users, user, selectedUsername]);

  // Add this effect after your other useEffect calls
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Direct endpoint call to get current user
        const { data } = await axios.get("current-user/");
        if (data && data.username) {
          console.log("Got current user directly:", data.username);
          setSelectedUsername(data.username);
        }
      } catch (err) {
        console.log("Error getting current user:", err);
      }
    };

    // Only run if no current user is found
    if (!currentUser && !isLoggedout) {
      getCurrentUser();
    }
  }, [currentUser, isLoggedout]);

  // Scroll handler with proper shrinking behavior
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    isScrolling.current = true;
    
    // Get current scroll position
    const currentScrollPos = window.scrollY;
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = Math.min((currentScrollPos / windowHeight) * 100, 100);
    
    // Update scroll percentage for progress bar
    setScrollPercent(scrolled);
    
    // Check if at the top of the page
    const isAtTop = currentScrollPos < 50;
    
    // Determine scroll direction with hysteresis
    const threshold = 10;
    let direction: 'up' | 'down' | null = null;
    
    if (currentScrollPos < lastScrollPos - threshold) {
      direction = 'up';
      scrollDirection.current = 'up';
    } else if (currentScrollPos > lastScrollPos + threshold) {
      direction = 'down';
      scrollDirection.current = 'down';
    } else {
      direction = scrollDirection.current;
    }
    
    // Update last scroll position
    setLastScrollPos(currentScrollPos);
    
    // Determine visibility
    const shouldBeVisible = 
      isAtTop ||             
      direction === 'up' ||  
      openedAbout ||         
      isHovering.current;    
    
    // Only update state if needed and not at the top of page
    if (shouldBeVisible !== isVisible && !isAtTop) {
      setIsVisible(shouldBeVisible);
      
      // Also update expanded state
      if (shouldBeVisible && !isExpanded) {
        setIsExpanded(true);
      }
    }
    
    // When scrolling stops
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      
      // If scrolled down, not hovering, and scrolling down - hide navbar
      if (currentScrollPos > 50 && !isHovering.current && direction === 'down' && !openedAbout) {
        setIsVisible(false);
        setIsExpanded(false);
      }
    }, 200);
  }, [lastScrollPos, isVisible, isExpanded, openedAbout]);
  
  // Use requestAnimationFrame for smooth animation
  const optimizedScrollHandler = useCallback(() => {
    requestAnimationFrame(handleScroll);
  }, [handleScroll]);
  
  // Set up scroll listener
  useEffect(() => {
    window.addEventListener("scroll", optimizedScrollHandler, { passive: true });
    return () => {
      window.removeEventListener("scroll", optimizedScrollHandler);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (mouseLeaveTimer.current) clearTimeout(mouseLeaveTimer.current);
    };
  }, [optimizedScrollHandler]);
  
  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    // Skip at top of page or when dropdown is open
    if (window.scrollY < 50 || openedAbout) return;
    
    // Clear any pending leave timer
    if (mouseLeaveTimer.current) {
      clearTimeout(mouseLeaveTimer.current);
      mouseLeaveTimer.current = null;
    }
    
    // Set hover flag
    isHovering.current = true;
    
    // Expand navbar if needed
    if (!isVisible || !isExpanded) {
      setIsVisible(true);
      setIsExpanded(true);
    }
  }, [isVisible, isExpanded, openedAbout]);
  
  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    // Skip at top of page or when dropdown is open
    if (window.scrollY < 50 || openedAbout) return;
    
    // Clear existing timer
    if (mouseLeaveTimer.current) {
      clearTimeout(mouseLeaveTimer.current);
    }
    
    // Use timer for smooth transition
    mouseLeaveTimer.current = setTimeout(() => {
      // Set hover flag to false
      isHovering.current = false;
      
      // Only shrink if scrolled down and going down
      if (window.scrollY > 50 && scrollDirection.current === 'down') {
        setIsExpanded(false);
        setIsVisible(false);
      }
      
      mouseLeaveTimer.current = null;
    }, 300);
  }, [openedAbout]);
  
  // Function to check if current page matches path
  const isActivePath = (path: string) => {
    if (path === "/" && router.pathname === "/") return true;
    if (path !== "/" && router.pathname.startsWith(path)) return true;
    return false;
  };

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  // Determine if navbar should be shown
  const showNavbar = isVisible || isExpanded || openedAbout;
  
  // Add this function before the return statement
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(homeLink);
  };

  return (
    <>
      <Box
        className={`${classes.navbarWrapper} ${showNavbar ? classes.navVisible : classes.navCompact}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          '--scroll-progress': `${scrollPercent}%`,
        } as React.CSSProperties}
      >
        <Transition mounted={openedAbout} transition="slide-down" duration={300}>
          {(styles) => (
            <Collapse in={openedAbout} style={{ ...styles, zIndex: 1000 }}>
              <Box className={classes.dropdownBackground}>
                <Container size="lg" py="xl">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }} px="md">
                      <Group mb="lg" align="center">
                        <ThemeIcon 
                          color="teal" 
                          variant="light" 
                          size="xl" 
                          radius="md"
                          className={classes.pulseIcon}
                        >
                          <IconCompass size={24} />
                        </ThemeIcon>
                        <Title order={3} c="gray.0" fw={600} ff="'Montserrat', sans-serif">
                          ABOUT US
                        </Title>
                      </Group>
                      
                      <Box mb="xl" className={classes.fadeInFirst}>
                        <Group mb="sm" spacing="xs">
                          <ThemeIcon color="teal" variant="light" size="md" radius="xl">
                            <IconPackage size={16} />
                          </ThemeIcon>
                          <Text fw={600} c="gray.0" size="md" ff="'Montserrat', sans-serif">DIY MAINTENANCE</Text>
                        </Group>
                        <Text c="gray.3" size="sm" lh={1.8} ml={30} ff="'Open Sans', sans-serif">
                          Dive into the world of hands-on automotive care with our detailed Do-It-Yourself maintenance
                          tutorials. From essential upkeep tasks to pro-level fixes, we empower you to take control of your ride.
                        </Text>
                      </Box>
                      
                      <Box mb="xl" className={classes.fadeInSecond}>
                        <Group mb="sm" spacing="xs">
                          <ThemeIcon color="blue" variant="light" size="md" radius="xl">
                            <IconShoppingCart size={16} />
                          </ThemeIcon>
                          <Text fw={600} c="gray.0" size="md" ff="'Montserrat', sans-serif">OFF-ROAD EQUIPMENT</Text>
                        </Group>
                        <Text c="gray.3" size="sm" lh={1.8} ml={30} ff="'Open Sans', sans-serif">
                          Explore our comprehensive collection of off-road equipment and accessories for your adventure vehicle.
                          From winches to roof racks, we offer quality products to enhance your off-roading experience.
                        </Text>
                      </Box>
                      
                      <Box mb="xl" className={classes.fadeInThird}>
                        <Group mb="sm" spacing="xs">
                          <ThemeIcon color="green" variant="light" size="md" radius="xl">
                            <IconMountain size={16} />
                          </ThemeIcon>
                          <Text fw={600} c="gray.0" size="md" ff="'Montserrat', sans-serif">OFF-ROADING ADVENTURES</Text>
                        </Group>
                        <Text c="gray.3" size="sm" lh={1.8} ml={30} ff="'Open Sans', sans-serif">
                          Join us on adrenaline-pumping off-road escapades, where we push vehicles to their limits in
                          challenging terrains. Experience the thrill of conquering nature's obstacles.
                        </Text>
                      </Box>
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 4 }} px="md">
                      <Group mb="lg" align="center">
                        <ThemeIcon color="blue" variant="light" size="xl" radius="md" className={classes.pulseIcon}>
                          <IconCompass size={24} />
                        </ThemeIcon>
                        <Title order={3} c="gray.0" fw={600} ff="'Montserrat', sans-serif">
                          CONNECT WITH US
                        </Title>
                      </Group>
                      
                      <Stack spacing="lg">                        
                        <Anchor
                          href="https://www.facebook.com/profile.php?id=100063916543113"
                          target="_blank"
                          underline="never"
                          className={`${classes.socialLink} ${classes.fadeInSecond}`}
                        >
                          <Group spacing="sm">
                            <ThemeIcon color="blue" variant="light" size="lg" radius="xl" className={classes.socialIcon}>
                              <IconUser size={20} />
                            </ThemeIcon>
                            <Text c="gray.0" size="md" ff="'Open Sans', sans-serif">Connect on Facebook</Text>
                          </Group>
                        </Anchor>

                        <Anchor
                          href="https://www.youtube.com/@winlustarez9958"
                          target="_blank"
                          underline="never"
                          className={`${classes.socialLink} ${classes.fadeInThird}`}
                        >
                          <Group spacing="sm">
                            <ThemeIcon color="red" variant="light" size="lg" radius="xl" className={classes.socialIcon}>
                              <IconSettings size={20} />
                            </ThemeIcon>
                            <Text c="gray.0" size="md" ff="'Open Sans', sans-serif">Watch on YouTube</Text>
                          </Group>
                        </Anchor>

                        <Anchor
                          href="/Privacy"
                          underline="never"
                          className={`${classes.socialLink} ${classes.fadeInFourth}`}
                        >
                          <Group spacing="sm">
                            <ThemeIcon color="gray" variant="light" size="lg" radius="xl" className={classes.socialIcon}>
                              <IconCompass size={20} />
                            </ThemeIcon>
                            <Text c="gray.0" size="md" ff="'Open Sans', sans-serif">Privacy Policy</Text>
                          </Group>
                        </Anchor>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Container>
              </Box>
            </Collapse>
          )}
        </Transition>
        
        <header className={`${classes.header} ${showNavbar ? '' : classes.headerCompact}`}>
          <Container size="xl">
            <div className={classes.headerInner}>
              {/* Left section - Logo and title */}
              <Anchor 
                href={homeLink} 
                className={classes.logoLink} 
                onClick={handleLogoClick}
              >
                <Group className={classes.leftSection}>
                  <Avatar
                    src="/winch.png"
                    alt="Winch Point Logo"
                    w={showNavbar ? 65 : 45}
                    h={showNavbar ? 65 : 45}
                    radius="md"
                    className={classes.logo}
                  />
                  <Box visibleFrom="xs" className={classes.titleContainer}>
                    <Title c="white" order={showNavbar ? 3 : 4} ff="'Montserrat', sans-serif" fw={600} className={classes.title}>
                      {showNavbar ? "Winch Point Offroad House" : "WP Offroad"}
                    </Title>
                  </Box>
                </Group>
              </Anchor>

              {/* Mobile burger menu */}
              <Box hiddenFrom="md" pl="md">
                <Burger
                  opened={openedNav || false}
                  onClick={() => setOpenedNav?.(!openedNav)}
                  size="md"
                  color="white"
                  className={classes.burger}
                />
              </Box>

              {/* Right section - Navigation and actions */}
              <Group className={classes.rightSection} visibleFrom="md">
                {/* Navigation links */}
                {role === "admin" ? (
                  <Group className={classes.navLinks}>
                    <Anchor
                      href="/AdminPage/InventoryPage"
                      className={`${classes.navLink} ${isActivePath("/AdminPage/InventoryPage") ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconPackage size={18} stroke={1.5} />
                        <span>Inventory</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                    <Anchor 
                      href="/AdminPage/OrderPage" 
                      className={`${classes.navLink} ${isActivePath("/AdminPage/OrderPage") ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconPackage size={18} stroke={1.5} />
                        <span>Orders</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                    <Anchor
                      href="/AdminPage/UserManagementPage"
                      className={`${classes.navLink} ${isActivePath("/AdminPage/UserManagementPage") ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconUser size={18} stroke={1.5} />
                        <span>Users</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                  </Group>
                ) : (
                  <Group className={classes.navLinks}>
                    <Anchor 
                      href="/" 
                      className={`${classes.navLink} ${isActivePath("/") && router.pathname === "/" ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconCompass size={18} stroke={1.5} />
                        <span>Home</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                    <Anchor 
                      href="/ProductPage/page" 
                      className={`${classes.navLink} ${isActivePath("/ProductPage") ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconShoppingCart size={18} stroke={1.5} />
                        <span>Shop</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                    <Anchor 
                      href="/AboutPage/page" 
                      className={`${classes.navLink} ${isActivePath("/AboutPage") ? classes.activeNavLink : ""}`}
                    >
                      <Group spacing={7} className={classes.navLinkInner}>
                        <IconMountain size={18} stroke={1.5} />
                        <span>About</span>
                      </Group>
                      <div className={classes.navLinkIndicator} />
                    </Anchor>
                  </Group>
                )}

                {/* Action buttons */}
                <Group className={classes.actionButtons}>
                  <Group align="center" spacing={5} className={classes.aboutToggle} onClick={toggle}>
                    <Text c="white" size="sm" fw={500} ff="'Montserrat', sans-serif">Discover</Text>
                    <IconChevronDown 
                      size={16} 
                      color="white" 
                      className={openedAbout ? classes.chevronUp : classes.chevronDown}
                    />
                  </Group>

                  {isLoggedout ? (
                    <Button
                      onClick={() => router.push("/AuthPage/page")}
                      variant="gradient"
                      gradient={{ from: 'teal', to: '#2c8898', deg: 45 }}
                      radius="xl"
                      size="sm"
                      className={classes.loginButton}
                      style={{
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                        boxShadow: 'none',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                      leftSection={
                        <IconLogin 
                          size={16} 
                          className={classes.loginIcon} 
                          style={{ transition: 'transform 0.3s ease' }}
                        />
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.querySelector('svg')?.style.setProperty('transform', 'translateX(-3px)');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.querySelector('svg')?.style.removeProperty('transform');
                      }}
                    >
                      Login
                    </Button>
                  ) : (
                    <Menu 
                      shadow="md" 
                      width={200} 
                      position="bottom-end" // Position it to properly align at the bottom-right
                      zIndex={1000} // Ensure it appears above other elements
                    >
                      <Menu.Target>
                        <UnstyledButton style={{ marginLeft: '10px' }}> 
                          <Avatar 
                            src={currentUser?.profile_picture}
                            radius="xl"
                            size="md"
                            color="blue"
                            bg="#f0f0f0"
                            style={{ 
                              border: '2px solid rgba(255,255,255,0.8)',
                              boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                            }}
                          >
                            {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                          </Avatar>
                        </UnstyledButton>
                      </Menu.Target>

                      {console.log("User data:", {
                        storedUser: user,
                        selectedUsername,
                        users: users.map(u => u.username),
                        currentUser
                      })}

                      <Menu.Dropdown>
                        <Menu.Label>{currentUser?.first_name || 'User'} {currentUser?.last_name || ''}</Menu.Label>
                        <Menu.Label c="dimmed">
                          @{currentUser?.username || selectedUsername || user?.username || 'guest'}
                        </Menu.Label>
                        <Menu.Divider />
                        <Menu.Item 
                          onClick={() => router.push("/MyAccountPage/MyAccount")} 
                          leftSection={<IconUser size={14} />}
                        >
                          My Account
                        </Menu.Item>
                        <Menu.Item 
                          onClick={() => logout()} 
                          leftSection={<IconLogout size={14} />} 
                          color="red"
                        >
                          Logout
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>
              </Group>
            </div>
          </Container>
          
          {/* Progress bar for scroll position */}
          <div className={classes.progressBar}></div>
        </header>
      </Box>
      
      {/* This creates space below the fixed header */}
      <Box style={{ height: showNavbar ? 110 : 80 }} />
    </>
  );
}