import { ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownProps {
  children: ReactNode;
  className?: string;
}

interface DropdownTriggerProps {
  children: ReactNode;
  className?: string;
}

interface DropdownContentProps {
  children: ReactNode;
  className?: string;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({ children, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
    </div>
  );
}

export function DropdownTrigger({
  children,
  className = '',
}: DropdownTriggerProps) {
  return <div className={className}>{children}</div>;
}

export function DropdownContent({
  children,
  className = '',
}: DropdownContentProps) {
  return (
    <div
      className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${className}`}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  className = '',
}: DropdownItemProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={`
        w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 
        focus:bg-gray-100 focus:text-gray-900 focus:outline-none
        disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-white
        flex items-center
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </button>
  );
}

// Enhanced dropdown with proper state management for the PRP implementation
interface EnhancedDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EnhancedDropdown({
  trigger,
  children,
  className = '',
}: EnhancedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className="focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
