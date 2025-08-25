export const validateRequired = (value: string): string | null => {
  return value.trim() ? null : 'This field is required';
};

export const validateEmail = (value: string): string | null => {
  if (!value.trim()) return null; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : 'Please enter a valid email address';
};

export const validatePhone = (value: string): string | null => {
  if (!value.trim()) return null; // Optional field
  const phoneRegex = /^[\d\s\-()]{10,}$/;
  return phoneRegex.test(value) ? null : 'Please enter a valid phone number';
};

export const validateName = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be less than 50 characters';
  return null;
};
