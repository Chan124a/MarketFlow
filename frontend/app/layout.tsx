import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '大盘',
  description: '实时大盘指数看板',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}