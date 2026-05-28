<script setup lang="ts">
import { AdminLayout, BackButton, toastService, InputError, LoadingSpinner } from '@admin'
import Label from '@admin/components/ui/Label.vue'
import Input from '@admin/components/ui/Input.vue'
import Card from '@admin/components/ui/Card.vue'
import CardContent from '@admin/components/ui/CardContent.vue'
import CardDescription from '@admin/components/ui/CardDescription.vue'
import CardHeader from '@admin/components/ui/CardHeader.vue'
import CardTitle from '@admin/components/ui/CardTitle.vue'
import Textarea from '@admin/components/ui/Textarea.vue'
import TranslationRepeater from '@language/components/TranslationRepeater.vue'
import { FormButtons } from '@admin'
import { useRouter } from 'vue-router'
import { reactive, ref, onMounted } from 'vue'
import { productCategoryService, type ProductCategoryFormData } from '@product/services/productCategoryService'

const router = useRouter()
const isSaving = ref(false)
const isLoading = ref(true)
const errors = ref<Record<string, string[]>>({})
const parentCategories = ref<Record<string, string>>({})

const form = reactive<ProductCategoryFormData>({
  parent_id: null,
  slug: '',
  translations: {}
})

const fetchCreateData = async () => {
  try {
    const response = await productCategoryService.getCreateData()
    parentCategories.value = response.data.parent_categories
  } catch (error) {
    console.error('Hiba az adatok betöltésekor:', error)
    toastService.error('Hiba történt az adatok betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSaving.value = true
    errors.value = {}
    const response: any = await productCategoryService.create(form)
    toastService.success('Termékkategória sikeresen létrehozva!')

    const createdCategoryId = response?.data?.data?.id ?? response?.data?.id ?? response?.id

    if (createdCategoryId !== undefined && createdCategoryId !== null) {
      await router.push({
        name: 'admin-product-category-edit',
        params: {
          id: String(createdCategoryId),
        },
      })

      return
    }

    router.push('/admin/product-category')
  } catch (error: any) {
    console.error('Hiba a termékkategória létrehozásakor:', error)
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

onMounted(fetchCreateData)
</script>

<template>
  <AdminLayout pageTitle="Új termékkategória">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product-category" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-8"><LoadingSpinner label="Betöltés..." /></div>

    <div v-else class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alapadatok</CardTitle>
          <CardDescription>A kategória általános beállításai.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="parent_id">Szülő kategória</Label>
              <select
                id="parent_id"
                v-model="form.parent_id"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option :value="null">Nincs (Főkategória)</option>
                <option v-for="(name, id) in parentCategories" :key="id" :value="id">
                  {{ name }}
                </option>
              </select>
              <InputError :message="errors.parent_id" />
            </div>
            <div class="space-y-2">
              <Label for="slug">Slug (opcionális)</Label>
              <Input
                id="slug"
                :model-value="form.slug ?? ''"
                placeholder="kategoria-neve"
                @update:model-value="(value) => form.slug = String(value).trim().length > 0 ? String(value) : null"
              />
              <InputError :message="errors.slug" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fordítások</CardTitle>
        </CardHeader>
        <CardContent>
          <TranslationRepeater v-model="form.translations" :fields="['name', 'description']">
            <template #default="{ language, translation }">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label :for="`translation-name-${language.id}`">Név *</Label>
                  <Input :id="`translation-name-${language.id}`" v-model="translation.name" />
                  <InputError :message="errors[`translations.${language.id}.name`]" />
                </div>

                <div class="space-y-2">
                  <Label :for="`translation-description-${language.id}`">Leírás</Label>
                  <Textarea :id="`translation-description-${language.id}`" v-model="translation.description" rows="4" />
                  <InputError :message="errors[`translations.${language.id}.description`]" />
                </div>
              </div>
            </template>
          </TranslationRepeater>
        </CardContent>
      </Card>

      <div class="flex justify-end">
        <FormButtons
          :is-saving="isSaving"
          @save="handleSubmit"
          @cancel="router.push('/admin/product-category')"
        />
      </div>
    </div>
  </AdminLayout>
</template>
