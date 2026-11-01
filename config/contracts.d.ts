import type { AdapterOptions } from "@sveltejs/adapter-static";
import type { Config } from "@sveltejs/kit/vite";
import type { CompilerOptions, WatchOptions } from "typescript";
import type { EnvironmentOptions, UserConfig } from "vite";

export type StaticAdapter = AdapterOptions;
export type SvelteKit = Config;
export type Vite = UserConfig;
export type TypeScript = CompilerOptions;
export type TypeScriptWatch = WatchOptions;
export type ViteClient = EnvironmentOptions;
export type ViteServer = EnvironmentOptions;
