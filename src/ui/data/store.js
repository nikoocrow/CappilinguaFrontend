/* Catálogo de la tienda (handoff § Tienda). Igual que el resto de `data/`,
   son fixtures: en producción el catálogo y los precios vienen del backend y
   la compra se valida ahí, no en el cliente.

   `art` es la miniatura en `static/ui/` cuando la pieza existe como arte, o un
   emoji cuando todavía no (compañeros y potenciadores). */

export const STORE_TABS = [
  { id: 'destacados', label: 'Destacados' },
  { id: 'ropa', label: 'Ropa' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'companeros', label: 'Compañeros' },
  { id: 'potenciadores', label: 'Potenciadores' },
];

export const STORE_ITEMS = [
  { id: 'bucket', tab: 'ropa', name: 'Bucket 서울', image: '/ui/item-bucket.png', price: 4500, currency: 'won', badge: 'Nuevo' },
  { id: 'frog', tab: 'ropa', name: 'Gorro Rana', image: '/ui/item-frog.png', price: 5200, currency: 'won' },
  { id: 'hat', tab: 'ropa', name: 'Sombrero Negro', image: '/ui/item-hat.png', price: 6000, currency: 'won' },
  { id: 'hanbok', tab: 'ropa', name: 'Hanbok', emoji: '👘', price: 12000, currency: 'won', badge: 'Edición' },

  { id: 'headphones', tab: 'accesorios', name: 'Audífonos', image: '/ui/item-headphones.png', price: 5500, currency: 'won' },
  { id: 'mask', tab: 'accesorios', name: 'Mascarilla 안녕', image: '/ui/item-mask.png', price: 3800, currency: 'won' },
  { id: 'camera', tab: 'accesorios', name: 'Cámara', image: '/ui/item-camera.png', price: 7200, currency: 'won', badge: 'Nuevo' },
  { id: 'army', tab: 'accesorios', name: 'Mochila Army', image: '/ui/item-army.png', price: 6500, currency: 'won' },
  { id: 'school', tab: 'accesorios', name: 'Mochila Escolar', image: '/ui/item-school.png', price: 5800, currency: 'won' },
  { id: 'bear', tab: 'accesorios', name: 'Mochila Oso', image: '/ui/item-bear.png', price: 7000, currency: 'won' },

  { id: 'bird', tab: 'companeros', name: 'Pájaro', emoji: '🐦', price: 120, currency: 'gema' },
  { id: 'dog', tab: 'companeros', name: 'Perro', emoji: '🐶', price: 140, currency: 'gema' },
  { id: 'fox', tab: 'companeros', name: 'Zorro', emoji: '🦊', price: 160, currency: 'gema', badge: 'Raro' },

  { id: 'boost_streak', tab: 'potenciadores', name: 'Escudo de racha', emoji: '🔥', description: 'Protege tu racha un día', price: 3000, currency: 'won' },
  { id: 'boost_xp', tab: 'potenciadores', name: 'Doble XP · 1h', emoji: '⚡', description: 'Duplica la XP que ganes', price: 4500, currency: 'won' },
  { id: 'boost_life', tab: 'potenciadores', name: 'Vidas extra', emoji: '❤️', description: 'Cinco intentos más', price: 2000, currency: 'won' },
  { id: 'pass', tab: 'potenciadores', name: 'Pase mensual', emoji: '🎫', description: 'Clases ilimitadas', price: 250, currency: 'gema', badge: 'Popular' },
];

export const FEATURED_PACK = {
  id: 'pack_seoul',
  title: 'Colección Seúl completa',
  description:
    'Cinco piezas exclusivas de la ciudad: bucket, gorro rana, sombrero negro, cámara y mochila army.',
  items: ['bucket', 'frog', 'hat', 'camera', 'army'],
  price: 24000,
  listPrice: 30000,
  currency: 'won',
};

// "Destacados" no es una categoría propia: es el corte de lo que tiene etiqueta.
export function storeItemsByTab(tab) {
  if (tab === 'destacados') return STORE_ITEMS.filter((item) => item.badge);
  return STORE_ITEMS.filter((item) => item.tab === tab);
}
