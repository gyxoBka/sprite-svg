# nuxt-sprite-svg

> Nuxt3 or higher module

Optimized and Easy way to use SVG files in Nuxt

## Installation

```sh
npm i nuxt-sprite-svg
```

Add to modules

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-sprite-svg'],
  svgSprite: {
    input: '~/assets/sprite/svg',
    output: '~~/public/assets/sprite',
    publicPath: '/assets/sprite',
    defaultSprite: 'icons',
    elementClass: 'icon',
  },
})
```

Place your svg files in `app/assets/sprite/svg/`, say `sample.svg` and use your image with globally registered `svg-icon` component:

```vue
<svg-icon name="sample" />
```

To create different sprites, create custom directory inside `app/assets/sprite/svg/` and put your svg files inside it and place directory title before icon name (example: `app/assets/sprite/svg/my-sprite/my-image.svg`):

```vue
<svg-icon name="my-sprite/my-image" />
```

## Options

Module default options:


| Option | Default | Description                                                                                              |
| ------ | ------- |----------------------------------------------------------------------------------------------------------|
| input | `~/assets/sprite/svg` | Directory of original svg files. In Nuxt 4, this resolves to `app/assets/sprite/svg`                     |
| output | `~~/public/assets/sprite` | Directory to store generated sprites. This resolves to `<rootDir>/public/assets/sprite`             |
| defaultSprite | `icons` | Name of default sprite (default sprite consist of all svgs that place directly inside `input` directory) |
| elementClass | `icon` | global class of all `<svg-icon>` instances                                                               |
| publicPath | `/assets/sprite` | Relative public sprite path                                                                              |
| svgoConfig | `null` | Custom config object for SVGO, [How to customize SVGO config](/docs/svgo-config.md)                      |

You can update them with the `svgSprite` option in `nuxt.config`:


## Props

| Prop | Description |
| --- | --- |
| name | icon path with format `SPRITE_NAME/ICON_NAME`, `SPRITE_NAME` can be omitted for default sprite  |

## LICENSE

MIT
