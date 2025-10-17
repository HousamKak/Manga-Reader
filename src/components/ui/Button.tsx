import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 border-2 font-display uppercase tracking-[0.3em]',
          'transition duration-200 ease-out shadow-md shadow-stone-900/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--parchment))]',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'border-stone-900 bg-amber-400 text-stone-900 hover:-translate-y-[1px] hover:bg-amber-500':
              variant === 'default',
            'border-stone-700 bg-transparent text-stone-800 hover:bg-amber-200/50 hover:text-amber-900':
              variant === 'outline',
            'border-transparent bg-transparent text-stone-700 hover:text-amber-900':
              variant === 'ghost',
            'border-red-900 bg-red-700 text-red-100 hover:bg-red-600':
              variant === 'destructive',
            'h-8 px-3 text-[10px]': size === 'sm',
            'h-10 px-5 text-xs': size === 'md',
            'h-12 px-6 text-sm': size === 'lg'
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
