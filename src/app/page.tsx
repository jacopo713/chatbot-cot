'use client';

import ChatInterface from '@/components/ChatInterface';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export default function HomePage() {
  return (
    <div className={`${inter.variable} font-sans antialiased`}>
      <ChatInterface />
    </div>
  );
}
