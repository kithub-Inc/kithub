/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
dotenv.config({ path: `config/.env.development` });

const nextConfig = {
    reactStrictMode: true,
    webpack: (config, options) => {
        config.cache = false;
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com"
            },
            {
                protocol: "https",
                hostname: "www.npmjs.com"
            },
            {
                protocol: "http",
                hostname: "localhost"
            }
        ]
    },
    env: {
        BACKEND_URL: process.env.BACKEND_URL
    },
    experimental: {
        nextScriptWorkers: true
    }
};

export default nextConfig;