<template>
  <svg :class="spriteClass">
    <use :href="`${path}/${icon.file}.svg#${icon.name}`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from '#imports'
import { path, spriteClass, defaultSprite, spriteManifest } from '#svg-sprite'

const props = defineProps<{ name: string }>()

const icon = computed(() => {
  const [filename, icon] = props.name.split('/')

  if (!icon) return { file: spriteManifest[defaultSprite], name: filename }

  return { file: spriteManifest[filename], name: icon }
})
</script>
