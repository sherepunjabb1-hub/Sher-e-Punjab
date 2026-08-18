import React, { useEffect, useMemo, useState } from 'react';
import {
  AddonOption,
  CartItem,
  Category,
  Language,
  MenuItem,
  SpiceLevel,
} from './types';
import {
  clearStoredCart,
  getStoredCart,
  getStoredCategories,
  getStoredMenuItems,
  resetToSeedData,
  setStoredCart,
  setStoredCategories,
  setStoredMenuItems,
} from './utils/storage';
import { TRANSLATIONS } from './utils/translations';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { MenuCard } from './components/MenuCard';
import { DishCustomizationModal } from './components/DishCustomizationModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { CartDrawer } from './components/CartDrawer';
import { AdminPortal } from './components/AdminPortal';
import { InfoSection } from './components/InfoSection';
import { Footer } from './components/Footer';

export default function App() {
  // Language preferences
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('sherepunjab_lang');
    return saved === 'en' ? 'en' : 'es';
  });

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('sherepunjab_lang', lang);
  };

  const t = TRANSLATIONS[currentLang];

  // Menu data state
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenuItems());

  // Customer Cart state
  const [cart, setCart] = useState<CartItem[]>(() => getStoredCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filters & Search
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non_veg' | 'specials'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Navigation
  const [customizingDish, setCustomizingDish] = useState<MenuItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Synchronize URL Hash for hidden Admin access (e.g., /#admin)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  // Cart total calculations
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalUnitPrice * item.quantity, 0);
  }, [cart]);

  // Cart item count per dish ID (for inline card controls)
  const dishQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((c) => {
      map[c.dishId] = (map[c.dishId] || 0) + c.quantity;
    });
    return map;
  }, [cart]);

  // Cart Operations
  const handleAddToCart = (
    dish: MenuItem,
    spiceLevel: SpiceLevel | undefined,
    selectedAddons: AddonOption[],
    specialInstructions: string,
    quantity: number
  ) => {
    const addonsKey = [...selectedAddons]
      .map((a) => a.id)
      .sort()
      .join(',');
    const cartItemId = `${dish.id}_spice:${spiceLevel || 'default'}_addons:${addonsKey}_note:${specialInstructions.trim()}`;

    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const totalUnitPrice = dish.price + addonsTotal;

    const existingIndex = cart.findIndex((c) => c.cartItemId === cartItemId);
    let newCart: CartItem[];

    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [
        ...cart,
        {
          cartItemId,
          dishId: dish.id,
          nameEs: dish.nameEs,
          nameEn: dish.nameEn,
          basePrice: dish.price,
          totalUnitPrice,
          spiceLevel,
          selectedAddons,
          specialInstructions,
          quantity,
          imageUrl: dish.imageUrl,
        },
      ];
    }

    setCart(newCart);
    setStoredCart(newCart);
  };

  const handleQuickAdd = (dish: MenuItem) => {
    // Quick add default version of dish
    handleAddToCart(
      dish,
      dish.defaultSpiceLevel || 'medium',
      [],
      '',
      1
    );
  };

  const handleQuickRemove = (dish: MenuItem) => {
    // Find the first cart item matching this dish id and decrement
    const targetItem = cart.find((c) => c.dishId === dish.id);
    if (!targetItem) return;

    if (targetItem.quantity > 1) {
      const newCart = cart.map((c) =>
        c.cartItemId === targetItem.cartItemId ? { ...c, quantity: c.quantity - 1 } : c
      );
      setCart(newCart);
      setStoredCart(newCart);
    } else {
      const newCart = cart.filter((c) => c.cartItemId !== targetItem.cartItemId);
      setCart(newCart);
      setStoredCart(newCart);
    }
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    let newCart: CartItem[];
    if (newQty <= 0) {
      newCart = cart.filter((c) => c.cartItemId !== cartItemId);
    } else {
      newCart = cart.map((c) => (c.cartItemId === cartItemId ? { ...c, quantity: newQty } : c));
    }
    setCart(newCart);
    setStoredCart(newCart);
  };

  const handleRemoveItem = (cartItemId: string) => {
    const newCart = cart.filter((c) => c.cartItemId !== cartItemId);
    setCart(newCart);
    setStoredCart(newCart);
  };

  const handleClearCart = () => {
    setCart([]);
    clearStoredCart();
  };

  // Admin Data Operations
  const handleSaveDish = (updatedDish: MenuItem) => {
    const exists = menuItems.some((d) => d.id === updatedDish.id);
    let newMenu: MenuItem[];
    if (exists) {
      newMenu = menuItems.map((d) => (d.id === updatedDish.id ? updatedDish : d));
    } else {
      newMenu = [updatedDish, ...menuItems];
    }
    setMenuItems(newMenu);
    setStoredMenuItems(newMenu);
  };

  const handleDeleteDish = (dishId: string) => {
    const newMenu = menuItems.filter((d) => d.id !== dishId);
    setMenuItems(newMenu);
    setStoredMenuItems(newMenu);
  };

  const handleToggleAvailability = (dishId: string) => {
    const newMenu = menuItems.map((d) =>
      d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d
    );
    setMenuItems(newMenu);
    setStoredMenuItems(newMenu);
  };

  const handleSaveCategory = (category: Category) => {
    const exists = categories.some((c) => c.id === category.id);
    let newCats: Category[];
    if (exists) {
      newCats = categories.map((c) => (c.id === category.id ? category : c));
    } else {
      newCats = [...categories, category];
    }
    setCategories(newCats);
    setStoredCategories(newCats);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const newCats = categories.filter((c) => c.id !== categoryId);
    setCategories(newCats);
    setStoredCategories(newCats);
  };

  const handleResetDefaultMenu = () => {
    const res = resetToSeedData();
    setMenuItems(res.menu);
    setCategories(res.categories);
  };

  // Filtered Menu Items for Customer Display
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((dish) => {
      // 1. Category Filter
      if (activeCategoryId !== 'all' && dish.categoryId !== activeCategoryId) {
        return false;
      }

      // 2. Dietary Filter
      if (dietaryFilter === 'veg' && !dish.isVegetarian) return false;
      if (dietaryFilter === 'non_veg' && dish.isVegetarian) return false;
      if (dietaryFilter === 'specials' && !dish.isChefSpecial) return false;

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName =
          dish.nameEs.toLowerCase().includes(q) ||
          dish.nameEn.toLowerCase().includes(q);
        const matchesDesc =
          dish.descriptionEs.toLowerCase().includes(q) ||
          dish.descriptionEn.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [menuItems, activeCategoryId, dietaryFilter, searchQuery]);

  // Grouped Menu Items by Category for "All" view
  const groupedCategories = useMemo(() => {
    if (activeCategoryId !== 'all') {
      const activeCat = categories.find((c) => c.id === activeCategoryId);
      if (!activeCat) return [];
      const itemsInCat = filteredMenuItems.filter((item) => item.categoryId === activeCat.id);
      return [{ category: activeCat, items: itemsInCat }];
    }

    return categories
      .map((cat) => ({
        category: cat,
        items: filteredMenuItems.filter((item) => item.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredMenuItems, activeCategoryId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Sticky Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenInfo={() => {
          document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Presentation & Search */}
      <HeroBanner
        currentLang={currentLang}
        onExploreClick={() => {
          document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category Filter & Navigation */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        dietaryFilter={dietaryFilter}
        onSelectDietaryFilter={setDietaryFilter}
        currentLang={currentLang}
      />

      {/* Menu Cards Section */}
      <main id="menu-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {groupedCategories.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-zinc-900/40 rounded-3xl border border-zinc-850 p-8">
            <p className="font-serif text-xl font-bold text-zinc-300">
              {currentLang === 'es'
                ? 'No se encontraron platos con los filtros seleccionados'
                : 'No dishes found matching the selected filters'}
            </p>
            <p className="text-xs text-zinc-500">
              {currentLang === 'es'
                ? 'Intenta restablecer la búsqueda o seleccionar otra categoría.'
                : 'Try clearing your search or selecting another category.'}
            </p>
            <button
              onClick={() => {
                setActiveCategoryId('all');
                setDietaryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
            >
              {currentLang === 'es' ? 'Ver todo el menú' : 'View all menu'}
            </button>
          </div>
        ) : (
          groupedCategories.map(({ category, items }) => (
            <section key={category.id} className="space-y-5">
              {/* Category Section Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{currentLang === 'es' ? category.nameEs : category.nameEn}</span>
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500 font-semibold">
                  {items.length} {currentLang === 'es' ? 'platos' : 'dishes'}
                </span>
              </div>

              {/* Dish Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {items.map((dish) => (
                  <MenuCard
                    key={dish.id}
                    item={dish}
                    currentLang={currentLang}
                    quantityInCart={dishQuantities[dish.id] || 0}
                    onQuickAdd={handleQuickAdd}
                    onQuickRemove={handleQuickRemove}
                    onOpenCustomize={setCustomizingDish}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating Bottom Cart Pill */}
      <FloatingCartButton
        itemCount={totalCartCount}
        totalAmount={totalCartAmount}
        onClick={() => setIsCartOpen(true)}
        currentLang={currentLang}
      />

      {/* Dish Customization Modal */}
      <DishCustomizationModal
        item={customizingDish}
        currentLang={currentLang}
        onClose={() => setCustomizingDish(null)}
        onAddToCart={handleAddToCart}
      />

      {/* WhatsApp Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currentLang={currentLang}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Admin Management Portal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        menuItems={menuItems}
        categories={categories}
        currentLang={currentLang}
        onSaveDish={handleSaveDish}
        onDeleteDish={handleDeleteDish}
        onToggleAvailability={handleToggleAvailability}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetDefaultMenu={handleResetDefaultMenu}
      />

      {/* About, Location & Operating Hours Section */}
      <InfoSection currentLang={currentLang} />

      {/* Footer with Discreet Admin link */}
      <Footer
        currentLang={currentLang}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
