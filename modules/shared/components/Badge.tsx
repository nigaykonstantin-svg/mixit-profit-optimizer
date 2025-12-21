'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    icon?: ReactNode;
}

const variantStyles = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-purple-100 text-purple-700',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'default', size = 'md', icon, className = '', children, ...props }, ref) => {
        const baseStyles = 'rounded-full font-medium inline-flex items-center gap-1';

        return (
            <span
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
                {...props}
            >
                {icon}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
