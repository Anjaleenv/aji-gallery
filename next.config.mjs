/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.uploadcare.com",
        pathname: "/**",
      },
    ],
  },
};
export default nextConfig;
