"use client";

import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "../components/base/select";
import { Spinner } from "../components/base/spinner";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "../components/base/field";
import { Button } from "../components/base/button";

// Export contexts for use in custom components
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// TextField component using useFieldContext
function TextField({
  label,
  placeholder,
  type = "text",
  required,
  disabled,
  id,
}: {
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  const field = useFieldContext<string>();

  const computedId = id || field.name;
  return (
    <Field>
      {label && (
        <FieldLabel htmlFor={computedId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </FieldLabel>
      )}
      <FieldControl
        id={computedId}
        name={field.name}
        type={type}
        {...(placeholder !== undefined ? { placeholder } : {})}
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        disabled={disabled ?? field.state.meta.isValidating}
        required={required ?? false}
        aria-invalid={!field.state.meta.isValid}
        aria-describedby={!field.state.meta.isValid ? `${field.name}-error` : undefined}
      />
      {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
        <FieldError id={`${field.name}-error`} role="alert">
          {field.state.meta.errors.join(", ")}
        </FieldError>
      )}
    </Field>
  );
}

// SelectField component for dropdowns
function SelectField({
  label,
  options,
  placeholder,
  required,
  disabled,
}: {
  label?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const field = useFieldContext<string>();

  return (
    <Field>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </FieldLabel>
      )}
      <Select
        value={field.state.value ?? ""}
        onValueChange={value => {
          if (value !== null && value !== undefined) {
            field.handleChange(value);
          }
        }}
        disabled={disabled ?? field.state.meta.isValidating}
      >
        <SelectTrigger size="sm" aria-invalid={!field.state.meta.isValid}>
          <SelectValue {...(placeholder !== undefined ? { placeholder } : {})} />
        </SelectTrigger>
        <SelectPopup>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
        <FieldError id={`${field.name}-error`} role="alert">
          {field.state.meta.errors.join(", ")}
        </FieldError>
      )}
    </Field>
  );
}

// SubmitButton component using form context
function SubmitButton({
  label,
  disabled,
  className,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const form = useFormContext();

  const isSubmitting = useStore(form.store, state => state.isSubmitting);
  const isFormValid = useStore(form.store, state => state.isFormValid);

  return (
    <Button
      type="submit"
      variant="default"
      size="default"
      disabled={disabled || isSubmitting || !isFormValid}
      className={className}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? <Spinner className="size-4" aria-live="polite" /> : label}
    </Button>
  );
}

// Create and export the form hook
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
  },
});
