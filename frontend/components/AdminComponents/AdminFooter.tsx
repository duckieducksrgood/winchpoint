import React from 'react';
import { Box, Text, Group, Anchor, Divider, ActionIcon, Stack, Container } from '@mantine/core';
import { IconBrandGithub, IconHeadset, IconBook2, IconShieldLock } from '@tabler/icons-react';
import classes from './AdminFooter.module.css';

export function AdminFooter() {
  const currentYear = new Date().getFullYear();
  const appVersion = "1.2.0"; // You can update this or fetch from an environment variable
  
  return (
    <Box className={classes.footer}>
      <Container size="xl" py="md">
        <Divider mb="md" />
        
        <Group position="apart" align="center">
          <Stack spacing={2}>
            <Text size="sm" c="dimmed">
              © {currentYear} Winch Point Offroad House. All rights reserved.
            </Text>
            <Text size="xs" c="dimmed">
              Admin Dashboard v{appVersion}
            </Text>
          </Stack>
          
          <Group spacing="md">
            <Anchor size="sm" c="dimmed" href="/AdminPage/AdminHome">
              Dashboard
            </Anchor>
            <Anchor size="sm" c="dimmed" href="/AdminPage/UserManagementPage">
              Users
            </Anchor>
            <Anchor size="sm" c="dimmed" href="/AdminPage/OrderPage">
              Orders
            </Anchor>
            <Anchor size="sm" c="dimmed" href="/AdminPage/InventoryPage">
              Inventory
            </Anchor>
          </Group>
          
          <Group spacing="sm">
            <ActionIcon variant="subtle" color="gray" aria-label="Support">
              <IconHeadset size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Documentation">
              <IconBook2 size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Security">
              <IconShieldLock size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" aria-label="Repository">
              <IconBrandGithub size={18} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export default AdminFooter;