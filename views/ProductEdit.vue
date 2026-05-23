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
import Tabs from '@admin/components/ui/Tabs.vue'
import Button from '@admin/components/ui/button/Button.vue'
import Icon from '@admin/components/ui/Icon.vue'
import { FormButtons } from '@admin'
import { useRouter, useRoute } from 'vue-router'
import { reactive, ref, onMounted } from 'vue'
import { productService, type ProductUnit, type ProductFormData } from '@product/services/productService'
import MediaFilePicker from '@media/components/MediaFilePicker.vue'
import Textarea from '@admin/components/ui/Textarea.vue'
import TranslationRepeater from '@language/components/TranslationRepeater.vue'
import { languageService, type Language } from '@language/services/languageService'

const router = useRouter()
const route = useRoute()
const isSaving = ref(false)
const isLoading = ref(true)
const availableUnits = ref<ProductUnit[]>([])
const availableLanguages = ref<Language[]>([])
const selectedLanguages = ref<Language[]>([])
const errors = ref<Record<string, string[]>>({})
const activeTab = ref('details')
const productEditTabs = [
  {
    key: 'details',
    label: 'Termék adatai',
  },
  {
    key: 'images',
    label: 'Termék képei',
  },
]

const form = reactive<ProductFormData>({
  sku: '',
  slug: null,
  price: 0,
  active: false,
  product_unit_id: null,
  product_images: [],
  translations: {}
})

const normalizeProductImages = () => {
  const productImages = form.product_images ?? []

  if (productImages.length === 0) {
    form.product_images = []
    return
  }

  const mainImageIndex = productImages.findIndex((productImage) => productImage.is_main)

  form.product_images = productImages.map((productImage, index) => ({
    ...productImage,
    is_main: mainImageIndex === -1 ? index === 0 : index === mainImageIndex,
    sort: index
  }))
}

const buildProductImagesPayload = () => {
  const images = (form.product_images ?? [])
    .map((productImage) => ({
      image_url: (productImage.image_url ?? '').trim(),
      is_main: productImage.is_main === true
    }))
    .filter((productImage) => productImage.image_url.length > 0)

  const mainImageIndex = images.findIndex((productImage) => productImage.is_main)

  return images.map((productImage, index) => ({
    image_url: productImage.image_url,
    is_main: mainImageIndex === -1 ? index === 0 : index === mainImageIndex,
    sort: index
  }))
}

const addProductImage = (file: any) => {
  const imageUrl = file.download_url || file.url || file.path

  if (!imageUrl) {
    return
  }

  form.product_images = [
    ...(form.product_images ?? []),
    {
      image_url: imageUrl,
      is_main: false,
      sort: (form.product_images ?? []).length
    }
  ]

  normalizeProductImages()
}

const removeProductImage = (index: number) => {
  if (!form.product_images) {
    return
  }

  form.product_images.splice(index, 1)
  normalizeProductImages()
}

const setMainProductImage = (index: number) => {
  if (!form.product_images) {
    return
  }

  form.product_images = form.product_images.map((productImage, imageIndex) => ({
    ...productImage,
    is_main: imageIndex === index,
    sort: imageIndex
  }))
}

