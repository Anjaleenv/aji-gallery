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
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ucarecdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ucarecd.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ucarecd.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ucarecd.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.uploadcare.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/public/:path*",
        destination: "/:path*",
      },
    ];
  },
};
export default nextConfig;
