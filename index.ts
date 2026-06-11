// Services
export { productService } from './services/productService'
export { productUnitService } from './services/productUnitService'

// Types
export type { Product, ProductUnit as ProductUnitSimple, ProductTranslation, ProductFormData } from './services/productService'
export type { ProductUnit, ProductUnitTranslation, ProductUnitFormData } from './services/productUnitService'

// Router
export { default as router } from './router/index'

// Menu configuration
export { ProductMenuBuilder, productMenuBuilder } from './config/menuBuilder'

// Components
export { default as ProductSelect } from './components/ProductSelect.vue'
export { default as ProductCategorySelect } from './components/ProductCategorySelect.vue'
