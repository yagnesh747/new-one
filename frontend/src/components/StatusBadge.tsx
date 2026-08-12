import React from 'react';

type StatusType =
  | 'Active' | 'Inactive' | 'Lead'
  | 'Draft' | 'Confirmed' | 'Cancelled'
  | 'IN' | 'OUT'
  | 'low-stock'
  | 'Retail' | 'Wholesale' | 'Distributor';

interface StatusBadgeProps {
  status: StatusType | string;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  Active: 'badge-active',
  Inactive: 'badge-inactive',
  Lead: 'badge-lead',
  Draft: 'badge-draft',
  Confirmed: 'badge-confirmed',
  Cancelled: 'badge-cancelled',
  IN: 'badge-in',
  OUT: 'badge-out',
  'low-stock': 'badge-low-stock',
  Retail: 'badge-lead',
  Wholesale: 'badge-confirmed',
  Distributor: 'badge-inactive',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cls = STATUS_CLASS_MAP[status] || 'badge-inactive';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default StatusBadge;
