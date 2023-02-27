import { LanguageServerInitializationOptions } from '@volar/language-server/browser';

export interface TypeScriptWebServerOptions extends LanguageServerInitializationOptions {
    supportVue?: boolean;
    supportSvelte?: boolean;
    supportAngular?: boolean;
}
