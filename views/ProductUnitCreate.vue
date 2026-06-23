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
import TranslationRepeater from '@language/components/TranslationRepeater.vue'
import { FormButtons } from '@admin'
import { useRouter } from 'vue-router'
import { reactive, ref } from 'vue'
import { productUnitService, type ProductUnitFormData } from '@product/services/productUnitService'

const router = useRouter()
const isSaving = ref(false)
const errors = ref<Record<string, string[]>>({})

const form = reactive<ProductUnitFormData>({
  code: '',
  enabled: true,
  translations: {}
})

const handleSubmit = async () => {
  try {
    isSaving.value = true
    errors.value = {}
    const response: any = await productUnitService.create(form)
    toastService.success('Mennyiségi egység sikeresen létrehozva!')

    const createdUnitId = response?.data?.data?.id ?? response?.data?.id ?? response?.id

    if (createdUnitId !== undefined && createdUnitId !== null) {
      await router.push({
        name: 'admin-product-unit-edit',
        params: {
          id: String(createdUnitId),
        },
      })

      return
    }

    router.push('/admin/product-unit')
  } catch (error: any) {
    console.error('Hiba a mennyiségi egység létrehozásakor:', error)
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
</script>

<template>
  <AdminLayout pageTitle="Új mennyiségi egység">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product-unit" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Mennyiségi egység adatok</CardTitle>
        <CardDescription>Add meg az új mennyiségi egység adatait a létrehozáshoz.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <Label for="code">Kód *</Label>
          <Input id="code" v-model="form.code" placeholder="pcs" />
          <InputError :message="errors.code" />
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="enabled" v-model="form.enabled" />
          <Label for="enabled">Engedélyezett</Label>
          <InputError :message="errors.enabled" />
        </div>

        <div class="space-y-4 border-t pt-4">
          <h3 class="text-lg font-medium">Fordítások</h3>
          <TranslationRepeater
            v-model="form.translations"
            :fields="['name', 'short_name']"
          >
            <template #default="{ language, translation }">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label :for="`translation-name-${language.id}`">Név</Label>
                  <Input :id="`translation-name-${language.id}`" v-model="translation.name" />
                  <InputError :message="errors[`translations.${language.id}.name`]" />
                </div>

                <div class="space-y-2">
                  <Label :for="`translation-short-name-${language.id}`">Rövid név</Label>
                  <Input :id="`translation-short-name-${language.id}`" v-model="translation.short_name" />
                  <InputError :message="errors[`translations.${language.id}.short_name`]" />
                </div>
              </div>
            </template>
          </TranslationRepeater>
        </div>
      </CardContent>
      <CardFooter>
        <FormButtons
          :is-saving="isSaving"
          @save="handleSubmit"
          @cancel="router.push('/admin/product-unit')"
        />
      </CardFooter>
    </Card>
  </AdminLayout>
</template>

