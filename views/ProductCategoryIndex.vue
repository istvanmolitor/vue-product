<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable, { type Column, type PaginationMeta } from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { productCategoryService, type ProductCategory } from '@product/services/productCategoryService'

const router = useRouter()
const productCategories = ref<ProductCategory[]>([])
const isLoading = ref(false)
const pagination = ref<PaginationMeta>({
  current_page: 1,
  last_page: 1,
  per_page: 100, // Kategóriáknál általában kevesebb van, vagy fa struktúra
  total: 0
})

const columns: Column<ProductCategory>[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Név', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'parent_id', label: 'Szülő ID', sortable: true, width: '120px' },
]

const fetchProductCategories = async (params: {
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
}) => {
  try {
    isLoading.value = true
    const response = await productCategoryService.getAll(params)
    productCategories.value = response.data.data
    if (response.data.meta) {
      pagination.value = response.data.meta
    }
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
    await fetchProductCategories({ page: pagination.value.current_page })
  } catch (error) {
    console.error('Hiba a termékkategória törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProductCategory = (id: number) => {
  router.push(`/admin/product-category/${id}/edit`)
}

onMounted(() => {
  fetchProductCategories({
    page: 1,
    sort: 'name',
    direction: 'asc'
  })
})
</script>

<template>
  <AdminLayout pageTitle="Termékkategóriák">
    <DataTable
      :columns="columns"
      :data="productCategories"
      :loading="isLoading"
      :pagination="pagination"
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
