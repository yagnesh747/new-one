import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'customerStatus' | 'customerType' | 'challanStatus' | 'movementType' | 'stock';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'customerStatus' }) => {
  let badgeClass = 'badge';

  const s = status.toLowerCase();

  if (s === 'active' || s === 'confirmed' || s === 'in') {
    badgeClass += ' badge-active';
  } else if (s === 'lead' || s === 'draft') {
    badgeClass += ' badge-lead';
  } else if (s === 'inactive' || s === 'cancelled' || s === 'out') {
    badgeClass += ' badge-inactive';
  } else if (s === 'low stock') {
    badgeClass += ' badge-low-stock';
  } else {
    badgeClass += ' badge-lead';
  }

  return <span className={badgeClass}>{status}</span>;
};
