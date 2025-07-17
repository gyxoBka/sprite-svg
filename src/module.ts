import fsp from 'node:fs/promises'
import path from 'node:path'
import {
  defineNuxtModule,
  createResolver,
  addTemplate,
  updateTemplates,
  addComponent,
} from '@nuxt/kit'
import type { IModuleOptions } from './types'
import inlineDefs from './svgo-plugins/inlineDefs'
import { createSpritesManager, getHash, useSvgFile } from './utils'
import { spritesTemplate } from './templates/sprites'
import { typesTemplate } from './templates/types'

export type ModuleOptions = IModuleOptions
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-sprite-svg',
    configKey: 'svgSprite',
  },
  defaults: {
    input: '~/assets/sprite/svg',
    output: '~/assets/sprite/gen',
    publicPath: '/assets/sprite/gen',
    defaultSprite: 'icons',
    elementClass: 'icon',
    optimizeOptions: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              // Make all styles inline By definition, a defs sprite is not usable as a CSS sprite
              inlineStyles: {
                onlyMatchedOnce: false,
              },
            },
          },
        },
        { name: 'cleanupIds', params: {} },
        { name: 'removeXMLNS' },
        // Disable removeViewBox plugin and enable removeDimensions
        { name: 'removeDimensions' },
        // Enable removeAttrs plugin, Remove id attribute to prevent conflict with our id
        {
          name: 'removeAttrs',
          params: {
            attrs: 'svg:id',
          },
        },
        inlineDefs,
      ],
    },
  },
  setup(options, nuxt) {
    const manifest: Record<string, string> = {}

    const { resolve } = createResolver(import.meta.url)

    addComponent({ name: 'SvgIcon', filePath: resolve('./runtime/components/svg-icon.vue'), global: true })

    const { sprites, addSvg, removeSvg, generateSprite } = createSpritesManager(options.optimizeOptions)

    nuxt.options.alias['#svg-sprite'] = addTemplate({
      ...spritesTemplate,
      write: true,
      options: {
        publicPath: options.publicPath,
        elementClass: options.elementClass,
        defaultSprite: options.defaultSprite,
        manifest,
      },
    }).dst

    nuxt.options.alias['#svg-sprite-types'] = addTemplate({
      ...typesTemplate,
      write: true,
      options: {
        sprites,
        defaultSprite: options.defaultSprite,
      },
    }).dst

    nuxt.hook('nitro:init', async (nitro) => {
      const input = options.input.replace(/~|\.\//, 'root').replace(/\//g, ':')
      const output = options.output.replace(/~\/|\.\//, '')

      // Make sure output directory exists and contains .gitignore to ignore sprite files
      if (!await nitro.storage.hasItem(`${output}:.gitignore`)) {
        // await nitro.storage.setItem(`${output}:.gitignore`, '*')
        await fsp.mkdir(`${nuxt.options.rootDir}/${output}`, { recursive: true })
        await fsp.writeFile(`${nuxt.options.rootDir}/${output}/.gitignore`, '*')
      }

      const svgsFiles = await nitro.storage.getKeys(input)
      await Promise.all(
        svgsFiles.map(async (file: string) => {
          file = file.substring(input.length + 1)
          const { name, sprite } = useSvgFile(file, { defaultSprite: options.defaultSprite })

          return addSvg({
            name,
            sprite,
            content: await nitro.storage.getItem(`${input}:${file}`) as string,
          })
        }),
      )

      const writeSprite = async (sprite: string) => {
        const spriteContent = generateSprite(sprite)
        const fileName = nuxt.options.dev ? sprite : `${sprite}.${getHash(spriteContent)}`

        const spriteDir = path.join(nuxt.options.rootDir, output)
        const filePath = path.join(spriteDir, `${fileName}.svg`)

        manifest[sprite] = fileName

        await fsp.writeFile(filePath, spriteContent)

        if (!nuxt.options.dev) {
          const existingFiles = await fsp.readdir(spriteDir)
          const outdated = existingFiles.filter(file =>
            file.startsWith(`${sprite}.`) && file.endsWith('.svg') && file !== `${fileName}.svg`,
          )

          await Promise.all(outdated.map(file => fsp.unlink(path.join(spriteDir, file))))
        }
      }

      await Promise.all(Object.keys(sprites).map(writeSprite))

      // Rest of the code is only for development
      if (!nuxt.options.dev) {
        return
      }

      const handleFileChange = async (event: string, file: string) => {
        if (!file.startsWith(input)) {
          return
        }

        file = file.substring(input.length + 1)
        const { name, sprite } = useSvgFile(file, { defaultSprite: options.defaultSprite })

        if (event === 'update') {
          console.log(`[NUXT-SPRITE-SVG] ${file} changed`)
          await addSvg({
            name,
            sprite,
            content: await nitro.storage.getItem(`${input}:${file}`) as string,
          })
        }
        else if (event === 'remove') {
          console.log(`[NUXT-SPRITE-SVG] ${file} removed`)
          removeSvg(sprite, name)
        }
        await writeSprite(sprite)

        await updateTemplates({
          filter: template => template.filename?.startsWith('svg-sprite'),
        })
      }
      nitro.storage.watch((event, file) => handleFileChange(event, file))
    })
  },
})
