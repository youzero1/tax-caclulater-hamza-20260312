import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tax Calculator',
  description: 'U.S. Federal Tax Calculator for 2023 and 2024',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
