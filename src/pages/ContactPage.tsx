import React from 'react';
import { ViewMode } from '../types';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '../constants/whatsapp';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ArrowLeft, Clock, Mail, ShieldCheck } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (view: ViewMode) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:underline cursor-pointer mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Contact Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-12 border border-[#1A3E2F]/12 shadow-sm text-center relative overflow-hidden">
        {/* Subtle decorative background emblem */}
        <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <WhatsAppIcon className="w-9 h-9" />
        </div>

        <span className="font-urdu text-base text-[#1A3E2F] font-bold block mb-1">
          رابطہ و رہنمائی
        </span>

        <h1 className="font-literary text-3xl sm:text-4xl font-bold text-[#1F2421] tracking-tight">
          Need Help?
        </h1>

        <p className="text-base text-[#55635B] max-w-xl mx-auto mt-3 leading-relaxed">
          Have a question about UrduPDFBooks or need assistance finding a book? Contact us on WhatsApp and our team will be happy to help.
        </p>

        {/* Primary WhatsApp Action */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <WhatsAppIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Chat on WhatsApp</span>
          </a>

          {/* WhatsApp Support Number Display */}
          <div className="pt-2">
            <span className="text-xs text-[#647067] block uppercase tracking-wider font-medium">
              WhatsApp Support
            </span>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-lg font-bold text-[#1A3E2F] hover:text-[#25D366] transition-colors mt-0.5 inline-block"
            >
              {WHATSAPP_NUMBER}
            </a>
          </div>
        </div>

        {/* Trust & Support Highlights */}
        <div className="mt-12 pt-8 border-t border-[#1A3E2F]/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8F5]">
            <Clock className="w-5 h-5 text-[#C5A869] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#1F2421]">Fast Response</h4>
              <p className="text-xs text-[#647067] mt-0.5 leading-relaxed">
                Direct reply via WhatsApp during active hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8F5]">
            <Mail className="w-5 h-5 text-[#C5A869] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#1F2421]">Email Inquiries</h4>
              <a
                href="mailto:contact@urdupdfbooks.com"
                className="text-xs text-[#1A3E2F] hover:underline mt-0.5 block truncate"
              >
                contact@urdupdfbooks.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8F5]">
            <ShieldCheck className="w-5 h-5 text-[#C5A869] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#1F2421]">Dedicated Service</h4>
              <p className="text-xs text-[#647067] mt-0.5 leading-relaxed">
                Personalized guidance for students, researchers, and readers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
