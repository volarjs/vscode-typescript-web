import { InitializationOptions } from '@volar/language-server/browser';

export interface TypeScriptWebServerOptions extends InitializationOptions {
    typescript: {
        tsdkUrl: string;
    };
    versions?: Record<string, string>;
    globalModules?: string[];
    supportVue?: boolean;
    supportAstro?: boolean;
}
