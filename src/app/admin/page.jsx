'use client';

import React from 'react';
import AdminPageTSX from './page.tsx';

/**
 * Wrapper to ensure the .jsx version uses the latest .tsx logic.
 * This resolves naming conflicts during the Firestore migration.
 */
export default function AdminPage() {
  return <AdminPageTSX />;
}
