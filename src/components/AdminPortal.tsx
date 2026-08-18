import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Leaf,
  Lock,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { AddonOption, Category, Language, MenuItem, SpiceLevel } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import {
  compressImageFile,
  resetAdminPasswordWithMasterSecret,
  updateAdminPassword,
  verifyAdminPassword,
} from '../utils/storage';
import { DEFAULT_ADDONS, RESTAURANT_CONFIG } from '../data/seedData';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  categories: Category[];
  currentLang: Language;
  onSaveDish: (dish: MenuItem) => void;
  onDeleteDish: (dishId: string) => void;
  onToggleAvailability: (dishId: string) => void;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetDefaultMenu: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  menuItems,
  categories,
  currentLang,
  onSaveDish,
  onDeleteDish,
  onToggleAvailability,
  onSaveCategory,
  onDeleteCategory,
  onResetDefaultMenu,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Password reset flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showRecoveryNewPass, setShowRecoveryNewPass] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dishes' | 'categories' | 'settings'>('dishes');

  // Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');

  // Dish Form Modal
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  // Category Form Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameEs, setCatNameEs] = useState('');
  const [catNameEn, setCatNameEn] = useState('');

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Password Change in Settings
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [settingsPassSuccess, setSettingsPassSuccess] = useState(false);

  if (!isOpen) return null;

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError(t.adminInvalidPass);
    }
  };

  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || !newPassword.trim()) return;

    const success = resetAdminPasswordWithMasterSecret(recoveryCode, newPassword);
    if (success) {
      setRecoveryMsg({ type: 'success', text: t.adminPassResetSuccess });
      setTimeout(() => {
        setShowForgotModal(false);
        setRecoveryCode('');
        setNewPassword('');
        setRecoveryMsg(null);
      }, 1500);
    } else {
      setRecoveryMsg({ type: 'error', text: t.adminInvalidSecret });
    }
  };

  // --- Dish Edit Handlers ---
  const openNewDishForm = () => {
    setEditingDish({
      id: `dish_${Date.now()}`,
      nameEs: '',
      nameEn: '',
      descriptionEs: '',
      descriptionEn: '',
      price: 10.0,
      categoryId: categories[0]?.id || 'starters',
      imageUrl:
        'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
      isVegetarian: false,
      isChefSpecial: false,
      isAvailable: true,
      spiceCustomizable: true,
      defaultSpiceLevel: 'medium',
      availableAddons: DEFAULT_ADDONS,
    });
    setIsDishModalOpen(true);
  };

  const openEditDishForm = (dish: MenuItem) => {
    setEditingDish({ ...dish });
    setIsDishModalOpen(true);
  };

  const handleSaveDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    if (!editingDish.nameEs.trim()) {
      alert(isEs ? 'El nombre en español es requerido' : 'Spanish name is required');
      return;
    }
    onSaveDish(editingDish);
    setIsDishModalOpen(false);
    setEditingDish(null);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDish) return;
    try {
      const compressedBase64 = await compressImageFile(file);
      setEditingDish({ ...editingDish, imageUrl: compressedBase64 });
    } catch (err) {
      console.error('Error compressing image', err);
      alert(isEs ? 'Error al procesar la imagen' : 'Error processing image');
    }
  };

  // Filtered dishes
  const filteredDishes = menuItems.filter((dish) => {
    const matchesCat =
      adminCategoryFilter === 'all' || dish.categoryId === adminCategoryFilter;
    const matchesSearch =
      adminSearch.trim() === '' ||
      dish.nameEs.toLowerCase().includes(adminSearch.toLowerCase()) ||
      dish.nameEn.toLowerCase().includes(adminSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto text-[#F5F5F0] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#0E0E0E] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToMenu}</span>
          </button>
          <div className="h-5 w-px bg-white/10" />
          <h2 className="serif font-bold text-base sm:text-lg text-[#D4AF37] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.adminPortal}</span>
          </h2>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-rose-400 font-medium py-1 px-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.adminLogout}</span>
          </button>
        )}
      </div>

      {/* Login Screen if not authenticated */}
      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="serif text-2xl font-bold text-[#F5F5F0]">{t.adminLoginTitle}</h3>
              <p className="text-xs text-white/50">{t.adminLoginSub}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  {t.adminPasswordLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-3 pr-11 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 p-1 rounded-lg text-white/40 hover:text-[#D4AF37] focus:outline-none transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="text-xs font-medium text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/40">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/20"
              >
                {t.adminLoginBtn}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-white/40 hover:text-[#D4AF37] transition-colors"
              >
                {t.adminForgotPass}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dishes'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>{t.manageDishes}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
                {menuItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.manageCategories}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{t.restaurantSettings}</span>
            </button>
          </div>

          {/* TAB 1: DISHES */}
          {activeTab === 'dishes' && (
            <div className="space-y-4">
              {/* Filter & Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass p-4 rounded-2xl border border-white/10">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder={isEs ? 'Buscar plato...' : 'Search dish...'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]/60"
                    />
                  </div>

                  <select
                    value={adminCategoryFilter}
                    onChange={(e) => setAdminCategoryFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white/80 focus:outline-none focus:border-[#D4AF37]/60"
                  >
                    <option value="all" className="bg-[#141414] text-white">{t.allCategories}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#141414] text-white">
                        {isEs ? c.nameEs : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={openNewDishForm}
                  className="px-4 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/20 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addNewDish}</span>
                </button>
              </div>

              {/* Dish Table / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDishes.map((dish) => {
                  const cat = categories.find((c) => c.id === dish.categoryId);
                  return (
                    <div
                      key={dish.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        dish.isAvailable
                          ? 'glass border-white/10'
                          : 'bg-black/40 border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={dish.imageUrl}
                          alt={dish.nameEs}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 truncate">
                              {cat ? (isEs ? cat.nameEs : cat.nameEn) : dish.categoryId}
                            </span>
                            <span className="font-mono font-bold text-sm text-[#D4AF37]">
                              ${dish.price.toFixed(2)}
                            </span>
                          </div>
                          <h4 className="serif font-bold text-sm text-white truncate">
                            {dish.nameEs}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate">{dish.nameEn}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                        {/* Quick Availability Toggle */}
                        <button
                          onClick={() => onToggleAvailability(dish.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            dish.isAvailable
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
                          }`}
                        >
                          {dish.isAvailable ? t.available : t.outOfStock}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditDishForm(dish)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white/70 transition-colors border border-white/10"
                            title={t.editDish}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(dish.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600 text-white/40 hover:text-white transition-colors border border-white/10"
                            title={t.deleteDish}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex justify-between items-center glass p-4 rounded-2xl border border-white/10">
                <h3 className="serif font-bold text-base text-[#F5F5F0]">{t.manageCategories}</h3>
                <button
                  onClick={() => {
                    setEditingCategory({
                      id: `cat_${Date.now()}`,
                      nameEs: '',
                      nameEn: '',
                      order: categories.length + 1,
                    });
                    setCatNameEs('');
                    setCatNameEn('');
                    setIsCatModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs flex items-center gap-1.5 transition-all uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addNewCategory}</span>
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl glass border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="serif font-bold text-sm text-white">{cat.nameEs}</h4>
                      <p className="text-xs text-white/50">{cat.nameEn}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCatNameEs(cat.nameEs);
                          setCatNameEn(cat.nameEn);
                          setIsCatModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white/70 transition-colors border border-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600 text-white/40 hover:text-white transition-colors border border-white/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* WhatsApp Configuration Summary */}
              <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="serif font-bold text-base text-[#D4AF37]">
                  {isEs ? 'Configuración de WhatsApp de Pedidos' : 'WhatsApp Order Setup'}
                </h3>
                <div className="text-xs space-y-1.5 text-white/70 font-sans">
                  <p>
                    <span className="text-white/40">{isEs ? 'Número de Envío:' : 'Target Number:'}</span>{' '}
                    <span className="font-mono text-[#25D366] font-bold">
                      {RESTAURANT_CONFIG.whatsappFormatted} ({RESTAURANT_CONFIG.whatsappNumber})
                    </span>
                  </p>
                  <p>
                    <span className="text-white/40">{isEs ? 'Horario de Atención:' : 'Hours:'}</span>{' '}
                    <span className="font-medium text-white">
                      12:00 PM – 9:30 PM (Lunes a Domingo)
                    </span>
                  </p>
                  <p>
                    <span className="text-white/40">{isEs ? 'Costo de Envío:' : 'Delivery Fee:'}</span>{' '}
                    <span className="font-mono text-white">${RESTAURANT_CONFIG.deliveryFee.toFixed(2)} USD</span>
                  </p>
                </div>
              </div>

              {/* Change Password */}
              <div className="glass border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="serif font-bold text-base text-[#F5F5F0]">
                  {isEs ? 'Cambiar Contraseña de Administrador' : 'Change Admin Password'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      {isEs ? 'Nueva Contraseña' : 'New Password'}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showSettingsPassword ? 'text' : 'password'}
                        value={settingsNewPassword}
                        onChange={(e) => setSettingsNewPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSettingsPassword((prev) => !prev)}
                        className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-[#D4AF37] focus:outline-none transition-colors"
                        aria-label={showSettingsPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSettingsPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {settingsPassSuccess && (
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.adminPassResetSuccess}</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (!settingsNewPassword.trim()) return;
                      updateAdminPassword(settingsNewPassword);
                      setSettingsPassSuccess(true);
                      setSettingsNewPassword('');
                      setTimeout(() => setSettingsPassSuccess(false), 2500);
                    }}
                    className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs transition-colors uppercase tracking-wider"
                  >
                    {isEs ? 'Actualizar Contraseña' : 'Save New Password'}
                  </button>
                </div>
              </div>

              {/* Restore Defaults */}
              <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="serif font-bold text-base text-rose-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>{t.resetDefaultMenu}</span>
                </h3>
                <p className="text-xs text-white/50 leading-relaxed font-sans">
                  {t.resetDefaultMenuConfirm}
                </p>
                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-4 py-2 rounded-full bg-rose-950/80 border border-rose-700/60 hover:bg-rose-900 text-rose-200 font-bold text-xs transition-colors uppercase tracking-wider"
                >
                  {t.resetDefaultMenu}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: Add / Edit Dish --- */}
      {isDishModalOpen && editingDish && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsDishModalOpen(false)}
        >
          <div
            className="bg-[#0E0E0E] border border-white/10 glass rounded-3xl max-w-2xl w-full p-6 text-white my-8 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="serif text-lg font-bold text-[#F5F5F0]">
                {editingDish.nameEs ? t.editDish : t.addNewDish}
              </h3>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDishSubmit} className="space-y-4 text-xs font-sans">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishNameEs} <span className="text-[#FF6321]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingDish.nameEs}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, nameEs: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishNameEn}
                  </label>
                  <input
                    type="text"
                    value={editingDish.nameEn}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, nameEn: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishDescEs}
                  </label>
                  <textarea
                    value={editingDish.descriptionEs}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, descriptionEs: e.target.value })
                    }
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60 resize-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishDescEn}
                  </label>
                  <textarea
                    value={editingDish.descriptionEn}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, descriptionEn: e.target.value })
                    }
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60 resize-none"
                  />
                </div>
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishPrice} <span className="text-[#FF6321]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={editingDish.price}
                    onChange={(e) =>
                      setEditingDish({
                        ...editingDish,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    {t.dishCategory}
                  </label>
                  <select
                    value={editingDish.categoryId}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, categoryId: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#141414] text-white">
                        {isEs ? cat.nameEs : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Input (URL & File Upload) */}
              <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                <label className="block font-semibold text-[#D4AF37]">
                  {t.dishImage}
                </label>
                <div className="flex gap-3 items-center">
                  <img
                    src={editingDish.imageUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={editingDish.imageUrl}
                      onChange={(e) =>
                        setEditingDish({ ...editingDish, imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer text-xs transition-colors border border-white/10">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.dishImageUpload}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isVegetarian}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, isVegetarian: e.target.checked })
                    }
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-[11px] font-medium">{t.dishIsVeg}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isChefSpecial}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, isChefSpecial: e.target.checked })
                    }
                    className="rounded accent-amber-500"
                  />
                  <span className="text-[11px] font-medium">{t.dishIsChefSpecial}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.spiceCustomizable}
                    onChange={(e) =>
                      setEditingDish({
                        ...editingDish,
                        spiceCustomizable: e.target.checked,
                      })
                    }
                    className="rounded accent-orange-500"
                  />
                  <span className="text-[11px] font-medium">{t.dishSpiceCustom}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isAvailable}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, isAvailable: e.target.checked })
                    }
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-[11px] font-medium">{t.dishIsAvailable}</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 font-semibold border border-white/10"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold uppercase tracking-wider"
                >
                  {t.saveDish}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Category Edit --- */}
      {isCatModalOpen && editingCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsCatModalOpen(false)}
        >
          <div
            className="bg-[#0E0E0E] border border-white/10 glass rounded-2xl max-w-sm w-full p-5 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="serif text-base font-bold text-[#F5F5F0]">
              {editingCategory.nameEs ? t.manageCategories : t.addNewCategory}
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {t.categoryNameEs}
                </label>
                <input
                  type="text"
                  value={catNameEs}
                  onChange={(e) => setCatNameEs(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                  placeholder="Ej: Curries Especiales"
                />
              </div>
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {t.categoryNameEn}
                </label>
                <input
                  type="text"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                  placeholder="E.g., Special Curries"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-3 py-2 rounded-full bg-white/5 text-white/70 text-xs font-semibold border border-white/10"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!catNameEs.trim()) return;
                  onSaveCategory({
                    ...editingCategory,
                    nameEs: catNameEs.trim(),
                    nameEn: catNameEn.trim() || catNameEs.trim(),
                  });
                  setIsCatModalOpen(false);
                }}
                className="px-4 py-2 rounded-full bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider"
              >
                {t.saveCategory}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Delete Dish Confirmation --- */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-[#0E0E0E] border border-rose-500/40 glass rounded-2xl max-w-sm w-full p-6 text-white space-y-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="serif text-lg font-bold text-white">{t.deleteDish}</h3>
            <p className="text-xs text-white/60">{t.deleteConfirm}</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-full bg-white/5 text-white/70 font-semibold text-xs border border-white/10"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDeleteDish(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {t.deleteDish}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Reset Default Menu Confirmation --- */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="bg-[#0E0E0E] border border-[#D4AF37]/40 glass rounded-2xl max-w-sm w-full p-6 text-white space-y-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto border border-[#D4AF37]/30">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="serif text-lg font-bold text-white">{t.resetDefaultMenu}</h3>
            <p className="text-xs text-white/60">{t.resetDefaultMenuConfirm}</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-full bg-white/5 text-white/70 font-semibold text-xs border border-white/10"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onResetDefaultMenu();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs uppercase tracking-wider"
              >
                {t.resetDefaultMenu}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Forgot Password / Recovery --- */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="bg-[#0E0E0E] border border-white/10 glass rounded-2xl max-w-sm w-full p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="serif text-base font-bold text-white">{t.adminForgotPass}</h3>
            <form onSubmit={handlePasswordRecovery} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-white/80 font-medium mb-1">
                  {t.adminResetKeyPrompt}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showRecoveryCode ? 'text' : 'password'}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryCode((prev) => !prev)}
                    className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  >
                    {showRecoveryCode ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/80 font-medium mb-1">
                  {t.adminNewPassPrompt}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showRecoveryNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryNewPass((prev) => !prev)}
                    className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  >
                    {showRecoveryNewPass ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {recoveryMsg && (
                <p
                  className={`text-xs p-2 rounded-xl ${
                    recoveryMsg.type === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {recoveryMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 rounded-full bg-white/5 text-white/70 font-semibold border border-white/10"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#D4AF37] text-black font-bold uppercase tracking-wider"
                >
                  {t.adminResetBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
