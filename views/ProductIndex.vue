<script setup lang="ts">
import { AdminLayout, toastService } from '@admin'
import CreateButton from '@admin/components/ui/button/CreateButton.vue'
import DeleteButton from '@admin/components/ui/button/DeleteButton.vue'
import EditButton from '@admin/components/ui/button/EditButton.vue'
import DataTable from '@admin/components/ui/dataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { productService } from '@product/services/productService'

const router = useRouter()
const table = ref()

const deleteProduct = async (id: number) => {
  try {
    await productService.delete(id)
    toastService.success('Termék sikeresen törölve!')
    table.value?.refresh()
  } catch (error) {
    console.error('Hiba a termék törlésekor:', error)
    toastService.error('Hiba történt a törlés során.')
  }
}

const editProduct = (id: number) => {
  router.push(`/admin/product/${id}/edit`)
}
</script>

<template>
  <AdminLayout pageTitle="Termékek">
    <DataTable
      ref="table"
      url="/api/admin/product/products"
    >
      <template #actions>
        <CreateButton to="/admin/product/create">
          Új termék
        </CreateButton>
      </template>
      <template #cell-price="{ row }">
        {{ (row as any).price ? (row as any).price.toFixed(2) : '0.00' }}
      </template>
      <template #cell-active="{ row }">
        <span v-if="(row as any).active" class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
          Aktív
        </span>
        <span v-else class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
          Inaktív
        </span>
      </template>
      <template #row-actions="{ row }">
        <EditButton
          @click="editProduct((row as any).id)"
        />
        <DeleteButton
          @confirm="deleteProduct((row as any).id)"
        />
      </template>
      <template #empty>
        Nincs megjeleníthető termék.
      </template>
    </DataTable>
  </AdminLayout>
</template>
