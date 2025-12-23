// Ce layout racine est minimal car next-intl gère le routing via [locale]
// Le layout principal se trouve dans [locale]/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
