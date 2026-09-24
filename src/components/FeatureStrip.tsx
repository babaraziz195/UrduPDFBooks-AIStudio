import React from 'react';
import { BookOpen, Monitor, Smartphone, Library } from 'lucide-react';

export const FeatureStrip: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="w-5 h-5 text-[#C5A869]" />,
      title: 'Urdu Books',
      subtitle: 'Classic & modern literature',
    },
    {
      icon: <Monitor className="w-5 h-5 text-[#C5A869]" />,
      title: 'Read Online',
      subtitle: 'Instant in-browser viewer',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-[#C5A869]" />,
      title: 'Mobile Friendly',
      subtitle: 'Seamless on any screen',
    },
    {
      icon: <Library className="w-5 h-5 text-[#C5A869]" />,
      title: 'Growing Library',
      subtitle: 'Carefully curated volumes',
    },
  ];

  return (
    <section className="border-y border-[#1A3E2F]/12 bg-[#F5F2EB]/80 py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {features.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3.5 p-2"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1A3E2F] flex items-center justify-center shrink-0 shadow-2xs">
                {item.icon}
              </div>
              <div>
                <h4 className="font-literary text-base font-semibold text-[#1F2421] leading-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-[#647067] mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
