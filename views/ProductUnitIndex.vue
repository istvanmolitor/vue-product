<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable, { type Column, type PaginationMeta } from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { productUnitService, type ProductUnit } from '@product/services/productUnitService'

const router = useRouter()
const productUnits = ref<ProductUnit[]>([])
const isLoading = ref(false)
const pagination = ref<PaginationMeta>({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const columns: Column<ProductUnit>[] = [
  { key: 'code', label: 'Kód', sortable: true },
  { key: 'name', label: 'Név', sortable: true },
  { key: 'short_name', label: 'Rövid név', sortable: false, width: '150px' },
  { key: 'enabled', label: 'Státusz', sortable: false, width: '120px' },
]

const fetchProductUnits = async (params: {
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
}) => {
  try {
    isLoading.value = true
    const response = await productUnitService.getAll(params)
    productUnits.value = response.data.data
    pagination.value = response.data.meta
  } catch (error) {
    console.error('Hiba a mennyiségi egységek betöltésekor:', error)
    toastService.error('Hiba történt a mennyiségi egységek betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const deleteProductUnit = async (id: number) => {
  try {
    await productUnitService.delete(id)
    toastService.success('Mennyiségi egység sikeresen törölve!')
    await fetchProductUnits({ page: pagination.value.current_page })
  } catch (error) {
    console.error('Hiba a mennyiségi egység törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProductUnit = (id: number) => {
  router.push(`/admin/product-unit/${id}/edit`)
}

onMounted(() => {
  fetchProductUnits({
    page: 1,
    sort: 'code',
    direction: 'asc'
  })
})
</script>

<template>
  <AdminLayout pageTitle="Mennyiségi egységek">
    <DataTable
      :columns="columns"
      :data="productUnits"
      :loading="isLoading"
      :pagination="pagination"
      :searchable="true"
      search-placeholder="Keresés kód vagy név alapján..."
      default-sort="code"
      default-direction="asc"
      @fetch="fetchProductUnits"
    >
      <template #actions>
        <CreateButton to="/admin/product-unit/create">
          Új mennyiségi egység
        </CreateButton>
      </template>
      <template #cell-enabled="{ row }">
        <span v-if="row.enabled" class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
          Engedélyezett
        </span>
        <span v-else class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
          Letiltva
        </span>
      </template>
      <template #row-actions="{ row }">
        <div class="flex items-center gap-2">
          <EditButton
            @click="editProductUnit(row.id!)"
          />
          <DeleteButton
            @confirm="deleteProductUnit(row.id!)"
          />
        </div>
      </template>
      <template #empty>
        Nincs megjeleníthető mennyiségi egység.
      </template>
    </DataTable>
  </AdminLayout>
</template>

