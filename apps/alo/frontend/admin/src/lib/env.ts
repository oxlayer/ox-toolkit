// Helper to safely access environment variables
// Throws an error if the environment variable is missing
function getEnv(key: string): string {
    const value = import.meta.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
}

// Environment variables configuration
// All variables are required - will throw if any is missing
export const env = {
    VITE_PUBLIC_KEYCLOAK_URL: getEnv('VITE_PUBLIC_KEYCLOAK_URL'),
    VITE_PUBLIC_KEYCLOAK_REALM: getEnv('VITE_PUBLIC_KEYCLOAK_REALM'),
    VITE_PUBLIC_KEYCLOAK_CLIENT_ID: getEnv('VITE_PUBLIC_KEYCLOAK_CLIENT_ID'),
    VITE_PUBLIC_API_BASE_URL: getEnv('VITE_PUBLIC_API_BASE_URL'),
};

