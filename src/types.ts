import type { Config as SVGOConfig } from 'svgo'

export interface IModuleOptions {
  input: string
  output: string
  publicPath: string
  defaultSprite: string
  elementClass: string
  optimizeOptions: SVGOConfig
}
