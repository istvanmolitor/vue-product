<script setup lang="ts">
import { AdminLayout, BackButton, toastService, LoadingSpinner } from '@admin'
import InputField from '@admin/components/ui/InputField.vue'
import CheckboxField from '@admin/components/ui/CheckboxField.vue'
import Card from '@admin/components/ui/Card.vue'
import CardContent from '@admin/components/ui/CardContent.vue'
import CardDescription from '@admin/components/ui/CardDescription.vue'
import CardFooter from '@admin/components/ui/CardFooter.vue'
import CardHeader from '@admin/components/ui/CardHeader.vue'
import CardTitle from '@admin/components/ui/CardTitle.vue'
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
        <CheckboxField id="enabled" label="Engedélyezett" v-model="form.enabled" :errors="errors.enabled" />

        <div class="space-y-4 border-t pt-4">
          <h3 class="text-lg font-medium">Fordítások</h3>
          <TranslationRepeater v-model="form.translations" #default="{ language, translation }" :fields="['name', 'short_name']">
                <InputField
                  :id="`translation-name-${language.id}`"
                  label="Név"
                  v-model="translation.name"
                  :errors="errors[`translations.${language.id}.name`]"
                />

                <InputField
                  :id="`translation-short-name-${language.id}`"
                  label="Rövid név"
                  v-model="translation.short_name"
                  :errors="errors[`translations.${language.id}.short_name`]"
                />
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

