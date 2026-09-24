import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_LINK } from '../constants/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <aside aria-label="WhatsApp Support">
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with UrduPDFBooks on WhatsApp"
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl hover:scale-106 active:scale-95 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8" />

        {/* Subtle desktop tooltip label */}
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#1F2421] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 hidden sm:block">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};
