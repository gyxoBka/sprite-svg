declare module '#svg-sprite' {
  export const path: string
  export const spriteClass: string
  export const defaultSprite: string
  export const spriteManifest: Record<string, string>
}

declare module '#svg-sprite-types' {
  export type SpriteIconName = string
}
