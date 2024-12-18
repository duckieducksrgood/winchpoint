import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/router";
import { login, register } from "../../utils/auth";
import classes from "./AuthenticationImage.module.css";

export default function AuthenticationImage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login and register
  const [error, setError] = useState(""); // State to store error message
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    username: "",
  });

  const handleRegisterClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsRegistering((prev) => !prev); // Toggle between register and login
    resetForm(); // Reset the form and error on toggle
  };

  // Function to reset form data and error state
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      username: "",
    });
    setError(""); // Clear any existing errors
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    try {
      if (isRegistering) {
        // Handle registration
        try {
          const response = await register(formData);
          resetForm(); // Clear the form after successful registration
          setIsRegistering(false); // Switch to login after registration
        } catch (err) {
          console.error("Error during submission:", err);
          setError("An error occurred. Please try again."); // Set error message
        }
      } else {
        // Handle login
        const credentials = {
          username: formData.username,
          password: formData.password,
        };
        console.log("credentials:", credentials);
        const response = await login(
          credentials.username,
          credentials.password
        );
        console.log("Login successful:", response);
        resetForm(); // Clear the form after successful login

        if (response.role === "admin") {
          router.push("/admin/adminDashboard");
        } else {
          router.push("/profile/page");
        }
      }
    } catch (err) {
      console.error("Error during submission:", err);
      setError("An error occurred. Please try again."); // Set error message
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30} mt={50}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          {isRegistering ? "Create an Account" : "Welcome back to Mantine!"}
        </Title>
        {error && (
          <Text color="red" ta="center">
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
          <Button fullWidth mt="xl" size="md" type="submit">
            {isRegistering ? "Register" : "Login"}
          </Button>
        </form>
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
      </Paper>
    </div>
  );
}
