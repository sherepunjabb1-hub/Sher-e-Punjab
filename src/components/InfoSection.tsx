import React from 'react';
import { Clock, ExternalLink, Heart, MapPin, MessageCircle, Navigation, Phone, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { RESTAURANT_CONFIG } from '../data/seedData';

interface InfoSectionProps {
  currentLang: Language;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ currentLang }) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Sher E Punjab Rincon de la India Juan Leon Mera 2677 Quito Ecuador'
  )}`;

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
                  La Auténtica Tradición Culinaria de la India en el <span className="text-[#D4AF37]">Corazón de Quito</span>
                </>
              ) : (
                <>
                  Authentic Culinary Heritage of India in the <span className="text-[#D4AF37]">Heart of Quito</span>
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
                href={`https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#25D366]/20 transition-all uppercase tracking-wider"
              >
                <MessageCircle className="w-4 h-4 fill-black text-[#25D366]" />
                <span>{t.whatsappDirect}</span>
              </a>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass hover:bg-white/10 text-[#D4AF37] font-bold text-xs sm:text-sm border border-white/10 transition-all uppercase tracking-wider"
              >
                <Navigation className="w-4 h-4 text-[#D4AF37]" />
                <span>{isEs ? 'Ver en Google Maps' : 'View on Google Maps'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
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
                <p className="text-xs text-[#D4AF37]">Quito • La Mariscal / La Pinta</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Information Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location Pillar */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="serif font-bold text-base text-[#F5F5F0]">{isEs ? 'Nuestra Ubicación' : 'Our Location'}</h4>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
              {RESTAURANT_CONFIG.address}
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#e8ca68] font-semibold pt-1"
            >
              <span>{isEs ? 'Cómo Llegar' : 'Get Directions'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Schedule Pillar */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="serif font-bold text-base text-[#F5F5F0]">{t.scheduleTitle}</h4>
            <div className="text-xs sm:text-sm text-white/70 space-y-1 font-sans">
              <p className="font-semibold text-white">
                {isEs ? 'Lunes a Domingo' : 'Monday to Sunday'}
              </p>
              <p className="font-mono text-[#D4AF37] font-bold">12:00 PM – 9:30 PM</p>
              <p className="text-[11px] text-white/50 pt-1">
                {isEs ? 'Servicio continuo de almuerzo y cena' : 'Continuous lunch & dinner service'}
              </p>
            </div>
          </div>

          {/* Direct Orders & Contact */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="serif font-bold text-base text-[#F5F5F0]">{isEs ? 'Contacto & Pedidos' : 'Contact & Orders'}</h4>
            <div className="text-xs sm:text-sm text-white/70 space-y-1 font-sans">
              <p>
                <span className="text-white/40">WhatsApp: </span>
                <a
                  href={`https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-[#25D366] hover:underline"
                >
                  {RESTAURANT_CONFIG.whatsappFormatted}
                </a>
              </p>
              <p>
                <span className="text-white/40">{isEs ? 'Servicios: ' : 'Services: '}</span>
                <span className="text-white/80">
                  {isEs ? 'En Restaurante, Para Llevar, A Domicilio' : 'Dine-in, Takeout, Home Delivery'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
