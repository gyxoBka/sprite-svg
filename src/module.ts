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
import { spritesTemplate, spritesTypesTemplate } from './templates/sprites'
import { typesTemplate } from './templates/types'

function resolveNuxtStoragePath(input: string, nuxt: any): string {
  const rootDir = path.resolve(nuxt.options.rootDir)
  const srcDir = path.resolve(nuxt.options.srcDir)

  let resolvedPath = input

  if (input.startsWith('~/') || input.startsWith('@/')) {
    resolvedPath = path.resolve(srcDir, input.slice(2))
  }
  else if (input.startsWith('~~/') || input.startsWith('@@/')) {
    resolvedPath = path.resolve(rootDir, input.slice(3))
  }
  else if (!path.isAbsolute(input)) {
    resolvedPath = path.resolve(rootDir, input.replace(/^\.\//, ''))
  }

  return ['root', ...path.relative(rootDir, resolvedPath).split(path.sep)].join(':')
}

function resolveNuxtFsPath(input: string, nuxt: any): string {
  const rootDir = path.resolve(nuxt.options.rootDir)
  const srcDir = path.resolve(nuxt.options.srcDir)

  if (input.startsWith('~/') || input.startsWith('@/')) {
    return path.resolve(srcDir, input.slice(2))
  }

  if (input.startsWith('~~/') || input.startsWith('@@/')) {
    return path.resolve(rootDir, input.slice(3))
  }

  if (path.isAbsolute(input)) {
    return input
  }

  return path.resolve(rootDir, input.replace(/^\.\//, ''))
}

async function getSvgFiles(dir: string, baseDir = dir): Promise<Array<{ file: string, content: string }>> {
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = await Promise.all(entries.map(async (entry) => {
    const currentPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getSvgFiles(currentPath, baseDir)
    }

    if (!entry.isFile() || !entry.name.endsWith('.svg')) {
      return []
    }

    return [{
      file: path.relative(baseDir, currentPath).split(path.sep).join(':'),
      content: await fsp.readFile(currentPath, 'utf8'),
    }]
  }))

  return files.flat()
}

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
    addTemplate({
      ...spritesTypesTemplate,
      write: true,
    })

    nuxt.options.alias['#svg-sprite-types'] = addTemplate({
      ...typesTemplate,
      write: true,
      options: {
        sprites,
        defaultSprite: options.defaultSprite,
      },
    }).dst

    ;(nuxt.hook as any)('nitro:init', async (nitro: any) => {
      const input = resolveNuxtStoragePath(options.input, nuxt)
      const inputDir = resolveNuxtFsPath(options.input, nuxt)
      const output = resolveNuxtFsPath(options.output, nuxt)

      // Make sure output directory exists and contains .gitignore to ignore sprite files
      if (!await fsp.stat(path.join(output, '.gitignore')).catch(() => false)) {
        // await nitro.storage.setItem(`${output}:.gitignore`, '*')
        await fsp.mkdir(output, { recursive: true })
        await fsp.writeFile(path.join(output, '.gitignore'), '*')
      }

      const svgsFiles = await getSvgFiles(inputDir)
      await Promise.all(
        svgsFiles.map(async ({ file, content }) => {
          const { name, sprite } = useSvgFile(file, { defaultSprite: options.defaultSprite })

          return addSvg({
            name,
            sprite,
            content,
          })
        }),
      )

      const writeSprite = async (sprite: string) => {
        const spriteContent = generateSprite(sprite)
        const fileName = nuxt.options.dev ? sprite : `${sprite}.${getHash(spriteContent)}`

        const spriteDir = output
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
      await updateTemplates({
        filter: template =>
          template.filename === 'sprite-svg.mjs'
          || template.filename === 'sprite-svg.d.ts'
          || template.filename === 'types/svg-sprite.d.ts',
      })

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
      nitro.storage.watch((event: string, file: string) => handleFileChange(event, file))
    })
  },
})
