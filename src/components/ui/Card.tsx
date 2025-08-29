import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-gray-300 rounded-2xl shadow-sm border border-gray-400',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-100', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardActions({ children, className }: CardProps) {
  return (
    <div className={clsx('px-6 py-4 bg-gray-50 rounded-b-2xl', className)}>
      {children}
    </div>
  );
}