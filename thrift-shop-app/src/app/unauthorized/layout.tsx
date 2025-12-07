/**
 * Unauthorized Layout
 * Simple centered layout for the unauthorized page
 */
export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
