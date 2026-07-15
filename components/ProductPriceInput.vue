<script setup lang="ts">
import { computed } from 'vue'
import Input from '@admin/components/ui/Input.vue'
import type { Currency } from '@currency'

interface Props {
  id?: string
  modelValue?: number | null
  currency?: Currency | null
  min?: string | number
  step?: string | number
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: null,
  currency: null,
  min: 0,
  step: '0.01',
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const currencySymbol = computed(() => {
  return props.currency?.symbol?.trim() || props.currency?.code?.trim() || ''
})

const isCurrencyFirst = computed(() => {
  return props.currency?.is_symbol_first === true
})

const inputClass = computed(() => {
  if (!currencySymbol.value) {
    return ''
  }

  return isCurrencyFirst.value ? 'rounded-l-none border-l-0' : 'rounded-r-none border-r-0'
})

const currencyBadgeClass = computed(() => {
  return isCurrencyFirst.value
    ? 'rounded-l-md rounded-r-none border-r-0'
    : 'rounded-r-md rounded-l-none border-l-0'
})

const parsePriceValue = (value: string | number): number | null => {
  if (value === '') {
    return null
  }

  const normalizedValue = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')

  if (normalizedValue === '') {
    return null
  }

  const parsedValue = Number(normalizedValue)

  return Number.isNaN(parsedValue) ? null : parsedValue
}

const inputValue = computed<string>({
  get() {
    return props.modelValue === null ? '' : String(props.modelValue)
  },
  set(value) {
    emit('update:modelValue', parsePriceValue(value))
  },
})
</script>

<template>
  <div class="flex items-center">
    <span
      v-if="currencySymbol && isCurrencyFirst"
      :class="['flex h-9 items-center border border-input bg-muted px-3 text-xs text-muted-foreground', currencyBadgeClass]"
    >
      {{ currencySymbol }}
    </span>
    <Input
      :id="id"
      v-model="inputValue"
      type="text"
      inputmode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      :min="min"
      :step="step"
      :required="required"
      :class="inputClass"
    />
    <span
      v-if="currencySymbol && !isCurrencyFirst"
      :class="['flex h-9 items-center border border-input bg-muted px-3 text-xs text-muted-foreground', currencyBadgeClass]"
    >
      {{ currencySymbol }}
    </span>
  </div>
</template>
