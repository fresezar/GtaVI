/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `STATIC_EXPORT=1 npm run build` -> ./out (deployable to Cloudflare Pages as plain files)
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export", trailingSlash: true } : {}),
};
export default nextConfig;
