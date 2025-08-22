import { useState } from 'react';
import { Plus, Minus, Check, X, Edit3, LucideIcon } from 'lucide-react';

interface ArrayItem {
  type: string;
  value: string;
  primary?: boolean;
}

interface InlineEditArrayProps {
  items: ArrayItem[];
  onSave: (items: ArrayItem[]) => Promise<void>;
  label: string;
  icon: LucideIcon;
  canEdit?: boolean;
  itemTypes: Array<{ label: string; value: string }>;
  validation?: (value: string) => string | null;
  placeholder?: string;
}

export function InlineEditArray({
  items,
  onSave,
  label,
  icon: Icon,
  canEdit = true,
  itemTypes,
  validation,
  placeholder = 'No items added',
}: InlineEditArrayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<ArrayItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const startEditing = () => {
    if (!canEdit) return;
    setEditItems([...items]);
    setIsEditing(true);
    setErrors({});
  };

  const cancelEditing = () => {
    setEditItems([...items]);
    setIsEditing(false);
    setErrors({});
  };

  const addItem = () => {
    setEditItems([
      ...editItems,
      { type: itemTypes[0]?.value || '', value: '', primary: false },
    ]);
  };

  const removeItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const updateItem = (index: number, field: keyof ArrayItem, value: any) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);

    // Clear error for this field
    if (field === 'value') {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const setPrimary = (index: number) => {
    const updated = editItems.map((item, i) => ({
      ...item,
      primary: i === index,
    }));
    setEditItems(updated);
  };

  const validateAndSave = async () => {
    const newErrors: Record<number, string> = {};

    editItems.forEach((item, index) => {
      if (item.value.trim()) {
        if (validation) {
          const error = validation(item.value);
          if (error) {
            newErrors[index] = error;
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const validItems = editItems.filter((item) => item.value.trim());
      await onSave(validItems);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Save failed:', error);
      setErrors({ 0: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const DisplayMode = () => (
    <div
      className={`
        group flex items-start gap-3 p-2 rounded-md cursor-pointer
        ${canEdit ? 'hover:bg-gray-50' : ''}
      `}
      onClick={startEditing}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="mt-1 text-sm text-gray-900">
          {items.length === 0 ? (
            <span className="text-gray-500 italic">{placeholder}</span>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${item.primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {itemTypes.find((t) => t.value === item.type)?.label ||
                      item.type}
                  </span>
                  <span>{item.value}</span>
                  {item.primary && (
                    <span className="text-xs text-blue-600 font-medium">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {canEdit && (
        <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  const EditMode = () => (
    <div className="flex items-start gap-3 p-2 rounded-md border border-blue-200 bg-blue-50">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>

        <div className="space-y-2">
          {editItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={item.type}
                onChange={(e) => updateItem(index, 'type', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {itemTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={item.value}
                onChange={(e) => updateItem(index, 'value', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value..."
              />

              <button
                onClick={() => setPrimary(index)}
                className={`px-2 py-1 text-xs rounded ${
                  item.primary
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Set as primary"
              >
                Primary
              </button>

              <button
                onClick={() => removeItem(index)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Remove item"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>
          ))}

          {Object.entries(errors).map(([index, error]) => (
            <div key={index} className="text-xs text-red-600">
              {error}
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
        >
          <Plus className="h-3 w-3" />
          Add {label}
        </button>
      </div>

      <div className="flex items-center gap-1">
        {isSaving ? (
          <div className="h-4 w-4 animate-spin rounded-full border border-blue-600 border-t-transparent" />
        ) : (
          <>
            <button
              onClick={validateAndSave}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Save changes"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Cancel changes"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return isEditing ? <EditMode /> : <DisplayMode />;
}
