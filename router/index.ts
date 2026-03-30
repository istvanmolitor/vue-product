import type { RouteRecordRaw } from 'vue-router'

const productRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/product',
    name: 'admin-products',
    component: () => import('../views/ProductIndex.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/product/create',
    name: 'admin-product-create',
    component: () => import('../views/ProductCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/product/:id/edit',
    name: 'admin-product-edit',
    component: () => import('../views/ProductEdit.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/product-unit',
    name: 'admin-product-units',
    component: () => import('../views/ProductUnitIndex.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/product-unit/create',
    name: 'admin-product-unit-create',
    component: () => import('../views/ProductUnitCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/product-unit/:id/edit',
    name: 'admin-product-unit-edit',
    component: () => import('../views/ProductUnitEdit.vue'),
    meta: { requiresAuth: true }
  },
]

export default productRoutes


