<script setup lang="ts">
import { computed } from 'vue'
import Select from '@admin/components/ui/Select.vue'

interface Props {
  id?: string
  modelValue?: number | null
  options?: Record<string, string>
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: null,
  options: () => ({}),
  placeholder: 'Nincs (Fokategoria)',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const normalizedOptions = computed(() => {
  return Object.entries(props.options)
    .map(([id, name]) => {
      const numericId = Number(id)

      if (!Number.isInteger(numericId) || numericId <= 0) {
        return null
      }

      return {
        id: numericId,
        name,
      }
    })
    .filter((option): option is { id: number, name: string } => option !== null)
})

const handleUpdate = (value: string | number | null): void => {
  if (typeof value === 'number') {
    emit('update:modelValue', value)
    return
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const numericValue = Number(value)

    emit('update:modelValue', Number.isInteger(numericValue) ? numericValue : null)
    return
  }

  emit('update:modelValue', null)
}
</script>

<template>
  <Select
    :id="id"
    :model-value="modelValue"
    :options="normalizedOptions"
    label-field="name"
    value-field="id"
    :placeholder="placeholder"
    clearable
    @update:model-value="handleUpdate"
  />
</template>