# Service Pages Management in HandyWriterz Admin Dashboard

## Overview

The Service Pages Management feature allows administrators to create, edit, publish, and delete service pages directly from the admin dashboard. Service pages are static pages that represent core services offered by HandyWriterz, accessible to users through the main website.

## Architecture

The service pages management system follows a modular architecture with the following components:

### Components

1. **ServicePagesManager** - Main component for listing and managing service pages
   - Displays all service pages with filtering and search
   - Provides actions for creating, editing, and deleting pages
   - Real-time updates through Supabase subscriptions

2. **ServicePageEditor** - Rich editor for creating and modifying service pages
   - Title, slug, and meta description fields for SEO
   - Rich text editor for content creation
   - Featured image upload capability
   - Publishing controls

### Database Structure

Service pages are stored in the Supabase `service_pages` table with the following structure:

| Column          | Type      | Description                             |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Primary key                              |
| title           | text      | Page title                               |
| slug            | text      | URL-friendly identifier (must be unique) |
| content         | text      | HTML content of the page                 |
| meta_description | text     | SEO meta description                     |
| featured_image  | text      | URL to featured image                    |
| created_at      | timestamp | Creation timestamp                       |
| updated_at      | timestamp | Last update timestamp                    |
| published       | boolean   | Publication status                       |

### Services

The `DatabaseService` class has been enhanced to include the following methods for service page operations:

- `fetchServicePages(options?)` - Retrieves service pages with optional filtering
- `fetchServicePage(id)` - Retrieves a single service page by ID
- `createServicePage(data)` - Creates a new service page
- `updateServicePage(id, data)` - Updates an existing service page
- `deleteServicePage(id)` - Deletes a service page
- `uploadImage(file, path)` - Uploads an image to Supabase storage and returns the URL

## Routing

Service pages management is integrated into the admin dashboard with the following routes:

- `/admin/service-pages` - Service pages listing and management
- `/admin/service-pages/new` - Create a new service page
- `/admin/service-pages/edit/:id` - Edit an existing service page

## Security

Access to service pages management features is restricted to users with the admin role, verified through the `isAdmin` check in the `AuthContext`. All database operations use RLS (Row Level Security) policies in Supabase to ensure that only authenticated admin users can perform CRUD operations on service pages.

## Performance Optimizations

1. **Caching**: Service pages data is cached to reduce redundant API calls
2. **Pagination**: Service pages are fetched with pagination to improve performance with a large number of pages
3. **Optimistic Updates**: UI reflects changes immediately before server confirmation for a responsive experience
4. **Debounced Search**: Search functionality is debounced to prevent excessive API calls during typing

## Testing

Comprehensive testing has been implemented:

1. **Unit Tests**: Individual components are tested in isolation
   - `ServicePagesManager.test.tsx` - Tests for the manager component
   - `ServicePageEditor.test.tsx` - Tests for the editor component

2. **Integration Tests**: Tests for component interactions and API integration

## Future Enhancements

Potential future enhancements for the service pages management:

1. **Version History**: Track changes and enable rollbacks to previous versions
2. **Scheduling**: Schedule publication and unpublication of service pages
3. **Templates**: Pre-defined templates for faster service page creation
4. **Analytics Integration**: Direct view of page analytics in the admin dashboard

## Usage Guide

### Creating a Service Page

1. Navigate to the admin dashboard
2. Click on "Service Pages" in the sidebar
3. Click "Create New Service Page"
4. Fill in the required fields (Title, Content)
5. Add optional fields (Meta Description, Featured Image)
6. Toggle "Published" to make the page live
7. Click "Save" to create the page

### Editing a Service Page

1. Navigate to the admin dashboard
2. Click on "Service Pages" in the sidebar
3. Find the page you want to edit and click "Edit"
4. Make your changes
5. Click "Save" to update the page

### Deleting a Service Page

1. Navigate to the admin dashboard
2. Click on "Service Pages" in the sidebar
3. Find the page you want to delete and click "Delete"
4. Confirm the deletion in the confirmation dialog
