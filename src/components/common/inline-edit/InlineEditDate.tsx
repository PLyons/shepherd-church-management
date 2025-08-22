import { LucideIcon } from 'lucide-react';
import { InlineEditField } from './InlineEditField';

interface InlineEditDateProps {
  value: string | Date;
  onSave: (value: string) => Promise<void>;
  label: string;
  icon?: LucideIcon;
  canEdit?: boolean;
  formatDisplay?: (value: string | Date) => string;
}

export function InlineEditDate({
  value,
  formatDisplay,
  ...props
}: InlineEditDateProps) {
  const dateValue =
    value instanceof Date ? value.toISOString().split('T')[0] : value;

  const displayValue =
    formatDisplay && value ? formatDisplay(value) : undefined;

  return (
    <InlineEditField
      {...props}
      value={dateValue}
      fieldType="date"
      displayValue={displayValue}
    />
  );
}
