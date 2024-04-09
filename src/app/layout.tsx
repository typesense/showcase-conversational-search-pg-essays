import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conversational Search with Typesense',
  description:
    "This demo showcases the AI powererd conversational search capabilities of Typesense with Paul Graham's essays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-gray-100 antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
