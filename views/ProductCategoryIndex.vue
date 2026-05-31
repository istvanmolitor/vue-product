<script setup lang="ts">
import { AdminLayout, LoadingSpinner, TreeView, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import Button from '@admin/components/ui/button/Button.vue'
import DataTableSearch from '@admin/components/ui/dataTable/DataTableSearch.vue'
import Icon from '@admin/components/ui/Icon.vue'
import Select from '@admin/components/ui/Select.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { productCategoryService, type ProductCategory } from '@product/services/productCategoryService'

type ProductCategoryTreeItem = ProductCategory & {
  children: ProductCategoryTreeItem[]
}

type ProductCategorySortField = 'id' | 'name' | 'slug'
type ProductCategoryTextSortField = Exclude<ProductCategorySortField, 'id'>

const router = useRouter()
const productCategories = ref<ProductCategoryTreeItem[]>([])
const isLoading = ref(false)
const search = ref('')
const sortField = ref<ProductCategorySortField>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const sortOptions: Array<{ value: ProductCategorySortField; label: string }> = [
  { value: 'name', label: 'Név szerint' },
  { value: 'slug', label: 'Slug szerint' },
  { value: 'id', label: 'ID szerint' },
]

const normalizeParentId = (parentId?: number | null): number | null => {
  return parentId ?? null
}

const getTextSortValue = (category: ProductCategory, field: ProductCategoryTextSortField): string => {
  return field === 'name'
    ? String(category.name ?? '').toLocaleLowerCase('hu-HU')
    : String(category.slug ?? '').toLocaleLowerCase('hu-HU')
}

const getCategoryId = (item: unknown): number | undefined => {
  if (!item || typeof item !== 'object') {
    return undefined
  }

  const { id } = item as ProductCategory

  return typeof id === 'number' ? id : undefined
}

const getCategoryName = (item: unknown): string => {
  if (!item || typeof item !== 'object') {
    return 'Névtelen kategória'
  }

  return (item as ProductCategory).name || 'Névtelen kategória'
}

const getCategorySlug = (item: unknown): string | undefined => {
  if (!item || typeof item !== 'object') {
    return undefined
  }

  const { slug } = item as ProductCategory

  return typeof slug === 'string' && slug.length > 0 ? slug : undefined
}

const compareCategories = (
  leftCategory: ProductCategory,
  rightCategory: ProductCategory,
  currentSortField: ProductCategorySortField,
  direction: 'asc' | 'desc'
): number => {
  const factor = direction === 'desc' ? -1 : 1

  if (currentSortField === 'id') {
    const left = Number(leftCategory[currentSortField] ?? 0)
    const right = Number(rightCategory[currentSortField] ?? 0)

    return (left - right) * factor
  }

  const textSortField = currentSortField as ProductCategoryTextSortField
  const left = getTextSortValue(leftCategory, textSortField)
  const right = getTextSortValue(rightCategory, textSortField)

  if (left < right) {
    return -1 * factor
  }

  if (left > right) {
    return 1 * factor
  }

  return 0
}

const toTreeRows = (
  categories: ProductCategory[],
  currentSortField: ProductCategorySortField,
  direction: 'asc' | 'desc'
): ProductCategoryTreeItem[] => {
  const byParent = new Map<number | null, ProductCategory[]>()

  categories.forEach((category) => {
    const parentId = normalizeParentId(category.parent_id)

    if (!byParent.has(parentId)) {
      byParent.set(parentId, [])
    }

    byParent.get(parentId)!.push(category)
  })

  const rows: ProductCategoryTreeItem[] = []
  const visited = new Set<number>()

  const walk = (parentId: number | null): ProductCategoryTreeItem[] => {
    const children = [...(byParent.get(parentId) ?? [])]
      .sort((left, right) => compareCategories(left, right, currentSortField, direction))

    const nodes: ProductCategoryTreeItem[] = []

    children.forEach((child) => {
      if (!child.id || visited.has(child.id)) {
        return
      }

      visited.add(child.id)
      nodes.push({
        ...child,
        children: walk(child.id),
      })
    })

    return nodes
  }

  rows.push(...walk(null))

  categories
    .filter((category) => category.id && !visited.has(category.id))
    .sort((left, right) => compareCategories(left, right, currentSortField, direction))
    .forEach((category) => {
      visited.add(category.id!)
      rows.push({
        ...category,
        children: walk(category.id!),
      })
    })

  return rows
}

const fetchAllPages = async (params: {
  search?: string
  sort?: ProductCategorySortField
  direction?: 'asc' | 'desc'
}): Promise<ProductCategory[]> => {
  let currentPage = 1
  let lastPage = 1
  const categories: ProductCategory[] = []

  do {
    const response = await productCategoryService.getAll({
      ...params,
      page: currentPage,
    })

    categories.push(...response.data.data)
    lastPage = response.data.meta?.last_page ?? 1
    currentPage += 1
  } while (currentPage <= lastPage)

  return categories
}

const fetchProductCategories = async (): Promise<void> => {
  try {
    isLoading.value = true
    const categories = await fetchAllPages({
      search: search.value.trim() || undefined,
      sort: sortField.value,
      direction: sortDirection.value,
    })

    productCategories.value = toTreeRows(
      categories,
      sortField.value,
      sortDirection.value
    )
  } catch (error) {
    console.error('Hiba a termékkategóriák betöltésekor:', error)
    toastService.error('Hiba történt a termékkategóriák betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const deleteProductCategory = async (id: number) => {
  try {
    await productCategoryService.delete(id)
    toastService.success('Termékkategória sikeresen törölve!')
    await fetchProductCategories()
  } catch (error) {
    console.error('Hiba a termékkategória törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProductCategory = (id: number) => {
  router.push(`/admin/product-category/${id}/edit`)
}

const handleEditTreeItem = (item: unknown): void => {
  const categoryId = getCategoryId(item)

  if (!categoryId) {
    return
  }

  editProductCategory(categoryId)
}

const handleDeleteTreeItem = (item: unknown): void => {
  const categoryId = getCategoryId(item)

  if (!categoryId) {
    return
  }

  deleteProductCategory(categoryId)
}

const handleSearch = (): void => {
  fetchProductCategories()
}

const handleSortFieldChange = (value: string | number | null): void => {
  if (value !== 'id' && value !== 'name' && value !== 'slug') {
    return
  }

  sortField.value = value
  fetchProductCategories()
}

const toggleSortDirection = (): void => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  fetchProductCategories()
}

onMounted(() => {
  fetchProductCategories()
})
</script>

<template>
  <AdminLayout pageTitle="Termékkategóriák">
    <div class="space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableSearch
            v-model="search"
            placeholder="Keresés név vagy slug alapján..."
            @search="handleSearch"
          />

          <div class="flex items-center gap-2">
            <Select
              :model-value="sortField"
              :options="sortOptions"
              class="w-full sm:w-44"
              @update:model-value="handleSortFieldChange"
            />

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              :title="sortDirection === 'asc' ? 'Növekvő rendezés' : 'Csökkenő rendezés'"
              @click="toggleSortDirection"
            >
              <Icon :name="sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'" class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CreateButton to="/admin/product-category/create">
          Új termékkategória
        </CreateButton>
      </div>

      <div v-if="isLoading && productCategories.length === 0" class="flex justify-center py-8">
        <LoadingSpinner label="Betöltés..." />
      </div>

      <TreeView v-else :items="productCategories" empty-text="Nincs megjeleníthető termékkategória.">
        <template #item="{ item }">
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-sm font-medium">
                {{ getCategoryName(item) }}
              </span>
              <span v-if="getCategoryId(item)" class="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                #{{ getCategoryId(item) }}
              </span>
            </div>
            <p v-if="getCategorySlug(item)" class="truncate text-xs text-muted-foreground">
              /{{ getCategorySlug(item) }}
            </p>
          </div>
        </template>

        <template #actions="{ item }">
          <EditButton @click="handleEditTreeItem(item)" />
          <DeleteButton @confirm="handleDeleteTreeItem(item)" />
        </template>
      </TreeView>
    </div>
  </AdminLayout>
</template>
