declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.jpg" {
    const value: string;
    export default value;
}

declare module "*.jpeg" {
    const value: string;
    export default value;
}

declare module "*.gif" {
    const value: string;
    export default value;
}

declare module "*.svg" {
    const value: string;
    export default value;
}

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_URL: string;
    readonly VITE_REVERB_APP_KEY: string;
    readonly VITE_REVERB_HOST: string;
    readonly VITE_REVERB_PORT: string;
    readonly VITE_REVERB_SCHEME: string;
    readonly VITE_APP_ENV: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
