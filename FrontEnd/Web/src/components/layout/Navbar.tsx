import { Header, type HeaderProps } from "./Header";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Navbar (Alias to Header)
 * ─────────────────────────────────────────────────────────────────────────────
 * Maintained for backward-compatibility across existing imports.
 * Routes directly to the new session-aware Header component.
 */
export const Navbar = Header;
export type NavbarProps = HeaderProps;
export default Navbar;
