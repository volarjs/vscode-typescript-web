export interface TypeScriptWebServerOptions {
    typescript: {
        tsdkUrl: string;
    };
    versions?: Record<string, string>;
    globalModules?: string[];
    supportVue?: boolean;
}
