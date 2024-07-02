# TypeScript IntelliSense for Web

> TypeScript + Vue Support on Web IDE based on [Volar.js](https://volarjs.github.io/)

## Why?

- VSCode's built-in TypeScript extension does not support across files type-check and IntelliSense on Web IDE (github.dev), this extension implements that.

- Since the node_modules cannot be installed by opening the project through github.dev, type hints is almost completely lost. This extension will download the missing node_modules `.d.ts` file from CDN, and the experience is theoretically consistent with TypeScript Playground.

Try it:

- https://github.dev/johnsoncodehk/volar-starter
- https://vscode.dev/github/johnsoncodehk/volar-starter

## Syntax Highlighting and Grammar

This extension only includes IntelliSense support; you will still need to install the corresponding extensions for syntax highlighting and grammar:

- Vue: https://marketplace.visualstudio.com/items?itemName=Vue.volar

## Disable Built-in TypeScript Extension

This extension and the Built-in TypeScript Extension sometimes show duplicate results, which is not a big problem, but you still can disable the Built-in TypeScript Extension yourself if you want.

## Settings

- `typescript-web.supportVue`: Enable Vue support for .vue (Default true)
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
- `typescript-web.dts.globals`: Automatically download the module list of the type from the cdn even if it is not imported by any script. (Default `["@types/node"]`)

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
