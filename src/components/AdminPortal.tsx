import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  CreditCard,
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
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { AddonOption, Category, Language, MenuItem, OrderRecord, SpiceLevel } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { compressImageFile } from '../utils/storage';
import {
  MASTER_RECOVERY_CODE,
  resetAdminPasswordWithMasterSecretCloud,
  subscribeToOrders,
  updateAdminPasswordCloud,
  updateOrderPaymentInFirestore,
  updateOrderStatusInFirestore,
  verifyAdminPasswordCloud,
  verifyAdminPasswordFast,
} from '../utils/firebaseStorage';
import { DEFAULT_ADDONS, RESTAURANT_CONFIG } from '../data/seedData';
import { RestaurantLogo } from './RestaurantLogo';

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
  customLogoUrl?: string | null;
  heroBgUrl?: string | null;
  onSaveLogo?: (logoUrl: string | null) => Promise<void> | void;
  onResetLogo?: () => Promise<void> | void;
  onSaveHeroBg?: (bgUrl: string | null) => Promise<void> | void;
  onResetHeroBg?: () => Promise<void> | void;
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
  customLogoUrl,
  heroBgUrl,
  onSaveLogo,
  onResetLogo,
  onSaveHeroBg,
  onResetHeroBg,
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
  const [activeTab, setActiveTab] = useState<'dishes' | 'categories' | 'orders' | 'settings'>('dishes');

  // Live Orders
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToOrders((liveOrders) => {
        setOrders(liveOrders);
      });
      return () => unsub();
    }
  }, [isOpen]);

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

  // Option 1: Restaurant Logo / Branding Settings
  const [logoInputUrl, setLogoInputUrl] = useState(customLogoUrl || '');
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState(false);

  // Option 2: Hero Background Image Settings
  const [bgInputUrl, setBgInputUrl] = useState(heroBgUrl || '');
  const [isSavingBg, setIsSavingBg] = useState(false);
  const [bgSuccessMsg, setBgSuccessMsg] = useState(false);

  // Receipt image full-view modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    setLogoInputUrl(customLogoUrl || '');
  }, [customLogoUrl, isOpen]);

  useEffect(() => {
    setBgInputUrl(heroBgUrl || '');
  }, [heroBgUrl, isOpen]);

  if (!isOpen) return null;

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    const isValid = await verifyAdminPasswordCloud(passwordInput);
    if (isValid) {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError(t.adminInvalidPass);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || !newPassword.trim()) return;

    const success = await resetAdminPasswordWithMasterSecretCloud(recoveryCode, newPassword);
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
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Cloud className="w-3 h-3" />
            <span>{isEs ? 'Firebase En Vivo' : 'Firebase Live'}</span>
          </div>
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
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isEs ? 'Pedidos en Vivo' : 'Live Orders'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                orders.length > 0 ? 'bg-emerald-500 text-black font-bold' : 'bg-black/30'
              }`}>
                {orders.length}
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

          {/* TAB 3: LIVE ORDERS & MANUAL WHATSAPP VERIFICATIONS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 glass p-4 rounded-2xl border border-white/10">
                <div>
                  <h3 className="serif font-bold text-base text-[#F5F5F0]">
                    {isEs ? 'Pedidos y Verificación Manual de Pagos' : 'Orders & Manual Payment Verification'}
                  </h3>
                  <p className="text-xs text-white/50">
                    {isEs
                      ? 'Monitoreo en tiempo real de transferencias bancarias y pedidos en efectivo para verificar por WhatsApp'
                      : 'Real-time tracking of bank transfers and cash orders for manual verification via WhatsApp'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{orders.length} {isEs ? 'pedidos totales' : 'total orders'}</span>
                  </span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center glass rounded-2xl border border-white/10 space-y-2">
                  <ShoppingBag className="w-10 h-10 text-white/20 mx-auto" />
                  <p className="text-sm font-semibold text-white/70">
                    {isEs ? 'No hay pedidos recientes' : 'No recent orders'}
                  </p>
                  <p className="text-xs text-white/40">
                    {isEs
                      ? 'Los nuevos pedidos enviados por WhatsApp aparecerán automáticamente aquí para su verificación.'
                      : 'New orders placed via WhatsApp will automatically appear here for verification.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((order) => {
                    const isTransfer = order.paymentMethod === 'TRANSFER';
                    const isCard = order.paymentMethod === 'CARD' || order.paymentMethod === 'PAYPHONE';
                    const isVerified = order.paymentStatus === 'PAID' || order.isVerified;

                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl border space-y-3 relative overflow-hidden transition-all ${
                          isVerified
                            ? 'glass border-emerald-500/30'
                            : 'bg-black/60 border-amber-500/30 shadow-md shadow-amber-950/20'
                        }`}
                      >
                        {/* Top Bar: Order Number & Payment Status */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#D4AF37] text-sm">
                                {order.orderNumber}
                              </span>

                              {isCard ? (
                                isVerified ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isEs ? 'TARJETA PAGADA (PAYPHONE)' : 'CARD PAID (PAYPHONE)'}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span>{isEs ? 'TARJETA INT. (PAYPHONE)' : 'INT. CARD (PAYPHONE)'}</span>
                                  </span>
                                )
                              ) : isTransfer ? (
                                isVerified ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isEs ? 'TRANSFERENCIA VERIFICADA' : 'TRANSFER VERIFIED'}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    <span>{isEs ? 'PAGO POR VERIFICAR (PICHINCHA)' : 'PENDING VERIFICATION'}</span>
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                  {isEs ? 'EFECTIVO (CONTRA ENTREGA)' : 'CASH ON DELIVERY'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Status update selector */}
                          <select
                            value={order.status || 'RECEIVED'}
                            onChange={(e) =>
                              updateOrderStatusInFirestore(
                                order.id,
                                e.target.value as OrderRecord['status']
                              )
                            }
                            className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="RECEIVED">{isEs ? 'Recibido' : 'Received'}</option>
                            <option value="PREPARING">{isEs ? 'En Cocina' : 'Preparing'}</option>
                            <option value="ON_THE_WAY">{isEs ? 'En Camino' : 'On the Way'}</option>
                            <option value="DELIVERED">{isEs ? 'Entregado' : 'Delivered'}</option>
                            <option value="CANCELLED">{isEs ? 'Cancelado' : 'Cancelled'}</option>
                          </select>
                        </div>

                        {/* Customer & Delivery Details */}
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs">
                          <div className="flex justify-between text-white/90 font-medium">
                            <span className="font-semibold">{order.customer?.customerName || 'Cliente'}</span>
                            <a
                              href={`https://wa.me/${(order.customer?.customerPhone || '').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
                              title="Chat directo de WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{order.customer?.customerPhone || ''}</span>
                            </a>
                          </div>
                          {order.customer?.deliveryAddress && (
                            <div className="text-[11px] text-white/60 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{order.customer.deliveryAddress}</span>
                            </div>
                          )}
                          {order.customer?.liveLocation?.mapsUrl && (
                            <div className="text-[10px] text-emerald-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                              <a
                                href={order.customer.liveLocation.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-white"
                              >
                                {isEs ? 'Ver ubicación GPS en vivo en Google Maps' : 'View live GPS on Maps'}
                              </a>
                            </div>
                          )}
                          {order.customer?.tableNumber && (
                            <div className="text-[11px] text-amber-300">
                              {isEs ? 'Mesa:' : 'Table:'} #{order.customer.tableNumber}
                            </div>
                          )}
                          {order.customer?.assignedBranch && (
                            <div className="text-[10px] text-white/40">
                              {isEs ? 'Sucursal:' : 'Branch:'} {order.customer.assignedBranch.name}
                            </div>
                          )}
                          {order.customer?.orderNotes && (
                            <div className="text-[11px] text-amber-200/80 italic pt-0.5">
                              "{order.customer.orderNotes}"
                            </div>
                          )}
                        </div>

                        {/* Payment & Receipt Verification Information */}
                        {(order.transferTransactionId || order.receiptImageData || order.cashBillAmount) && (
                          <div className="p-2.5 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-2 text-xs">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center justify-between">
                              <span>{isEs ? 'Datos de Pago y Comprobante' : 'Payment & Receipt Details'}</span>
                              {order.receiptImageData && (
                                <span className="text-emerald-400 font-normal normal-case flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{isEs ? 'Foto adjunta' : 'Photo attached'}</span>
                                </span>
                              )}
                            </div>

                            {order.transferTransactionId && (
                              <div className="flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span className="text-white/60 text-[11px]">{isEs ? 'ID Transacción / Comprobante:' : 'Transaction ID / Receipt #:'}</span>
                                <span className="font-mono font-bold text-[#D4AF37] text-xs">
                                  {order.transferTransactionId}
                                </span>
                              </div>
                            )}

                            {order.cashBillAmount && (
                              <div className="flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span className="text-white/60 text-[11px]">{isEs ? 'Paga con billete de:' : 'Paying with bill:'}</span>
                                <span className="font-mono font-bold text-emerald-400 text-xs">
                                  {order.cashBillAmount}
                                </span>
                              </div>
                            )}

                            {order.receiptImageData && (
                              <div className="flex items-center gap-2 pt-1">
                                <div
                                  onClick={() => setPreviewReceiptUrl(order.receiptImageData || null)}
                                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/20 hover:border-[#D4AF37] transition-all w-20 h-16 bg-black shrink-0"
                                >
                                  <img
                                    src={order.receiptImageData}
                                    alt="Comprobante"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <Eye className="w-4 h-4 text-white drop-shadow" />
                                  </div>
                                </div>
                                <div className="text-[11px] text-white/70">
                                  <div className="font-semibold text-white">
                                    {order.receiptFileName || (isEs ? 'Comprobante de Transferencia' : 'Transfer Receipt')}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceiptUrl(order.receiptImageData || null)}
                                    className="text-[#D4AF37] hover:underline text-[10px] flex items-center gap-1 font-medium mt-0.5 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{isEs ? 'Ver comprobante en grande' : 'View full receipt image'}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Itemized list */}
                        <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-white/80 py-0.5">
                              <span>
                                <span className="font-bold text-[#D4AF37]">{item.quantity}x</span>{' '}
                                {isEs ? item.nameEs : item.nameEn}
                                {item.spiceLevel && (
                                  <span className="text-[10px] text-amber-400/80 ml-1">
                                    ({item.spiceLevel})
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-white/60">
                                ${(item.totalUnitPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Manual Verification Action Buttons */}
                        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {/* Payment status toggle button */}
                          <div className="flex items-center gap-2">
                            {isVerified ? (
                              <button
                                type="button"
                                onClick={() => updateOrderPaymentInFirestore(order.id, 'PENDING', false)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] border border-white/10 transition-colors"
                              >
                                {isEs ? 'Marcar como pendiente' : 'Mark as pending'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateOrderPaymentInFirestore(order.id, 'PAID', true, 'PREPARING')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isEs ? 'Verificar Comprobante y Enviar a Cocina' : 'Verify Receipt & Send to Kitchen'}</span>
                              </button>
                            )}
                          </div>

                          <div className="text-right ml-auto">
                            <span className="text-white/60 text-[11px] mr-1">{isEs ? 'Total:' : 'Total:'}</span>
                            <span className="font-mono font-bold text-sm text-[#D4AF37]">
                              ${order.total.toFixed(2)} USD
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* OPTION 1: RESTAURANT LOGO (HEADER & BADGES) */}
              <div className="glass border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/40">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="serif font-bold text-base text-[#F5F5F0]">
                        {isEs ? 'Opción 1: Logotipo del Restaurante' : 'Option 1: Restaurant Logo'}
                      </h3>
                      <p className="text-[11px] text-white/50">
                        {isEs
                          ? 'Se muestra en la barra de navegación superior, pie de página y distintivos oficiales.'
                          : 'Displayed in the top navigation header, footer badge, and official crests.'}
                      </p>
                    </div>
                  </div>
                  {customLogoUrl ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/40 uppercase tracking-wider">
                      {isEs ? 'Personalizado' : 'Custom'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                      {isEs ? 'Escudo Oficial' : 'Official Crest'}
                    </span>
                  )}
                </div>

                {/* Logo Live Preview */}
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/20 bg-[#120E06] flex items-center justify-center p-1 shrink-0">
                    <RestaurantLogo customLogoUrl={logoInputUrl || customLogoUrl} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-[#F5F5F0]">
                      {isEs ? 'Vista Previa en Barra Superior' : 'Top Bar Badge Preview'}
                    </p>
                    <p className="text-white/50 text-[11px]">
                      {isEs
                        ? 'El logotipo se adapta de forma nítida en formato circular dorado.'
                        : 'The logo adapts crisply inside the golden emblem.'}
                    </p>
                  </div>
                </div>

                {/* Input & Upload Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      {isEs ? 'Subir Archivo de Logotipo o Pegar URL' : 'Upload Logo File or Enter URL'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={logoInputUrl}
                        onChange={(e) => setLogoInputUrl(e.target.value)}
                        placeholder="https://... o sube imagen PNG/JPG"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/60"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer text-xs font-semibold shrink-0 transition-colors border border-white/10">
                        <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{isEs ? 'Subir' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImageFile(file, 600, 600, 0.85);
                              setLogoInputUrl(compressed);
                            } catch (err) {
                              console.error('Error compressing logo', err);
                              alert(isEs ? 'Error al procesar la imagen' : 'Error processing logo image');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {logoSuccessMsg && (
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isEs ? '¡Logotipo actualizado exitosamente!' : 'Logo successfully updated!'}</span>
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSavingLogo}
                      onClick={async () => {
                        setIsSavingLogo(true);
                        try {
                          if (onSaveLogo) {
                            await onSaveLogo(logoInputUrl.trim() || null);
                          }
                          setLogoSuccessMsg(true);
                          setTimeout(() => setLogoSuccessMsg(false), 3000);
                        } catch (err) {
                          console.error('Error saving logo', err);
                        } finally {
                          setIsSavingLogo(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs transition-all uppercase tracking-wider disabled:opacity-50 shadow-md shadow-[#D4AF37]/20"
                    >
                      {isSavingLogo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{isEs ? 'Guardando...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Guardar Logotipo' : 'Save Logo'}</span>
                        </>
                      )}
                    </button>

                    {(customLogoUrl || logoInputUrl) && (
                      <button
                        type="button"
                        onClick={async () => {
                          setLogoInputUrl('');
                          if (onResetLogo) {
                            await onResetLogo();
                          }
                          setLogoSuccessMsg(true);
                          setTimeout(() => setLogoSuccessMsg(false), 3000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors border border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Restablecer Escudo Oficial' : 'Reset to Official Crest'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OPTION 2: FULL-BLEED HERO BACKGROUND IMAGE */}
              <div className="glass border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FF6321]/20 text-[#FF6321] flex items-center justify-center border border-[#FF6321]/40">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="serif font-bold text-base text-[#F5F5F0]">
                        {isEs ? 'Opción 2: Imagen de Fondo de Portada Completa' : 'Option 2: Full-Bleed Hero Background Image'}
                      </h3>
                      <p className="text-[11px] text-white/50">
                        {isEs
                          ? 'Cubre y llena la totalidad del fondo de la portada con un degradado cinematográfico.'
                          : 'Completely fulfills the entire hero banner background with cinematic dark overlays.'}
                      </p>
                    </div>
                  </div>
                  {heroBgUrl ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#FF6321]/20 text-[#FF6321] text-[10px] font-bold border border-[#FF6321]/40 uppercase tracking-wider">
                      {isEs ? 'Fondo Activo' : 'Active Background'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                      {isEs ? 'Degradado Oscuro' : 'Default Dark Mesh'}
                    </span>
                  )}
                </div>

                {/* Hero Background Live Panoramic Preview */}
                <div className="relative rounded-xl overflow-hidden border border-white/15 h-36 bg-[#0A0A0A] flex items-center justify-center">
                  {(bgInputUrl || heroBgUrl) ? (
                    <>
                      <img
                        src={(bgInputUrl || heroBgUrl)!}
                        alt="Hero Background Preview"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-[#0A0A0A]" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-[#0A0A0A] to-[#0A0A0A]" />
                  )}

                  <div className="relative z-10 text-center px-4 space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold bg-black/60 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                      {isEs ? 'Simulación de Portada' : 'Hero Banner Simulation'}
                    </span>
                    <p className="serif text-sm font-bold text-white drop-shadow-md">
                      {isEs ? 'Descubre el Arte del Horno Tandoor' : 'Experience Authentic Tandoori Delicacies'}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {isEs ? 'El fondo se expande al 100% cubriendo toda la pantalla' : 'The background spans 100% full-bleed'}
                    </p>
                  </div>
                </div>

                {/* Input & Upload Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      {isEs ? 'Subir Imagen de Fondo o Pegar URL' : 'Upload Background Image or Enter URL'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={bgInputUrl}
                        onChange={(e) => setBgInputUrl(e.target.value)}
                        placeholder="https://... o sube foto panorámica PNG/JPG"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF6321]/60"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer text-xs font-semibold shrink-0 transition-colors border border-white/10">
                        <Upload className="w-3.5 h-3.5 text-[#FF6321]" />
                        <span>{isEs ? 'Subir' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImageFile(file, 1920, 1080, 0.85);
                              setBgInputUrl(compressed);
                            } catch (err) {
                              console.error('Error compressing hero background', err);
                              alert(isEs ? 'Error al procesar la imagen de fondo' : 'Error processing background image');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {bgSuccessMsg && (
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isEs ? '¡Fondo de portada actualizado exitosamente!' : 'Hero background successfully updated!'}</span>
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSavingBg}
                      onClick={async () => {
                        setIsSavingBg(true);
                        try {
                          if (onSaveHeroBg) {
                            await onSaveHeroBg(bgInputUrl.trim() || null);
                          }
                          setBgSuccessMsg(true);
                          setTimeout(() => setBgSuccessMsg(false), 3000);
                        } catch (err) {
                          console.error('Error saving hero background', err);
                        } finally {
                          setIsSavingBg(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6321] hover:bg-[#e05417] text-white font-bold text-xs transition-all uppercase tracking-wider disabled:opacity-50 shadow-md shadow-[#FF6321]/20"
                    >
                      {isSavingBg ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{isEs ? 'Guardando...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Guardar Fondo de Portada' : 'Save Hero Background'}</span>
                        </>
                      )}
                    </button>

                    {(heroBgUrl || bgInputUrl) && (
                      <button
                        type="button"
                        onClick={async () => {
                          setBgInputUrl('');
                          if (onResetHeroBg) {
                            await onResetHeroBg();
                          }
                          setBgSuccessMsg(true);
                          setTimeout(() => setBgSuccessMsg(false), 3000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors border border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isEs ? 'Restablecer Fondo Oscuro' : 'Reset to Dark Theme'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                    onClick={async () => {
                      if (!settingsNewPassword.trim()) return;
                      await updateAdminPasswordCloud(settingsNewPassword);
                      setSettingsPassSuccess(true);
                      setSettingsNewPassword('');
                      setTimeout(() => setSettingsPassSuccess(false), 2500);
                    }}
                    className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs transition-colors uppercase tracking-wider"
                  >
                    {isEs ? 'Actualizar Contraseña en la Nube' : 'Save New Cloud Password'}
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

      {/* Receipt Image Full Preview Modal */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="bg-[#0E0E0E] border border-white/20 glass rounded-2xl max-w-2xl w-full p-4 sm:p-5 text-white space-y-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>{isEs ? 'Comprobante de Transferencia' : 'Transfer Receipt Verification'}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl bg-black border border-white/10 flex items-center justify-center p-2">
              <img
                src={previewReceiptUrl}
                alt="Comprobante completo"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-white/60 pt-1">
              <span>{isEs ? 'Verifica el número de referencia y monto antes de enviar a cocina.' : 'Check reference and amount before sending to kitchen.'}</span>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
              >
                {isEs ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
