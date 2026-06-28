<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable, { type Column, type PaginationMeta } from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { productService, type Product } from '@product/services/productService'

const router = useRouter()
const products = ref<Product[]>([])
const isLoading = ref(false)
const pagination = ref<PaginationMeta>({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const columns = ref<Column[]>([])

const fetchProducts = async (params: {
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
}) => {
  try {
    isLoading.value = true
    const response = await productService.getAll(params)
    products.value = response.data.data
    pagination.value = response.data.meta
    columns.value = (response.data.columns ?? []) as Column[]
  } catch (error) {
    console.error('Hiba a termékek betöltésekor:', error)
    toastService.error('Hiba történt a termékek betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const deleteProduct = async (id: number) => {
  try {
    await productService.delete(id)
    toastService.success('Termék sikeresen törölve!')
    await fetchProducts({ page: pagination.value.current_page })
  } catch (error) {
    console.error('Hiba a termék törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProduct = (id: number) => {
  router.push(`/admin/product/${id}/edit`)
}

onMounted(() => {
  fetchProducts({
    page: 1,
    sort: 'sku',
    direction: 'asc'
  })
})
</script>

<template>
  <AdminLayout pageTitle="Termékek">
    <DataTable
      :columns="columns"
      :data="products"
      :loading="isLoading"
      :pagination="pagination"
      :searchable="true"
      search-placeholder="Keresés SKU vagy név alapján..."
      default-sort="sku"
      default-direction="asc"
      @fetch="fetchProducts"
    >
      <template #actions>
        <CreateButton to="/admin/product/create">
          Új termék
        </CreateButton>
      </template>
      <template #cell-price="{ row }">
        {{ row.price ? row.price.toFixed(2) : '0.00' }}
      </template>
      <template #cell-active="{ row }">
        <span v-if="row.active" class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
          Aktív
        </span>
        <span v-else class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
          Inaktív
        </span>
      </template>
      <template #row-actions="{ row }">
        <EditButton
          @click="editProduct(row.id!)"
        />
        <DeleteButton
          @confirm="deleteProduct(row.id!)"
        />
      </template>
      <template #empty>
        Nincs megjeleníthető termék.
      </template>
    </DataTable>
  </AdminLayout>
</template>

