export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-24',
  svgSprite: {
    input: '~/assets/sprite/svg',
    output: '~/public/assets/sprite',
    publicPath: '/assets/sprite',
    defaultSprite: 'icons',
    elementClass: 'icon',
  },
})
