# TypeScript IntelliSense for Web

> TypeScript language server implement for Web IDE based on [Volar.js](https://volarjs.github.io/)

<h3 align="center">Full-time Support by</h3>
<br />

<p align="center">
	<span>
		<a href="https://stackblitz.com/"><img src="https://raw.githubusercontent.com/johnsoncodehk/volar/HEAD/.github/sponsors/StackBlitz.png" height="80" /></a>
		<h4 align="center">Just click, and start coding.</h4>
	</span>
</p>
<br />

<h3 align="center">Our Sponsors ⭐✨</h3>
<br />

<p align="center">
	<a href="https://volta.net/"><img src="https://raw.githubusercontent.com/johnsoncodehk/volar/HEAD/.github/sponsors/volta.svg" height="60" /></a>
    <a href="https://vuejs.org/"><img src="https://raw.githubusercontent.com/johnsoncodehk/volar/HEAD/.github/sponsors/vue.png" height="80" /></a>
</p>
<br />

<p align="center">
    <a href="https://www.prefect.io/"><img src="https://raw.githubusercontent.com/johnsoncodehk/volar/HEAD/.github/sponsors/prefect.svg" height="40" /></a>
</p>
<br />

<p align="center">
	<h5 align="center"><a href="https://github.com/sponsors/johnsoncodehk">Adding You</a></h5>
</p>

## Why?

- VSCode's built-in TypeScript extension does not support across files type-check and IntelliSense on Web IDE (github.dev), this extension implements that.

- Since the node_modules cannot be installed by opening the project through github.dev, type hints is almost completely lost. This extension will download the missing node_modules .d.ts file from the CDN, and the experience is theoretically consistent with the local IDE.

## Vue Support

Since the Vue language tool is well integrated with Volar.js, this extension also integrates Vue language support with very little effort, but you don't have to worry about it, there is almost no performance loss.

## Svelte + Angular + MDX Support

We have previously implemented Svelte and Angular examples for Volar.js, and this extension also integrates them along with an MDX implementation from the community.

- Svelte Example: https://github.com/volarjs/svelte-language-tools
- Angular Example: https://github.com/volarjs/angular-language-tools
- MDX Implement: Do not open source yet

Note that only Vue is a mature implementation, the others are not. The extension defaults to enabling support for these 4 languages and you can disable the ones you don't use as needed.

```json
// .vscode/settings.json
{
    "typescript-web.supportVue": false,
    "typescript-web.supportSvelte": false,
    "typescript-web.supportAngular": false,
    "typescript-web.supportMdx": false
}
```

## Syntax Highlighting and Grammar

This extension only includes IntelliSense and syntax highlighting support for .vue, .svelte, and .mdx files; you will still need to install the corresponding extensions for this:

- Vue: https://marketplace.visualstudio.com/items?itemName=Vue.volar
- Svelte: https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode
- MDX: https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx

## Check internally generated virtual code for .vue, svelte, .html, .mdx.

As with the official Vue extension, you can use this extension to view virtual code in a Web IDE, simply by running the TypeScript Web (Debug): Show Virtual Files command.

## Settings

- `typescript-web.supportVue`: Enable Vue support for .vue (Default true)
- `typescript-web.supportSvelte`: Enable Svelte support for .svelte (Default true)
- `typescript-web.supportAngular`: Enable Angular support for .html (Default true)
- `typescript-web.supportMdx`: Enable MDX support for .mdx (Default true)
- `typescript-web.dts.cdn`: CDN address for downloading .d.ts files (Default https://unpkg.com/)
- `typescript-web.dts.versions`: Specify the version of modules to download (Default `{}`)
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

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.png"/>
  </a>
</p>
