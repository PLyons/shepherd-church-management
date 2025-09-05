import { Grid, List, Calendar, Minus } from 'lucide-react';

export type DisplayMode = 'grid' | 'list' | 'agenda' | 'compact';

interface EventDisplayModeToggleProps {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
  className?: string;
}

const modeConfig = {
  grid: {
    icon: Grid,
    label: 'Grid View',
    tooltip: 'Display events in a responsive grid layout'
  },
  list: {
    icon: List,
    label: 'List View', 
    tooltip: 'Display events in a detailed list format'
  },
  agenda: {
    icon: Calendar,
    label: 'Agenda View',
    tooltip: 'Display events in chronological agenda format'
  },
  compact: {
    icon: Minus,
    label: 'Compact View',
    tooltip: 'Display events in a dense, minimal format'
  }
} as const;

export function EventDisplayModeToggle({
  currentMode,
  onModeChange,
  className = ''
}: EventDisplayModeToggleProps) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-white ${className}`}>
      {(Object.entries(modeConfig) as [DisplayMode, typeof modeConfig[DisplayMode]][]).map(([mode, config]) => {
        const IconComponent = config.icon;
        const isActive = currentMode === mode;
        
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            title={config.tooltip}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium transition-colors
              first:rounded-l-lg last:rounded-r-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isActive
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <IconComponent className="h-4 w-4" />
            <span className="ml-2 hidden sm:block">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}