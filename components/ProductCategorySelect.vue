<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { LoadingSpinner, TreeView } from '@admin'
import Button from '@admin/components/ui/button/Button.vue'
import Checkbox from '@admin/components/ui/Checkbox.vue'
import Icon from '@admin/components/ui/Icon.vue'
import Modal from '@admin/components/ui/Modal.vue'
import { productCategoryService, type ProductCategory } from '@product/services/productCategoryService'

interface ProductCategorySelectOption {
  id: number
  parent_id: number | null
  name: string
}

type TreeCategoryItem = ProductCategorySelectOption & {
  children: TreeCategoryItem[]
}

interface Props {
  id?: string
  modelValue?: number[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  modalTitle?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadCategories?: (search: string) => Promise<ProductCategorySelectOption[]>
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: () => [],
  placeholder: 'Valassz kategoriakat',
  disabled: false,
  required: false,
  modalTitle: 'Kategoriak kivalasztasa',
  searchPlaceholder: 'Kereses kategoriara...',
  emptyMessage: 'Nincs megjelenitheto kategoria.',
  loadCategories: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const isModalOpen = ref(false)
const isLoading = ref(false)
const search = ref('')
const categories = ref<ProductCategorySelectOption[]>([])
const selectedIdsDraft = ref<number[]>([])
const knownCategoryNames = ref<Record<number, string>>({})
let searchTimeout: ReturnType<typeof setTimeout> | null = null
let requestId = 0
let selectedNamesRequestId = 0

const normalizedModelValue = computed<number[]>(() => {
  const ids = Array.isArray(props.modelValue) ? props.modelValue : []

  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))].sort((left, right) => left - right)
})

const selectedCategoryNames = computed<string[]>(() => {
  return normalizedModelValue.value
    .map((id) => {
      const knownName = knownCategoryNames.value[id]

      if (typeof knownName === 'string' && knownName.trim().length > 0) {
        return knownName
      }

      return `#${id}`
    })
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
})

const resolveCategoryName = (category: ProductCategory): string => {
  const translationNames = Object.values(category.translations ?? {})
    .map((translation) => String(translation.name ?? '').trim())
    .filter((name) => name.length > 0)

  if (translationNames.length > 0) {
    return translationNames[0]
  }

  const directName = String(category.name ?? '').trim()

  if (directName.length > 0) {
    return directName
  }

  return `#${category.id ?? ''}`
}

const normalizeCategory = (category: ProductCategory): ProductCategorySelectOption | null => {
  if (!category.id) {
    return null
  }

  return {
    id: category.id,
    parent_id: typeof category.parent_id === 'number' ? category.parent_id : null,
    name: resolveCategoryName(category),
  }
}

const fetchAllProductCategories = async (query: string): Promise<ProductCategorySelectOption[]> => {
  const items: ProductCategorySelectOption[] = []
  let page = 1
  let lastPage = 1

  do {
    const response = await productCategoryService.getAll({
      search: query.trim().length > 0 ? query.trim() : undefined,
      page,
      sort: 'name',
      direction: 'asc',
    })

    const rows = (response.data.data ?? [])
      .map((category) => normalizeCategory(category))
      .filter((category): category is ProductCategorySelectOption => category !== null)

    items.push(...rows)

    lastPage = response.data.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)

  return items
}

const updateKnownNames = (items: ProductCategorySelectOption[]): void => {
  const nextNames = { ...knownCategoryNames.value }

  items.forEach((item) => {
    nextNames[item.id] = item.name
  })

  knownCategoryNames.value = nextNames
}

const setCategories = (items: ProductCategorySelectOption[]): void => {
  categories.value = items
  updateKnownNames(items)
}

const loadCategoryList = async (query: string): Promise<void> => {
  const currentRequestId = ++requestId
  isLoading.value = true

  try {
    const items = props.loadCategories
      ? await props.loadCategories(query)
      : await fetchAllProductCategories(query)

    if (currentRequestId !== requestId) {
      return
    }

    setCategories(items)
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
    }
  }
}

const ensureSelectedCategoryNames = async (ids: number[]): Promise<void> => {
  const missingIds = ids.filter((id) => !(id in knownCategoryNames.value))

  if (missingIds.length === 0) {
    return
  }

  const currentRequestId = ++selectedNamesRequestId

  try {
    if (props.loadCategories) {
      const items = await props.loadCategories('')

      if (currentRequestId !== selectedNamesRequestId) {
        return
      }

      updateKnownNames(items)
      return
    }

    const responses = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const response = await productCategoryService.getById(id)
          return normalizeCategory(response.data.data)
        } catch {
          return {
            id,
            parent_id: null,
            name: `#${id}`,
          } satisfies ProductCategorySelectOption
        }
      })
    )

    if (currentRequestId !== selectedNamesRequestId) {
      return
    }

    updateKnownNames(
      responses.filter((item): item is ProductCategorySelectOption => item !== null)
    )
  } catch {
    // Keep fallback labels if lookup fails.
  }
}

