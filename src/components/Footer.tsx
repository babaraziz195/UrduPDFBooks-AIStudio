import React from 'react';
import { ViewMode } from '../types';
import { BookOpen } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '../constants/whatsapp';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onOpenInfo: (type: 'about' | 'contact' | 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenInfo }) => {
  return (
    <footer className="bg-[#122A1E] text-[#DCE5DF] pt-16 pb-12 border-t border-[#1C3E2D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1C3E2D]/60">
          {/* Brand & Purpose */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-md bg-[#FAF8F5] text-[#122A1E] flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-[#122A1E]" />
              </div>
              <span className="font-literary text-2xl font-bold tracking-tight text-white">
                Urdu<span className="text-[#C5A869]">PDF</span>Books
              </span>
            </div>

            <p className="font-urdu text-base text-[#C5A869] mb-2">
              اردو زبان و ادب کے قارئین کا معتبر ڈیجیٹل کتب خانہ
            </p>

            <p className="text-sm text-[#A2B5A8] max-w-md leading-relaxed">
              A digital home for Urdu readers. Discover timeless classic literature, poetry, historical archives, and spiritual masterpieces — beautifully presented for modern browser-based reading.
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs text-[#8BA493]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#C5A869]" />
              <span>Optimized for online browser reading on any screen</span>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A869] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Library
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('authors')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Authors
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  New Releases
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Popular Books
                </button>
              </li>
            </ul>
          </div>

          {/* Information Links & WhatsApp Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A869] mb-4">
              Information
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-[#C5A869]/80 hover:text-[#C5A869] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>

            {/* Footer WhatsApp Contact Section */}
            <div className="mt-6 pt-5 border-t border-[#1C3E2D]">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#C5A869] mb-2">
                WhatsApp Support
              </span>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[#DCE5DF] hover:text-[#25D366] transition-colors group cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                  <WhatsAppIcon className="w-4 h-4" />
                </span>
                <span className="font-mono text-xs sm:text-sm font-semibold tracking-wide">
                  {WHATSAPP_NUMBER}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8BA493]">
          <p>© {new Date().getFullYear()} UrduPDFBooks. All Rights Reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-[#A2B5A8]">
            <span>Dedicated to preserving & celebrating Urdu literature</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
