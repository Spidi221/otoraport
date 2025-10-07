"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps extends React.ComponentProps<"nav"> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeLabel?: string
  homeHref?: string
  maxItemsToShow?: number
  collapseBreakpoint?: "sm" | "md" | "lg"
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      items,
      separator,
      showHome = false,
      homeLabel = "Strona główna",
      homeHref = "/",
      maxItemsToShow = 3,
      collapseBreakpoint = "sm",
      ...props
    },
    ref
  ) => {
    const allItems = React.useMemo(() => {
      const itemsList = showHome
        ? [{ label: homeLabel, href: homeHref }, ...items]
        : items

      return itemsList
    }, [items, showHome, homeLabel, homeHref])

    const shouldCollapse = allItems.length > maxItemsToShow
    const collapsedItems = React.useMemo(() => {
      if (!shouldCollapse || allItems.length <= 3) return allItems

      const firstItem = allItems[0]
      const lastTwoItems = allItems.slice(-2)

      return [
        firstItem,
        { label: "...", href: undefined },
        ...lastTwoItems
      ]
    }, [allItems, shouldCollapse])

    const separatorIcon = separator || (
      <ChevronRight
        className="size-4 shrink-0 text-gray-400 dark:text-gray-600"
        aria-hidden="true"
      />
    )

    const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
      const isEllipsis = item.label === "..."

      if (isEllipsis) {
        return (
          <li key={`ellipsis-${index}`} className="flex items-center">
            <span
              className="text-sm text-gray-400 dark:text-gray-600 select-none"
              aria-label="Więcej elementów"
            >
              •••
            </span>
          </li>
        )
      }

      const itemContent = (
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            isLast
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {item.label}
        </span>
      )

      return (
        <li key={`${item.label}-${index}`} className="flex items-center">
          {item.href && !isLast ? (
            <Link
              href={item.href}
              className={cn(
                "group inline-flex items-center rounded-md px-2 py-1 -mx-2 -my-1",
                "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400",
                "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
                "transition-all duration-200"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  "text-gray-500 dark:text-gray-400",
                  "group-hover:text-gray-700 dark:group-hover:text-gray-200",
                  "transition-colors duration-200"
                )}
              >
                {item.label}
              </span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center px-2 py-1 -mx-2 -my-1"
              aria-current={isLast ? "page" : undefined}
            >
              {itemContent}
            </span>
          )}
        </li>
      )
    }

    const itemsToRender = shouldCollapse && collapseBreakpoint
      ? collapsedItems
      : allItems

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex", className)}
        {...props}
      >
        <ol
          className={cn(
            "flex flex-wrap items-center gap-1.5",
            "text-sm leading-6"
          )}
        >
          {itemsToRender.map((item, index) => {
            const isLast = index === itemsToRender.length - 1

            return (
              <React.Fragment key={`breadcrumb-${index}`}>
                {renderItem(item, index, isLast)}
                {!isLast && (
                  <li
                    className="flex select-none"
                    role="presentation"
                    aria-hidden="true"
                  >
                    {separatorIcon}
                  </li>
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </nav>
    )
  }
)

Breadcrumb.displayName = "Breadcrumb"

const ResponsiveBreadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => {
    const visibleItems = React.useMemo(() => {
      if (items.length <= 2) return items
      return [
        items[0],
        { label: "...", href: undefined },
        items[items.length - 1]
      ]
    }, [items])

    return (
      <>
        <Breadcrumb
          ref={ref}
          className={cn("flex sm:hidden", className)}
          items={visibleItems}
          {...props}
        />
        <Breadcrumb
          className={cn("hidden sm:flex", className)}
          items={items}
          {...props}
        />
      </>
    )
  }
)

ResponsiveBreadcrumb.displayName = "ResponsiveBreadcrumb"

export {
  Breadcrumb,
  ResponsiveBreadcrumb,
  type BreadcrumbItem,
  type BreadcrumbProps,
}
