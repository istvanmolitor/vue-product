import { MenuBuilder, type MenuItemConfig } from '@menu/index'
import { ShoppingBag, Package, Layers } from 'lucide-vue-next'

/**
 * Product Menu Builder
 * Builds the product management menu structure
 */
export class ProductMenuBuilder extends MenuBuilder {
  build(menu: MenuItemConfig, menuName: string): MenuItemConfig {
    if (menuName === 'admin') {
      return this.buildMainMenu(menu)
    }
    return menu
  }

  /**
   * Build main menu items
   */
  private buildMainMenu(menu: MenuItemConfig): MenuItemConfig {
    // Add product management section to the menu
    const productSection: MenuItemConfig = {
      id: 'product-management',
      title: 'Termékek',
      icon: ShoppingBag,
      order: 30,
      permission: ['product', 'product_unit'],
      children: [
        {
          id: 'products',
          title: 'Termékek',
          path: '/admin/product',
          icon: ShoppingBag,
          order: 10,
          permission: 'product'
        },
        {
          id: 'product-categories',
          title: 'Kategóriák',
          path: '/admin/product-category',
          icon: Layers,
          order: 15,
          permission: 'product'
        },
        {
          id: 'product-units',
          title: 'Mennyiségi egységek',
          path: '/admin/product-unit',
          icon: Package,
          order: 20,
          permission: 'product_unit'
        }
      ]
    }

    this.addMenuItem(menu, productSection)

    return menu
  }
}

// Export singleton instance
export const productMenuBuilder = new ProductMenuBuilder()


