import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  PinInput,
  Group,
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

export default function AuthenticationImage() {
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
    try {
      if (isRegistering) {
        const response = await register(formData);
        resetForm();
        setIsRegistering(false);
        setError("Registration successful! Please login.");
      } else if (isResetting) {
        if (!isCodeSent) {
          // Step 1: Send reset code
          await sendResetCode(formData.email);
          setIsCodeSent(true);
          setError("Reset code sent to your email.");
        } else if (!isCodeVerified && pinValue.length === 4) {
          // Step 2: Verify reset code
          try {
            await verifyResetCode(formData.email, pinValue);
            setIsCodeVerified(true);
            setError("Code verified. Please enter your new password.");
          } catch (err) {
            setError("Invalid code. Please try again.");
            setPinValue("");
          }
        } else if (isCodeVerified && newPassword) {
          // Step 3: Reset password
          await resetPassword(formData.email, newPassword);
          setError("Password reset successful. Please login.");
          setIsResetting(false);
          resetForm();
        }
      } else {
        const response = await login(formData.username, formData.password);
        resetForm();
        window.location.href = "/";
      }
    } catch (err: any) {}
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30} mt={50} bg={"#B6C4B6"}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          {isRegistering
            ? "Create an Account"
            : isResetting
            ? "Reset Password"
            : "Welcome back!"}
        </Title>
        {error && (
          <Text color="red" ta="center" mb="md">
            {error}
          </Text>
        )}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <TextInput
                label="First Name"
                placeholder="John"
                size="md"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
              <TextInput
                label="Last Name"
                placeholder="Doe"
                size="md"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
              <TextInput
                label="Email address"
                placeholder="hello@gmail.com"
                size="md"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          {!isResetting && (
            <>
              <TextInput
                label="Username"
                placeholder="johndoe"
                size="md"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                mt="md"
                size="md"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          {isResetting && (
            <>
              <TextInput
                label="Email address"
                placeholder="hello@gmail.com"
                size="md"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isCodeSent}
              />
              {isCodeSent && !isCodeVerified && (
                <>
                  <Text size="sm" ta="center" mt="md" mb="sm">
                    Enter the 4-digit code sent to your email
                  </Text>
                  <Group justify="center">
                    <PinInput
                      length={4}
                      type="number"
                      placeholder="0"
                      value={pinValue}
                      onChange={setPinValue}
                    />
                  </Group>
                </>
              )}
              {isCodeVerified && (
                <PasswordInput
                  label="New Password"
                  placeholder="Enter your new password"
                  mt="md"
                  size="md"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              )}
            </>
          )}

          <Button fullWidth mt="xl" size="md" type="submit">
            {isRegistering
              ? "Register"
              : isResetting
              ? !isCodeSent
                ? "Send Reset Code"
                : !isCodeVerified
                ? "Verify Code"
                : "Reset Password"
              : "Login"}
          </Button>
        </form>

        {!isResetting && (
          <Text ta="center" mt="md">
            {isRegistering ? (
              <>
                Already have an account?{" "}
                <Anchor<"a"> href="#" fw={700} onClick={handleRegisterClick}>
                  Login
                </Anchor>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Anchor<"a"> href="#" fw={700} onClick={handleRegisterClick}>
                  Register
                </Anchor>
              </>
            )}
          </Text>
        )}

        {!isRegistering && !isResetting && (
          <Text ta="center" mt="md">
            Forgot your password?{" "}
            <Anchor<"a"> href="#" fw={700} onClick={handleResetClick}>
              Reset Password
            </Anchor>
          </Text>
        )}
      </Paper>
    </div>
  );
}
