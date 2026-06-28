import { createApiClient } from '@user/services/apiClient'

const api = createApiClient()

export interface ProductCategoryTranslation {
  name: string
  description?: string | null
}

export interface ProductCategory {
  id?: number
  parent_id?: number | null
  slug: string
  name?: string
  description?: string | null
  image?: string | null
  image_url?: string | null
  translations?: Record<number, ProductCategoryTranslation>
  created_at?: string
  updated_at?: string
}

export interface ProductCategoryFormData {
  parent_id?: number | null
  slug?: string | null
  translations?: Record<number, ProductCategoryTranslation>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  columns?: Array<{ key: string; label: string; sortable: boolean }>
}

export interface SingleResponse<T> {
  data: T
}

export interface Language {
  id: number
  code: string
  name?: string
}

export interface CreateEditDataResponse {
  data?: ProductCategory
  parent_categories: Record<string, string>
  languages: Language[]
}

export const productCategoryService = {
  getAll(params?: { search?: string; sort?: string; direction?: string; page?: number }) {
    return api.get<PaginatedResponse<ProductCategory>>('/api/admin/product/product-categories', { params })
  },
  getById(id: number | string) {
    return api.get<SingleResponse<ProductCategory>>(`/api/admin/product/product-categories/${id}`)
  },
  getCreateData() {
    return api.get<CreateEditDataResponse>('/api/admin/product/product-categories/create')
  },
  getEditData(id: number | string) {
    return api.get<CreateEditDataResponse>(`/api/admin/product/product-categories/${id}/edit`)
  },
  create(category: ProductCategoryFormData) {
    return api.post<ProductCategory>('/api/admin/product/product-categories', category)
  },
  update(id: number | string, category: ProductCategoryFormData) {
    return api.put<ProductCategory>(`/api/admin/product/product-categories/${id}`, category)
  },
  delete(id: number | string) {
    return api.delete(`/api/admin/product/product-categories/${id}`)
  },
}
