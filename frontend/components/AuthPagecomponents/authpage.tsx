import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  PinInput,
  Group,
  Box,
  Container,
  Divider,
  rem,
  useMantineTheme,
  Image,
  Stack,
  Transition,
} from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  login,
  register,
  sendResetCode,
  verifyResetCode,
  resetPassword,
} from "../../utils/auth";
import classes from "./AuthenticationImage.module.css";
import { notifications } from "@mantine/notifications";
import { IconMail, IconLock, IconUser, IconArrowBack } from "@tabler/icons-react";

export default function AuthenticationImage() {
  const theme = useMantineTheme();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    username: "",
  });
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsRegistering((prev) => !prev);
    resetForm();
  };

  const handleResetClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsResetting(true);
    resetForm();
  };

  const handleBackClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsResetting(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      username: "",
    });
    setError("");
    setPinValue("");
    setNewPassword("");
    setIsCodeSent(false);
    setIsCodeVerified(false);
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      if (isRegistering) {
        const response = await register(formData);
        resetForm();
        setIsRegistering(false);
        notifications.show({
          title: "Success",
          message: "Registration successful! Please login.",
          color: "green",
        });
      } else if (isResetting) {
        if (!isCodeSent) {
          // Step 1: Send reset code
          await sendResetCode(formData.email);
          setIsCodeSent(true);
          notifications.show({
            title: "Code Sent",
            message: "Reset code sent to your email.",
            color: "blue",
          });
        } else if (!isCodeVerified && pinValue.length === 4) {
          // Step 2: Verify reset code
          try {
            await verifyResetCode(formData.email, pinValue);
            setIsCodeVerified(true);
            notifications.show({
              title: "Code Verified",
              message: "Please enter your new password.",
              color: "green",
            });
          } catch (err) {
            notifications.show({
              title: "Invalid Code",
              message: "Please try again.",
              color: "red",
            });
            setPinValue("");
          }
        } else if (isCodeVerified && newPassword) {
          // Step 3: Reset password
          await resetPassword(formData.email, newPassword);
          notifications.show({
            title: "Success",
            message: "Password reset successful. Please login.",
            color: "green",
          });
          setIsResetting(false);
          resetForm();
        }
      } else {
        const response = await login(formData.username, formData.password);
        resetForm();
        
        // Check if redirect URL is provided and use it
        if (response.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      // Error is handled by notifications in the auth functions
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" px="xs" pt={50} pb={50}>
      <Paper
        shadow="md"
        radius="md"
        p="xl"
        withBorder
        style={{
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isResetting && (
          <Anchor
            size="sm"
            style={{ position: 'absolute', top: 15, left: 15, display: 'flex', alignItems: 'center' }}
            onClick={handleBackClick}
          >
            <IconArrowBack size={16} style={{ marginRight: 5 }} />
            Back to login
          </Anchor>
        )}
        
        <Title order={2} ta="center" mt={isResetting ? 30 : 10} mb={20} fw={900}>
          {isRegistering
            ? "Create Account"
            : isResetting
            ? "Reset Password"
            : "Welcome Back"}
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb={30}>
          {isRegistering
            ? "Enter your details to create an account"
            : isResetting
            ? "We'll help you reset your password"
            : "Sign in to access your account"}
        </Text>

        <form onSubmit={handleSubmit}>
          <Transition mounted={isRegistering} transition="fade" duration={400} timingFunction="ease">
            {(styles) => (
              <div style={styles}>
                {isRegistering && (
                  <Stack gap="md">
                    <Group grow>
                      <TextInput
                        label="First Name"
                        placeholder="John"
                        size="md"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        radius="md"
                      />
                      <TextInput
                        label="Last Name"
                        placeholder="Doe"
                        size="md"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        radius="md"
                      />
                    </Group>
                    <TextInput
                      label="Email address"
                      placeholder="hello@example.com"
                      size="md"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      icon={<IconMail size={18} />}
                      required
                      radius="md"
                    />
                  </Stack>
                )}
              </div>
            )}
          </Transition>

          <Transition 
            mounted={!isResetting || isResetting}
            transition="fade"
            duration={400}
            timingFunction="ease"
          >
            {(styles) => (
              <div style={styles}>
                {!isResetting && (
                  <Stack gap="md">
                    <TextInput
                      label="Username"
                      placeholder="johndoe"
                      size="md"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      icon={<IconUser size={18} />}
                      required
                      radius="md"
                    />
                    <PasswordInput
                      label="Password"
                      placeholder="Your password"
                      size="md"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      icon={<IconLock size={18} />}
                      required
                      radius="md"
                    />
                  </Stack>
                )}

                {isResetting && (
                  <Stack gap="md">
                    <TextInput
                      label="Email address"
                      placeholder="hello@example.com"
                      size="md"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      icon={<IconMail size={18} />}
                      required
                      radius="md"
                      disabled={isCodeSent}
                    />
                    {isCodeSent && !isCodeVerified && (
                      <Box my="md">
                        <Text fw={500} size="sm" mb="xs">
                          Enter the 4-digit code sent to your email
                        </Text>
                        <Group justify="center" mt="md">
                          <PinInput
                            length={4}
                            type="number"
                            placeholder="0"
                            value={pinValue}
                            onChange={setPinValue}
                            size="md"
                          />
                        </Group>
                      </Box>
                    )}
                    {isCodeVerified && (
                      <PasswordInput
                        label="New Password"
                        placeholder="Enter your new password"
                        size="md"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        icon={<IconLock size={18} />}
                        required
                        radius="md"
                      />
                    )}
                  </Stack>
                )}
              </div>
            )}
          </Transition>

          <Button 
            fullWidth 
            mt="xl" 
            size="md" 
            type="submit" 
            loading={loading}
            radius="md"
            variant="gradient"
            gradient={{ from: '#4B6455', to: '#7D9D9C', deg: 45 }}
          >
            {isRegistering
              ? "Create Account"
              : isResetting
              ? !isCodeSent
                ? "Send Reset Code"
                : !isCodeVerified
                ? "Verify Code"
                : "Reset Password"
              : "Sign In"}
          </Button>
        </form>

        {!isResetting && (
          <>
            <Divider label="Or" labelPosition="center" my="lg" />
            <Text c="dimmed" size="sm" ta="center" mb="sm">
              {isRegistering ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <Button
              variant="subtle" 
              fullWidth
              onClick={handleRegisterClick}
              radius="md"
              color="gray"
            >
              {isRegistering ? "Sign In" : "Create Account"}
            </Button>
          </>
        )}

        {!isRegistering && !isResetting && (
          <Text c="dimmed" size="sm" ta="center" mt="md">
            <Anchor size="sm" component="button" onClick={handleResetClick}>
              Forgot your password?
            </Anchor>
          </Text>
        )}
      </Paper>
    </Container>
  );
}