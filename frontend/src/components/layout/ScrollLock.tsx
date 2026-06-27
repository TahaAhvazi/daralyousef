import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const LOCK_PREFIXES = ["/app", "/portal", "/login", "/register", "/forgot-password"];

function shouldLockScroll(pathname: string): boolean {
  return LOCK_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Prevents document scroll on fixed app shells; landing page keeps normal scroll. */
export function ScrollLock() {
  const { pathname } = useLocation();

  useEffect(() => {
    const lock = shouldLockScroll(pathname);
    document.documentElement.classList.toggle("app-scroll-lock", lock);
    return () => document.documentElement.classList.remove("app-scroll-lock");
  }, [pathname]);

  return null;
}
