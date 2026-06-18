import React, { useState } from 'react';
import { Globe, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LANGUAGE_LABELS, type SupportedLanguage, type TranslationSchema } from '../types';

interface TranslationInputProps {
  translations: TranslationSchema;
  onChange: (translations: TranslationSchema) => void;
  errors?: Record<string, any>;
  disabled?: boolean;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'ta', 'te', 'mr', 'bn'];

export const TranslationInput: React.FC<TranslationInputProps> = ({
  translations,
  onChange,
  errors,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('en');

  const handleTextChange = (lang: SupportedLanguage, value: string) => {
    const updated = { ...translations, [lang]: value };
    onChange(updated);
  };

  // Completeness calculations
  const filledCount = SUPPORTED_LANGUAGES.filter((lang) => !!translations[lang]?.trim()).length;
  const completenessPercent = Math.round((filledCount / SUPPORTED_LANGUAGES.length) * 100);

  // Checks if a translation is missing
  const isMissing = (lang: SupportedLanguage) => {
    return !translations[lang] || translations[lang].trim() === '';
  };

  return (
    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-blue-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-800">Multilingual Translations</h4>
            <p className="text-[10px] text-slate-400">Configure translations across regional Indian languages.</p>
          </div>
        </div>

        {/* Translation completeness progress */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs shrink-0 select-none">
          {completenessPercent === 100 ? (
            <CheckCircle2 size={13} className="text-green-600" />
          ) : (
            <AlertTriangle size={13} className="text-amber-500 animate-pulse" />
          )}
          <span>
            Complete: <span className="text-slate-900 font-bold">{filledCount}/{SUPPORTED_LANGUAGES.length}</span> ({completenessPercent}%)
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const missing = isMissing(lang);
          const active = activeTab === lang;
          const isEn = lang === 'en';

          return (
            <button
              key={lang}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(lang)}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all focus:outline-none flex items-center gap-1.5 ${
                active
                  ? 'bg-white border-x border-t border-slate-200 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <span>{LANGUAGE_LABELS[lang]}</span>
              {/* Alert dots/warnings for non-English missing values, or red star for English */}
              {isEn ? (
                <span className="text-red-500 font-bold">*</span>
              ) : (
                missing && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    title="Translation missing"
                  />
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Text Area */}
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-inner">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {LANGUAGE_LABELS[activeTab]} Label Translation
          </label>
          <input
            type="text"
            disabled={disabled}
            value={translations[activeTab] || ''}
            onChange={(e) => handleTextChange(activeTab, e.target.value)}
            placeholder={`Enter label name in ${LANGUAGE_LABELS[activeTab]}...`}
            className={`w-full text-sm bg-slate-50/50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
              errors?.[activeTab] || (activeTab === 'en' && isMissing('en'))
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          {activeTab === 'en' && isMissing('en') && (
            <p className="text-[10px] font-semibold text-red-600">
              Default English label is mandatory.
            </p>
          )}
          {activeTab !== 'en' && isMissing(activeTab) && (
            <p className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
              <AlertTriangle size={10} className="shrink-0" />
              Missing Hindi/regional translation. Defaults to English label.
            </p>
          )}
          {errors?.[activeTab] && (
            <p className="text-[10px] font-semibold text-red-600">
              {errors[activeTab].message || errors[activeTab]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationInput;
