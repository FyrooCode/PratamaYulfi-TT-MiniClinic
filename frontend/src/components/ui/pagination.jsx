import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button";

const Pagination = ({
  className,
  ...props
}) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  disabled,
  ...props
}) => {
  const Comp = props.href ? "a" : "button"
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        disabled && "pointer-events-none opacity-40 cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  text,
  showText = false,
  ...props
}) => (
  <PaginationLink
    aria-label="Go to previous page"
    size={showText ? "default" : "icon"}
    className={cn(
      showText ? "gap-1 pl-2.5" : "h-8 w-8 p-0 border border-slate-200",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    {showText && <span>{text || "Previous"}</span>}
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  text,
  showText = false,
  ...props
}) => (
  <PaginationLink
    aria-label="Go to next page"
    size={showText ? "default" : "icon"}
    className={cn(
      showText ? "gap-1 pr-2.5" : "h-8 w-8 p-0 border border-slate-200",
      className
    )}
    {...props}
  >
    {showText && <span>{text || "Next"}</span>}
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
