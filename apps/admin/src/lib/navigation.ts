import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Store,
  Truck,
  CreditCard,
  Calculator,
  LifeBuoy,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: 'اصلی',
    items: [
      { title: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
      { title: 'سفارش‌ها', href: '/orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'مدیریت',
    items: [
      { title: 'مشتریان', href: '/customers', icon: Users },
      { title: 'کارگاه‌ها', href: '/workshops', icon: Store },
      { title: 'رانندگان', href: '/drivers', icon: Truck },
    ],
  },
  {
    title: 'مالی',
    items: [
      { title: 'پرداخت‌ها', href: '/payments', icon: CreditCard },
      { title: 'قیمت‌گذاری', href: '/pricing', icon: Calculator },
    ],
  },
  {
    title: 'گزارش و پشتیبانی',
    items: [
      { title: 'گزارش‌ها', href: '/reports', icon: BarChart3 },
      { title: 'پشتیبانی', href: '/support', icon: LifeBuoy },
      { title: 'تنظیمات', href: '/settings', icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navigation.flatMap((s) => s.items);

export const navTitleByHref = (href: string): string | undefined =>
  allNavItems.find((i) => i.href === href)?.title;
