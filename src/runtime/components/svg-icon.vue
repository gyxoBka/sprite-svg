<template>
  <svg :class="spriteClass">
    <use :href="href" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from '#imports'
import { path, spriteClass, defaultSprite, spriteManifest } from '#svg-sprite'
import type { SpriteIconName } from '#svg-sprite-types'

const props = defineProps<{ name: SpriteIconName }>()

const icon = computed(() => {
  const [filename = '', iconName] = props.name.split('/')

  if (!iconName) return { file: spriteManifest[defaultSprite] ?? defaultSprite, name: filename }

  return { file: spriteManifest[filename] ?? filename, name: iconName }
})

const href = computed(() => `${path}/${icon.value.file}.svg#${icon.value.name}`)
</script>
