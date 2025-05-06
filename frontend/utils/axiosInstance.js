import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + "api/", // Make sure this is correct!
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
    // Add any authentication headers if needed
  },
  withCredentials: true,
});

// Function to refresh the access token
const refreshAccessToken = async () => {
  try {
    const response = await axiosInstance.post("token/refresh/");

    // Update cookies with new access token
    // Cookies.set("jwt_access_token", response.data.access, { path: "/" });

    return response.data.access;
  } catch (refreshError) {
    // console.error("Refresh token error:", refreshError);
  }
};

// Response interceptor: Handle 401 errors (Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error status is 401 (Unauthorized)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const newToken = await refreshAccessToken();

        // Update the original request with the new token
        originalRequest.headers["Authorization"] = "Bearer " + newToken;

        // Retry the original request with the new token
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token error:", refreshError);
        handleLogout();
        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
