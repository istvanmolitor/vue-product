<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Modal from '@admin/components/ui/Modal.vue'
import { productService, type Product } from '../services/productService'

type ProductSelectOption = Omit<Product, 'id'> & {
  id: number
  image_url?: string | null
  main_image_url?: string | null
}

interface ProductDisplayItem {
  id: number
  name: string
  sku: string
  imageUrl: string | null
  searchText: string
}

interface Props {
  id?: string
  modelValue?: number | null
  options?: ProductSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  emptyValue?: number | null
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: null,
  options: () => [],
  placeholder: 'Valassz termeket',
  searchPlaceholder: 'Kereses cikkszamra vagy nevere...',
  emptyMessage: 'Nincs talalat.',
  emptyValue: null,
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const isModalOpen = ref(false)
const isLoading = ref(false)
const search = ref('')
const products = ref<ProductSelectOption[]>([...props.options])
const selectedProductData = ref<ProductSelectOption | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null
let productsRequestId = 0
let selectedProductRequestId = 0

const clearSearchTimeout = (): void => {
  if (searchTimeout !== null) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
}

const resolveImageUrl = (product: ProductSelectOption): string | null => {
  if (product.image_url) {
    return product.image_url
  }

  if (product.main_image_url) {
    return product.main_image_url
  }

  if (!product.product_images || product.product_images.length === 0) {
    return null
  }

  const mainImage = product.product_images.find((productImage) => productImage.is_main)

  return mainImage?.image_url ?? product.product_images[0]?.image_url ?? null
}

const normalizeProduct = (product: ProductSelectOption | null): ProductDisplayItem | null => {
  if (product === null) {
    return null
  }

  const name = String(product.name ?? '').trim()
  const sku = String(product.sku ?? '').trim()
  const fallbackName = name.length > 0 ? name : `#${product.id}`

  return {
    id: product.id,
    name: fallbackName,
    sku: sku.length > 0 ? sku : '-',
    imageUrl: resolveImageUrl(product),
    searchText: `${fallbackName} ${sku}`.toLowerCase(),
  }
}

const normalizedProducts = computed(() => products.value.map((product) => normalizeProduct(product)).filter((product): product is ProductDisplayItem => product !== null))

const filteredProducts = computed(() => {
  return normalizedProducts.value
})

const selectedProduct = computed(() => {
  if (props.modelValue === null || props.modelValue === props.emptyValue) {
    return null
  }

  return normalizeProduct(selectedProductData.value ?? products.value.find((product) => product.id === props.modelValue) ?? null)
})

const setProducts = (items: ProductSelectOption[]): void => {
  products.value = items.map((product) => ({ ...product }))
}

const fetchProducts = async (query: string): Promise<void> => {
  const requestId = ++productsRequestId
  isLoading.value = true

  try {
    const response = await productService.searchForSelect({
      search: query.trim().length > 0 ? query.trim() : undefined,
      per_page: 20,
    })

    if (requestId !== productsRequestId) {
      return
    }

    setProducts((response.data.data ?? []) as ProductSelectOption[])
  } finally {
    if (requestId === productsRequestId) {
      isLoading.value = false
    }
  }
}

const fetchSelectedProduct = async (productId: number): Promise<void> => {
  const requestId = ++selectedProductRequestId
  const existingProduct = products.value.find((product) => product.id === productId)

  if (existingProduct) {
    selectedProductData.value = existingProduct
    return
  }

  try {
    const response = await productService.getById(productId)

    if (requestId !== selectedProductRequestId) {
      return
    }

    selectedProductData.value = response.data.data as ProductSelectOption
  } catch {
    if (requestId === selectedProductRequestId) {
      selectedProductData.value = null
    }
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === null || value === props.emptyValue) {
      selectedProductData.value = null
      return
    }

    void fetchSelectedProduct(value)
  },
  { immediate: true }
)

watch(search, () => {
  if (!isModalOpen.value) {
    return
  }

  clearSearchTimeout()

  searchTimeout = setTimeout(() => {
    void fetchProducts(search.value)
  }, 300)
})

onBeforeUnmount(() => {
  clearSearchTimeout()
})

const selectProduct = (productId: number): void => {
  emit('update:modelValue', productId)
  selectedProductData.value = products.value.find((product) => product.id === productId) ?? selectedProductData.value
  isModalOpen.value = false
  search.value = ''
}

const openModal = (): void => {
  if (props.disabled) {
    return
  }

  isModalOpen.value = true
  clearSearchTimeout()
  void fetchProducts(search.value)
}

const closeModal = (): void => {
  isModalOpen.value = false
  search.value = ''
  clearSearchTimeout()
}

const clearSelection = (): void => {
  emit('update:modelValue', props.emptyValue)
  selectedProductData.value = null
}
</script>

<template>
  <div>
    <button
      type="button"
      :id="id"
      :disabled="disabled"
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      @click="openModal"
    >
      <span v-if="selectedProduct" class="flex min-w-0 items-center gap-2">
        <img
          v-if="selectedProduct.imageUrl"
          :src="selectedProduct.imageUrl"
          alt=""
          class="h-6 w-6 rounded object-cover"
        />
        <span v-else class="h-6 w-6 rounded bg-muted" />
        <span class="truncate">{{ selectedProduct.sku }} - {{ selectedProduct.name }}</span>
      </span>
      <span v-else class="truncate text-muted-foreground">{{ placeholder }}</span>
      <span class="ml-2 shrink-0 text-xs text-muted-foreground">Kivalasztas</span>
    </button>

    <input
      v-if="required"
      type="text"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none absolute h-0 w-0 opacity-0"
      :value="modelValue ?? ''"
      required
    />

    <Modal :show="isModalOpen" title="Termek kivalasztasa" @close="closeModal">
      <div class="space-y-3">
        <input
          v-model="search"
          type="text"
          autofocus
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          :placeholder="searchPlaceholder"
        />

        <div class="max-h-96 overflow-y-auto rounded-md border p-1">
          <div v-if="isLoading" class="px-3 py-2 text-sm text-muted-foreground">
            Betoltes...
          </div>

          <div v-else-if="filteredProducts.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            {{ emptyMessage }}
          </div>

          <button
            v-for="product in filteredProducts"
            :key="product.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground': modelValue === product.id }"
            @click="selectProduct(product.id)"
          >
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              alt=""
              class="h-10 w-10 shrink-0 rounded object-cover"
            />
            <span v-else class="h-10 w-10 shrink-0 rounded bg-muted" />

            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs text-muted-foreground">{{ product.sku }}</span>
              <span class="block truncate font-medium">{{ product.name }}</span>
            </span>

            <svg
              v-if="modelValue === product.id"
              class="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          @click="closeModal"
        >
          Megse
        </button>
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          @click="clearSelection"
        >
          Kivalasztas torlese
        </button>
      </template>
    </Modal>
  </div>
</template>

