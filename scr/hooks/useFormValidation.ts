import { useState, useEffect } from 'react';

interface ValidationField<T> {
  value: T;
  required: boolean;
  errorMessage: string;
  validate?: (value: T) => boolean;
}

interface UseFormValidationResult {
  shouldValidate: boolean;
  setShouldValidate: (value: boolean) => void;
  errors: Record<string, string>;
  setExternalError: (field: string, errorMessage: string) => void; // Add external error setter
  validateForm: () => boolean;
}

export const useFormValidation = <T extends Record<string, any>>(
  fields: Record<string, ValidationField<any>>
): UseFormValidationResult => {
  const [shouldValidate, setShouldValidate] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!shouldValidate) return;

    const newErrors: Record<string, string> = {};
    Object.entries(fields).forEach(([key, field]) => {
      if (field.required && !field.value) {
        newErrors[key] = field.errorMessage;
      }
      else if (field.validate && field.value && !field.validate(field.value)) {
        newErrors[key] = field.errorMessage;
      }
      else {
        newErrors[key] = errors[key] || ''; // Preserve external errors
      }
    });
    setErrors(newErrors);
  }, [shouldValidate, ...Object.values(fields).map(field => field.value)]);

  const setExternalError = (field: string, errorMessage: string) => {
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
  };

  const validateForm = (): boolean => {
    setShouldValidate(true);
    const hasErrors = Object.entries(fields).some(([_, field]) => {
      if (field.required && !field.value) {
        return true;
      }
      if (field.validate && field.value && !field.validate(field.value)) {
        return true;
      }
      return false;
    });
    return !hasErrors;
  };

  return { shouldValidate, setShouldValidate, errors, setExternalError, validateForm };
};