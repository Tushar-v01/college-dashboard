/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
};

// module.exports = {
//   images: {
//     domains: ['res.cloudinary.com'],
//   },
// }

export default nextConfig;
