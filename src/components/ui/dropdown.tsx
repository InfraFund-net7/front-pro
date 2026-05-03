'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownOption {
  key: string;
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string, key: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  // Click-outside dismissal — must check both trigger AND portal'd menu since
  // the menu is no longer a DOM child of the trigger.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // Position the portal'd menu directly under the trigger using fixed
  // coordinates, so it escapes any modal/scroll-container clipping.
  // Recompute on scroll/resize while open.
  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    setSelectedValue(option.value);
    setIsOpen(false);
    onChange?.(option.value, option.key);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-left text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ease-in-out flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-200' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && menuPosition && typeof window !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                zIndex: 10050,
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
            >
              <div className="py-1 max-h-60 overflow-auto">
                {options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors duration-200 ease-in-out ${
                      selectedValue === option.value
                        ? 'bg-slate-700 text-primary'
                        : 'text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
