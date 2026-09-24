import React from 'react';
import { X, BookOpen, Mail, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '../constants/whatsapp';

interface InfoModalProps {
  type: 'about' | 'contact' | 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#1A3E2F]/15 overflow-hidden z-10 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A3E2F]/12 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A3E2F] text-white flex items-center justify-center">
              {type === 'about' && <BookOpen className="w-5 h-5 text-[#C5A869]" />}
              {type === 'contact' && <Mail className="w-5 h-5 text-[#C5A869]" />}
              {type === 'privacy' && <Shield className="w-5 h-5 text-[#C5A869]" />}
              {type === 'terms' && <FileText className="w-5 h-5 text-[#C5A869]" />}
            </div>
            <div>
              <h3 className="font-literary text-xl font-bold text-[#1F2421]">
                {type === 'about' && 'About UrduPDFBooks'}
                {type === 'contact' && 'Contact UrduPDFBooks'}
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'terms' && 'Terms & Conditions'}
              </h3>
              <p className="font-urdu text-xs text-[#1A3E2F]">
                {type === 'about' && 'ہمارے مقاصد اور ڈیجیٹل لائبریری کا تعارف'}
                {type === 'contact' && 'رابطہ اور تجاویز'}
                {type === 'privacy' && 'رازداری کی حکمتِ عملی'}
                {type === 'terms' && 'قواعد و ضوابط'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#647067] hover:bg-[#EFECE5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-sm text-[#4A554E] space-y-4 leading-relaxed">
          {type === 'about' && (
            <>
              <p className="text-base text-[#1F2421] font-medium">
                UrduPDFBooks was founded to make the vast treasures of Urdu literature easily accessible to readers worldwide across any modern web browser.
              </p>
              <p>
                From classical poets like Mirza Ghalib and Allama Muhammad Iqbal, to modern storytellers like Umera Ahmed, Bano Qudsia, and Saadat Hasan Manto, our mission is to digitize and present literature with the dignity, beauty, and typographic elegance it deserves.
              </p>
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#1A3E2F]/10 space-y-2 mt-4">
                <h4 className="font-semibold text-[#1F2421] text-xs uppercase tracking-wider text-[#1A3E2F]">
                  Our Guiding Principles
                </h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0" />
                    <span>Pure online reading focus without forced downloads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0" />
                    <span>Preservation of classical and contemporary South Asian writings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0" />
                    <span>Responsive, zero-distraction reading experience for mobile and desktop</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {type === 'contact' && (
            <div className="space-y-5 text-center sm:text-left">
              <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-xl border border-[#1A3E2F]/12 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mx-auto mb-3">
                  <WhatsAppIcon className="w-7 h-7" />
                </div>
                <h4 className="font-literary text-2xl font-bold text-[#1F2421]">
                  Need Help?
                </h4>
                <p className="text-sm text-[#55635B] mt-2 max-w-md mx-auto leading-relaxed">
                  Have a question about UrduPDFBooks or need assistance finding a book? Contact us on WhatsApp and our team will be happy to help.
                </p>

                <div className="mt-5 flex flex-col items-center justify-center gap-3">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold shadow-sm hover:shadow transition-all group"
                  >
                    <WhatsAppIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <div className="pt-1">
                    <span className="text-[11px] text-[#647067] uppercase tracking-wider font-semibold block">
                      WhatsApp Support
                    </span>
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-base font-bold text-[#1A3E2F] hover:text-[#25D366] transition-colors"
                    >
                      {WHATSAPP_NUMBER}
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#1A3E2F]/10 space-y-2 text-xs text-[#647067]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1F2421]">Email Inquiries:</span>
                  <a href="mailto:contact@urdupdfbooks.com" className="text-[#1A3E2F] hover:underline">
                    contact@urdupdfbooks.com
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1F2421]">Response Time:</span>
                  <span>Direct reply via WhatsApp</span>
                </div>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <>
              <p>
                UrduPDFBooks respects your privacy. We are committed to protecting any information you share while exploring and reading books on our platform.
              </p>
              <h4 className="font-semibold text-[#1F2421]">1. Zero Invasive Tracking</h4>
              <p>
                We do not sell personal data or track private reading habits across external websites. Reading states such as page bookmarks and zoom preferences are stored strictly inside your browser.
              </p>
              <h4 className="font-semibold text-[#1F2421]">2. Fair Use & Digital Archival</h4>
              <p>
                Materials hosted are intended for literary education, scholarly research, and cultural preservation.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                By using UrduPDFBooks, you agree to comply with our reading guidelines and community terms.
              </p>
              <h4 className="font-semibold text-[#1F2421]">1. Non-Commercial Personal Reading</h4>
              <p>
                Books and digital texts available on this platform are made accessible strictly for personal, non-commercial reading and academic research.
              </p>
              <h4 className="font-semibold text-[#1F2421]">2. Copyright & Intellectual Property</h4>
              <p>
                We respect the intellectual rights of authors and estates. Rights holders may contact our administration for verification or inquiries.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#1A3E2F]/12 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
