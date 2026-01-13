// src/utils/caseConverter.js

export const isPlainObject = (v) => {
  if (v === null || typeof v !== "object") return false;
  return Object.prototype.toString.call(v) === "[object Object]";
};

const camelToSnakeKey = (key) => {
  if (typeof key !== "string") return key;

  // لو already snake_case أو فيه underscores، سيبه زي ما هو
  if (key.includes("_")) return key;

  // handles normal camelCase + acronyms (URL -> url)
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1_$2")
    .toLowerCase();
};

const snakeToCamelKey = (key) => {
  if (typeof key !== "string") return key;
  if (!key.includes("_")) return key;

  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
};

const shouldSkip = (v) => {
  // FormData / URLSearchParams / Date / Blob ... إلخ
  if (!v || typeof v !== "object") return false;
  if (typeof FormData !== "undefined" && v instanceof FormData) return true;
  if (typeof URLSearchParams !== "undefined" && v instanceof URLSearchParams) return true;
  if (v instanceof Date) return true;
  if (typeof Blob !== "undefined" && v instanceof Blob) return true;
  return false;
};

const convertDeep = (value, keyConverter, opts) => {
  const { ignoreKeys = new Set(), preserveKeys = new Set() } = opts || {};

  if (shouldSkip(value)) return value;

  if (Array.isArray(value)) {
    return value.map((item) => convertDeep(item, keyConverter, opts));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (ignoreKeys.has(k)) {
        out[k] = v;
        continue;
      }
      const nextKey = preserveKeys.has(k) ? k : keyConverter(k);
      out[nextKey] = convertDeep(v, keyConverter, opts);
    }
    return out;
  }

  return value;
};

export const toSnakeDeep = (value, opts) => convertDeep(value, camelToSnakeKey, opts);
export const toCamelDeep = (value, opts) => convertDeep(value, snakeToCamelKey, opts);
