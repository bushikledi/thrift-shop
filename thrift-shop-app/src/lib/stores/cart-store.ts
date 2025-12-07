/**
 * Cart Store
 * Manages shopping cart state using Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCartFromApi: (cart: any) => void; // Sync from API cart response
  totalPrice: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      setCartFromApi: (cart) => {
        if (!cart || !cart.items) {
          set({ items: [] });
          return;
        }
        // Convert API cart items to store format
        const storeItems: CartItem[] = cart.items.map((item: any) => {
          const productPrice = typeof item.product.price === 'string'
            ? parseFloat(item.product.price)
            : item.product.price;
          
          return {
            productId: item.productId,
            name: item.product.title,
            price: productPrice,
            quantity: item.quantity,
            image: item.product.media?.[0]?.url,
            vendorId: item.product.vendorId,
          };
        });
        set({ items: storeItems });
      },
      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);

