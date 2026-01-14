// View Routing System - Phase 2/3 of the refactoring
// Centralizes view management and provides lazy loading

export { ViewRouter, type ViewRouterProps } from './ViewRouter';
export { 
  viewRegistry, 
  getViewConfig, 
  getViewsByGroup, 
  getAllViews, 
  getDefaultView,
  type ViewConfig,
  type BaseViewProps 
} from './viewRegistry';
