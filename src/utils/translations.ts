import { Language, ServiceType, SpiceLevel } from '../types';

export interface Translations {
  restaurantName: string;
  subTitle: string;
  openNow: string;
  closedNow: string;
  hoursNote: string;
  callUs: string;
  ourLocation: string;
  searchPlaceholder: string;
  allCategories: string;
  allDiet: string;
  vegOnly: string;
  nonVegOnly: string;
  chefSpecials: string;
  available: string;
  outOfStock: string;
  add: string;
  customize: string;
  spiceLevel: string;
  spiceMild: string;
  spiceMedium: string;
  spiceHot: string;
  spiceExtraHot: string;
  companionTitle: string;
  companionSubtitle: string;
  softDrinkTitle: string;
  softDrinkSubtitle: string;
  addonsTitle: string;
  specialInstructions: string;
  specialInstructionsPlaceholder: string;
  addToOrder: string;
  viewCart: string;
  cartTitle: string;
  cartEmpty: string;
  cartEmptySub: string;
  exploreMenu: string;
  serviceType: string;
  serviceDineIn: string;
  serviceTakeout: string;
  serviceDelivery: string;
  customerName: string;
  customerIdLabel: string;
  customerIdPlaceholder: string;
  customerPhone: string;
  customerEmail: string;
  customerEmailPlaceholder: string;
  deliveryAddress: string;
  deliveryAddressPlaceholder: string;
  tableNumber: string;
  tableNumberPlaceholder: string;
  orderNotes: string;
  orderNotesPlaceholder: string;
  subtotal: string;
  deliveryFee: string;
  freeDelivery: string;
  total: string;
  sendWhatsAppOrder: string;
  orderRedirectNotice: string;
  orderClearedNotice: string;
  adminPortal: string;
  adminLoginTitle: string;
  adminLoginSub: string;
  adminPasswordLabel: string;
  adminLoginBtn: string;
  adminForgotPass: string;
  adminResetKeyPrompt: string;
  adminNewPassPrompt: string;
  adminResetBtn: string;
  adminInvalidPass: string;
  adminInvalidSecret: string;
  adminPassResetSuccess: string;
  adminLogout: string;
  manageDishes: string;
  manageCategories: string;
  restaurantSettings: string;
  addNewDish: string;
  editDish: string;
  deleteDish: string;
  deleteConfirm: string;
  dishNameEs: string;
  dishNameEn: string;
  dishDescEs: string;
  dishDescEn: string;
  dishPrice: string;
  dishCategory: string;
  dishImage: string;
  dishImageUrl: string;
  dishImageUpload: string;
  dishSpiceCustom: string;
  dishIsVeg: string;
  dishIsChefSpecial: string;
  dishIsAvailable: string;
  saveDish: string;
  cancel: string;
  resetDefaultMenu: string;
  resetDefaultMenuConfirm: string;
  categoryNameEs: string;
  categoryNameEn: string;
  addNewCategory: string;
  saveCategory: string;
  aboutTitle: string;
  aboutStory: string;
  aboutStory2: string;
  scheduleTitle: string;
  whatsappDirect: string;
  orderNow: string;
  currency: string;
  backToMenu: string;
  requiredField: string;
  fillRequiredFields: string;
  useLiveLocation: string;
  detectingLocation: string;
  locationAttached: string;
  removeLocation: string;
  openInGoogleMaps: string;
  gpsAccuracy: string;
  locationErrorPermission: string;
  locationOptionalHint: string;
  assignedBranchLabel: string;
  calculatingBranch: string;
  changeBranchManual: string;
  autoMatchedBranch: string;
  manualBranchBadge: string;
  selectBranchPrompt: string;
  findBranchBtn: string;
  addressGeocodingHelp: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    restaurantName: 'Sher E Punjab (Rincón de la India)',
    subTitle: 'Auténtica Cocina India en Quito • Sabor Tradicional y Especias de la India',
    openNow: 'Abierto Ahora',
    closedNow: 'Cerrado Ahora',
    hoursNote: 'Lunes a Domingo: 12:00 PM – 9:30 PM (Hora Ecuador)',
    callUs: 'Llamar',
    ourLocation: 'Juan León Mera 2677 y La Pinta, Quito',
    searchPlaceholder: 'Buscar platos, curries, samosas, naan...',
    allCategories: 'Todo el Menú',
    allDiet: 'Todos',
    vegOnly: 'Vegetariano',
    nonVegOnly: 'Con Carne / Pollo',
    chefSpecials: 'Especiales del Chef',
    available: 'Disponible',
    outOfStock: 'Agotado',
    add: 'AGREGAR',
    customize: 'Personalizar',
    spiceLevel: 'Nivel de Picante',
    spiceMild: 'Suave (Mild)',
    spiceMedium: 'Medio (Medium)',
    spiceHot: 'Picante (Hot)',
    spiceExtraHot: 'Muy Picante (Extra Hot)',
    companionTitle: 'Acompañamiento Incluido (Elige 1)',
    companionSubtitle: 'Selecciona 1 opción entre Naan, Roti o Arroz para tu curry',
    softDrinkTitle: 'Selecciona tu Gaseosa (Elige 1)',
    softDrinkSubtitle: 'Elige el sabor de tu bebida',
    addonsTitle: 'Opciones Adicionales',
    specialInstructions: 'Instrucciones Especiales / Alergias',
    specialInstructionsPlaceholder: 'Ej: Sin cilantro, salsa aparte, poca sal...',
    addToOrder: 'Agregar al Pedido',
    viewCart: 'Ver Carrito',
    cartTitle: 'Tu Pedido',
    cartEmpty: 'Tu carrito está vacío',
    cartEmptySub: 'Explora nuestro menú y agrega deliciosos platos indios preparados al momento.',
    exploreMenu: 'Explorar Menú',
    serviceType: 'Tipo de Servicio',
    serviceDineIn: 'En Restaurante',
    serviceTakeout: 'Para Llevar',
    serviceDelivery: 'A Domicilio',
    customerName: 'Nombre del Cliente',
    customerIdLabel: 'Cédula o RUC (número de identificación de cualquier país)',
    customerIdPlaceholder: 'Ej: 1715256226 / Pasaporte / Documento de cualquier país',
    customerPhone: 'Teléfono / WhatsApp',
    customerEmail: 'Correo Electrónico',
    customerEmailPlaceholder: 'Ej: cliente@correo.com',
    deliveryAddress: 'Dirección de Entrega',
    deliveryAddressPlaceholder: 'Calle principal, número, sector y referencias en Quito',
    tableNumber: 'Número de Mesa',
    tableNumberPlaceholder: 'Ej: Mesa 4 o Zona Terraza',
    orderNotes: 'Notas del Pedido',
    orderNotesPlaceholder: 'Instrucciones de entrega o preparación...',
    subtotal: 'Subtotal',
    deliveryFee: 'Costo de Envío',
    freeDelivery: 'Gratis',
    total: 'Total a Pagar',
    sendWhatsAppOrder: 'Confirmar Pedido por WhatsApp',
    orderRedirectNotice: 'Serás redirigido a WhatsApp con tu pedido formateado para confirmación inmediata.',
    orderClearedNotice: '¡Pedido enviado! Tu carrito se ha reiniciado.',
    adminPortal: 'Portal de Administración',
    adminLoginTitle: 'Acceso Administrativo',
    adminLoginSub: 'Gestión interna del menú y configuraciones de Sher E Punjab',
    adminPasswordLabel: 'Contraseña de Acceso',
    adminLoginBtn: 'Ingresar al Panel',
    adminForgotPass: '¿Olvidó la contraseña?',
    adminResetKeyPrompt: 'Ingrese el Código Secreto Maestro de Recuperación:',
    adminNewPassPrompt: 'Nueva Contraseña:',
    adminResetBtn: 'Restablecer Contraseña',
    adminInvalidPass: 'Contraseña incorrecta',
    adminInvalidSecret: 'Código de recuperación inválido',
    adminPassResetSuccess: 'Contraseña actualizada exitosamente',
    adminLogout: 'Cerrar Sesión',
    manageDishes: 'Gestión de Platos',
    manageCategories: 'Categorías',
    restaurantSettings: 'Ajustes y Menú Base',
    addNewDish: 'Añadir Nuevo Plato',
    editDish: 'Editar Plato',
    deleteDish: 'Eliminar Plato',
    deleteConfirm: '¿Está seguro de que desea eliminar este plato del menú?',
    dishNameEs: 'Nombre en Español',
    dishNameEn: 'Nombre en Inglés',
    dishDescEs: 'Descripción en Español',
    dishDescEn: 'Descripción en Inglés',
    dishPrice: 'Precio (USD)',
    dishCategory: 'Categoría',
    dishImage: 'Imagen del Plato',
    dishImageUrl: 'URL de la Imagen',
    dishImageUpload: 'O subir archivo de imagen (comprimido)',
    dishSpiceCustom: 'Permitir personalizar nivel de picante',
    dishIsVeg: 'Plato Vegetariano',
    dishIsChefSpecial: 'Destacar como Especial del Chef',
    dishIsAvailable: 'Disponible para ordenar',
    saveDish: 'Guardar Plato',
    cancel: 'Cancelar',
    resetDefaultMenu: 'Restaurar Menú Predeterminado',
    resetDefaultMenuConfirm: '¿Restaurar todos los platos originales del restaurante? Se sobrescribirán los cambios manuales.',
    categoryNameEs: 'Nombre Categoría (Español)',
    categoryNameEn: 'Nombre Categoría (Inglés)',
    addNewCategory: 'Nueva Categoría',
    saveCategory: 'Guardar Categoría',
    aboutTitle: 'Sobre Sher E Punjab Quito',
    aboutStory: 'Fundado con pasión por los auténticos sabores del norte y sur de la India, Sher E Punjab (Rincón de la India) trae a Quito las más exquisitas especias, panes frescos horneados en nuestro horno Tandoor tradicional de barro y recetas ancestrales transmitidas por generaciones.',
    aboutStory2: 'Todos nuestros platos se preparan al momento con ingredientes frescos, carnes selectas y opciones 100% vegetarianas y veganas.',
    scheduleTitle: 'Horario de Atención',
    whatsappDirect: 'Atención Directa por WhatsApp',
    orderNow: 'Pedir Ahora',
    currency: 'USD ($)',
    backToMenu: 'Volver al Menú',
    requiredField: 'Este campo es obligatorio',
    fillRequiredFields: 'Por favor complete todos los datos requeridos antes de continuar.',
    useLiveLocation: 'Compartir mi Ubicación GPS en Vivo',
    detectingLocation: 'Obteniendo ubicación GPS precisa...',
    locationAttached: 'Ubicación GPS adjunta para el repartidor',
    removeLocation: 'Quitar GPS',
    openInGoogleMaps: 'Ver en Maps',
    gpsAccuracy: 'Precisión',
    locationErrorPermission: 'No se pudo acceder a la ubicación. Por favor ingrese su dirección manualmente.',
    locationOptionalHint: 'Permite que el motorizado llegue exactamente a tu puerta en Quito mediante enlace directo de Google Maps.',
    assignedBranchLabel: 'Sucursal de Atención Asignada',
    calculatingBranch: 'Calculando sucursal más cercana...',
    changeBranchManual: 'Cambiar sucursal',
    autoMatchedBranch: 'Asignado automáticamente por cercanía',
    manualBranchBadge: 'Selección manual',
    selectBranchPrompt: 'Selecciona la sucursal de Sher E Punjab que atenderá tu pedido:',
    findBranchBtn: 'Detectar Sucursal',
    addressGeocodingHelp: 'Detectamos automáticamente si tu pedido va a la sucursal de Cumbayá o Quito Centro-Norte.',
  },
  en: {
    restaurantName: 'Sher E Punjab (Rincón de la India)',
    subTitle: 'Authentic Indian Cuisine in Quito • Traditional Flavors & Fresh Spices',
    openNow: 'Open Now',
    closedNow: 'Closed Now',
    hoursNote: 'Monday to Sunday: 12:00 PM – 9:30 PM (Ecuador Time)',
    callUs: 'Call',
    ourLocation: 'Juan León Mera 2677 & La Pinta, Quito',
    searchPlaceholder: 'Search dishes, curries, samosas, naan breads...',
    allCategories: 'All Menu',
    allDiet: 'All',
    vegOnly: 'Vegetarian',
    nonVegOnly: 'Meat & Chicken',
    chefSpecials: "Chef's Specials",
    available: 'Available',
    outOfStock: 'Out of Stock',
    add: 'ADD',
    customize: 'Customize',
    spiceLevel: 'Spice Level',
    spiceMild: 'Mild',
    spiceMedium: 'Medium',
    spiceHot: 'Hot',
    spiceExtraHot: 'Extra Hot',
    companionTitle: 'Included Companion (Choose 1)',
    companionSubtitle: 'Select 1 option between Naan, Roti, or Basmati Rice for your curry',
    softDrinkTitle: 'Select Soft Drink (Choose 1)',
    softDrinkSubtitle: 'Choose your preferred soft drink flavor',
    addonsTitle: 'Add-ons & Extras',
    specialInstructions: 'Special Instructions / Allergies',
    specialInstructionsPlaceholder: 'E.g., No cilantro, extra sauce on the side, mild salt...',
    addToOrder: 'Add to Order',
    viewCart: 'View Cart',
    cartTitle: 'Your Order',
    cartEmpty: 'Your cart is empty',
    cartEmptySub: 'Explore our authentic menu and add delicious fresh Indian dishes.',
    exploreMenu: 'Explore Menu',
    serviceType: 'Service Type',
    serviceDineIn: 'Dine-in',
    serviceTakeout: 'Takeout',
    serviceDelivery: 'Home Delivery',
    customerName: 'Customer Name',
    customerIdLabel: 'Client ID / Cedula or RUC (any country ID number)',
    customerIdPlaceholder: 'E.g., 1715256226 / Passport / Any country ID',
    customerPhone: 'Phone / WhatsApp',
    customerEmail: 'Email Address',
    customerEmailPlaceholder: 'E.g., client@example.com',
    deliveryAddress: 'Delivery Address',
    deliveryAddressPlaceholder: 'Street, building/house number, sector & landmarks in Quito',
    tableNumber: 'Table Number',
    tableNumberPlaceholder: 'E.g., Table 4 or Patio area',
    orderNotes: 'Order Notes',
    orderNotesPlaceholder: 'Delivery instructions or food preferences...',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    freeDelivery: 'Free',
    total: 'Total Amount',
    sendWhatsAppOrder: 'Confirm Order via WhatsApp',
    orderRedirectNotice: "You'll be redirected to WhatsApp with your structured order for immediate confirmation.",
    orderClearedNotice: 'Order sent! Your cart has been reset.',
    adminPortal: 'Admin Management Portal',
    adminLoginTitle: 'Admin Authentication',
    adminLoginSub: 'Internal menu and settings management for Sher E Punjab',
    adminPasswordLabel: 'Access Password',
    adminLoginBtn: 'Login to Dashboard',
    adminForgotPass: 'Forgot password?',
    adminResetKeyPrompt: 'Enter Master Recovery Secret Code:',
    adminNewPassPrompt: 'New Password:',
    adminResetBtn: 'Reset Password',
    adminInvalidPass: 'Incorrect password',
    adminInvalidSecret: 'Invalid recovery code',
    adminPassResetSuccess: 'Password updated successfully',
    adminLogout: 'Log Out',
    manageDishes: 'Dish Management',
    manageCategories: 'Categories',
    restaurantSettings: 'Settings & Base Menu',
    addNewDish: 'Add New Dish',
    editDish: 'Edit Dish',
    deleteDish: 'Delete Dish',
    deleteConfirm: 'Are you sure you want to permanently delete this dish?',
    dishNameEs: 'Name in Spanish',
    dishNameEn: 'Name in English',
    dishDescEs: 'Description in Spanish',
    dishDescEn: 'Description in English',
    dishPrice: 'Price (USD)',
    dishCategory: 'Category',
    dishImage: 'Dish Image',
    dishImageUrl: 'Image URL',
    dishImageUpload: 'Or upload image file (auto-compressed)',
    dishSpiceCustom: 'Enable spice level customization',
    dishIsVeg: 'Vegetarian Dish',
    dishIsChefSpecial: "Highlight as Chef's Special",
    dishIsAvailable: 'Available to order',
    saveDish: 'Save Dish',
    cancel: 'Cancel',
    resetDefaultMenu: 'Restore Default Menu',
    resetDefaultMenuConfirm: 'Restore all original restaurant dishes? This will overwrite manual changes.',
    categoryNameEs: 'Category Name (Spanish)',
    categoryNameEn: 'Category Name (English)',
    addNewCategory: 'New Category',
    saveCategory: 'Save Category',
    aboutTitle: 'About Sher E Punjab Quito',
    aboutStory: 'Founded with a passion for the authentic culinary traditions of Northern and Southern India, Sher E Punjab (Rincón de la India) brings to Quito exquisite aromatic spices, oven-fresh breads baked in our traditional clay Tandoor, and time-honored recipes passed down through generations.',
    aboutStory2: 'All our dishes are freshly cooked to order with prime ingredients, tender meats, and 100% vegetarian and vegan selections.',
    scheduleTitle: 'Opening Hours',
    whatsappDirect: 'Direct WhatsApp Service',
    orderNow: 'Order Now',
    currency: 'USD ($)',
    backToMenu: 'Back to Menu',
    requiredField: 'This field is required',
    fillRequiredFields: 'Please fill in all required fields before proceeding.',
    useLiveLocation: 'Share My Live GPS Location',
    detectingLocation: 'Detecting precise GPS coordinates...',
    locationAttached: 'Live GPS location attached for delivery rider',
    removeLocation: 'Remove GPS',
    openInGoogleMaps: 'View on Maps',
    gpsAccuracy: 'Accuracy',
    locationErrorPermission: 'Could not access GPS location. Please enter address manually.',
    locationOptionalHint: 'Allows the delivery rider to navigate directly to your door in Quito using Google Maps.',
    assignedBranchLabel: 'Assigned Restaurant Branch',
    calculatingBranch: 'Calculating closest branch...',
    changeBranchManual: 'Change branch',
    autoMatchedBranch: 'Automatically routed by proximity',
    manualBranchBadge: 'Manual selection',
    selectBranchPrompt: 'Select which Sher E Punjab branch should fulfill your order:',
    findBranchBtn: 'Detect Branch',
    addressGeocodingHelp: 'We automatically detect whether your delivery routes to Cumbayá or Quito branch.',
  },
};

export const SPICE_LEVEL_LABELS: Record<SpiceLevel, { es: string; en: string; iconCount: number }> = {
  mild: { es: 'Suave', en: 'Mild', iconCount: 1 },
  medium: { es: 'Medio', en: 'Medium', iconCount: 2 },
  hot: { es: 'Picante', en: 'Hot', iconCount: 3 },
  extra_hot: { es: 'Muy Picante', en: 'Extra Hot', iconCount: 4 },
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, { es: string; en: string }> = {
  dine_in: { es: 'En Restaurante', en: 'Dine-in' },
  takeout: { es: 'Para Llevar', en: 'Takeout' },
  delivery: { es: 'A Domicilio', en: 'Home Delivery' },
};
