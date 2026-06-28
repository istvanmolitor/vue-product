<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { productUnitService } from '@product/services/productUnitService'

const router = useRouter()
const table = ref()

const deleteProductUnit = async (id: number) => {
  try {
    await productUnitService.delete(id)
    toastService.success('Mennyiségi egység sikeresen törölve!')
    table.value?.refresh()
  } catch (error) {
    console.error('Hiba a mennyiségi egység törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProductUnit = (id: number) => {
  router.push(`/admin/product-unit/${id}/edit`)
}
</script>

<template>
  <AdminLayout pageTitle="Mennyiségi egységek">
    <DataTable
      ref="table"
      url="/api/admin/product/product-units"
    >
      <template #actions>
        <CreateButton to="/admin/product-unit/create">
          Új mennyiségi egység
        </CreateButton>
      </template>
      <template #cell-enabled="{ row }">
        <span v-if="(row as any).enabled" class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
          Engedélyezett
        </span>
        <span v-else class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
          Letiltva
        </span>
      </template>
      <template #row-actions="{ row }">
        <div class="flex items-center gap-2">
          <EditButton
            @click="editProductUnit((row as any).id)"
          />
          <DeleteButton
            @confirm="deleteProductUnit((row as any).id)"
          />
        </div>
      </template>
      <template #empty>
        Nincs megjeleníthető mennyiségi egység.
      </template>
    </DataTable>
  </AdminLayout>
</template>
