import { createApiClient } from '@user/services/apiClient'

const api = createApiClient()

export interface ProductUnitTranslation {
  name: string
  short_name?: string | null
}

export interface ProductUnit {
  id?: number
  code: string
  name?: string
  short_name?: string | null
  enabled?: boolean
  translations?: Record<number, ProductUnitTranslation>
  created_at?: string
  updated_at?: string
}

export interface ProductUnitFormData {
  code: string
  enabled?: boolean
  translations?: Record<number, ProductUnitTranslation>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  filters?: {
    search?: string
    sort?: string
    direction?: string
  }
}

export interface SingleResponse<T> {
  data: T
}

export const productUnitService = {
  getAll(params?: { search?: string; sort?: string; direction?: string; page?: number }) {
    return api.get<PaginatedResponse<ProductUnit>>('/api/admin/product/product-units', { params })
  },
  getById(id: number | string) {
    return api.get<SingleResponse<ProductUnit>>(`/api/admin/product/product-units/${id}`)
  },
  getCreateData() {
    return api.get<{}>('/api/admin/product/product-units/create')
  },
  getEditData(id: number | string) {
    return api.get<{ data: ProductUnit }>(`/api/admin/product/product-units/${id}/edit`)
  },
  create(productUnit: ProductUnitFormData) {
    return api.post<ProductUnit>('/api/admin/product/product-units', productUnit)
  },
  update(id: number | string, productUnit: ProductUnitFormData) {
    return api.put<ProductUnit>(`/api/admin/product/product-units/${id}`, productUnit)
  },
  delete(id: number | string) {
    return api.delete(`/api/admin/product/product-units/${id}`)
  },
}
