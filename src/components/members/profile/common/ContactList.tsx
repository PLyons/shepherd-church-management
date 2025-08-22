import { LucideIcon } from 'lucide-react';
import InfoField from './InfoField';

interface ContactItem {
  type: string;
  value: string;
  primary?: boolean;
  label?: string;
}

interface ContactListProps {
  contacts: ContactItem[];
  icon: LucideIcon;
  emptyText: string;
}

export default function ContactList({
  contacts,
  icon: Icon,
  emptyText,
}: ContactListProps) {
  if (!contacts?.length) {
    return (
      <InfoField label={emptyText} value="Not provided" icon={Icon} secondary />
    );
  }

  const primary = contacts.find((c) => c.primary) || contacts[0];
  const secondary = contacts.filter((c) => c !== primary);

  return (
    <div className="space-y-2">
      <InfoField
        label={primary.label || primary.type}
        value={primary.value}
        icon={Icon}
      />
      {secondary.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 -mx-1">
            Show {secondary.length} more {emptyText.toLowerCase()}
            {secondary.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-2 space-y-2 pl-7">
            {secondary.map((contact, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">
                  {contact.label || contact.type}:
                </span>{' '}
                <span className="text-gray-900">{contact.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
