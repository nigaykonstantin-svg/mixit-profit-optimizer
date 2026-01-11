// Org Structure Module - Public API

// Main component
export { OrgDashboard } from './components/OrgDashboard';

// Types
export * from './types';

// Hooks
export { useOrgDepartments, useOrgStats, useDepartmentById } from './hooks/useOrgDepartments';
export { useOrgGoals } from './hooks/useOrgGoals';

// Service
export * from './org-service';

// Sub-components (for customization)
export { DepartmentSidebar } from './components/DepartmentSidebar';
export { GoalsView } from './components/GoalsTab/GoalsView';
export { GoalCard } from './components/GoalsTab/GoalCard';
export { AddGoalModal } from './components/GoalsTab/AddGoalModal';
export { MatrixView } from './components/MatrixTab/MatrixView';
export { DepartmentCard } from './components/MatrixTab/DepartmentCard';
export { OrgHeader } from './components/shared/OrgHeader';
export { ConnectionsPanel } from './components/shared/ConnectionsPanel';
