import { cn } from '@/lib/utils/cn';
import { Button, buttonVariants } from './button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="صفحه‌بندی"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = ({
  className,
  ...props
}: React.ComponentProps<'ul'>) => (
  <ul
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('', className)} {...props} />
);
PaginationItem.displayName = 'PaginationItem';

type PaginationButtonProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'button'>;

const PaginationButton = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationButtonProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationButton.displayName = 'PaginationButton';

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    aria-label="صفحه قبل"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  />
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) => (
  <PaginationButton
    aria-label="صفحه بعد"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  />
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    &hellip;
    <span className="sr-only">صفحات بیشتر</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationButton as PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
