// Intypbaar getalveld (gewicht, reps, rust, loopband): numeriek toetsenbord, alles geselecteerd bij
// aantikken zodat je direct overtypt, en Enter/"Klaar" sluit het toetsenbord.

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  /** Kommagetal toestaan (gewicht, snelheid); anders alleen hele getallen (reps, sets). */
  decimal?: boolean;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function NumberInput({ value, onChange, label, decimal = true, placeholder, className = '', onFocus, onBlur }: Props) {
  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      pattern={decimal ? undefined : '[0-9]*'}
      enterKeyHint="done"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        const el = e.currentTarget;
        // Na de tik zet Android de cursor neer; daarna pas selecteren.
        requestAnimationFrame(() => el.select());
        onFocus?.();
      }}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={`num-input ${className}`}
    />
  );
}
