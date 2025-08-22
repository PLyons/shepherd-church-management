import { LucideIcon } from 'lucide-react';
import { InlineEditField } from './InlineEditField';

interface InlineEditSelectProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  options: Array<{ label: string; value: string }>;
  label: string;
  icon?: LucideIcon;
  canEdit?: boolean;
}

export function InlineEditSelect(props: InlineEditSelectProps) {
  return <InlineEditField {...props} fieldType="select" />;
}
