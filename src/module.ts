import { defineNuxtModule, addPlugin, addImports, addTemplate, createResolver } from '@nuxt/kit'
import type { IModuleOptions } from './types'
import { DEFAULT_OPTIONS } from './constants'

export type ModuleOptions = IModuleOptions

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-sprite-svg',
    configKey: 'sprite-svg',
  },
  setup(_options, _nuxt) {
    const options = {
      ...DEFAULT_OPTIONS,
      ..._options,
    }

    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = resolve('./runtime')

    _nuxt.options.build.transpile.push(runtimeDir)

    _nuxt.options.alias['#sprite-options'] = addTemplate({
      filename: 'sprite-options.mjs',
      getContents() {
        return `export default ${JSON.stringify(options)}`
      },
    }).dst
  },
})
