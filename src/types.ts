import { InitializationOptions } from '@volar/language-server/browser';

export interface TypeScriptWebServerOptions extends InitializationOptions {
    versions?: Record<string, string>;
    supportVue?: boolean;
    supportAstro?: boolean;
}
