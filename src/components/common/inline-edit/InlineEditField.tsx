import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Edit3, AlertCircle, LucideIcon } from 'lucide-react';

interface InlineEditFieldProps<T = string> {
  value: T;
  onSave: (newValue: T) => Promise<void>;
  displayValue?: string;
  placeholder?: string;
  validation?: (value: T) => string | null;
  canEdit?: boolean;
  fieldType?: 'text' | 'email' | 'phone' | 'select' | 'date' | 'textarea';
  options?: Array<{ label: string; value: string }>;
  className?: string;
  icon?: LucideIcon;
  label?: string;
}

interface EditState {
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  currentValue: string;
}

export function InlineEditField<T = string>({
  value,
  onSave,
  displayValue,
  placeholder = "Click to edit",
  validation,
  canEdit = true,
  fieldType = 'text',
  options = [],
  className = '',
  icon: Icon,
  label
}: InlineEditFieldProps<T>) {
  const [state, setState] = useState<EditState>({
    isEditing: false,
    isSaving: false,
    error: null,
    currentValue: String(value || '')
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Focus input when entering edit mode
  useEffect(() => {
    if (state.isEditing) {
      const currentRef = fieldType === 'textarea' ? textareaRef : fieldType === 'select' ? selectRef : inputRef;
      if (currentRef.current) {
        currentRef.current.focus();
        if (currentRef.current instanceof HTMLInputElement || currentRef.current instanceof HTMLTextAreaElement) {
          currentRef.current.select();
        }
      }
    }
  }, [state.isEditing, fieldType]);

  // Reset current value when external value changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentValue: String(value || '')
    }));
  }, [value]);

  const startEditing = useCallback(() => {
    if (!canEdit) return;
    
    setState(prev => ({
      ...prev,
      isEditing: true,
      error: null,
      currentValue: String(value || '')
    }));
  }, [canEdit, value]);

  const cancelEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEditing: false,
      error: null,
      currentValue: String(value || '')
    }));
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [value]);

  const handleSave = useCallback(async (newValue: string) => {
    // Validation
    if (validation) {
      const error = validation(newValue as T);
      if (error) {
        setState(prev => ({ ...prev, error }));
        return;
      }
    }

    // Skip save if value unchanged
    if (newValue === String(value)) {
      setState(prev => ({ ...prev, isEditing: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await onSave(newValue as T);
      setState(prev => ({ 
        ...prev, 
        isEditing: false, 
        isSaving: false, 
        error: null 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: error instanceof Error ? error.message : 'Save failed',
        currentValue: String(value) // Rollback
      }));
    }
  }, [value, onSave, validation]);

  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await handleSave(newValue);
    }, 500);
  }, [handleSave]);

  const handleInputChange = useCallback((newValue: string) => {
    setState(prev => ({ ...prev, currentValue: newValue, error: null }));
    debouncedSave(newValue);
  }, [debouncedSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave(state.currentValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [state.currentValue, handleSave, cancelEditing]);

  const renderInput = () => {
    const baseInputProps = {
      value: state.currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value),
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    };

    const baseTextareaProps = {
      value: state.currentValue,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e.target.value),
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    };

    const baseSelectProps = {
      value: state.currentValue,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e.target.value),
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    };

    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            ref={textareaRef}
            {...baseTextareaProps}
            rows={3}
            className={`${baseTextareaProps.className} resize-none`}
          />
        );
      
      case 'select':
        return (
          <select ref={selectRef} {...baseSelectProps}>
            <option value="">Select an option</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            ref={inputRef}
            {...baseInputProps}
            type="date"
          />
        );
      
      case 'email':
        return (
          <input
            ref={inputRef}
            {...baseInputProps}
            type="email"
          />
        );
      
      case 'phone':
        return (
          <input
            ref={inputRef}
            {...baseInputProps}
            type="tel"
          />
        );
      
      default:
        return (
          <input
            ref={inputRef}
            {...baseInputProps}
            type="text"
          />
        );
    }
  };

  const DisplayMode = () => (
    <div 
      className={`
        group flex items-center gap-2 p-2 rounded-md cursor-pointer
        ${canEdit ? 'hover:bg-gray-50' : ''}
        ${className}
      `}
      onClick={startEditing}
    >
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      <div className="flex-1 min-w-0">
        {label && (
          <div className="text-sm font-medium text-gray-700">{label}</div>
        )}
        <div className="text-sm text-gray-900">
          {displayValue || String(value) || (
            <span className="text-gray-500 italic">{placeholder}</span>
          )}
        </div>
      </div>
      {canEdit && (
        <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  const EditMode = () => (
    <div className={`flex items-center gap-2 p-2 rounded-md border border-blue-200 bg-blue-50 ${className}`}>
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      <div className="flex-1 min-w-0">
        {label && (
          <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
        )}
        {renderInput()}
        {state.error && (
          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            {state.error}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {state.isSaving ? (
          <div className="h-4 w-4 animate-spin rounded-full border border-blue-600 border-t-transparent" />
        ) : (
          <>
            <button
              onClick={() => handleSave(state.currentValue)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Save (Enter)"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Cancel (Escape)"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return state.isEditing ? <EditMode /> : <DisplayMode />;
}