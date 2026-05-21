import { createApiClient } from '@user/services/apiClient'

const api = createApiClient()

export interface ProductUnit {
  id: number
  name: string
}

export interface ProductTranslation {
  id: number
  language_id: number
  name: string
  description?: string | null
}

export interface ProductImage {
  id?: number
  image_url: string | null
  is_main?: boolean
  sort?: number
}

export interface Product {
  id?: number
  sku: string
  slug?: string | null
  name?: string
  description?: string | null
  price?: number
  active?: boolean
  product_unit_id?: number | null
  product_unit?: ProductUnit
  product_images?: ProductImage[]
  translations?: ProductTranslation[]
  created_at?: string
  updated_at?: string
}

export interface ProductFormData {
  sku: string
  slug?: string | null
  price?: number
  active?: boolean
  product_unit_id?: number | null
  product_images?: ProductImage[]
  translations?: Record<number, { name: string; description?: string | null }>
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

export const productService = {
  getAll(params?: { search?: string; sort?: string; direction?: string; page?: number }) {
    return api.get<PaginatedResponse<Product>>('/api/admin/product/products', { params })
  },
  searchForSelect(params?: { search?: string; page?: number; per_page?: number }) {
    return api.get<PaginatedResponse<Product>>('/api/admin/product/products/select', { params })
  },
  getById(id: number | string) {
    return api.get<SingleResponse<Product>>(`/api/admin/product/products/${id}`)
  },
  getCreateData() {
    return api.get<{ product_units: ProductUnit[] }>('/api/admin/product/products/create')
  },
  getEditData(id: number | string) {
    return api.get<{ data: Product; product_units: ProductUnit[] }>(`/api/admin/product/products/${id}/edit`)
  },
  create(product: ProductFormData) {
    return api.post<Product>('/api/admin/product/products', product)
  },
  update(id: number | string, product: ProductFormData) {
    return api.put<Product>(`/api/admin/product/products/${id}`, product)
  },
  delete(id: number | string) {
    return api.delete(`/api/admin/product/products/${id}`)
  },
}
