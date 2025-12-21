// Modules barrel export
export * from './auth';
export * from './tasks';
export * from './users';
export * from './shared';

// Categories module - explicit exports to avoid naming conflicts
export {
    // Types (using aliases to avoid conflicts)
    type Category as ProductCategory,
    type Subcategory,
    type PlanValue,
    type Product,
    type TopProduct,
    STOCK_STATUS_LABELS,
    calculateDeviation,
    // API
    getCategories,
    getSubcategories,
    updatePlan,
    updateFact,
    getTopProducts,
    getPlanFactHistory,
    // UI components
    CategoryDashboard,
    SubcategoryDashboard,
    TopProductsTable,
    PlanFactChart,
} from './categories';
