import { create } from 'zustand';
import type { OrderItem } from '@yuma/types';

/**
 * یک سرویس قابل‌انتخاب در فرم سفارش — منبع داده‌ی استاتیک لیست قیمت.
 */
export interface OrderDraftService {
  id: string;
  name: string;
  /** توضیح کوتاه برای راهنمایی کاربر */
  description?: string;
  /** قیمت واحد به تومان (واحد نمایش) */
  unitPrice: number;
}

export interface OrderState {
  /** سرویس‌های انتخاب‌شده همراه تعداد */
  items: OrderItem[];
  /** استان */
  province: string;
  /** شهر */
  city: string;
  /** آدرس کامل پستی */
  address: string;
  /** کد پستی ۱۰ رقمی */
  postalCode: string;
  /** تلفن تماس */
  phone: string;
  /** یادداشت اختیاری */
  notes: string;
  /** افزایش تعداد یک سرویس (در صورت نبودن اضافه می‌شود) */
  increment: (service: OrderDraftService) => void;
  /** کاهش تعداد یک سرویس (در صفر شدن حذف می‌شود) */
  decrement: (serviceId: string) => void;
  /** تنظیم مستقیم تعداد یک سرویس */
  setQuantity: (service: OrderDraftService, quantity: number) => void;
  /** به‌روزرسانی فیلدهای آدرش/تماس */
  setProvince: (value: string) => void;
  setCity: (value: string) => void;
  setAddress: (value: string) => void;
  setPostalCode: (value: string) => void;
  setPhone: (value: string) => void;
  setNotes: (value: string) => void;
  /** خالی کردن کامل پیش‌نویس سفارش (پس از ثبت موفق) */
  clearOrder: () => void;
}

/** تعداد کل اقلام انتخاب‌شده */
export const selectTotalItems = (state: OrderState): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

/** مبلغ کل پیش‌نویس به تومان */
export const selectTotalPrice = (state: OrderState): number =>
  state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

/**
 * استور پیش‌نویس سفارش — اقلام انتخاب‌شده و آدرس کاربر.
 *
 * این استور volatile است (persist نمی‌شود) تا بعد از هر ثبت موفق
 * تمیز شود و قیمت‌های قدیمی در سفره‌های بعدی باقی نمانند.
 *
 * @example
 * const items = useOrderStore((state) => state.items);
 * const increment = useOrderStore((state) => state.increment);
 */
export const useOrderStore = create<OrderState>()((set) => ({
  items: [],
  province: '',
  city: '',
  address: '',
  postalCode: '',
  phone: '',
  notes: '',

  increment: (service) =>
    set((state) => {
      const existing = state.items.find((i) => i.serviceId === service.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: service.id,
            serviceId: service.id,
            serviceName: service.name,
            quantity: 1,
            unitPrice: service.unitPrice,
          },
        ],
      };
    }),

  decrement: (serviceId) =>
    set((state) => {
      const existing = state.items.find((i) => i.serviceId === serviceId);
      if (!existing) return state;
      if (existing.quantity <= 1) {
        return { items: state.items.filter((i) => i.serviceId !== serviceId) };
      }
      return {
        items: state.items.map((i) =>
          i.serviceId === serviceId ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      };
    }),

  setQuantity: (service, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.serviceId !== service.id) };
      }
      const existing = state.items.find((i) => i.serviceId === service.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.serviceId === service.id ? { ...i, quantity } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: service.id,
            serviceId: service.id,
            serviceName: service.name,
            quantity,
            unitPrice: service.unitPrice,
          },
        ],
      };
    }),

  setProvince: (value) => set({ province: value }),
  setCity: (value) => set({ city: value }),
  setAddress: (value) => set({ address: value }),
  setPostalCode: (value) => set({ postalCode: value }),
  setPhone: (value) => set({ phone: value }),
  setNotes: (value) => set({ notes: value }),

  clearOrder: () =>
    set({
      items: [],
      province: '',
      city: '',
      address: '',
      postalCode: '',
      phone: '',
      notes: '',
    }),
}));
