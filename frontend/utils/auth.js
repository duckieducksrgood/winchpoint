import axios from "./axiosInstance";
import { create } from "zustand";
import psgcAxios from "./psgcAxios";
import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { LoadingOverlay, Overlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const fetcher = (url) => axios.get(url).then((res) => res.data);

export const decodeToken = () => {
  const { data: token, error } = useSWR("fetchdecodedtoken/", fetcher);

  if (error) {
    // console.error("Token decoding error:", error);
    notifications.show({
      title: "Error",
      message: "An error occurred " + error.message,
      color: "red",
    });
    return {
      role: null,
      username: null,
      isLoading: false,
      isError: true,
    };
  }

  if (!token) {
    return {
      role: null,
      username: null,
      isLoading: true,
      isError: false,
    };
  }

  return {
    role: token.role,
    username: token.username,
    isLoading: false,
    isError: false,
  };
};

const withRoleProtection = (Component, allowedRoles = []) => {
  return (props) => {
    const router = useRouter();
    const { role, isLoading, isError } = decodeToken();

    useEffect(() => {
      if (!isLoading && !isError) {
        // Ensure allowedRoles is an array
        if (!Array.isArray(allowedRoles)) {
          console.error("allowedRoles should be an array");
          return;
        }

        // If the role is not in the allowedRoles array, redirect or show a modal
        if (!allowedRoles.includes(role)) {
          // You can redirect to a 403 page, home page, or show a modal
          notifications.show({
            title: "Error",
            message: "You are not authorized",
            color: "red",
          });
          router.push("/AuthPage/page"); // Redirect to login page
        }
      }
    }, [role, isLoading, isError]);

    useEffect(() => {
      if (isError) {
        router.push("/AuthPage/page"); // Redirect to login page on error
      }
    }, [isError]);

    if (isLoading) {
      return (
        <>
          <Overlay color="#000" backgroundOpacity={0.85} />
          <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        </>
      ); // Show a loading overlay while waiting
    }

    if (isError) {
      return <div>Error occurred</div>; // Handle error state
    }

    // If the role is allowed, render the protected component
    return <Component {...props} />;
  };
};

export default withRoleProtection;

export const login = async (username, password) => {
  try {
    const response = await axios.post("login/", {
      username: username,
      password: password,
    });
    const { data: token } = await axios.get("fetchdecodedtoken/");
    const role = token.role;
    return { ...response.data, role };
  } catch (error) {
    const errorMessage = error?.response?.data?.message;
    notifications.show({
      message: errorMessage,
      color: "red",
    });
    throw error;
  }
};

export const register = async (formData) => {
  try {
    const response = await axios.post("register/", formData);
    if (response.status === 201) {
      return response.data;
    } else if (response.status === 400) {
      notifications.show({ title: "Error", message: "Error", color: "red" });
      return response.data;
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw error; // Ensure the error is thrown so it can be caught in the frontend
  }
};

export const logout = async () => {
  try {
    const response = await axios.post("logout/");
    window.location.href = "/AuthPage/page";
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

export const sendResetCode = async (email) => {
  const response = await axios.post("send_reset_code/", { email });
  return response.data;
};

export const verifyResetCode = async (email, resetCode) => {
  const response = await axios.post("verify_reset_code/", {
    email,
    reset_code: resetCode,
  });
  return response.data;
};

export const resetPassword = async (email, newPassword) => {
  const response = await axios.post("reset_password/", {
    email,
    new_password: newPassword,
  });
  return response.data;
};

export const useUserStore = create((set) => ({
  user: null,
  address: null,
  role: null,
  profilePicture: null,
  isLoggedout: true,
  isError: false,
  fetchUserData: async () => {
    try {
      const { data: token } = await axios.get("fetchdecodedtoken/");
      set({
        user: { username: token.username },
        address: token.address,
        role: token.role,
        isLoggedout: false,
        isError: false,
      });
    } catch (error) {
      // console.error("User data fetching error:", error);
      if (error.response && error.response.status === 401) {
        console.error("Unauthorized access - 401");
        set({
          user: null,
          role: null,
          isLoggedout: true,
          error: "Unauthorized access - please check your credentials.",
        });
      } else {
        console.error("An unexpected error occurred:", error);
        set({ isLoggedout: false });
      }
    }
  },
  clearUserData: () => set({ user: null, role: null, profilePicture: null }),
  setUser: (userData) => set({ user: userData, isLoggedout: false }),
}));

export const fetchRegions = async () => {
  try {
    const response = await psgcAxios.get("/regions.json");
    return response.data;
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
};

export const fetchProvinces = async (regionCode) => {
  try {
    const response = await psgcAxios.get(`/provinces.json`);
    return response.data.filter(
      (province) => province.regionCode === regionCode
    );
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};

export const fetchCitiesMunicipalities = async (provinceCode) => {
  try {
    const response = await psgcAxios.get(`/cities-municipalities.json`);
    return response.data.filter((city) => city.provinceCode === provinceCode);
  } catch (error) {
    console.error("Error fetching cities/municipalities:", error);
    return [];
  }
};
export const fetchBarangays = async (cityMunicipalityCode) => {
  try {
    const response = await psgcAxios.get(
      `/cities-municipalities/${cityMunicipalityCode}/barangays/`
    );
    console.log(
      "City/Municipality Code:",
      response.data.filter(
        (barangay) =>
          barangay.cityCode === cityMunicipalityCode ||
          barangay.municipalityCode === cityMunicipalityCode
      )
    );
    console.log("Current user from store:", user);
    console.log("Fetched users:", users);
    return response.data.filter(
      (barangay) =>
        barangay.cityCode === cityMunicipalityCode ||
        barangay.municipalityCode === cityMunicipalityCode
    );
  } catch (error) {
    console.error("Error fetching barangays:", error);
    return [];
  }
};
