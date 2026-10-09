import { OrderStateMachine, toFlowStatus } from './order-state-machine';

describe('OrderStateMachine', () => {
  const sm = new OrderStateMachine();

  describe('جریان اصلی', () => {
    it('هر وضعیت فقط به وضعیت بعدی خودش می‌رود', () => {
      expect(sm.canTransition('requested', 'awaiting_confirmation')).toBe(true);
      expect(sm.canTransition('awaiting_pickup', 'picked_up')).toBe(true);
      expect(sm.canTransition('quote_approved', 'in_cleaning')).toBe(true);
      expect(sm.canTransition('out_for_delivery', 'delivered')).toBe(true);
      expect(sm.canTransition('delivered', 'closed')).toBe(true);
    });

    it('پرش به وضعیت‌های دورتر مجاز نیست', () => {
      expect(sm.canTransition('requested', 'picked_up')).toBe(false);
      expect(sm.canTransition('requested', 'delivered')).toBe(false);
      expect(sm.canTransition('awaiting_pickup', 'in_cleaning')).toBe(false);
    });

    it('انتقال به وضعیت فعلی مجاز نیست', () => {
      expect(sm.canTransition('in_cleaning', 'in_cleaning')).toBe(false);
    });

    it('بازگشت به عقب مجاز نیست', () => {
      expect(sm.canTransition('picked_up', 'awaiting_pickup')).toBe(false);
      expect(sm.canTransition('quality_control', 'in_cleaning')).toBe(false);
    });

    it('وضعیت پایانی انتقالی به جلو ندارد', () => {
      expect(sm.canTransition('closed', 'delivered')).toBe(false);
      expect(sm.canTransition('cancelled', 'delivered')).toBe(false);
      expect(sm.isTerminal('closed')).toBe(true);
      expect(sm.isTerminal('cancelled')).toBe(true);
      expect(sm.isTerminal('delivered')).toBe(false);
    });
  });

  describe('لغو', () => {
    it('از هر وضعیتی به‌جز delivered/closed/cancelled مجاز است', () => {
      expect(sm.canTransition('requested', 'cancelled')).toBe(true);
      expect(sm.canTransition('awaiting_pickup', 'cancelled')).toBe(true);
      expect(sm.canTransition('quoted', 'cancelled')).toBe(true);
      expect(sm.canTransition('in_cleaning', 'cancelled')).toBe(true);
      expect(sm.canTransition('out_for_delivery', 'cancelled')).toBe(true);
    });

    it('پس از تحویل یا بسته‌شدن مجاز نیست', () => {
      expect(sm.canTransition('delivered', 'cancelled')).toBe(false);
      expect(sm.canTransition('closed', 'cancelled')).toBe(false);
      expect(sm.canTransition('cancelled', 'cancelled')).toBe(false);
    });

    it('isCancellable همان قواعد را رعایت می‌کند', () => {
      expect(sm.isCancellable('quoted')).toBe(true);
      expect(sm.isCancellable('delivered')).toBe(false);
      expect(sm.isCancellable('closed')).toBe(false);
      expect(sm.isCancellable('cancelled')).toBe(false);
    });
  });

  describe('نقش‌های مجاز', () => {
    it('کارگاه می‌تواند سفارش را تأیید و ارزیابی کند', () => {
      const rule = sm.getTransition('requested', 'awaiting_confirmation');
      expect(rule?.roles).toEqual(['laundry_manager', 'laundry_user']);
      expect(sm.canRoleTransition('requested', 'awaiting_confirmation', 'laundry_manager')).toBe(true);
      expect(sm.canRoleTransition('requested', 'awaiting_confirmation', 'laundry_user')).toBe(true);
    });

    it('سفیر می‌تواند برداشت و تحویل را انجام دهد', () => {
      expect(sm.getTransition('awaiting_pickup', 'picked_up')?.roles).toEqual(['driver']);
      expect(sm.getTransition('ready_for_delivery', 'out_for_delivery')?.roles).toEqual(['driver']);
      expect(sm.getTransition('out_for_delivery', 'delivered')?.roles).toEqual(['driver']);
    });

    it('مشتری فقط برآورد را تأیید می‌کند', () => {
      expect(sm.getTransition('quoted', 'quote_approved')?.roles).toEqual(['customer']);
      expect(sm.canRoleTransition('quoted', 'quote_approved', 'customer')).toBe(true);
      expect(sm.canRoleTransition('quoted', 'quote_approved', 'driver')).toBe(false);
    });

    it('ادمین در همهٔ انتقال‌ها مجاز است (override)', () => {
      expect(sm.canRoleTransition('requested', 'awaiting_confirmation', 'admin')).toBe(true);
      expect(sm.canRoleTransition('awaiting_pickup', 'picked_up', 'admin')).toBe(true);
      expect(sm.canRoleTransition('quoted', 'quote_approved', 'admin')).toBe(true);
    });

    it('نقش نامجاز رد می‌شود', () => {
      expect(sm.canRoleTransition('requested', 'awaiting_confirmation', 'driver')).toBe(false);
      expect(sm.canRoleTransition('awaiting_pickup', 'picked_up', 'customer')).toBe(false);
    });

    it('برای انتقال نامعتبر قانونی وجود ندارد', () => {
      expect(sm.getTransition('requested', 'delivered')).toBeNull();
      expect(sm.canRoleTransition('requested', 'delivered', 'admin')).toBe(false);
    });
  });

  describe('الزام یادداشت', () => {
    it('ارسال برآورد نیاز به دلیل دارد', () => {
      expect(sm.getTransition('awaiting_assessment', 'quoted')?.requiresNote).toBe(true);
    });

    it('بستن سفارش توسط ادمین نیاز به دلیل دارد', () => {
      expect(sm.getTransition('delivered', 'closed')?.requiresNote).toBe(true);
      expect(sm.getTransition('delivered', 'closed')?.roles).toEqual([]);
    });

    it('سایر انتقال‌ها بدون دلیل هم مجازند', () => {
      expect(sm.getTransition('requested', 'awaiting_confirmation')?.requiresNote).toBe(false);
      expect(sm.getTransition('awaiting_pickup', 'picked_up')?.requiresNote).toBe(false);
      expect(sm.getTransition('quoted', 'quote_approved')?.requiresNote).toBe(false);
    });
  });

  describe('وضعیت بعدی', () => {
    it('وضعیت بعدی جریان اصلی را برمی‌گرداند', () => {
      expect(sm.nextStatus('requested')).toBe('awaiting_confirmation');
      expect(sm.nextStatus('delivered')).toBe('closed');
    });

    it('برای وضعیت پایانی null برمی‌گرداند', () => {
      expect(sm.nextStatus('closed')).toBeNull();
      expect(sm.nextStatus('cancelled')).toBeNull();
    });
  });

  describe('سازگاری با جریان قدیمی', () => {
    it('مقادیر legacy به جریان فعلی نگاشت می‌شوند', () => {
      expect(toFlowStatus('pending')).toBe('requested');
      expect(toFlowStatus('quotation_sent')).toBe('quoted');
      expect(toFlowStatus('washing')).toBe('in_cleaning');
      expect(toFlowStatus('ready')).toBe('ready_for_delivery');
      expect(toFlowStatus('delivered')).toBe('delivered');
    });

    it('انتقال از وضعیت legacy با ماشین کار می‌کند', () => {
      expect(sm.canTransition('at_laundry', 'quotation_sent')).toBe(true);
      expect(sm.canTransition('quotation_approved', 'washing')).toBe(true);
      expect(sm.canTransition('pending', 'washing')).toBe(false);
    });

    it('مقدار ناشناخته null برمی‌گرداند', () => {
      expect(toFlowStatus('unknown')).toBeNull();
      expect(sm.canTransition('unknown', 'delivered')).toBe(false);
    });
  });
});
