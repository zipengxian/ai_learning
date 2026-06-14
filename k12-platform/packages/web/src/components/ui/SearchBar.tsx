import { useState, type KeyboardEvent, type ChangeEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  value?: string;
}

export function SearchBar({ placeholder = '搜索...', onSearch, value: externalValue }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(externalValue || '');
  const currentValue = externalValue !== undefined ? externalValue : inputValue;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(currentValue);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0 var(--spacing-md)',
        height: 32,
        width: '100%',
        maxWidth: 480,
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onFocusCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px var(--color-accent-light)';
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Search icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          fontFamily: 'inherit',
        }}
      />
      {currentValue && (
        <button
          onClick={() => {
            setInputValue('');
            onSearch('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}