<template>
  <svg :class="spriteClass">
    <use :href="`${path}/${icon.file}.svg#${icon.name}`" />
  </svg>
</template>

<script setup lang="ts">
import { path, spriteClass, defaultSprite } from '#svg-sprite'

const props = defineProps<{ name: string }>()

const icon = computed(() => {
  const [filename, icon] = props.name.split('/')

  if (!icon) return { file: defaultSprite, name: filename }

  return { file: filename, name: icon }
})
</script>
