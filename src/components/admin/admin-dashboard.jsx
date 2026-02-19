'use client';

import React from 'react';
import { AdminDashboard as AdminDashboardTSX } from './admin-dashboard.tsx';

/**
 * Wrapper to ensure the .jsx version uses the latest .tsx logic.
 * This resolves naming conflicts during the Firestore migration.
 */
export function AdminDashboard(props) {
  return <AdminDashboardTSX {...props} />;
}
