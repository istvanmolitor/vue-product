<script setup lang="ts">
import { AdminLayout, BackButton, toastService, InputError } from '@admin'
import Label from '@admin/components/ui/Label.vue'
import Input from '@admin/components/ui/Input.vue'
import Card from '@admin/components/ui/Card.vue'
import CardContent from '@admin/components/ui/CardContent.vue'
import CardDescription from '@admin/components/ui/CardDescription.vue'
import CardFooter from '@admin/components/ui/CardFooter.vue'
import CardHeader from '@admin/components/ui/CardHeader.vue'
import CardTitle from '@admin/components/ui/CardTitle.vue'
import Checkbox from '@admin/components/ui/Checkbox.vue'
import { FormButtons } from '@admin'
import { useRouter } from 'vue-router'
import { reactive, ref, onMounted } from 'vue'
import { productService, type ProductUnit, type ProductFormData } from '@product/services/productService'

const router = useRouter()
const isSaving = ref(false)
const isLoading = ref(true)
const availableUnits = ref<ProductUnit[]>([])
const errors = ref<Record<string, string[]>>({})

const form = reactive<ProductFormData>({
  sku: '',
  slug: null,
  price: 0,
  active: false,
  product_unit_id: null,
  translations: {}
})

const fetchUnits = async () => {
  try {
    isLoading.value = true
    const { data } = await productService.getCreateData()
    availableUnits.value = data.product_units
  } catch (error) {
    console.error('Hiba a mértékegységek betöltésekor:', error)
    toastService.error('Hiba történt a mértékegységek betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSaving.value = true
    errors.value = {}
    await productService.create(form)
    toastService.success('Termék sikeresen létrehozva!')
    router.push('/admin/product')
  } catch (error: any) {
    console.error('Hiba a termék létrehozásakor:', error)
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors
      toastService.error('Kérjük, javítsd a hibaüzeneteket.')
    } else {
      toastService.error('Hiba történt a mentés során.')
    }
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <AdminLayout pageTitle="Új termék">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      Betöltés...
    </div>

    <Card v-else>
      <CardHeader>
        <CardTitle>Termék adatok</CardTitle>
        <CardDescription>Add meg az új termék adatait a létrehozáshoz.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="sku">SKU *</Label>
          <Input id="sku" v-model="form.sku" placeholder="PROD-001" />
          <InputError :message="errors.sku" />
        </div>
        <div class="space-y-2">
          <Label for="slug">Slug</Label>
          <Input id="slug" v-model="form.slug" placeholder="termek-001" />
          <InputError :message="errors.slug" />
        </div>
        <div class="space-y-2">
          <Label for="price">Ár</Label>
          <Input id="price" v-model.number="form.price" type="number" step="0.01" placeholder="0.00" />
          <InputError :message="errors.price" />
        </div>
        <div class="space-y-2">
          <Label for="product_unit_id">Mértékegység</Label>
          <select
            id="product_unit_id"
            v-model="form.product_unit_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option :value="null">Nincs kiválasztva</option>
            <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">
              {{ unit.name }}
            </option>
          </select>
          <InputError :message="errors.product_unit_id" />
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="active" v-model:checked="form.active" />
          <Label for="active">Aktív</Label>
          <InputError :message="errors.active" />
        </div>
      </CardContent>
      <CardFooter>
        <FormButtons
          :is-saving="isSaving"
          @save="handleSubmit"
          @cancel="router.push('/admin/product')"
        />
      </CardFooter>
    </Card>
  </AdminLayout>
</template>

