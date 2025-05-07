/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',  // Enable static HTML export
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,  // Add trailing slashes for better static serving
  reactStrictMode: true,
};

export default nextConfig;
