import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const headerSurfaceVariants = cva('header-surface', {
  variants: {
    density: {
      desktop: 'rounded-xl',
      mobile: 'rounded-full',
    },
    emphasis: {
      default: '',
      strong: 'header-surface-strong',
    },
  },
  defaultVariants: {
    density: 'desktop',
    emphasis: 'default',
  },
});

export const segmentedControlVariants = cva('header-surface inline-flex items-center', {
  variants: {
    density: {
      desktop: 'rounded-xl p-1',
      mobile: 'rounded-full p-1',
    },
  },
  defaultVariants: {
    density: 'desktop',
  },
});

export const navPillVariants = cva(
  'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-all duration-[var(--motion-standard-duration)]',
  {
    variants: {
      state: {
        active: 'header-chip-active',
        inactive: 'header-chip-inactive',
        ghost: 'text-[hsl(var(--text-2))] hover:text-[hsl(var(--text-1))]',
      },
      density: {
        desktop: 'type-nav-label',
        mobile: 'type-filter-label rounded-full px-3 py-1.5',
      },
    },
    defaultVariants: {
      state: 'inactive',
      density: 'desktop',
    },
  }
);

export const statBadgeVariants = cva('header-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5', {
  variants: {
    tone: {
      default: 'text-foreground',
      accent: 'header-chip-active',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

export const profileSurfaceVariants = cva('header-surface flex items-center gap-3 rounded-xl px-3 py-2');

export interface HeaderSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof headerSurfaceVariants> {}

export const HeaderSurface = React.forwardRef<HTMLDivElement, HeaderSurfaceProps>(
  ({ className, density, emphasis, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(headerSurfaceVariants({ density, emphasis }), className)}
      {...props}
    />
  )
);
HeaderSurface.displayName = 'HeaderSurface';

export interface SegmentedControlProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof segmentedControlVariants> {}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ className, density, ...props }, ref) => (
    <div ref={ref} className={cn(segmentedControlVariants({ density }), className)} {...props} />
  )
);
SegmentedControl.displayName = 'SegmentedControl';

export interface NavPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navPillVariants> {}

export const NavPill = React.forwardRef<HTMLButtonElement, NavPillProps>(
  ({ className, density, state, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(navPillVariants({ density, state }), className)}
      {...props}
    />
  )
);
NavPill.displayName = 'NavPill';

export interface StatBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statBadgeVariants> {}

export const StatBadge = React.forwardRef<HTMLDivElement, StatBadgeProps>(
  ({ className, tone, ...props }, ref) => (
    <div ref={ref} className={cn(statBadgeVariants({ tone }), className)} {...props} />
  )
);
StatBadge.displayName = 'StatBadge';

export interface ProfileSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ProfileSurface = React.forwardRef<HTMLDivElement, ProfileSurfaceProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(profileSurfaceVariants(), className)} {...props} />
  )
);
ProfileSurface.displayName = 'ProfileSurface';
