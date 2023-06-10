# TypeScript IntelliSense for Web

> TypeScript + Vue + Astro Support on Web IDE based on [Volar.js](https://volarjs.github.io/)

## Why?

- VSCode's built-in TypeScript extension does not support across files type-check and IntelliSense on Web IDE (github.dev), this extension implements that.

- Since the node_modules cannot be installed by opening the project through github.dev, type hints is almost completely lost. This extension will download the missing node_modules `.d.ts` file from CDN, and the experience is theoretically consistent with TypeScript Playground.

### ⚠️ Note

- This extension will download all `.d.ts` files that are directly and indirectly referenced from your project. If network usage is a problem to you, please don't install this extension.

- Auto acquire `.d.ts` is only supported for `vscode.dev`, but does not support for `github.dev` since Content Security Policy.

Try it: https://vscode.dev/github/johnsoncodehk/volar-starter

## Syntax Highlighting and Grammar

This extension only includes IntelliSense support; you will still need to install the corresponding extensions for syntax highlighting and grammar:

- Vue: https://marketplace.visualstudio.com/items?itemName=Vue.volar
- Astro: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode

## Disable Built-in TypeScript Extension

This extension and the Built-in TypeScript Extension sometimes show duplicate results, which is not a big problem, but you still can disable the Built-in TypeScript Extension yourself if you want, please refer to https://vuejs.org/guide/typescript/overview.html#volar-takeover-mode.

## Settings

- `typescript-web.supportVue`: Enable Vue support for .vue (Default true)
- `typescript-web.supportAstro`: Enable Astro support for .astro (Default true)
- `typescript-web.dts.versions`: Specify the version of modules to download (Default `{}`), example:
    ```json
    // .vscode/settings.json
    {
        "typescript-web.dts.versions": {
            "vue": "3.0.11",
            "vue-router": "4.0.8"
        }
    }
    ```

---

<h3 align="center">Full-time Support by</h3>
<br />

<p align="center">
	<span>
		<a href="https://stackblitz.com/"><img src="https://raw.githubusercontent.com/johnsoncodehk/volar/HEAD/.github/sponsors/StackBlitz.png" height="80" /></a>
		<h4 align="center">Just click, and start coding.</h4>
	</span>
</p>
<br />

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.png"/>
  </a>
</p>
