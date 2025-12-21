'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
}

const variantStyles = {
    default: 'bg-white rounded-2xl shadow-sm border border-gray-100',
    elevated: 'bg-white rounded-2xl shadow-lg border border-gray-100',
    bordered: 'bg-white rounded-2xl border border-gray-200',
};

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', padding = 'md', hoverable = false, className = '', children, ...props }, ref) => {
        const hoverStyles = hoverable ? 'hover:shadow-md transition-shadow' : '';

        return (
            <div
                ref={ref}
                className={`${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
