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
import { FormButtons } from '@admin'
import { useRouter, useRoute } from 'vue-router'
import { reactive, ref, onMounted } from 'vue'
import { productCategoryService, type ProductCategoryFormData, type Language } from '@product/services/productCategoryService'

const router = useRouter()
const route = useRoute()
const isSaving = ref(false)
const isLoading = ref(true)
const errors = ref<Record<string, string[]>>({})
const parentCategories = ref<Record<string, string>>({})
const languages = ref<Language[]>([])
const categoryId = route.params.id as string

const form = reactive<ProductCategoryFormData>({
  parent_id: null,
  slug: '',
  translations: {}
})

const fetchEditData = async () => {
  try {
    const response = await productCategoryService.getEditData(categoryId)
    const category = response.data.data!
    parentCategories.value = response.data.parent_categories
    languages.value = response.data.languages

    form.parent_id = category.parent_id
    form.slug = category.slug

    // Fordítások betöltése
    languages.value.forEach(lang => {
      const translation = category.translations?.find(t => t.language_id === lang.id)
      form.translations![lang.id] = {
        name: translation?.name || '',
        description: translation?.description || ''
      }
    })
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
    await productCategoryService.update(categoryId, form)
    toastService.success('Termékkategória sikeresen frissítve!')
    router.push('/admin/product-category')
  } catch (error: any) {
    console.error('Hiba a termékkategória frissítésekor:', error)
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

onMounted(fetchEditData)
</script>

<template>
  <AdminLayout pageTitle="Termékkategória szerkesztése">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product-category" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      Betöltés...
    </div>

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
              <Input id="slug" v-model="form.slug" placeholder="kategoria-neve" />
              <InputError :message="errors.slug" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-for="lang in languages" :key="lang.id">
        <CardHeader>
          <CardTitle>Fordítás: {{ lang.code.toUpperCase() }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label :for="'name_' + lang.id">Név *</Label>
            <Input :id="'name_' + lang.id" v-model="form.translations![lang.id].name" />
            <InputError :message="errors['translations.' + lang.id + '.name']" />
          </div>
          <div class="space-y-2">
            <Label :for="'description_' + lang.id">Leírás</Label>
            <textarea
              :id="'description_' + lang.id"
              v-model="form.translations![lang.id].description"
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
            <InputError :message="errors['translations.' + lang.id + '.description']" />
          </div>
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
