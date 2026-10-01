/// <reference types="astro/client" />
declare module '@wordpress/autop' {
  export function autop(content: string, br?: boolean): string;
}
