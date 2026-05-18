import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartOption = {
  count: number;
  opt_nm: string;
  opt_no: number;
  opt_price: number;
  opt_type: string;
};

export type CartItemInput = {
  base_price: number;
  goods_nm: string;
  goods_no: number;
  options: CartOption[];
};

export type CartItem = CartItemInput & {
  id: string;
  quantity: number;
  unit_price: number;
};

type CartStore = {
  addItem: (item: CartItemInput) => void;
  clearCart: () => void;
  decreaseItem: (id: string) => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  increaseItem: (id: string) => void;
  items: CartItem[];
  removeItem: (id: string) => void;
};

function getOptionsKey(options: CartOption[]) {
  return options
    .map((option) => `${option.opt_type}:${option.opt_no}:${option.count}`)
    .sort()
    .join("|");
}

function getCartItemId(item: CartItemInput) {
  return `${item.goods_no}::${getOptionsKey(item.options)}`;
}

function getUnitPrice(item: CartItemInput) {
  const optionTotal = item.options.reduce(
    (total, option) => total + option.opt_price * option.count,
    0,
  );

  return item.base_price + optionTotal;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const id = getCartItemId(item);
        const unitPrice = getUnitPrice(item);

        set((state) => {
          const existingItem = state.items.find((cartItem) => cartItem.id === id);

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id,
                quantity: 1,
                unit_price: unitPrice,
              },
            ],
          };
        });
      },
      clearCart: () => set({ items: [] }),
      decreaseItem: (id) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id ? { ...item, quantity: Math.max(item.quantity - 1, 0) } : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.unit_price * item.quantity, 0),
      increaseItem: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: "paiks-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
