import React, { useState, useRef, useEffect } from 'react';
import { useToast } from './ToastContext';

interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, align = 'left', className = '', style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option: CustomSelectOption) => {
    if (option.disabled) {
      showToast("This delivery schedule will be available in a future update.", "info");
      setIsOpen(false);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <div className={`custom-select-container ${className}`} style={{ position: 'relative', zIndex: isOpen ? 9999 : 1, ...style }} ref={dropdownRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-color)',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0',
          outline: 'none',
          width: '100%',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start'
        }}
      >
        <span>{selectedOption?.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            [align === 'right' ? 'right' : 'left']: 0,
            marginTop: '8px',
            background: '#0f172a', /* solid dark background */
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: '100%',
            width: 'max-content',
            overflow: 'hidden'
          }}
        >
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option)}
              style={{
                padding: '12px 16px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                opacity: option.disabled ? 0.5 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                transition: 'background 0.2s ease',
                backgroundColor: value === option.value ? 'rgba(228, 185, 91, 0.1)' : 'transparent',
                color: value === option.value ? 'var(--primary)' : 'var(--text-color)'
              }}
              onMouseEnter={(e) => {
                if (!option.disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === option.value ? 'rgba(228, 185, 91, 0.1)' : 'transparent';
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{option.label}</span>
              {option.disabled && <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Coming Soon</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