const toTree = (items: ProductCategorySelectOption[]): TreeCategoryItem[] => {
  const byParent = new Map<number | null, ProductCategorySelectOption[]>()

  items.forEach((item) => {
    const parentId = item.parent_id ?? null

    if (!byParent.has(parentId)) {
      byParent.set(parentId, [])
    }

    byParent.get(parentId)?.push(item)
  })

  const visited = new Set<number>()

  const walk = (parentId: number | null): TreeCategoryItem[] => {
    const children = [...(byParent.get(parentId) ?? [])]
      .sort((left, right) => left.name.localeCompare(right.name, 'hu-HU'))

    return children
      .filter((child) => !visited.has(child.id))
      .map((child) => {
        visited.add(child.id)

        return {
          ...child,
          children: walk(child.id),
        }
      })
  }

  const roots = walk(null)

  items
    .filter((item) => !visited.has(item.id))
    .sort((left, right) => left.name.localeCompare(right.name, 'hu-HU'))
    .forEach((item) => {
      visited.add(item.id)
      roots.push({
        ...item,
        children: walk(item.id),
      })
    })

  return roots
}

const treeItems = computed<TreeCategoryItem[]>(() => toTree(categories.value))

const clearSearchTimeout = (): void => {
  if (searchTimeout !== null) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
}

watch(search, () => {
  if (!isModalOpen.value) {
    return
  }

  clearSearchTimeout()

  searchTimeout = setTimeout(() => {
    void loadCategoryList(search.value)
  }, 300)
})

watch(normalizedModelValue, (value) => {
  if (!isModalOpen.value) {
    selectedIdsDraft.value = [...value]
  }

  void ensureSelectedCategoryNames(value)
}, { immediate: true })

onBeforeUnmount(() => {
  clearSearchTimeout()
})

const isSelectedInDraft = (categoryId: number): boolean => {
  return selectedIdsDraft.value.includes(categoryId)
}

const toggleCategory = (categoryId: number): void => {
  if (isSelectedInDraft(categoryId)) {
    selectedIdsDraft.value = selectedIdsDraft.value.filter((id) => id !== categoryId)
    return
  }

  selectedIdsDraft.value = [...selectedIdsDraft.value, categoryId].sort((left, right) => left - right)
}

const openModal = (): void => {
  if (props.disabled) {
    return
  }

  selectedIdsDraft.value = [...normalizedModelValue.value]
  isModalOpen.value = true
  clearSearchTimeout()
  void loadCategoryList(search.value)
}

const closeModal = (): void => {
  isModalOpen.value = false
  clearSearchTimeout()
  search.value = ''
}

const clearSelection = (): void => {
  selectedIdsDraft.value = []
}

const saveSelection = (): void => {
  emit('update:modelValue', [...new Set(selectedIdsDraft.value)].sort((left, right) => left - right))
  closeModal()
}
</script>

<template>
  <div class="space-y-2">
    <button
      type="button"
      :id="id"
      :disabled="disabled"
      class="flex h-auto min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      @click="openModal"
    >
      <div class="min-w-0 flex-1">
        <div v-if="normalizedModelValue.length > 0" class="space-y-1">
          <div class="text-xs text-muted-foreground">{{ normalizedModelValue.length }} kategoria kivalasztva</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(name, index) in selectedCategoryNames.slice(0, 3)"
              :key="`${name}-${index}`"
              class="rounded bg-muted px-2 py-0.5 text-xs"
            >
              {{ name }}
            </span>
            <span v-if="selectedCategoryNames.length > 3" class="rounded bg-muted px-2 py-0.5 text-xs">
              +{{ selectedCategoryNames.length - 3 }}
            </span>
          </div>
        </div>
        <span v-else class="text-muted-foreground">{{ placeholder }}</span>
      </div>
      <span class="ml-2 shrink-0 text-xs text-muted-foreground">Kivalasztas</span>
    </button>

    <input
      v-if="required"
      type="text"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none absolute h-0 w-0 opacity-0"
      :value="normalizedModelValue.join(',')"
      required
    />

    <Modal :show="isModalOpen" :title="modalTitle" @close="closeModal">
      <div class="space-y-3">
        <input
          v-model="search"
          type="text"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          :placeholder="searchPlaceholder"
        />

        <div v-if="isLoading" class="py-6">
          <LoadingSpinner label="Kategoria betoltes..." />
        </div>

        <TreeView v-else :items="treeItems" :empty-text="emptyMessage" class="max-h-[360px] overflow-auto">
          <template #item="{ item }">
            <button
              type="button"
              class="flex w-full items-center gap-2 text-left"
              @click.stop="toggleCategory(item.id as number)"
            >
              <Checkbox
                :model-value="isSelectedInDraft(item.id as number)"
                @update:model-value="() => toggleCategory(item.id as number)"
              />
              <span class="truncate text-sm">{{ item.name }}</span>
            </button>
          </template>
        </TreeView>
      </div>

      <template #footer>
        <Button type="button" variant="outline" @click="clearSelection">Torles</Button>
        <Button type="button" variant="outline" @click="closeModal">Megse</Button>
        <Button type="button" @click="saveSelection">
          <Icon name="check" :size="16" class="mr-2" />
          Ment
        </Button>
      </template>
    </Modal>
  </div>
</template>
