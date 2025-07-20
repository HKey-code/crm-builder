# UI Engine Library

A configurable, composable frontend architecture for CRM systems with tenant isolation and RBAC support.

## 🏗️ Architecture Overview

The UI Engine provides a flexible system for building dynamic, configurable CRM interfaces with the following core concepts:

### Core Models

1. **Page** - Represents a screen in the CRM (e.g., Contact Details, Dashboard)
2. **Layout** - Defines the grid system or layout template
3. **Section** - A logical group of components (e.g., Header, Summary, Activity Feed)
4. **ComponentType** - Master definition of a component (e.g., TextBlock, Table, Chart)
5. **ComponentInstance** - A configured instance of a ComponentType on a page
6. **FieldDefinition** - Represents a user-defined field for dynamic forms
7. **DataSource** - Defines where and how data is pulled (REST API, GraphQL, Prisma)
8. **BindingConfig** - Links data from a DataSource to component props
9. **Interaction** - Defines user interaction logic (onClick, onSubmit)

## 📁 Folder Structure

```
libs/ui-engine/
│
├── models/                    # TypeScript interfaces
│   ├── page.model.ts
│   ├── layout.model.ts
│   ├── section.model.ts
│   ├── component-type.model.ts
│   ├── component-instance.model.ts
│   ├── data-source.model.ts
│   ├── field-definition.model.ts
│   ├── binding-config.model.ts
│   └── interaction.model.ts
│
├── services/                  # Business logic
│   └── ui-config.service.ts
│
├── graphql/                   # GraphQL types and resolvers
│   ├── types/
│   └── resolvers/
│
├── utils/                     # Utility functions
│   └── binding.utils.ts
│
└── index.ts                   # Main exports
```

## 🔧 Key Features

### Tenant Isolation
- All models include `tenantId` for multi-tenant support
- Automatic filtering by tenant in all queries
- Tenant-specific component types and layouts

### RBAC Integration
- Leverages existing Role and User models
- Component visibility based on user roles
- Conditional rendering support

### Data Binding
- Flexible data binding between data sources and components
- Support for data transformations (format, map, filter, aggregate)
- Fallback values for missing data

### Component System
- Reusable component types with JSON schemas
- Instance-specific configurations
- Dynamic prop binding

## 🚀 Usage Examples

### Creating a Page
```typescript
import { UiConfigService } from '@libs/ui-engine';

const page = await uiConfigService.createPage({
  name: 'Contact Details',
  slug: 'contact-details',
  layoutId: 'sidebar-layout',
  dataSourceId: 'contact-api',
  tenantId: 'tenant-123'
});
```

### Data Binding
```typescript
import { BindingUtils } from '@libs/ui-engine';

const result = BindingUtils.applyBinding(
  { user: { name: 'John Doe', email: 'john@example.com' } },
  {
    sourceField: 'user.name',
    targetProp: 'title',
    transform: { type: 'format', format: 'uppercase' }
  }
);
// Result: { value: 'JOHN DOE', success: true }
```

## 🔗 Database Schema

The UI Engine models are integrated into the main Prisma schema with proper relationships:

- **Tenant** → **Page** (one-to-many)
- **Page** → **Section** (one-to-many)
- **Section** → **ComponentInstance** (one-to-many)
- **ComponentType** → **ComponentInstance** (one-to-many)
- **DataSource** → **Page** (one-to-many)

## 🛡️ Security

- Tenant isolation at the database level
- Role-based access control integration
- Input validation for all models
- SQL injection protection via Prisma

## 📈 Performance

- Efficient queries with proper includes
- Lazy loading of component instances
- Caching support for frequently accessed configurations
- Optimized data binding with transformation caching

## 🔄 Migration Strategy

The UI Engine supports schema evolution:

1. **Backward Compatible**: New fields are optional
2. **Versioning**: Component types can be versioned
3. **Migration Scripts**: Automated migration for schema changes
4. **Rollback Support**: Ability to revert to previous versions

## 🧪 Testing

- Unit tests for binding utilities
- Integration tests for service layer
- E2E tests for complete page rendering
- Performance benchmarks for data binding

## 📚 API Documentation

See the individual model files for detailed TypeScript interfaces and the service layer for business logic implementation. 