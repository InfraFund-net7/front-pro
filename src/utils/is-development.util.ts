export function isDevelopment() {
  return (
    !process.env.NEXT_PUBLIC_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
  );
}
