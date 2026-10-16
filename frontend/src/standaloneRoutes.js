// Assets keep their build URL; the router and home link follow the entry URL.
export function standaloneCatalogBase(pathname, publicUrl = process.env.PUBLIC_URL || "") {
  return /^\/catalog(?:\/|$)/.test(pathname) ? "/catalog" : publicUrl;
}
