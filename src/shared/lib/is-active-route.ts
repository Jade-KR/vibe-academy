export function isActiveRoute(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}
