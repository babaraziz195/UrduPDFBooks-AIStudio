import React from 'react';
import { ViewMode } from '../types';
import { Monitor, Smartphone, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import devicesMockup from '../assets/images/reader_devices_mockup_1790203859761.jpg';

interface OnlineReadingPromotionProps {
  onNavigate: (view: ViewMode) => void;
}

export const OnlineReadingPromotion: React.FC<OnlineReadingPromotionProps> = ({
  onNavigate,
}) => {
  const benefits = [
    {
      icon: <Monitor className="w-5 h-5 text-[#C5A869]" />,
      title: 'Read Online',
      desc: 'Open books directly in your browser with zero delays and no storage clutter.',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-[#C5A869]" />,
      title: 'Mobile Friendly',
      desc: 'Designed for comfortable reading on any screen with responsive controls & night modes.',
    },
    {
      icon: <Search className="w-5 h-5 text-[#C5A869]" />,
      title: 'Easy Discovery',
      desc: 'Find books effortlessly by category, author or title with live instant search.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F5F2EB]/90 border-y border-[#1A3E2F]/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Device Mockup */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#1A3E2F]/15 bg-white">
                <img
                  src={devicesMockup}
                  alt="UrduPDFBooks reading interface on tablet and mobile"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-4 bg-white/95 border-t border-[#1A3E2F]/10 flex items-center justify-between text-xs text-[#55635B]">
                  <span className="font-urdu font-medium text-sm text-[#1A3E2F]">
                    خوبصورت نستعلیق خط میں آن لائن مطالعہ
                  </span>
                  <span className="tabular-nums font-semibold text-[#1A3E2F]">
                    Multi-Device Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Text and Benefits */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              Seamless Digital Experience
            </span>

            <h2 className="font-literary text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F2421] mt-2 mb-4 leading-tight">
              Your Urdu Library, Wherever You Go
            </h2>

            <p className="text-base text-[#55635B] leading-relaxed mb-8">
              Open your favorite books and read online from your phone, tablet or computer. Built with high-fidelity typography and intuitive controls to provide a peaceful reading sanctuary.
            </p>

            {/* Three key benefits */}
            <div className="space-y-6 mb-8">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1A3E2F] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-literary text-lg font-semibold text-[#1F2421]">
                      {b.title}
                    </h3>
                    <p className="text-sm text-[#647067] mt-1 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="py-3 px-6 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer border border-[#C5A869]/30"
            >
              <span>Explore Books</span>
              <ArrowRight className="w-4 h-4 text-[#C5A869]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
