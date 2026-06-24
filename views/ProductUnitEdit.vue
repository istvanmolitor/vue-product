<script setup lang="ts">
import { AdminLayout, BackButton, toastService, InputError, LoadingSpinner } from '@admin'
import InputField from '@admin/components/ui/InputField.vue'
import Label from '@admin/components/ui/Label.vue'
import Input from '@admin/components/ui/Input.vue'
import Card from '@admin/components/ui/Card.vue'
import CardContent from '@admin/components/ui/CardContent.vue'
import CardDescription from '@admin/components/ui/CardDescription.vue'
import CardFooter from '@admin/components/ui/CardFooter.vue'
import CardHeader from '@admin/components/ui/CardHeader.vue'
import CardTitle from '@admin/components/ui/CardTitle.vue'
import Checkbox from '@admin/components/ui/Checkbox.vue'
import { normalizeTranslations } from '@language'
import TranslationRepeater from '@language/components/TranslationRepeater.vue'
import { FormButtons } from '@admin'
import { useRouter, useRoute } from 'vue-router'
import { reactive, ref, onMounted } from 'vue'
import { productUnitService, type ProductUnitFormData } from '@product/services/productUnitService'

const router = useRouter()
const route = useRoute()
const isSaving = ref(false)
const isLoading = ref(true)
const errors = ref<Record<string, string[]>>({})

const form = reactive<ProductUnitFormData>({
  code: '',
  enabled: true,
  translations: {}
})

const fetchProductUnit = async () => {
  try {
    isLoading.value = true
    const productUnitId = route.params.id as string
    const productUnitResponse = await productUnitService.getEditData(productUnitId)

    const productUnit = productUnitResponse.data.data
    form.code = productUnit.code
    form.enabled = productUnit.enabled || false
    form.translations = normalizeTranslations(productUnit.translations, ['name', 'short_name'])
  } catch (error) {
    console.error('Hiba a mennyiségi egység betöltésekor:', error)
    toastService.error('Hiba történt a mennyiségi egység betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSaving.value = true
    errors.value = {}
    const productUnitId = route.params.id as string
    await productUnitService.update(productUnitId, form)
    toastService.success('Mennyiségi egység sikeresen frissítve!')
    router.push('/admin/product-unit')
  } catch (error: any) {
    console.error('Hiba a mennyiségi egység frissítésekor:', error)
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
  fetchProductUnit()
})
</script>

<template>
  <AdminLayout pageTitle="Mennyiségi egység szerkesztése">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product-unit" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-8"><LoadingSpinner label="Betöltés..." /></div>

    <Card v-else>
      <CardHeader>
        <CardTitle>Mennyiségi egység adatok</CardTitle>
        <CardDescription>Frissítsd a mennyiségi egység adatait.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <InputField id="code" label="Kód" v-model="form.code" placeholder="pcs" :required="true" :errors="errors.code" />
        <div class="flex items-center space-x-2">
          <Checkbox id="enabled" v-model="form.enabled" />
          <Label for="enabled">Engedélyezett</Label>
          <InputError :message="errors.enabled" />
        </div>

        <div class="space-y-4 border-t pt-4">
          <h3 class="text-lg font-medium">Fordítások</h3>
          <TranslationRepeater v-model="form.translations" :fields="['name', 'short_name']">
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

