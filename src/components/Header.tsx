import React, { useEffect, useState } from 'react';
import { Clock, Globe, MapPin, Phone, Shield, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getRestaurantStatus, RestaurantStatus } from '../utils/time';
import { RESTAURANT_CONFIG } from '../data/seedData';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAdmin: () => void;
  onOpenInfo: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenAdmin,
  onOpenInfo,
  cartCount,
  onOpenCart,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [status, setStatus] = useState<RestaurantStatus>(getRestaurantStatus());
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getRestaurantStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 text-[#F5F5F0] transition-all">
      {/* Top micro banner */}
      <div className="bg-black/60 py-1.5 px-4 border-b border-white/5 text-[11px] text-white/50 flex justify-between items-center max-w-7xl mx-auto tracking-wide">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate hidden sm:inline">{RESTAURANT_CONFIG.address}</span>
          <span className="sm:hidden font-medium">Quito, Ecuador</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={`tel:${RESTAURANT_CONFIG.whatsappNumber}`}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#e8ca68] transition-colors font-medium"
          >
            <Phone className="w-3 h-3" />
            <span>{RESTAURANT_CONFIG.whatsappFormatted}</span>
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={onOpenInfo}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform shrink-0 bg-[#120E06] flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Sher E Punjab Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to stylized 'S' if image fails
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F0]">
                Sher E Punjab
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/60 font-sans truncate max-w-[200px] sm:max-w-md">
              Rincón de la India | Quito
            </p>
          </div>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Live Status indicator */}
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider transition-all ${
              status.isOpen
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title={currentLang === 'es' ? status.nextOpenTextEs : status.nextOpenTextEn}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status.isOpen ? 'bg-green-500 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="hidden xs:inline">
              {currentLang === 'es' ? status.statusTextEs : status.statusTextEn}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
            <button
              onClick={() => onLanguageChange('es')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                currentLang === 'es'
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              aria-label="Cambiar idioma a Español"
            >
              ES
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                currentLang === 'en'
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              aria-label="Switch language to English"
            >
              EN
            </button>
          </div>

          {/* Admin discreet portal link */}
          <button
            onClick={onOpenAdmin}
            className="p-2 text-white/40 hover:text-[#D4AF37] rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            title={t.adminPortal}
            aria-label="Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Operating Hours Modal */}
      {showStatusModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-1">
              {currentLang === 'es' ? 'Horario de Atención' : 'Operating Schedule'}
            </h3>
            <p className="text-xs text-[#D4AF37] font-medium mb-3">
              {currentLang === 'es' ? 'Hora de Quito, Ecuador (GMT-5)' : 'Quito, Ecuador Local Time (GMT-5)'}
            </p>
            <div className="bg-black/60 rounded-xl p-4 border border-white/10 text-sm space-y-2 mb-5">
              <div className="flex justify-between items-center text-white/80">
                <span>{currentLang === 'es' ? 'Lunes – Domingo' : 'Monday – Sunday'}</span>
                <span className="font-semibold text-[#D4AF37]">12:00 PM – 9:30 PM</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-xs text-white/50">
                <span>{currentLang === 'es' ? 'Hora actual en Quito:' : 'Current time in Quito:'}</span>
                <span className="font-mono text-white/80">{status.currentEcuadorTime}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span>{currentLang === 'es' ? 'Estado:' : 'Status:'}</span>
                <span
                  className={`font-bold ${status.isOpen ? 'text-green-400' : 'text-rose-400'}`}
                >
                  {currentLang === 'es'
                    ? `${status.statusTextEs} (${status.nextOpenTextEs})`
                    : `${status.statusTextEn} (${status.nextOpenTextEn})`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-sm transition-colors uppercase tracking-wider"
            >
              {currentLang === 'es' ? 'Entendido' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
