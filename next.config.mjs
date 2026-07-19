/** @type {import('next').NextConfig} */
const nextConfig = (phase) => {
  return {
    output: "standalone",
    env: {
      NEXT_PHASE: phase,
    },
  };
};

export default nextConfig;
