import React from 'react';
import { Clock, ExternalLink, Heart, MapPin, MessageCircle, Navigation, Phone, Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { RESTAURANT_BRANCHES } from '../utils/branchRouting';

interface InfoSectionProps {
  currentLang: Language;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ currentLang }) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  return (
    <section id="info-section" className="py-12 sm:py-16 bg-[#0A0A0A] border-t border-white/10 text-[#F5F5F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* About Story Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass text-[#D4AF37] text-xs font-semibold uppercase tracking-widest border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.aboutTitle}</span>
            </div>
            <h3 className="serif text-2xl sm:text-4xl font-bold text-[#F5F5F0] leading-tight">
              {isEs ? (
                <>
                  La Auténtica Tradición Culinaria de la India en <span className="text-[#D4AF37]">Quito & Cumbayá</span>
                </>
              ) : (
                <>
                  Authentic Culinary Heritage of India in <span className="text-[#D4AF37]">Quito & Cumbayá</span>
                </>
              )}
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans">
              {t.aboutStory}
            </p>
            <p className="text-sm text-white/60 leading-relaxed font-sans">
              {t.aboutStory2}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="#branches"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 transition-all uppercase tracking-wider"
              >
                <Store className="w-4 h-4 text-black" />
                <span>{isEs ? 'Ver Nuestras 2 Sucursales' : 'View Our 2 Branches'}</span>
              </a>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group dish-card">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="Sher E Punjab Ambiance"
                className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 dish-overlay" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="serif font-bold text-lg text-white">Sher E Punjab (Rincón de la India)</p>
                <p className="text-xs text-[#D4AF37]">2 Sucursales en Ecuador: Cumbayá & Quito Norte</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Branches Showcase Section */}
        <div id="branches" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="serif text-xl sm:text-3xl font-bold text-white">
              {isEs ? 'Nuestras Sucursales en Ecuador' : 'Our Branches in Ecuador'}
            </h3>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl mx-auto">
              {isEs
                ? 'Elige tu sucursal más cercana o ingresa tu dirección en el carrito para enrutamiento automático.'
                : 'Choose your nearest branch or enter your address in the cart for automatic routing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RESTAURANT_BRANCHES.map((branch) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`;
              return (
                <div
                  key={branch.id}
                  className="glass p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/40 transition-all space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="serif font-bold text-lg text-white">{branch.name}</h4>
                          <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">
                            {branch.sector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-white/70 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </p>

                    <div className="text-xs text-white/60 space-y-1 pl-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>12:00 PM – 9:30 PM (Lunes a Domingo)</span>
                      </div>
                      <div className="font-mono text-[11px] text-white/40">
                        GPS: {branch.latitude.toFixed(4)}°, {branch.longitude.toFixed(4)}°
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5 border-t border-white/10">
                    <a
                      href={`https://wa.me/${branch.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs shadow-md transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-black text-[#25D366]" />
                      <span>WhatsApp ({branch.whatsappFormatted})</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#D4AF37] font-semibold text-xs border border-white/10 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