const fetchProduct = async () => {
  try {
    isLoading.value = true
    const productId = route.params.id as string
    const [productResponse, languagesResponse] = await Promise.all([
      productService.getEditData(productId),
      languageService.getCreateData(),
    ])

    const { data } = productResponse

    form.sku = data.data.sku
    form.slug = data.data.slug
    form.price = data.data.price || 0
    form.active = data.data.active || false
    form.product_unit_id = data.data.product_unit_id
    form.product_images = (data.data.product_images ?? []).map((productImage, index) => ({
      image_url: productImage.image_url ?? '',
      is_main: productImage.is_main ?? false,
      sort: productImage.sort ?? index
    }))
    normalizeProductImages()

    availableLanguages.value = languagesResponse.data.availableLanguages
    selectedLanguages.value = []
    form.translations = {}

    Object.entries(data.data.translations ?? {}).forEach(([languageIdKey, translation]) => {
      const languageId = Number(languageIdKey)
      const language = availableLanguages.value.find((availableLanguage) => availableLanguage.id === languageId)

      if (!language) {
        return
      }

      selectedLanguages.value.push(language)
      form.translations![languageId] = {
        name: translation.name ?? '',
        description: translation.description ?? '',
      }
    })

    availableUnits.value = data.product_units
  } catch (error) {
    console.error('Hiba a termék betöltésekor:', error)
    toastService.error('Hiba történt a termék betöltésekor.')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSaving.value = true
    errors.value = {}
    const productId = route.params.id as string
    await productService.update(productId, {
      ...form,
      product_images: buildProductImagesPayload()
    })
    toastService.success('Termék sikeresen frissítve!')
    router.push('/admin/product')
  } catch (error: any) {
    console.error('Hiba a termék frissítésekor:', error)
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

const handleAddLanguage = (id: number) => {
  const language = availableLanguages.value.find((availableLanguage) => availableLanguage.id === id)

  if (!language || selectedLanguages.value.some((selectedLanguage) => selectedLanguage.id === id)) {
    return
  }

  selectedLanguages.value.push(language)
  form.translations![id] = { name: '', description: '' }
}

const handleRemoveLanguage = (id: number) => {
  selectedLanguages.value = selectedLanguages.value.filter((language) => language.id !== id)

  if (form.translations) {
    delete form.translations[id]
  }
}

const getTranslation = (id: number) => {
  if (!form.translations) {
    form.translations = {}
  }

  if (!form.translations[id]) {
    form.translations[id] = { name: '', description: '' }
  }

  return form.translations[id]
}

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <AdminLayout pageTitle="Termék szerkesztése">
    <div class="flex items-center justify-between space-y-2 mb-4">
      <BackButton to="/admin/product" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      Betöltés...
    </div>

    <Card v-else>
      <CardHeader>
        <CardTitle>Termék szerkesztése</CardTitle>
        <CardDescription>Frissítsd a termék adatait.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="activeTab" :items="productEditTabs">
          <template #default="{ activeKey }">
            <div v-if="activeKey === 'details'" class="space-y-4">
              <div class="space-y-2">
                <Label for="sku">SKU *</Label>
                <Input id="sku" v-model="form.sku" placeholder="PROD-001" />
                <InputError :message="errors.sku" />
              </div>
              <div class="space-y-2">
                <Label for="slug">Slug</Label>
                <Input
                  id="slug"
                  :model-value="form.slug ?? ''"
                  placeholder="termek-001"
                  @update:model-value="(value) => form.slug = String(value).trim().length > 0 ? String(value) : null"
                />
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

              <div class="space-y-4 border-t pt-4">
                <h3 class="text-lg font-medium">Fordítások</h3>
                <TranslationRepeater
                  :languages="selectedLanguages"
                  :available-languages="availableLanguages"
                  @add="handleAddLanguage"
                  @remove="handleRemoveLanguage"
                >
                  <template #default="{ language }">
                    <div v-if="language.id" class="space-y-4">
                      <div class="space-y-2">
                        <Label :for="`translation-name-${language.id}`">Név</Label>
                        <Input :id="`translation-name-${language.id}`" v-model="getTranslation(language.id).name" />
                        <InputError :message="errors[`translations.${language.id}.name`]" />
                      </div>

                      <div class="space-y-2">
                        <Label :for="`translation-description-${language.id}`">Leírás</Label>
                        <Textarea
                          :id="`translation-description-${language.id}`"
                          :model-value="getTranslation(language.id).description ?? ''"
                          @update:model-value="(value) => getTranslation(language.id!).description = String(value)"
                          rows="4"
                        />
                        <InputError :message="errors[`translations.${language.id}.description`]" />
                      </div>
                    </div>
                  </template>
                </TranslationRepeater>
              </div>
            </div>

            <div v-else-if="activeKey === 'images'" class="space-y-3">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">Termék képek</Label>
                <MediaFilePicker
                  :show-preview="false"
                  :accept-types="['image/*']"
                  @select="addProductImage"
                >
                  <template #default>
                    <Button type="button" variant="outline" size="sm">
                      <Icon name="plus" :size="16" class="mr-2" />
                      Kép hozzáadása
                    </Button>
                  </template>
                </MediaFilePicker>
              </div>

              <InputError :message="errors.product_images" />

              <div v-if="(form.product_images?.length ?? 0) === 0" class="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                Még nincs termékkép.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(productImage, index) in form.product_images"
                  :key="`${index}-${productImage.image_url}`"
                  class="rounded-md border p-3"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start">
                    <div class="h-20 w-20 overflow-hidden rounded border bg-muted">
                      <img :src="productImage.image_url ?? ''" alt="" class="h-full w-full object-cover" />
                    </div>

                    <div class="flex-1 space-y-2">
                      <MediaFilePicker
                        :model-value="productImage.image_url ?? ''"
                        :accept-types="['image/*']"
                        @update:model-value="(value) => productImage.image_url = value"
                      />
                      <InputError :message="errors[`product_images.${index}.image_url`]" />
                    </div>

                    <div class="flex items-center gap-3">
                      <label class="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          :checked="productImage.is_main === true"
                          @change="setMainProductImage(index)"
                        />
                        Főkép
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="text-destructive hover:text-destructive"
                        @click="removeProductImage(index)"
                      >
                        <Icon name="delete" :size="16" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Tabs>
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
