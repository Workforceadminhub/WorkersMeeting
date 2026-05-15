import React, { forwardRef, useId } from "react";
import clsx from "clsx";
import type { SelectOption } from "../types";

type SelectProps = {
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  value?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
  secondaryLabel?: string;
  hasErrors?: boolean;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  options: SelectOption[];
  showBorder?: boolean;
  id?: string;
  "aria-label"?: string;
} & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      onChange = () => {},
      onBlur,
      value,
      className,
      inputClassName,
      label,
      secondaryLabel,
      hasErrors = false,
      error,
      disabled,
      readOnly,
      options,
      showBorder = true,
      id,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={clsx(className)}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
          </label>
        )}
        {secondaryLabel && (
          <label htmlFor={selectId} className="form-label" style={{ fontSize: 11 }}>
            {secondaryLabel}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={clsx("form-select", { "has-error": hasErrors }, { "opacity-50 cursor-not-allowed": disabled }, inputClassName)}
          disabled={disabled || readOnly}
          aria-invalid={hasErrors || undefined}
          aria-label={!label ? rest["aria-label"] : undefined}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
