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
    output: '~/public/assets/sprite',
    publicPath: '/assets/sprite',
    defaultSprite: 'icons',
    elementClass: 'icon',
  },
})
```

Place your svg files in `~/assets/sprite/svg/`, say `sample.svg` and use your image with globally registered `svg-icon` component:

```vue
<svg-icon name="sample" />
```

To create different sprites, create custom directory inside `~/assets/sprite/svg/` and put your svg files inside it and place directory tile before icon name (example: `~/assets/sprite/svg/my-sprite/my-image.svg`):

```vue
<svg-icon name="my-sprite/my-image" />
```

## Options

Module default options:


| Option | Default | Description                                                                                              |
| ------ | ------- |----------------------------------------------------------------------------------------------------------|
| input | `~/assets/sprite/svg` | Directory of original svg files                                                                          |
| output | `~/assets/sprite/gen` | Directory to store generated sprites                                                                     |
| defaultSprite | `icons` | Name of default sprite (default sprite consist of all svgs that place directly inside `input` directory) |
| elementClass | `icon` | global class of all `<svg-icon>` instances                                                               |
| publicPath | `/assets/sprite/gen` | Relative public sprite path                                                                              |
| svgoConfig | `null` | Custom config object for SVGO, [How to customize SVGO config](/docs/svgo-config.md)                      |

You can update them with the `svgSprite` option in `nuxt.config`:


## Props

| Prop | Description |
| --- | --- |
| name | icon path with format `SPRITE_NAME/ICON_NAME`, `SPRITE_NAME` can be omitted for default sprite  |

## LICENSE

MIT
