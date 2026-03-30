# Vue Product Package

This package provides a complete CRUD interface for managing products in the Molitor application.

## Features

- Product listing with pagination, search, and sorting
- Create new products
- Edit existing products
- Delete products
- Integration with product units

## Components

### Views

- **ProductIndex.vue** - Main product listing page with data table
- **ProductCreate.vue** - Form for creating new products
- **ProductEdit.vue** - Form for editing existing products

### Services

- **productService.ts** - API client for product operations

### Router

Product routes are automatically registered:
- `/admin/product` - Product listing
- `/admin/product/create` - Create product
- `/admin/product/:id/edit` - Edit product

### Menu

The product menu item is registered in the admin menu automatically.

## Usage

The package is automatically registered and available when the application starts.

## API Endpoints

The package communicates with the following API endpoints:

- `GET /api/admin/product/products` - List products
- `GET /api/admin/product/products/create` - Get form data for creating
- `POST /api/admin/product/products` - Create product
- `GET /api/admin/product/products/:id` - Get product details
- `GET /api/admin/product/products/:id/edit` - Get form data for editing
- `PUT /api/admin/product/products/:id` - Update product
- `DELETE /api/admin/product/products/:id` - Delete product

