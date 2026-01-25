import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, leftIcon, rightIcon, fullWidth, className = '', ...props }, ref) => {
        const wrapperClasses = [
            'input-wrapper',
            fullWidth && 'input-full',
            error && 'input-error',
            props.disabled && 'input-disabled',
            className,
        ].filter(Boolean).join(' ');

        const id = props.id || props.name;

        return (
            <div className={wrapperClasses}>
                {label && (
                    <label htmlFor={id} className="input-label">
                        {label}
                    </label>
                )}
                <div className="input-field-wrapper">
                    {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={id}
                        className={`input-field ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
                        {...props}
                    />
                    {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
                </div>
                {error && <span className="input-error-text">{error}</span>}
                {hint && !error && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    fullWidth?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ label, error, hint, fullWidth, className = '', ...props }, ref) => {
        const wrapperClasses = [
            'input-wrapper',
            fullWidth && 'input-full',
            error && 'input-error',
            props.disabled && 'input-disabled',
            className,
        ].filter(Boolean).join(' ');

        const id = props.id || props.name;

        return (
            <div className={wrapperClasses}>
                {label && (
                    <label htmlFor={id} className="input-label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={id}
                    className="input-textarea"
                    {...props}
                />
                {error && <span className="input-error-text">{error}</span>}
                {hint && !error && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

TextArea.displayName = 'TextArea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: Array<{ value: string; label: string }>;
    fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, fullWidth, className = '', ...props }, ref) => {
        const wrapperClasses = [
            'input-wrapper',
            fullWidth && 'input-full',
            error && 'input-error',
            props.disabled && 'input-disabled',
            className,
        ].filter(Boolean).join(' ');

        const id = props.id || props.name;

        return (
            <div className={wrapperClasses}>
                {label && (
                    <label htmlFor={id} className="input-label">
                        {label}
                    </label>
                )}
                <select ref={ref} id={id} className="input-select" {...props}>
                    {props.placeholder && (
                        <option value="" disabled>
                            {props.placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className="input-error-text">{error}</span>}
                {hint && !error && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Input;
