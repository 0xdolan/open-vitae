import { useEffect, useState } from 'react';

export type Route = { readonly name: 'library' } | { readonly name: 'editor'; readonly id: string };

/**
 * Hash routes work on GitHub Pages and from a plain file server, with no
 * server-side rewrites:  #/  is the library,  #/edit/<id>  opens a resume.
 */
export function parseRoute(hash: string): Route {
  const match = /^#\/edit\/([A-Za-z0-9_-]{1,64})$/.exec(hash);
  return match?.[1] ? { name: 'editor', id: match[1] } : { name: 'library' };
}

export function routeHref(route: Route): string {
  return route.name === 'editor' ? `#/edit/${route.id}` : '#/';
}

export function navigate(route: Route): void {
  const href = routeHref(route);
  if (window.location.hash !== href) window.location.hash = href;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
