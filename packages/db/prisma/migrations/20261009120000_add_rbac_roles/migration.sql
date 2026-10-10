-- Added RBAC roles to UserRole: manager, expert, support, finance
-- IF NOT EXISTS برای امن بودنِ اجرای مجدد دستی؛ PostgreSQL 12+ آن را پشتیبانی می‌کند.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'expert';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'finance';
