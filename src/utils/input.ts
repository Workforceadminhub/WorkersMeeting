export const onlyDigits = (value: string): string =>
  (value || "").replace(/\D/g, "");

export const sanitise = (input: string): string =>
  input.trim().slice(0, 100).replace(/[<>"'`;]/g, "");

export const withPlaceholder = (
  options: { label: string; value: string }[],
  placeholder: string
): { label: string; value: string }[] => [
  { label: placeholder, value: "" },
  ...options,
];
