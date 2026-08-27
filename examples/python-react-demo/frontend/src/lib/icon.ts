import type { ComponentType } from 'react';

/** A lucide icon, or anything that draws like one. */
export type IconComponent = ComponentType<{ size?: number | string; className?: string }>;
