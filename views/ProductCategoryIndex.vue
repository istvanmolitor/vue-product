<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable, { type Column } from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { productCategoryService, type ProductCategory } from '@product/services/productCategoryService'

type ProductCategoryTreeRow = ProductCategory & {
  depth: number
}

const router = useRouter()
const productCategories = ref<ProductCategoryTreeRow[]>([])
const isLoading = ref(false)
const currentFilters = ref<{
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}>({
  sort: 'name',
  direction: 'asc',
})

const columns: Column<ProductCategoryTreeRow>[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Név', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
]

const normalizeParentId = (parentId?: number | null): number | null => {
  return parentId ?? null
}

const compareCategories = (
  leftCategory: ProductCategory,
  rightCategory: ProductCategory,
  sortField: string,
  direction: 'asc' | 'desc'
): number => {
  const factor = direction === 'desc' ? -1 : 1

  if (sortField === 'id' || sortField === 'parent_id') {
    const left = Number(leftCategory[sortField] ?? 0)
    const right = Number(rightCategory[sortField] ?? 0)

    return (left - right) * factor
  }

  const left = String((leftCategory as Record<string, unknown>)[sortField] ?? '').toLocaleLowerCase('hu-HU')
  const right = String((rightCategory as Record<string, unknown>)[sortField] ?? '').toLocaleLowerCase('hu-HU')

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
  sortField: string,
  direction: 'asc' | 'desc'
): ProductCategoryTreeRow[] => {
  const byParent = new Map<number | null, ProductCategory[]>()

  categories.forEach((category) => {
    const parentId = normalizeParentId(category.parent_id)

    if (!byParent.has(parentId)) {
      byParent.set(parentId, [])
    }

    byParent.get(parentId)!.push(category)
  })

  const rows: ProductCategoryTreeRow[] = []
  const visited = new Set<number>()

  const walk = (parentId: number | null, depth: number) => {
    const children = [...(byParent.get(parentId) ?? [])]
      .sort((left, right) => compareCategories(left, right, sortField, direction))

    children.forEach((child) => {
      if (!child.id || visited.has(child.id)) {
        return
      }

      visited.add(child.id)
      rows.push({ ...child, depth })
      walk(child.id, depth + 1)
    })
  }

  walk(null, 0)

  categories
    .filter((category) => category.id && !visited.has(category.id))
    .sort((left, right) => compareCategories(left, right, sortField, direction))
    .forEach((category) => {
      rows.push({ ...category, depth: 0 })

      if (category.id) {
        walk(category.id, 1)
      }
    })

  return rows
}

const fetchAllPages = async (params: {
  search?: string
  sort?: string
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

const fetchProductCategories = async (params: {
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}) => {
  try {
    isLoading.value = true
    currentFilters.value = {
      search: params.search,
      sort: params.sort || 'name',
      direction: params.direction || 'asc',
    }

    const categories = await fetchAllPages(currentFilters.value)

    productCategories.value = toTreeRows(
      categories,
      currentFilters.value.sort || 'name',
      currentFilters.value.direction || 'asc'
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
    await fetchProductCategories(currentFilters.value)
  } catch (error) {
    console.error('Hiba a termékkategória törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProductCategory = (id: number) => {
  router.push(`/admin/product-category/${id}/edit`)
}

const formatTreeIndent = (depth: number): string => {
  return `${depth * 1.25}rem`
}

const getTreeMarker = (depth: number): string => {
  if (depth <= 0) {
    return ''
  }

  return `${'| '.repeat(Math.max(depth - 1, 0))}|-`
}

onMounted(() => {
  fetchProductCategories({
    sort: 'name',
    direction: 'asc',
  })
})
</script>

<template>
  <AdminLayout pageTitle="Termékkategóriák">
    <DataTable
      :columns="columns"
      :data="productCategories"
      :loading="isLoading"
      :searchable="true"
      search-placeholder="Keresés név alapján..."
      default-sort="name"
      default-direction="asc"
      @fetch="fetchProductCategories"
    >
      <template #actions>
        <CreateButton to="/admin/product-category/create">
          Új termékkategória
        </CreateButton>
      </template>
      <template #cell-name="{ row }">
        <div class="flex items-center" :style="{ paddingLeft: formatTreeIndent(row.depth) }">
          <span
            v-if="row.depth > 0"
            class="mr-2 text-muted-foreground"
          >
            {{ getTreeMarker(row.depth) }}
          </span>
          <span>{{ row.name }}</span>
        </div>
      </template>
      <template #row-actions="{ row }">
        <div class="flex items-center gap-2">
          <EditButton
            @click="editProductCategory(row.id!)"
          />
          <DeleteButton
            @confirm="deleteProductCategory(row.id!)"
          />
        </div>
      </template>
      <template #empty>
        Nincs megjeleníthető termékkategória.
      </template>
    </DataTable>
  </AdminLayout>
</template>
