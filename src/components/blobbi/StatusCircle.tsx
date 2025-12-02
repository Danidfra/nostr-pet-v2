import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusCircleProps {
  icon: LucideIcon;
  value: number;
  label: string;
  className?: string;
}

export const StatusCircle: React.FC<StatusCircleProps> = ({
  icon: Icon,
  value,
  label,
  className,
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Determine color based on thresholds with dark mode support
  const getColor = () => {
    if (clampedValue < 20) return {
      ring: '#ef4444',
      bgLight: '#fee2e2',
      bgDark: '#7f1d1d'
    }; // red
    if (clampedValue < 60) return {
      ring: '#eab308',
      bgLight: '#fef9c3',
      bgDark: '#713f12'
    }; // yellow
    return {
      ring: '#22c55e',
      bgLight: '#dcfce7',
      bgDark: '#14532d'
    }; // green
  };

  const colors = getColor();

  // Calculate the conic gradient for the ring (emptying clockwise)
  // At 100%, we want a full circle. At 0%, we want empty.
  // The gradient starts at top (0deg) and fills clockwise
  const percentage = clampedValue;

  // Use CSS variables for dark mode support
  const gradientStyleLight = {
    background: `conic-gradient(
      ${colors.ring} 0deg,
      ${colors.ring} ${percentage * 3.6}deg,
      ${colors.bgLight} ${percentage * 3.6}deg,
      ${colors.bgLight} 360deg
    )`,
  };

  const gradientStyleDark = {
    background: `conic-gradient(
      ${colors.ring} 0deg,
      ${colors.ring} ${percentage * 3.6}deg,
      ${colors.bgDark} ${percentage * 3.6}deg,
      ${colors.bgDark} 360deg
    )`,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
              className
            )}
          >
            {/* Outer ring with conic gradient - light mode */}
            <div
              className="rounded-full p-1 dark:hidden"
              style={gradientStyleLight}
            >
              {/* Inner circle with icon */}
              <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
                <Icon className="h-5 w-5" style={{ color: colors.ring }} />
              </div>
            </div>

            {/* Outer ring with conic gradient - dark mode */}
            <div
              className="rounded-full p-1 hidden dark:block"
              style={gradientStyleDark}
            >
              {/* Inner circle with icon */}
              <div className="bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center">
                <Icon className="h-5 w-5" style={{ color: colors.ring }} />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{label}</p>
          <p className="text-sm">{clampedValue}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
