import React from 'react';
import { Badge } from '../ui/badge';
import { GeneralStatus, ProjectHealth, ProjectStatus, UserStatus } from '../../types';

interface StatusBadgeProps {
  status?: string | null;
  type?: 'user' | 'project' | 'health' | 'general';
}

export function StatusBadge({ status, type = 'general' }: StatusBadgeProps) {
  if (!status) return null;

  if (type === 'user') {
    const userStatus = status as UserStatus;
    switch (userStatus) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>;
    }
  }

  if (type === 'health') {
    const health = status as ProjectHealth;
    switch (health) {
      case 'HEALTHY':
        return <Badge variant="success">● Healthy</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning">● At Risk</Badge>;
      case 'CRITICAL':
        return <Badge variant="destructive">● Critical</Badge>;
    }
  }

  if (type === 'project') {
    const pStatus = status as ProjectStatus;
    switch (pStatus) {
      case 'PLANNING':
        return <Badge variant="default">Planning</Badge>;
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'ON_HOLD':
        return <Badge variant="warning">On Hold</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>;
    }
  }

  const genStatus = status as GeneralStatus;
  switch (genStatus) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'INACTIVE':
      return <Badge variant="secondary">Inactive</Badge>;
    case 'ARCHIVED':
      return <Badge variant="outline">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
