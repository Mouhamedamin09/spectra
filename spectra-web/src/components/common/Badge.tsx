import React from 'react';
import '../../styles/Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  );
};
