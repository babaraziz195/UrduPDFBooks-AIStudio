import React from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No books found',
  message = 'Try adjusting your search criteria or explore our featured collections.',
  actionText = 'Browse All Books',
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="py-16 px-6 text-center max-w-lg mx-auto bg-white rounded-2xl border border-[#1A3E2F]/10 shadow-sm my-8">
      <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#1A3E2F]/12 text-[#1A3E2F] flex items-center justify-center mx-auto mb-4 shadow-inner">
        <BookOpen className="w-8 h-8 text-[#C5A869]" />
      </div>

      <h3 className="font-literary text-2xl font-bold text-[#1F2421]">
        {title}
      </h3>

      <p className="text-sm text-[#647067] mt-2 leading-relaxed">
        {message}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onAction && actionText && (
          <button
            type="button"
            onClick={onAction}
            className="py-2.5 px-5 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer border border-[#C5A869]/30"
          >
            {actionText}
          </button>
        )}

        {onSecondaryAction && secondaryActionText && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="py-2.5 px-5 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1A3E2F] border border-[#1A3E2F]/15 text-xs font-medium transition-colors cursor-pointer"
          >
            {secondaryActionText}
          </button>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-[#1A3E2F]/8 text-center">
        <span className="font-urdu text-xs text-[#7A8A7F]">
          مزید کتب جلد مکتبہ میں شامل کی جائیں گی
        </span>
      </div>
    </div>
  );
};
