import { LucideIcon } from 'lucide-react';
import { InlineEditField } from './InlineEditField';

interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  label: string;
  icon?: LucideIcon;
  validation?: (value: string) => string | null;
  canEdit?: boolean;
  placeholder?: string;
}

export function InlineEditText(props: InlineEditTextProps) {
  return <InlineEditField {...props} fieldType="text" />;
}
