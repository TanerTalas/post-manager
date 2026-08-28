import { flush } from './store';

/** Full page navigation. Pending state is written out first. */
export function goTo(href: string): void {
  flush();
  window.location.href = href;
}
