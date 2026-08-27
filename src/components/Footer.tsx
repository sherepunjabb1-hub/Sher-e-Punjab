import React from 'react';
import { Lock, Shield, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { TRANSLATIONS } from '../utils/translations';
import { RestaurantLogo } from './RestaurantLogo';

interface FooterProps {
  currentLang: Language;
  onOpenAdmin: () => void;
  customLogoUrl?: string | null;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, onOpenAdmin, customLogoUrl }) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black/90 border-t border-white/10 text-white/50 py-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[#F5F5F0] font-serif font-bold text-base">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/40 flex items-center justify-center bg-[#120E06] p-0.5">
              <RestaurantLogo customLogoUrl={customLogoUrl} className="w-full h-full" />
            </div>
            <span>{RESTAURANT_CONFIG.name}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/60">
            <a
              href="#info-section"
              className="hover:text-[#D4AF37] transition-colors"
            >
              {isEs ? 'Acerca de Nosotros' : 'About Us'}
            </a>
            <a
              href={`https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4AF37] transition-colors"
            >
              WhatsApp ({RESTAURANT_CONFIG.whatsappFormatted})
            </a>
            <span className="text-white/20">•</span>
            <span className="text-white/40">Quito, Ecuador</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-[11px] uppercase tracking-wider">
          <p>
            © {year} Sher E Punjab (Rincón de la India). {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>

          {/* Discreet Admin Link */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1 text-white/30 hover:text-[#D4AF37] transition-colors"
            title="Admin Login Portal"
            aria-label="Portal de Administración"
          >
            <Lock className="w-3 h-3" />
            <span>{isEs ? 'Acceso Administrativo' : 'Admin Portal'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
