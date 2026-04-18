import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefetchRouteChunk } from "@/lib/route-prefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onFocus, ...props }, ref) => {
    const triggerPrefetch = useCallback(() => {
      const path = typeof to === "string" ? to : (to as { pathname?: string })?.pathname;
      if (path) prefetchRouteChunk(path);
    }, [to]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={(event) => {
          triggerPrefetch();
          onMouseEnter?.(event);
        }}
        onFocus={(event) => {
          triggerPrefetch();
          onFocus?.(event);
        }}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
