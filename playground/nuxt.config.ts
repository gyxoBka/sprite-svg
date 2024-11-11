export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  svgSprite: {
    input: '~/assets/sprite/svg',
    output: '~/public/assets/sprite',
    publicPath: '/assets/sprite',
    defaultSprite: 'icons',
    elementClass: 'icon',
  },
})
