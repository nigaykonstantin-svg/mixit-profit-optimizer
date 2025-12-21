'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const variantStyles = {
    primary: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-200',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'text-gray-400 hover:text-red-500',
    ghost: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
};

const sizeStyles = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', fullWidth = false, className = '', disabled, children, ...props }, ref) => {
        const baseStyles = 'rounded-xl font-medium transition-all flex items-center justify-center gap-2';
        const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
        const widthStyles = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
