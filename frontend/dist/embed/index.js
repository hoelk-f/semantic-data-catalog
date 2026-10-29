import React, { useState, useRef, useCallback, useEffect, useMemo, useContext, createContext, useId } from 'react';
import { solidDatasetAsTurtle, getStringNoLocale, getUrlAll, getDatetime, getUrl, getThing, getThingAll, getStringWithLocaleAll, getSolidDataset, createSolidDataset, createThing, setUrl, setStringNoLocale, setDatetime, removeAll, addUrl, setThing, getContainedResourceUrlAll, deleteFile, saveSolidDatasetAt, setPublicResourceAccess, saveAclFor, removeThing, createContainerAt, hasResourceAcl, hasAccessibleAcl, createAclFromFallbackAcl, getResourceAcl, getResourceInfoWithAcl, getPublicResourceAccess, setAgentResourceAccess, createAcl, setAgentDefaultAccess, overwriteFile, getSolidDatasetWithAcl } from '@inrupt/solid-client';
import { Session } from '@inrupt/solid-client-authn-browser';
import { Store, Parser as Parser$1, Writer as Writer$1, DataFactory } from 'n3';
import { DCTERMS, RDF, DCAT as DCAT$1, FOAF, VCARD, LDP } from '@inrupt/vocab-common-rdf';
import require$$0 from 'buffer';
import { Network } from 'vis-network';
import { createPortal } from 'react-dom';

function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}
function _defineProperty$2(e, r, t) {
  return (r = _toPropertyKey$2(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys$2(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2$2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$2(Object(t), true).forEach(function (r) {
      _defineProperty$2(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$2(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _objectWithoutProperties$1(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose$1(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$1(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _toPrimitive$2(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey$2(t) {
  var i = _toPrimitive$2(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

// Catalog provenance is independent of dcterms:creator and source-file URLs.
var httpUrl$1 = value => {
  try {
    var url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search ? url : null;
  } catch (_unused) {
    return null;
  }
};
function catalogOrigin(catalogUrl) {
  var _root;
  var storageRoots = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var catalog = httpUrl$1(catalogUrl);
  if (!catalog) return null;
  var roots = storageRoots.map(httpUrl$1).filter(root => root && !root.hash && root.origin === catalog.origin && root.pathname.endsWith("/") && catalog.pathname.startsWith(root.pathname));
  roots.sort((a, b) => b.pathname.length - a.pathname.length);
  var root = roots[0];
  if (!root) {
    // Established catalog/ layout; do not guess a Pod from an unrelated WebID
    // or from an arbitrary custom document's parent directory.
    var parts = catalog.pathname.split("/");
    var index = parts.lastIndexOf("catalog");
    if (index > 0) root = new URL(parts.slice(0, index).join("/") + "/", catalog.origin);
  }
  return {
    catalogUrl: catalog.href,
    podRoot: ((_root = root) === null || _root === void 0 ? void 0 : _root.href) || ""
  };
}
function datasetCatalogOrigins(dataset) {
  var origins = [...(dataset.catalogOrigins || []), ...(dataset.catalogUrl ? [{
    catalogUrl: dataset.catalogUrl
  }] : [])];
  var resolved = new Map();
  for (var origin of origins) {
    var value = catalogOrigin(origin.catalogUrl, origin.podRoot ? [origin.podRoot] : []);
    if (value && (!resolved.has(value.catalogUrl) || !resolved.get(value.catalogUrl).podRoot && value.podRoot)) resolved.set(value.catalogUrl, value);
  }
  return [...resolved.values()];
}
function podNameFromRoot(root) {
  var url = httpUrl$1(root);
  if (!url) return "";
  try {
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || url.hostname.split(".")[0]);
  } catch (_unused2) {
    return url.hostname;
  }
}
function datasetPodRoots(dataset) {
  return [...new Set(datasetCatalogOrigins(dataset).map(origin => origin.podRoot).filter(Boolean))];
}
var datasetPodNames = dataset => [...new Set(datasetPodRoots(dataset).map(podNameFromRoot))].join(", ");

/*!
 * Font Awesome Free 7.3.0 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2026 Fonticons, Inc.
 */
function _arrayLikeToArray$1(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles$1(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles$1(r) {
  if (Array.isArray(r)) return _arrayLikeToArray$1(r);
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey$1(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
    writable: false
  }), e;
}
function _createForOfIteratorHelper(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (!t) {
    if (Array.isArray(r) || (t = _unsupportedIterableToArray$1(r)) || e) {
      t && (r = t);
      var n = 0,
        F = function () {};
      return {
        s: F,
        n: function () {
          return n >= r.length ? {
            done: true
          } : {
            done: false,
            value: r[n++]
          };
        },
        e: function (r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var o,
    a = true,
    u = false;
  return {
    s: function () {
      t = t.call(r);
    },
    n: function () {
      var r = t.next();
      return a = r.done, r;
    },
    e: function (r) {
      u = true, o = r;
    },
    f: function () {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    }
  };
}
function _defineProperty$1(e, r, t) {
  return (r = _toPropertyKey$1(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray$1(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit$1(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread$1() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function (r) {
      _defineProperty$1(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _slicedToArray$1(r, e) {
  return _arrayWithHoles$1(r) || _iterableToArrayLimit$1(r, e) || _unsupportedIterableToArray$1(r, e) || _nonIterableRest$1();
}
function _toConsumableArray$1(r) {
  return _arrayWithoutHoles$1(r) || _iterableToArray$1(r) || _unsupportedIterableToArray$1(r) || _nonIterableSpread$1();
}
function _toPrimitive$1(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _typeof$1(o) {
  "@babel/helpers - typeof";

  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof$1(o);
}
function _unsupportedIterableToArray$1(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
  }
}

var noop = function noop() {};
var _WINDOW = {};
var _DOCUMENT = {};
var _MUTATION_OBSERVER = null;
var _PERFORMANCE = {
  mark: noop,
  measure: noop
};
try {
  if (typeof window !== 'undefined') _WINDOW = window;
  if (typeof document !== 'undefined') _DOCUMENT = document;
  if (typeof MutationObserver !== 'undefined') _MUTATION_OBSERVER = MutationObserver;
  if (typeof performance !== 'undefined') _PERFORMANCE = performance;
} catch (e) {} // eslint-disable-line no-empty

var _ref = _WINDOW.navigator || {},
  _ref$userAgent = _ref.userAgent,
  userAgent = _ref$userAgent === void 0 ? '' : _ref$userAgent;
var WINDOW = _WINDOW;
var DOCUMENT = _DOCUMENT;
var MUTATION_OBSERVER = _MUTATION_OBSERVER;
var PERFORMANCE = _PERFORMANCE;
!!WINDOW.document;
var IS_DOM = !!DOCUMENT.documentElement && !!DOCUMENT.head && typeof DOCUMENT.addEventListener === 'function' && typeof DOCUMENT.createElement === 'function';
var IS_IE = ~userAgent.indexOf('MSIE') || ~userAgent.indexOf('Trident/');

var _cl;
var Z = /fa(k|kd|s|r|l|t|d|dr|dl|dt|b|slr|slpr|wsb|tl|ns|nds|es|gt|jr|jfr|jdr|usb|ufsb|udsb|cr|ss|sr|sl|st|sds|sdr|sdl|sdt|sldr|slpdr|pr|ms|vs)?[\-\ ]/,
  $ = /Font ?Awesome ?([567 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit|Notdog Duo|Notdog|Chisel|Etch|Graphite|Thumbprint|Jelly Fill|Jelly Duo|Jelly|Utility|Utility Fill|Utility Duo|Slab Press|Slab|Slab Duo|Slab Press Duo|Pixel|Mosaic|Vellum|Whiteboard)?.*/i;
var rl = {
    classic: {
      fa: "solid",
      fas: "solid",
      "fa-solid": "solid",
      far: "regular",
      "fa-regular": "regular",
      fal: "light",
      "fa-light": "light",
      fat: "thin",
      "fa-thin": "thin",
      fab: "brands",
      "fa-brands": "brands"
    },
    duotone: {
      fa: "solid",
      fad: "solid",
      "fa-solid": "solid",
      "fa-duotone": "solid",
      fadr: "regular",
      "fa-regular": "regular",
      fadl: "light",
      "fa-light": "light",
      fadt: "thin",
      "fa-thin": "thin"
    },
    sharp: {
      fa: "solid",
      fass: "solid",
      "fa-solid": "solid",
      fasr: "regular",
      "fa-regular": "regular",
      fasl: "light",
      "fa-light": "light",
      fast: "thin",
      "fa-thin": "thin"
    },
    "sharp-duotone": {
      fa: "solid",
      fasds: "solid",
      "fa-solid": "solid",
      fasdr: "regular",
      "fa-regular": "regular",
      fasdl: "light",
      "fa-light": "light",
      fasdt: "thin",
      "fa-thin": "thin"
    },
    slab: {
      "fa-regular": "regular",
      faslr: "regular"
    },
    "slab-press": {
      "fa-regular": "regular",
      faslpr: "regular"
    },
    "slab-duo": {
      "fa-regular": "regular",
      fasldr: "regular"
    },
    "slab-press-duo": {
      "fa-regular": "regular",
      faslpdr: "regular"
    },
    thumbprint: {
      "fa-light": "light",
      fatl: "light"
    },
    vellum: {
      "fa-solid": "solid",
      favs: "solid"
    },
    pixel: {
      "fa-regular": "regular",
      fapr: "regular"
    },
    mosaic: {
      "fa-solid": "solid",
      fams: "solid"
    },
    whiteboard: {
      "fa-semibold": "semibold",
      fawsb: "semibold"
    },
    notdog: {
      "fa-solid": "solid",
      fans: "solid"
    },
    "notdog-duo": {
      "fa-solid": "solid",
      fands: "solid"
    },
    etch: {
      "fa-solid": "solid",
      faes: "solid"
    },
    graphite: {
      "fa-thin": "thin",
      fagt: "thin"
    },
    jelly: {
      "fa-regular": "regular",
      fajr: "regular"
    },
    "jelly-fill": {
      "fa-regular": "regular",
      fajfr: "regular"
    },
    "jelly-duo": {
      "fa-regular": "regular",
      fajdr: "regular"
    },
    chisel: {
      "fa-regular": "regular",
      facr: "regular"
    },
    utility: {
      "fa-semibold": "semibold",
      fausb: "semibold"
    },
    "utility-duo": {
      "fa-semibold": "semibold",
      faudsb: "semibold"
    },
    "utility-fill": {
      "fa-semibold": "semibold",
      faufsb: "semibold"
    }
  },
  il = {
    GROUP: "duotone-group",
    PRIMARY: "primary",
    SECONDARY: "secondary"
  },
  dl = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone", "fa-thumbprint", "fa-whiteboard", "fa-notdog", "fa-notdog-duo", "fa-chisel", "fa-etch", "fa-graphite", "fa-jelly", "fa-jelly-fill", "fa-jelly-duo", "fa-slab", "fa-slab-press", "fa-slab-press-duo", "fa-slab-duo", "fa-mosaic", "fa-pixel", "fa-vellum", "fa-utility", "fa-utility-duo", "fa-utility-fill"];
var u = "classic",
  l = "duotone",
  h = "sharp",
  t = "sharp-duotone",
  g = "chisel",
  n = "etch",
  m = "graphite",
  p = "jelly",
  s = "jelly-duo",
  y = "jelly-fill",
  w = "mosaic",
  x = "notdog",
  e = "notdog-duo",
  b = "pixel",
  c = "slab",
  o = "slab-duo",
  I = "slab-press",
  a = "slab-press-duo",
  r = "thumbprint",
  v = "utility",
  i = "utility-duo",
  F = "utility-fill",
  d = "vellum",
  S = "whiteboard",
  A = "Classic",
  P = "Duotone",
  j = "Sharp",
  B = "Sharp Duotone",
  N = "Chisel",
  D = "Etch",
  k = "Graphite",
  T = "Jelly",
  C = "Jelly Duo",
  W = "Jelly Fill",
  R = "Mosaic",
  K = "Notdog",
  L = "Notdog Duo",
  U = "Pixel",
  J = "Slab",
  _ = "Slab Duo",
  M = "Slab Press",
  E = "Slab Press Duo",
  G = "Thumbprint",
  V = "Utility",
  z = "Utility Duo",
  O = "Utility Fill",
  Y = "Vellum",
  q = "Whiteboard",
  xl = [u, l, h, t, g, n, m, p, s, y, w, x, e, b, c, o, I, a, r, v, i, F, d, S];
  (_cl = {}, _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_cl, u, A), l, P), h, j), t, B), g, N), n, D), m, k), p, T), s, C), y, W), _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_cl, w, R), x, K), e, L), b, U), c, J), o, _), I, M), a, E), r, G), v, V), _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_cl, i, z), F, O), d, Y), S, q));
var Al = {
    classic: {
      900: "fas",
      400: "far",
      normal: "far",
      300: "fal",
      100: "fat"
    },
    duotone: {
      900: "fad",
      400: "fadr",
      300: "fadl",
      100: "fadt"
    },
    sharp: {
      900: "fass",
      400: "fasr",
      300: "fasl",
      100: "fast"
    },
    "sharp-duotone": {
      900: "fasds",
      400: "fasdr",
      300: "fasdl",
      100: "fasdt"
    },
    slab: {
      400: "faslr"
    },
    "slab-press": {
      400: "faslpr"
    },
    "slab-duo": {
      400: "fasldr"
    },
    "slab-press-duo": {
      400: "faslpdr"
    },
    vellum: {
      900: "favs"
    },
    mosaic: {
      900: "fams"
    },
    pixel: {
      400: "fapr"
    },
    whiteboard: {
      600: "fawsb"
    },
    thumbprint: {
      300: "fatl"
    },
    notdog: {
      900: "fans"
    },
    "notdog-duo": {
      900: "fands"
    },
    etch: {
      900: "faes"
    },
    graphite: {
      100: "fagt"
    },
    chisel: {
      400: "facr"
    },
    jelly: {
      400: "fajr"
    },
    "jelly-fill": {
      400: "fajfr"
    },
    "jelly-duo": {
      400: "fajdr"
    },
    utility: {
      600: "fausb"
    },
    "utility-duo": {
      600: "faudsb"
    },
    "utility-fill": {
      600: "faufsb"
    }
  };
var zl = {
    "Font Awesome 7 Free": {
      900: "fas",
      400: "far"
    },
    "Font Awesome 7 Pro": {
      900: "fas",
      400: "far",
      normal: "far",
      300: "fal",
      100: "fat"
    },
    "Font Awesome 7 Brands": {
      400: "fab",
      normal: "fab"
    },
    "Font Awesome 7 Duotone": {
      900: "fad",
      400: "fadr",
      normal: "fadr",
      300: "fadl",
      100: "fadt"
    },
    "Font Awesome 7 Sharp": {
      900: "fass",
      400: "fasr",
      normal: "fasr",
      300: "fasl",
      100: "fast"
    },
    "Font Awesome 7 Sharp Duotone": {
      900: "fasds",
      400: "fasdr",
      normal: "fasdr",
      300: "fasdl",
      100: "fasdt"
    },
    "Font Awesome 7 Jelly": {
      400: "fajr",
      normal: "fajr"
    },
    "Font Awesome 7 Jelly Fill": {
      400: "fajfr",
      normal: "fajfr"
    },
    "Font Awesome 7 Jelly Duo": {
      400: "fajdr",
      normal: "fajdr"
    },
    "Font Awesome 7 Slab": {
      400: "faslr",
      normal: "faslr"
    },
    "Font Awesome 7 Slab Press": {
      400: "faslpr",
      normal: "faslpr"
    },
    "Font Awesome 7 Slab Duo": {
      400: "fasldr",
      normal: "fasldr"
    },
    "Font Awesome 7 Slab Press Duo": {
      400: "faslpdr",
      normal: "faslpdr"
    },
    "Font Awesome 7 Pixel": {
      400: "fapr",
      normal: "fapr"
    },
    "Font Awesome 7 Mosaic": {
      900: "fams",
      normal: "fams"
    },
    "Font Awesome 7 Vellum": {
      900: "favs",
      normal: "favs"
    },
    "Font Awesome 7 Thumbprint": {
      300: "fatl",
      normal: "fatl"
    },
    "Font Awesome 7 Notdog": {
      900: "fans",
      normal: "fans"
    },
    "Font Awesome 7 Notdog Duo": {
      900: "fands",
      normal: "fands"
    },
    "Font Awesome 7 Etch": {
      900: "faes",
      normal: "faes"
    },
    "Font Awesome 7 Graphite": {
      100: "fagt",
      normal: "fagt"
    },
    "Font Awesome 7 Chisel": {
      400: "facr",
      normal: "facr"
    },
    "Font Awesome 7 Whiteboard": {
      600: "fawsb",
      normal: "fawsb"
    },
    "Font Awesome 7 Utility": {
      600: "fausb",
      normal: "fausb"
    },
    "Font Awesome 7 Utility Duo": {
      600: "faudsb",
      normal: "faudsb"
    },
    "Font Awesome 7 Utility Fill": {
      600: "faufsb",
      normal: "faufsb"
    }
  };
var Ql = new Map([["classic", {
    defaultShortPrefixId: "fas",
    defaultStyleId: "solid",
    styleIds: ["solid", "regular", "light", "thin", "brands"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["duotone", {
    defaultShortPrefixId: "fad",
    defaultStyleId: "solid",
    styleIds: ["solid", "regular", "light", "thin"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["sharp", {
    defaultShortPrefixId: "fass",
    defaultStyleId: "solid",
    styleIds: ["solid", "regular", "light", "thin"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["sharp-duotone", {
    defaultShortPrefixId: "fasds",
    defaultStyleId: "solid",
    styleIds: ["solid", "regular", "light", "thin"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["chisel", {
    defaultShortPrefixId: "facr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["etch", {
    defaultShortPrefixId: "faes",
    defaultStyleId: "solid",
    styleIds: ["solid"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["graphite", {
    defaultShortPrefixId: "fagt",
    defaultStyleId: "thin",
    styleIds: ["thin"],
    futureStyleIds: [],
    defaultFontWeight: 100
  }], ["jelly", {
    defaultShortPrefixId: "fajr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["jelly-duo", {
    defaultShortPrefixId: "fajdr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["jelly-fill", {
    defaultShortPrefixId: "fajfr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["mosaic", {
    defaultShortPrefixId: "fams",
    defaultStyleId: "solid",
    styleIds: ["solid"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["notdog", {
    defaultShortPrefixId: "fans",
    defaultStyleId: "solid",
    styleIds: ["solid"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["notdog-duo", {
    defaultShortPrefixId: "fands",
    defaultStyleId: "solid",
    styleIds: ["solid"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["pixel", {
    defaultShortPrefixId: "fapr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["slab", {
    defaultShortPrefixId: "faslr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["slab-duo", {
    defaultShortPrefixId: "fasldr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["slab-press", {
    defaultShortPrefixId: "faslpr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["slab-press-duo", {
    defaultShortPrefixId: "faslpdr",
    defaultStyleId: "regular",
    styleIds: ["regular"],
    futureStyleIds: [],
    defaultFontWeight: 400
  }], ["thumbprint", {
    defaultShortPrefixId: "fatl",
    defaultStyleId: "light",
    styleIds: ["light"],
    futureStyleIds: [],
    defaultFontWeight: 300
  }], ["utility", {
    defaultShortPrefixId: "fausb",
    defaultStyleId: "semibold",
    styleIds: ["semibold"],
    futureStyleIds: [],
    defaultFontWeight: 600
  }], ["utility-duo", {
    defaultShortPrefixId: "faudsb",
    defaultStyleId: "semibold",
    styleIds: ["semibold"],
    futureStyleIds: [],
    defaultFontWeight: 600
  }], ["utility-fill", {
    defaultShortPrefixId: "faufsb",
    defaultStyleId: "semibold",
    styleIds: ["semibold"],
    futureStyleIds: [],
    defaultFontWeight: 600
  }], ["vellum", {
    defaultShortPrefixId: "favs",
    defaultStyleId: "solid",
    styleIds: ["solid"],
    futureStyleIds: [],
    defaultFontWeight: 900
  }], ["whiteboard", {
    defaultShortPrefixId: "fawsb",
    defaultStyleId: "semibold",
    styleIds: ["semibold"],
    futureStyleIds: [],
    defaultFontWeight: 600
  }]]),
  $l = {
    chisel: {
      regular: "facr"
    },
    classic: {
      brands: "fab",
      light: "fal",
      regular: "far",
      solid: "fas",
      thin: "fat"
    },
    duotone: {
      light: "fadl",
      regular: "fadr",
      solid: "fad",
      thin: "fadt"
    },
    etch: {
      solid: "faes"
    },
    graphite: {
      thin: "fagt"
    },
    jelly: {
      regular: "fajr"
    },
    "jelly-duo": {
      regular: "fajdr"
    },
    "jelly-fill": {
      regular: "fajfr"
    },
    mosaic: {
      solid: "fams"
    },
    notdog: {
      solid: "fans"
    },
    "notdog-duo": {
      solid: "fands"
    },
    pixel: {
      regular: "fapr"
    },
    sharp: {
      light: "fasl",
      regular: "fasr",
      solid: "fass",
      thin: "fast"
    },
    "sharp-duotone": {
      light: "fasdl",
      regular: "fasdr",
      solid: "fasds",
      thin: "fasdt"
    },
    slab: {
      regular: "faslr"
    },
    "slab-duo": {
      regular: "fasldr"
    },
    "slab-press": {
      regular: "faslpr"
    },
    "slab-press-duo": {
      regular: "faslpdr"
    },
    thumbprint: {
      light: "fatl"
    },
    utility: {
      semibold: "fausb"
    },
    "utility-duo": {
      semibold: "faudsb"
    },
    "utility-fill": {
      semibold: "faufsb"
    },
    vellum: {
      solid: "favs"
    },
    whiteboard: {
      semibold: "fawsb"
    }
  };
var at = ["fak", "fa-kit", "fakd", "fa-kit-duotone"],
  rt = {
    kit: {
      fak: "kit",
      "fa-kit": "kit"
    },
    "kit-duotone": {
      fakd: "kit-duotone",
      "fa-kit-duotone": "kit-duotone"
    }
  },
  it = ["kit"];
var H = "kit",
  f = "kit-duotone",
  Q = "Kit",
  X = "Kit Duotone";
  _defineProperty$1(_defineProperty$1({}, H, Q), f, X);
var mt = {
  kit: {
    "fa-kit": "fak"
  }};
var ct = {
    "Font Awesome Kit": {
      400: "fak",
      normal: "fak"
    },
    "Font Awesome Kit Duotone": {
      400: "fakd",
      normal: "fakd"
    }
  },
  It = {
    kit: {
      fak: "fa-kit"
    }};
var St = {
    kit: {
      kit: "fak"
    },
    "kit-duotone": {
      "kit-duotone": "fakd"
    }
  };

var _jl;
var l$1 = {
    GROUP: "duotone-group",
    SWAP_OPACITY: "swap-opacity",
    PRIMARY: "primary",
    SECONDARY: "secondary"
  },
  n$1 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone", "fa-thumbprint", "fa-whiteboard", "fa-notdog", "fa-notdog-duo", "fa-chisel", "fa-etch", "fa-graphite", "fa-jelly", "fa-jelly-fill", "fa-jelly-duo", "fa-slab", "fa-slab-press", "fa-slab-press-duo", "fa-slab-duo", "fa-mosaic", "fa-pixel", "fa-vellum", "fa-utility", "fa-utility-duo", "fa-utility-fill"];
var g$1 = "classic",
  a$1 = "duotone",
  m$1 = "sharp",
  t$1 = "sharp-duotone",
  p$1 = "chisel",
  y$1 = "etch",
  b$1 = "graphite",
  w$1 = "jelly",
  e$1 = "jelly-duo",
  x$1 = "jelly-fill",
  c$1 = "mosaic",
  I$1 = "notdog",
  o$1 = "notdog-duo",
  v$1 = "pixel",
  F$1 = "slab",
  r$1 = "slab-duo",
  S$1 = "slab-press",
  i$1 = "slab-press-duo",
  d$1 = "thumbprint",
  A$1 = "utility",
  f$1 = "utility-duo",
  P$1 = "utility-fill",
  u$1 = "vellum",
  j$1 = "whiteboard",
  B$1 = "Classic",
  N$1 = "Duotone",
  D$1 = "Sharp",
  k$1 = "Sharp Duotone",
  C$1 = "Chisel",
  T$1 = "Etch",
  L$1 = "Graphite",
  W$1 = "Jelly",
  R$1 = "Jelly Duo",
  K$1 = "Jelly Fill",
  U$1 = "Mosaic",
  J$1 = "Notdog",
  _$1 = "Notdog Duo",
  M$1 = "Pixel",
  E$1 = "Slab",
  G$1 = "Slab Duo",
  O$1 = "Slab Press",
  V$1 = "Slab Press Duo",
  z$1 = "Thumbprint",
  Y$1 = "Utility",
  $$1 = "Utility Duo",
  q$1 = "Utility Fill",
  H$1 = "Vellum",
  Q$1 = "Whiteboard";
  (_jl = {}, _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_jl, g$1, B$1), a$1, N$1), m$1, D$1), t$1, k$1), p$1, C$1), y$1, T$1), b$1, L$1), w$1, W$1), e$1, R$1), x$1, K$1), _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_jl, c$1, U$1), I$1, J$1), o$1, _$1), v$1, M$1), F$1, E$1), r$1, G$1), S$1, O$1), i$1, V$1), d$1, z$1), A$1, Y$1), _defineProperty$1(_defineProperty$1(_defineProperty$1(_defineProperty$1(_jl, f$1, $$1), P$1, q$1), u$1, H$1), j$1, Q$1));
var X$1 = "kit",
  h$1 = "kit-duotone",
  Z$1 = "Kit",
  ll$1 = "Kit Duotone";
  _defineProperty$1(_defineProperty$1({}, X$1, Z$1), h$1, ll$1);
var ra = {
    classic: {
      "fa-brands": "fab",
      "fa-duotone": "fad",
      "fa-light": "fal",
      "fa-regular": "far",
      "fa-solid": "fas",
      "fa-thin": "fat"
    },
    duotone: {
      "fa-regular": "fadr",
      "fa-light": "fadl",
      "fa-thin": "fadt"
    },
    sharp: {
      "fa-solid": "fass",
      "fa-regular": "fasr",
      "fa-light": "fasl",
      "fa-thin": "fast"
    },
    "sharp-duotone": {
      "fa-solid": "fasds",
      "fa-regular": "fasdr",
      "fa-light": "fasdl",
      "fa-thin": "fasdt"
    },
    slab: {
      "fa-regular": "faslr"
    },
    "slab-press": {
      "fa-regular": "faslpr"
    },
    "slab-duo": {
      "fa-regular": "fasldr"
    },
    "slab-press-duo": {
      "fa-regular": "faslpdr"
    },
    pixel: {
      "fa-regular": "fapr"
    },
    mosaic: {
      "fa-solid": "fams"
    },
    vellum: {
      "fa-solid": "favs"
    },
    whiteboard: {
      "fa-semibold": "fawsb"
    },
    thumbprint: {
      "fa-light": "fatl"
    },
    notdog: {
      "fa-solid": "fans"
    },
    "notdog-duo": {
      "fa-solid": "fands"
    },
    etch: {
      "fa-solid": "faes"
    },
    graphite: {
      "fa-thin": "fagt"
    },
    jelly: {
      "fa-regular": "fajr"
    },
    "jelly-fill": {
      "fa-regular": "fajfr"
    },
    "jelly-duo": {
      "fa-regular": "fajdr"
    },
    chisel: {
      "fa-regular": "facr"
    },
    utility: {
      "fa-semibold": "fausb"
    },
    "utility-duo": {
      "fa-semibold": "faudsb"
    },
    "utility-fill": {
      "fa-semibold": "faufsb"
    }
  },
  al$1 = {
    classic: ["fas", "far", "fal", "fat", "fad"],
    duotone: ["fadr", "fadl", "fadt"],
    sharp: ["fass", "fasr", "fasl", "fast"],
    "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"],
    slab: ["faslr"],
    "slab-press": ["faslpr"],
    "slab-duo": ["fasldr"],
    "slab-press-duo": ["faslpdr"],
    pixel: ["fapr"],
    mosaic: ["fams"],
    vellum: ["favs"],
    whiteboard: ["fawsb"],
    thumbprint: ["fatl"],
    notdog: ["fans"],
    "notdog-duo": ["fands"],
    etch: ["faes"],
    graphite: ["fagt"],
    jelly: ["fajr"],
    "jelly-fill": ["fajfr"],
    "jelly-duo": ["fajdr"],
    chisel: ["facr"],
    utility: ["fausb"],
    "utility-duo": ["faudsb"],
    "utility-fill": ["faufsb"]
  },
  da = {
    classic: {
      fab: "fa-brands",
      fad: "fa-duotone",
      fal: "fa-light",
      far: "fa-regular",
      fas: "fa-solid",
      fat: "fa-thin"
    },
    duotone: {
      fadr: "fa-regular",
      fadl: "fa-light",
      fadt: "fa-thin"
    },
    sharp: {
      fass: "fa-solid",
      fasr: "fa-regular",
      fasl: "fa-light",
      fast: "fa-thin"
    },
    "sharp-duotone": {
      fasds: "fa-solid",
      fasdr: "fa-regular",
      fasdl: "fa-light",
      fasdt: "fa-thin"
    },
    slab: {
      faslr: "fa-regular"
    },
    "slab-press": {
      faslpr: "fa-regular"
    },
    "slab-duo": {
      fasldr: "fa-regular"
    },
    "slab-press-duo": {
      faslpdr: "fa-regular"
    },
    pixel: {
      fapr: "fa-regular"
    },
    mosaic: {
      fams: "fa-solid"
    },
    vellum: {
      favs: "fa-solid"
    },
    whiteboard: {
      fawsb: "fa-semibold"
    },
    thumbprint: {
      fatl: "fa-light"
    },
    notdog: {
      fans: "fa-solid"
    },
    "notdog-duo": {
      fands: "fa-solid"
    },
    etch: {
      faes: "fa-solid"
    },
    graphite: {
      fagt: "fa-thin"
    },
    jelly: {
      fajr: "fa-regular"
    },
    "jelly-fill": {
      fajfr: "fa-regular"
    },
    "jelly-duo": {
      fajdr: "fa-regular"
    },
    chisel: {
      facr: "fa-regular"
    },
    utility: {
      fausb: "fa-semibold"
    },
    "utility-duo": {
      faudsb: "fa-semibold"
    },
    "utility-fill": {
      faufsb: "fa-semibold"
    }
  },
  tl = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands", "fa-semibold"],
  ha = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", "faslr", "faslpr", "fasldr", "faslpdr", "fapr", "fams", "favs", "fawsb", "fatl", "fans", "fands", "faes", "fagt", "fajr", "fajfr", "fajdr", "facr", "fausb", "faudsb", "faufsb"].concat(n$1, tl),
  el$1 = ["solid", "regular", "light", "thin", "duotone", "brands", "semibold"],
  sl$1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  ol$1 = sl$1.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  rl$1 = ["aw", "fw", "pull-left", "pull-right"],
  ga = [].concat(_toConsumableArray$1(Object.keys(al$1)), el$1, rl$1, ["2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "beat-fade", "border", "bounce", "buzz", "canvas-square", "canvas-roomy", "fade", "flip-360", "flip-both", "flip-horizontal", "flip-vertical", "flip", "float", "inverse", "jello", "layers", "layers-bottom-left", "layers-bottom-right", "layers-counter", "layers-text", "layers-top-left", "layers-top-right", "li", "pull-end", "pull-start", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "spin-snap", "spin-snap-4", "spin-snap-8", "stack-1x", "stack-2x", "stack", "swing", "ul", "wag", "width-auto", "width-fixed", l$1.GROUP, l$1.SWAP_OPACITY, l$1.PRIMARY, l$1.SECONDARY]).concat(sl$1.map(function (s) {
    return "".concat(s, "x");
  })).concat(ol$1.map(function (s) {
    return "w-".concat(s);
  }));
var wa = {
    "Font Awesome 5 Free": {
      900: "fas",
      400: "far"
    },
    "Font Awesome 5 Pro": {
      900: "fas",
      400: "far",
      normal: "far",
      300: "fal"
    },
    "Font Awesome 5 Brands": {
      400: "fab",
      normal: "fab"
    },
    "Font Awesome 5 Duotone": {
      900: "fad"
    }
  };

var NAMESPACE_IDENTIFIER = '___FONT_AWESOME___';
var UNITS_IN_GRID = 16;
var DEFAULT_CSS_PREFIX = 'fa';
var DEFAULT_REPLACEMENT_CLASS = 'svg-inline--fa';
var DATA_FA_I2SVG = 'data-fa-i2svg';
var DATA_FA_PSEUDO_ELEMENT = 'data-fa-pseudo-element';
var DATA_FA_PSEUDO_ELEMENT_PENDING = 'data-fa-pseudo-element-pending';
var DATA_PREFIX = 'data-prefix';
var DATA_ICON = 'data-icon';
var HTML_CLASS_I2SVG_BASE_CLASS = 'fontawesome-i2svg';
var MUTATION_APPROACH_ASYNC = 'async';
var TAGNAMES_TO_SKIP_FOR_PSEUDOELEMENTS = ['HTML', 'HEAD', 'STYLE', 'SCRIPT'];
var PSEUDO_ELEMENTS = ['::before', '::after', ':before', ':after'];
var PRODUCTION$1 = function () {
  try {
    return process.env.NODE_ENV === 'production';
  } catch (e$$1) {
    return false;
  }
}();
function familyProxy(obj) {
  // Defaults to the classic family if family is not available
  return new Proxy(obj, {
    get: function get(target, prop) {
      return prop in target ? target[prop] : target[u];
    }
  });
}
var _PREFIX_TO_STYLE = _objectSpread2$1({}, rl);

// We changed FACSSClassesToStyleId in the icons repo to be canonical and as such, "classic" family does not have any
// duotone styles.  But we do still need duotone in _PREFIX_TO_STYLE below, so we are manually adding
// {'fa-duotone': 'duotone'}
_PREFIX_TO_STYLE[u] = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  'fa-duotone': 'duotone'
}), rl[u]), rt['kit']), rt['kit-duotone']);
var PREFIX_TO_STYLE = familyProxy(_PREFIX_TO_STYLE);
var _STYLE_TO_PREFIX = _objectSpread2$1({}, $l);

// We changed FAStyleIdToShortPrefixId in the icons repo to be canonical and as such, "classic" family does not have any
// duotone styles.  But we do still need duotone in _STYLE_TO_PREFIX below, so we are manually adding {duotone: 'fad'}
_STYLE_TO_PREFIX[u] = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  duotone: 'fad'
}), _STYLE_TO_PREFIX[u]), St['kit']), St['kit-duotone']);
var STYLE_TO_PREFIX = familyProxy(_STYLE_TO_PREFIX);
var _PREFIX_TO_LONG_STYLE = _objectSpread2$1({}, da);
_PREFIX_TO_LONG_STYLE[u] = _objectSpread2$1(_objectSpread2$1({}, _PREFIX_TO_LONG_STYLE[u]), It['kit']);
var PREFIX_TO_LONG_STYLE = familyProxy(_PREFIX_TO_LONG_STYLE);
var _LONG_STYLE_TO_PREFIX = _objectSpread2$1({}, ra);
_LONG_STYLE_TO_PREFIX[u] = _objectSpread2$1(_objectSpread2$1({}, _LONG_STYLE_TO_PREFIX[u]), mt['kit']);
familyProxy(_LONG_STYLE_TO_PREFIX);
var ICON_SELECTION_SYNTAX_PATTERN = Z;
var LAYERS_TEXT_CLASSNAME = 'fa-layers-text';
var FONT_FAMILY_PATTERN = $;
var _FONT_WEIGHT_TO_PREFIX = _objectSpread2$1({}, Al);
familyProxy(_FONT_WEIGHT_TO_PREFIX);
var ATTRIBUTES_WATCHED_FOR_MUTATION = ['class', 'data-prefix', 'data-icon', 'data-fa-transform', 'data-fa-mask'];
var DUOTONE_CLASSES = il;
var RESERVED_CLASSES = [].concat(_toConsumableArray$1(it), _toConsumableArray$1(ga));

var initial = WINDOW.FontAwesomeConfig || {};
function getAttrConfig(attr) {
  var element = DOCUMENT.querySelector('script[' + attr + ']');
  if (element) {
    return element.getAttribute(attr);
  }
}
function coerce(val) {
  // Getting an empty string will occur if the attribute is set on the HTML tag but without a value
  // We'll assume that this is an indication that it should be toggled to true
  if (val === '') return true;
  if (val === 'false') return false;
  if (val === 'true') return true;
  return val;
}
if (DOCUMENT && typeof DOCUMENT.querySelector === 'function') {
  var attrs = [['data-family-prefix', 'familyPrefix'], ['data-css-prefix', 'cssPrefix'], ['data-family-default', 'familyDefault'], ['data-style-default', 'styleDefault'], ['data-replacement-class', 'replacementClass'], ['data-auto-replace-svg', 'autoReplaceSvg'], ['data-auto-add-css', 'autoAddCss'], ['data-search-pseudo-elements', 'searchPseudoElements'], ['data-search-pseudo-elements-warnings', 'searchPseudoElementsWarnings'], ['data-search-pseudo-elements-full-scan', 'searchPseudoElementsFullScan'], ['data-observe-mutations', 'observeMutations'], ['data-mutate-approach', 'mutateApproach'], ['data-keep-original-source', 'keepOriginalSource'], ['data-measure-performance', 'measurePerformance'], ['data-show-missing-icons', 'showMissingIcons']];
  attrs.forEach(function (_ref) {
    var _ref2 = _slicedToArray$1(_ref, 2),
      attr = _ref2[0],
      key = _ref2[1];
    var val = coerce(getAttrConfig(attr));
    if (val !== undefined && val !== null) {
      initial[key] = val;
    }
  });
}
var _default = {
  styleDefault: 'solid',
  familyDefault: u,
  cssPrefix: DEFAULT_CSS_PREFIX,
  replacementClass: DEFAULT_REPLACEMENT_CLASS,
  autoReplaceSvg: true,
  autoAddCss: true,
  searchPseudoElements: false,
  searchPseudoElementsWarnings: true,
  searchPseudoElementsFullScan: false,
  observeMutations: true,
  mutateApproach: 'async',
  keepOriginalSource: true,
  measurePerformance: false,
  showMissingIcons: true
};

// familyPrefix is deprecated but we must still support it if present
if (initial.familyPrefix) {
  initial.cssPrefix = initial.familyPrefix;
}
var _config = _objectSpread2$1(_objectSpread2$1({}, _default), initial);
if (!_config.autoReplaceSvg) _config.observeMutations = false;
var config = {};
Object.keys(_default).forEach(function (key) {
  Object.defineProperty(config, key, {
    enumerable: true,
    set: function set(val) {
      _config[key] = val;
      _onChangeCb.forEach(function (cb) {
        return cb(config);
      });
    },
    get: function get() {
      return _config[key];
    }
  });
});

// familyPrefix is deprecated as of 6.2.0 and should be removed in 7.0.0
Object.defineProperty(config, 'familyPrefix', {
  enumerable: true,
  set: function set(val) {
    _config.cssPrefix = val;
    _onChangeCb.forEach(function (cb) {
      return cb(config);
    });
  },
  get: function get() {
    return _config.cssPrefix;
  }
});
WINDOW.FontAwesomeConfig = config;
var _onChangeCb = [];
function onChange(cb) {
  _onChangeCb.push(cb);
  return function () {
    _onChangeCb.splice(_onChangeCb.indexOf(cb), 1);
  };
}

var d$2 = UNITS_IN_GRID;
var meaninglessTransform = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: false,
  flipY: false
};
function insertCss(css) {
  if (!css || !IS_DOM) {
    return;
  }
  var style = DOCUMENT.createElement('style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  var headChildren = DOCUMENT.head.childNodes;
  var beforeChild = null;
  for (var i = headChildren.length - 1; i > -1; i--) {
    var child = headChildren[i];
    var tagName = (child.tagName || '').toUpperCase();
    if (['STYLE', 'LINK'].indexOf(tagName) > -1) {
      beforeChild = child;
    }
  }
  DOCUMENT.head.insertBefore(style, beforeChild);
  return css;
}
var idPool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function nextUniqueId() {
  var size = 12;
  var id = '';
  while (size-- > 0) {
    id += idPool[Math.random() * 62 | 0];
  }
  return id;
}
function toArray(obj) {
  var array = [];
  for (var i = (obj || []).length >>> 0; i--;) {
    array[i] = obj[i];
  }
  return array;
}
function classArray(node) {
  if (node.classList) {
    return toArray(node.classList);
  } else {
    return (node.getAttribute('class') || '').split(' ').filter(function (i) {
      return i;
    });
  }
}
function htmlEscape(str) {
  return "".concat(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function joinAttributes(attributes) {
  return Object.keys(attributes || {}).reduce(function (acc, attributeName) {
    return acc + "".concat(attributeName, "=\"").concat(htmlEscape(attributes[attributeName]), "\" ");
  }, '').trim();
}
function joinStyles(styles) {
  return Object.keys(styles || {}).reduce(function (acc, styleName) {
    return acc + "".concat(styleName, ": ").concat(styles[styleName].trim(), ";");
  }, '');
}
function transformIsMeaningful(transform) {
  return transform.size !== meaninglessTransform.size || transform.x !== meaninglessTransform.x || transform.y !== meaninglessTransform.y || transform.rotate !== meaninglessTransform.rotate || transform.flipX || transform.flipY;
}
function transformForSvg(_ref) {
  var transform = _ref.transform,
    containerWidth = _ref.containerWidth,
    iconWidth = _ref.iconWidth;
  var outer = {
    transform: "translate(".concat(containerWidth / 2, " 256)")
  };
  var innerTranslate = "translate(".concat(transform.x * 32, ", ").concat(transform.y * 32, ") ");
  var innerScale = "scale(".concat(transform.size / 16 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / 16 * (transform.flipY ? -1 : 1), ") ");
  var innerRotate = "rotate(".concat(transform.rotate, " 0 0)");
  var inner = {
    transform: "".concat(innerTranslate, " ").concat(innerScale, " ").concat(innerRotate)
  };
  var path = {
    transform: "translate(".concat(iconWidth / 2 * -1, " -256)")
  };
  return {
    outer: outer,
    inner: inner,
    path: path
  };
}
function transformForCss(_ref2) {
  var transform = _ref2.transform,
    _ref2$width = _ref2.width,
    width = _ref2$width === void 0 ? UNITS_IN_GRID : _ref2$width,
    _ref2$height = _ref2.height,
    height = _ref2$height === void 0 ? UNITS_IN_GRID : _ref2$height;
  var val = '';
  if (IS_IE) {
    val += "translate(".concat(transform.x / d$2 - width / 2, "em, ").concat(transform.y / d$2 - height / 2, "em) ");
  } else {
    val += "translate(calc(-50% + ".concat(transform.x / d$2, "em), calc(-50% + ").concat(transform.y / d$2, "em)) ");
  }
  val += "scale(".concat(transform.size / d$2 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / d$2 * (transform.flipY ? -1 : 1), ") ");
  val += "rotate(".concat(transform.rotate, "deg) ");
  return val;
}

var baseStyles = ":root, :host {\n  --fa-font-solid: normal 900 1em/1 'Font Awesome 7 Free';\n  --fa-font-regular: normal 400 1em/1 'Font Awesome 7 Free';\n  --fa-font-light: normal 300 1em/1 'Font Awesome 7 Pro';\n  --fa-font-thin: normal 100 1em/1 'Font Awesome 7 Pro';\n  --fa-font-duotone: normal 900 1em/1 'Font Awesome 7 Duotone';\n  --fa-font-duotone-regular: normal 400 1em/1 'Font Awesome 7 Duotone';\n  --fa-font-duotone-light: normal 300 1em/1 'Font Awesome 7 Duotone';\n  --fa-font-duotone-thin: normal 100 1em/1 'Font Awesome 7 Duotone';\n  --fa-font-brands: normal 400 1em/1 'Font Awesome 7 Brands';\n  --fa-font-sharp-solid: normal 900 1em/1 'Font Awesome 7 Sharp';\n  --fa-font-sharp-regular: normal 400 1em/1 'Font Awesome 7 Sharp';\n  --fa-font-sharp-light: normal 300 1em/1 'Font Awesome 7 Sharp';\n  --fa-font-sharp-thin: normal 100 1em/1 'Font Awesome 7 Sharp';\n  --fa-font-sharp-duotone-solid: normal 900 1em/1 'Font Awesome 7 Sharp Duotone';\n  --fa-font-sharp-duotone-regular: normal 400 1em/1 'Font Awesome 7 Sharp Duotone';\n  --fa-font-sharp-duotone-light: normal 300 1em/1 'Font Awesome 7 Sharp Duotone';\n  --fa-font-sharp-duotone-thin: normal 100 1em/1 'Font Awesome 7 Sharp Duotone';\n  --fa-font-slab-regular: normal 400 1em/1 'Font Awesome 7 Slab';\n  --fa-font-slab-press-regular: normal 400 1em/1 'Font Awesome 7 Slab Press';\n  --fa-font-slab-duo-regular: normal 400 1em/1 'Font Awesome 7 Slab Duo';\n  --fa-font-slab-press-duo-regular: normal 400 1em/1 'Font Awesome 7 Slab Press Duo';\n  --fa-font-pixel-regular: normal 400 1em/1 'Font Awesome 7 Pixel';\n  --fa-font-mosaic-solid: normal 900 1em/1 'Font Awesome 7 Mosaic';\n  --fa-font-vellum-solid: normal 900 1em/1 'Font Awesome 7 Vellum';\n  --fa-font-whiteboard-semibold: normal 600 1em/1 'Font Awesome 7 Whiteboard';\n  --fa-font-thumbprint-light: normal 300 1em/1 'Font Awesome 7 Thumbprint';\n  --fa-font-notdog-solid: normal 900 1em/1 'Font Awesome 7 Notdog';\n  --fa-font-notdog-duo-solid: normal 900 1em/1 'Font Awesome 7 Notdog Duo';\n  --fa-font-etch-solid: normal 900 1em/1 'Font Awesome 7 Etch';\n  --fa-font-graphite-thin: normal 100 1em/1 'Font Awesome 7 Graphite';\n  --fa-font-jelly-regular: normal 400 1em/1 'Font Awesome 7 Jelly';\n  --fa-font-jelly-fill-regular: normal 400 1em/1 'Font Awesome 7 Jelly Fill';\n  --fa-font-jelly-duo-regular: normal 400 1em/1 'Font Awesome 7 Jelly Duo';\n  --fa-font-chisel-regular: normal 400 1em/1 'Font Awesome 7 Chisel';\n  --fa-font-utility-semibold: normal 600 1em/1 'Font Awesome 7 Utility';\n  --fa-font-utility-duo-semibold: normal 600 1em/1 'Font Awesome 7 Utility Duo';\n  --fa-font-utility-fill-semibold: normal 600 1em/1 'Font Awesome 7 Utility Fill';\n}\n\n.svg-inline--fa {\n  box-sizing: content-box;\n  display: var(--fa-display, inline-block);\n  height: 1em;\n  overflow: visible;\n  vertical-align: -0.125em;\n  width: var(--fa-width, 1.25em);\n}\n.svg-inline--fa.fa-2xs {\n  vertical-align: 0.1em;\n}\n.svg-inline--fa.fa-xs {\n  vertical-align: 0em;\n}\n.svg-inline--fa.fa-sm {\n  vertical-align: -0.0714285714em;\n}\n.svg-inline--fa.fa-lg {\n  vertical-align: -0.2em;\n}\n.svg-inline--fa.fa-xl {\n  vertical-align: -0.25em;\n}\n.svg-inline--fa.fa-2xl {\n  vertical-align: -0.3125em;\n}\n.svg-inline--fa.fa-pull-left,\n.svg-inline--fa .fa-pull-start {\n  float: inline-start;\n  margin-inline-end: var(--fa-pull-margin, 0.3em);\n}\n.svg-inline--fa.fa-pull-right,\n.svg-inline--fa .fa-pull-end {\n  float: inline-end;\n  margin-inline-start: var(--fa-pull-margin, 0.3em);\n}\n.svg-inline--fa.fa-li {\n  width: var(--fa-li-width, 2em);\n  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));\n  inset-block-start: 0.25em; /* syncing vertical alignment with Web Font rendering */\n}\n\n.fa-layers-counter, .fa-layers-text {\n  display: inline-block;\n  position: absolute;\n  text-align: center;\n}\n\n.fa-layers {\n  display: inline-block;\n  height: 1em;\n  position: relative;\n  text-align: center;\n  vertical-align: -0.125em;\n  width: var(--fa-width, 1.25em);\n}\n.fa-layers .svg-inline--fa {\n  inset: 0;\n  margin: auto;\n  position: absolute;\n  transform-origin: center center;\n}\n\n.fa-layers-text {\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  transform-origin: center center;\n}\n\n.fa-layers-counter {\n  background-color: var(--fa-counter-background-color, #ff253a);\n  border-radius: var(--fa-counter-border-radius, 1em);\n  box-sizing: border-box;\n  color: var(--fa-inverse, #fff);\n  line-height: var(--fa-counter-line-height, 1);\n  max-width: var(--fa-counter-max-width, 5em);\n  min-width: var(--fa-counter-min-width, 1.5em);\n  overflow: hidden;\n  padding: var(--fa-counter-padding, 0.25em 0.5em);\n  right: var(--fa-right, 0);\n  text-overflow: ellipsis;\n  top: var(--fa-top, 0);\n  transform: scale(var(--fa-counter-scale, 0.25));\n  transform-origin: top right;\n}\n\n.fa-layers-bottom-right {\n  bottom: var(--fa-bottom, 0);\n  right: var(--fa-right, 0);\n  top: auto;\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: bottom right;\n}\n\n.fa-layers-bottom-left {\n  bottom: var(--fa-bottom, 0);\n  left: var(--fa-left, 0);\n  right: auto;\n  top: auto;\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: bottom left;\n}\n\n.fa-layers-top-right {\n  top: var(--fa-top, 0);\n  right: var(--fa-right, 0);\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: top right;\n}\n\n.fa-layers-top-left {\n  left: var(--fa-left, 0);\n  right: auto;\n  top: var(--fa-top, 0);\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: top left;\n}\n\n.fa-1x {\n  font-size: 1em;\n}\n\n.fa-2x {\n  font-size: 2em;\n}\n\n.fa-3x {\n  font-size: 3em;\n}\n\n.fa-4x {\n  font-size: 4em;\n}\n\n.fa-5x {\n  font-size: 5em;\n}\n\n.fa-6x {\n  font-size: 6em;\n}\n\n.fa-7x {\n  font-size: 7em;\n}\n\n.fa-8x {\n  font-size: 8em;\n}\n\n.fa-9x {\n  font-size: 9em;\n}\n\n.fa-10x {\n  font-size: 10em;\n}\n\n.fa-2xs {\n  font-size: calc(10 / 16 * 1em); /* converts a 10px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 10 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 10 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-xs {\n  font-size: calc(12 / 16 * 1em); /* converts a 12px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 12 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 12 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-sm {\n  font-size: calc(14 / 16 * 1em); /* converts a 14px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 14 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 14 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-lg {\n  font-size: calc(20 / 16 * 1em); /* converts a 20px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 20 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 20 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-xl {\n  font-size: calc(24 / 16 * 1em); /* converts a 24px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 24 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 24 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-2xl {\n  font-size: calc(32 / 16 * 1em); /* converts a 32px size into an em-based value that's relative to the scale's 16px base */\n  line-height: calc(1 / 32 * 1em); /* sets the line-height of the icon back to that of it's parent */\n  vertical-align: calc((6 / 32 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */\n}\n\n.fa-width-auto {\n  --fa-width: auto;\n}\n\n.fa-fw,\n.fa-width-fixed {\n  --fa-width: 1.25em;\n}\n\n.fa-canvas-square {\n  padding-block: 0.125em;\n  margin-block-end: -0.125em;\n}\n\n.fa-canvas-roomy {\n  padding-block: 0.25em;\n  padding-inline: 0.125em;\n  margin-block-end: -0.25em;\n  box-sizing: content-box;\n}\n\n.fa-ul {\n  list-style-type: none;\n  margin-inline-start: var(--fa-li-margin, 2.5em);\n  padding-inline-start: 0;\n}\n.fa-ul > li {\n  position: relative;\n}\n\n.fa-li {\n  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));\n  position: absolute;\n  text-align: center;\n  width: var(--fa-li-width, 2em);\n  line-height: inherit;\n}\n\n/* Heads Up: Bordered Icons will not be supported in the future!\n  - This feature will be deprecated in the next major release of Font Awesome (v8)!\n  - You may continue to use it in this version *v7), but it will not be supported in Font Awesome v8.\n*/\n/* Notes:\n* --@{v.$css-prefix}-border-width = 1/16 by default (to render as ~1px based on a 16px default font-size)\n* --@{v.$css-prefix}-border-padding =\n  ** 3/16 for vertical padding (to give ~2px of vertical whitespace around an icon considering it's vertical alignment)\n  ** 4/16 for horizontal padding (to give ~4px of horizontal whitespace around an icon)\n*/\n.fa-border {\n  border-color: var(--fa-border-color, #eee);\n  border-radius: var(--fa-border-radius, 0.1em);\n  border-style: var(--fa-border-style, solid);\n  border-width: var(--fa-border-width, 0.0625em);\n  box-sizing: var(--fa-border-box-sizing, content-box);\n  padding: var(--fa-border-padding, 0.1875em 0.25em);\n}\n\n.fa-pull-left,\n.fa-pull-start {\n  float: inline-start;\n  margin-inline-end: var(--fa-pull-margin, 0.3em);\n}\n\n.fa-pull-right,\n.fa-pull-end {\n  float: inline-end;\n  margin-inline-start: var(--fa-pull-margin, 0.3em);\n}\n\n.fa-beat {\n  animation-name: fa-beat;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-bounce {\n  animation-name: fa-bounce;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));\n}\n\n.fa-fade {\n  animation-name: fa-fade;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-beat-fade {\n  animation-name: fa-beat-fade;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-flip {\n  animation-name: fa-flip;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1.5s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-flip-360 {\n  animation-name: fa-flip-360;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-shake {\n  animation-name: fa-shake;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 0.75s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-spin {\n  animation-name: fa-spin;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 2s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-spin-reverse {\n  --fa-animation-direction: reverse;\n}\n\n.fa-pulse,\n.fa-spin-pulse {\n  animation-name: fa-spin;\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, steps(8));\n}\n\n.fa-spin-snap {\n  animation-name: fa-spin-snap;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 3s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-spin-snap-4 {\n  animation-name: fa-spin-snap-4;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 2.4s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-spin-snap-8 {\n  animation-name: fa-spin-snap-8;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 4s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-buzz {\n  animation-name: fa-buzz;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 0.6s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-wag {\n  animation-name: fa-wag;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 0.9s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-out);\n  transform-origin: bottom center;\n}\n\n.fa-float {\n  animation-name: fa-float;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 3s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n  will-change: transform;\n}\n\n.fa-swing {\n  animation-name: fa-swing;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1.2s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-out);\n  transform-origin: top center;\n}\n\n.fa-jello {\n  animation-name: fa-jello;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 0.9s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-out);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .fa-beat,\n  .fa-bounce,\n  .fa-fade,\n  .fa-beat-fade,\n  .fa-flip,\n  .fa-flip-360,\n  .fa-pulse,\n  .fa-shake,\n  .fa-spin,\n  .fa-spin-pulse,\n  .fa-buzz,\n  .fa-float,\n  .fa-jello,\n  .fa-spin-snap,\n  .fa-spin-snap-4,\n  .fa-spin-snap-8,\n  .fa-swing,\n  .fa-wag {\n    animation: none !important;\n    transition: none !important;\n  }\n}\n@keyframes fa-beat {\n  0% {\n    transform: scale(1);\n  }\n  25% {\n    transform: scale(calc(1.25 * var(--fa-beat-scale, 1.25)));\n  }\n  45% {\n    transform: scale(calc(1.22 * var(--fa-beat-scale, 1.22)));\n  }\n  65% {\n    transform: scale(calc(1.25 * var(--fa-beat-scale, 1.25)));\n  }\n  90% {\n    transform: scale(1);\n  }\n}\n@keyframes fa-bounce {\n  0% {\n    transform: scale(1, 1) translateY(0);\n    animation-timing-function: var(--fa-animation-timing);\n  }\n  14% {\n    transform: scale(var(--fa-bounce-start-scale-x, 1.06), var(--fa-bounce-start-scale-y, 0.94)) translateY(var(--fa-bounce-anticipation, 3px));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);\n  }\n  32% {\n    transform: scale(var(--fa-bounce-jump-scale-x, 0.94), var(--fa-bounce-jump-scale-y, 1.12)) translateY(calc(-1 * var(--fa-bounce-height, 0.5em)));\n    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);\n  }\n  52% {\n    transform: scale(1, 1) translateY(calc(-1 * var(--fa-bounce-height, 0.5em) * 1.1));\n    animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);\n  }\n  70% {\n    transform: scale(var(--fa-bounce-land-scale-x, 1.06), var(--fa-bounce-land-scale-y, 0.92)) translateY(0);\n    animation-timing-function: cubic-bezier(0.33, 0.33, 0.66, 1);\n  }\n  85% {\n    transform: scale(0.98, 1.04) translateY(calc(-2px * var(--fa-bounce-rebound, 1)));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);\n  }\n  100% {\n    transform: scale(1, 1) translateY(0);\n  }\n}\n@keyframes fa-fade {\n  0% {\n    opacity: 1;\n    transform: scale(1);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);\n  }\n  40% {\n    opacity: var(--fa-fade-opacity, 0.4);\n    transform: scale(0.98);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: scale(1);\n  }\n}\n@keyframes fa-beat-fade {\n  0% {\n    opacity: var(--fa-beat-fade-opacity, 0.4);\n    transform: scale(1);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);\n  }\n  25% {\n    opacity: calc(var(--fa-beat-fade-opacity, 0.4) + 0.4);\n    transform: scale(var(--fa-beat-fade-scale, 1.28));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  45% {\n    opacity: 1;\n    transform: scale(var(--fa-beat-fade-scale, 1.25));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  65% {\n    opacity: calc(var(--fa-beat-fade-opacity, 0.4) + 0.4);\n    transform: scale(var(--fa-beat-fade-scale, 1.28));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  100% {\n    opacity: var(--fa-beat-fade-opacity, 0.4);\n    transform: scale(1);\n  }\n}\n@keyframes fa-flip {\n  0% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);\n  }\n  8% {\n    transform: perspective(2em) scale(var(--fa-flip-anticipation-scale, 0.95)) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);\n  }\n  35% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.6));\n    animation-timing-function: linear;\n  }\n  65% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.5));\n    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);\n  }\n  92% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * var(--fa-flip-overshoot, 1.04)));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);\n  }\n  100% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -360deg));\n  }\n}\n@keyframes fa-flip-360 {\n  0% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);\n  }\n  8% {\n    transform: perspective(2em) scale(var(--fa-flip-anticipation-scale, 0.95)) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);\n  }\n  50% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.6));\n    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);\n  }\n  80% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * var(--fa-flip-overshoot, 1.04)));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);\n  }\n  100% {\n    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -360deg));\n  }\n}\n@keyframes fa-shake {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);\n  }\n  8% {\n    transform: rotate(35deg) translateX(1px);\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  20% {\n    transform: rotate(-22deg) translateX(-1px);\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  35% {\n    transform: rotate(15deg) translateX(1px);\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  50% {\n    transform: rotate(-9deg);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  65% {\n    transform: rotate(5deg);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  78% {\n    transform: rotate(-3deg);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  90% {\n    transform: rotate(1deg);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  100% {\n    transform: rotate(0deg);\n  }\n}\n@keyframes fa-spin {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n@keyframes fa-spin-snap {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  12% {\n    transform: rotate(60deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  16.67% {\n    transform: rotate(60deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  28.67% {\n    transform: rotate(120deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  33.33% {\n    transform: rotate(120deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  45.33% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  50% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  62% {\n    transform: rotate(240deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  66.67% {\n    transform: rotate(240deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  78.67% {\n    transform: rotate(300deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  83.33% {\n    transform: rotate(300deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  95.33% {\n    transform: rotate(360deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n@keyframes fa-spin-snap-4 {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  15% {\n    transform: rotate(90deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  25% {\n    transform: rotate(90deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  40% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  50% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  65% {\n    transform: rotate(270deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  75% {\n    transform: rotate(270deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  90% {\n    transform: rotate(360deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n@keyframes fa-spin-snap-8 {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  9% {\n    transform: rotate(45deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  12.5% {\n    transform: rotate(45deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  21.5% {\n    transform: rotate(90deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  25% {\n    transform: rotate(90deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  34% {\n    transform: rotate(135deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  37.5% {\n    transform: rotate(135deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  46.5% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  50% {\n    transform: rotate(180deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  59% {\n    transform: rotate(225deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  62.5% {\n    transform: rotate(225deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  71.5% {\n    transform: rotate(270deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  75% {\n    transform: rotate(270deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  84% {\n    transform: rotate(315deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  87.5% {\n    transform: rotate(315deg);\n    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);\n  }\n  96.5% {\n    transform: rotate(360deg);\n    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n@keyframes fa-buzz {\n  0% {\n    transform: translateX(0) rotate(0deg);\n    animation-timing-function: cubic-bezier(0.1, 0, 0.9, 1);\n  }\n  5% {\n    transform: translateX(var(--fa-buzz-distance, 4px)) rotate(0.5deg);\n  }\n  10% {\n    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px))) rotate(-0.5deg);\n  }\n  15% {\n    transform: translateX(var(--fa-buzz-distance, 4px)) rotate(0.3deg);\n  }\n  20% {\n    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px))) rotate(-0.3deg);\n  }\n  25% {\n    transform: translateX(calc(var(--fa-buzz-distance, 4px) * 0.7)) rotate(0.2deg);\n  }\n  30% {\n    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px) * 0.7)) rotate(-0.2deg);\n  }\n  35% {\n    transform: translateX(calc(var(--fa-buzz-distance, 4px) * 0.4)) rotate(0.1deg);\n  }\n  40% {\n    transform: translateX(0) rotate(0deg);\n  }\n  100% {\n    transform: translateX(0) rotate(0deg);\n  }\n}\n@keyframes fa-wag {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);\n  }\n  12% {\n    transform: rotate(var(--fa-wag-angle, 12deg));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  24% {\n    transform: rotate(2deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);\n  }\n  36% {\n    transform: rotate(calc(var(--fa-wag-angle, 12deg) * 0.85));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  48% {\n    transform: rotate(1deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);\n  }\n  58% {\n    transform: rotate(calc(var(--fa-wag-angle, 12deg) * 0.6));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  68% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(0deg);\n  }\n}\n@keyframes fa-float {\n  0% {\n    transform: translateY(0) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);\n  }\n  15% {\n    transform: translateY(calc(-0.4 * var(--fa-float-height, 6px))) translateX(var(--fa-float-drift, 1px)) rotate(var(--fa-float-tilt, 1deg)) scale(1, 1);\n    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);\n  }\n  35% {\n    transform: translateY(calc(-1 * var(--fa-float-height, 6px))) translateX(0) rotate(0deg) scale(var(--fa-float-stretch-x, 0.98), var(--fa-float-stretch-y, 1.03));\n    animation-timing-function: cubic-bezier(0.5, 0, 0.5, 0);\n  }\n  50% {\n    transform: translateY(calc(-0.92 * var(--fa-float-height, 6px))) translateX(calc(-0.5 * var(--fa-float-drift, 1px))) rotate(calc(-0.5 * var(--fa-float-tilt, 1deg))) scale(0.995, 1.01);\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);\n  }\n  70% {\n    transform: translateY(calc(-0.3 * var(--fa-float-height, 6px))) translateX(calc(-1 * var(--fa-float-drift, 1px))) rotate(calc(-1 * var(--fa-float-tilt, 1deg))) scale(1, 1);\n    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);\n  }\n  90% {\n    transform: translateY(calc(0.05 * var(--fa-float-height, 6px))) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));\n    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);\n  }\n  100% {\n    transform: translateY(0) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));\n  }\n}\n@keyframes fa-swing {\n  0% {\n    transform: rotate(0deg);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);\n  }\n  8% {\n    transform: rotate(var(--fa-swing-angle, 22deg));\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  18% {\n    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.85));\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  28% {\n    transform: rotate(calc(var(--fa-swing-angle, 22deg) * 0.65));\n    animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);\n  }\n  38% {\n    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.45));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  48% {\n    transform: rotate(calc(var(--fa-swing-angle, 22deg) * 0.25));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  56% {\n    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.1));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  64% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(0deg);\n  }\n}\n@keyframes fa-jello {\n  0% {\n    transform: scale(1, 1);\n    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);\n  }\n  12% {\n    transform: scale(var(--fa-jello-scale-x, 1.15), calc(2 - var(--fa-jello-scale-x, 1.15)));\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  24% {\n    transform: scale(calc(2 - var(--fa-jello-scale-y, 1.12)), var(--fa-jello-scale-y, 1.12));\n    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);\n  }\n  36% {\n    transform: scale(calc(1 + (var(--fa-jello-scale-x, 1.15) - 1) * 0.5), calc(2 - (1 + (var(--fa-jello-scale-x, 1.15) - 1) * 0.5)));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  48% {\n    transform: scale(calc(2 - (1 + (var(--fa-jello-scale-y, 1.12) - 1) * 0.3)), calc(1 + (var(--fa-jello-scale-y, 1.12) - 1) * 0.3));\n    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);\n  }\n  58% {\n    transform: scale(1.02, 0.98);\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  }\n  68% {\n    transform: scale(1, 1);\n  }\n  100% {\n    transform: scale(1, 1);\n  }\n}\n.fa-rotate-90 {\n  transform: rotate(90deg);\n}\n\n.fa-rotate-180 {\n  transform: rotate(180deg);\n}\n\n.fa-rotate-270 {\n  transform: rotate(270deg);\n}\n\n.fa-flip-horizontal {\n  transform: scale(-1, 1);\n}\n\n.fa-flip-vertical {\n  transform: scale(1, -1);\n}\n\n.fa-flip-both,\n.fa-flip-horizontal.fa-flip-vertical {\n  transform: scale(-1, -1);\n}\n\n.fa-rotate-by {\n  transform: rotate(var(--fa-rotate-angle, 0));\n}\n\n.svg-inline--fa .fa-primary {\n  fill: var(--fa-primary-color, currentColor);\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa .fa-secondary {\n  fill: var(--fa-secondary-color, currentColor);\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-primary {\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-secondary {\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa mask .fa-primary,\n.svg-inline--fa mask .fa-secondary {\n  fill: black;\n}\n\n.svg-inline--fa.fa-inverse {\n  fill: var(--fa-inverse, #fff);\n}\n\n.fa-stack {\n  display: inline-block;\n  height: 2em;\n  line-height: 2em;\n  position: relative;\n  vertical-align: middle;\n  width: 2.5em;\n}\n\n.fa-inverse {\n  color: var(--fa-inverse, #fff);\n}\n\n.svg-inline--fa.fa-stack-1x {\n  --fa-width: 1.25em;\n  height: 1em;\n  width: var(--fa-width);\n}\n.svg-inline--fa.fa-stack-2x {\n  --fa-width: 2.5em;\n  height: 2em;\n  width: var(--fa-width);\n}\n\n.fa-stack-1x,\n.fa-stack-2x {\n  inset: 0;\n  margin: auto;\n  position: absolute;\n  z-index: var(--fa-stack-z-index, auto);\n}";

function css() {
  var dcp = DEFAULT_CSS_PREFIX;
  var drc = DEFAULT_REPLACEMENT_CLASS;
  var fp = config.cssPrefix;
  var rc = config.replacementClass;
  var s = baseStyles;
  if (fp !== dcp || rc !== drc) {
    var dPatt = new RegExp("\\.".concat(dcp, "\\-"), 'g');
    var customPropPatt = new RegExp("\\--".concat(dcp, "\\-"), 'g');
    var rPatt = new RegExp("\\.".concat(drc), 'g');
    s = s.replace(dPatt, ".".concat(fp, "-")).replace(customPropPatt, "--".concat(fp, "-")).replace(rPatt, ".".concat(rc));
  }
  return s;
}
var _cssInserted = false;
function ensureCss() {
  if (config.autoAddCss && !_cssInserted) {
    insertCss(css());
    _cssInserted = true;
  }
}
var InjectCSS = {
  mixout: function mixout() {
    return {
      dom: {
        css: css,
        insertCss: ensureCss
      }
    };
  },
  hooks: function hooks() {
    return {
      beforeDOMElementCreation: function beforeDOMElementCreation() {
        ensureCss();
      },
      beforeI2svg: function beforeI2svg() {
        ensureCss();
      }
    };
  }
};

var w$2 = WINDOW || {};
if (!w$2[NAMESPACE_IDENTIFIER]) w$2[NAMESPACE_IDENTIFIER] = {};
if (!w$2[NAMESPACE_IDENTIFIER].styles) w$2[NAMESPACE_IDENTIFIER].styles = {};
if (!w$2[NAMESPACE_IDENTIFIER].hooks) w$2[NAMESPACE_IDENTIFIER].hooks = {};
if (!w$2[NAMESPACE_IDENTIFIER].shims) w$2[NAMESPACE_IDENTIFIER].shims = [];
var namespace = w$2[NAMESPACE_IDENTIFIER];

var functions = [];
var _listener = function listener() {
  DOCUMENT.removeEventListener('DOMContentLoaded', _listener);
  loaded = 1;
  functions.map(function (fn) {
    return fn();
  });
};
var loaded = false;
if (IS_DOM) {
  loaded = (DOCUMENT.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(DOCUMENT.readyState);
  if (!loaded) DOCUMENT.addEventListener('DOMContentLoaded', _listener);
}
function domready (fn) {
  if (!IS_DOM) return;
  loaded ? setTimeout(fn, 0) : functions.push(fn);
}

function toHtml(abstractNodes) {
  var tag = abstractNodes.tag,
    _abstractNodes$attrib = abstractNodes.attributes,
    attributes = _abstractNodes$attrib === void 0 ? {} : _abstractNodes$attrib,
    _abstractNodes$childr = abstractNodes.children,
    children = _abstractNodes$childr === void 0 ? [] : _abstractNodes$childr;
  if (typeof abstractNodes === 'string') {
    return htmlEscape(abstractNodes);
  } else {
    return "<".concat(tag, " ").concat(joinAttributes(attributes), ">").concat(children.map(toHtml).join(''), "</").concat(tag, ">");
  }
}

function iconFromMapping(mapping, prefix, iconName) {
  if (mapping && mapping[prefix] && mapping[prefix][iconName]) {
    return {
      prefix: prefix,
      iconName: iconName,
      icon: mapping[prefix][iconName]
    };
  }
}

/**
 * # Reduce
 *
 * A fast object `.reduce()` implementation.
 *
 * @param  {Object}   subject      The object to reduce over.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
var reduce = function fastReduceObject(subject, fn, initialValue, thisContext) {
  var keys = Object.keys(subject),
    length = keys.length,
    iterator = fn,
    i,
    key,
    result;
  if (initialValue === undefined) {
    i = 1;
    result = subject[keys[0]];
  } else {
    i = 0;
    result = initialValue;
  }
  for (; i < length; i++) {
    key = keys[i];
    result = iterator(result, subject[key], key, subject);
  }
  return result;
};

/**
 * Return hexadecimal string for a unicode character
 * Returns `null` when more than one character (not bytes!) are passed
 * For example: 'K' → '7B'
 */
function toHex(unicode) {
  if (_toConsumableArray$1(unicode).length !== 1) return null;
  return unicode.codePointAt(0).toString(16);
}

function normalizeIcons(icons) {
  return Object.keys(icons).reduce(function (acc, iconName) {
    var icon = icons[iconName];
    var expanded = !!icon.icon;
    if (expanded) {
      acc[icon.iconName] = icon.icon;
    } else {
      acc[iconName] = icon;
    }
    return acc;
  }, {});
}
function defineIcons(prefix, icons) {
  var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var _params$skipHooks = params.skipHooks,
    skipHooks = _params$skipHooks === void 0 ? false : _params$skipHooks;
  var normalized = normalizeIcons(icons);
  if (typeof namespace.hooks.addPack === 'function' && !skipHooks) {
    namespace.hooks.addPack(prefix, normalizeIcons(icons));
  } else {
    namespace.styles[prefix] = _objectSpread2$1(_objectSpread2$1({}, namespace.styles[prefix] || {}), normalized);
  }

  /**
   * Font Awesome 4 used the prefix of `fa` for all icons. With the introduction
   * of new styles we needed to differentiate between them. Prefix `fa` is now an alias
   * for `fas` so we'll ease the upgrade process for our users by automatically defining
   * this as well.
   */
  if (prefix === 'fas') {
    defineIcons('fa', icons);
  }
}

var styles = namespace.styles,
  shims = namespace.shims;
var FAMILY_NAMES = Object.keys(PREFIX_TO_LONG_STYLE);
var PREFIXES_FOR_FAMILY = FAMILY_NAMES.reduce(function (acc, familyId) {
  acc[familyId] = Object.keys(PREFIX_TO_LONG_STYLE[familyId]);
  return acc;
}, {});
var _defaultUsablePrefix = null;
var _byUnicode = {};
var _byLigature = {};
var _byOldName = {};
var _byOldUnicode = {};
var _byAlias = {};
function isReserved(name) {
  return ~RESERVED_CLASSES.indexOf(name);
}
function getIconName(cssPrefix, cls) {
  var parts = cls.split('-');
  var prefix = parts[0];
  var iconName = parts.slice(1).join('-');
  if (prefix === cssPrefix && iconName !== '' && !isReserved(iconName)) {
    return iconName;
  } else {
    return null;
  }
}
var build = function build() {
  var lookup = function lookup(reducer) {
    return reduce(styles, function (o$$1, style, prefix) {
      o$$1[prefix] = reduce(style, reducer, {});
      return o$$1;
    }, {});
  };
  _byUnicode = lookup(function (acc, icon, iconName) {
    if (icon[3]) {
      acc[icon[3]] = iconName;
    }
    if (icon[2]) {
      var aliases = icon[2].filter(function (a$$1) {
        return typeof a$$1 === 'number';
      });
      aliases.forEach(function (alias) {
        acc[alias.toString(16)] = iconName;
      });
    }
    return acc;
  });
  _byLigature = lookup(function (acc, icon, iconName) {
    acc[iconName] = iconName;
    if (icon[2]) {
      var aliases = icon[2].filter(function (a$$1) {
        return typeof a$$1 === 'string';
      });
      aliases.forEach(function (alias) {
        acc[alias] = iconName;
      });
    }
    return acc;
  });
  _byAlias = lookup(function (acc, icon, iconName) {
    var aliases = icon[2];
    acc[iconName] = iconName;
    aliases.forEach(function (alias) {
      acc[alias] = iconName;
    });
    return acc;
  });

  // If we have a Kit, we can't determine if regular is available since we
  // could be auto-fetching it. We'll have to assume that it is available.
  var hasRegular = 'far' in styles || config.autoFetchSvg;
  var shimLookups = reduce(shims, function (acc, shim) {
    var maybeNameMaybeUnicode = shim[0];
    var prefix = shim[1];
    var iconName = shim[2];
    if (prefix === 'far' && !hasRegular) {
      prefix = 'fas';
    }
    if (typeof maybeNameMaybeUnicode === 'string') {
      acc.names[maybeNameMaybeUnicode] = {
        prefix: prefix,
        iconName: iconName
      };
    }
    if (typeof maybeNameMaybeUnicode === 'number') {
      acc.unicodes[maybeNameMaybeUnicode.toString(16)] = {
        prefix: prefix,
        iconName: iconName
      };
    }
    return acc;
  }, {
    names: {},
    unicodes: {}
  });
  _byOldName = shimLookups.names;
  _byOldUnicode = shimLookups.unicodes;
  _defaultUsablePrefix = getCanonicalPrefix(config.styleDefault, {
    family: config.familyDefault
  });
};
onChange(function (c$$1) {
  _defaultUsablePrefix = getCanonicalPrefix(c$$1.styleDefault, {
    family: config.familyDefault
  });
});
build();
function byUnicode(prefix, unicode) {
  return (_byUnicode[prefix] || {})[unicode];
}
function byLigature(prefix, ligature) {
  return (_byLigature[prefix] || {})[ligature];
}
function byAlias(prefix, alias) {
  return (_byAlias[prefix] || {})[alias];
}
function byOldName(name) {
  return _byOldName[name] || {
    prefix: null,
    iconName: null
  };
}
function byOldUnicode(unicode) {
  var oldUnicode = _byOldUnicode[unicode];
  var newUnicode = byUnicode('fas', unicode);
  return oldUnicode || (newUnicode ? {
    prefix: 'fas',
    iconName: newUnicode
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function getDefaultUsablePrefix() {
  return _defaultUsablePrefix;
}
var emptyCanonicalIcon = function emptyCanonicalIcon() {
  return {
    prefix: null,
    iconName: null,
    rest: []
  };
};
function getFamilyId(values) {
  var family = u;
  var famProps = FAMILY_NAMES.reduce(function (acc, familyId) {
    acc[familyId] = "".concat(config.cssPrefix, "-").concat(familyId);
    return acc;
  }, {});
  xl.forEach(function (familyId) {
    if (values.includes(famProps[familyId]) || values.some(function (v$$1) {
      return PREFIXES_FOR_FAMILY[familyId].includes(v$$1);
    })) {
      family = familyId;
    }
  });
  return family;
}
function getCanonicalPrefix(styleOrPrefix) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$family = params.family,
    family = _params$family === void 0 ? u : _params$family;
  var style = PREFIX_TO_STYLE[family][styleOrPrefix];

  // handles the exception of passing in only a family of 'duotone' with no style
  if (family === l && !styleOrPrefix) {
    return 'fad';
  }
  var prefix = STYLE_TO_PREFIX[family][styleOrPrefix] || STYLE_TO_PREFIX[family][style];
  var defined = styleOrPrefix in namespace.styles ? styleOrPrefix : null;
  var result = prefix || defined || null;
  return result;
}
function moveNonFaClassesToRest(classNames) {
  var rest = [];
  var iconName = null;
  classNames.forEach(function (cls) {
    var result = getIconName(config.cssPrefix, cls);
    if (result) {
      iconName = result;
    } else if (cls) {
      rest.push(cls);
    }
  });
  return {
    iconName: iconName,
    rest: rest
  };
}
function sortedUniqueValues(arr) {
  return arr.sort().filter(function (value, index, arr) {
    return arr.indexOf(value) === index;
  });
}
var _faCombinedClasses = ha.concat(at);
function getCanonicalIcon(values) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$skipLookups = params.skipLookups,
    skipLookups = _params$skipLookups === void 0 ? false : _params$skipLookups;
  var givenPrefix = null;
  var faStyleOrFamilyClasses = sortedUniqueValues(values.filter(function (cls) {
    return _faCombinedClasses.includes(cls);
  }));
  var nonStyleOrFamilyClasses = sortedUniqueValues(values.filter(function (cls) {
    return !_faCombinedClasses.includes(cls);
  }));
  var faStyles = faStyleOrFamilyClasses.filter(function (cls) {
    givenPrefix = cls;
    return !dl.includes(cls);
  });
  var _faStyles = _slicedToArray$1(faStyles, 1),
    _faStyles$ = _faStyles[0],
    styleFromValues = _faStyles$ === void 0 ? null : _faStyles$;
  var family = getFamilyId(faStyleOrFamilyClasses);
  var canonical = _objectSpread2$1(_objectSpread2$1({}, moveNonFaClassesToRest(nonStyleOrFamilyClasses)), {}, {
    prefix: getCanonicalPrefix(styleFromValues, {
      family: family
    })
  });
  return _objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, canonical), getDefaultCanonicalPrefix({
    values: values,
    family: family,
    styles: styles,
    config: config,
    canonical: canonical,
    givenPrefix: givenPrefix
  })), applyShimAndAlias(skipLookups, givenPrefix, canonical));
}
function applyShimAndAlias(skipLookups, givenPrefix, canonical) {
  var prefix = canonical.prefix,
    iconName = canonical.iconName;
  if (skipLookups || !prefix || !iconName) {
    return {
      prefix: prefix,
      iconName: iconName
    };
  }
  var shim = givenPrefix === 'fa' ? byOldName(iconName) : {};
  var aliasIconName = byAlias(prefix, iconName);
  iconName = shim.iconName || aliasIconName || iconName;
  prefix = shim.prefix || prefix;
  if (prefix === 'far' && !styles['far'] && styles['fas'] && !config.autoFetchSvg) {
    // Allow a fallback from the regular style to solid if regular is not available
    // but only if we aren't auto-fetching SVGs
    prefix = 'fas';
  }
  return {
    prefix: prefix,
    iconName: iconName
  };
}
var newCanonicalFamilies = xl.filter(function (familyId) {
  return familyId !== u || familyId !== l;
});
var newCanonicalStyles = Object.keys(da).filter(function (key) {
  return key !== u;
}).map(function (key) {
  return Object.keys(da[key]);
}).flat();
function getDefaultCanonicalPrefix(prefixOptions) {
  var values = prefixOptions.values,
    family = prefixOptions.family,
    canonical = prefixOptions.canonical,
    _prefixOptions$givenP = prefixOptions.givenPrefix,
    givenPrefix = _prefixOptions$givenP === void 0 ? '' : _prefixOptions$givenP,
    _prefixOptions$styles = prefixOptions.styles,
    styles = _prefixOptions$styles === void 0 ? {} : _prefixOptions$styles,
    _prefixOptions$config = prefixOptions.config,
    config$$1 = _prefixOptions$config === void 0 ? {} : _prefixOptions$config;
  var isDuotoneFamily = family === l;
  var valuesHasDuotone = values.includes('fa-duotone') || values.includes('fad');
  var defaultFamilyIsDuotone = config$$1.familyDefault === 'duotone';
  var canonicalPrefixIsDuotone = canonical.prefix === 'fad' || canonical.prefix === 'fa-duotone';
  if (!isDuotoneFamily && (valuesHasDuotone || defaultFamilyIsDuotone || canonicalPrefixIsDuotone)) {
    canonical.prefix = 'fad';
  }
  if (values.includes('fa-brands') || values.includes('fab')) {
    canonical.prefix = 'fab';
  }
  if (!canonical.prefix && newCanonicalFamilies.includes(family)) {
    var validPrefix = Object.keys(styles).find(function (key) {
      return newCanonicalStyles.includes(key);
    });
    if (validPrefix || config$$1.autoFetchSvg) {
      var defaultPrefix = Ql.get(family).defaultShortPrefixId;
      canonical.prefix = defaultPrefix;
      canonical.iconName = byAlias(canonical.prefix, canonical.iconName) || canonical.iconName;
    }
  }
  if (canonical.prefix === 'fa' || givenPrefix === 'fa') {
    // The fa prefix is not canonical. So if it has made it through until this point
    // we will shift it to the correct prefix.
    canonical.prefix = getDefaultUsablePrefix() || 'fas';
  }
  return canonical;
}

var Library = /*#__PURE__*/function () {
  function Library() {
    _classCallCheck(this, Library);
    this.definitions = {};
  }
  return _createClass(Library, [{
    key: "add",
    value: function add() {
      var _this = this;
      for (var _len = arguments.length, definitions = new Array(_len), _key = 0; _key < _len; _key++) {
        definitions[_key] = arguments[_key];
      }
      var additions = definitions.reduce(this._pullDefinitions, {});
      Object.keys(additions).forEach(function (key) {
        _this.definitions[key] = _objectSpread2$1(_objectSpread2$1({}, _this.definitions[key] || {}), additions[key]);
        defineIcons(key, additions[key]);

        // To keep support for older Classic styles, also add longer prefixes
        var longPrefix = PREFIX_TO_LONG_STYLE[u][key];
        if (longPrefix) defineIcons(longPrefix, additions[key]);
        build();
      });
    }
  }, {
    key: "reset",
    value: function reset() {
      this.definitions = {};
    }
  }, {
    key: "_pullDefinitions",
    value: function _pullDefinitions(additions, definition) {
      var normalized = definition.prefix && definition.iconName && definition.icon ? {
        0: definition
      } : definition;
      Object.keys(normalized).map(function (key) {
        var _normalized$key = normalized[key],
          prefix = _normalized$key.prefix,
          iconName = _normalized$key.iconName,
          icon = _normalized$key.icon;
        var aliases = icon[2];
        if (!additions[prefix]) additions[prefix] = {};
        if (aliases.length > 0) {
          aliases.forEach(function (alias) {
            if (typeof alias === 'string') {
              additions[prefix][alias] = icon;
            }
          });
        }
        additions[prefix][iconName] = icon;
      });
      return additions;
    }
  }]);
}();

var _plugins = [];
var _hooks = {};
var providers = {};
var defaultProviderKeys = Object.keys(providers);
function registerPlugins(nextPlugins, _ref) {
  var obj = _ref.mixoutsTo;
  _plugins = nextPlugins;
  _hooks = {};
  Object.keys(providers).forEach(function (k) {
    if (defaultProviderKeys.indexOf(k) === -1) {
      delete providers[k];
    }
  });
  _plugins.forEach(function (plugin) {
    var mixout = plugin.mixout ? plugin.mixout() : {};
    Object.keys(mixout).forEach(function (tk) {
      if (typeof mixout[tk] === 'function') {
        obj[tk] = mixout[tk];
      }
      if (_typeof$1(mixout[tk]) === 'object') {
        Object.keys(mixout[tk]).forEach(function (sk) {
          if (!obj[tk]) {
            obj[tk] = {};
          }
          obj[tk][sk] = mixout[tk][sk];
        });
      }
    });
    if (plugin.hooks) {
      var hooks = plugin.hooks();
      Object.keys(hooks).forEach(function (hook) {
        if (!_hooks[hook]) {
          _hooks[hook] = [];
        }
        _hooks[hook].push(hooks[hook]);
      });
    }
    if (plugin.provides) {
      plugin.provides(providers);
    }
  });
  return obj;
}
function chainHooks(hook, accumulator) {
  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }
  var hookFns = _hooks[hook] || [];
  hookFns.forEach(function (hookFn) {
    accumulator = hookFn.apply(null, [accumulator].concat(args));
  });
  return accumulator;
}
function callHooks(hook) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  var hookFns = _hooks[hook] || [];
  hookFns.forEach(function (hookFn) {
    hookFn.apply(null, args);
  });
  return undefined;
}
function callProvided() {
  var hook = arguments[0];
  var args = Array.prototype.slice.call(arguments, 1);
  return providers[hook] ? providers[hook].apply(null, args) : undefined;
}

function findIconDefinition(iconLookup) {
  if (iconLookup.prefix === 'fa') {
    iconLookup.prefix = 'fas';
  }
  var iconName = iconLookup.iconName;
  var prefix = iconLookup.prefix || getDefaultUsablePrefix();
  if (!iconName) return;
  iconName = byAlias(prefix, iconName) || iconName;
  return iconFromMapping(library.definitions, prefix, iconName) || iconFromMapping(namespace.styles, prefix, iconName);
}
var library = new Library();
var noAuto = function noAuto() {
  config.autoReplaceSvg = false;
  config.observeMutations = false;
  callHooks('noAuto');
};
var dom = {
  i2svg: function i2svg() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (IS_DOM) {
      callHooks('beforeI2svg', params);
      callProvided('pseudoElements2svg', params);
      return callProvided('i2svg', params);
    } else {
      return Promise.reject(new Error('Operation requires a DOM of some kind.'));
    }
  },
  watch: function watch() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var autoReplaceSvgRoot = params.autoReplaceSvgRoot;
    if (config.autoReplaceSvg === false) {
      config.autoReplaceSvg = true;
    }
    config.observeMutations = true;
    domready(function () {
      autoReplace({
        autoReplaceSvgRoot: autoReplaceSvgRoot
      });
      callHooks('watch', params);
    });
  }
};
var parse = {
  icon: function icon(_icon) {
    if (_icon === null) {
      return null;
    }
    if (_typeof$1(_icon) === 'object' && _icon.prefix && _icon.iconName) {
      return {
        prefix: _icon.prefix,
        iconName: byAlias(_icon.prefix, _icon.iconName) || _icon.iconName
      };
    }
    if (Array.isArray(_icon) && _icon.length === 2) {
      var iconName = _icon[1].indexOf('fa-') === 0 ? _icon[1].slice(3) : _icon[1];
      var prefix = getCanonicalPrefix(_icon[0]);
      return {
        prefix: prefix,
        iconName: byAlias(prefix, iconName) || iconName
      };
    }
    if (typeof _icon === 'string' && (_icon.indexOf("".concat(config.cssPrefix, "-")) > -1 || _icon.match(ICON_SELECTION_SYNTAX_PATTERN))) {
      var canonicalIcon = getCanonicalIcon(_icon.split(' '), {
        skipLookups: true
      });
      return {
        prefix: canonicalIcon.prefix || getDefaultUsablePrefix(),
        iconName: byAlias(canonicalIcon.prefix, canonicalIcon.iconName) || canonicalIcon.iconName
      };
    }
    if (typeof _icon === 'string') {
      var _prefix = getDefaultUsablePrefix();
      return {
        prefix: _prefix,
        iconName: byAlias(_prefix, _icon) || _icon
      };
    }
  }
};
var api = {
  noAuto: noAuto,
  config: config,
  dom: dom,
  parse: parse,
  library: library,
  findIconDefinition: findIconDefinition,
  toHtml: toHtml
};
var autoReplace = function autoReplace() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _params$autoReplaceSv = params.autoReplaceSvgRoot,
    autoReplaceSvgRoot = _params$autoReplaceSv === void 0 ? DOCUMENT : _params$autoReplaceSv;
  if ((Object.keys(namespace.styles).length > 0 || config.autoFetchSvg) && IS_DOM && config.autoReplaceSvg) api.dom.i2svg({
    node: autoReplaceSvgRoot
  });
};

function domVariants(val, abstractCreator) {
  Object.defineProperty(val, 'abstract', {
    get: abstractCreator
  });
  Object.defineProperty(val, 'html', {
    get: function get() {
      return val.abstract.map(function (a) {
        return toHtml(a);
      });
    }
  });
  Object.defineProperty(val, 'node', {
    get: function get() {
      if (!IS_DOM) return undefined;
      var container = DOCUMENT.createElement('div');
      container.innerHTML = val.html;
      return container.children;
    }
  });
  return val;
}

function asIcon (_ref) {
  var children = _ref.children,
    main = _ref.main,
    mask = _ref.mask,
    attributes = _ref.attributes,
    styles = _ref.styles,
    transform = _ref.transform;
  if (transformIsMeaningful(transform) && main.found && !mask.found) {
    var width = main.width,
      height = main.height;
    var offset = {
      x: width / height / 2,
      y: 0.5
    };
    attributes['style'] = joinStyles(_objectSpread2$1(_objectSpread2$1({}, styles), {}, {
      'transform-origin': "".concat(offset.x + transform.x / 16, "em ").concat(offset.y + transform.y / 16, "em")
    }));
  }
  return [{
    tag: 'svg',
    attributes: attributes,
    children: children
  }];
}

function asSymbol (_ref) {
  var prefix = _ref.prefix,
    iconName = _ref.iconName,
    children = _ref.children,
    attributes = _ref.attributes,
    symbol = _ref.symbol;
  var id = symbol === true ? "".concat(prefix, "-").concat(config.cssPrefix, "-").concat(iconName) : symbol;
  return [{
    tag: 'svg',
    attributes: {
      style: 'display: none;'
    },
    children: [{
      tag: 'symbol',
      attributes: _objectSpread2$1(_objectSpread2$1({}, attributes), {}, {
        id: id
      }),
      children: children
    }]
  }];
}

// If any of these attributes are present, don't assume the icon is decorative
function isLabeled(attributes) {
  var labels = ['aria-label', 'aria-labelledby', 'title', 'role'];
  return labels.some(function (label) {
    return label in attributes;
  });
}
function makeInlineSvgAbstract(params) {
  var _params$icons = params.icons,
    main = _params$icons.main,
    mask = _params$icons.mask,
    prefix = params.prefix,
    iconName = params.iconName,
    transform = params.transform,
    symbol = params.symbol,
    maskId = params.maskId,
    extra = params.extra,
    _params$watchable = params.watchable,
    watchable = _params$watchable === void 0 ? false : _params$watchable;
  var _ref = mask.found ? mask : main,
    width = _ref.width,
    height = _ref.height;
  var attrClass = [config.replacementClass, iconName ? "".concat(config.cssPrefix, "-").concat(iconName) : ''].filter(function (c) {
    return extra.classes.indexOf(c) === -1;
  }).filter(function (c) {
    return c !== '' || !!c;
  }).concat(extra.classes).join(' ');
  var content = {
    children: [],
    attributes: _objectSpread2$1(_objectSpread2$1({}, extra.attributes), {}, {
      'data-prefix': prefix,
      'data-icon': iconName,
      'class': attrClass,
      'role': extra.attributes.role || 'img',
      'viewBox': "0 0 ".concat(width, " ").concat(height)
    })
  };
  if (!isLabeled(extra.attributes) && !extra.attributes['aria-hidden']) {
    content.attributes['aria-hidden'] = 'true';
  }
  if (watchable) {
    content.attributes[DATA_FA_I2SVG] = '';
  }
  var args = _objectSpread2$1(_objectSpread2$1({}, content), {}, {
    prefix: prefix,
    iconName: iconName,
    main: main,
    mask: mask,
    maskId: maskId,
    transform: transform,
    symbol: symbol,
    styles: _objectSpread2$1({}, extra.styles)
  });
  var _ref2 = mask.found && main.found ? callProvided('generateAbstractMask', args) || {
      children: [],
      attributes: {}
    } : callProvided('generateAbstractIcon', args) || {
      children: [],
      attributes: {}
    },
    children = _ref2.children,
    attributes = _ref2.attributes;
  args.children = children;
  args.attributes = attributes;
  if (symbol) {
    return asSymbol(args);
  } else {
    return asIcon(args);
  }
}
function makeLayersTextAbstract(params) {
  var content = params.content,
    width = params.width,
    height = params.height,
    transform = params.transform,
    extra = params.extra,
    _params$watchable2 = params.watchable,
    watchable = _params$watchable2 === void 0 ? false : _params$watchable2;
  var attributes = _objectSpread2$1(_objectSpread2$1({}, extra.attributes), {}, {
    class: extra.classes.join(' ')
  });
  if (watchable) {
    attributes[DATA_FA_I2SVG] = '';
  }
  var styles = _objectSpread2$1({}, extra.styles);
  if (transformIsMeaningful(transform)) {
    styles['transform'] = transformForCss({
      transform: transform,
      width: width,
      height: height
    });
    styles['-webkit-transform'] = styles['transform'];
  }
  var styleString = joinStyles(styles);
  if (styleString.length > 0) {
    attributes['style'] = styleString;
  }
  var val = [];
  val.push({
    tag: 'span',
    attributes: attributes,
    children: [content]
  });
  return val;
}
function makeLayersCounterAbstract(params) {
  var content = params.content,
    extra = params.extra;
  var attributes = _objectSpread2$1(_objectSpread2$1({}, extra.attributes), {}, {
    class: extra.classes.join(' ')
  });
  var styleString = joinStyles(extra.styles);
  if (styleString.length > 0) {
    attributes['style'] = styleString;
  }
  var val = [];
  val.push({
    tag: 'span',
    attributes: attributes,
    children: [content]
  });
  return val;
}

var styles$1 = namespace.styles;
function asFoundIcon(icon) {
  var width = icon[0];
  var height = icon[1];
  var _icon$slice = icon.slice(4),
    _icon$slice2 = _slicedToArray$1(_icon$slice, 1),
    vectorData = _icon$slice2[0];
  var element = null;
  if (Array.isArray(vectorData)) {
    element = {
      tag: 'g',
      attributes: {
        class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.GROUP)
      },
      children: [{
        tag: 'path',
        attributes: {
          class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.SECONDARY),
          fill: 'currentColor',
          d: vectorData[0]
        }
      }, {
        tag: 'path',
        attributes: {
          class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.PRIMARY),
          fill: 'currentColor',
          d: vectorData[1]
        }
      }]
    };
  } else {
    element = {
      tag: 'path',
      attributes: {
        fill: 'currentColor',
        d: vectorData
      }
    };
  }
  return {
    found: true,
    width: width,
    height: height,
    icon: element
  };
}
var missingIconResolutionMixin = {
  found: false,
  width: 512,
  height: 512
};
function maybeNotifyMissing(iconName, prefix) {
  if (!PRODUCTION$1 && !config.showMissingIcons && iconName) {
    console.error("Icon with name \"".concat(iconName, "\" and prefix \"").concat(prefix, "\" is missing."));
  }
}
function findIcon(iconName, prefix) {
  var givenPrefix = prefix;
  if (prefix === 'fa' && config.styleDefault !== null) {
    prefix = getDefaultUsablePrefix();
  }
  return new Promise(function (resolve, reject) {
    if (givenPrefix === 'fa') {
      var shim = byOldName(iconName) || {};
      iconName = shim.iconName || iconName;
      prefix = shim.prefix || prefix;
    }
    if (iconName && prefix && styles$1[prefix] && styles$1[prefix][iconName]) {
      var icon = styles$1[prefix][iconName];
      return resolve(asFoundIcon(icon));
    }
    maybeNotifyMissing(iconName, prefix);
    resolve(_objectSpread2$1(_objectSpread2$1({}, missingIconResolutionMixin), {}, {
      icon: config.showMissingIcons && iconName ? callProvided('missingIconAbstract') || {} : {}
    }));
  });
}

var noop$1 = function noop() {};
var p$2 = config.measurePerformance && PERFORMANCE && PERFORMANCE.mark && PERFORMANCE.measure ? PERFORMANCE : {
  mark: noop$1,
  measure: noop$1
};
var preamble = "FA \"7.3.0\"";
var begin = function begin(name) {
  p$2.mark("".concat(preamble, " ").concat(name, " begins"));
  return function () {
    return end(name);
  };
};
var end = function end(name) {
  p$2.mark("".concat(preamble, " ").concat(name, " ends"));
  p$2.measure("".concat(preamble, " ").concat(name), "".concat(preamble, " ").concat(name, " begins"), "".concat(preamble, " ").concat(name, " ends"));
};
var perf = {
  begin: begin,
  end: end
};

var noop$2 = function noop() {};
function isWatched(node) {
  var i2svg = node.getAttribute ? node.getAttribute(DATA_FA_I2SVG) : null;
  return typeof i2svg === 'string';
}
function hasPrefixAndIcon(node) {
  var prefix = node.getAttribute ? node.getAttribute(DATA_PREFIX) : null;
  var icon = node.getAttribute ? node.getAttribute(DATA_ICON) : null;
  return prefix && icon;
}
function hasBeenReplaced(node) {
  return node && node.classList && node.classList.contains && node.classList.contains(config.replacementClass);
}
function getMutator() {
  if (config.autoReplaceSvg === true) {
    return mutators.replace;
  }
  var mutator = mutators[config.autoReplaceSvg];
  return mutator || mutators.replace;
}
function createElementNS(tag) {
  return DOCUMENT.createElementNS('http://www.w3.org/2000/svg', tag);
}
function createElement(tag) {
  return DOCUMENT.createElement(tag);
}
function convertSVG(abstractObj) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$ceFn = params.ceFn,
    ceFn = _params$ceFn === void 0 ? abstractObj.tag === 'svg' ? createElementNS : createElement : _params$ceFn;
  if (typeof abstractObj === 'string') {
    return DOCUMENT.createTextNode(abstractObj);
  }
  var tag = ceFn(abstractObj.tag);
  Object.keys(abstractObj.attributes || []).forEach(function (key) {
    tag.setAttribute(key, abstractObj.attributes[key]);
  });
  var children = abstractObj.children || [];
  children.forEach(function (child) {
    tag.appendChild(convertSVG(child, {
      ceFn: ceFn
    }));
  });
  return tag;
}
function nodeAsComment(node) {
  var comment = " ".concat(node.outerHTML, " ");
  /* BEGIN.ATTRIBUTION */
  comment = "".concat(comment, "Font Awesome fontawesome.com ");
  /* END.ATTRIBUTION */
  return comment;
}
var mutators = {
  replace: function replace(mutation) {
    var node = mutation[0];
    if (node.parentNode) {
      mutation[1].forEach(function (abstract) {
        node.parentNode.insertBefore(convertSVG(abstract), node);
      });
      if (node.getAttribute(DATA_FA_I2SVG) === null && config.keepOriginalSource) {
        var comment = DOCUMENT.createComment(nodeAsComment(node));
        node.parentNode.replaceChild(comment, node);
      } else {
        node.remove();
      }
    }
  },
  nest: function nest(mutation) {
    var node = mutation[0];
    var abstract = mutation[1];

    // If we already have a replaced node we do not want to continue nesting within it.
    // Short-circuit to the standard replacement
    if (~classArray(node).indexOf(config.replacementClass)) {
      return mutators.replace(mutation);
    }
    var forSvg = new RegExp("".concat(config.cssPrefix, "-.*"));
    delete abstract[0].attributes.id;
    if (abstract[0].attributes.class) {
      var splitClasses = abstract[0].attributes.class.split(' ').reduce(function (acc, cls) {
        if (cls === config.replacementClass || cls.match(forSvg)) {
          acc.toSvg.push(cls);
        } else {
          acc.toNode.push(cls);
        }
        return acc;
      }, {
        toNode: [],
        toSvg: []
      });
      abstract[0].attributes.class = splitClasses.toSvg.join(' ');
      if (splitClasses.toNode.length === 0) {
        node.removeAttribute('class');
      } else {
        node.setAttribute('class', splitClasses.toNode.join(' '));
      }
    }
    var newInnerHTML = abstract.map(function (a) {
      return toHtml(a);
    }).join('\n');
    node.setAttribute(DATA_FA_I2SVG, '');
    node.innerHTML = newInnerHTML;
  }
};
function performOperationSync(op) {
  op();
}
function perform(mutations, callback) {
  var callbackFunction = typeof callback === 'function' ? callback : noop$2;
  if (mutations.length === 0) {
    callbackFunction();
  } else {
    var frame = performOperationSync;
    if (config.mutateApproach === MUTATION_APPROACH_ASYNC) {
      frame = WINDOW.requestAnimationFrame || performOperationSync;
    }
    frame(function () {
      var mutator = getMutator();
      var mark = perf.begin('mutate');
      mutations.map(mutator);
      mark();
      callbackFunction();
    });
  }
}
var disabled = false;
function disableObservation() {
  disabled = true;
}
function enableObservation() {
  disabled = false;
}
var mo = null;
function observe(options) {
  if (!MUTATION_OBSERVER) {
    return;
  }
  if (!config.observeMutations) {
    return;
  }
  var _options$treeCallback = options.treeCallback,
    treeCallback = _options$treeCallback === void 0 ? noop$2 : _options$treeCallback,
    _options$nodeCallback = options.nodeCallback,
    nodeCallback = _options$nodeCallback === void 0 ? noop$2 : _options$nodeCallback,
    _options$pseudoElemen = options.pseudoElementsCallback,
    pseudoElementsCallback = _options$pseudoElemen === void 0 ? noop$2 : _options$pseudoElemen,
    _options$observeMutat = options.observeMutationsRoot,
    observeMutationsRoot = _options$observeMutat === void 0 ? DOCUMENT : _options$observeMutat;
  mo = new MUTATION_OBSERVER(function (objects) {
    if (disabled) return;
    var defaultPrefix = getDefaultUsablePrefix();
    toArray(objects).forEach(function (mutationRecord) {
      if (mutationRecord.type === 'childList' && mutationRecord.addedNodes.length > 0 && !isWatched(mutationRecord.addedNodes[0])) {
        if (config.searchPseudoElements) {
          pseudoElementsCallback(mutationRecord.target);
        }
        treeCallback(mutationRecord.target);
      }
      if (mutationRecord.type === 'attributes' && mutationRecord.target.parentNode && config.searchPseudoElements) {
        pseudoElementsCallback([mutationRecord.target], true);
      }
      if (mutationRecord.type === 'attributes' && isWatched(mutationRecord.target) && ~ATTRIBUTES_WATCHED_FOR_MUTATION.indexOf(mutationRecord.attributeName)) {
        if (mutationRecord.attributeName === 'class' && hasPrefixAndIcon(mutationRecord.target)) {
          var _getCanonicalIcon = getCanonicalIcon(classArray(mutationRecord.target)),
            prefix = _getCanonicalIcon.prefix,
            iconName = _getCanonicalIcon.iconName;
          mutationRecord.target.setAttribute(DATA_PREFIX, prefix || defaultPrefix);
          if (iconName) mutationRecord.target.setAttribute(DATA_ICON, iconName);
        } else if (hasBeenReplaced(mutationRecord.target)) {
          nodeCallback(mutationRecord.target);
        }
      }
    });
  });
  if (!IS_DOM) return;
  mo.observe(observeMutationsRoot, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
  });
}
function disconnect() {
  if (!mo) return;
  mo.disconnect();
}

function styleParser (node) {
  var style = node.getAttribute('style');
  var val = [];
  if (style) {
    val = style.split(';').reduce(function (acc, style) {
      var styles = style.split(':');
      var prop = styles[0];
      var value = styles.slice(1);
      if (prop && value.length > 0) {
        acc[prop] = value.join(':').trim();
      }
      return acc;
    }, {});
  }
  return val;
}

function classParser (node) {
  var existingPrefix = node.getAttribute('data-prefix');
  var existingIconName = node.getAttribute('data-icon');
  var innerText = node.innerText !== undefined ? node.innerText.trim() : '';
  var val = getCanonicalIcon(classArray(node));
  if (!val.prefix) {
    val.prefix = getDefaultUsablePrefix();
  }
  if (existingPrefix && existingIconName) {
    val.prefix = existingPrefix;
    val.iconName = existingIconName;
  }
  if (val.iconName && val.prefix) {
    return val;
  }
  if (val.prefix && innerText.length > 0) {
    val.iconName = byLigature(val.prefix, node.innerText) || byUnicode(val.prefix, toHex(node.innerText));
  }
  if (!val.iconName && config.autoFetchSvg && node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
    val.iconName = node.firstChild.data;
  }
  return val;
}

function attributesParser (node) {
  var extraAttributes = toArray(node.attributes).reduce(function (acc, attr) {
    if (acc.name !== 'class' && acc.name !== 'style') {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {});
  return extraAttributes;
}

function blankMeta() {
  return {
    iconName: null,
    prefix: null,
    transform: meaninglessTransform,
    symbol: false,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function parseMeta(node) {
  var parser = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    styleParser: true
  };
  var _classParser = classParser(node),
    iconName = _classParser.iconName,
    prefix = _classParser.prefix,
    extraClasses = _classParser.rest;
  var extraAttributes = attributesParser(node);
  var pluginMeta = chainHooks('parseNodeAttributes', {}, node);
  var extraStyles = parser.styleParser ? styleParser(node) : [];
  return _objectSpread2$1({
    iconName: iconName,
    prefix: prefix,
    transform: meaninglessTransform,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: false,
    extra: {
      classes: extraClasses,
      styles: extraStyles,
      attributes: extraAttributes
    }
  }, pluginMeta);
}

var styles$2 = namespace.styles;
function generateMutation(node) {
  var nodeMeta = config.autoReplaceSvg === 'nest' ? parseMeta(node, {
    styleParser: false
  }) : parseMeta(node);
  if (~nodeMeta.extra.classes.indexOf(LAYERS_TEXT_CLASSNAME)) {
    return callProvided('generateLayersText', node, nodeMeta);
  } else {
    return callProvided('generateSvgReplacementMutation', node, nodeMeta);
  }
}
function getKnownPrefixes() {
  return [].concat(_toConsumableArray$1(at), _toConsumableArray$1(ha));
}
function onTree(root) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (!IS_DOM) return Promise.resolve();
  var htmlClassList = DOCUMENT.documentElement.classList;
  var hclAdd = function hclAdd(suffix) {
    return htmlClassList.add("".concat(HTML_CLASS_I2SVG_BASE_CLASS, "-").concat(suffix));
  };
  var hclRemove = function hclRemove(suffix) {
    return htmlClassList.remove("".concat(HTML_CLASS_I2SVG_BASE_CLASS, "-").concat(suffix));
  };
  var prefixes = config.autoFetchSvg ? getKnownPrefixes() : dl.concat(Object.keys(styles$2));
  if (!prefixes.includes('fa')) {
    prefixes.push('fa');
  }
  var prefixesDomQuery = [".".concat(LAYERS_TEXT_CLASSNAME, ":not([").concat(DATA_FA_I2SVG, "])")].concat(prefixes.map(function (p$$1) {
    return ".".concat(p$$1, ":not([").concat(DATA_FA_I2SVG, "])");
  })).join(', ');
  if (prefixesDomQuery.length === 0) {
    return Promise.resolve();
  }
  var candidates = [];
  try {
    candidates = toArray(root.querySelectorAll(prefixesDomQuery));
  } catch (e$$1) {
    // noop
  }
  if (candidates.length > 0) {
    hclAdd('pending');
    hclRemove('complete');
  } else {
    return Promise.resolve();
  }
  var mark = perf.begin('onTree');
  var mutations = candidates.reduce(function (acc, node) {
    try {
      var mutation = generateMutation(node);
      if (mutation) {
        acc.push(mutation);
      }
    } catch (e$$1) {
      if (!PRODUCTION$1) {
        if (e$$1.name === 'MissingIcon') {
          console.error(e$$1);
        }
      }
    }
    return acc;
  }, []);
  return new Promise(function (resolve, reject) {
    Promise.all(mutations).then(function (resolvedMutations) {
      perform(resolvedMutations, function () {
        hclAdd('active');
        hclAdd('complete');
        hclRemove('pending');
        if (typeof callback === 'function') callback();
        mark();
        resolve();
      });
    }).catch(function (e$$1) {
      mark();
      reject(e$$1);
    });
  });
}
function onNode(node) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  generateMutation(node).then(function (mutation) {
    if (mutation) {
      perform([mutation], callback);
    }
  });
}
function resolveIcons(next) {
  return function (maybeIconDefinition) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var iconDefinition = (maybeIconDefinition || {}).icon ? maybeIconDefinition : findIconDefinition(maybeIconDefinition || {});
    var mask = params.mask;
    if (mask) {
      mask = (mask || {}).icon ? mask : findIconDefinition(mask || {});
    }
    return next(iconDefinition, _objectSpread2$1(_objectSpread2$1({}, params), {}, {
      mask: mask
    }));
  };
}
var render = function render(iconDefinition) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$transform = params.transform,
    transform = _params$transform === void 0 ? meaninglessTransform : _params$transform,
    _params$symbol = params.symbol,
    symbol = _params$symbol === void 0 ? false : _params$symbol,
    _params$mask = params.mask,
    mask = _params$mask === void 0 ? null : _params$mask,
    _params$maskId = params.maskId,
    maskId = _params$maskId === void 0 ? null : _params$maskId,
    _params$classes = params.classes,
    classes = _params$classes === void 0 ? [] : _params$classes,
    _params$attributes = params.attributes,
    attributes = _params$attributes === void 0 ? {} : _params$attributes,
    _params$styles = params.styles,
    styles = _params$styles === void 0 ? {} : _params$styles;
  if (!iconDefinition) return;
  var prefix = iconDefinition.prefix,
    iconName = iconDefinition.iconName,
    icon = iconDefinition.icon;
  return domVariants(_objectSpread2$1({
    type: 'icon'
  }, iconDefinition), function () {
    callHooks('beforeDOMElementCreation', {
      iconDefinition: iconDefinition,
      params: params
    });
    return makeInlineSvgAbstract({
      icons: {
        main: asFoundIcon(icon),
        mask: mask ? asFoundIcon(mask.icon) : {
          found: false,
          width: null,
          height: null,
          icon: {}
        }
      },
      prefix: prefix,
      iconName: iconName,
      transform: _objectSpread2$1(_objectSpread2$1({}, meaninglessTransform), transform),
      symbol: symbol,
      maskId: maskId,
      extra: {
        attributes: attributes,
        styles: styles,
        classes: classes
      }
    });
  });
};
var ReplaceElements = {
  mixout: function mixout() {
    return {
      icon: resolveIcons(render)
    };
  },
  hooks: function hooks() {
    return {
      mutationObserverCallbacks: function mutationObserverCallbacks(accumulator) {
        accumulator.treeCallback = onTree;
        accumulator.nodeCallback = onNode;
        return accumulator;
      }
    };
  },
  provides: function provides(providers$$1) {
    providers$$1.i2svg = function (params) {
      var _params$node = params.node,
        node = _params$node === void 0 ? DOCUMENT : _params$node,
        _params$callback = params.callback,
        callback = _params$callback === void 0 ? function () {} : _params$callback;
      return onTree(node, callback);
    };
    providers$$1.generateSvgReplacementMutation = function (node, nodeMeta) {
      var iconName = nodeMeta.iconName,
        prefix = nodeMeta.prefix,
        transform = nodeMeta.transform,
        symbol = nodeMeta.symbol,
        mask = nodeMeta.mask,
        maskId = nodeMeta.maskId,
        extra = nodeMeta.extra;
      return new Promise(function (resolve, reject) {
        Promise.all([findIcon(iconName, prefix), mask.iconName ? findIcon(mask.iconName, mask.prefix) : Promise.resolve({
          found: false,
          width: 512,
          height: 512,
          icon: {}
        })]).then(function (_ref) {
          var _ref2 = _slicedToArray$1(_ref, 2),
            main = _ref2[0],
            mask = _ref2[1];
          resolve([node, makeInlineSvgAbstract({
            icons: {
              main: main,
              mask: mask
            },
            prefix: prefix,
            iconName: iconName,
            transform: transform,
            symbol: symbol,
            maskId: maskId,
            extra: extra,
            watchable: true
          })]);
        }).catch(reject);
      });
    };
    providers$$1.generateAbstractIcon = function (_ref3) {
      var children = _ref3.children,
        attributes = _ref3.attributes,
        main = _ref3.main,
        transform = _ref3.transform,
        styles = _ref3.styles;
      var styleString = joinStyles(styles);
      if (styleString.length > 0) {
        attributes['style'] = styleString;
      }
      var nextChild;
      if (transformIsMeaningful(transform)) {
        nextChild = callProvided('generateAbstractTransformGrouping', {
          main: main,
          transform: transform,
          containerWidth: main.width,
          iconWidth: main.width
        });
      }
      children.push(nextChild || main.icon);
      return {
        children: children,
        attributes: attributes
      };
    };
  }
};

var Layers = {
  mixout: function mixout() {
    return {
      layer: function layer(assembler) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var _params$classes = params.classes,
          classes = _params$classes === void 0 ? [] : _params$classes;
        return domVariants({
          type: 'layer'
        }, function () {
          callHooks('beforeDOMElementCreation', {
            assembler: assembler,
            params: params
          });
          var children = [];
          assembler(function (args) {
            Array.isArray(args) ? args.map(function (a) {
              children = children.concat(a.abstract);
            }) : children = children.concat(args.abstract);
          });
          return [{
            tag: 'span',
            attributes: {
              class: ["".concat(config.cssPrefix, "-layers")].concat(_toConsumableArray$1(classes)).join(' ')
            },
            children: children
          }];
        });
      }
    };
  }
};

var LayersCounter = {
  mixout: function mixout() {
    return {
      counter: function counter(content) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        params.title;
          var _params$classes = params.classes,
          classes = _params$classes === void 0 ? [] : _params$classes,
          _params$attributes = params.attributes,
          attributes = _params$attributes === void 0 ? {} : _params$attributes,
          _params$styles = params.styles,
          styles = _params$styles === void 0 ? {} : _params$styles;
        return domVariants({
          type: 'counter',
          content: content
        }, function () {
          callHooks('beforeDOMElementCreation', {
            content: content,
            params: params
          });
          return makeLayersCounterAbstract({
            content: content.toString(),
            extra: {
              attributes: attributes,
              styles: styles,
              classes: ["".concat(config.cssPrefix, "-layers-counter")].concat(_toConsumableArray$1(classes))
            }
          });
        });
      }
    };
  }
};

var LayersText = {
  mixout: function mixout() {
    return {
      text: function text(content) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var _params$transform = params.transform,
          transform = _params$transform === void 0 ? meaninglessTransform : _params$transform,
          _params$classes = params.classes,
          classes = _params$classes === void 0 ? [] : _params$classes,
          _params$attributes = params.attributes,
          attributes = _params$attributes === void 0 ? {} : _params$attributes,
          _params$styles = params.styles,
          styles = _params$styles === void 0 ? {} : _params$styles;
        return domVariants({
          type: 'text',
          content: content
        }, function () {
          callHooks('beforeDOMElementCreation', {
            content: content,
            params: params
          });
          return makeLayersTextAbstract({
            content: content,
            transform: _objectSpread2$1(_objectSpread2$1({}, meaninglessTransform), transform),
            extra: {
              attributes: attributes,
              styles: styles,
              classes: ["".concat(config.cssPrefix, "-layers-text")].concat(_toConsumableArray$1(classes))
            }
          });
        });
      }
    };
  },
  provides: function provides(providers$$1) {
    providers$$1.generateLayersText = function (node, nodeMeta) {
      var transform = nodeMeta.transform,
        extra = nodeMeta.extra;
      var width = null;
      var height = null;
      if (IS_IE) {
        var computedFontSize = parseInt(getComputedStyle(node).fontSize, 10);
        var boundingClientRect = node.getBoundingClientRect();
        width = boundingClientRect.width / computedFontSize;
        height = boundingClientRect.height / computedFontSize;
      }
      return Promise.resolve([node, makeLayersTextAbstract({
        content: node.innerHTML,
        width: width,
        height: height,
        transform: transform,
        extra: extra,
        watchable: true
      })]);
    };
  }
};

var CLEAN_CONTENT_PATTERN = new RegExp("\"", 'ug');
var SECONDARY_UNICODE_RANGE = [1105920, 1112319];
var _FONT_FAMILY_WEIGHT_TO_PREFIX = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  FontAwesome: {
    normal: 'fas',
    400: 'fas'
  }
}), zl), wa), ct);
var FONT_FAMILY_WEIGHT_TO_PREFIX = Object.keys(_FONT_FAMILY_WEIGHT_TO_PREFIX).reduce(function (acc, key) {
  acc[key.toLowerCase()] = _FONT_FAMILY_WEIGHT_TO_PREFIX[key];
  return acc;
}, {});
var FONT_FAMILY_WEIGHT_FALLBACK = Object.keys(FONT_FAMILY_WEIGHT_TO_PREFIX).reduce(function (acc, fontFamily) {
  var weights = FONT_FAMILY_WEIGHT_TO_PREFIX[fontFamily];
  acc[fontFamily] = weights[900] || _toConsumableArray$1(Object.entries(weights))[0][1];
  return acc;
}, {});

// Return hex value of *first* character in `content`
function hexValueFromContent(content) {
  var cleaned = content.replace(CLEAN_CONTENT_PATTERN, '');
  return toHex(_toConsumableArray$1(cleaned)[0] || '');
}

// Check if it's a secondary Duotone layer, by checking if:
// - Unicode value in `content` is repeated
// - Unicode value in `content` is above 0x10000
// - The "ss01" font feature is enabled on the `content`
function isSecondaryLayer(styles) {
  var hasStylisticSet = styles.getPropertyValue('font-feature-settings').includes('ss01');
  var content = styles.getPropertyValue('content');
  var cleaned = content.replace(CLEAN_CONTENT_PATTERN, '');
  var codePoint = cleaned.codePointAt(0);
  var isPrependTen = codePoint >= SECONDARY_UNICODE_RANGE[0] && codePoint <= SECONDARY_UNICODE_RANGE[1];
  var isDoubled = cleaned.length === 2 ? cleaned[0] === cleaned[1] : false;
  return isPrependTen || isDoubled || hasStylisticSet;
}
function getPrefix(fontFamily, fontWeight) {
  var fontFamilySanitized = fontFamily.replace(/^['"]|['"]$/g, '').toLowerCase();
  var fontWeightInteger = parseInt(fontWeight);
  var fontWeightSanitized = isNaN(fontWeightInteger) ? 'normal' : fontWeightInteger;
  return (FONT_FAMILY_WEIGHT_TO_PREFIX[fontFamilySanitized] || {})[fontWeightSanitized] || FONT_FAMILY_WEIGHT_FALLBACK[fontFamilySanitized];
}
function replaceForPosition(node, position) {
  var pendingAttribute = "".concat(DATA_FA_PSEUDO_ELEMENT_PENDING).concat(position.replace(':', '-'));
  return new Promise(function (resolve, reject) {
    if (node.getAttribute(pendingAttribute) !== null) {
      // This node is already being processed
      return resolve();
    }
    var children = toArray(node.children);
    var alreadyProcessedPseudoElement = children.filter(function (c$$1) {
      return c$$1.getAttribute(DATA_FA_PSEUDO_ELEMENT) === position;
    })[0];
    var styles = WINDOW.getComputedStyle(node, position);
    var fontFamily = styles.getPropertyValue('font-family');
    var fontFamilyMatch = fontFamily.match(FONT_FAMILY_PATTERN);
    var fontWeight = styles.getPropertyValue('font-weight');
    var content = styles.getPropertyValue('content');
    if (alreadyProcessedPseudoElement && !fontFamilyMatch) {
      // If we've already processed it but the current computed style does not result in a font-family,
      // that probably means that a class name that was previously present to make the icon has been
      // removed. So we now should delete the icon.
      node.removeChild(alreadyProcessedPseudoElement);
      return resolve();
    } else if (fontFamilyMatch && content !== 'none' && content !== '') {
      var _content = styles.getPropertyValue('content');
      var prefix = getPrefix(fontFamily, fontWeight);
      var hexValue = hexValueFromContent(_content);
      var isV4 = fontFamilyMatch[0].startsWith('FontAwesome');
      var isSecondary = isSecondaryLayer(styles);
      var iconName = byUnicode(prefix, hexValue);
      var iconIdentifier = iconName;
      if (isV4) {
        var iconName4 = byOldUnicode(hexValue);
        if (iconName4.iconName && iconName4.prefix) {
          iconName = iconName4.iconName;
          prefix = iconName4.prefix;
        }
      }

      // Only convert the pseudo element in this ::before/::after position into an icon if we haven't
      // already done so with the same prefix and iconName
      if (iconName && !isSecondary && (!alreadyProcessedPseudoElement || alreadyProcessedPseudoElement.getAttribute(DATA_PREFIX) !== prefix || alreadyProcessedPseudoElement.getAttribute(DATA_ICON) !== iconIdentifier)) {
        node.setAttribute(pendingAttribute, iconIdentifier);
        if (alreadyProcessedPseudoElement) {
          // Delete the old one, since we're replacing it with a new one
          node.removeChild(alreadyProcessedPseudoElement);
        }
        var meta = blankMeta();
        var extra = meta.extra;
        extra.attributes[DATA_FA_PSEUDO_ELEMENT] = position;
        findIcon(iconName, prefix).then(function (main) {
          var abstract = makeInlineSvgAbstract(_objectSpread2$1(_objectSpread2$1({}, meta), {}, {
            icons: {
              main: main,
              mask: emptyCanonicalIcon()
            },
            prefix: prefix,
            iconName: iconIdentifier,
            extra: extra,
            watchable: true
          }));
          var element = DOCUMENT.createElementNS('http://www.w3.org/2000/svg', 'svg');
          if (position === '::before') {
            node.insertBefore(element, node.firstChild);
          } else {
            node.appendChild(element);
          }
          element.outerHTML = abstract.map(function (a$$1) {
            return toHtml(a$$1);
          }).join('\n');
          node.removeAttribute(pendingAttribute);
          resolve();
        }).catch(reject);
      } else {
        resolve();
      }
    } else {
      resolve();
    }
  });
}
function replace(node) {
  return Promise.all([replaceForPosition(node, '::before'), replaceForPosition(node, '::after')]);
}
function processable(node) {
  return node.parentNode !== document.head && !~TAGNAMES_TO_SKIP_FOR_PSEUDOELEMENTS.indexOf(node.tagName.toUpperCase()) && !node.getAttribute(DATA_FA_PSEUDO_ELEMENT) && (!node.parentNode || node.parentNode.tagName !== 'svg');
}
var hasPseudoElement = function hasPseudoElement(selector) {
  return !!selector && PSEUDO_ELEMENTS.some(function (pseudoSelector) {
    return selector.includes(pseudoSelector);
  });
};

// Return selectors from all available stylesheets that have
// pseudo-elements defined.
var parseCSSRuleForPseudos = function parseCSSRuleForPseudos(selectorText) {
  if (!selectorText) return [];
  var selectorSet = new Set();
  var selectors = selectorText.split(/,(?![^()]*\))/).map(function (s$$1) {
    return s$$1.trim();
  });
  selectors = selectors.flatMap(function (selector) {
    return selector.includes('(') ? selector : selector.split(',').map(function (s$$1) {
      return s$$1.trim();
    });
  });
  var _iterator = _createForOfIteratorHelper(selectors),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var selector = _step.value;
      if (hasPseudoElement(selector)) {
        // Remove pseudo-elements from the selector
        var selectorWithoutPseudo = PSEUDO_ELEMENTS.reduce(function (acc, pseudoSelector) {
          return acc.replace(pseudoSelector, '');
        }, selector);
        if (selectorWithoutPseudo !== '' && selectorWithoutPseudo !== '*') {
          selectorSet.add(selectorWithoutPseudo);
        }
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return selectorSet;
};
function searchPseudoElements(root) {
  var useAsNodeList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (!IS_DOM) return;
  var nodeList;
  if (useAsNodeList) {
    nodeList = root;
  } else if (config.searchPseudoElementsFullScan) {
    nodeList = root.querySelectorAll('*');
  } else {
    // Get elements that have pseudo elements defined in the CSS
    var selectorSet = new Set();
    var _iterator2 = _createForOfIteratorHelper(document.styleSheets),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var stylesheet = _step2.value;
        try {
          var _iterator3 = _createForOfIteratorHelper(stylesheet.cssRules),
            _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var rule = _step3.value;
              var parsedSelectors = parseCSSRuleForPseudos(rule.selectorText);
              var _iterator4 = _createForOfIteratorHelper(parsedSelectors),
                _step4;
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  var selector = _step4.value;
                  selectorSet.add(selector);
                }
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        } catch (e$$1) {
          if (config.searchPseudoElementsWarnings) {
            console.warn("Font Awesome: cannot parse stylesheet: ".concat(stylesheet.href, " (").concat(e$$1.message, ")\nIf it declares any Font Awesome CSS pseudo-elements, they will not be rendered as SVG icons. Add crossorigin=\"anonymous\" to the <link>, enable searchPseudoElementsFullScan for slower but more thorough DOM parsing, or suppress this warning by setting searchPseudoElementsWarnings to false."));
          }
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    if (!selectorSet.size) return;
    var cleanSelectors = Array.from(selectorSet).join(', ');
    try {
      nodeList = root.querySelectorAll(cleanSelectors);
    } catch (_unused) {} // eslint-disable-line no-empty
  }
  return new Promise(function (resolve, reject) {
    var operations = toArray(nodeList).filter(processable).map(replace);
    var end = perf.begin('searchPseudoElements');
    disableObservation();
    Promise.all(operations).then(function () {
      end();
      enableObservation();
      resolve();
    }).catch(function () {
      end();
      enableObservation();
      reject();
    });
  });
}
var PseudoElements = {
  hooks: function hooks() {
    return {
      mutationObserverCallbacks: function mutationObserverCallbacks(accumulator) {
        accumulator.pseudoElementsCallback = searchPseudoElements;
        return accumulator;
      }
    };
  },
  provides: function provides(providers) {
    providers.pseudoElements2svg = function (params) {
      var _params$node = params.node,
        node = _params$node === void 0 ? DOCUMENT : _params$node;
      if (config.searchPseudoElements) {
        searchPseudoElements(node);
      }
    };
  }
};

var _unwatched = false;
var MutationObserver$1 = {
  mixout: function mixout() {
    return {
      dom: {
        unwatch: function unwatch() {
          disableObservation();
          _unwatched = true;
        }
      }
    };
  },
  hooks: function hooks() {
    return {
      bootstrap: function bootstrap() {
        observe(chainHooks('mutationObserverCallbacks', {}));
      },
      noAuto: function noAuto() {
        disconnect();
      },
      watch: function watch(params) {
        var observeMutationsRoot = params.observeMutationsRoot;
        if (_unwatched) {
          enableObservation();
        } else {
          observe(chainHooks('mutationObserverCallbacks', {
            observeMutationsRoot: observeMutationsRoot
          }));
        }
      }
    };
  }
};

var parseTransformString = function parseTransformString(transformString) {
  var transform = {
    size: 16,
    x: 0,
    y: 0,
    flipX: false,
    flipY: false,
    rotate: 0
  };
  return transformString.toLowerCase().split(' ').reduce(function (acc, n) {
    var parts = n.toLowerCase().split('-');
    var first = parts[0];
    var rest = parts.slice(1).join('-');
    if (first && rest === 'h') {
      acc.flipX = true;
      return acc;
    }
    if (first && rest === 'v') {
      acc.flipY = true;
      return acc;
    }
    rest = parseFloat(rest);
    if (isNaN(rest)) {
      return acc;
    }
    switch (first) {
      case 'grow':
        acc.size = acc.size + rest;
        break;
      case 'shrink':
        acc.size = acc.size - rest;
        break;
      case 'left':
        acc.x = acc.x - rest;
        break;
      case 'right':
        acc.x = acc.x + rest;
        break;
      case 'up':
        acc.y = acc.y - rest;
        break;
      case 'down':
        acc.y = acc.y + rest;
        break;
      case 'rotate':
        acc.rotate = acc.rotate + rest;
        break;
    }
    return acc;
  }, transform);
};
var PowerTransforms = {
  mixout: function mixout() {
    return {
      parse: {
        transform: function transform(transformString) {
          return parseTransformString(transformString);
        }
      }
    };
  },
  hooks: function hooks() {
    return {
      parseNodeAttributes: function parseNodeAttributes(accumulator, node) {
        var transformString = node.getAttribute('data-fa-transform');
        if (transformString) {
          accumulator.transform = parseTransformString(transformString);
        }
        return accumulator;
      }
    };
  },
  provides: function provides(providers) {
    providers.generateAbstractTransformGrouping = function (_ref) {
      var main = _ref.main,
        transform = _ref.transform,
        containerWidth = _ref.containerWidth,
        iconWidth = _ref.iconWidth;
      var outer = {
        transform: "translate(".concat(containerWidth / 2, " 256)")
      };
      var innerTranslate = "translate(".concat(transform.x * 32, ", ").concat(transform.y * 32, ") ");
      var innerScale = "scale(".concat(transform.size / 16 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / 16 * (transform.flipY ? -1 : 1), ") ");
      var innerRotate = "rotate(".concat(transform.rotate, " 0 0)");
      var inner = {
        transform: "".concat(innerTranslate, " ").concat(innerScale, " ").concat(innerRotate)
      };
      var path = {
        transform: "translate(".concat(iconWidth / 2 * -1, " -256)")
      };
      var operations = {
        outer: outer,
        inner: inner,
        path: path
      };
      return {
        tag: 'g',
        attributes: _objectSpread2$1({}, operations.outer),
        children: [{
          tag: 'g',
          attributes: _objectSpread2$1({}, operations.inner),
          children: [{
            tag: main.icon.tag,
            children: main.icon.children,
            attributes: _objectSpread2$1(_objectSpread2$1({}, main.icon.attributes), operations.path)
          }]
        }]
      };
    };
  }
};

var ALL_SPACE = {
  x: 0,
  y: 0,
  width: '100%',
  height: '100%'
};
function fillBlack(abstract) {
  var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  if (abstract.attributes && (abstract.attributes.fill || force)) {
    abstract.attributes.fill = 'black';
  }
  return abstract;
}
function deGroup(abstract) {
  if (abstract.tag === 'g') {
    return abstract.children;
  } else {
    return [abstract];
  }
}
var Masks = {
  hooks: function hooks() {
    return {
      parseNodeAttributes: function parseNodeAttributes(accumulator, node) {
        var maskData = node.getAttribute('data-fa-mask');
        var mask = !maskData ? emptyCanonicalIcon() : getCanonicalIcon(maskData.split(' ').map(function (i) {
          return i.trim();
        }));
        if (!mask.prefix) {
          mask.prefix = getDefaultUsablePrefix();
        }
        accumulator.mask = mask;
        accumulator.maskId = node.getAttribute('data-fa-mask-id');
        return accumulator;
      }
    };
  },
  provides: function provides(providers) {
    providers.generateAbstractMask = function (_ref) {
      var children = _ref.children,
        attributes = _ref.attributes,
        main = _ref.main,
        mask = _ref.mask,
        explicitMaskId = _ref.maskId,
        transform = _ref.transform;
      var mainWidth = main.width,
        mainPath = main.icon;
      var maskWidth = mask.width,
        maskPath = mask.icon;
      var trans = transformForSvg({
        transform: transform,
        containerWidth: maskWidth,
        iconWidth: mainWidth
      });
      var maskRect = {
        tag: 'rect',
        attributes: _objectSpread2$1(_objectSpread2$1({}, ALL_SPACE), {}, {
          fill: 'white'
        })
      };
      var maskInnerGroupChildrenMixin = mainPath.children ? {
        children: mainPath.children.map(fillBlack)
      } : {};
      var maskInnerGroup = {
        tag: 'g',
        attributes: _objectSpread2$1({}, trans.inner),
        children: [fillBlack(_objectSpread2$1({
          tag: mainPath.tag,
          attributes: _objectSpread2$1(_objectSpread2$1({}, mainPath.attributes), trans.path)
        }, maskInnerGroupChildrenMixin))]
      };
      var maskOuterGroup = {
        tag: 'g',
        attributes: _objectSpread2$1({}, trans.outer),
        children: [maskInnerGroup]
      };
      var maskId = "mask-".concat(explicitMaskId || nextUniqueId());
      var clipId = "clip-".concat(explicitMaskId || nextUniqueId());
      var maskTag = {
        tag: 'mask',
        attributes: _objectSpread2$1(_objectSpread2$1({}, ALL_SPACE), {}, {
          id: maskId,
          maskUnits: 'userSpaceOnUse',
          maskContentUnits: 'userSpaceOnUse'
        }),
        children: [maskRect, maskOuterGroup]
      };
      var defs = {
        tag: 'defs',
        children: [{
          tag: 'clipPath',
          attributes: {
            id: clipId
          },
          children: deGroup(maskPath)
        }, maskTag]
      };
      children.push(defs, {
        tag: 'rect',
        attributes: _objectSpread2$1({
          'fill': 'currentColor',
          'clip-path': "url(#".concat(clipId, ")"),
          'mask': "url(#".concat(maskId, ")")
        }, ALL_SPACE)
      });
      return {
        children: children,
        attributes: attributes
      };
    };
  }
};

var MissingIconIndicator = {
  provides: function provides(providers) {
    var reduceMotion = false;
    if (WINDOW.matchMedia) {
      reduceMotion = WINDOW.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    providers.missingIconAbstract = function () {
      var gChildren = [];
      var FILL = {
        fill: 'currentColor'
      };
      var ANIMATION_BASE = {
        attributeType: 'XML',
        repeatCount: 'indefinite',
        dur: '2s'
      };

      // Ring
      gChildren.push({
        tag: 'path',
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          d: 'M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z'
        })
      });
      var OPACITY_ANIMATE = _objectSpread2$1(_objectSpread2$1({}, ANIMATION_BASE), {}, {
        attributeName: 'opacity'
      });
      var dot = {
        tag: 'circle',
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          cx: '256',
          cy: '364',
          r: '28'
        }),
        children: []
      };
      if (!reduceMotion) {
        dot.children.push({
          tag: 'animate',
          attributes: _objectSpread2$1(_objectSpread2$1({}, ANIMATION_BASE), {}, {
            attributeName: 'r',
            values: '28;14;28;28;14;28;'
          })
        }, {
          tag: 'animate',
          attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
            values: '1;0;1;1;0;1;'
          })
        });
      }
      gChildren.push(dot);
      gChildren.push({
        tag: 'path',
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          opacity: '1',
          d: 'M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z'
        }),
        children: reduceMotion ? [] : [{
          tag: 'animate',
          attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
            values: '1;0;0;0;0;1;'
          })
        }]
      });
      if (!reduceMotion) {
        // Exclamation
        gChildren.push({
          tag: 'path',
          attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
            opacity: '0',
            d: 'M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z'
          }),
          children: [{
            tag: 'animate',
            attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
              values: '0;0;1;1;0;0;'
            })
          }]
        });
      }
      return {
        tag: 'g',
        attributes: {
          class: 'missing'
        },
        children: gChildren
      };
    };
  }
};

var SvgSymbols = {
  hooks: function hooks() {
    return {
      parseNodeAttributes: function parseNodeAttributes(accumulator, node) {
        var symbolData = node.getAttribute('data-fa-symbol');
        var symbol = symbolData === null ? false : symbolData === '' ? true : symbolData;
        accumulator['symbol'] = symbol;
        return accumulator;
      }
    };
  }
};

var plugins = [InjectCSS, ReplaceElements, Layers, LayersCounter, LayersText, PseudoElements, MutationObserver$1, PowerTransforms, Masks, MissingIconIndicator, SvgSymbols];

registerPlugins(plugins, {
  mixoutsTo: api
});
api.noAuto;
api.config;
api.library;
api.dom;
var parse$1 = api.parse;
api.findIconDefinition;
api.toHtml;
var icon = api.icon;
api.layer;
api.text;
api.counter;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var propTypes = {exports: {}};

var reactIs = {exports: {}};

var reactIs_production_min = {};

/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_production_min;

function requireReactIs_production_min () {
	if (hasRequiredReactIs_production_min) return reactIs_production_min;
	hasRequiredReactIs_production_min = 1;

	var b = "function" === typeof Symbol && Symbol.for,
	  c = b ? Symbol.for("react.element") : 60103,
	  d = b ? Symbol.for("react.portal") : 60106,
	  e = b ? Symbol.for("react.fragment") : 60107,
	  f = b ? Symbol.for("react.strict_mode") : 60108,
	  g = b ? Symbol.for("react.profiler") : 60114,
	  h = b ? Symbol.for("react.provider") : 60109,
	  k = b ? Symbol.for("react.context") : 60110,
	  l = b ? Symbol.for("react.async_mode") : 60111,
	  m = b ? Symbol.for("react.concurrent_mode") : 60111,
	  n = b ? Symbol.for("react.forward_ref") : 60112,
	  p = b ? Symbol.for("react.suspense") : 60113,
	  q = b ? Symbol.for("react.suspense_list") : 60120,
	  r = b ? Symbol.for("react.memo") : 60115,
	  t = b ? Symbol.for("react.lazy") : 60116,
	  v = b ? Symbol.for("react.block") : 60121,
	  w = b ? Symbol.for("react.fundamental") : 60117,
	  x = b ? Symbol.for("react.responder") : 60118,
	  y = b ? Symbol.for("react.scope") : 60119;
	function z(a) {
	  if ("object" === typeof a && null !== a) {
	    var u = a.$$typeof;
	    switch (u) {
	      case c:
	        switch (a = a.type, a) {
	          case l:
	          case m:
	          case e:
	          case g:
	          case f:
	          case p:
	            return a;
	          default:
	            switch (a = a && a.$$typeof, a) {
	              case k:
	              case n:
	              case t:
	              case r:
	              case h:
	                return a;
	              default:
	                return u;
	            }
	        }
	      case d:
	        return u;
	    }
	  }
	}
	function A(a) {
	  return z(a) === m;
	}
	reactIs_production_min.AsyncMode = l;
	reactIs_production_min.ConcurrentMode = m;
	reactIs_production_min.ContextConsumer = k;
	reactIs_production_min.ContextProvider = h;
	reactIs_production_min.Element = c;
	reactIs_production_min.ForwardRef = n;
	reactIs_production_min.Fragment = e;
	reactIs_production_min.Lazy = t;
	reactIs_production_min.Memo = r;
	reactIs_production_min.Portal = d;
	reactIs_production_min.Profiler = g;
	reactIs_production_min.StrictMode = f;
	reactIs_production_min.Suspense = p;
	reactIs_production_min.isAsyncMode = function (a) {
	  return A(a) || z(a) === l;
	};
	reactIs_production_min.isConcurrentMode = A;
	reactIs_production_min.isContextConsumer = function (a) {
	  return z(a) === k;
	};
	reactIs_production_min.isContextProvider = function (a) {
	  return z(a) === h;
	};
	reactIs_production_min.isElement = function (a) {
	  return "object" === typeof a && null !== a && a.$$typeof === c;
	};
	reactIs_production_min.isForwardRef = function (a) {
	  return z(a) === n;
	};
	reactIs_production_min.isFragment = function (a) {
	  return z(a) === e;
	};
	reactIs_production_min.isLazy = function (a) {
	  return z(a) === t;
	};
	reactIs_production_min.isMemo = function (a) {
	  return z(a) === r;
	};
	reactIs_production_min.isPortal = function (a) {
	  return z(a) === d;
	};
	reactIs_production_min.isProfiler = function (a) {
	  return z(a) === g;
	};
	reactIs_production_min.isStrictMode = function (a) {
	  return z(a) === f;
	};
	reactIs_production_min.isSuspense = function (a) {
	  return z(a) === p;
	};
	reactIs_production_min.isValidElementType = function (a) {
	  return "string" === typeof a || "function" === typeof a || a === e || a === m || a === g || a === f || a === p || a === q || "object" === typeof a && null !== a && (a.$$typeof === t || a.$$typeof === r || a.$$typeof === h || a.$$typeof === k || a.$$typeof === n || a.$$typeof === w || a.$$typeof === x || a.$$typeof === y || a.$$typeof === v);
	};
	reactIs_production_min.typeOf = z;
	return reactIs_production_min;
}

var reactIs_development = {};

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development;

function requireReactIs_development () {
	if (hasRequiredReactIs_development) return reactIs_development;
	hasRequiredReactIs_development = 1;

	if (process.env.NODE_ENV !== "production") {
	  (function () {

	    // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
	    // nor polyfill, then a plain number is used for performance.
	    var hasSymbol = typeof Symbol === 'function' && Symbol.for;
	    var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
	    var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
	    var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
	    var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
	    var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
	    var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
	    var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
	    // (unstable) APIs that have been removed. Can we remove the symbols?

	    var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
	    var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
	    var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
	    var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
	    var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
	    var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
	    var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
	    var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
	    var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
	    var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
	    var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;
	    function isValidElementType(type) {
	      return typeof type === 'string' || typeof type === 'function' ||
	      // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
	      type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
	    }
	    function typeOf(object) {
	      if (typeof object === 'object' && object !== null) {
	        var $$typeof = object.$$typeof;
	        switch ($$typeof) {
	          case REACT_ELEMENT_TYPE:
	            var type = object.type;
	            switch (type) {
	              case REACT_ASYNC_MODE_TYPE:
	              case REACT_CONCURRENT_MODE_TYPE:
	              case REACT_FRAGMENT_TYPE:
	              case REACT_PROFILER_TYPE:
	              case REACT_STRICT_MODE_TYPE:
	              case REACT_SUSPENSE_TYPE:
	                return type;
	              default:
	                var $$typeofType = type && type.$$typeof;
	                switch ($$typeofType) {
	                  case REACT_CONTEXT_TYPE:
	                  case REACT_FORWARD_REF_TYPE:
	                  case REACT_LAZY_TYPE:
	                  case REACT_MEMO_TYPE:
	                  case REACT_PROVIDER_TYPE:
	                    return $$typeofType;
	                  default:
	                    return $$typeof;
	                }
	            }
	          case REACT_PORTAL_TYPE:
	            return $$typeof;
	        }
	      }
	      return undefined;
	    } // AsyncMode is deprecated along with isAsyncMode

	    var AsyncMode = REACT_ASYNC_MODE_TYPE;
	    var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
	    var ContextConsumer = REACT_CONTEXT_TYPE;
	    var ContextProvider = REACT_PROVIDER_TYPE;
	    var Element = REACT_ELEMENT_TYPE;
	    var ForwardRef = REACT_FORWARD_REF_TYPE;
	    var Fragment = REACT_FRAGMENT_TYPE;
	    var Lazy = REACT_LAZY_TYPE;
	    var Memo = REACT_MEMO_TYPE;
	    var Portal = REACT_PORTAL_TYPE;
	    var Profiler = REACT_PROFILER_TYPE;
	    var StrictMode = REACT_STRICT_MODE_TYPE;
	    var Suspense = REACT_SUSPENSE_TYPE;
	    var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

	    function isAsyncMode(object) {
	      {
	        if (!hasWarnedAboutDeprecatedIsAsyncMode) {
	          hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

	          console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
	        }
	      }
	      return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
	    }
	    function isConcurrentMode(object) {
	      return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
	    }
	    function isContextConsumer(object) {
	      return typeOf(object) === REACT_CONTEXT_TYPE;
	    }
	    function isContextProvider(object) {
	      return typeOf(object) === REACT_PROVIDER_TYPE;
	    }
	    function isElement(object) {
	      return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	    }
	    function isForwardRef(object) {
	      return typeOf(object) === REACT_FORWARD_REF_TYPE;
	    }
	    function isFragment(object) {
	      return typeOf(object) === REACT_FRAGMENT_TYPE;
	    }
	    function isLazy(object) {
	      return typeOf(object) === REACT_LAZY_TYPE;
	    }
	    function isMemo(object) {
	      return typeOf(object) === REACT_MEMO_TYPE;
	    }
	    function isPortal(object) {
	      return typeOf(object) === REACT_PORTAL_TYPE;
	    }
	    function isProfiler(object) {
	      return typeOf(object) === REACT_PROFILER_TYPE;
	    }
	    function isStrictMode(object) {
	      return typeOf(object) === REACT_STRICT_MODE_TYPE;
	    }
	    function isSuspense(object) {
	      return typeOf(object) === REACT_SUSPENSE_TYPE;
	    }
	    reactIs_development.AsyncMode = AsyncMode;
	    reactIs_development.ConcurrentMode = ConcurrentMode;
	    reactIs_development.ContextConsumer = ContextConsumer;
	    reactIs_development.ContextProvider = ContextProvider;
	    reactIs_development.Element = Element;
	    reactIs_development.ForwardRef = ForwardRef;
	    reactIs_development.Fragment = Fragment;
	    reactIs_development.Lazy = Lazy;
	    reactIs_development.Memo = Memo;
	    reactIs_development.Portal = Portal;
	    reactIs_development.Profiler = Profiler;
	    reactIs_development.StrictMode = StrictMode;
	    reactIs_development.Suspense = Suspense;
	    reactIs_development.isAsyncMode = isAsyncMode;
	    reactIs_development.isConcurrentMode = isConcurrentMode;
	    reactIs_development.isContextConsumer = isContextConsumer;
	    reactIs_development.isContextProvider = isContextProvider;
	    reactIs_development.isElement = isElement;
	    reactIs_development.isForwardRef = isForwardRef;
	    reactIs_development.isFragment = isFragment;
	    reactIs_development.isLazy = isLazy;
	    reactIs_development.isMemo = isMemo;
	    reactIs_development.isPortal = isPortal;
	    reactIs_development.isProfiler = isProfiler;
	    reactIs_development.isStrictMode = isStrictMode;
	    reactIs_development.isSuspense = isSuspense;
	    reactIs_development.isValidElementType = isValidElementType;
	    reactIs_development.typeOf = typeOf;
	  })();
	}
	return reactIs_development;
}

var hasRequiredReactIs;

function requireReactIs () {
	if (hasRequiredReactIs) return reactIs.exports;
	hasRequiredReactIs = 1;

	if (process.env.NODE_ENV === 'production') {
	  reactIs.exports = requireReactIs_production_min();
	} else {
	  reactIs.exports = requireReactIs_development();
	}
	return reactIs.exports;
}

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

var objectAssign;
var hasRequiredObjectAssign;

function requireObjectAssign () {
	if (hasRequiredObjectAssign) return objectAssign;
	hasRequiredObjectAssign = 1;

	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	function toObject(val) {
	  if (val === null || val === undefined) {
	    throw new TypeError('Object.assign cannot be called with null or undefined');
	  }
	  return Object(val);
	}
	function shouldUseNative() {
	  try {
	    if (!Object.assign) {
	      return false;
	    }

	    // Detect buggy property enumeration order in older V8 versions.

	    // https://bugs.chromium.org/p/v8/issues/detail?id=4118
	    var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
	    test1[5] = 'de';
	    if (Object.getOwnPropertyNames(test1)[0] === '5') {
	      return false;
	    }

	    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
	    var test2 = {};
	    for (var i = 0; i < 10; i++) {
	      test2['_' + String.fromCharCode(i)] = i;
	    }
	    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
	      return test2[n];
	    });
	    if (order2.join('') !== '0123456789') {
	      return false;
	    }

	    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
	    var test3 = {};
	    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
	      test3[letter] = letter;
	    });
	    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
	      return false;
	    }
	    return true;
	  } catch (err) {
	    // We don't expect any of the above to throw, but better to be safe.
	    return false;
	  }
	}
	objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	  var from;
	  var to = toObject(target);
	  var symbols;
	  for (var s = 1; s < arguments.length; s++) {
	    from = Object(arguments[s]);
	    for (var key in from) {
	      if (hasOwnProperty.call(from, key)) {
	        to[key] = from[key];
	      }
	    }
	    if (getOwnPropertySymbols) {
	      symbols = getOwnPropertySymbols(from);
	      for (var i = 0; i < symbols.length; i++) {
	        if (propIsEnumerable.call(from, symbols[i])) {
	          to[symbols[i]] = from[symbols[i]];
	        }
	      }
	    }
	  }
	  return to;
	};
	return objectAssign;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var ReactPropTypesSecret_1;
var hasRequiredReactPropTypesSecret;

function requireReactPropTypesSecret () {
	if (hasRequiredReactPropTypesSecret) return ReactPropTypesSecret_1;
	hasRequiredReactPropTypesSecret = 1;

	var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';
	ReactPropTypesSecret_1 = ReactPropTypesSecret;
	return ReactPropTypesSecret_1;
}

var has;
var hasRequiredHas;

function requireHas () {
	if (hasRequiredHas) return has;
	hasRequiredHas = 1;
	has = Function.call.bind(Object.prototype.hasOwnProperty);
	return has;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var checkPropTypes_1;
var hasRequiredCheckPropTypes;

function requireCheckPropTypes () {
	if (hasRequiredCheckPropTypes) return checkPropTypes_1;
	hasRequiredCheckPropTypes = 1;

	var printWarning = function printWarning() {};
	if (process.env.NODE_ENV !== 'production') {
	  var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();
	  var loggedTypeFailures = {};
	  var has = /*@__PURE__*/ requireHas();
	  printWarning = function printWarning(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) {/**/}
	  };
	}

	/**
	 * Assert that the values match with the type specs.
	 * Error messages are memorized and will only be shown once.
	 *
	 * @param {object} typeSpecs Map of name to a ReactPropType
	 * @param {object} values Runtime values that need to be type-checked
	 * @param {string} location e.g. "prop", "context", "child context"
	 * @param {string} componentName Name of the component for error messages.
	 * @param {?Function} getStack Returns the component stack.
	 * @private
	 */
	function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
	  if (process.env.NODE_ENV !== 'production') {
	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error;
	        // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.
	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
	            err.name = 'Invariant Violation';
	            throw err;
	          }
	          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
	        } catch (ex) {
	          error = ex;
	        }
	        if (error && !(error instanceof Error)) {
	          printWarning((componentName || 'React class') + ': type specification of ' + location + ' `' + typeSpecName + '` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a ' + typeof error + '. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).');
	        }
	        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error.message] = true;
	          var stack = getStack ? getStack() : '';
	          printWarning('Failed ' + location + ' type: ' + error.message + (stack != null ? stack : ''));
	        }
	      }
	    }
	  }
	}

	/**
	 * Resets warning cache when testing.
	 *
	 * @private
	 */
	checkPropTypes.resetWarningCache = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    loggedTypeFailures = {};
	  }
	};
	checkPropTypes_1 = checkPropTypes;
	return checkPropTypes_1;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var factoryWithTypeCheckers;
var hasRequiredFactoryWithTypeCheckers;

function requireFactoryWithTypeCheckers () {
	if (hasRequiredFactoryWithTypeCheckers) return factoryWithTypeCheckers;
	hasRequiredFactoryWithTypeCheckers = 1;

	var ReactIs = requireReactIs();
	var assign = requireObjectAssign();
	var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();
	var has = /*@__PURE__*/ requireHas();
	var checkPropTypes = /*@__PURE__*/ requireCheckPropTypes();
	var printWarning = function printWarning() {};
	if (process.env.NODE_ENV !== 'production') {
	  printWarning = function printWarning(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) {}
	  };
	}
	function emptyFunctionThatReturnsNull() {
	  return null;
	}
	factoryWithTypeCheckers = function (isValidElement, throwOnDirectAccess) {
	  /* global Symbol */
	  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

	  /**
	   * Returns the iterator method function contained on the iterable object.
	   *
	   * Be sure to invoke the function with the iterable as context:
	   *
	   *     var iteratorFn = getIteratorFn(myIterable);
	   *     if (iteratorFn) {
	   *       var iterator = iteratorFn.call(myIterable);
	   *       ...
	   *     }
	   *
	   * @param {?object} maybeIterable
	   * @return {?function}
	   */
	  function getIteratorFn(maybeIterable) {
	    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
	    if (typeof iteratorFn === 'function') {
	      return iteratorFn;
	    }
	  }

	  /**
	   * Collection of methods that allow declaration and validation of props that are
	   * supplied to React components. Example usage:
	   *
	   *   var Props = require('ReactPropTypes');
	   *   var MyArticle = React.createClass({
	   *     propTypes: {
	   *       // An optional string prop named "description".
	   *       description: Props.string,
	   *
	   *       // A required enum prop named "category".
	   *       category: Props.oneOf(['News','Photos']).isRequired,
	   *
	   *       // A prop named "dialog" that requires an instance of Dialog.
	   *       dialog: Props.instanceOf(Dialog).isRequired
	   *     },
	   *     render: function() { ... }
	   *   });
	   *
	   * A more formal specification of how these methods are used:
	   *
	   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
	   *   decl := ReactPropTypes.{type}(.isRequired)?
	   *
	   * Each and every declaration produces a function with the same signature. This
	   * allows the creation of custom validation functions. For example:
	   *
	   *  var MyLink = React.createClass({
	   *    propTypes: {
	   *      // An optional string or URI prop named "href".
	   *      href: function(props, propName, componentName) {
	   *        var propValue = props[propName];
	   *        if (propValue != null && typeof propValue !== 'string' &&
	   *            !(propValue instanceof URI)) {
	   *          return new Error(
	   *            'Expected a string or an URI for ' + propName + ' in ' +
	   *            componentName
	   *          );
	   *        }
	   *      }
	   *    },
	   *    render: function() {...}
	   *  });
	   *
	   * @internal
	   */

	  var ANONYMOUS = '<<anonymous>>';

	  // Important!
	  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
	  var ReactPropTypes = {
	    array: createPrimitiveTypeChecker('array'),
	    bigint: createPrimitiveTypeChecker('bigint'),
	    bool: createPrimitiveTypeChecker('boolean'),
	    func: createPrimitiveTypeChecker('function'),
	    number: createPrimitiveTypeChecker('number'),
	    object: createPrimitiveTypeChecker('object'),
	    string: createPrimitiveTypeChecker('string'),
	    symbol: createPrimitiveTypeChecker('symbol'),
	    any: createAnyTypeChecker(),
	    arrayOf: createArrayOfTypeChecker,
	    element: createElementTypeChecker(),
	    elementType: createElementTypeTypeChecker(),
	    instanceOf: createInstanceTypeChecker,
	    node: createNodeChecker(),
	    objectOf: createObjectOfTypeChecker,
	    oneOf: createEnumTypeChecker,
	    oneOfType: createUnionTypeChecker,
	    shape: createShapeTypeChecker,
	    exact: createStrictShapeTypeChecker
	  };

	  /**
	   * inlined Object.is polyfill to avoid requiring consumers ship their own
	   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
	   */
	  /*eslint-disable no-self-compare*/
	  function is(x, y) {
	    // SameValue algorithm
	    if (x === y) {
	      // Steps 1-5, 7-10
	      // Steps 6.b-6.e: +0 != -0
	      return x !== 0 || 1 / x === 1 / y;
	    } else {
	      // Step 6.a: NaN == NaN
	      return x !== x && y !== y;
	    }
	  }
	  /*eslint-enable no-self-compare*/

	  /**
	   * We use an Error-like object for backward compatibility as people may call
	   * PropTypes directly and inspect their output. However, we don't use real
	   * Errors anymore. We don't inspect their stack anyway, and creating them
	   * is prohibitively expensive if they are created too often, such as what
	   * happens in oneOfType() for any type before the one that matched.
	   */
	  function PropTypeError(message, data) {
	    this.message = message;
	    this.data = data && typeof data === 'object' ? data : {};
	    this.stack = '';
	  }
	  // Make `instanceof Error` still work for returned errors.
	  PropTypeError.prototype = Error.prototype;
	  function createChainableTypeChecker(validate) {
	    if (process.env.NODE_ENV !== 'production') {
	      var manualPropTypeCallCache = {};
	      var manualPropTypeWarningCount = 0;
	    }
	    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
	      componentName = componentName || ANONYMOUS;
	      propFullName = propFullName || propName;
	      if (secret !== ReactPropTypesSecret) {
	        if (throwOnDirectAccess) {
	          // New behavior only for users of `prop-types` package
	          var err = new Error('Calling PropTypes validators directly is not supported by the `prop-types` package. ' + 'Use `PropTypes.checkPropTypes()` to call them. ' + 'Read more at http://fb.me/use-check-prop-types');
	          err.name = 'Invariant Violation';
	          throw err;
	        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
	          // Old behavior for people using React.PropTypes
	          var cacheKey = componentName + ':' + propName;
	          if (!manualPropTypeCallCache[cacheKey] &&
	          // Avoid spamming the console because they are often not actionable except for lib authors
	          manualPropTypeWarningCount < 3) {
	            printWarning('You are manually calling a React.PropTypes validation ' + 'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' + 'and will throw in the standalone `prop-types` package. ' + 'You may be seeing this warning due to a third-party PropTypes ' + 'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.');
	            manualPropTypeCallCache[cacheKey] = true;
	            manualPropTypeWarningCount++;
	          }
	        }
	      }
	      if (props[propName] == null) {
	        if (isRequired) {
	          if (props[propName] === null) {
	            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
	          }
	          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
	        }
	        return null;
	      } else {
	        return validate(props, propName, componentName, location, propFullName);
	      }
	    }
	    var chainedCheckType = checkType.bind(null, false);
	    chainedCheckType.isRequired = checkType.bind(null, true);
	    return chainedCheckType;
	  }
	  function createPrimitiveTypeChecker(expectedType) {
	    function validate(props, propName, componentName, location, propFullName, secret) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== expectedType) {
	        // `propValue` being instance of, say, date/regexp, pass the 'object'
	        // check, but we can offer a more precise error message here rather than
	        // 'of type `object`'.
	        var preciseType = getPreciseType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'), {
	          expectedType: expectedType
	        });
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createAnyTypeChecker() {
	    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
	  }
	  function createArrayOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
	      }
	      var propValue = props[propName];
	      if (!Array.isArray(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
	      }
	      for (var i = 0; i < propValue.length; i++) {
	        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
	        if (error instanceof Error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createElementTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!isValidElement(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createElementTypeTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!ReactIs.isValidElementType(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createInstanceTypeChecker(expectedClass) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!(props[propName] instanceof expectedClass)) {
	        var expectedClassName = expectedClass.name || ANONYMOUS;
	        var actualClassName = getClassName(props[propName]);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createEnumTypeChecker(expectedValues) {
	    if (!Array.isArray(expectedValues)) {
	      if (process.env.NODE_ENV !== 'production') {
	        if (arguments.length > 1) {
	          printWarning('Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' + 'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).');
	        } else {
	          printWarning('Invalid argument supplied to oneOf, expected an array.');
	        }
	      }
	      return emptyFunctionThatReturnsNull;
	    }
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      for (var i = 0; i < expectedValues.length; i++) {
	        if (is(propValue, expectedValues[i])) {
	          return null;
	        }
	      }
	      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
	        var type = getPreciseType(value);
	        if (type === 'symbol') {
	          return String(value);
	        }
	        return value;
	      });
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createObjectOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
	      }
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
	      }
	      for (var key in propValue) {
	        if (has(propValue, key)) {
	          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	          if (error instanceof Error) {
	            return error;
	          }
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createUnionTypeChecker(arrayOfTypeCheckers) {
	    if (!Array.isArray(arrayOfTypeCheckers)) {
	      process.env.NODE_ENV !== 'production' ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
	      return emptyFunctionThatReturnsNull;
	    }
	    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	      var checker = arrayOfTypeCheckers[i];
	      if (typeof checker !== 'function') {
	        printWarning('Invalid argument supplied to oneOfType. Expected an array of check functions, but ' + 'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.');
	        return emptyFunctionThatReturnsNull;
	      }
	    }
	    function validate(props, propName, componentName, location, propFullName) {
	      var expectedTypes = [];
	      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	        var checker = arrayOfTypeCheckers[i];
	        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
	        if (checkerResult == null) {
	          return null;
	        }
	        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
	          expectedTypes.push(checkerResult.data.expectedType);
	        }
	      }
	      var expectedTypesMessage = expectedTypes.length > 0 ? ', expected one of type [' + expectedTypes.join(', ') + ']' : '';
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createNodeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!isNode(props[propName])) {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function invalidValidatorError(componentName, location, propFullName, key, type) {
	    return new PropTypeError((componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + type + '`.');
	  }
	  function createShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      for (var key in shapeTypes) {
	        var checker = shapeTypes[key];
	        if (typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function createStrictShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      // We need to check all keys in case some are required but missing from props.
	      var allKeys = assign({}, props[propName], shapeTypes);
	      for (var key in allKeys) {
	        var checker = shapeTypes[key];
	        if (has(shapeTypes, key) && typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        if (!checker) {
	          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' + '\nBad object: ' + JSON.stringify(props[propName], null, '  ') + '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  '));
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }
	  function isNode(propValue) {
	    switch (typeof propValue) {
	      case 'number':
	      case 'string':
	      case 'undefined':
	        return true;
	      case 'boolean':
	        return !propValue;
	      case 'object':
	        if (Array.isArray(propValue)) {
	          return propValue.every(isNode);
	        }
	        if (propValue === null || isValidElement(propValue)) {
	          return true;
	        }
	        var iteratorFn = getIteratorFn(propValue);
	        if (iteratorFn) {
	          var iterator = iteratorFn.call(propValue);
	          var step;
	          if (iteratorFn !== propValue.entries) {
	            while (!(step = iterator.next()).done) {
	              if (!isNode(step.value)) {
	                return false;
	              }
	            }
	          } else {
	            // Iterator will provide entry [k,v] tuples rather than values.
	            while (!(step = iterator.next()).done) {
	              var entry = step.value;
	              if (entry) {
	                if (!isNode(entry[1])) {
	                  return false;
	                }
	              }
	            }
	          }
	        } else {
	          return false;
	        }
	        return true;
	      default:
	        return false;
	    }
	  }
	  function isSymbol(propType, propValue) {
	    // Native Symbol.
	    if (propType === 'symbol') {
	      return true;
	    }

	    // falsy value can't be a Symbol
	    if (!propValue) {
	      return false;
	    }

	    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
	    if (propValue['@@toStringTag'] === 'Symbol') {
	      return true;
	    }

	    // Fallback for non-spec compliant Symbols which are polyfilled.
	    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
	      return true;
	    }
	    return false;
	  }

	  // Equivalent of `typeof` but with special handling for array and regexp.
	  function getPropType(propValue) {
	    var propType = typeof propValue;
	    if (Array.isArray(propValue)) {
	      return 'array';
	    }
	    if (propValue instanceof RegExp) {
	      // Old webkits (at least until Android 4.0) return 'function' rather than
	      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
	      // passes PropTypes.object.
	      return 'object';
	    }
	    if (isSymbol(propType, propValue)) {
	      return 'symbol';
	    }
	    return propType;
	  }

	  // This handles more types than `getPropType`. Only used for error messages.
	  // See `createPrimitiveTypeChecker`.
	  function getPreciseType(propValue) {
	    if (typeof propValue === 'undefined' || propValue === null) {
	      return '' + propValue;
	    }
	    var propType = getPropType(propValue);
	    if (propType === 'object') {
	      if (propValue instanceof Date) {
	        return 'date';
	      } else if (propValue instanceof RegExp) {
	        return 'regexp';
	      }
	    }
	    return propType;
	  }

	  // Returns a string that is postfixed to a warning about an invalid type.
	  // For example, "undefined" or "of type array"
	  function getPostfixForTypeWarning(value) {
	    var type = getPreciseType(value);
	    switch (type) {
	      case 'array':
	      case 'object':
	        return 'an ' + type;
	      case 'boolean':
	      case 'date':
	      case 'regexp':
	        return 'a ' + type;
	      default:
	        return type;
	    }
	  }

	  // Returns class name of the object, if any.
	  function getClassName(propValue) {
	    if (!propValue.constructor || !propValue.constructor.name) {
	      return ANONYMOUS;
	    }
	    return propValue.constructor.name;
	  }
	  ReactPropTypes.checkPropTypes = checkPropTypes;
	  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
	  ReactPropTypes.PropTypes = ReactPropTypes;
	  return ReactPropTypes;
	};
	return factoryWithTypeCheckers;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var factoryWithThrowingShims;
var hasRequiredFactoryWithThrowingShims;

function requireFactoryWithThrowingShims () {
	if (hasRequiredFactoryWithThrowingShims) return factoryWithThrowingShims;
	hasRequiredFactoryWithThrowingShims = 1;

	var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();
	function emptyFunction() {}
	function emptyFunctionWithReset() {}
	emptyFunctionWithReset.resetWarningCache = emptyFunction;
	factoryWithThrowingShims = function () {
	  function shim(props, propName, componentName, location, propFullName, secret) {
	    if (secret === ReactPropTypesSecret) {
	      // It is still safe when called from React.
	      return;
	    }
	    var err = new Error('Calling PropTypes validators directly is not supported by the `prop-types` package. ' + 'Use PropTypes.checkPropTypes() to call them. ' + 'Read more at http://fb.me/use-check-prop-types');
	    err.name = 'Invariant Violation';
	    throw err;
	  }
	  shim.isRequired = shim;
	  function getShim() {
	    return shim;
	  }
	  // Important!
	  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
	  var ReactPropTypes = {
	    array: shim,
	    bigint: shim,
	    bool: shim,
	    func: shim,
	    number: shim,
	    object: shim,
	    string: shim,
	    symbol: shim,
	    any: shim,
	    arrayOf: getShim,
	    element: shim,
	    elementType: shim,
	    instanceOf: getShim,
	    node: shim,
	    objectOf: getShim,
	    oneOf: getShim,
	    oneOfType: getShim,
	    shape: getShim,
	    exact: getShim,
	    checkPropTypes: emptyFunctionWithReset,
	    resetWarningCache: emptyFunction
	  };
	  ReactPropTypes.PropTypes = ReactPropTypes;
	  return ReactPropTypes;
	};
	return factoryWithThrowingShims;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredPropTypes;

function requirePropTypes () {
	if (hasRequiredPropTypes) return propTypes.exports;
	hasRequiredPropTypes = 1;
	if (process.env.NODE_ENV !== 'production') {
	  var ReactIs = requireReactIs();

	  // By explicitly using `prop-types` you are opting into new development behavior.
	  // http://fb.me/prop-types-in-prod
	  var throwOnDirectAccess = true;
	  propTypes.exports = /*@__PURE__*/ requireFactoryWithTypeCheckers()(ReactIs.isElement, throwOnDirectAccess);
	} else {
	  // By explicitly using `prop-types` you are opting into new production behavior.
	  // http://fb.me/prop-types-in-prod
	  propTypes.exports = /*@__PURE__*/ requireFactoryWithThrowingShims()();
	}
	return propTypes.exports;
}

var propTypesExports = /*@__PURE__*/ requirePropTypes();
var PropTypes = /*@__PURE__*/getDefaultExportFromCjs(propTypesExports);

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
var ICON_PACKS_STARTING_VERSION = '7.0.0';

// Try to get version from installed package first, fallback to env var, then default
var SVG_CORE_VERSION;
try {
  var svgCorePackageJson = require('@fortawesome/fontawesome-svg-core/package.json');
  SVG_CORE_VERSION = svgCorePackageJson.version;
} catch (e) {
  // If package.json can't be loaded, try environment variable
  SVG_CORE_VERSION = typeof process !== 'undefined' && process.env.FA_VERSION || '7.0.0';
}

// Get CSS class list from a props object
function classList(props) {
  var beat = props.beat,
    fade = props.fade,
    beatFade = props.beatFade,
    bounce = props.bounce,
    shake = props.shake,
    flash = props.flash,
    spin = props.spin,
    spinPulse = props.spinPulse,
    spinReverse = props.spinReverse,
    pulse = props.pulse,
    fixedWidth = props.fixedWidth,
    inverse = props.inverse,
    border = props.border,
    listItem = props.listItem,
    flip = props.flip,
    size = props.size,
    rotation = props.rotation,
    pull = props.pull,
    swapOpacity = props.swapOpacity,
    rotateBy = props.rotateBy,
    widthAuto = props.widthAuto;

  // Check if we're using version 7 or later
  var isVersion7OrLater = versionCheckGte(SVG_CORE_VERSION, ICON_PACKS_STARTING_VERSION);

  // map of CSS class names to properties
  var classes = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({
    'fa-beat': beat,
    'fa-fade': fade,
    'fa-beat-fade': beatFade,
    'fa-bounce': bounce,
    'fa-shake': shake,
    'fa-flash': flash,
    'fa-spin': spin,
    'fa-spin-reverse': spinReverse,
    'fa-spin-pulse': spinPulse,
    'fa-pulse': pulse,
    'fa-fw': fixedWidth,
    'fa-inverse': inverse,
    'fa-border': border,
    'fa-li': listItem,
    'fa-flip': flip === true,
    'fa-flip-horizontal': flip === 'horizontal' || flip === 'both',
    'fa-flip-vertical': flip === 'vertical' || flip === 'both'
  }, "fa-".concat(size), typeof size !== 'undefined' && size !== null), "fa-rotate-".concat(rotation), typeof rotation !== 'undefined' && rotation !== null && rotation !== 0), "fa-pull-".concat(pull), typeof pull !== 'undefined' && pull !== null), 'fa-swap-opacity', swapOpacity), 'fa-rotate-by', isVersion7OrLater && rotateBy), 'fa-width-auto', isVersion7OrLater && widthAuto);

  // map over all the keys in the classes object
  // return an array of the keys where the value for the key is not null
  return Object.keys(classes).map(function (key) {
    return classes[key] ? key : null;
  }).filter(function (key) {
    return key;
  });
}

// check if verion1 is greater than or equal to version2
function versionCheckGte(version1, version2) {
  var _version1$split = version1.split('-'),
    _version1$split2 = _slicedToArray(_version1$split, 2),
    v1Base = _version1$split2[0],
    v1PreRelease = _version1$split2[1];
  var _version2$split = version2.split('-'),
    _version2$split2 = _slicedToArray(_version2$split, 2),
    v2Base = _version2$split2[0],
    v2PreRelease = _version2$split2[1];
  var v1Parts = v1Base.split('.');
  var v2Parts = v2Base.split('.');

  // Compare version numbers first
  for (var i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    var v1Part = v1Parts[i] || '0';
    var v2Part = v2Parts[i] || '0';

    // Compare numeric values
    var v1Num = parseInt(v1Part, 10);
    var v2Num = parseInt(v2Part, 10);
    if (v1Num !== v2Num) {
      return v1Num > v2Num;
    }
  }

  // If numeric values are equal, look for any remaining parts
  // that would make one version greater than the other
  for (var _i = 0; _i < Math.max(v1Parts.length, v2Parts.length); _i++) {
    var _v1Part = v1Parts[_i] || '0';
    var _v2Part = v2Parts[_i] || '0';
    if (_v1Part !== _v2Part) {
      // When numeric values are equal but strings differ,
      // the one without leading zeros is greater
      if (_v1Part.length !== _v2Part.length) {
        return _v1Part.length < _v2Part.length;
      }
    }
  }

  // If version numbers are equal, compare pre-release identifiers
  // A version with a pre-release identifier is less than one without
  if (v1PreRelease && !v2PreRelease) return false;
  if (!v1PreRelease && v2PreRelease) return true;
  return true;
}

// Camelize taken from humps
// humps is copyright © 2012+ Dom Christie
// Released under the MIT license.

// Performant way to determine if object coerces to a number
function _isNumerical(obj) {
  obj = obj - 0;

  // eslint-disable-next-line no-self-compare
  return obj === obj;
}
function camelize(string) {
  if (_isNumerical(string)) {
    return string;
  }

  // eslint-disable-next-line no-useless-escape
  string = string.replace(/[\-_\s]+(.)?/g, function (match, chr) {
    return chr ? chr.toUpperCase() : '';
  });

  // Ensure 1st char is always lowercase
  return string.substr(0, 1).toLowerCase() + string.substr(1);
}
var _excluded$1 = ["style"];
function capitalize(val) {
  return val.charAt(0).toUpperCase() + val.slice(1);
}
function styleToObject(style) {
  return style.split(';').map(function (s) {
    return s.trim();
  }).filter(function (s) {
    return s;
  }).reduce(function (acc, pair) {
    var i = pair.indexOf(':');
    var prop = camelize(pair.slice(0, i));
    var value = pair.slice(i + 1).trim();
    prop.startsWith('webkit') ? acc[capitalize(prop)] = value : acc[prop] = value;
    return acc;
  }, {});
}
function convert(createElement, element) {
  var extraProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (typeof element === 'string') {
    return element;
  }
  var children = (element.children || []).map(function (child) {
    return convert(createElement, child);
  });

  /* eslint-disable dot-notation */
  var mixins = Object.keys(element.attributes || {}).reduce(function (acc, key) {
    var val = element.attributes[key];
    switch (key) {
      case 'class':
        acc.attrs['className'] = val;
        delete element.attributes['class'];
        break;
      case 'style':
        acc.attrs['style'] = styleToObject(val);
        break;
      default:
        if (key.indexOf('aria-') === 0 || key.indexOf('data-') === 0) {
          acc.attrs[key.toLowerCase()] = val;
        } else {
          acc.attrs[camelize(key)] = val;
        }
    }
    return acc;
  }, {
    attrs: {}
  });
  var _extraProps$style = extraProps.style,
    existingStyle = _extraProps$style === void 0 ? {} : _extraProps$style,
    remaining = _objectWithoutProperties(extraProps, _excluded$1);
  mixins.attrs['style'] = _objectSpread2(_objectSpread2({}, mixins.attrs['style']), existingStyle);
  /* eslint-enable */

  return createElement.apply(void 0, [element.tag, _objectSpread2(_objectSpread2({}, mixins.attrs), remaining)].concat(_toConsumableArray(children)));
}
var PRODUCTION = false;
try {
  PRODUCTION = process.env.NODE_ENV === 'production';
} catch (e) {}
function log() {
  if (!PRODUCTION && console && typeof console.error === 'function') {
    var _console;
    (_console = console).error.apply(_console, arguments);
  }
}

// Normalize icon arguments
function normalizeIconArgs(icon) {
  // this has everything that it needs to be rendered which means it was probably imported
  // directly from an icon svg package
  if (icon && _typeof(icon) === 'object' && icon.prefix && icon.iconName && icon.icon) {
    return icon;
  }
  if (parse$1.icon) {
    return parse$1.icon(icon);
  }

  // if the icon is null, there's nothing to do
  if (icon === null) {
    return null;
  }

  // if the icon is an object and has a prefix and an icon name, return it
  if (icon && _typeof(icon) === 'object' && icon.prefix && icon.iconName) {
    return icon;
  }

  // if it's an array with length of two
  if (Array.isArray(icon) && icon.length === 2) {
    // use the first item as prefix, second as icon name
    return {
      prefix: icon[0],
      iconName: icon[1]
    };
  }

  // if it's a string, use it as the icon name
  if (typeof icon === 'string') {
    return {
      prefix: 'fas',
      iconName: icon
    };
  }
}

// creates an object with a key of key
// and a value of value
// if certain conditions are met
function objectWithKey(key, value) {
  // if the value is a non-empty array
  // or it's not an array but it is truthy
  // then create the object with the key and the value
  // if not, return an empty array
  return Array.isArray(value) && value.length > 0 || !Array.isArray(value) && value ? _defineProperty({}, key, value) : {};
}
var defaultProps = {
  border: false,
  className: '',
  mask: null,
  maskId: null,
  // the fixedWidth property has been deprecated as of version 7
  fixedWidth: false,
  inverse: false,
  flip: false,
  icon: null,
  listItem: false,
  pull: null,
  pulse: false,
  rotation: null,
  rotateBy: false,
  size: null,
  spin: false,
  spinPulse: false,
  spinReverse: false,
  beat: false,
  fade: false,
  beatFade: false,
  bounce: false,
  shake: false,
  symbol: false,
  title: '',
  titleId: null,
  transform: null,
  swapOpacity: false,
  widthAuto: false
};
var FontAwesomeIcon = /*#__PURE__*/React.forwardRef(function (props, ref) {
  var allProps = _objectSpread2(_objectSpread2({}, defaultProps), props);
  var iconArgs = allProps.icon,
    maskArgs = allProps.mask,
    symbol = allProps.symbol,
    className = allProps.className,
    title = allProps.title,
    titleId = allProps.titleId,
    maskId = allProps.maskId;
  var iconLookup = normalizeIconArgs(iconArgs);
  var classes = objectWithKey('classes', [].concat(_toConsumableArray(classList(allProps)), _toConsumableArray((className || '').split(' '))));
  var transform = objectWithKey('transform', typeof allProps.transform === 'string' ? parse$1.transform(allProps.transform) : allProps.transform);
  var mask = objectWithKey('mask', normalizeIconArgs(maskArgs));
  var renderedIcon = icon(iconLookup, _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, classes), transform), mask), {}, {
    symbol: symbol,
    title: title,
    titleId: titleId,
    maskId: maskId
  }));
  if (!renderedIcon) {
    log('Could not find icon', iconLookup);
    return null;
  }
  var abstract = renderedIcon.abstract;
  var extraProps = {
    ref: ref
  };
  Object.keys(allProps).forEach(function (key) {
    // eslint-disable-next-line no-prototype-builtins
    if (!defaultProps.hasOwnProperty(key)) {
      extraProps[key] = allProps[key];
    }
  });
  return convertCurry(abstract[0], extraProps);
});
FontAwesomeIcon.displayName = 'FontAwesomeIcon';
FontAwesomeIcon.propTypes = {
  beat: PropTypes.bool,
  border: PropTypes.bool,
  beatFade: PropTypes.bool,
  bounce: PropTypes.bool,
  className: PropTypes.string,
  fade: PropTypes.bool,
  flash: PropTypes.bool,
  mask: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
  maskId: PropTypes.string,
  // the fixedWidth property has been deprecated as of version 7
  fixedWidth: PropTypes.bool,
  inverse: PropTypes.bool,
  flip: PropTypes.oneOf([true, false, 'horizontal', 'vertical', 'both']),
  icon: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
  listItem: PropTypes.bool,
  pull: PropTypes.oneOf(['right', 'left']),
  pulse: PropTypes.bool,
  rotation: PropTypes.oneOf([0, 90, 180, 270]),
  rotateBy: PropTypes.bool,
  shake: PropTypes.bool,
  size: PropTypes.oneOf(['2xs', 'xs', 'sm', 'lg', 'xl', '2xl', '1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x']),
  spin: PropTypes.bool,
  spinPulse: PropTypes.bool,
  spinReverse: PropTypes.bool,
  symbol: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  title: PropTypes.string,
  titleId: PropTypes.string,
  transform: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  swapOpacity: PropTypes.bool,
  widthAuto: PropTypes.bool
};
var convertCurry = convert.bind(null, React.createElement);

/*!
 * Font Awesome Free 7.3.0 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2026 Fonticons, Inc.
 */
var faMagnifyingGlass = {
  prefix: 'fas',
  iconName: 'magnifying-glass',
  icon: [512, 512, [128269, "search"], "f002", "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"]
};
var faSearch = faMagnifyingGlass;
var faClock = {
  prefix: 'fas',
  iconName: 'clock',
  icon: [512, 512, [128339, "clock-four"], "f017", "M256 0a256 256 0 1 1 0 512 256 256 0 1 1 0-512zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"]
};
var faChevronRight = {
  prefix: 'fas',
  iconName: 'chevron-right',
  icon: [320, 512, [9002], "f054", "M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"]
};
var faDatabase = {
  prefix: 'fas',
  iconName: 'database',
  icon: [448, 512, [], "f1c0", "M448 205.8c-14.8 9.8-31.8 17.7-49.5 24-47 16.8-108.7 26.2-174.5 26.2S96.4 246.5 49.5 229.8c-17.6-6.3-34.7-14.2-49.5-24L0 288c0 44.2 100.3 80 224 80s224-35.8 224-80l0-82.2zm0-77.8l0-48C448 35.8 347.7 0 224 0S0 35.8 0 80l0 48c0 44.2 100.3 80 224 80s224-35.8 224-80zM398.5 389.8C351.6 406.5 289.9 416 224 416S96.4 406.5 49.5 389.8c-17.6-6.3-34.7-14.2-49.5-24L0 432c0 44.2 100.3 80 224 80s224-35.8 224-80l0-66.2c-14.8 9.8-31.8 17.7-49.5 24z"]
};
var faCode = {
  prefix: 'fas',
  iconName: 'code',
  icon: [576, 512, [], "f121", "M360.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm64.6 136.1c-12.5 12.5-12.5 32.8 0 45.3l73.4 73.4-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0zm-274.7 0c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 150.6 182.6c12.5-12.5 12.5-32.8 0-45.3z"]
};
var faFaceMeh = {
  prefix: 'fas',
  iconName: 'face-meh',
  icon: [512, 512, [128528, "meh"], "f11a", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM176 176a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm128 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM176 320l160 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-160 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"]
};
var faFolder = {
  prefix: 'fas',
  iconName: 'folder',
  icon: [512, 512, [128193, 128447, 61716, "folder-blank"], "f07b", "M64 448l384 0c35.3 0 64-28.7 64-64l0-240c0-35.3-28.7-64-64-64L298.7 80c-6.9 0-13.7-2.2-19.2-6.4L241.1 44.8C230 36.5 216.5 32 202.7 32L64 32C28.7 32 0 60.7 0 96L0 384c0 35.3 28.7 64 64 64z"]
};
var faFaceFrownOpen = {
  prefix: 'fas',
  iconName: 'face-frown-open',
  icon: [512, 512, [128550, "frown-open"], "f57a", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM176 176a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm128 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM182.4 382.5c-12.4 5.2-26.5-4.1-21.1-16.4 16-36.6 52.4-62.1 94.8-62.1s78.8 25.6 94.8 62.1c5.4 12.3-8.7 21.6-21.1 16.4-22.4-9.5-47.4-14.8-73.7-14.8s-51.3 5.3-73.7 14.8z"]
};
var faCheck = {
  prefix: 'fas',
  iconName: 'check',
  icon: [448, 512, [10003, 10004], "f00c", "M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"]
};
var faSliders = {
  prefix: 'fas',
  iconName: 'sliders',
  icon: [512, 512, ["sliders-h"], "f1de", "M32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 224zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384z"]
};
var faFaceFrown = {
  prefix: 'fas',
  iconName: 'face-frown',
  icon: [512, 512, [9785, "frown"], "f119", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm90.6-113.9c-20.4-28-53.4-46.1-90.6-46.1s-70.2 18.1-90.6 46.1c-7.8 10.7-22.8 13.1-33.5 5.3s-13.1-22.8-5.3-33.5C155.7 330 202.8 304 256 304s100.3 26 129.4 65.9c7.8 10.7 5.4 25.7-5.3 33.5s-25.7 5.4-33.5-5.3zM144 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]
};
var faUser = {
  prefix: 'fas',
  iconName: 'user',
  icon: [448, 512, [128100, 62144, 62470, "user-alt", "user-large"], "f007", "M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z"]
};
var faXmark = {
  prefix: 'fas',
  iconName: 'xmark',
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"]
};
var faLockOpen = {
  prefix: 'fas',
  iconName: 'lock-open',
  icon: [576, 512, [], "f3c1", "M384 96c0-35.3 28.7-64 64-64s64 28.7 64 64l0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32c0-70.7-57.3-128-128-128S320 25.3 320 96l0 64-160 0c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64l-32 0 0-64z"]
};
var faFaceLaughBeam = {
  prefix: 'fas',
  iconName: 'face-laugh-beam',
  icon: [512, 512, [128513, "laugh-beam"], "f59a", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM101.6 314c-3.7-13.7 7.5-26 21.7-26l265.4 0c14.2 0 25.4 12.3 21.7 26-18.5 68-80.6 118-154.4 118S120 382 101.6 314zM176 164c-15.5 0-28 12.5-28 28l0 8c0 11-9 20-20 20s-20-9-20-20l0-8c0-37.6 30.4-68 68-68s68 30.4 68 68l0 8c0 11-9 20-20 20s-20-9-20-20l0-8c0-15.5-12.5-28-28-28zm132 28l0 8c0 11-9 20-20 20s-20-9-20-20l0-8c0-37.6 30.4-68 68-68s68 30.4 68 68l0 8c0 11-9 20-20 20s-20-9-20-20l0-8c0-15.5-12.5-28-28-28s-28 12.5-28 28z"]
};
var faCommentDots = {
  prefix: 'fas',
  iconName: 'comment-dots',
  icon: [512, 512, [128172, 62075, "commenting"], "f4ad", "M256 480c141.4 0 256-107.5 256-240S397.4 0 256 0 0 107.5 0 240c0 54.3 19.2 104.3 51.6 144.5L2.8 476.8c-4.8 9-3.3 20 3.6 27.5s17.8 9.8 27.1 5.8l118.4-50.7C183.7 472.6 218.9 480 256 480zM128 208a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm128 0a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm96 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"]
};
var faChevronLeft = {
  prefix: 'fas',
  iconName: 'chevron-left',
  icon: [320, 512, [9001], "f053", "M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"]
};
var faLock = {
  prefix: 'fas',
  iconName: 'lock',
  icon: [384, 512, [128274], "f023", "M128 96l0 64 128 0 0-64c0-35.3-28.7-64-64-64s-64 28.7-64 64zM64 160l0-64C64 25.3 121.3-32 192-32S320 25.3 320 96l0 64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64z"]
};
var faGlobe = {
  prefix: 'fas',
  iconName: 'globe',
  icon: [512, 512, [127760], "f0ac", "M351.9 280l-190.9 0c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zM160.9 232l190.9 0C349 167.5 334.7 108.1 314.4 64.6 303 40.2 290.7 22.8 279.3 12.2 268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4zm-48 0C116.4 146.4 138.5 66.9 170.8 14.7 78.7 47.3 10.9 131.2 1.5 232l111.4 0zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3L1.5 280zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3l-111.4 0zm111.4-48C501.9 131.2 434.1 47.3 342 14.7 374.3 66.9 396.4 146.4 399.9 232l111.4 0z"]
};
var faFaceSmile = {
  prefix: 'fas',
  iconName: 'face-smile',
  icon: [512, 512, [128578, "smile"], "f118", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM165.4 321.9c20.4 28 53.4 46.1 90.6 46.1s70.2-18.1 90.6-46.1c7.8-10.7 22.8-13.1 33.5-5.3s13.1 22.8 5.3 33.5C356.3 390 309.2 416 256 416s-100.3-26-129.4-65.9c-7.8-10.7-5.4-25.7 5.3-33.5s25.7-5.4 33.5 5.3zM144 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]
};
var faBookOpen = {
  prefix: 'fas',
  iconName: 'book-open',
  icon: [512, 512, [128214, 128366], "f518", "M256 141.3l0 309.3 .5-.2C311.1 427.7 369.7 416 428.8 416l19.2 0 0-320-19.2 0c-42.2 0-84.1 8.4-123.1 24.6-16.8 7-33.4 13.9-49.7 20.7zM230.9 61.5L256 72 281.1 61.5C327.9 42 378.1 32 428.8 32L464 32c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-35.2 0c-50.7 0-100.9 10-147.7 29.5l-12.8 5.3c-7.9 3.3-16.7 3.3-24.6 0l-12.8-5.3C184.1 490 133.9 480 83.2 480L48 480c-26.5 0-48-21.5-48-48L0 80C0 53.5 21.5 32 48 32l35.2 0c50.7 0 100.9 10 147.7 29.5z"]
};
var faLayerGroup = {
  prefix: 'fas',
  iconName: 'layer-group',
  icon: [512, 512, [], "f5fd", "M232.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 149.8C5.4 145.8 0 137.3 0 128s5.4-17.9 13.9-21.8L232.5 5.2zM48.1 218.4l164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 277.8C5.4 273.8 0 265.3 0 256s5.4-17.9 13.9-21.8l34.1-15.8zM13.9 362.2l34.1-15.8 164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 405.8C5.4 401.8 0 393.3 0 384s5.4-17.9 13.9-21.8z"]
};

var DEFAULT_LANGUAGE = "en";
var LANGUAGE_STORAGE_KEY = "solid-dataspace.language";
var LANGUAGE_EVENT = "solid-dataspace-language-change";
var LANGUAGE_MESSAGE_TYPE = "solid-dataspace-language-change";
var enToDe = {
  "Checking request status...": "Anfragestatus wird geprüft...",
  "Request pending": "Anfrage ausstehend",
  "Request Pending": "Anfrage ausstehend",
  "Request again": "Erneut anfragen",
  "Request approved": "Anfrage genehmigt",
  "Access revoked": "Zugriff widerrufen",
  "Request denied": "Anfrage abgelehnt",
  "Access expired": "Zugriff abgelaufen",
  "Request closed": "Anfrage abgeschlossen",
  "Check request status": "Anfragestatus prüfen",
  "Request status could not be confirmed. You can check again or send a new request.": "Der Anfragestatus konnte nicht bestätigt werden. Du kannst erneut prüfen oder eine neue Anfrage senden.",
  "Show decision history": "Entscheidungsverlauf anzeigen",
  "Hidden by filters:": "Durch Filter ausgeblendet:",
  "Decision not delivered:": "Entscheidung nicht zugestellt:",
  "Resend decision": "Entscheidung erneut zustellen",
  "Access was updated, but the decision could not be delivered. Use Resend decision.": "Der Zugriff wurde aktualisiert, aber die Entscheidung konnte nicht zugestellt werden. Bitte erneut zustellen.",
  "Decision delivery failed. You can retry without changing access permissions.": "Die Zustellung ist fehlgeschlagen. Du kannst sie wiederholen, ohne die Zugriffsrechte erneut zu ändern.",
  "Field selection (optional)": "Feldauswahl (optional)",
  "Source": "Quelle",
  "Invalid observation history index.": "Das Verzeichnis der Messwerthistorien ist ungültig.",
  "Select a time window of at most 31 history days.": "Bitte ein Zeitfenster mit höchstens 31 Historientagen wählen.",
  "History index requires a timestamp field.": "Im Historienverzeichnis fehlt das Zeitstempelfeld.",
  "History exceeds 64 MiB. Select a smaller time window.": "Die Historie überschreitet 64 MiB. Bitte ein kleineres Zeitfenster wählen.",
  "Add entry": "Eintrag hinzufügen",
  "Add catalog entry": "Katalogeintrag hinzufügen",
  "Add API": "API hinzufügen",
  "Edit API": "API bearbeiten",
  "Save API": "API speichern",
  "API details": "API-Details",
  "API endpoint": "API-Endpunkt",
  "API documentation URL": "Adresse der API-Dokumentation",
  "Authentication": "Authentifizierung",
  "API key required": "API-Schlüssel erforderlich",
  "Solid login required": "Solid-Anmeldung erforderlich",
  "Linked datasets": "Verknüpfte Datensätze",
  "No datasets available to link.": "Keine Datensätze zum Verknüpfen verfügbar.",
  "Describe an existing API. The catalog does not import its data or change its access rights.": "Beschreibe eine vorhandene API. Der Katalog importiert dabei keine Daten und ändert keine Zugriffsrechte.",
  "API descriptions are public catalog metadata. Do not enter tokens, passwords or secret URLs.": "API-Beschreibungen sind öffentliche Katalogmetadaten. Trage keine Tokens, Passwörter oder geheimen Adressen ein.",
  "Provide a title, description and publisher.": "Gib einen Titel, eine Beschreibung und einen Herausgeber an.",
  "Use an HTTPS endpoint without credentials or secret query parameters.": "Verwende einen HTTPS-Endpunkt ohne Zugangsdaten oder geheime Abfrageparameter.",
  "Use an HTTPS documentation URL without credentials.": "Verwende eine HTTPS-Adresse der Dokumentation ohne Zugangsdaten.",
  "Unsupported authentication method.": "Diese Authentifizierungsmethode wird nicht unterstützt.",
  "Linked datasets must have HTTPS metadata identifiers.": "Verknüpfte Datensätze benötigen HTTPS-Adressen ihrer Metadaten.",
  "Set up your catalog before publishing an API.": "Richte zuerst deinen Katalog ein, bevor du eine API veröffentlichst.",
  "API metadata must belong to your catalog.": "Die API-Metadaten müssen zu deinem Katalog gehören.",
  "This entry is not an API.": "Dieser Eintrag ist keine API.",
  "An entry with this identifier already exists.": "Ein Eintrag mit dieser Kennung existiert bereits.",
  "Saving...": "Wird gespeichert...",
  "See API documentation": "Siehe API-Dokumentation",
  "Invalid API endpoint": "Ungültiger API-Endpunkt",
  "Copy API URL": "API-Adresse kopieren",
  "Copied": "Kopiert",
  "Copy the address shown above.": "Kopiere die oben angezeigte Adresse.",
  "Open API documentation": "API-Dokumentation öffnen",
  "Example request": "Beispielabfrage",
  "Parameters and required credentials are described in the API documentation.": "Parameter und benötigte Zugangsdaten sind in der API-Dokumentation beschrieben.",
  "Remove API from catalog": "API aus Katalog entfernen",
  "Only the catalog links are removed. The API, metadata document and data remain unchanged.": "Nur die Katalogverweise werden entfernt. Die API, das Metadatendokument und die Daten bleiben unverändert.",
  "Confirm removal": "Entfernen bestätigen",
  "Query data": "Daten abfragen",
  "Query public data": "Öffentliche Daten abfragen",
  "Query existing public Pod files. Original records and histories remain unchanged.": "Frage vorhandene öffentliche Pod-Dateien ab. Originaldaten und Historien bleiben unverändert.",
  "Select dataset": "Datensatz auswählen",
  "Some catalog records are currently unavailable. Only discovered public sources are listed.": "Einige Katalogeinträge sind derzeit nicht verfügbar. Es werden nur gefundene öffentliche Quellen aufgelistet.",
  "From (inclusive, ISO timestamp)": "Von (einschließlich, ISO-Zeitstempel)",
  "To (exclusive, ISO timestamp)": "Bis (ausschließlich, ISO-Zeitstempel)",
  "Time field or JSON Pointer": "Zeitfeld oder JSON Pointer",
  "Record array JSON Pointer": "JSON Pointer zur Datensatzliste",
  "Output fields (comma-separated)": "Ausgabefelder (durch Komma getrennt)",
  "Records per page": "Datensätze pro Seite",
  "Latest timestamp only": "Nur neuester Zeitstempel",
  "Time fields are detected only when every record has a valid timestamp. You can specify the field explicitly.": "Zeitfelder werden nur erkannt, wenn jeder Datensatz einen gültigen Zeitstempel enthält. Du kannst das Feld ausdrücklich angeben.",
  "API documentation": "API-Dokumentation",
  "Read-only API for public Pod data.": "Lesende API für öffentliche Pod-Daten.",
  "Add this API to catalog": "Diese API zum Katalog hinzufügen",
  "Query result": "Abfrageergebnis",
  "records": "Datensätze",
  "Preview shortened. Use the API for the full page.": "Vorschau gekürzt. Verwende die API für die vollständige Ergebnisseite.",
  "Describe files from a Pod, upload files or add external data links.": "Beschreibe Pod-Dateien, lade Dateien hoch oder ergänze externe Datenadressen.",
  "Describe an API endpoint, its documentation and linked datasets.": "Beschreibe einen API-Endpunkt, seine Dokumentation und verknüpfte Datensätze.",
  "Use the local public data API.": "Verwende die lokale API für öffentliche Daten.",
  "Response is too large.": "Die Antwort ist zu groß.",
  "The public data API is currently unavailable.": "Die API für öffentliche Daten ist derzeit nicht verfügbar.",
  "Registry is not configured.": "Die Registry ist nicht konfiguriert.",
  "Registry catalog cache is not ready.": "Der Katalog-Cache der Registry ist noch nicht bereit.",
  "Source is not publicly readable.": "Die Quelle ist nicht öffentlich lesbar.",
  "Public source was not found.": "Die öffentliche Quelle wurde nicht gefunden.",
  "Public source is currently unavailable.": "Die öffentliche Quelle ist derzeit nicht verfügbar.",
  "Distribution is not in this registry.": "Diese Distribution gehört nicht zu dieser Registry.",
  "Source revision changed or is missing. Restart pagination at offset zero.": "Die Quellversion hat sich geändert oder fehlt. Starte erneut bei der ersten Seite.",
  "A valid timeField is required for temporal queries.": "Für Zeitabfragen ist ein gültiges Zeitfeld erforderlich.",
  "Some records lack a valid timestamp. Choose the correct timeField.": "Einige Datensätze enthalten keinen gültigen Zeitstempel. Wähle das passende Zeitfeld.",
  "Source contains invalid structured data.": "Die Quelle enthält ungültige strukturierte Daten.",
  "Select an array of objects with recordsPath.": "Wähle mit dem JSON Pointer eine Liste von Objekten.",
  "from must precede to.": "Der Beginn muss vor dem Ende liegen.",
  "from requires an ISO timestamp with timezone.": "Der Beginn benötigt einen ISO-Zeitstempel mit Zeitzone.",
  "to requires an ISO timestamp with timezone.": "Das Ende benötigt einen ISO-Zeitstempel mit Zeitzone.",
  "Query capacity reached. Retry later.": "Die Abfragekapazität ist ausgelastet. Versuche es später erneut.",
  "Invalid limit.": "Ungültige Seitengröße.",
  "Invalid offset.": "Ungültiger Seitenbeginn.",
  "Response exceeds 4 MiB. Request fewer records or fields.": "Die Antwort überschreitet 4 MiB. Frage weniger Datensätze oder Felder ab.",
  "Discover & connect": "Entdecken & vernetzen",
  "Data catalog": "Datenkatalog",
  "Find the data for your next idea.": "Finde die Daten für deine nächste Idee.",
  "Catalog overview": "Katalogübersicht",
  "Dataset series": "Datensatzreihen",
  "Access granted": "Zugriff vorhanden",
  "Clear search": "Suche leeren",
  "Filters": "Filter",
  "All": "Alle",
  "Type": "Typ",
  "Active filters": "Aktive Filter",
  "Remove filter": "Filter entfernen",
  "Reset all": "Alles zurücksetzen",
  "Sort by": "Sortierung",
  "Relevance": "Relevanz",
  "Recently updated": "Zuletzt aktualisiert",
  "Title A–Z": "Titel A–Z",
  "Date not provided": "Datum nicht angegeben",
  "Publisher not provided": "Herausgeber nicht angegeben",
  "Source needs refreshing": "Quelle muss aktualisiert werden",
  "No matching datasets": "Keine passenden Datensätze",
  "Your catalog is ready to grow": "Dein Katalog wartet auf Daten",
  "Try another search or adjust your filters.": "Versuche einen anderen Suchbegriff oder passe deine Filter an.",
  "Datasets from your selected registries will appear here.": "Hier erscheinen Datensätze aus deinen ausgewählten Registries.",
  "Result pages": "Ergebnisseiten",
  "Per page": "Pro Seite",
  "Previous page": "Vorherige Seite",
  "Next page": "Nächste Seite",
  "Resource type": "Ressourcentyp",
  "Identifier": "Kennung",
  "Modified Date": "Änderungsdatum",
  "Untitled dataset": "Datensatz ohne Titel",
  "No description provided.": "Keine Beschreibung angegeben.",
  "Restricted (you have access)": "Eingeschränkt (du hast Zugriff)",
  "Semantic Search": "Semantische Suche",
  "Loading search...": "Suche wird geladen...",
  "Search is currently unavailable. Please try again shortly.": "Die Suche ist gerade nicht verf\u00fcgbar. Bitte versuche es gleich noch einmal.",
  "Retry": "Erneut versuchen",
  "Dataspace": "Datenraum",
  "Find datasets through DCAT metadata and semantic model patterns.": "Datensätze über DCAT-Metadaten und Muster in semantischen Modellen finden.",
  "Refresh status": "Status aktualisieren",
  "Loading search status…": "Suchstatus wird geladen…",
  "Index status": "Indexstatus",
  "Last indexed": "Zuletzt indiziert",
  "datasets": "Datensätze",
  "models": "Modelle",
  "ready": "bereit",
  "partial": "teilweise verfügbar",
  "disabled": "deaktiviert",
  "stale": "veraltet",
  "initializing": "wird aufgebaut",
  "unavailable": "nicht verfügbar",
  "This search uses only the registry of this instance and publicly readable metadata and models. Dataset contents are not imported.": "Diese Suche verwendet ausschließlich die Registry dieser Instanz sowie öffentlich lesbare Metadaten und Modelle. Datensatzinhalte werden nicht importiert.",
  "Search is available once this instance has a current index. Configure the registry and start the indexer if needed.": "Die Suche steht bereit, sobald diese Instanz einen aktuellen Index hat. Bei Bedarf die Registry konfigurieren und den Indexer starten.",
  "sources could not be indexed": "Quellen konnten nicht indiziert werden",
  "Example query": "Beispielabfrage",
  "Choose an example": "Beispiel auswählen",
  "Catalog datasets": "Datensätze im Katalog",
  "Classes in semantic models": "Klassen in semantischen Modellen",
  "Match a model pattern": "Modellmuster finden",
  "SELECT, ASK, CONSTRUCT and DESCRIBE. Use ?dataset for links to catalog details. Examples with ontology IRIs must be adapted to your models.": "SELECT, ASK, CONSTRUCT und DESCRIBE. ?dataset verlinkt auf Katalogdetails. Ontologie-IRIs in Beispielen an die eigenen Modelle anpassen.",
  "Run query": "Abfrage ausführen",
  "Running query…": "Abfrage läuft…",
  "Export results": "Ergebnisse exportieren",
  "Query results": "Abfrageergebnisse",
  "Run a query to see results.": "Eine Abfrage ausführen, um Ergebnisse zu sehen.",
  "No matching results.": "Keine passenden Ergebnisse.",
  "results": "Ergebnisse",
  "Query cancelled or timed out.": "Abfrage abgebrochen oder Zeitlimit erreicht.",
  "Showing the first 1,000 rows. Export includes all returned rows.": "Die ersten 1.000 Zeilen werden angezeigt. Der Export enthält alle zurückgegebenen Zeilen.",
  Language: "Sprache",
  English: "Englisch",
  German: "Deutsch",
  Login: "Anmelden",
  Logout: "Abmelden",
  Save: "Speichern",
  Cancel: "Abbrechen",
  Close: "Schließen",
  Delete: "Löschen",
  Edit: "Bearbeiten",
  Search: "Suchen",
  Download: "Herunterladen",
  "Loading...": "Wird geladen...",
  "Loading your personal catalog workspace …": "Dein persönlicher Katalogbereich wird geladen …",
  "Semantic Data Catalog": "Semantischer Datenkatalog",
  "Some catalog sources could not be loaded. Please try again.": "Einige Katalogquellen konnten nicht geladen werden. Bitte versuche es erneut.",
  "All datasets & dataset series": "Alle Datensätze und Datensatzreihen",
  "Add Dataset": "Datensatz hinzufügen",
  "Private Registry": "Private Registry",
  "Manage private registry members": "Private Registry-Mitglieder verwalten",
  "Add a new dataset": "Neuen Datensatz hinzufügen",
  "Please log in to add datasets": "Bitte melde dich an, um Datensätze hinzuzufügen",
  "Search datasets...": "Datensätze suchen...",
  "Dataset": "Datensatz",
  "Datasets": "Datensätze",
  "Dataset Series": "Datensatzreihe",
  "Title": "Titel",
  "Description": "Beschreibung",
  "Theme": "Thema",
  "Publisher": "Herausgeber",
  "Contact point": "Kontaktstelle",
  "Access URL": "Zugriffs-URL",
  "Semantic model": "Semantisches Modell",
  "File format": "Dateiformat",
  "Public": "Öffentlich",
  "Private": "Privat",
  "Request access": "Zugriff anfragen",
  "Request Dataset": "Datensatz anfragen",
  "Access request sent": "Zugriffsanfrage gesendet",
  "Solid OIDC Login": "Solid-OIDC-Anmeldung",
  "Enter a valid OIDC issuer or Pod URL.": "Gib einen gültigen OIDC-Issuer oder eine Pod-URL ein.",
  "Back to provider list": "Zurück zur Anbieter-Liste",
  "Log in with selected provider": "Mit ausgewähltem Anbieter anmelden",
  "Suggested providers": "Vorgeschlagene Anbieter",
  "Custom issuer": "Eigener Issuer",
  Refresh: "Aktualisieren"
};
Object.assign(enToDe, {
  "Under Construction": "In Arbeit",
  "This section is not yet available.": "Dieser Bereich ist noch nicht verfügbar.",
  "Access Rights": "Zugriffsrechte",
  "Add External Link": "Externen Link hinzufügen",
  "Add Semantic Model File": "Semantische Modelldatei hinzufügen",
  "Browse files": "Dateien durchsuchen",
  "Create Semantic Model": "Semantisches Modell erstellen",
  "Dataset Resource": "Datensatz-Ressource",
  "Drag & drop": "Drag & Drop",
  "External Dataset link": "Externer Datensatzlink",
  "External link": "Externer Link",
  "General Information": "Allgemeine Informationen",
  "Issued Date": "Veröffentlichungsdatum",
  "Only TTL files are allowed.": "Nur TTL-Dateien sind erlaubt.",
  Optional: "Optional",
  "Pod owner": "Pod-Eigentümer",
  Remove: "Entfernen",
  "Remove Semantic Model": "Semantisches Modell entfernen",
  "Remove external link": "Externen Link entfernen",
  Restricted: "Eingeschränkt",
  "Save Dataset": "Datensatz speichern",
  Categories: "Kategorien",
  "Content: Dataset file": "Inhalt: Datensatzdatei",
  "Content: Semantic model": "Inhalt: Semantisches Modell",
  "Content: RDF model": "Inhalt: RDF-Modell",
  "Content: JSON Schema": "Inhalt: JSON Schema",
  "Content: Model, schema or specification": "Inhalt: Modell, Schema oder Spezifikation",
  "Content: Specification / documentation": "Inhalt: Spezifikation / Dokumentation",
  "Model, schema or specification": "Modell, Schema oder Spezifikation",
  "Not specified": "Nicht angegeben",
  "Format:": "Format:",
  "Dataset owner": "Datensatz-Eigentümer",
  "Dataset resource": "Datensatz-Ressource",
  "Detail Dataset": "Datensatzdetails",
  "Download URL": "Download-URL",
  "Files and Sources": "Dateien und Quellen",
  "Format: Turtle/RDF model": "Format: Turtle/RDF-Modell",
  "No RDF triples found.": "Keine RDF-Tripel gefunden.",
  "No members listed.": "Keine Mitglieder gelistet.",
  Open: "Öffnen",
  "Open dataset": "Datensatz öffnen",
  "Request access to this dataset": "Zugriff auf diesen Datensatz anfragen",
  "Semantic Model Visualization": "Visualisierung des semantischen Modells",
  "Current Members": "Aktuelle Mitglieder",
  "Dataset link is required": "Datensatzlink ist erforderlich",
  "Edit Dataset": "Datensatz bearbeiten",
  "Save Changes": "Änderungen speichern",
  Members: "Mitglieder",
  "Restricted (You have access)": "Eingeschränkt (du hast Zugriff)",
  Catalog: "Katalog",
  Data: "Daten",
  "Login with Solid": "Mit Solid anmelden",
  "Not logged in": "Nicht angemeldet",
  Profile: "Profil",
  Semantic: "Semantik",
  "Choose Solid Pod Provider": "Solid-Pod-Anbieter auswählen",
  "Custom Issuer URL": "Eigene Issuer-URL",
  "Please select a provider or enter your own Solid OIDC Issuer:": "Wähle einen Anbieter aus oder gib deinen eigenen Solid-OIDC-Issuer ein:",
  Back: "Zurück",
  Next: "Weiter",
  Finish: "Abschließen",
  Basics: "Basisdaten",
  Email: "E-Mail",
  Name: "Name",
  Organization: "Organisation",
  Role: "Rolle",
  "Add at least one contact email.": "Füge mindestens eine Kontakt-E-Mail hinzu.",
  "Add email": "E-Mail hinzufügen",
  "Catalog URL": "Katalog-URL",
  "Complete these steps to activate your catalog access.": "Schließe diese Schritte ab, um deinen Katalogzugang zu aktivieren.",
  "Configure your Solid inbox, catalog, and private registry so access requests and metadata stay in your pod.": "Richte deine Solid-Inbox, deinen Katalog und deine private Registry ein, damit Zugriffsanfragen und Metadaten in deinem Pod bleiben.",
  "I understand that finishing will create and configure my catalog.": "Ich verstehe, dass beim Abschließen mein Katalog erstellt und konfiguriert wird.",
  "I understand that finishing will create and configure my inbox.": "Ich verstehe, dass beim Abschließen meine Inbox erstellt und konfiguriert wird.",
  "I understand that finishing will create and configure my private registry.": "Ich verstehe, dass beim Abschließen meine private Registry erstellt und konfiguriert wird.",
  "Inbox URL": "Inbox-URL",
  "Inbox, Catalog & Registry": "Inbox, Katalog und Registry",
  "No photo": "Kein Foto",
  "Please provide your profile basics.": "Bitte gib deine grundlegenden Profildaten an."
});
Object.assign(enToDe, {
  "Semantic Model File": "Semantische Modelldatei",
  "Series title is required": "Titel der Reihe ist erforderlich",
  "Upload file": "Datei hochladen",
  "Series Description": "Beschreibung der Reihe",
  "Series Members (Existing Datasets)": "Reihenmitglieder (bestehende Datensätze)",
  "Series Theme (IRI)": "Reihenthema (IRI)",
  "Series Title": "Titel der Reihe",
  "your file here": "deine Datei hier",
  "Welcome to the Semantic Data Catalog": "Willkommen im Semantic Data Catalog",
  "Profile avatar": "Profilavatar",
  "Upload profile photo": "Profilfoto hochladen",
  "Upload profile photo (optional)": "Profilfoto hochladen (optional)",
  "Uploading...": "Wird hochgeladen...",
  "Solid Inbox, Catalog & Registry": "Solid-Inbox, Katalog und Registry",
  "The inbox will be created in a": "Die Inbox wird in einem",
  "The catalog metadata will be created in a": "Die Katalog-Metadaten werden in einem",
  "The registry will always be created in your pod root under": "Die Registry wird immer in deinem Pod Root unter",
  "container in your pod.": "Container in deinem Pod erstellt.",
  Folder: "Ordner",
  "Create Folder": "Ordner erstellen",
  "Folder name": "Ordnername",
  "Folder name is required.": "Ordnername ist erforderlich.",
  "Folder name cannot contain /, \\, #, or ?.": "Ordnernamen dürfen /, \\, # oder ? nicht enthalten.",
  "Loading folders...": "Ordner werden geladen...",
  "New Folder": "Neuer Ordner",
  "No Solid Pod is available.": "Kein Solid-Pod verfügbar.",
  "No subfolders in this folder.": "Keine Unterordner in diesem Ordner.",
  "No matching files in this folder.": "Keine passenden Dateien in diesem Ordner.",
  "Pod root": "Pod Root",
  "Pod Root": "Pod Root",
  "Search files...": "Dateien suchen...",
  "Creating...": "Wird erstellt...",
  "Add WebID": "WebID hinzufügen",
  "Loading registry members...": "Registry-Mitglieder werden geladen...",
  "Members (WebIDs)": "Mitglieder (WebIDs)",
  "No WebIDs added yet.": "Noch keine WebIDs hinzugefügt.",
  "Registry URL": "Registry-URL",
  "Remove WebID": "WebID entfernen",
  "This registry is stored in your pod under": "Diese Registry wird in deinem Pod gespeichert unter",
  "Request Access": "Zugriff anfragen",
  "Request Dataset Access": "Datensatzzugriff anfragen",
  "Required message...": "Erforderliche Nachricht...",
  "To submit a request, please include a short background explaining why you need this dataset.": "Füge für die Anfrage bitte kurz hinzu, warum du diesen Datensatz benötigst.",
  "Your request will be delivered to the owner&apos;s Solid inbox and handled in the Solid Dataspace Manager.": "Deine Anfrage wird an die Solid-Inbox des Eigentümers zugestellt und im Solid Dataspace Manager bearbeitet.",
  "Your request will be delivered to the owner's Solid inbox and handled in the Solid Dataspace Manager.": "Deine Anfrage wird an die Solid-Inbox des Eigentümers zugestellt und im Solid Dataspace Manager bearbeitet."
});
Object.assign(enToDe, {
  Feedback: "Feedback",
  "Give feedback": "Feedback geben",
  "Feedback completed": "Feedback abgeschlossen",
  "Close feedback survey": "Feedback-Befragung schließen",
  "User survey": "Nutzerbefragung",
  "Your feedback": "Dein Feedback",
  "How understandable is the system?": "Wie verständlich ist das System?",
  "How easy is it to find relevant datasets?": "Wie einfach lassen sich relevante Datensätze finden?",
  "Step 1 of 2": "Schritt 1 von 2",
  "Step 2 of 2": "Schritt 2 von 2",
  "Choose the answer that best matches your experience.": "Wähle die Antwort, die deiner Erfahrung am besten entspricht.",
  "Your first answer has already been saved separately.": "Deine erste Antwort wurde bereits separat gespeichert.",
  "Very poor": "Sehr schlecht",
  Poor: "Schlecht",
  Neutral: "Neutral",
  Good: "Gut",
  "Very good": "Sehr gut",
  "Please select a rating.": "Bitte wähle eine Bewertung aus.",
  "Feedback could not be saved. Please try again.": "Das Feedback konnte nicht gespeichert werden. Bitte versuche es erneut.",
  "Saving...": "Wird gespeichert...",
  "Try again": "Erneut versuchen",
  Submit: "Absenden",
  "Thank you for your feedback!": "Vielen Dank für dein Feedback!",
  "Both answers were saved and evaluated separately.": "Beide Antworten wurden separat gespeichert und werden getrennt ausgewertet."
});
var deToEn = Object.entries(enToDe).reduce((acc, _ref) => {
  var [en, de] = _ref;
  acc[de] = en;
  return acc;
}, {});
function withOriginalWhitespace(original, translated) {
  var _original$match, _original$match2;
  var leading = ((_original$match = original.match(/^\s*/)) === null || _original$match === void 0 ? void 0 : _original$match[0]) || "";
  var trailing = ((_original$match2 = original.match(/\s*$/)) === null || _original$match2 === void 0 ? void 0 : _original$match2[0]) || "";
  return "".concat(leading).concat(translated).concat(trailing);
}
function normalizeLanguage(value) {
  var normalized = String(value || "").trim().toLowerCase();
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("en")) return "en";
  return DEFAULT_LANGUAGE;
}
function getLanguageFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    var params = new URLSearchParams(window.location.search);
    var value = params.get("lang") || params.get("language");
    return value ? normalizeLanguage(value) : "";
  } catch (_unused) {
    return "";
  }
}
function getLanguageFromHostBridge() {
  if (typeof window === "undefined" || window.parent === window) return "";
  try {
    var _window$parent$__SOLI, _window$parent$__SOLI2;
    if (window.parent.location.origin !== window.location.origin) return "";
    var value = (_window$parent$__SOLI = window.parent.__SOLID_DATASPACE_AUTH__) === null || _window$parent$__SOLI === void 0 || (_window$parent$__SOLI2 = _window$parent$__SOLI.getLanguage) === null || _window$parent$__SOLI2 === void 0 ? void 0 : _window$parent$__SOLI2.call(_window$parent$__SOLI);
    return value ? normalizeLanguage(value) : "";
  } catch (_unused2) {
    return "";
  }
}
function readStoredLanguage() {
  if (typeof window === "undefined") return "";
  try {
    var value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return value ? normalizeLanguage(value) : "";
  } catch (_unused3) {
    return "";
  }
}
function writeStoredLanguage(language) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
  } catch (_unused4) {
    // Ignore storage failures.
  }
}
function resolveInitialLanguage() {
  return getLanguageFromUrl() || getLanguageFromHostBridge() || readStoredLanguage() || DEFAULT_LANGUAGE;
}
function translateText(value, language) {
  if (typeof value !== "string" || !value.trim()) return value;
  var body = value.trim();
  var target = normalizeLanguage(language);
  if (target === "de") {
    return Object.prototype.hasOwnProperty.call(enToDe, body) ? withOriginalWhitespace(value, enToDe[body]) : value;
  }
  return Object.prototype.hasOwnProperty.call(deToEn, body) ? withOriginalWhitespace(value, deToEn[body]) : value;
}
function translateNode(node, language) {
  // User data and code are not UI copy. Respect the HTML translation boundary
  // across embedded apps as well as in the standalone document.
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate
  var element = (node === null || node === void 0 ? void 0 : node.nodeType) === Node.ELEMENT_NODE ? node : node === null || node === void 0 ? void 0 : node.parentElement;
  if (element !== null && element !== void 0 && element.closest('[translate="no"], .notranslate, [data-i18n-skip], [contenteditable]:not([contenteditable="false"])')) return;
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    var next = translateText(node.nodeValue || "", language);
    if (next !== node.nodeValue) node.nodeValue = next;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"].includes(node.tagName)) {
    return;
  }
  ["title", "placeholder", "aria-label", "alt"].forEach(name => {
    var _node$hasAttribute;
    if (!((_node$hasAttribute = node.hasAttribute) !== null && _node$hasAttribute !== void 0 && _node$hasAttribute.call(node, name))) return;
    var current = node.getAttribute(name);
    var next = translateText(current, language);
    if (next !== current) node.setAttribute(name, next);
  });
  node.childNodes.forEach(child => translateNode(child, language));
}
function applyDocumentTranslations(language, root) {
  if (typeof document === "undefined") return;
  var targetRoot = document.body;
  if (!targetRoot) return;
  document.documentElement.lang = normalizeLanguage(language);
  translateNode(targetRoot, language);
}
function installDomTranslator(getLanguage) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }
  var scheduled = false;
  var run = () => {
    scheduled = false;
    applyDocumentTranslations(getLanguage());
  };
  var schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  };
  var observer = new MutationObserver(schedule);
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "placeholder", "aria-label", "alt"]
    });
    schedule();
  }
  return () => observer.disconnect();
}
function publishLanguage(language) {
  if (typeof window === "undefined") return;
  var normalized = normalizeLanguage(language);
  writeStoredLanguage(normalized);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, {
    detail: {
      language: normalized
    }
  }));
  try {
    var _window$parent;
    (_window$parent = window.parent) === null || _window$parent === void 0 || _window$parent.postMessage({
      type: LANGUAGE_MESSAGE_TYPE,
      language: normalized
    }, "*");
  } catch (_unused5) {
    // Ignore cross-window failures.
  }
  try {
    var _window$parent2, _window$parent2$setLa;
    (_window$parent2 = window.parent) === null || _window$parent2 === void 0 || (_window$parent2 = _window$parent2.__SOLID_DATASPACE_AUTH__) === null || _window$parent2 === void 0 || (_window$parent2$setLa = _window$parent2.setLanguage) === null || _window$parent2$setLa === void 0 || _window$parent2$setLa.call(_window$parent2, normalized);
  } catch (_unused6) {
    // Ignore bridge failures.
  }
}
function subscribeLanguage(callback) {
  if (typeof window === "undefined") return () => {};
  var handleEvent = event => {
    var _event$detail;
    return callback(normalizeLanguage(event === null || event === void 0 || (_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.language));
  };
  var handleStorage = event => {
    if (event.key === LANGUAGE_STORAGE_KEY && event.newValue) {
      callback(normalizeLanguage(event.newValue));
    }
  };
  var handleMessage = event => {
    var data = event.data || {};
    if (data.type === LANGUAGE_MESSAGE_TYPE && data.language) {
      callback(normalizeLanguage(data.language));
    }
  };
  var unsubscribeBridge;
  try {
    var _window$parent3, _window$parent3$subsc;
    unsubscribeBridge = (_window$parent3 = window.parent) === null || _window$parent3 === void 0 || (_window$parent3 = _window$parent3.__SOLID_DATASPACE_AUTH__) === null || _window$parent3 === void 0 || (_window$parent3$subsc = _window$parent3.subscribeLanguage) === null || _window$parent3$subsc === void 0 ? void 0 : _window$parent3$subsc.call(_window$parent3, callback);
  } catch (_unused7) {
    unsubscribeBridge = undefined;
  }
  window.addEventListener(LANGUAGE_EVENT, handleEvent);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("message", handleMessage);
  return () => {
    var _unsubscribeBridge;
    window.removeEventListener(LANGUAGE_EVENT, handleEvent);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("message", handleMessage);
    (_unsubscribeBridge = unsubscribeBridge) === null || _unsubscribeBridge === void 0 || _unsubscribeBridge();
  };
}
var I18nContext = /*#__PURE__*/createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: value => value
});
function I18nProvider(_ref2) {
  var {
    children,
    language: controlledLanguage
  } = _ref2;
  var [internalLanguage, setInternalLanguage] = useState(resolveInitialLanguage);
  var language = normalizeLanguage(controlledLanguage || internalLanguage);
  var languageRef = useRef(language);
  languageRef.current = language;
  var setLanguage = useCallback(nextLanguage => {
    var normalized = normalizeLanguage(nextLanguage);
    if (!controlledLanguage) setInternalLanguage(normalized);
    publishLanguage(normalized);
  }, [controlledLanguage]);
  useEffect(() => {
    applyDocumentTranslations(language);
  }, [language]);
  useEffect(() => installDomTranslator(() => languageRef.current), []);
  useEffect(() => subscribeLanguage(nextLanguage => {
    if (nextLanguage === languageRef.current) return;
    if (!controlledLanguage) setInternalLanguage(nextLanguage);
  }), [controlledLanguage]);
  var value = useMemo(() => ({
    language,
    setLanguage,
    t: key => translateText(key, language)
  }), [language, setLanguage]);
  return /*#__PURE__*/React.createElement(I18nContext.Provider, {
    value
  }, children);
}
function useI18n() {
  return useContext(I18nContext);
}
function LanguageSelect() {
  var {
    className = "",
    compact = false,
    label = ""
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var {
    language,
    setLanguage,
    t
  } = useI18n();
  return /*#__PURE__*/React.createElement("label", {
    className: "language-select ".concat(className).trim()
  }, !compact && /*#__PURE__*/React.createElement("span", {
    className: "language-select__label"
  }, label || t("Language")), /*#__PURE__*/React.createElement("select", {
    value: language,
    onChange: event => setLanguage(event.target.value),
    "aria-label": t("Language"),
    title: t("Language")
  }, /*#__PURE__*/React.createElement("option", {
    value: "en"
  }, language === "de" ? "Englisch" : "English"), /*#__PURE__*/React.createElement("option", {
    value: "de"
  }, "Deutsch")));
}

// Presentation-only queries over the already loaded catalog. Never fetch sources here.
var normalizeSearch = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/ß/g, "ss");
var datasetKey = dataset => dataset.datasetUrl || dataset.identifier;
var datasetThemes = dataset => String(dataset.theme || "").split(/[,;|]/).map(value => value.trim()).filter(Boolean);
function themeLabel(value) {
  try {
    var url = new URL(value);
    return decodeURIComponent(url.hash.slice(1) || url.pathname.split("/").filter(Boolean).pop() || value);
  } catch (_unused) {
    return value;
  }
}
function accessState(dataset) {
  if (dataset.datasetType === "series") return "series";
  if (dataset.is_public) return "public";
  return dataset.userHasAccess ? "available" : "restricted";
}
function selectCatalogDatasets(datasets) {
  var {
    query = "",
    theme = "",
    publisher = "",
    type = "",
    access = "",
    pod = "",
    sort = "relevance"
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  var result = [];
  datasets.forEach((dataset, index) => {
    if (theme && !datasetThemes(dataset).includes(theme)) return;
    if (publisher && dataset.publisher !== publisher) return;
    if (pod && !datasetPodRoots(dataset).includes(pod)) return;
    if (type && (dataset.datasetType || "dataset") !== type) return;
    if (access && accessState(dataset) !== access) return;
    var fields = [dataset.title, dataset.identifier, dataset.theme, dataset.publisher, dataset.description, dataset.file_format].map(normalizeSearch);
    if (!words.every(word => fields.some(field => field.includes(word)))) return;
    var score = words.reduce((total, word) => total + fields.reduce((sum, field, i) => sum + (field.includes(word) ? [10, 6, 4, 3, 1, 1][i] : 0), 0), 0);
    result.push({
      dataset,
      index,
      score
    });
  });
  var timestamp = value => Date.parse(value) || 0;
  result.sort((a, b) => {
    if (sort === "modified") return timestamp(b.dataset.modified) - timestamp(a.dataset.modified) || a.index - b.index;
    if (sort === "title") return String(a.dataset.title || "").localeCompare(String(b.dataset.title || "")) || a.index - b.index;
    return b.score - a.score || a.index - b.index;
  });
  return result.map(_ref => {
    var {
      dataset
    } = _ref;
    return dataset;
  });
}

// Preserve original text, including accents, while finding normalized matches.
function highlightParts(value, query) {
  var text = String(value || "");
  var words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [{
    text,
    match: false
  }];
  var normalized = "";
  var positions = [];
  var offset = 0;
  for (var character of text) {
    var normalizedCharacter = normalizeSearch(character);
    for (var i = 0; i < normalizedCharacter.length; i++) positions.push([offset, offset + character.length]);
    normalized += normalizedCharacter;
    offset += character.length;
  }
  var marked = new Array(text.length).fill(false);
  words.forEach(word => {
    var start = normalized.indexOf(word);
    while (start !== -1) {
      var _positions;
      var end = (_positions = positions[start + word.length - 1]) === null || _positions === void 0 ? void 0 : _positions[1];
      for (var _i = (_positions$start = positions[start]) === null || _positions$start === void 0 ? void 0 : _positions$start[0]; _i < end; _i++) {
        var _positions$start;
        marked[_i] = true;
      }
      start = normalized.indexOf(word, start + word.length);
    }
  });
  var parts = [];
  for (var _i2 = 0; _i2 < text.length; _i2++) {
    if (!parts.length || parts[parts.length - 1].match !== marked[_i2]) parts.push({
      text: "",
      match: marked[_i2]
    });
    parts[parts.length - 1].text += text[_i2];
  }
  return parts;
}

// Use confirmed storage/catalog provenance, never the creator WebID.
function catalogPodOptions(datasets) {
  var pods = [...new Set(datasets.flatMap(datasetPodRoots))].map(value => ({
    value,
    label: podNameFromRoot(value)
  })).filter(_ref2 => {
    var {
      label
    } = _ref2;
    return label;
  });
  var counts = new Map();
  pods.forEach(_ref3 => {
    var {
      label
    } = _ref3;
    return counts.set(label, (counts.get(label) || 0) + 1);
  });
  return pods.map(_ref4 => {
    var {
      value,
      label
    } = _ref4;
    return {
      value,
      label: counts.get(label) > 1 ? "".concat(label, " (").concat(new URL(value).host, ")") : label
    };
  }).sort((a, b) => a.label.localeCompare(b.label) || a.value.localeCompare(b.value));
}

function CatalogModal(_ref) {
  var {
    className = "",
    label,
    suspended = false,
    onClose,
    children
  } = _ref;
  var dialogRef = useRef(null);
  useEffect(() => {
    var dialog = dialogRef.current;
    if (suspended) return undefined;
    var trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger !== null && trigger !== void 0 && trigger.isConnected && !dialog.contains(trigger)) trigger.focus({
        preventScroll: true
      });
    };
  }, [suspended]);
  return /*#__PURE__*/React.createElement("dialog", {
    ref: dialogRef,
    className: "catalog-modal ".concat(className),
    "aria-label": label,
    "aria-modal": "true",
    onCancel: event => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    },
    onClick: event => {
      if (event.target === event.currentTarget) onClose();
    }
  }, children);
}

function CatalogDetailSurface(_ref) {
  var {
    label,
    suspended,
    onClose,
    returnFocusRef,
    children
  } = _ref;
  var {
    t
  } = useI18n();
  var closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    var url = window.location.href;
    var onPopState = () => {
      var _window$history$state;
      if (((_window$history$state = window.history.state) === null || _window$history$state === void 0 ? void 0 : _window$history$state.catalogDetail) !== url) closeRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      var focusTarget = returnFocusRef.current;
      if (focusTarget !== null && focusTarget !== void 0 && focusTarget.isConnected) focusTarget.focus({
        preventScroll: true
      });
    };
  }, [returnFocusRef]);
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-detail-dialog",
    label: label || t("Detail Dataset"),
    suspended: suspended,
    onClose: onClose
  }, children);
}

var _excluded = ["icon"];
var CatalogIcon = _ref => {
  var {
      icon
    } = _ref,
    props = _objectWithoutProperties$1(_ref, _excluded);
  return /*#__PURE__*/React.createElement(FontAwesomeIcon, _extends({
    icon: icon,
    "aria-hidden": "true"
  }, props));
};
function Highlight(_ref2) {
  var {
    value,
    query
  } = _ref2;
  return /*#__PURE__*/React.createElement("span", {
    translate: "no"
  }, highlightParts(value, query).map((part, index) => part.match ? /*#__PURE__*/React.createElement("mark", {
    key: index
  }, part.text) : /*#__PURE__*/React.createElement(React.Fragment, {
    key: index
  }, part.text)));
}
var accessLabels = {
  public: "Public",
  available: "Access granted",
  restricted: "Restricted",
  series: "Dataset Series"
};
var accessIcons = {
  public: faGlobe,
  available: faLockOpen,
  restricted: faLock,
  series: faLayerGroup
};
function CatalogWorkspace(_ref3) {
  var {
    datasets,
    selectedDataset,
    onSelect,
    onCloseDetail,
    detail,
    detailSuspended = false,
    actions,
    onSemanticSearch
  } = _ref3;
  var {
    t,
    language
  } = useI18n();
  var [query, setQuery] = useState("");
  var [debouncedQuery, setDebouncedQuery] = useState("");
  var [filters, setFilters] = useState({
    theme: "",
    publisher: "",
    type: "",
    access: "",
    pod: ""
  });
  var [sort, setSort] = useState("relevance");
  var [page, setPage] = useState(0);
  var [pageSize, setPageSize] = useState(10);
  var [filtersOpen, setFiltersOpen] = useState(false);
  var listRef = useRef(null);
  var searchRef = useRef(null);
  var selectedButton = useRef(null);
  var filterId = useId();
  var searchId = useId();
  useEffect(() => {
    var timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);
  var pods = useMemo(() => catalogPodOptions(datasets), [datasets]);
  var options = useMemo(() => ({
    theme: [...new Set(datasets.flatMap(datasetThemes))].sort((a, b) => themeLabel(a).localeCompare(themeLabel(b))),
    publisher: [...new Set(datasets.map(item => item.publisher).filter(Boolean))].sort(),
    type: ["dataset", "series", "service"],
    access: ["public", "available", "restricted"],
    pod: pods.map(_ref4 => {
      var {
        value
      } = _ref4;
      return value;
    })
  }), [datasets, pods]);
  var results = useMemo(() => selectCatalogDatasets(datasets, _objectSpread2$2(_objectSpread2$2({
    query: debouncedQuery
  }, filters), {}, {
    sort
  })), [datasets, debouncedQuery, filters, sort]);
  var activeFilters = Object.entries(filters).filter(_ref5 => {
    var [, value] = _ref5;
    return value;
  });
  var pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  var visiblePage = Math.min(page, pageCount - 1);
  var visible = results.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  var labels = {
    theme: "Theme",
    publisher: "Publisher",
    type: "Type",
    access: "Access Rights",
    pod: "Pod"
  };
  var labelFor = (key, value) => {
    var _pods$find;
    return key === "theme" ? themeLabel(value) : key === "pod" ? ((_pods$find = pods.find(option => option.value === value)) === null || _pods$find === void 0 ? void 0 : _pods$find.label) || podNameFromRoot(value) : key === "type" ? t(value === "service" ? "API" : value === "series" ? "Dataset Series" : "Dataset") : key === "access" ? t(accessLabels[value]) : value;
  };
  var changeFilter = (key, value) => {
    setFilters(previous => _objectSpread2$2(_objectSpread2$2({}, previous), {}, {
      [key]: value
    }));
    setPage(0);
  };
  var reset = () => {
    setQuery("");
    setDebouncedQuery("");
    setFilters({
      theme: "",
      publisher: "",
      type: "",
      access: "",
      pod: ""
    });
    setPage(0);
  };
  var changePage = nextPage => {
    var _listRef$current, _listRef$current$scro;
    setPage(nextPage);
    (_listRef$current = listRef.current) === null || _listRef$current === void 0 || (_listRef$current$scro = _listRef$current.scrollIntoView) === null || _listRef$current$scro === void 0 || _listRef$current$scro.call(_listRef$current, {
      block: "start"
    });
  };
  var formatDate = value => {
    if (!value || Number.isNaN(Date.parse(value))) return t("Date not provided");
    return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "catalog-workspace",
    "aria-label": t("Catalog")
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-workspace-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-browse",
    translate: "no"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-search-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-search-field",
    role: "search"
  }, /*#__PURE__*/React.createElement("label", {
    className: "catalog-sr-only",
    htmlFor: searchId
  }, t("Search datasets...")), /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faSearch
  }), /*#__PURE__*/React.createElement("input", {
    id: searchId,
    ref: searchRef,
    type: "search",
    value: query,
    placeholder: t("Search datasets..."),
    autoComplete: "off",
    onChange: event => setQuery(event.target.value)
  }), query && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-icon-button",
    "aria-label": t("Clear search"),
    onClick: () => {
      var _searchRef$current;
      setQuery("");
      setDebouncedQuery("");
      setPage(0);
      (_searchRef$current = searchRef.current) === null || _searchRef$current === void 0 || _searchRef$current.focus();
    }
  }, /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faXmark
  }))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-tools"
  }, typeof actions === "function" ? actions(t) : actions), onSemanticSearch && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-semantic-link",
    "aria-haspopup": "dialog",
    onClick: onSemanticSearch
  }, t("Semantic Search"), /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faSearch
  }))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-filter-toggle-row"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-button catalog-button--quiet",
    "aria-controls": filterId,
    "aria-expanded": filtersOpen,
    onClick: () => setFiltersOpen(!filtersOpen)
  }, /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faSliders
  }), t("Filters"), activeFilters.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "catalog-filter-count"
  }, activeFilters.length))), /*#__PURE__*/React.createElement("div", {
    id: filterId,
    className: "catalog-filters".concat(filtersOpen ? " is-open" : "")
  }, Object.entries(labels).map(_ref6 => {
    var [key, label] = _ref6;
    return /*#__PURE__*/React.createElement("label", {
      key: key,
      className: "catalog-filter--".concat(key)
    }, /*#__PURE__*/React.createElement("span", null, t(label)), /*#__PURE__*/React.createElement("select", {
      value: filters[key],
      onChange: event => changeFilter(key, event.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, t("All")), options[key].map(value => /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, labelFor(key, value)))));
  })), activeFilters.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "catalog-active-filters",
    "aria-label": t("Active filters")
  }, activeFilters.map(_ref7 => {
    var [key, value] = _ref7;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "catalog-filter-chip",
      key: key,
      "aria-label": "".concat(t("Remove filter"), ": ").concat(t(labels[key]), ": ").concat(labelFor(key, value)),
      onClick: () => changeFilter(key, "")
    }, /*#__PURE__*/React.createElement("span", null, t(labels[key]), ": ", labelFor(key, value)), /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: faXmark
    }));
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-text-button",
    onClick: reset
  }, t("Reset all"))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-results-toolbar"
  }, /*#__PURE__*/React.createElement("p", {
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true"
  }, /*#__PURE__*/React.createElement("strong", null, results.length), " ", t("results"), " ", /*#__PURE__*/React.createElement("span", {
    className: "catalog-results-total"
  }, "/ ", datasets.length)), /*#__PURE__*/React.createElement("label", {
    className: "catalog-sort"
  }, /*#__PURE__*/React.createElement("span", null, t("Sort by")), /*#__PURE__*/React.createElement("select", {
    value: sort,
    onChange: event => {
      setSort(event.target.value);
      setPage(0);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "relevance"
  }, t("Relevance")), /*#__PURE__*/React.createElement("option", {
    value: "modified"
  }, t("Recently updated")), /*#__PURE__*/React.createElement("option", {
    value: "title"
  }, t("Title A–Z"))))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-results",
    ref: listRef
  }, visible.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "catalog-card-list",
    "aria-label": t("Datasets")
  }, visible.map(dataset => {
    var key = datasetKey(dataset);
    var selected = Boolean(selectedDataset && datasetKey(selectedDataset) === key);
    var access = accessState(dataset);
    var isSeries = dataset.datasetType === "series";
    var themes = datasetThemes(dataset);
    var podName = datasetPodNames(dataset);
    return /*#__PURE__*/React.createElement("li", {
      key: key
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "catalog-card".concat(selected ? " is-selected" : "").concat(dataset.isStale ? " is-stale" : ""),
      "aria-pressed": selected,
      onClick: event => {
        selectedButton.current = event.currentTarget;
        onSelect(dataset);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "catalog-symbol".concat(isSeries ? " catalog-symbol--series" : "")
    }, /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: dataset.datasetType === "service" ? faCode : isSeries ? faLayerGroup : faDatabase
    })), /*#__PURE__*/React.createElement("span", {
      className: "catalog-card-main"
    }, /*#__PURE__*/React.createElement("span", {
      className: "catalog-card-title"
    }, /*#__PURE__*/React.createElement(Highlight, {
      value: dataset.title || t("Untitled dataset"),
      query: debouncedQuery
    })), /*#__PURE__*/React.createElement("span", {
      className: "catalog-card-description"
    }, /*#__PURE__*/React.createElement(Highlight, {
      value: dataset.description || t("No description provided."),
      query: debouncedQuery
    })), /*#__PURE__*/React.createElement("span", {
      className: "catalog-tags"
    }, dataset.datasetType === "service" && /*#__PURE__*/React.createElement("span", {
      className: "catalog-tag"
    }, "API"), themes.slice(0, 3).map(theme => /*#__PURE__*/React.createElement("span", {
      className: "catalog-tag",
      key: theme
    }, themeLabel(theme))), themes.length > 3 && /*#__PURE__*/React.createElement("span", {
      className: "catalog-tag"
    }, "+", themes.length - 3), isSeries && /*#__PURE__*/React.createElement("span", {
      className: "catalog-tag"
    }, (dataset.seriesMembers || []).length, " ", t("Members")), !isSeries && dataset.file_format && /*#__PURE__*/React.createElement("span", {
      className: "catalog-format"
    }, dataset.file_format))), /*#__PURE__*/React.createElement("span", {
      className: "catalog-card-meta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "catalog-access catalog-access--".concat(access)
    }, /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: accessIcons[access]
    }), t(accessLabels[access])), /*#__PURE__*/React.createElement("span", {
      className: "catalog-meta-line"
    }, /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: faUser
    }), /*#__PURE__*/React.createElement("span", {
      title: dataset.publisher
    }, dataset.publisher || t("Publisher not provided"))), podName && /*#__PURE__*/React.createElement("span", {
      className: "catalog-meta-line catalog-pod-name"
    }, /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: faFolder
    }), /*#__PURE__*/React.createElement("span", {
      title: podName
    }, podName)), /*#__PURE__*/React.createElement("span", {
      className: "catalog-meta-line"
    }, /*#__PURE__*/React.createElement(CatalogIcon, {
      icon: faClock
    }), formatDate(dataset.modified || dataset.issued)), dataset.isStale && /*#__PURE__*/React.createElement("span", {
      className: "catalog-stale-label"
    }, t("Source needs refreshing")))));
  })) : /*#__PURE__*/React.createElement("div", {
    className: "catalog-empty"
  }, /*#__PURE__*/React.createElement("span", {
    className: "catalog-symbol"
  }, /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faSearch
  })), /*#__PURE__*/React.createElement("h2", null, t(datasets.length ? "No matching datasets" : "Your catalog is ready to grow")), /*#__PURE__*/React.createElement("p", null, t(datasets.length ? "Try another search or adjust your filters." : "Datasets from your selected registries will appear here.")), query && /*#__PURE__*/React.createElement("p", {
    className: "catalog-empty-query"
  }, "\u201C", query, "\u201D"), (query || activeFilters.length > 0) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-button",
    onClick: reset
  }, t("Reset all")))), /*#__PURE__*/React.createElement("nav", {
    className: "catalog-pagination",
    "aria-label": t("Result pages")
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", null, t("Per page")), /*#__PURE__*/React.createElement("select", {
    value: pageSize,
    onChange: event => {
      setPageSize(Number(event.target.value));
      setPage(0);
    }
  }, [10, 25, 50].map(size => /*#__PURE__*/React.createElement("option", {
    key: size
  }, size)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-icon-button",
    "aria-label": t("Previous page"),
    disabled: visiblePage === 0,
    onClick: () => changePage(visiblePage - 1)
  }, /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faChevronLeft
  })), /*#__PURE__*/React.createElement("span", null, visiblePage + 1, " / ", pageCount), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-icon-button",
    "aria-label": t("Next page"),
    disabled: visiblePage >= pageCount - 1,
    onClick: () => changePage(visiblePage + 1)
  }, /*#__PURE__*/React.createElement(CatalogIcon, {
    icon: faChevronRight
  }))))), detail && /*#__PURE__*/React.createElement(CatalogDetailSurface, {
    label: (selectedDataset === null || selectedDataset === void 0 ? void 0 : selectedDataset.datasetType) === "service" ? t("API details") : undefined,
    suspended: detailSuspended,
    onClose: onCloseDetail,
    returnFocusRef: selectedButton
  }, detail)));
}

var STORAGE_PREFIX$1 = "semantic-data-catalog:";
var storageKey = key => "".concat(STORAGE_PREFIX$1).concat(key);

// Simple IStorage wrapper backed by the browser's sessionStorage so that
// authentication data is kept only for the lifetime of the tab.
var sessionStorageWrapper = {
  get: function () {
    var _get = _asyncToGenerator(function* (key) {
      var _window$sessionStorag;
      return typeof window === "undefined" ? undefined : (_window$sessionStorag = window.sessionStorage.getItem(storageKey(key))) !== null && _window$sessionStorag !== void 0 ? _window$sessionStorag : undefined;
    });
    function get(_x) {
      return _get.apply(this, arguments);
    }
    return get;
  }(),
  set: function () {
    var _set = _asyncToGenerator(function* (key, value) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey(key), value);
      }
    });
    function set(_x2, _x3) {
      return _set.apply(this, arguments);
    }
    return set;
  }(),
  delete: function () {
    var _delete2 = _asyncToGenerator(function* (key) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(storageKey(key));
      }
    });
    function _delete(_x4) {
      return _delete2.apply(this, arguments);
    }
    return _delete;
  }()
};

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in localStorage.
var session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: "semantic-data-catalog",
  // Store session state in sessionStorage rather than localStorage
  secureStorage: sessionStorageWrapper,
  insecureStorage: sessionStorageWrapper
});
function setSession(nextSession) {
  if (!nextSession) return;
  session = nextSession;
}

var DATA_SERVICE = 'http://www.w3.org/ns/dcat#DataService';
var SERVICE_LINK = 'http://www.w3.org/ns/dcat#service';
var SERVICE_PROFILE = 'https://github.com/hoelk-f/semantic-data-catalog/blob/main/docs/data-service-profile-v1.md';
var SERVICE_AUTH = 'https://w3id.org/solid-dataspace/catalog-api#authentication';
var AUTH_MODES = ['public', 'api-key', 'oauth2', 'solid-oidc'];

// Descriptions are public metadata, never a credential store.
function safeServiceUrl(value) {
  var {
    fragment = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  try {
    var url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !fragment && url.hash) return '';
    if ([...url.searchParams.keys()].some(key => /(?:^|[-_])(token|key|secret|password|signature|authorization)(?:$|[-_])/i.test(key) || /^(apikey|accesskey|auth)$/i.test(key))) return '';
    return url.href;
  } catch (_unused) {
    return '';
  }
}
function normalizeServiceInput(input) {
  var title = String(input.title || '').trim(),
    description = String(input.description || '').trim(),
    publisher = String(input.publisher || '').trim();
  if (!title || title.length > 200 || !description || description.length > 5000 || !publisher || publisher.length > 200) throw new Error('Provide a title, description and publisher.');
  var endpointURL = safeServiceUrl(input.endpointURL);
  if (!endpointURL) throw new Error('Use an HTTPS endpoint without credentials or secret query parameters.');
  var endpointDescription = input.endpointDescription ? safeServiceUrl(input.endpointDescription, {
    fragment: true
  }) : '';
  if (input.endpointDescription && !endpointDescription) throw new Error('Use an HTTPS documentation URL without credentials.');
  var authentication = input.authentication || 'public';
  if (!AUTH_MODES.includes(authentication)) throw new Error('Unsupported authentication method.');
  var servesDataset = input.servesDataset || [];
  if (!Array.isArray(servesDataset) || servesDataset.length > 64 || servesDataset.some(u => !safeServiceUrl(u, {
    fragment: true
  }))) throw new Error('Linked datasets must have HTTPS metadata identifiers.');
  return _objectSpread2$2(_objectSpread2$2({}, input), {}, {
    title,
    description,
    publisher,
    endpointURL,
    endpointDescription,
    authentication,
    servesDataset: [...new Set(servesDataset)]
  });
}
function validateServiceRecord(store, url, topic) {
  var DCAT = 'http://www.w3.org/ns/dcat#',
    DCT = 'http://purl.org/dc/terms/',
    TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  var values = (s, p) => store.getObjects(s, p, null);
  var one = function one(p) {
    var optional = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var v = values(topic, p);
    if (optional && !v.length) return '';
    if (v.length !== 1) throw new Error('API properties must have exactly one value.');
    return v[0].value;
  };
  if (!values(url, DCT + 'conformsTo').some(t => t.termType === 'NamedNode' && t.value === SERVICE_PROFILE)) throw new Error('API records must declare the versioned Data Service profile.');
  if (store.getSubjects(TYPE, DATA_SERVICE, null).length !== 1 || store.getSubjects(TYPE, DCAT + 'Dataset', null).length || store.getSubjects(TYPE, DCAT + 'DatasetSeries', null).length) throw new Error('An API record describes exactly one DataService.');
  for (var p of [DCAT + 'endpointURL', DCAT + 'endpointDescription', DCAT + 'servesDataset']) if (values(topic, p).some(t => t.termType !== 'NamedNode')) throw new Error('API links must be IRIs.');
  normalizeServiceInput({
    title: one(DCT + 'title'),
    description: one(DCT + 'description'),
    publisher: one(DCT + 'publisher'),
    endpointURL: one(DCAT + 'endpointURL'),
    endpointDescription: one(DCAT + 'endpointDescription', true),
    authentication: one(SERVICE_AUTH),
    servesDataset: values(topic, DCAT + 'servesDataset').map(t => t.value)
  });
  if (store.getSubjects(TYPE, DCAT + 'Distribution', null).length || values(topic, DCAT + 'distribution').length) throw new Error('Data services link datasets through servesDataset.');
  return {
    store,
    topic,
    dependencies: []
  };
}

// Normative MUST rules in SolidDCAT-Profile/index.html. This runs in the
// standalone app, embedded catalog and catalog-api package, without an API
// dependency. Reading legacy catalogs deliberately does not use this guard.
var DCAT = "http://www.w3.org/ns/dcat#";
var DCT = "http://purl.org/dc/terms/";
var TYPE$1 = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var TOPIC = "http://xmlns.com/foaf/0.1/primaryTopic";
var documentUrl$1 = url => url.split("#")[0];
var objects = (store, subject, predicate) => store.getObjects(subject, predicate, null);
var typed = (store, subject, type) => store.countQuads(subject, TYPE$1, type, null) > 0;
var dataset = (store, subject) => typed(store, subject, DCAT + "Dataset") || typed(store, subject, DCAT + "DatasetSeries");
var iri$1 = value => (value === null || value === void 0 ? void 0 : value.termType) === "NamedNode" && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value.value) && !/[<>"{}|^`\\\s]/.test(value.value);
var local = (value, url) => iri$1(value) && value.value.startsWith(url + "#") && value.value.length > url.length + 1;
var unique = terms => [...new Map(terms.map(term => [term.id, term])).values()];
class ProfileValidationError extends Error {
  constructor(message) {
    super("Solid DCAT Profile: ".concat(message));
    this.name = "ProfileValidationError";
    this.code = "profile-nonconformant";
  }
}
var requireRule = (condition, message) => {
  if (!condition) throw new ProfileValidationError(message);
};
function parseRecord(url, turtle) {
  requireRule(typeof turtle === "string", "Metadata must be supplied as Turtle.");
  var store;
  try {
    store = new Store(new Parser$1({
      baseIRI: url,
      format: "Turtle"
    }).parse(turtle));
  } catch (_unused) {
    throw new ProfileValidationError("Invalid Turtle metadata: ".concat(url));
  }
  requireRule(store.size <= 200000, "Metadata validation exceeds 200000 triples.");
  requireRule(typed(store, url, DCAT + "CatalogRecord"), "The document must be a CatalogRecord: ".concat(url));
  var records = store.getSubjects(TYPE$1, DCAT + "CatalogRecord", null);
  requireRule(records.length === 1 && records[0].value === url, "A CatalogRecord must identify its own document without a fragment.");
  var topics = objects(store, url, TOPIC);
  requireRule(topics.length === 1 && local(topics[0], url) && (dataset(store, topics[0]) || typed(store, topics[0], DATA_SERVICE)), "foaf:primaryTopic must identify exactly one typed Dataset/Series secondary resource of this record document.");
  var topic = topics[0];
  if (typed(store, topic, DATA_SERVICE)) return validateServiceRecord(store, url, topic);
  var datasets = unique([...store.getSubjects(TYPE$1, DCAT + "Dataset", null), ...store.getSubjects(TYPE$1, DCAT + "DatasetSeries", null)]);
  requireRule(datasets.length === 1 && datasets[0].equals(topic), "Each record document must describe exactly its primary Dataset/Series.");
  var distributions = objects(store, topic, DCAT + "distribution");
  requireRule(distributions.length > 0, "At least one distribution is required.");
  for (var distribution of distributions) {
    requireRule(local(distribution, url) && typed(store, distribution, DCAT + "Distribution"), "Every distribution must be a typed secondary resource of the same record document.");
    var downloads = objects(store, distribution, DCAT + "downloadURL");
    requireRule(downloads.length === 1 && iri$1(downloads[0]), "Every distribution needs exactly one direct downloadURL IRI.");
    var media = objects(store, distribution, DCAT + "mediaType");
    requireRule(media.length === 1 && (media[0].termType === "Literal" || iri$1(media[0])) && media[0].value.trim(), "Every distribution needs exactly one nonempty mediaType.");
    var models = objects(store, distribution, DCT + "conformsTo");
    requireRule(models.length > 0 && models.every(iri$1), "Every distribution needs at least one model or schema IRI via conformsTo.");
  }
  var _loop = function _loop(_distribution) {
    requireRule(local(_distribution, url) && distributions.some(value => value.equals(_distribution)), "Every Distribution must belong to the record's primary Dataset/Series.");
  };
  for (var _distribution of store.getSubjects(TYPE$1, DCAT + "Distribution", null)) {
    _loop(_distribution);
  }
  var dependencies = [];
  var _loop2 = function _loop2(type) {
    var targets = objects(store, topic, DCAT + predicate);
    requireRule(targets.every(iri$1), "dcat:".concat(predicate, " must link metadata by absolute IRI."));
    // seriesMember is meaningful only on DatasetSeries; reject accidental links
    // here instead of silently publishing unchecked nested metadata.
    if (targets.length && predicate === "seriesMember") requireRule(typed(store, topic, DCAT + "DatasetSeries"), "Only DatasetSeries may declare series members.");
    dependencies.push(...targets.map(target => ({
      url: target.value,
      type
    })));
  };
  for (var [predicate, type] of [["inSeries", "DatasetSeries"], ["seriesMember", "Dataset"]]) {
    _loop2(type);
  }
  return {
    store,
    topic,
    dependencies
  };
}
function assertProfileRecord(_x, _x2) {
  return _assertProfileRecord.apply(this, arguments);
}
function _assertProfileRecord() {
  _assertProfileRecord = _asyncToGenerator(function* (_ref, fetch) {
    var {
      url,
      turtle
    } = _ref;
    var root = documentUrl$1(url);
    var pending = [root];
    var documents = new Map([[root, turtle]]);
    var parsed = new Map();
    var bytes = 0;
    var triples = 0;
    while (pending.length) {
      var current = pending.pop();
      if (parsed.has(current)) continue;
      requireRule(parsed.size < 256, "Metadata validation exceeds 256 documents.");
      if (!documents.has(current)) {
        var _response$headers, _response$headers$get, _response$headers2;
        requireRule(/^https?:\/\//.test(current) && typeof fetch === "function", "Linked metadata is unavailable: ".concat(current));
        var response = yield fetch(current, {
          headers: {
            Accept: "text/turtle"
          },
          redirect: "error",
          cache: "no-store"
        });
        requireRule(response.ok, "Cannot validate linked metadata (".concat(response.status, "): ").concat(current));
        var length = Number((_response$headers = response.headers) === null || _response$headers === void 0 || (_response$headers$get = (_response$headers2 = _response$headers).get) === null || _response$headers$get === void 0 ? void 0 : _response$headers$get.call(_response$headers2, "Content-Length"));
        requireRule(!length || bytes + length <= 16000000, "Metadata validation exceeds 16 MB.");
        documents.set(current, yield response.text());
      }
      var source = documents.get(current);
      bytes += new TextEncoder().encode(source).length;
      requireRule(bytes <= 16000000, "Metadata validation exceeds 16 MB.");
      var record = parseRecord(current, source);
      parsed.set(current, record);
      triples += record.store.size;
      requireRule(triples <= 200000, "Metadata validation exceeds 200000 triples.");
      record.dependencies.forEach(dependency => pending.push(documentUrl$1(dependency.url)));
    }
    for (var _record of parsed.values()) {
      for (var reference of _record.dependencies) {
        var target = parsed.get(documentUrl$1(reference.url));
        requireRule((target === null || target === void 0 ? void 0 : target.topic.value) === reference.url && (reference.type === "Dataset" ? dataset(target.store, reference.url) : typed(target.store, reference.url, DCAT + reference.type)), "Linked ".concat(reference.type, " must be a conformant record's primary topic: ").concat(reference.url));
      }
    }
    return {
      datasetUrl: parsed.get(root).topic.value,
      recordUrl: root,
      validatedDocuments: [...parsed.keys()]
    };
  });
  return _assertProfileRecord.apply(this, arguments);
}
function assertProfileCatalogAddition(_x3, _x4) {
  return _assertProfileCatalogAddition.apply(this, arguments);
}
function _assertProfileCatalogAddition() {
  _assertProfileCatalogAddition = _asyncToGenerator(function* (datasetUrl, fetch) {
    var url = documentUrl$1(datasetUrl);
    var response = yield fetch(url, {
      headers: {
        Accept: "text/turtle"
      },
      redirect: "error",
      cache: "no-store"
    });
    requireRule(response.ok, "Cannot validate the record before linking it (".concat(response.status, "): ").concat(url));
    var result = yield assertProfileRecord({
      url,
      turtle: yield response.text()
    }, fetch);
    requireRule(result.datasetUrl === datasetUrl, "The catalog must link the record's actual primary Dataset/Series.");
    return result;
  });
  return _assertProfileCatalogAddition.apply(this, arguments);
}

var N3Parser = {};

var N3Lexer = {};

/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

var queueMicrotask_1;
var hasRequiredQueueMicrotask;

function requireQueueMicrotask () {
	if (hasRequiredQueueMicrotask) return queueMicrotask_1;
	hasRequiredQueueMicrotask = 1;
	var promise;
	queueMicrotask_1 = typeof queueMicrotask === 'function' ? queueMicrotask.bind(typeof window !== 'undefined' ? window : commonjsGlobal)
	// reuse resolved promise, and allocate it lazily
	: cb => (promise || (promise = Promise.resolve())).then(cb).catch(err => setTimeout(() => {
	  throw err;
	}, 0));
	return queueMicrotask_1;
}

var IRIs = {};

var hasRequiredIRIs;

function requireIRIs () {
	if (hasRequiredIRIs) return IRIs;
	hasRequiredIRIs = 1;

	Object.defineProperty(IRIs, "__esModule", {
	  value: true
	});
	IRIs.default = void 0;
	var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
	  XSD = 'http://www.w3.org/2001/XMLSchema#',
	  SWAP = 'http://www.w3.org/2000/10/swap/';
	IRIs.default = {
	  xsd: {
	    decimal: "".concat(XSD, "decimal"),
	    boolean: "".concat(XSD, "boolean"),
	    double: "".concat(XSD, "double"),
	    integer: "".concat(XSD, "integer"),
	    string: "".concat(XSD, "string")
	  },
	  rdf: {
	    type: "".concat(RDF, "type"),
	    nil: "".concat(RDF, "nil"),
	    first: "".concat(RDF, "first"),
	    rest: "".concat(RDF, "rest"),
	    langString: "".concat(RDF, "langString")
	  },
	  owl: {
	    sameAs: 'http://www.w3.org/2002/07/owl#sameAs'
	  },
	  r: {
	    forSome: "".concat(SWAP, "reify#forSome"),
	    forAll: "".concat(SWAP, "reify#forAll")
	  },
	  log: {
	    implies: "".concat(SWAP, "log#implies")
	  }
	};
	return IRIs;
}

var hasRequiredN3Lexer;

function requireN3Lexer () {
	if (hasRequiredN3Lexer) return N3Lexer;
	hasRequiredN3Lexer = 1;

	Object.defineProperty(N3Lexer, "__esModule", {
	  value: true
	});
	N3Lexer.default = void 0;
	var _buffer = require$$0;
	var _queueMicrotask = _interopRequireDefault(requireQueueMicrotask());
	var _IRIs = _interopRequireDefault(/*@__PURE__*/ requireIRIs());
	function _interopRequireDefault(e) {
	  return e && e.__esModule ? e : {
	    default: e
	  };
	}
	// **N3Lexer** tokenizes N3 documents.

	var {
	  xsd
	} = _IRIs.default;

	// Regular expression and replacement string to escape N3 strings
	var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\([^])/g;
	var escapeReplacements = {
	  '\\': '\\',
	  "'": "'",
	  '"': '"',
	  'n': '\n',
	  'r': '\r',
	  't': '\t',
	  'f': '\f',
	  'b': '\b',
	  '_': '_',
	  '~': '~',
	  '.': '.',
	  '-': '-',
	  '!': '!',
	  '$': '$',
	  '&': '&',
	  '(': '(',
	  ')': ')',
	  '*': '*',
	  '+': '+',
	  ',': ',',
	  ';': ';',
	  '=': '=',
	  '/': '/',
	  '?': '?',
	  '#': '#',
	  '@': '@',
	  '%': '%'
	};
	var illegalIriChars = /[\x00-\x20<>\\"\{\}\|\^\`]/;
	var lineModeRegExps = {
	  _iri: true,
	  _unescapedIri: true,
	  _simpleQuotedString: true,
	  _langcode: true,
	  _blank: true,
	  _newline: true,
	  _comment: true,
	  _whitespace: true,
	  _endOfFile: true
	};
	var invalidRegExp = /$0^/;

	// ## Constructor
	let N3Lexer$1 = class N3Lexer {
	  constructor(options) {
	    // ## Regular expressions
	    // It's slightly faster to have these as properties than as in-scope variables
	    this._iri = /^<((?:[^ <>{}\\]|\\[uU])+)>[ \t]*/; // IRI with escape sequences; needs sanity check after unescaping
	    this._unescapedIri = /^<([^\x00-\x20<>\\"\{\}\|\^\`]*)>[ \t]*/; // IRI without escape sequences; no unescaping
	    this._simpleQuotedString = /^"([^"\\\r\n]*)"(?=[^"])/; // string without escape sequences
	    this._simpleApostropheString = /^'([^'\\\r\n]*)'(?=[^'])/;
	    this._langcode = /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9\-])/i;
	    this._prefix = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=[#\s<])/;
	    this._prefixed = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?:[ \t]+|(?=\.?[,;!\^\s#()\[\]\{\}"'<>]))/;
	    this._variable = /^\?(?:(?:[A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=[.,;!\^\s#()\[\]\{\}"'<>])/;
	    this._blank = /^_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?:[ \t]+|(?=\.?[,;:\s#()\[\]\{\}"'<>]))/;
	    this._number = /^[\-+]?(?:(\d+\.\d*|\.?\d+)[eE][\-+]?|\d*(\.)?)\d+(?=\.?[,;:\s#()\[\]\{\}"'<>])/;
	    this._boolean = /^(?:true|false)(?=[.,;\s#()\[\]\{\}"'<>])/;
	    this._keyword = /^@[a-z]+(?=[\s#<:])/i;
	    this._sparqlKeyword = /^(?:PREFIX|BASE|GRAPH)(?=[\s#<])/i;
	    this._shortPredicates = /^a(?=[\s#()\[\]\{\}"'<>])/;
	    this._newline = /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/;
	    this._comment = /#([^\n\r]*)/;
	    this._whitespace = /^[ \t]+/;
	    this._endOfFile = /^(?:#[^\n\r]*)?$/;
	    options = options || {};

	    // In line mode (N-Triples or N-Quads), only simple features may be parsed
	    if (this._lineMode = !!options.lineMode) {
	      this._n3Mode = false;
	      // Don't tokenize special literals
	      for (var key in this) {
	        if (!(key in lineModeRegExps) && this[key] instanceof RegExp) this[key] = invalidRegExp;
	      }
	    }
	    // When not in line mode, enable N3 functionality by default
	    else {
	      this._n3Mode = options.n3 !== false;
	    }
	    // Don't output comment tokens by default
	    this.comments = !!options.comments;
	    // Cache the last tested closing position of long literals
	    this._literalClosingPos = 0;
	  }

	  // ## Private methods

	  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback
	  _tokenizeToEnd(callback, inputFinished) {
	    // Continue parsing as far as possible; the loop will return eventually
	    var input = this._input;
	    var currentLineLength = input.length;
	    while (true) {
	      // Count and skip whitespace lines
	      var whiteSpaceMatch = void 0,
	        comment = void 0;
	      while (whiteSpaceMatch = this._newline.exec(input)) {
	        // Try to find a comment
	        if (this.comments && (comment = this._comment.exec(whiteSpaceMatch[0]))) emitToken('comment', comment[1], '', this._line, whiteSpaceMatch[0].length);
	        // Advance the input
	        input = input.substr(whiteSpaceMatch[0].length, input.length);
	        currentLineLength = input.length;
	        this._line++;
	      }
	      // Skip whitespace on current line
	      if (!whiteSpaceMatch && (whiteSpaceMatch = this._whitespace.exec(input))) input = input.substr(whiteSpaceMatch[0].length, input.length);

	      // Stop for now if we're at the end
	      if (this._endOfFile.test(input)) {
	        // If the input is finished, emit EOF
	        if (inputFinished) {
	          // Try to find a final comment
	          if (this.comments && (comment = this._comment.exec(input))) emitToken('comment', comment[1], '', this._line, input.length);
	          input = null;
	          emitToken('eof', '', '', this._line, 0);
	        }
	        return this._input = input;
	      }

	      // Look for specific token types based on the first character
	      var line = this._line,
	        firstChar = input[0];
	      var type = '',
	        value = '',
	        prefix = '',
	        match = null,
	        matchLength = 0,
	        inconclusive = false;
	      switch (firstChar) {
	        case '^':
	          // We need at least 3 tokens lookahead to distinguish ^^<IRI> and ^^pre:fixed
	          if (input.length < 3) break;
	          // Try to match a type
	          else if (input[1] === '^') {
	            this._previousMarker = '^^';
	            // Move to type IRI or prefixed name
	            input = input.substr(2);
	            if (input[0] !== '<') {
	              inconclusive = true;
	              break;
	            }
	          }
	          // If no type, it must be a path expression
	          else {
	            if (this._n3Mode) {
	              matchLength = 1;
	              type = '^';
	            }
	            break;
	          }
	        // Fall through in case the type is an IRI
	        case '<':
	          // Try to find a full IRI without escape sequences
	          if (match = this._unescapedIri.exec(input)) type = 'IRI', value = match[1];
	          // Try to find a full IRI with escape sequences
	          else if (match = this._iri.exec(input)) {
	            value = this._unescape(match[1]);
	            if (value === null || illegalIriChars.test(value)) return reportSyntaxError(this);
	            type = 'IRI';
	          }
	          // Try to find a nested triple
	          else if (input.length > 1 && input[1] === '<') type = '<<', matchLength = 2;
	          // Try to find a backwards implication arrow
	          else if (this._n3Mode && input.length > 1 && input[1] === '=') type = 'inverse', matchLength = 2, value = '>';
	          break;
	        case '>':
	          if (input.length > 1 && input[1] === '>') type = '>>', matchLength = 2;
	          break;
	        case '_':
	          // Try to find a blank node. Since it can contain (but not end with) a dot,
	          // we always need a non-dot character before deciding it is a blank node.
	          // Therefore, try inserting a space if we're at the end of the input.
	          if ((match = this._blank.exec(input)) || inputFinished && (match = this._blank.exec("".concat(input, " ")))) type = 'blank', prefix = '_', value = match[1];
	          break;
	        case '"':
	          // Try to find a literal without escape sequences
	          if (match = this._simpleQuotedString.exec(input)) value = match[1];
	          // Try to find a literal wrapped in three pairs of quotes
	          else {
	            ({
	              value,
	              matchLength
	            } = this._parseLiteral(input));
	            if (value === null) return reportSyntaxError(this);
	          }
	          if (match !== null || matchLength !== 0) {
	            type = 'literal';
	            this._literalClosingPos = 0;
	          }
	          break;
	        case "'":
	          if (!this._lineMode) {
	            // Try to find a literal without escape sequences
	            if (match = this._simpleApostropheString.exec(input)) value = match[1];
	            // Try to find a literal wrapped in three pairs of quotes
	            else {
	              ({
	                value,
	                matchLength
	              } = this._parseLiteral(input));
	              if (value === null) return reportSyntaxError(this);
	            }
	            if (match !== null || matchLength !== 0) {
	              type = 'literal';
	              this._literalClosingPos = 0;
	            }
	          }
	          break;
	        case '?':
	          // Try to find a variable
	          if (this._n3Mode && (match = this._variable.exec(input))) type = 'var', value = match[0];
	          break;
	        case '@':
	          // Try to find a language code
	          if (this._previousMarker === 'literal' && (match = this._langcode.exec(input))) type = 'langcode', value = match[1];
	          // Try to find a keyword
	          else if (match = this._keyword.exec(input)) type = match[0];
	          break;
	        case '.':
	          // Try to find a dot as punctuation
	          if (input.length === 1 ? inputFinished : input[1] < '0' || input[1] > '9') {
	            type = '.';
	            matchLength = 1;
	            break;
	          }
	        // Fall through to numerical case (could be a decimal dot)

	        case '0':
	        case '1':
	        case '2':
	        case '3':
	        case '4':
	        case '5':
	        case '6':
	        case '7':
	        case '8':
	        case '9':
	        case '+':
	        case '-':
	          // Try to find a number. Since it can contain (but not end with) a dot,
	          // we always need a non-dot character before deciding it is a number.
	          // Therefore, try inserting a space if we're at the end of the input.
	          if (match = this._number.exec(input) || inputFinished && (match = this._number.exec("".concat(input, " ")))) {
	            type = 'literal', value = match[0];
	            prefix = typeof match[1] === 'string' ? xsd.double : typeof match[2] === 'string' ? xsd.decimal : xsd.integer;
	          }
	          break;
	        case 'B':
	        case 'b':
	        case 'p':
	        case 'P':
	        case 'G':
	        case 'g':
	          // Try to find a SPARQL-style keyword
	          if (match = this._sparqlKeyword.exec(input)) type = match[0].toUpperCase();else inconclusive = true;
	          break;
	        case 'f':
	        case 't':
	          // Try to match a boolean
	          if (match = this._boolean.exec(input)) type = 'literal', value = match[0], prefix = xsd.boolean;else inconclusive = true;
	          break;
	        case 'a':
	          // Try to find an abbreviated predicate
	          if (match = this._shortPredicates.exec(input)) type = 'abbreviation', value = 'a';else inconclusive = true;
	          break;
	        case '=':
	          // Try to find an implication arrow or equals sign
	          if (this._n3Mode && input.length > 1) {
	            type = 'abbreviation';
	            if (input[1] !== '>') matchLength = 1, value = '=';else matchLength = 2, value = '>';
	          }
	          break;
	        case '!':
	          if (!this._n3Mode) break;
	        case ',':
	        case ';':
	        case '[':
	        case ']':
	        case '(':
	        case ')':
	        case '}':
	          if (!this._lineMode) {
	            matchLength = 1;
	            type = firstChar;
	          }
	          break;
	        case '{':
	          // We need at least 2 tokens lookahead to distinguish "{|" and "{ "
	          if (!this._lineMode && input.length >= 2) {
	            // Try to find a quoted triple annotation start
	            if (input[1] === '|') type = '{|', matchLength = 2;else type = firstChar, matchLength = 1;
	          }
	          break;
	        case '|':
	          // We need 2 tokens lookahead to parse "|}"
	          // Try to find a quoted triple annotation end
	          if (input.length >= 2 && input[1] === '}') type = '|}', matchLength = 2;
	          break;
	        default:
	          inconclusive = true;
	      }

	      // Some first characters do not allow an immediate decision, so inspect more
	      if (inconclusive) {
	        // Try to find a prefix
	        if ((this._previousMarker === '@prefix' || this._previousMarker === 'PREFIX') && (match = this._prefix.exec(input))) type = 'prefix', value = match[1] || '';
	        // Try to find a prefixed name. Since it can contain (but not end with) a dot,
	        // we always need a non-dot character before deciding it is a prefixed name.
	        // Therefore, try inserting a space if we're at the end of the input.
	        else if ((match = this._prefixed.exec(input)) || inputFinished && (match = this._prefixed.exec("".concat(input, " ")))) type = 'prefixed', prefix = match[1] || '', value = this._unescape(match[2]);
	      }

	      // A type token is special: it can only be emitted after an IRI or prefixed name is read
	      if (this._previousMarker === '^^') {
	        switch (type) {
	          case 'prefixed':
	            type = 'type';
	            break;
	          case 'IRI':
	            type = 'typeIRI';
	            break;
	          default:
	            type = '';
	        }
	      }

	      // What if nothing of the above was found?
	      if (!type) {
	        // We could be in streaming mode, and then we just wait for more input to arrive.
	        // Otherwise, a syntax error has occurred in the input.
	        // One exception: error on an unaccounted linebreak (= not inside a triple-quoted literal).
	        if (inputFinished || !/^'''|^"""/.test(input) && /\n|\r/.test(input)) return reportSyntaxError(this);else return this._input = input;
	      }

	      // Emit the parsed token
	      var length = matchLength || match[0].length;
	      var token = emitToken(type, value, prefix, line, length);
	      this.previousToken = token;
	      this._previousMarker = type;

	      // Advance to next part to tokenize
	      input = input.substr(length, input.length);
	    }

	    // Emits the token through the callback
	    function emitToken(type, value, prefix, line, length) {
	      var start = input ? currentLineLength - input.length : currentLineLength;
	      var end = start + length;
	      var token = {
	        type,
	        value,
	        prefix,
	        line,
	        start,
	        end
	      };
	      callback(null, token);
	      return token;
	    }
	    // Signals the syntax error through the callback
	    function reportSyntaxError(self) {
	      callback(self._syntaxError(/^\S*/.exec(input)[0]));
	    }
	  }

	  // ### `_unescape` replaces N3 escape codes by their corresponding characters
	  _unescape(item) {
	    var invalid = false;
	    var replaced = item.replace(escapeSequence, (sequence, unicode4, unicode8, escapedChar) => {
	      // 4-digit unicode character
	      if (typeof unicode4 === 'string') return String.fromCharCode(Number.parseInt(unicode4, 16));
	      // 8-digit unicode character
	      if (typeof unicode8 === 'string') {
	        var charCode = Number.parseInt(unicode8, 16);
	        return charCode <= 0xFFFF ? String.fromCharCode(Number.parseInt(unicode8, 16)) : String.fromCharCode(0xD800 + ((charCode -= 0x10000) >> 10), 0xDC00 + (charCode & 0x3FF));
	      }
	      // fixed escape sequence
	      if (escapedChar in escapeReplacements) return escapeReplacements[escapedChar];
	      // invalid escape sequence
	      invalid = true;
	      return '';
	    });
	    return invalid ? null : replaced;
	  }

	  // ### `_parseLiteral` parses a literal into an unescaped value
	  _parseLiteral(input) {
	    // Ensure we have enough lookahead to identify triple-quoted strings
	    if (input.length >= 3) {
	      // Identify the opening quote(s)
	      var opening = input.match(/^(?:"""|"|'''|'|)/)[0];
	      var openingLength = opening.length;

	      // Find the next candidate closing quotes
	      var closingPos = Math.max(this._literalClosingPos, openingLength);
	      while ((closingPos = input.indexOf(opening, closingPos)) > 0) {
	        // Count backslashes right before the closing quotes
	        var backslashCount = 0;
	        while (input[closingPos - backslashCount - 1] === '\\') backslashCount++;

	        // An even number of backslashes (in particular 0)
	        // means these are actual, non-escaped closing quotes
	        if (backslashCount % 2 === 0) {
	          // Extract and unescape the value
	          var raw = input.substring(openingLength, closingPos);
	          var lines = raw.split(/\r\n|\r|\n/).length - 1;
	          var matchLength = closingPos + openingLength;
	          // Only triple-quoted strings can be multi-line
	          if (openingLength === 1 && lines !== 0 || openingLength === 3 && this._lineMode) break;
	          this._line += lines;
	          return {
	            value: this._unescape(raw),
	            matchLength
	          };
	        }
	        closingPos++;
	      }
	      this._literalClosingPos = input.length - openingLength + 1;
	    }
	    return {
	      value: '',
	      matchLength: 0
	    };
	  }

	  // ### `_syntaxError` creates a syntax error for the given issue
	  _syntaxError(issue) {
	    this._input = null;
	    var err = new Error("Unexpected \"".concat(issue, "\" on line ").concat(this._line, "."));
	    err.context = {
	      token: undefined,
	      line: this._line,
	      previousToken: this.previousToken
	    };
	    return err;
	  }

	  // ### Strips off any starting UTF BOM mark.
	  _readStartingBom(input) {
	    return input.startsWith('\ufeff') ? input.substr(1) : input;
	  }

	  // ## Public methods

	  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
	  // The input can be a string or a stream.
	  tokenize(input, callback) {
	    this._line = 1;

	    // If the input is a string, continuously emit tokens through the callback until the end
	    if (typeof input === 'string') {
	      this._input = this._readStartingBom(input);
	      // If a callback was passed, asynchronously call it
	      if (typeof callback === 'function') (0, _queueMicrotask.default)(() => this._tokenizeToEnd(callback, true));
	      // If no callback was passed, tokenize synchronously and return
	      else {
	        var tokens = [];
	        var error;
	        this._tokenizeToEnd((e, t) => e ? error = e : tokens.push(t), true);
	        if (error) throw error;
	        return tokens;
	      }
	    }
	    // Otherwise, the input must be a stream
	    else {
	      this._pendingBuffer = null;
	      if (typeof input.setEncoding === 'function') input.setEncoding('utf8');
	      // Adds the data chunk to the buffer and parses as far as possible
	      input.on('data', data => {
	        if (this._input !== null && data.length !== 0) {
	          // Prepend any previous pending writes
	          if (this._pendingBuffer) {
	            data = _buffer.Buffer.concat([this._pendingBuffer, data]);
	            this._pendingBuffer = null;
	          }
	          // Hold if the buffer ends in an incomplete unicode sequence
	          if (data[data.length - 1] & 0x80) {
	            this._pendingBuffer = data;
	          }
	          // Otherwise, tokenize as far as possible
	          else {
	            // Only read a BOM at the start
	            if (typeof this._input === 'undefined') this._input = this._readStartingBom(typeof data === 'string' ? data : data.toString());else this._input += data;
	            this._tokenizeToEnd(callback, false);
	          }
	        }
	      });
	      // Parses until the end
	      input.on('end', () => {
	        if (typeof this._input === 'string') this._tokenizeToEnd(callback, true);
	      });
	      input.on('error', callback);
	    }
	  }
	};
	N3Lexer.default = N3Lexer$1;
	return N3Lexer;
}

var N3DataFactory = {};

var hasRequiredN3DataFactory;

function requireN3DataFactory () {
	if (hasRequiredN3DataFactory) return N3DataFactory;
	hasRequiredN3DataFactory = 1;

	Object.defineProperty(N3DataFactory, "__esModule", {
	  value: true
	});
	N3DataFactory.default = N3DataFactory.Variable = N3DataFactory.Triple = N3DataFactory.Term = N3DataFactory.Quad = N3DataFactory.NamedNode = N3DataFactory.Literal = N3DataFactory.DefaultGraph = N3DataFactory.BlankNode = void 0;
	N3DataFactory.escapeQuotes = escapeQuotes;
	N3DataFactory.fromQuad = fromQuad;
	N3DataFactory.fromTerm = fromTerm;
	N3DataFactory.termFromId = termFromId;
	N3DataFactory.termToId = termToId;
	N3DataFactory.unescapeQuotes = unescapeQuotes;
	var _IRIs = _interopRequireDefault(/*@__PURE__*/ requireIRIs());
	function _interopRequireDefault(e) {
	  return e && e.__esModule ? e : {
	    default: e
	  };
	}
	// N3.js implementations of the RDF/JS core data types
	// See http://rdf.js.org/data-model-spec/

	var {
	  rdf,
	  xsd
	} = _IRIs.default;

	// eslint-disable-next-line prefer-const
	var DEFAULTGRAPH;
	var _blankNodeCounter = 0;
	var escapedLiteral = /^"(.*".*)(?="[^"]*$)/;

	// ## DataFactory singleton
	var DataFactory = {
	  namedNode,
	  blankNode,
	  variable,
	  literal,
	  defaultGraph,
	  quad,
	  triple: quad,
	  fromTerm,
	  fromQuad
	};
	N3DataFactory.default = DataFactory; // ## Term constructor
	class Term {
	  constructor(id) {
	    this.id = id;
	  }

	  // ### The value of this term
	  get value() {
	    return this.id;
	  }

	  // ### Returns whether this object represents the same term as the other
	  equals(other) {
	    // If both terms were created by this library,
	    // equality can be computed through ids
	    if (other instanceof Term) return this.id === other.id;
	    // Otherwise, compare term type and value
	    return !!other && this.termType === other.termType && this.value === other.value;
	  }

	  // ### Implement hashCode for Immutable.js, since we implement `equals`
	  // https://immutable-js.com/docs/v4.0.0/ValueObject/#hashCode()
	  hashCode() {
	    return 0;
	  }

	  // ### Returns a plain object representation of this term
	  toJSON() {
	    return {
	      termType: this.termType,
	      value: this.value
	    };
	  }
	}

	// ## NamedNode constructor
	N3DataFactory.Term = Term;
	class NamedNode extends Term {
	  // ### The term type of this term
	  get termType() {
	    return 'NamedNode';
	  }
	}

	// ## Literal constructor
	N3DataFactory.NamedNode = NamedNode;
	class Literal extends Term {
	  // ### The term type of this term
	  get termType() {
	    return 'Literal';
	  }

	  // ### The text value of this literal
	  get value() {
	    return this.id.substring(1, this.id.lastIndexOf('"'));
	  }

	  // ### The language of this literal
	  get language() {
	    // Find the last quotation mark (e.g., '"abc"@en-us')
	    var id = this.id;
	    var atPos = id.lastIndexOf('"') + 1;
	    // If "@" it follows, return the remaining substring; empty otherwise
	    return atPos < id.length && id[atPos++] === '@' ? id.substr(atPos).toLowerCase() : '';
	  }

	  // ### The datatype IRI of this literal
	  get datatype() {
	    return new NamedNode(this.datatypeString);
	  }

	  // ### The datatype string of this literal
	  get datatypeString() {
	    // Find the last quotation mark (e.g., '"abc"^^http://ex.org/types#t')
	    var id = this.id,
	      dtPos = id.lastIndexOf('"') + 1;
	    var char = dtPos < id.length ? id[dtPos] : '';
	    // If "^" it follows, return the remaining substring
	    return char === '^' ? id.substr(dtPos + 2) :
	    // If "@" follows, return rdf:langString; xsd:string otherwise
	    char !== '@' ? xsd.string : rdf.langString;
	  }

	  // ### Returns whether this object represents the same term as the other
	  equals(other) {
	    // If both literals were created by this library,
	    // equality can be computed through ids
	    if (other instanceof Literal) return this.id === other.id;
	    // Otherwise, compare term type, value, language, and datatype
	    return !!other && !!other.datatype && this.termType === other.termType && this.value === other.value && this.language === other.language && this.datatype.value === other.datatype.value;
	  }
	  toJSON() {
	    return {
	      termType: this.termType,
	      value: this.value,
	      language: this.language,
	      datatype: {
	        termType: 'NamedNode',
	        value: this.datatypeString
	      }
	    };
	  }
	}

	// ## BlankNode constructor
	N3DataFactory.Literal = Literal;
	class BlankNode extends Term {
	  constructor(name) {
	    super("_:".concat(name));
	  }

	  // ### The term type of this term
	  get termType() {
	    return 'BlankNode';
	  }

	  // ### The name of this blank node
	  get value() {
	    return this.id.substr(2);
	  }
	}
	N3DataFactory.BlankNode = BlankNode;
	class Variable extends Term {
	  constructor(name) {
	    super("?".concat(name));
	  }

	  // ### The term type of this term
	  get termType() {
	    return 'Variable';
	  }

	  // ### The name of this variable
	  get value() {
	    return this.id.substr(1);
	  }
	}

	// ## DefaultGraph constructor
	N3DataFactory.Variable = Variable;
	class DefaultGraph extends Term {
	  constructor() {
	    super('');
	    return DEFAULTGRAPH || this;
	  }

	  // ### The term type of this term
	  get termType() {
	    return 'DefaultGraph';
	  }

	  // ### Returns whether this object represents the same term as the other
	  equals(other) {
	    // If both terms were created by this library,
	    // equality can be computed through strict equality;
	    // otherwise, compare term types.
	    return this === other || !!other && this.termType === other.termType;
	  }
	}

	// ## DefaultGraph singleton
	N3DataFactory.DefaultGraph = DefaultGraph;
	DEFAULTGRAPH = new DefaultGraph();

	// ### Constructs a term from the given internal string ID
	// The third 'nested' parameter of this function is to aid
	// with recursion over nested terms. It should not be used
	// by consumers of this library.
	// See https://github.com/rdfjs/N3.js/pull/311#discussion_r1061042725
	function termFromId(id, factory, nested) {
	  factory = factory || DataFactory;

	  // Falsy value or empty string indicate the default graph
	  if (!id) return factory.defaultGraph();

	  // Identify the term type based on the first character
	  switch (id[0]) {
	    case '?':
	      return factory.variable(id.substr(1));
	    case '_':
	      return factory.blankNode(id.substr(2));
	    case '"':
	      // Shortcut for internal literals
	      if (factory === DataFactory) return new Literal(id);
	      // Literal without datatype or language
	      if (id[id.length - 1] === '"') return factory.literal(id.substr(1, id.length - 2));
	      // Literal with datatype or language
	      var endPos = id.lastIndexOf('"', id.length - 1);
	      return factory.literal(id.substr(1, endPos - 1), id[endPos + 1] === '@' ? id.substr(endPos + 2) : factory.namedNode(id.substr(endPos + 3)));
	    case '[':
	      id = JSON.parse(id);
	      break;
	    default:
	      if (!nested || !Array.isArray(id)) {
	        return factory.namedNode(id);
	      }
	  }
	  return factory.quad(termFromId(id[0], factory, true), termFromId(id[1], factory, true), termFromId(id[2], factory, true), id[3] && termFromId(id[3], factory, true));
	}

	// ### Constructs an internal string ID from the given term or ID string
	// The third 'nested' parameter of this function is to aid
	// with recursion over nested terms. It should not be used
	// by consumers of this library.
	// See https://github.com/rdfjs/N3.js/pull/311#discussion_r1061042725
	function termToId(term, nested) {
	  if (typeof term === 'string') return term;
	  if (term instanceof Term && term.termType !== 'Quad') return term.id;
	  if (!term) return DEFAULTGRAPH.id;

	  // Term instantiated with another library
	  switch (term.termType) {
	    case 'NamedNode':
	      return term.value;
	    case 'BlankNode':
	      return "_:".concat(term.value);
	    case 'Variable':
	      return "?".concat(term.value);
	    case 'DefaultGraph':
	      return '';
	    case 'Literal':
	      return "\"".concat(term.value, "\"").concat(term.language ? "@".concat(term.language) : term.datatype && term.datatype.value !== xsd.string ? "^^".concat(term.datatype.value) : '');
	    case 'Quad':
	      var res = [termToId(term.subject, true), termToId(term.predicate, true), termToId(term.object, true)];
	      if (term.graph && term.graph.termType !== 'DefaultGraph') {
	        res.push(termToId(term.graph, true));
	      }
	      return nested ? res : JSON.stringify(res);
	    default:
	      throw new Error("Unexpected termType: ".concat(term.termType));
	  }
	}

	// ## Quad constructor
	class Quad extends Term {
	  constructor(subject, predicate, object, graph) {
	    super('');
	    this._subject = subject;
	    this._predicate = predicate;
	    this._object = object;
	    this._graph = graph || DEFAULTGRAPH;
	  }

	  // ### The term type of this term
	  get termType() {
	    return 'Quad';
	  }
	  get subject() {
	    return this._subject;
	  }
	  get predicate() {
	    return this._predicate;
	  }
	  get object() {
	    return this._object;
	  }
	  get graph() {
	    return this._graph;
	  }

	  // ### Returns a plain object representation of this quad
	  toJSON() {
	    return {
	      termType: this.termType,
	      subject: this._subject.toJSON(),
	      predicate: this._predicate.toJSON(),
	      object: this._object.toJSON(),
	      graph: this._graph.toJSON()
	    };
	  }

	  // ### Returns whether this object represents the same quad as the other
	  equals(other) {
	    return !!other && this._subject.equals(other.subject) && this._predicate.equals(other.predicate) && this._object.equals(other.object) && this._graph.equals(other.graph);
	  }
	}
	N3DataFactory.Triple = N3DataFactory.Quad = Quad;
	// ### Escapes the quotes within the given literal
	function escapeQuotes(id) {
	  return id.replace(escapedLiteral, (_, quoted) => "\"".concat(quoted.replace(/"/g, '""')));
	}

	// ### Unescapes the quotes within the given literal
	function unescapeQuotes(id) {
	  return id.replace(escapedLiteral, (_, quoted) => "\"".concat(quoted.replace(/""/g, '"')));
	}

	// ### Creates an IRI
	function namedNode(iri) {
	  return new NamedNode(iri);
	}

	// ### Creates a blank node
	function blankNode(name) {
	  return new BlankNode(name || "n3-".concat(_blankNodeCounter++));
	}

	// ### Creates a literal
	function literal(value, languageOrDataType) {
	  // Create a language-tagged string
	  if (typeof languageOrDataType === 'string') return new Literal("\"".concat(value, "\"@").concat(languageOrDataType.toLowerCase()));

	  // Automatically determine datatype for booleans and numbers
	  var datatype = languageOrDataType ? languageOrDataType.value : '';
	  if (datatype === '') {
	    // Convert a boolean
	    if (typeof value === 'boolean') datatype = xsd.boolean;
	    // Convert an integer or double
	    else if (typeof value === 'number') {
	      if (Number.isFinite(value)) datatype = Number.isInteger(value) ? xsd.integer : xsd.double;else {
	        datatype = xsd.double;
	        if (!Number.isNaN(value)) value = value > 0 ? 'INF' : '-INF';
	      }
	    }
	  }

	  // Create a datatyped literal
	  return datatype === '' || datatype === xsd.string ? new Literal("\"".concat(value, "\"")) : new Literal("\"".concat(value, "\"^^").concat(datatype));
	}

	// ### Creates a variable
	function variable(name) {
	  return new Variable(name);
	}

	// ### Returns the default graph
	function defaultGraph() {
	  return DEFAULTGRAPH;
	}

	// ### Creates a quad
	function quad(subject, predicate, object, graph) {
	  return new Quad(subject, predicate, object, graph);
	}
	function fromTerm(term) {
	  if (term instanceof Term) return term;

	  // Term instantiated with another library
	  switch (term.termType) {
	    case 'NamedNode':
	      return namedNode(term.value);
	    case 'BlankNode':
	      return blankNode(term.value);
	    case 'Variable':
	      return variable(term.value);
	    case 'DefaultGraph':
	      return DEFAULTGRAPH;
	    case 'Literal':
	      return literal(term.value, term.language || term.datatype);
	    case 'Quad':
	      return fromQuad(term);
	    default:
	      throw new Error("Unexpected termType: ".concat(term.termType));
	  }
	}
	function fromQuad(inQuad) {
	  if (inQuad instanceof Quad) return inQuad;
	  if (inQuad.termType !== 'Quad') throw new Error("Unexpected termType: ".concat(inQuad.termType));
	  return quad(fromTerm(inQuad.subject), fromTerm(inQuad.predicate), fromTerm(inQuad.object), fromTerm(inQuad.graph));
	}
	return N3DataFactory;
}

var hasRequiredN3Parser;

function requireN3Parser () {
	if (hasRequiredN3Parser) return N3Parser;
	hasRequiredN3Parser = 1;

	Object.defineProperty(N3Parser, "__esModule", {
	  value: true
	});
	N3Parser.default = void 0;
	var _N3Lexer = _interopRequireDefault(/*@__PURE__*/ requireN3Lexer());
	var _N3DataFactory = _interopRequireDefault(/*@__PURE__*/ requireN3DataFactory());
	var _IRIs = _interopRequireDefault(/*@__PURE__*/ requireIRIs());
	function _interopRequireDefault(e) {
	  return e && e.__esModule ? e : {
	    default: e
	  };
	}
	// **N3Parser** parses N3 documents.

	var blankNodePrefix = 0;

	// ## Constructor
	let N3Parser$1 = class N3Parser {
	  constructor(options) {
	    this._contextStack = [];
	    this._graph = null;

	    // Set the document IRI
	    options = options || {};
	    this._setBase(options.baseIRI);
	    options.factory && initDataFactory(this, options.factory);

	    // Set supported features depending on the format
	    var format = typeof options.format === 'string' ? options.format.match(/\w*$/)[0].toLowerCase() : '',
	      isTurtle = /turtle/.test(format),
	      isTriG = /trig/.test(format),
	      isNTriples = /triple/.test(format),
	      isNQuads = /quad/.test(format),
	      isN3 = this._n3Mode = /n3/.test(format),
	      isLineMode = isNTriples || isNQuads;
	    if (!(this._supportsNamedGraphs = !(isTurtle || isN3))) this._readPredicateOrNamedGraph = this._readPredicate;
	    // Support triples in other graphs
	    this._supportsQuads = !(isTurtle || isTriG || isNTriples || isN3);
	    // Support nesting of triples
	    this._supportsRDFStar = format === '' || /star|\*$/.test(format);
	    // Disable relative IRIs in N-Triples or N-Quads mode
	    if (isLineMode) this._resolveRelativeIRI = iri => {
	      return null;
	    };
	    this._blankNodePrefix = typeof options.blankNodePrefix !== 'string' ? '' : options.blankNodePrefix.replace(/^(?!_:)/, '_:');
	    this._lexer = options.lexer || new _N3Lexer.default({
	      lineMode: isLineMode,
	      n3: isN3
	    });
	    // Disable explicit quantifiers by default
	    this._explicitQuantifiers = !!options.explicitQuantifiers;
	  }

	  // ## Static class methods

	  // ### `_resetBlankNodePrefix` restarts blank node prefix identification
	  static _resetBlankNodePrefix() {
	    blankNodePrefix = 0;
	  }

	  // ## Private methods

	  // ### `_setBase` sets the base IRI to resolve relative IRIs
	  _setBase(baseIRI) {
	    if (!baseIRI) {
	      this._base = '';
	      this._basePath = '';
	    } else {
	      // Remove fragment if present
	      var fragmentPos = baseIRI.indexOf('#');
	      if (fragmentPos >= 0) baseIRI = baseIRI.substr(0, fragmentPos);
	      // Set base IRI and its components
	      this._base = baseIRI;
	      this._basePath = baseIRI.indexOf('/') < 0 ? baseIRI : baseIRI.replace(/[^\/?]*(?:\?.*)?$/, '');
	      baseIRI = baseIRI.match(/^(?:([a-z][a-z0-9+.-]*:))?(?:\/\/[^\/]*)?/i);
	      this._baseRoot = baseIRI[0];
	      this._baseScheme = baseIRI[1];
	    }
	  }

	  // ### `_saveContext` stores the current parsing context
	  // when entering a new scope (list, blank node, formula)
	  _saveContext(type, graph, subject, predicate, object) {
	    var n3Mode = this._n3Mode;
	    this._contextStack.push({
	      type,
	      subject,
	      predicate,
	      object,
	      graph,
	      inverse: n3Mode ? this._inversePredicate : false,
	      blankPrefix: n3Mode ? this._prefixes._ : '',
	      quantified: n3Mode ? this._quantified : null
	    });
	    // The settings below only apply to N3 streams
	    if (n3Mode) {
	      // Every new scope resets the predicate direction
	      this._inversePredicate = false;
	      // In N3, blank nodes are scoped to a formula
	      // (using a dot as separator, as a blank node label cannot start with it)
	      this._prefixes._ = this._graph ? "".concat(this._graph.value, ".") : '.';
	      // Quantifiers are scoped to a formula
	      this._quantified = Object.create(this._quantified);
	    }
	  }

	  // ### `_restoreContext` restores the parent context
	  // when leaving a scope (list, blank node, formula)
	  _restoreContext(type, token) {
	    // Obtain the previous context
	    var context = this._contextStack.pop();
	    if (!context || context.type !== type) return this._error("Unexpected ".concat(token.type), token);

	    // Restore the quad of the previous context
	    this._subject = context.subject;
	    this._predicate = context.predicate;
	    this._object = context.object;
	    this._graph = context.graph;

	    // Restore N3 context settings
	    if (this._n3Mode) {
	      this._inversePredicate = context.inverse;
	      this._prefixes._ = context.blankPrefix;
	      this._quantified = context.quantified;
	    }
	  }

	  // ### `_readInTopContext` reads a token when in the top context
	  _readInTopContext(token) {
	    switch (token.type) {
	      // If an EOF token arrives in the top context, signal that we're done
	      case 'eof':
	        if (this._graph !== null) return this._error('Unclosed graph', token);
	        delete this._prefixes._;
	        return this._callback(null, null, this._prefixes);
	      // It could be a prefix declaration
	      case 'PREFIX':
	        this._sparqlStyle = true;
	      case '@prefix':
	        return this._readPrefix;
	      // It could be a base declaration
	      case 'BASE':
	        this._sparqlStyle = true;
	      case '@base':
	        return this._readBaseIRI;
	      // It could be a graph
	      case '{':
	        if (this._supportsNamedGraphs) {
	          this._graph = '';
	          this._subject = null;
	          return this._readSubject;
	        }
	      case 'GRAPH':
	        if (this._supportsNamedGraphs) return this._readNamedGraphLabel;
	      // Otherwise, the next token must be a subject
	      default:
	        return this._readSubject(token);
	    }
	  }

	  // ### `_readEntity` reads an IRI, prefixed name, blank node, or variable
	  _readEntity(token, quantifier) {
	    var value;
	    switch (token.type) {
	      // Read a relative or absolute IRI
	      case 'IRI':
	      case 'typeIRI':
	        var iri = this._resolveIRI(token.value);
	        if (iri === null) return this._error('Invalid IRI', token);
	        value = this._factory.namedNode(iri);
	        break;
	      // Read a prefixed name
	      case 'type':
	      case 'prefixed':
	        var prefix = this._prefixes[token.prefix];
	        if (prefix === undefined) return this._error("Undefined prefix \"".concat(token.prefix, ":\""), token);
	        value = this._factory.namedNode(prefix + token.value);
	        break;
	      // Read a blank node
	      case 'blank':
	        value = this._factory.blankNode(this._prefixes[token.prefix] + token.value);
	        break;
	      // Read a variable
	      case 'var':
	        value = this._factory.variable(token.value.substr(1));
	        break;
	      // Everything else is not an entity
	      default:
	        return this._error("Expected entity but got ".concat(token.type), token);
	    }
	    // In N3 mode, replace the entity if it is quantified
	    if (!quantifier && this._n3Mode && value.id in this._quantified) value = this._quantified[value.id];
	    return value;
	  }

	  // ### `_readSubject` reads a quad's subject
	  _readSubject(token) {
	    this._predicate = null;
	    switch (token.type) {
	      case '[':
	        // Start a new quad with a new blank node as subject
	        this._saveContext('blank', this._graph, this._subject = this._factory.blankNode(), null, null);
	        return this._readBlankNodeHead;
	      case '(':
	        // Start a new list
	        this._saveContext('list', this._graph, this.RDF_NIL, null, null);
	        this._subject = null;
	        return this._readListItem;
	      case '{':
	        // Start a new formula
	        if (!this._n3Mode) return this._error('Unexpected graph', token);
	        this._saveContext('formula', this._graph, this._graph = this._factory.blankNode(), null, null);
	        return this._readSubject;
	      case '}':
	        // No subject; the graph in which we are reading is closed instead
	        return this._readPunctuation(token);
	      case '@forSome':
	        if (!this._n3Mode) return this._error('Unexpected "@forSome"', token);
	        this._subject = null;
	        this._predicate = this.N3_FORSOME;
	        this._quantifier = 'blankNode';
	        return this._readQuantifierList;
	      case '@forAll':
	        if (!this._n3Mode) return this._error('Unexpected "@forAll"', token);
	        this._subject = null;
	        this._predicate = this.N3_FORALL;
	        this._quantifier = 'variable';
	        return this._readQuantifierList;
	      case 'literal':
	        if (!this._n3Mode) return this._error('Unexpected literal', token);
	        if (token.prefix.length === 0) {
	          this._literalValue = token.value;
	          return this._completeSubjectLiteral;
	        } else this._subject = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
	        break;
	      case '<<':
	        if (!this._supportsRDFStar) return this._error('Unexpected RDF-star syntax', token);
	        this._saveContext('<<', this._graph, null, null, null);
	        this._graph = null;
	        return this._readSubject;
	      default:
	        // Read the subject entity
	        if ((this._subject = this._readEntity(token)) === undefined) return;
	        // In N3 mode, the subject might be a path
	        if (this._n3Mode) return this._getPathReader(this._readPredicateOrNamedGraph);
	    }

	    // The next token must be a predicate,
	    // or, if the subject was actually a graph IRI, a named graph
	    return this._readPredicateOrNamedGraph;
	  }

	  // ### `_readPredicate` reads a quad's predicate
	  _readPredicate(token) {
	    var type = token.type;
	    switch (type) {
	      case 'inverse':
	        this._inversePredicate = true;
	      case 'abbreviation':
	        this._predicate = this.ABBREVIATIONS[token.value];
	        break;
	      case '.':
	      case ']':
	      case '}':
	        // Expected predicate didn't come, must have been trailing semicolon
	        if (this._predicate === null) return this._error("Unexpected ".concat(type), token);
	        this._subject = null;
	        return type === ']' ? this._readBlankNodeTail(token) : this._readPunctuation(token);
	      case ';':
	        // Additional semicolons can be safely ignored
	        return this._predicate !== null ? this._readPredicate : this._error('Expected predicate but got ;', token);
	      case '[':
	        if (this._n3Mode) {
	          // Start a new quad with a new blank node as subject
	          this._saveContext('blank', this._graph, this._subject, this._subject = this._factory.blankNode(), null);
	          return this._readBlankNodeHead;
	        }
	      case 'blank':
	        if (!this._n3Mode) return this._error('Disallowed blank node as predicate', token);
	      default:
	        if ((this._predicate = this._readEntity(token)) === undefined) return;
	    }
	    // The next token must be an object
	    return this._readObject;
	  }

	  // ### `_readObject` reads a quad's object
	  _readObject(token) {
	    switch (token.type) {
	      case 'literal':
	        // Regular literal, can still get a datatype or language
	        if (token.prefix.length === 0) {
	          this._literalValue = token.value;
	          return this._readDataTypeOrLang;
	        }
	        // Pre-datatyped string literal (prefix stores the datatype)
	        else this._object = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
	        break;
	      case '[':
	        // Start a new quad with a new blank node as subject
	        this._saveContext('blank', this._graph, this._subject, this._predicate, this._subject = this._factory.blankNode());
	        return this._readBlankNodeHead;
	      case '(':
	        // Start a new list
	        this._saveContext('list', this._graph, this._subject, this._predicate, this.RDF_NIL);
	        this._subject = null;
	        return this._readListItem;
	      case '{':
	        // Start a new formula
	        if (!this._n3Mode) return this._error('Unexpected graph', token);
	        this._saveContext('formula', this._graph, this._subject, this._predicate, this._graph = this._factory.blankNode());
	        return this._readSubject;
	      case '<<':
	        if (!this._supportsRDFStar) return this._error('Unexpected RDF-star syntax', token);
	        this._saveContext('<<', this._graph, this._subject, this._predicate, null);
	        this._graph = null;
	        return this._readSubject;
	      default:
	        // Read the object entity
	        if ((this._object = this._readEntity(token)) === undefined) return;
	        // In N3 mode, the object might be a path
	        if (this._n3Mode) return this._getPathReader(this._getContextEndReader());
	    }
	    return this._getContextEndReader();
	  }

	  // ### `_readPredicateOrNamedGraph` reads a quad's predicate, or a named graph
	  _readPredicateOrNamedGraph(token) {
	    return token.type === '{' ? this._readGraph(token) : this._readPredicate(token);
	  }

	  // ### `_readGraph` reads a graph
	  _readGraph(token) {
	    if (token.type !== '{') return this._error("Expected graph but got ".concat(token.type), token);
	    // The "subject" we read is actually the GRAPH's label
	    this._graph = this._subject, this._subject = null;
	    return this._readSubject;
	  }

	  // ### `_readBlankNodeHead` reads the head of a blank node
	  _readBlankNodeHead(token) {
	    if (token.type === ']') {
	      this._subject = null;
	      return this._readBlankNodeTail(token);
	    } else {
	      this._predicate = null;
	      return this._readPredicate(token);
	    }
	  }

	  // ### `_readBlankNodeTail` reads the end of a blank node
	  _readBlankNodeTail(token) {
	    if (token.type !== ']') return this._readBlankNodePunctuation(token);

	    // Store blank node quad
	    if (this._subject !== null) this._emit(this._subject, this._predicate, this._object, this._graph);

	    // Restore the parent context containing this blank node
	    var empty = this._predicate === null;
	    this._restoreContext('blank', token);
	    // If the blank node was the object, restore previous context and read punctuation
	    if (this._object !== null) return this._getContextEndReader();
	    // If the blank node was the predicate, continue reading the object
	    else if (this._predicate !== null) return this._readObject;
	    // If the blank node was the subject, continue reading the predicate
	    else
	      // If the blank node was empty, it could be a named graph label
	      return empty ? this._readPredicateOrNamedGraph : this._readPredicateAfterBlank;
	  }

	  // ### `_readPredicateAfterBlank` reads a predicate after an anonymous blank node
	  _readPredicateAfterBlank(token) {
	    switch (token.type) {
	      case '.':
	      case '}':
	        // No predicate is coming if the triple is terminated here
	        this._subject = null;
	        return this._readPunctuation(token);
	      default:
	        return this._readPredicate(token);
	    }
	  }

	  // ### `_readListItem` reads items from a list
	  _readListItem(token) {
	    var item = null,
	      // The item of the list
	      list = null,
	      // The list itself
	      next = this._readListItem; // The next function to execute
	    var previousList = this._subject,
	      // The previous list that contains this list
	      stack = this._contextStack,
	      // The stack of parent contexts
	      parent = stack[stack.length - 1]; // The parent containing the current list

	    switch (token.type) {
	      case '[':
	        // Stack the current list quad and start a new quad with a blank node as subject
	        this._saveContext('blank', this._graph, list = this._factory.blankNode(), this.RDF_FIRST, this._subject = item = this._factory.blankNode());
	        next = this._readBlankNodeHead;
	        break;
	      case '(':
	        // Stack the current list quad and start a new list
	        this._saveContext('list', this._graph, list = this._factory.blankNode(), this.RDF_FIRST, this.RDF_NIL);
	        this._subject = null;
	        break;
	      case ')':
	        // Closing the list; restore the parent context
	        this._restoreContext('list', token);
	        // If this list is contained within a parent list, return the membership quad here.
	        // This will be `<parent list element> rdf:first <this list>.`.
	        if (stack.length !== 0 && stack[stack.length - 1].type === 'list') this._emit(this._subject, this._predicate, this._object, this._graph);
	        // Was this list the parent's subject?
	        if (this._predicate === null) {
	          // The next token is the predicate
	          next = this._readPredicate;
	          // No list tail if this was an empty list
	          if (this._subject === this.RDF_NIL) return next;
	        }
	        // The list was in the parent context's object
	        else {
	          next = this._getContextEndReader();
	          // No list tail if this was an empty list
	          if (this._object === this.RDF_NIL) return next;
	        }
	        // Close the list by making the head nil
	        list = this.RDF_NIL;
	        break;
	      case 'literal':
	        // Regular literal, can still get a datatype or language
	        if (token.prefix.length === 0) {
	          this._literalValue = token.value;
	          next = this._readListItemDataTypeOrLang;
	        }
	        // Pre-datatyped string literal (prefix stores the datatype)
	        else {
	          item = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
	          next = this._getContextEndReader();
	        }
	        break;
	      case '{':
	        // Start a new formula
	        if (!this._n3Mode) return this._error('Unexpected graph', token);
	        this._saveContext('formula', this._graph, this._subject, this._predicate, this._graph = this._factory.blankNode());
	        return this._readSubject;
	      default:
	        if ((item = this._readEntity(token)) === undefined) return;
	    }

	    // Create a new blank node if no item head was assigned yet
	    if (list === null) this._subject = list = this._factory.blankNode();

	    // Is this the first element of the list?
	    if (previousList === null) {
	      // This list is either the subject or the object of its parent
	      if (parent.predicate === null) parent.subject = list;else parent.object = list;
	    } else {
	      // Continue the previous list with the current list
	      this._emit(previousList, this.RDF_REST, list, this._graph);
	    }
	    // If an item was read, add it to the list
	    if (item !== null) {
	      // In N3 mode, the item might be a path
	      if (this._n3Mode && (token.type === 'IRI' || token.type === 'prefixed')) {
	        // Create a new context to add the item's path
	        this._saveContext('item', this._graph, list, this.RDF_FIRST, item);
	        this._subject = item, this._predicate = null;
	        // _readPath will restore the context and output the item
	        return this._getPathReader(this._readListItem);
	      }
	      // Output the item
	      this._emit(list, this.RDF_FIRST, item, this._graph);
	    }
	    return next;
	  }

	  // ### `_readDataTypeOrLang` reads an _optional_ datatype or language
	  _readDataTypeOrLang(token) {
	    return this._completeObjectLiteral(token, false);
	  }

	  // ### `_readListItemDataTypeOrLang` reads an _optional_ datatype or language in a list
	  _readListItemDataTypeOrLang(token) {
	    return this._completeObjectLiteral(token, true);
	  }

	  // ### `_completeLiteral` completes a literal with an optional datatype or language
	  _completeLiteral(token) {
	    // Create a simple string literal by default
	    var literal = this._factory.literal(this._literalValue);
	    switch (token.type) {
	      // Create a datatyped literal
	      case 'type':
	      case 'typeIRI':
	        var datatype = this._readEntity(token);
	        if (datatype === undefined) return; // No datatype means an error occurred
	        literal = this._factory.literal(this._literalValue, datatype);
	        token = null;
	        break;
	      // Create a language-tagged string
	      case 'langcode':
	        literal = this._factory.literal(this._literalValue, token.value);
	        token = null;
	        break;
	    }
	    return {
	      token,
	      literal
	    };
	  }

	  // Completes a literal in subject position
	  _completeSubjectLiteral(token) {
	    this._subject = this._completeLiteral(token).literal;
	    return this._readPredicateOrNamedGraph;
	  }

	  // Completes a literal in object position
	  _completeObjectLiteral(token, listItem) {
	    var completed = this._completeLiteral(token);
	    if (!completed) return;
	    this._object = completed.literal;

	    // If this literal was part of a list, write the item
	    // (we could also check the context stack, but passing in a flag is faster)
	    if (listItem) this._emit(this._subject, this.RDF_FIRST, this._object, this._graph);
	    // If the token was consumed, continue with the rest of the input
	    if (completed.token === null) return this._getContextEndReader();
	    // Otherwise, consume the token now
	    else {
	      this._readCallback = this._getContextEndReader();
	      return this._readCallback(completed.token);
	    }
	  }

	  // ### `_readFormulaTail` reads the end of a formula
	  _readFormulaTail(token) {
	    if (token.type !== '}') return this._readPunctuation(token);

	    // Store the last quad of the formula
	    if (this._subject !== null) this._emit(this._subject, this._predicate, this._object, this._graph);

	    // Restore the parent context containing this formula
	    this._restoreContext('formula', token);
	    // If the formula was the subject, continue reading the predicate.
	    // If the formula was the object, read punctuation.
	    return this._object === null ? this._readPredicate : this._getContextEndReader();
	  }

	  // ### `_readPunctuation` reads punctuation between quads or quad parts
	  _readPunctuation(token) {
	    var next,
	      graph = this._graph;
	    var subject = this._subject,
	      inversePredicate = this._inversePredicate;
	    switch (token.type) {
	      // A closing brace ends a graph
	      case '}':
	        if (this._graph === null) return this._error('Unexpected graph closing', token);
	        if (this._n3Mode) return this._readFormulaTail(token);
	        this._graph = null;
	      // A dot just ends the statement, without sharing anything with the next
	      case '.':
	        this._subject = null;
	        next = this._contextStack.length ? this._readSubject : this._readInTopContext;
	        if (inversePredicate) this._inversePredicate = false;
	        break;
	      // Semicolon means the subject is shared; predicate and object are different
	      case ';':
	        next = this._readPredicate;
	        break;
	      // Comma means both the subject and predicate are shared; the object is different
	      case ',':
	        next = this._readObject;
	        break;
	      // {| means that the current triple is annotated with predicate-object pairs.
	      case '{|':
	        if (!this._supportsRDFStar) return this._error('Unexpected RDF-star syntax', token);
	        // Continue using the last triple as quoted triple subject for the predicate-object pairs.
	        var predicate = this._predicate,
	          object = this._object;
	        this._subject = this._factory.quad(subject, predicate, object, this.DEFAULTGRAPH);
	        next = this._readPredicate;
	        break;
	      // |} means that the current quoted triple in annotation syntax is finalized.
	      case '|}':
	        if (this._subject.termType !== 'Quad') return this._error('Unexpected asserted triple closing', token);
	        this._subject = null;
	        next = this._readPunctuation;
	        break;
	      default:
	        // An entity means this is a quad (only allowed if not already inside a graph)
	        if (this._supportsQuads && this._graph === null && (graph = this._readEntity(token)) !== undefined) {
	          next = this._readQuadPunctuation;
	          break;
	        }
	        return this._error("Expected punctuation to follow \"".concat(this._object.id, "\""), token);
	    }
	    // A quad has been completed now, so return it
	    if (subject !== null) {
	      var _predicate = this._predicate,
	        _object = this._object;
	      if (!inversePredicate) this._emit(subject, _predicate, _object, graph);else this._emit(_object, _predicate, subject, graph);
	    }
	    return next;
	  }

	  // ### `_readBlankNodePunctuation` reads punctuation in a blank node
	  _readBlankNodePunctuation(token) {
	    var next;
	    switch (token.type) {
	      // Semicolon means the subject is shared; predicate and object are different
	      case ';':
	        next = this._readPredicate;
	        break;
	      // Comma means both the subject and predicate are shared; the object is different
	      case ',':
	        next = this._readObject;
	        break;
	      default:
	        return this._error("Expected punctuation to follow \"".concat(this._object.id, "\""), token);
	    }
	    // A quad has been completed now, so return it
	    this._emit(this._subject, this._predicate, this._object, this._graph);
	    return next;
	  }

	  // ### `_readQuadPunctuation` reads punctuation after a quad
	  _readQuadPunctuation(token) {
	    if (token.type !== '.') return this._error('Expected dot to follow quad', token);
	    return this._readInTopContext;
	  }

	  // ### `_readPrefix` reads the prefix of a prefix declaration
	  _readPrefix(token) {
	    if (token.type !== 'prefix') return this._error('Expected prefix to follow @prefix', token);
	    this._prefix = token.value;
	    return this._readPrefixIRI;
	  }

	  // ### `_readPrefixIRI` reads the IRI of a prefix declaration
	  _readPrefixIRI(token) {
	    if (token.type !== 'IRI') return this._error("Expected IRI to follow prefix \"".concat(this._prefix, ":\""), token);
	    var prefixNode = this._readEntity(token);
	    this._prefixes[this._prefix] = prefixNode.value;
	    this._prefixCallback(this._prefix, prefixNode);
	    return this._readDeclarationPunctuation;
	  }

	  // ### `_readBaseIRI` reads the IRI of a base declaration
	  _readBaseIRI(token) {
	    var iri = token.type === 'IRI' && this._resolveIRI(token.value);
	    if (!iri) return this._error('Expected valid IRI to follow base declaration', token);
	    this._setBase(iri);
	    return this._readDeclarationPunctuation;
	  }

	  // ### `_readNamedGraphLabel` reads the label of a named graph
	  _readNamedGraphLabel(token) {
	    switch (token.type) {
	      case 'IRI':
	      case 'blank':
	      case 'prefixed':
	        return this._readSubject(token), this._readGraph;
	      case '[':
	        return this._readNamedGraphBlankLabel;
	      default:
	        return this._error('Invalid graph label', token);
	    }
	  }

	  // ### `_readNamedGraphLabel` reads a blank node label of a named graph
	  _readNamedGraphBlankLabel(token) {
	    if (token.type !== ']') return this._error('Invalid graph label', token);
	    this._subject = this._factory.blankNode();
	    return this._readGraph;
	  }

	  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration
	  _readDeclarationPunctuation(token) {
	    // SPARQL-style declarations don't have punctuation
	    if (this._sparqlStyle) {
	      this._sparqlStyle = false;
	      return this._readInTopContext(token);
	    }
	    if (token.type !== '.') return this._error('Expected declaration to end with a dot', token);
	    return this._readInTopContext;
	  }

	  // Reads a list of quantified symbols from a @forSome or @forAll statement
	  _readQuantifierList(token) {
	    var entity;
	    switch (token.type) {
	      case 'IRI':
	      case 'prefixed':
	        if ((entity = this._readEntity(token, true)) !== undefined) break;
	      default:
	        return this._error("Unexpected ".concat(token.type), token);
	    }
	    // Without explicit quantifiers, map entities to a quantified entity
	    if (!this._explicitQuantifiers) this._quantified[entity.id] = this._factory[this._quantifier](this._factory.blankNode().value);
	    // With explicit quantifiers, output the reified quantifier
	    else {
	      // If this is the first item, start a new quantifier list
	      if (this._subject === null) this._emit(this._graph || this.DEFAULTGRAPH, this._predicate, this._subject = this._factory.blankNode(), this.QUANTIFIERS_GRAPH);
	      // Otherwise, continue the previous list
	      else this._emit(this._subject, this.RDF_REST, this._subject = this._factory.blankNode(), this.QUANTIFIERS_GRAPH);
	      // Output the list item
	      this._emit(this._subject, this.RDF_FIRST, entity, this.QUANTIFIERS_GRAPH);
	    }
	    return this._readQuantifierPunctuation;
	  }

	  // Reads punctuation from a @forSome or @forAll statement
	  _readQuantifierPunctuation(token) {
	    // Read more quantifiers
	    if (token.type === ',') return this._readQuantifierList;
	    // End of the quantifier list
	    else {
	      // With explicit quantifiers, close the quantifier list
	      if (this._explicitQuantifiers) {
	        this._emit(this._subject, this.RDF_REST, this.RDF_NIL, this.QUANTIFIERS_GRAPH);
	        this._subject = null;
	      }
	      // Read a dot
	      this._readCallback = this._getContextEndReader();
	      return this._readCallback(token);
	    }
	  }

	  // ### `_getPathReader` reads a potential path and then resumes with the given function
	  _getPathReader(afterPath) {
	    this._afterPath = afterPath;
	    return this._readPath;
	  }

	  // ### `_readPath` reads a potential path
	  _readPath(token) {
	    switch (token.type) {
	      // Forward path
	      case '!':
	        return this._readForwardPath;
	      // Backward path
	      case '^':
	        return this._readBackwardPath;
	      // Not a path; resume reading where we left off
	      default:
	        var stack = this._contextStack,
	          parent = stack.length && stack[stack.length - 1];
	        // If we were reading a list item, we still need to output it
	        if (parent && parent.type === 'item') {
	          // The list item is the remaining subejct after reading the path
	          var item = this._subject;
	          // Switch back to the context of the list
	          this._restoreContext('item', token);
	          // Output the list item
	          this._emit(this._subject, this.RDF_FIRST, item, this._graph);
	        }
	        return this._afterPath(token);
	    }
	  }

	  // ### `_readForwardPath` reads a '!' path
	  _readForwardPath(token) {
	    var subject, predicate;
	    var object = this._factory.blankNode();
	    // The next token is the predicate
	    if ((predicate = this._readEntity(token)) === undefined) return;
	    // If we were reading a subject, replace the subject by the path's object
	    if (this._predicate === null) subject = this._subject, this._subject = object;
	    // If we were reading an object, replace the subject by the path's object
	    else subject = this._object, this._object = object;
	    // Emit the path's current quad and read its next section
	    this._emit(subject, predicate, object, this._graph);
	    return this._readPath;
	  }

	  // ### `_readBackwardPath` reads a '^' path
	  _readBackwardPath(token) {
	    var subject = this._factory.blankNode();
	    var predicate, object;
	    // The next token is the predicate
	    if ((predicate = this._readEntity(token)) === undefined) return;
	    // If we were reading a subject, replace the subject by the path's subject
	    if (this._predicate === null) object = this._subject, this._subject = subject;
	    // If we were reading an object, replace the subject by the path's subject
	    else object = this._object, this._object = subject;
	    // Emit the path's current quad and read its next section
	    this._emit(subject, predicate, object, this._graph);
	    return this._readPath;
	  }

	  // ### `_readRDFStarTailOrGraph` reads the graph of a nested RDF-star quad or the end of a nested RDF-star triple
	  _readRDFStarTailOrGraph(token) {
	    if (token.type !== '>>') {
	      // An entity means this is a quad (only allowed if not already inside a graph)
	      if (this._supportsQuads && this._graph === null && (this._graph = this._readEntity(token)) !== undefined) return this._readRDFStarTail;
	      return this._error("Expected >> to follow \"".concat(this._object.id, "\""), token);
	    }
	    return this._readRDFStarTail(token);
	  }

	  // ### `_readRDFStarTail` reads the end of a nested RDF-star triple
	  _readRDFStarTail(token) {
	    if (token.type !== '>>') return this._error("Expected >> but got ".concat(token.type), token);
	    // Read the quad and restore the previous context
	    var quad = this._factory.quad(this._subject, this._predicate, this._object, this._graph || this.DEFAULTGRAPH);
	    this._restoreContext('<<', token);
	    // If the triple was the subject, continue by reading the predicate.
	    if (this._subject === null) {
	      this._subject = quad;
	      return this._readPredicate;
	    }
	    // If the triple was the object, read context end.
	    else {
	      this._object = quad;
	      return this._getContextEndReader();
	    }
	  }

	  // ### `_getContextEndReader` gets the next reader function at the end of a context
	  _getContextEndReader() {
	    var contextStack = this._contextStack;
	    if (!contextStack.length) return this._readPunctuation;
	    switch (contextStack[contextStack.length - 1].type) {
	      case 'blank':
	        return this._readBlankNodeTail;
	      case 'list':
	        return this._readListItem;
	      case 'formula':
	        return this._readFormulaTail;
	      case '<<':
	        return this._readRDFStarTailOrGraph;
	    }
	  }

	  // ### `_emit` sends a quad through the callback
	  _emit(subject, predicate, object, graph) {
	    this._callback(null, this._factory.quad(subject, predicate, object, graph || this.DEFAULTGRAPH));
	  }

	  // ### `_error` emits an error message through the callback
	  _error(message, token) {
	    var err = new Error("".concat(message, " on line ").concat(token.line, "."));
	    err.context = {
	      token: token,
	      line: token.line,
	      previousToken: this._lexer.previousToken
	    };
	    this._callback(err);
	    this._callback = noop;
	  }

	  // ### `_resolveIRI` resolves an IRI against the base path
	  _resolveIRI(iri) {
	    return /^[a-z][a-z0-9+.-]*:/i.test(iri) ? iri : this._resolveRelativeIRI(iri);
	  }

	  // ### `_resolveRelativeIRI` resolves an IRI against the base path,
	  // assuming that a base path has been set and that the IRI is indeed relative
	  _resolveRelativeIRI(iri) {
	    // An empty relative IRI indicates the base IRI
	    if (!iri.length) return this._base;
	    // Decide resolving strategy based in the first character
	    switch (iri[0]) {
	      // Resolve relative fragment IRIs against the base IRI
	      case '#':
	        return this._base + iri;
	      // Resolve relative query string IRIs by replacing the query string
	      case '?':
	        return this._base.replace(/(?:\?.*)?$/, iri);
	      // Resolve root-relative IRIs at the root of the base IRI
	      case '/':
	        // Resolve scheme-relative IRIs to the scheme
	        return (iri[1] === '/' ? this._baseScheme : this._baseRoot) + this._removeDotSegments(iri);
	      // Resolve all other IRIs at the base IRI's path
	      default:
	        // Relative IRIs cannot contain a colon in the first path segment
	        return /^[^/:]*:/.test(iri) ? null : this._removeDotSegments(this._basePath + iri);
	    }
	  }

	  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986
	  _removeDotSegments(iri) {
	    // Don't modify the IRI if it does not contain any dot segments
	    if (!/(^|\/)\.\.?($|[/#?])/.test(iri)) return iri;

	    // Start with an imaginary slash before the IRI in order to resolve trailing './' and '../'
	    var length = iri.length;
	    var result = '',
	      i = -1,
	      pathStart = -1,
	      segmentStart = 0,
	      next = '/';
	    while (i < length) {
	      switch (next) {
	        // The path starts with the first slash after the authority
	        case ':':
	          if (pathStart < 0) {
	            // Skip two slashes before the authority
	            if (iri[++i] === '/' && iri[++i] === '/')
	              // Skip to slash after the authority
	              while ((pathStart = i + 1) < length && iri[pathStart] !== '/') i = pathStart;
	          }
	          break;
	        // Don't modify a query string or fragment
	        case '?':
	        case '#':
	          i = length;
	          break;
	        // Handle '/.' or '/..' path segments
	        case '/':
	          if (iri[i + 1] === '.') {
	            next = iri[++i + 1];
	            switch (next) {
	              // Remove a '/.' segment
	              case '/':
	                result += iri.substring(segmentStart, i - 1);
	                segmentStart = i + 1;
	                break;
	              // Remove a trailing '/.' segment
	              case undefined:
	              case '?':
	              case '#':
	                return result + iri.substring(segmentStart, i) + iri.substr(i + 1);
	              // Remove a '/..' segment
	              case '.':
	                next = iri[++i + 1];
	                if (next === undefined || next === '/' || next === '?' || next === '#') {
	                  result += iri.substring(segmentStart, i - 2);
	                  // Try to remove the parent path from result
	                  if ((segmentStart = result.lastIndexOf('/')) >= pathStart) result = result.substr(0, segmentStart);
	                  // Remove a trailing '/..' segment
	                  if (next !== '/') return "".concat(result, "/").concat(iri.substr(i + 1));
	                  segmentStart = i + 1;
	                }
	            }
	          }
	      }
	      next = iri[++i];
	    }
	    return result + iri.substring(segmentStart);
	  }

	  // ## Public methods

	  // ### `parse` parses the N3 input and emits each parsed quad through the onQuad callback.
	  parse(input, quadCallback, prefixCallback) {
	    // The second parameter accepts an object { onQuad: ..., onPrefix: ..., onComment: ...}
	    // As a second and third parameter it still accepts a separate quadCallback and prefixCallback for backward compatibility as well
	    var onQuad, onPrefix, onComment;
	    if (quadCallback && (quadCallback.onQuad || quadCallback.onPrefix || quadCallback.onComment)) {
	      onQuad = quadCallback.onQuad;
	      onPrefix = quadCallback.onPrefix;
	      onComment = quadCallback.onComment;
	    } else {
	      onQuad = quadCallback;
	      onPrefix = prefixCallback;
	    }
	    // The read callback is the next function to be executed when a token arrives.
	    // We start reading in the top context.
	    this._readCallback = this._readInTopContext;
	    this._sparqlStyle = false;
	    this._prefixes = Object.create(null);
	    this._prefixes._ = this._blankNodePrefix ? this._blankNodePrefix.substr(2) : "b".concat(blankNodePrefix++, "_");
	    this._prefixCallback = onPrefix || noop;
	    this._inversePredicate = false;
	    this._quantified = Object.create(null);

	    // Parse synchronously if no quad callback is given
	    if (!onQuad) {
	      var quads = [];
	      var error;
	      this._callback = (e, t) => {
	        e ? error = e : t && quads.push(t);
	      };
	      this._lexer.tokenize(input).every(token => {
	        return this._readCallback = this._readCallback(token);
	      });
	      if (error) throw error;
	      return quads;
	    }
	    var processNextToken = (error, token) => {
	      if (error !== null) this._callback(error), this._callback = noop;else if (this._readCallback) this._readCallback = this._readCallback(token);
	    };

	    // Enable checking for comments on every token when a commentCallback has been set
	    if (onComment) {
	      // Enable the lexer to return comments as tokens first (disabled by default)
	      this._lexer.comments = true;
	      // Patch the processNextToken function
	      processNextToken = (error, token) => {
	        if (error !== null) this._callback(error), this._callback = noop;else if (this._readCallback) {
	          if (token.type === 'comment') onComment(token.value);else this._readCallback = this._readCallback(token);
	        }
	      };
	    }

	    // Parse asynchronously otherwise, executing the read callback when a token arrives
	    this._callback = onQuad;
	    this._lexer.tokenize(input, processNextToken);
	  }
	};

	// The empty function
	N3Parser.default = N3Parser$1;
	function noop() {}

	// Initializes the parser with the given data factory
	function initDataFactory(parser, factory) {
	  parser._factory = factory;
	  parser.DEFAULTGRAPH = factory.defaultGraph();

	  // Set common named nodes
	  parser.RDF_FIRST = factory.namedNode(_IRIs.default.rdf.first);
	  parser.RDF_REST = factory.namedNode(_IRIs.default.rdf.rest);
	  parser.RDF_NIL = factory.namedNode(_IRIs.default.rdf.nil);
	  parser.N3_FORALL = factory.namedNode(_IRIs.default.r.forAll);
	  parser.N3_FORSOME = factory.namedNode(_IRIs.default.r.forSome);
	  parser.ABBREVIATIONS = {
	    'a': factory.namedNode(_IRIs.default.rdf.type),
	    '=': factory.namedNode(_IRIs.default.owl.sameAs),
	    '>': factory.namedNode(_IRIs.default.log.implies)
	  };
	  parser.QUANTIFIERS_GRAPH = factory.namedNode('urn:n3:quantifiers');
	}
	initDataFactory(N3Parser$1.prototype, _N3DataFactory.default);
	return N3Parser;
}

var N3ParserExports = /*@__PURE__*/ requireN3Parser();
var Parser = /*@__PURE__*/getDefaultExportFromCjs(N3ParserExports);

var N3Writer = {};

var N3Util = {};

var hasRequiredN3Util;

function requireN3Util () {
	if (hasRequiredN3Util) return N3Util;
	hasRequiredN3Util = 1;

	Object.defineProperty(N3Util, "__esModule", {
	  value: true
	});
	N3Util.inDefaultGraph = inDefaultGraph;
	N3Util.isBlankNode = isBlankNode;
	N3Util.isDefaultGraph = isDefaultGraph;
	N3Util.isLiteral = isLiteral;
	N3Util.isNamedNode = isNamedNode;
	N3Util.isVariable = isVariable;
	N3Util.prefix = prefix;
	N3Util.prefixes = prefixes;
	var _N3DataFactory = _interopRequireDefault(/*@__PURE__*/ requireN3DataFactory());
	function _interopRequireDefault(e) {
	  return e && e.__esModule ? e : {
	    default: e
	  };
	}
	// **N3Util** provides N3 utility functions.

	// Tests whether the given term represents an IRI
	function isNamedNode(term) {
	  return !!term && term.termType === 'NamedNode';
	}

	// Tests whether the given term represents a blank node
	function isBlankNode(term) {
	  return !!term && term.termType === 'BlankNode';
	}

	// Tests whether the given term represents a literal
	function isLiteral(term) {
	  return !!term && term.termType === 'Literal';
	}

	// Tests whether the given term represents a variable
	function isVariable(term) {
	  return !!term && term.termType === 'Variable';
	}

	// Tests whether the given term represents the default graph
	function isDefaultGraph(term) {
	  return !!term && term.termType === 'DefaultGraph';
	}

	// Tests whether the given quad is in the default graph
	function inDefaultGraph(quad) {
	  return isDefaultGraph(quad.graph);
	}

	// Creates a function that prepends the given IRI to a local name
	function prefix(iri, factory) {
	  return prefixes({
	    '': iri.value || iri
	  }, factory)('');
	}

	// Creates a function that allows registering and expanding prefixes
	function prefixes(defaultPrefixes, factory) {
	  // Add all of the default prefixes
	  var prefixes = Object.create(null);
	  for (var _prefix in defaultPrefixes) processPrefix(_prefix, defaultPrefixes[_prefix]);
	  // Set the default factory if none was specified
	  factory = factory || _N3DataFactory.default;

	  // Registers a new prefix (if an IRI was specified)
	  // or retrieves a function that expands an existing prefix (if no IRI was specified)
	  function processPrefix(prefix, iri) {
	    // Create a new prefix if an IRI is specified or the prefix doesn't exist
	    if (typeof iri === 'string') {
	      // Create a function that expands the prefix
	      var cache = Object.create(null);
	      prefixes[prefix] = local => {
	        return cache[local] || (cache[local] = factory.namedNode(iri + local));
	      };
	    } else if (!(prefix in prefixes)) {
	      throw new Error("Unknown prefix: ".concat(prefix));
	    }
	    return prefixes[prefix];
	  }
	  return processPrefix;
	}
	return N3Util;
}

var hasRequiredN3Writer;

function requireN3Writer () {
	if (hasRequiredN3Writer) return N3Writer;
	hasRequiredN3Writer = 1;

	Object.defineProperty(N3Writer, "__esModule", {
	  value: true
	});
	N3Writer.default = void 0;
	var _IRIs = _interopRequireDefault(/*@__PURE__*/ requireIRIs());
	var _N3DataFactory = _interopRequireWildcard(/*@__PURE__*/ requireN3DataFactory());
	var _N3Util = /*@__PURE__*/ requireN3Util();
	function _getRequireWildcardCache(e) {
	  if ("function" != typeof WeakMap) return null;
	  var r = new WeakMap(),
	    t = new WeakMap();
	  return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
	    return e ? t : r;
	  })(e);
	}
	function _interopRequireWildcard(e, r) {
	  if (e && e.__esModule) return e;
	  if (null === e || "object" != typeof e && "function" != typeof e) return {
	    default: e
	  };
	  var t = _getRequireWildcardCache(r);
	  if (t && t.has(e)) return t.get(e);
	  var n = {
	      __proto__: null
	    },
	    a = Object.defineProperty && Object.getOwnPropertyDescriptor;
	  for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
	    var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
	    i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
	  }
	  return n.default = e, t && t.set(e, n), n;
	}
	function _interopRequireDefault(e) {
	  return e && e.__esModule ? e : {
	    default: e
	  };
	}
	// **N3Writer** writes N3 documents.

	var DEFAULTGRAPH = _N3DataFactory.default.defaultGraph();
	var {
	  rdf,
	  xsd
	} = _IRIs.default;

	// Characters in literals that require escaping
	var escape = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/,
	  escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g,
	  escapedCharacters = {
	    '\\': '\\\\',
	    '"': '\\"',
	    '\t': '\\t',
	    '\n': '\\n',
	    '\r': '\\r',
	    '\b': '\\b',
	    '\f': '\\f'
	  };

	// ## Placeholder class to represent already pretty-printed terms
	class SerializedTerm extends _N3DataFactory.Term {
	  // Pretty-printed nodes are not equal to any other node
	  // (e.g., [] does not equal [])
	  equals(other) {
	    return other === this;
	  }
	}

	// ## Constructor
	let N3Writer$1 = class N3Writer {
	  constructor(outputStream, options) {
	    // ### `_prefixRegex` matches a prefixed name or IRI that begins with one of the added prefixes
	    this._prefixRegex = /$0^/;

	    // Shift arguments if the first argument is not a stream
	    if (outputStream && typeof outputStream.write !== 'function') options = outputStream, outputStream = null;
	    options = options || {};
	    this._lists = options.lists;

	    // If no output stream given, send the output as string through the end callback
	    if (!outputStream) {
	      var output = '';
	      this._outputStream = {
	        write(chunk, encoding, done) {
	          output += chunk;
	          done && done();
	        },
	        end: done => {
	          done && done(null, output);
	        }
	      };
	      this._endStream = true;
	    } else {
	      this._outputStream = outputStream;
	      this._endStream = options.end === undefined ? true : !!options.end;
	    }

	    // Initialize writer, depending on the format
	    this._subject = null;
	    if (!/triple|quad/i.test(options.format)) {
	      this._lineMode = false;
	      this._graph = DEFAULTGRAPH;
	      this._prefixIRIs = Object.create(null);
	      options.prefixes && this.addPrefixes(options.prefixes);
	      if (options.baseIRI) {
	        this._baseMatcher = new RegExp("^".concat(escapeRegex(options.baseIRI)).concat(options.baseIRI.endsWith('/') ? '' : '[#?]'));
	        this._baseLength = options.baseIRI.length;
	      }
	    } else {
	      this._lineMode = true;
	      this._writeQuad = this._writeQuadLine;
	    }
	  }

	  // ## Private methods

	  // ### Whether the current graph is the default graph
	  get _inDefaultGraph() {
	    return DEFAULTGRAPH.equals(this._graph);
	  }

	  // ### `_write` writes the argument to the output stream
	  _write(string, callback) {
	    this._outputStream.write(string, 'utf8', callback);
	  }

	  // ### `_writeQuad` writes the quad to the output stream
	  _writeQuad(subject, predicate, object, graph, done) {
	    try {
	      // Write the graph's label if it has changed
	      if (!graph.equals(this._graph)) {
	        // Close the previous graph and start the new one
	        this._write((this._subject === null ? '' : this._inDefaultGraph ? '.\n' : '\n}\n') + (DEFAULTGRAPH.equals(graph) ? '' : "".concat(this._encodeIriOrBlank(graph), " {\n")));
	        this._graph = graph;
	        this._subject = null;
	      }
	      // Don't repeat the subject if it's the same
	      if (subject.equals(this._subject)) {
	        // Don't repeat the predicate if it's the same
	        if (predicate.equals(this._predicate)) this._write(", ".concat(this._encodeObject(object)), done);
	        // Same subject, different predicate
	        else this._write(";\n    ".concat(this._encodePredicate(this._predicate = predicate), " ").concat(this._encodeObject(object)), done);
	      }
	      // Different subject; write the whole quad
	      else this._write("".concat((this._subject === null ? '' : '.\n') + this._encodeSubject(this._subject = subject), " ").concat(this._encodePredicate(this._predicate = predicate), " ").concat(this._encodeObject(object)), done);
	    } catch (error) {
	      done && done(error);
	    }
	  }

	  // ### `_writeQuadLine` writes the quad to the output stream as a single line
	  _writeQuadLine(subject, predicate, object, graph, done) {
	    // Write the quad without prefixes
	    delete this._prefixMatch;
	    this._write(this.quadToString(subject, predicate, object, graph), done);
	  }

	  // ### `quadToString` serializes a quad as a string
	  quadToString(subject, predicate, object, graph) {
	    return "".concat(this._encodeSubject(subject), " ").concat(this._encodeIriOrBlank(predicate), " ").concat(this._encodeObject(object)).concat(graph && graph.value ? " ".concat(this._encodeIriOrBlank(graph), " .\n") : ' .\n');
	  }

	  // ### `quadsToString` serializes an array of quads as a string
	  quadsToString(quads) {
	    var quadsString = '';
	    for (var quad of quads) quadsString += this.quadToString(quad.subject, quad.predicate, quad.object, quad.graph);
	    return quadsString;
	  }

	  // ### `_encodeSubject` represents a subject
	  _encodeSubject(entity) {
	    return entity.termType === 'Quad' ? this._encodeQuad(entity) : this._encodeIriOrBlank(entity);
	  }

	  // ### `_encodeIriOrBlank` represents an IRI or blank node
	  _encodeIriOrBlank(entity) {
	    // A blank node or list is represented as-is
	    if (entity.termType !== 'NamedNode') {
	      // If it is a list head, pretty-print it
	      if (this._lists && entity.value in this._lists) entity = this.list(this._lists[entity.value]);
	      return 'id' in entity ? entity.id : "_:".concat(entity.value);
	    }
	    var iri = entity.value;
	    // Use relative IRIs if requested and possible
	    if (this._baseMatcher && this._baseMatcher.test(iri)) iri = iri.substr(this._baseLength);
	    // Escape special characters
	    if (escape.test(iri)) iri = iri.replace(escapeAll, characterReplacer);
	    // Try to represent the IRI as prefixed name
	    var prefixMatch = this._prefixRegex.exec(iri);
	    return !prefixMatch ? "<".concat(iri, ">") : !prefixMatch[1] ? iri : this._prefixIRIs[prefixMatch[1]] + prefixMatch[2];
	  }

	  // ### `_encodeLiteral` represents a literal
	  _encodeLiteral(literal) {
	    // Escape special characters
	    var value = literal.value;
	    if (escape.test(value)) value = value.replace(escapeAll, characterReplacer);

	    // Write a language-tagged literal
	    if (literal.language) return "\"".concat(value, "\"@").concat(literal.language);

	    // Write dedicated literals per data type
	    if (this._lineMode) {
	      // Only abbreviate strings in N-Triples or N-Quads
	      if (literal.datatype.value === xsd.string) return "\"".concat(value, "\"");
	    } else {
	      // Use common datatype abbreviations in Turtle or TriG
	      switch (literal.datatype.value) {
	        case xsd.string:
	          return "\"".concat(value, "\"");
	        case xsd.boolean:
	          if (value === 'true' || value === 'false') return value;
	          break;
	        case xsd.integer:
	          if (/^[+-]?\d+$/.test(value)) return value;
	          break;
	        case xsd.decimal:
	          if (/^[+-]?\d*\.\d+$/.test(value)) return value;
	          break;
	        case xsd.double:
	          if (/^[+-]?(?:\d+\.\d*|\.?\d+)[eE][+-]?\d+$/.test(value)) return value;
	          break;
	      }
	    }

	    // Write a regular datatyped literal
	    return "\"".concat(value, "\"^^").concat(this._encodeIriOrBlank(literal.datatype));
	  }

	  // ### `_encodePredicate` represents a predicate
	  _encodePredicate(predicate) {
	    return predicate.value === rdf.type ? 'a' : this._encodeIriOrBlank(predicate);
	  }

	  // ### `_encodeObject` represents an object
	  _encodeObject(object) {
	    switch (object.termType) {
	      case 'Quad':
	        return this._encodeQuad(object);
	      case 'Literal':
	        return this._encodeLiteral(object);
	      default:
	        return this._encodeIriOrBlank(object);
	    }
	  }

	  // ### `_encodeQuad` encodes an RDF-star quad
	  _encodeQuad(_ref) {
	    var {
	      subject,
	      predicate,
	      object,
	      graph
	    } = _ref;
	    return "<<".concat(this._encodeSubject(subject), " ").concat(this._encodePredicate(predicate), " ").concat(this._encodeObject(object)).concat((0, _N3Util.isDefaultGraph)(graph) ? '' : " ".concat(this._encodeIriOrBlank(graph)), ">>");
	  }

	  // ### `_blockedWrite` replaces `_write` after the writer has been closed
	  _blockedWrite() {
	    throw new Error('Cannot write because the writer has been closed.');
	  }

	  // ### `addQuad` adds the quad to the output stream
	  addQuad(subject, predicate, object, graph, done) {
	    // The quad was given as an object, so shift parameters
	    if (object === undefined) this._writeQuad(subject.subject, subject.predicate, subject.object, subject.graph, predicate);
	    // The optional `graph` parameter was not provided
	    else if (typeof graph === 'function') this._writeQuad(subject, predicate, object, DEFAULTGRAPH, graph);
	    // The `graph` parameter was provided
	    else this._writeQuad(subject, predicate, object, graph || DEFAULTGRAPH, done);
	  }

	  // ### `addQuads` adds the quads to the output stream
	  addQuads(quads) {
	    for (var i = 0; i < quads.length; i++) this.addQuad(quads[i]);
	  }

	  // ### `addPrefix` adds the prefix to the output stream
	  addPrefix(prefix, iri, done) {
	    var prefixes = {};
	    prefixes[prefix] = iri;
	    this.addPrefixes(prefixes, done);
	  }

	  // ### `addPrefixes` adds the prefixes to the output stream
	  addPrefixes(prefixes, done) {
	    // Ignore prefixes if not supported by the serialization
	    if (!this._prefixIRIs) return done && done();

	    // Write all new prefixes
	    var hasPrefixes = false;
	    for (var prefix in prefixes) {
	      var iri = prefixes[prefix];
	      if (typeof iri !== 'string') iri = iri.value;
	      hasPrefixes = true;
	      // Finish a possible pending quad
	      if (this._subject !== null) {
	        this._write(this._inDefaultGraph ? '.\n' : '\n}\n');
	        this._subject = null, this._graph = '';
	      }
	      // Store and write the prefix
	      this._prefixIRIs[iri] = prefix += ':';
	      this._write("@prefix ".concat(prefix, " <").concat(iri, ">.\n"));
	    }
	    // Recreate the prefix matcher
	    if (hasPrefixes) {
	      var IRIlist = '',
	        prefixList = '';
	      for (var prefixIRI in this._prefixIRIs) {
	        IRIlist += IRIlist ? "|".concat(prefixIRI) : prefixIRI;
	        prefixList += (prefixList ? '|' : '') + this._prefixIRIs[prefixIRI];
	      }
	      IRIlist = escapeRegex(IRIlist);
	      this._prefixRegex = new RegExp("^(?:".concat(prefixList, ")[^/]*$|") + "^(".concat(IRIlist, ")([_a-zA-Z0-9][\\-_a-zA-Z0-9]*)$"));
	    }
	    // End a prefix block with a newline
	    this._write(hasPrefixes ? '\n' : '', done);
	  }

	  // ### `blank` creates a blank node with the given content
	  blank(predicate, object) {
	    var children = predicate,
	      child,
	      length;
	    // Empty blank node
	    if (predicate === undefined) children = [];
	    // Blank node passed as blank(Term("predicate"), Term("object"))
	    else if (predicate.termType) children = [{
	      predicate: predicate,
	      object: object
	    }];
	    // Blank node passed as blank({ predicate: predicate, object: object })
	    else if (!('length' in predicate)) children = [predicate];
	    switch (length = children.length) {
	      // Generate an empty blank node
	      case 0:
	        return new SerializedTerm('[]');
	      // Generate a non-nested one-triple blank node
	      case 1:
	        child = children[0];
	        if (!(child.object instanceof SerializedTerm)) return new SerializedTerm("[ ".concat(this._encodePredicate(child.predicate), " ").concat(this._encodeObject(child.object), " ]"));
	      // Generate a multi-triple or nested blank node
	      default:
	        var contents = '[';
	        // Write all triples in order
	        for (var i = 0; i < length; i++) {
	          child = children[i];
	          // Write only the object is the predicate is the same as the previous
	          if (child.predicate.equals(predicate)) contents += ", ".concat(this._encodeObject(child.object));
	          // Otherwise, write the predicate and the object
	          else {
	            contents += "".concat((i ? ';\n  ' : '\n  ') + this._encodePredicate(child.predicate), " ").concat(this._encodeObject(child.object));
	            predicate = child.predicate;
	          }
	        }
	        return new SerializedTerm("".concat(contents, "\n]"));
	    }
	  }

	  // ### `list` creates a list node with the given content
	  list(elements) {
	    var length = elements && elements.length || 0,
	      contents = new Array(length);
	    for (var i = 0; i < length; i++) contents[i] = this._encodeObject(elements[i]);
	    return new SerializedTerm("(".concat(contents.join(' '), ")"));
	  }

	  // ### `end` signals the end of the output stream
	  end(done) {
	    // Finish a possible pending quad
	    if (this._subject !== null) {
	      this._write(this._inDefaultGraph ? '.\n' : '\n}\n');
	      this._subject = null;
	    }
	    // Disallow further writing
	    this._write = this._blockedWrite;

	    // Try to end the underlying stream, ensuring done is called exactly one time
	    var singleDone = done && ((error, result) => {
	      singleDone = null, done(error, result);
	    });
	    if (this._endStream) {
	      try {
	        return this._outputStream.end(singleDone);
	      } catch (error) {/* error closing stream */}
	    }
	    singleDone && singleDone();
	  }
	};

	// Replaces a character by its escaped version
	N3Writer.default = N3Writer$1;
	function characterReplacer(character) {
	  // Replace a single character by its escaped version
	  var result = escapedCharacters[character];
	  if (result === undefined) {
	    // Replace a single character with its 4-bit unicode escape sequence
	    if (character.length === 1) {
	      result = character.charCodeAt(0).toString(16);
	      result = '\\u0000'.substr(0, 6 - result.length) + result;
	    }
	    // Replace a surrogate pair with its 8-bit unicode escape sequence
	    else {
	      result = ((character.charCodeAt(0) - 0xD800) * 0x400 + character.charCodeAt(1) + 0x2400).toString(16);
	      result = '\\U00000000'.substr(0, 10 - result.length) + result;
	    }
	  }
	  return result;
	}
	function escapeRegex(regex) {
	  return regex.replace(/[\]\/\(\)\*\+\?\.\\\$]/g, '\\$&');
	}
	return N3Writer;
}

var N3WriterExports = /*@__PURE__*/ requireN3Writer();
var Writer = /*@__PURE__*/getDefaultExportFromCjs(N3WriterExports);

var serialize = quads => new Promise((resolve, reject) => {
  var writer = new Writer$1({
    format: "N-Triples"
  });
  writer.addQuads(quads);
  writer.end((error, text) => error ? reject(error) : resolve(text));
});
var key = quad => JSON.stringify([quad.subject, quad.predicate, quad.object].map(term => {
  var _term$datatype;
  return [term.termType, term.value, term.language, (_term$datatype = term.datatype) === null || _term$datatype === void 0 ? void 0 : _term$datatype.value];
}));

// Use one parser's blank-node scope for both snapshots. Unchanged blank nodes
// stay untouched; edited blank-node components need an explicit migration.
function buildMetadataPatch(_x, _x2, _x3) {
  return _buildMetadataPatch.apply(this, arguments);
}
function _buildMetadataPatch() {
  _buildMetadataPatch = _asyncToGenerator(function* (previous, next, url) {
    var parse = text => new Parser$1({
      baseIRI: url,
      blankNodePrefix: ""
    }).parse(text);
    var before = parse(previous);
    var after = parse(next);
    var oldKeys = new Set(before.map(key));
    var newKeys = new Set(after.map(key));
    var removed = before.filter(quad => !newKeys.has(key(quad)));
    var added = after.filter(quad => !oldKeys.has(key(quad)));
    if (!removed.length && !added.length) return "";
    if ([...removed, ...added].some(quad => [quad.subject, quad.object].some(term => term.termType === "BlankNode"))) {
      throw new Error("This metadata update changes blank nodes. Preserve their descriptions or assign stable IRIs before editing.");
    }
    var deletes = yield serialize(removed);
    var inserts = yield serialize(added);
    // Omit absent operations: CSS/N3 versions can treat an empty formula as
    // the default graph and then reject the patch's own blank-node subject.
    var operations = [];
    if (removed.length) operations.push("solid:where { ".concat(deletes, " }"), "solid:deletes { ".concat(deletes, " }"));
    if (added.length) operations.push("solid:inserts { ".concat(inserts, " }"));
    return "@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n_:patch a solid:InsertDeletePatch;\n ".concat(operations.join(";\n "), ".\n");
  });
  return _buildMetadataPatch.apply(this, arguments);
}
function writeMetadataTurtle(_x4, _x5, _x6, _x7) {
  return _writeMetadataTurtle.apply(this, arguments);
}
function _writeMetadataTurtle() {
  _writeMetadataTurtle = _asyncToGenerator(function* (url, previous, next, fetch) {
    var {
      etag = ""
    } = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    var response;
    if (previous === null) {
      var target = new URL(url);
      var slug = target.pathname.slice(target.pathname.lastIndexOf("/") + 1);
      response = yield fetch(new URL("./", target).href, {
        method: "POST",
        headers: {
          "Content-Type": "text/turtle",
          Slug: slug
        },
        body: next,
        redirect: "error"
      });
      if (response.ok) {
        var _response$headers, _response$headers$get;
        var location = (_response$headers = response.headers) === null || _response$headers === void 0 || (_response$headers$get = _response$headers.get) === null || _response$headers$get === void 0 ? void 0 : _response$headers$get.call(_response$headers, "Location");
        if (!location || new URL(location, url).href !== target.href) {
          var error = new Error("The Pod did not create the requested metadata URL. Its Location must match the stable dataset identifier.");
          throw error;
        }
      }
    } else {
      var body = yield buildMetadataPatch(previous, next, url);
      if (!body) return {
        ok: true,
        status: 204,
        url
      };
      response = yield fetch(url, {
        method: "PATCH",
        headers: _objectSpread2$2({
          "Content-Type": "text/n3"
        }, etag ? {
          "If-Match": etag
        } : {}),
        body,
        redirect: "error"
      });
    }
    if (!response.ok) {
      var _error = new Error("Metadata write failed (".concat(response.status, "): ").concat(url));
      _error.status = response.status;
      throw _error;
    }
    return response;
  });
  return _writeMetadataTurtle.apply(this, arguments);
}
function saveProfileDocument(_x8, _x9, _x10, _x11) {
  return _saveProfileDocument.apply(this, arguments);
}
function _saveProfileDocument() {
  _saveProfileDocument = _asyncToGenerator(function* (url, previous, next, fetch) {
    return writeMetadataTurtle(url, previous ? yield solidDatasetAsTurtle(previous) : null, yield solidDatasetAsTurtle(next), fetch);
  });
  return _saveProfileDocument.apply(this, arguments);
}
function profileDistributions(input) {
  var _input$semanticModels;
  if (input.distributions != null && !Array.isArray(input.distributions)) throw new Error("Distributions must be an array.");
  var supplied = Array.isArray(input.distributions) && input.distributions.length ? input.distributions : [{
    url: "",
    downloadURL: input.distribution_access_type === "access" ? "" : input.access_url_dataset,
    accessURL: input.distribution_access_type === "access" ? input.access_url_dataset : "",
    mediaType: input.file_format,
    conformsTo: (_input$semanticModels = input.semanticModels) !== null && _input$semanticModels !== void 0 && _input$semanticModels.length ? input.semanticModels : [input.access_url_semantic_model].filter(Boolean)
  }];
  return supplied.map((item, index) => {
    var _input$distributions;
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Each distribution must be an object.");
    var current = _objectSpread2$2({}, item);
    if (index === 0 && (_input$distributions = input.distributions) !== null && _input$distributions !== void 0 && _input$distributions.length && Object.hasOwn(input, "access_url_dataset")) {
      current.downloadURL = input.distribution_access_type === "access" ? "" : input.access_url_dataset;
      current.accessURL = input.distribution_access_type === "access" ? input.access_url_dataset : current.accessURL;
      current.mediaType = input.file_format || current.mediaType;
      if (Object.hasOwn(input, "access_url_semantic_model")) {
        current.conformsTo = [input.access_url_semantic_model, ...(current.conformsTo || []).slice(1)].filter(Boolean);
      }
    }
    if (current.conformsTo != null && !Array.isArray(current.conformsTo)) throw new Error("Model/schema references must be an array of IRIs.");
    return _objectSpread2$2(_objectSpread2$2({}, current), {}, {
      conformsTo: [...new Set(current.conformsTo || [])]
    });
  });
}
function assertProfileDistributions(distributions) {
  var absoluteIri = value => {
    try {
      return Boolean(typeof value === "string" && value && new URL(value).protocol && !/[<>"{}|^`\\\s]/.test(value));
    } catch (_unused) {
      return false;
    }
  };
  if (!Array.isArray(distributions) || !distributions.length) throw new Error("At least one distribution is required.");
  for (var distribution of distributions) {
    if (!absoluteIri(distribution.downloadURL) || !/^https?:/.test(distribution.downloadURL)) {
      throw new Error("A direct HTTP(S) download URL is required; an access or landing-page link alone does not satisfy the Solid DCAT Profile.");
    }
    if (typeof distribution.mediaType !== "string" || !distribution.mediaType.trim()) throw new Error("A media type is required for every distribution.");
    if (!Array.isArray(distribution.conformsTo) || !distribution.conformsTo.length || distribution.conformsTo.some(url => !absoluteIri(url))) {
      throw new Error("A model or schema IRI is required for every distribution.");
    }
  }
}

var isNotFound$1 = error => {
  var _error$response, _error$response2;
  return (error === null || error === void 0 ? void 0 : error.statusCode) === 404 || (error === null || error === void 0 ? void 0 : error.status) === 404 || (error === null || error === void 0 || (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.status) === 404 || (error === null || error === void 0 || (_error$response2 = error.response) === null || _error$response2 === void 0 ? void 0 : _error$response2.statusCode) === 404;
};
var deleteCatalogDatasetDocuments = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* (_ref) {
    var {
      datasetDocUrl,
      recordDocUrl = "",
      fetch,
      deleteResource
    } = _ref;
    var targets = [{
      label: "dataset document",
      url: datasetDocUrl
    }, ...(recordDocUrl ? [{
      label: "catalog record",
      url: recordDocUrl
    }] : [])];
    var failures = [];
    for (var target of targets) {
      try {
        yield deleteResource(target.url, {
          fetch
        });
      } catch (error) {
        // A previous partial reset may already have removed this resource. Treating
        // 404 as success makes the operation safe to retry without hiding real
        // authorization, availability, or server failures.
        if (!isNotFound$1(error)) failures.push(_objectSpread2$2(_objectSpread2$2({}, target), {}, {
          error
        }));
      }
    }
    if (failures.length) {
      var detail = failures.map(_ref3 => {
        var {
          label,
          url
        } = _ref3;
        return "".concat(label, " (").concat(url, ")");
      }).join(", ");
      var error = new AggregateError(failures.map(failure => failure.error), "Catalog dataset deletion incomplete: ".concat(detail, "."));
      error.failures = failures.map(_ref4 => {
        var _cause$response, _cause$response2;
        var {
          label,
          url,
          error: cause
        } = _ref4;
        return {
          label,
          url,
          status: (cause === null || cause === void 0 ? void 0 : cause.statusCode) || (cause === null || cause === void 0 ? void 0 : cause.status) || (cause === null || cause === void 0 || (_cause$response = cause.response) === null || _cause$response === void 0 ? void 0 : _cause$response.status) || (cause === null || cause === void 0 || (_cause$response2 = cause.response) === null || _cause$response2 === void 0 ? void 0 : _cause$response2.statusCode) || null
        };
      });
      throw error;
    }
  });
  return function deleteCatalogDatasetDocuments(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var normalizeRegistry = value => "".concat(String(value).replace(/\/+$/, ""), "/");
var documentUrl = value => String(value).split("#", 1)[0];
var safeUrl = value => {
  try {
    var url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search;
  } catch (_unused) {
    return false;
  }
};
function publicCatalogCacheUrl(registry, currentHref, configuredBase) {
  var current = new URL(currentHref);
  var local = ["localhost", "127.0.0.1", "[::1]"].includes(current.hostname);
  var base = configuredBase || (local ? "https://solid-dataspace-test.tmdt.info/sync-worker/public-cache" : "/sync-worker/public-cache");
  var target = new URL("".concat(base.replace(/\/+$/, ""), "/catalog"), current.origin);
  if (!safeUrl(target.href) || target.hash) throw new Error("Invalid public catalog cache URL.");
  target.searchParams.set("registry", normalizeRegistry(registry));
  return target;
}

// No session fetch, credentials, localStorage, or cross-user in-memory results.
// Only public RDF documents are reused. The existing parser keeps the row model.
function loadPublicCatalogCache(_x) {
  return _loadPublicCatalogCache.apply(this, arguments);
}
function _loadPublicCatalogCache() {
  _loadPublicCatalogCache = _asyncToGenerator(function* (registries) {
    var _window$_env_;
    var {
      fetchImpl = globalThis.fetch,
      currentHref = window.location.href,
      configuredBase = (_window$_env_ = window._env_) === null || _window$_env_ === void 0 ? void 0 : _window$_env_.PUBLIC_CACHE_URL,
      timeoutMs = 10000
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var snapshots = yield Promise.all([...new Set(registries.map(normalizeRegistry))].map(/*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* (registry) {
        var controller = new AbortController();
        var timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          var target = publicCatalogCacheUrl(registry, currentHref, configuredBase);
          var documents = new Map();
          var metadata;
          var offset = 0;
          var bytes = 0;
          for (var page = 0; page < 2048; page++) {
            var _response$headers$get;
            var response = yield fetchImpl(target.href, {
              credentials: "omit",
              cache: "no-store",
              signal: controller.signal
            });
            if (!response.ok || !((_response$headers$get = response.headers.get("content-type")) !== null && _response$headers$get !== void 0 && _response$headers$get.includes("application/json"))) return null;
            var value = yield response.json();
            if ((value === null || value === void 0 ? void 0 : value.schemaVersion) !== 1 || normalizeRegistry(value.registryUrl) !== registry || !["ready", "partial"].includes(value.status) || typeof value.revision !== "string" || value.revision.length > 200 || typeof value.discoveryComplete !== "boolean" || !(Date.parse(value.expiresAt) > Date.now()) || !Array.isArray(value.documents) || !Array.isArray(value.members) || metadata && value.revision !== metadata.revision) return null;
            if (!metadata) {
              metadata = value;
              if (value.members.length > 256 || !value.members.every(m => safeUrl(m.webId) && safeUrl(m.catalogUrl))) return null;
            }
            for (var doc of value.documents) {
              if (!doc || !safeUrl(doc.url) || doc.url.includes("#") || typeof doc.body !== "string" || !["text/turtle", "application/n-triples"].includes(doc.contentType)) return null;
              bytes += doc.body.length;
              if (bytes > 32 * 1024 * 1024 || documents.size >= 2048) return null;
              documents.set(doc.url, doc);
            }
            if (value.nextOffset === null) return _objectSpread2$2(_objectSpread2$2({}, metadata), {}, {
              documents
            });
            if (!Number.isSafeInteger(value.nextOffset) || value.nextOffset <= offset || value.nextOffset > 2048) return null;
            offset = value.nextOffset;
            target.searchParams.set("offset", String(offset));
            target.searchParams.set("revision", metadata.revision);
          }
          return null;
        } catch (_unused3) {
          return null;
        } finally {
          clearTimeout(timer);
        }
      });
      return function (_x4) {
        return _ref2.apply(this, arguments);
      };
    }()));
    return snapshots.filter(Boolean);
  });
  return _loadPublicCatalogCache.apply(this, arguments);
}
function cachedCatalogFetch(snapshots, fallbackFetch) {
  var {
    ownCatalogUrl,
    isLoggedIn = false
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var catalogRoots = new Set(snapshots.flatMap(s => s.members.map(m => documentUrl(m.catalogUrl))));
  var docs = new Map(snapshots.flatMap(s => [...s.documents]));
  var ownBase;
  try {
    ownBase = new URL(".", documentUrl(ownCatalogUrl)).href;
  } catch (_unused2) {/* Guest */}
  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (input, options) {
      var url = documentUrl(typeof input === "string" ? input : input.url);
      var doc = docs.get(url);
      // Own metadata always fresh (including immediately after add/edit/delete).
      // Authenticated catalog roots can advertise additional private datasets.
      var method = (options === null || options === void 0 ? void 0 : options.method) || typeof input === "object" && input.method || "GET";
      var bypass = method.toUpperCase() !== "GET" || ownBase && url.startsWith(ownBase) || isLoggedIn && catalogRoots.has(url);
      if (!bypass && doc && snapshots.some(s => s.documents.has(url) && Date.parse(s.expiresAt) > Date.now())) {
        var response = new Response(doc.body, {
          headers: {
            "Content-Type": doc.contentType
          }
        });
        // Inrupt resolves relative RDF IRIs against response.url, never the cache API.
        Object.defineProperty(response, "url", {
          value: doc.url
        });
        return response;
      }
      return fallbackFetch(input, options);
    });
    return function (_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();
}

var _window$__APP_CONFIG_, _window$_env_;
var CATALOG_CONTAINER = "catalog/";
var DATASET_CONTAINER = "catalog/ds/";
var SERIES_CONTAINER = "catalog/series/";
var RECORDS_CONTAINER = "catalog/records/";
var CATALOG_DOC = "catalog/cat.ttl";
var CATALOG_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
var CACHE_KEY = "sdm.catalog.cache.v1";
var CACHE_TTL_MS = 0;
var STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
var DROP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
var safeNow = () => new Date().toISOString();
var SDP_NS = "http://purl.org/sdp/terms#";
var LEGACY_SDP_CATALOG = "https://w3id.org/solid-dcat-profile#catalog";
var SDP_CATALOG = "".concat(SDP_NS, "catalog");
var SDM_NS = "https://w3id.org/solid-dataspace-manager#";
var SDM_REGISTRY_MODE = "".concat(SDM_NS, "registryMode");
var SDM_REGISTRY = "".concat(SDM_NS, "registry");
var SDM_PRIVATE_REGISTRY = "".concat(SDM_NS, "privateRegistry");
var DEFAULT_REGISTRY_PRESETS = [{
  id: "stadt-wuppertal",
  label: "Gesundes Tal",
  url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/stadt-wuppertal"
}, {
  id: "dace",
  label: "DACE",
  url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/dace"
}, {
  id: "timberconnect",
  label: "TimberConnect",
  url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/timberconnect"
}, {
  id: "test",
  label: "Test",
  url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/test",
  icon: "flask"
}];
typeof window !== 'undefined' && (((_window$__APP_CONFIG_ = window.__APP_CONFIG__) === null || _window$__APP_CONFIG_ === void 0 ? void 0 : _window$__APP_CONFIG_.registries) || ((_window$_env_ = window._env_) === null || _window$_env_ === void 0 ? void 0 : _window$_env_.CATALOG_REGISTRIES)) || DEFAULT_REGISTRY_PRESETS;
var SDM_CHANGELOG = "".concat(SDM_NS, "changeLog");
var SDM_CHANGE_EVENT = "".concat(SDM_NS, "ChangeEvent");
var LEGACY_DCAT_CONFORMS_TO = "http://www.w3.org/ns/dcat#conformsTo";
var VCARD_HAS_URL = VCARD.hasURL || "http://www.w3.org/2006/vcard/ns#hasURL";
var VCARD_URL = VCARD.url || "http://www.w3.org/2006/vcard/ns#url";
var resolveUrl = (value, base) => {
  if (!value) return "";
  try {
    return new URL(value, base).href;
  } catch (_unused) {
    return value;
  }
};
var isNotFound = err => {
  var _err$response, _err$response2;
  return (err === null || err === void 0 ? void 0 : err.statusCode) === 404 || (err === null || err === void 0 ? void 0 : err.status) === 404 || (err === null || err === void 0 || (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.status) === 404 || (err === null || err === void 0 || (_err$response2 = err.response) === null || _err$response2 === void 0 ? void 0 : _err$response2.statusCode) === 404;
};
var stripMailto = value => {
  if (!value) return "";
  return value.startsWith("mailto:") ? value.replace(/^mailto:/, "") : value;
};
var getThingByTypes = (datasetDoc, types) => {
  var typeSet = new Set(types);
  return getThingAll(datasetDoc).find(thing => {
    var thingTypes = getUrlAll(thing, RDF.type);
    return thingTypes.some(type => typeSet.has(type));
  }) || null;
};
var resolveDatasetThing = (datasetDoc, datasetUrl) => {
  if (!datasetDoc) return null;
  var docUrl = getDocumentUrl(datasetUrl);
  var candidates = [datasetUrl, "".concat(docUrl, "#it")];
  for (var candidate of candidates) {
    var thing = getThing(datasetDoc, candidate);
    if (thing && !getUrlAll(thing, RDF.type).includes(DCAT$1.CatalogRecord)) return thing;
    if (thing) {
      var topic = getUrl(thing, FOAF.primaryTopic);
      var topicThing = topic && getThing(datasetDoc, topic);
      if (topicThing) return topicThing;
    }
  }
  return getThingByTypes(datasetDoc, [DCAT$1.Dataset, DCAT$1.DatasetSeries, DATA_SERVICE]) || getThingAll(datasetDoc)[0] || null;
};
var toCatalogDatasetRef = (catalogDocUrl, datasetUrl) => {
  if (!catalogDocUrl || !datasetUrl) return datasetUrl;
  try {
    var catalog = new URL(catalogDocUrl);
    var dataset = new URL(datasetUrl, catalogDocUrl);
    if (catalog.origin !== dataset.origin) return datasetUrl;
    var catalogDir = catalog.pathname.replace(/[^/]+$/, "");
    if (!dataset.pathname.startsWith(catalogDir)) return datasetUrl;
    var relPath = dataset.pathname.slice(catalogDir.length);
    return "".concat(relPath).concat(dataset.hash || "");
  } catch (_unused2) {
    return datasetUrl;
  }
};
var buildCatalogTurtle = _ref => {
  var {
    title,
    description,
    modified,
    datasetRefs,
    recordRefs,
    contactPoint
  } = _ref;
  var lines = ["@prefix dcat: <http://www.w3.org/ns/dcat#>.", "@prefix dcterms: <http://purl.org/dc/terms/>.", "@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.", "", "<#it> a dcat:Catalog ;", "  dcterms:title \"".concat((title || "Solid Dataspace Catalog").replace(/\"/g, '\\"'), "\" ;")];
  if (description) {
    lines.push("  dcterms:description \"".concat(description.replace(/\"/g, '\\"'), "\" ;"));
  }
  var modifiedValue = modified || safeNow();
  lines.push("  dcterms:modified \"".concat(modifiedValue, "\"^^xsd:dateTime ;"));
  if (contactPoint) {
    lines.push("  dcat:contactPoint <".concat(contactPoint, "> ;"));
  }
  if (datasetRefs && datasetRefs.length) {
    lines.push("  dcat:dataset");
    lines.push("    ".concat(datasetRefs.map(ref => "<".concat(ref, ">")).join(" ,\n    "), " ."));
  } else if (recordRefs && recordRefs.length) {
    lines.push("  .");
  } else {
    lines.push("  .");
  }
  if (recordRefs && recordRefs.length) {
    lines.push("");
    lines.push("<#it> dcat:record");
    lines.push("    ".concat(recordRefs.map(ref => "<".concat(ref, ">")).join(" ,\n    "), " ."));
  }
  return lines.join("\n");
};
var CATALOG_CAS_MAX_ATTEMPTS = 4;
var CATALOG_CONFLICT_STATUSES = new Set([409, 412]);
var responseHeader = (response, name) => response !== null && response !== void 0 && response.headers && typeof response.headers.get === "function" ? response.headers.get(name) : null;
var isStrongEtag = value => typeof value === "string" && /^"[\x21\x23-\x7e\x80-\xff]*"$/.test(value.trim());
var assertExactCatalogResponse = (response, catalogDocUrl, operation) => {
  var actualUrl = response === null || response === void 0 ? void 0 : response.url;
  var expected;
  var actual;
  try {
    expected = new URL(catalogDocUrl).href;
    actual = actualUrl ? new URL(actualUrl).href : "";
  } catch (_unused3) {
    throw new Error("Catalog ".concat(operation, " did not use a valid exact resource URL."));
  }
  if (response !== null && response !== void 0 && response.redirected || actual !== expected) {
    throw new Error("Catalog ".concat(operation, " did not use the exact resource URL."));
  }
};
var parseCatalogSnapshot = (turtle, catalogDocUrl) => {
  var quads;
  try {
    quads = new Parser({
      baseIRI: catalogDocUrl
    }).parse(turtle);
  } catch (error) {
    throw new Error("Catalog document contains invalid Turtle.", {
      cause: error
    });
  }
  var catalogResourceUrl = "".concat(catalogDocUrl, "#it");
  var values = predicate => quads.filter(quad => quad.subject.value === catalogResourceUrl && quad.predicate.value === predicate).map(quad => quad.object.value);
  var types = values(RDF.type);
  if (!types.includes(DCAT$1.Catalog)) {
    throw new Error("Catalog document does not contain the expected dcat:Catalog resource.");
  }
  return {
    turtle,
    title: values(DCTERMS.title)[0] || "Solid Dataspace Catalog",
    description: values(DCTERMS.description)[0] || "",
    contactPoint: values(DCAT$1.contactPoint)[0] || "",
    datasetRefs: Array.from(new Set(values(DCAT$1.dataset).map(url => toCatalogDatasetRef(catalogDocUrl, url)))),
    serviceRefs: values(SERVICE_LINK).map(url => toCatalogDatasetRef(catalogDocUrl, url)),
    recordRefs: Array.from(new Set(values(DCAT$1.record).map(url => toCatalogDatasetRef(catalogDocUrl, url))))
  };
};
var readCatalogSnapshot = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* (fetch, catalogDocUrl) {
    var response = yield fetch(catalogDocUrl, {
      method: "GET",
      headers: {
        Accept: "text/turtle",
        "Cache-Control": "no-store"
      },
      cache: "no-store",
      redirect: "error"
    });
    assertExactCatalogResponse(response, catalogDocUrl, "read");
    if (response.status === 404) {
      return {
        exists: false,
        etag: "",
        title: "Solid Dataspace Catalog",
        description: "",
        contactPoint: "",
        datasetRefs: [],
        recordRefs: []
      };
    }
    if (!response.ok) {
      throw new Error("Failed to read catalog document (".concat(response.status, ")."));
    }
    var etag = (responseHeader(response, "ETag") || "").trim();
    if (!isStrongEtag(etag)) {
      throw new Error("Catalog document is missing a strong ETag.");
    }
    var turtle = yield response.text();
    return _objectSpread2$2({
      exists: true,
      etag
    }, parseCatalogSnapshot(turtle, catalogDocUrl));
  });
  return function readCatalogSnapshot(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();
var mutateCatalogDocument = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(function* (session, catalogDocUrl, mutateDatasetRefs) {
    var metadata = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!session || typeof session.fetch !== "function") {
      throw new Error("An authenticated Solid session is required.");
    }
    var _loop = function* _loop() {
        var _snapshot$serviceRefs;
        var snapshot = yield readCatalogSnapshot(session.fetch, catalogDocUrl);
        var currentRefs = new Set(snapshot.datasetRefs);
        var updatedRefs = mutateDatasetRefs ? mutateDatasetRefs(currentRefs, snapshot) : currentRefs;
        var datasetRefs = Array.from(updatedRefs || currentRefs);
        var turtle = buildCatalogTurtle({
          title: metadata.title !== undefined ? metadata.title || "Solid Dataspace Catalog" : snapshot.title,
          description: metadata.description !== undefined ? metadata.description || "" : snapshot.description,
          modified: safeNow(),
          datasetRefs,
          recordRefs: snapshot.recordRefs,
          contactPoint: metadata.contactPoint !== undefined ? metadata.contactPoint || "" : snapshot.contactPoint
        });
        if ((_snapshot$serviceRefs = snapshot.serviceRefs) !== null && _snapshot$serviceRefs !== void 0 && _snapshot$serviceRefs.length) {
          turtle += "\n<#it> <" + SERVICE_LINK + "> " + snapshot.serviceRefs.map(ref => "<" + ref + ">").join(", ") + " .\n";
        }
        if (snapshot.exists) {
          var managed = new Set([DCTERMS.title, DCTERMS.description, DCTERMS.modified, DCAT$1.contactPoint, DCAT$1.dataset, DCAT$1.record, SERVICE_LINK]);
          var extras = new Parser({
            baseIRI: catalogDocUrl,
            blankNodePrefix: ""
          }).parse(snapshot.turtle).filter(quad => quad.subject.value !== "".concat(catalogDocUrl, "#it") || !managed.has(quad.predicate.value) && !(quad.predicate.value === RDF.type && quad.object.value === DCAT$1.Catalog));
          turtle += "\n" + new Writer({
            format: "N-Triples"
          }).quadsToString(extras);
        }
        var response;
        try {
          response = yield writeMetadataTurtle(catalogDocUrl, snapshot.exists ? snapshot.turtle : null, turtle, session.fetch, {
            etag: snapshot.etag
          });
        } catch (error) {
          if (CATALOG_CONFLICT_STATUSES.has(error.status)) return 0; // continue
          throw error;
        }
        if (snapshot.exists) assertExactCatalogResponse(response, catalogDocUrl, "write");
        if (response.ok) {
          return {
            v: {
              datasetRefs,
              created: !snapshot.exists
            }
          };
        }
        if (!CATALOG_CONFLICT_STATUSES.has(response.status)) {
          throw new Error("Failed to write catalog document (".concat(response.status, ")."));
        }
      },
      _ret;
    for (var attempt = 0; attempt < CATALOG_CAS_MAX_ATTEMPTS; attempt += 1) {
      _ret = yield* _loop();
      if (_ret === 0) continue;
      if (_ret) return _ret.v;
    }
    var conflict = new Error("Catalog document changed during all ".concat(CATALOG_CAS_MAX_ATTEMPTS, " write attempts."));
    conflict.status = 412;
    throw conflict;
  });
  return function mutateCatalogDocument(_x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();
var ensureCatalogDocument = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(function* (session, catalogDocUrl) {
    var {
      title,
      description,
      contactPoint
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return mutateCatalogDocument(session, catalogDocUrl, datasetRefs => datasetRefs, {
      title: title || "Solid Dataspace Catalog",
      description: description || "",
      contactPoint: contactPoint || ""
    });
  });
  return function ensureCatalogDocument(_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();
var getPodRoot$1 = webId => {
  if (!webId) return "";
  var url = new URL(webId);
  var segments = url.pathname.split("/").filter(Boolean);
  var profileIndex = segments.indexOf("profile");
  var baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
  var basePath = baseSegments.length ? "/".concat(baseSegments.join("/"), "/") : "/";
  return "".concat(url.origin).concat(basePath);
};
var buildDefaultPrivateRegistry = function buildDefaultPrivateRegistry(webId) {
  var podRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  if (!webId && !podRoot) return "";
  return "".concat(podRoot || getPodRoot$1(webId), "registry/");
};
var normalizeContainerUrl$2 = value => {
  if (!value) return "";
  try {
    var url = new URL(value);
    return url.href.endsWith("/") ? url.href : "".concat(url.href, "/");
  } catch (_unused4) {
    return value.endsWith("/") ? value : "".concat(value, "/");
  }
};
var getDocumentUrl = resourceUrl => resourceUrl.split("#")[0];
var normalizeLocaleValues = values => {
  if (!values) return [];
  if (Array.isArray(values)) {
    return values.map(value => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") {
        return value.value || value.literal || value.literalValue || "";
      }
      return "";
    }).filter(Boolean);
  }
  if (typeof values === "object") {
    return Object.values(values).flatMap(value => normalizeLocaleValues(value)).filter(Boolean);
  }
  return [];
};
var getAnyString = (thing, predicate) => {
  if (!thing) return "";
  var noLocale = getStringNoLocale(thing, predicate);
  if (noLocale) return noLocale;
  try {
    var values = normalizeLocaleValues(getStringWithLocaleAll(thing, predicate));
    if (!values || values.length === 0) return "";
    return values[0] || "";
  } catch (_unused5) {
    return "";
  }
};
var safeGetUrlAll = (thing, predicate) => {
  if (!thing) return [];
  try {
    return (getUrlAll(thing, predicate) || []).filter(Boolean);
  } catch (err) {
    console.warn("Invalid URL value for predicate", predicate, err);
    return [];
  }
};
var setLocaleString = (thing, predicate, value) => {
  if (!value) return thing;
  return setStringNoLocale(thing, predicate, value);
};
var getCatalogDocUrl = function getCatalogDocUrl(webId) {
  var podRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  return "".concat(podRoot || getPodRoot$1(webId)).concat(CATALOG_DOC);
};
var getCatalogResourceUrl = function getCatalogResourceUrl(webId) {
  var podRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  return "".concat(getCatalogDocUrl(webId, podRoot), "#it");
};
var getSeriesDocUrl = (webId, identifier) => "".concat(getPodRoot$1(webId)).concat(SERIES_CONTAINER).concat(identifier, ".ttl");
var getSeriesResourceUrl = seriesDocUrl => "".concat(seriesDocUrl, "#it");
var assertCatalogDatasetDeletionTarget = function assertCatalogDatasetDeletionTarget(podRoot, datasetUrl) {
  var identifier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var fail = () => {
    throw new Error("Dataset URL must identify a direct catalog/ds/{identifier}.ttl#it resource in the selected Pod.");
  };
  if (typeof podRoot !== "string" || !podRoot || podRoot.trim() !== podRoot || typeof datasetUrl !== "string" || !datasetUrl || datasetUrl.trim() !== datasetUrl) {
    return fail();
  }
  var root;
  var candidate;
  try {
    root = new URL(podRoot);
    candidate = new URL(datasetUrl);
  } catch (_unused6) {
    return fail();
  }
  if (root.protocol !== "https:" && root.protocol !== "http:" || root.username || root.password || root.search || root.hash || candidate.protocol !== "https:" && candidate.protocol !== "http:" || candidate.username || candidate.password || candidate.search || candidate.hash !== "#it") {
    return fail();
  }
  if (!root.pathname.endsWith("/")) root.pathname = "".concat(root.pathname, "/");
  var datasetContainer = new URL(DATASET_CONTAINER, root);
  if (candidate.origin !== datasetContainer.origin || !candidate.pathname.startsWith(datasetContainer.pathname)) {
    return fail();
  }
  var fileName = candidate.pathname.slice(datasetContainer.pathname.length);
  if (!fileName || fileName.includes("/") || !fileName.endsWith(".ttl") || !CATALOG_IDENTIFIER_PATTERN.test(fileName.slice(0, -4))) {
    return fail();
  }
  var normalizedIdentifier = String(identifier || "").trim();
  if (normalizedIdentifier) {
    if (!CATALOG_IDENTIFIER_PATTERN.test(normalizedIdentifier)) return fail();
    var expected = new URL("".concat(normalizedIdentifier, ".ttl#it"), datasetContainer).href;
    if (candidate.href !== expected) return fail();
  }
  return candidate.href;
};
var validateDatasetInput = input => {
  var distributions = profileDistributions(input);
  assertProfileDistributions(distributions);
  if (distributions.some(distribution => new URL(distribution.downloadURL).pathname.endsWith("/"))) {
    throw new Error("Solid containers must be cataloged as a Dataset Series.");
  }
};
var loadCache = () => ({
  updatedAt: 0,
  catalogs: {}
});
var clearCache = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CACHE_KEY);
};
var ensureContainer = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(function* (containerUrl, fetch) {
    try {
      var res = yield fetch(containerUrl, {
        method: "GET",
        headers: {
          Accept: "text/turtle"
        }
      });
      if (res.ok) return;
      if (res.status !== 404) return;
    } catch (_unused7) {
      // Continue and attempt creation.
    }
    try {
      yield createContainerAt(containerUrl, {
        fetch
      });
    } catch (err) {
      var _err$response3;
      var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response3 = err.response) === null || _err$response3 === void 0 ? void 0 : _err$response3.status);
      if (status === 409 || status === 412) {
        return;
      }
      throw err;
    }
  });
  return function ensureContainer(_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();

// ACL changes only need HTTP metadata. Do not negotiate RDF or download the
// linked data file (CSV, gzip, video, etc.) just to read its permissions.
var getResourceWithAcl = (url, fetch) => getResourceInfoWithAcl(url, {
  fetch
});
var getResourceAndAcl = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(function* (url, fetch) {
    var resource = yield getResourceWithAcl(url, fetch);
    var resourceAcl;
    if (!hasResourceAcl(resource)) {
      if (!hasAccessibleAcl(resource)) {
        throw new Error("No access to ACL.");
      }
      resourceAcl = createAclFromFallbackAcl(resource);
    } else {
      resourceAcl = getResourceAcl(resource);
    }
    return {
      resource,
      resourceAcl
    };
  });
  return function getResourceAndAcl(_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();
var setPublicReadAccess = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(function* (url, fetch, read) {
    var {
      resource,
      resourceAcl
    } = yield getResourceAndAcl(url, fetch);
    var updatedAcl = setPublicResourceAccess(resourceAcl, {
      read,
      append: false,
      write: false,
      control: false
    });
    yield saveAclFor(resource, updatedAcl, {
      fetch
    });
  });
  return function setPublicReadAccess(_x15, _x16, _x17) {
    return _ref8.apply(this, arguments);
  };
}();

// Publication must fail visibly if the metadata cannot be made discoverable.
// Dataset resource permissions are handled separately by syncLinkedResourceAccess.
var makePublicReadable = (url, fetch) => setPublicReadAccess(url, fetch, true);
var setCatalogLinkInProfile = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(function* (webId, catalogUrl, fetch) {
    if (!webId || !catalogUrl) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield getSolidDataset(profileDocUrl, {
      fetch
    });
    var profileThing = getThing(profileDataset, webId);
    if (!profileThing) {
      profileThing = createThing({
        url: webId
      });
    }
    profileThing = removeAll(profileThing, SDP_CATALOG);
    profileThing = removeAll(profileThing, DCAT$1.catalog);
    profileThing = setUrl(profileThing, SDP_CATALOG, catalogUrl);
    // Keep older deployed applications able to discover the same catalog.
    profileThing = setUrl(profileThing, LEGACY_SDP_CATALOG, catalogUrl);
    var updatedProfile = setThing(profileDataset, profileThing);
    yield saveSolidDatasetAt(profileDocUrl, updatedProfile, {
      fetch
    });
  });
  return function setCatalogLinkInProfile(_x18, _x19, _x20) {
    return _ref9.apply(this, arguments);
  };
}();
var loadRegistryConfig = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(function* (webId, fetch) {
    var {
      podRoot = "",
      onLoadError
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!webId || !fetch) {
      return {
        mode: "research",
        registries: [],
        privateRegistry: ""
      };
    }
    var profileDocUrl = webId.split("#")[0];
    try {
      var profileDataset = yield getSolidDataset(profileDocUrl, {
        fetch
      });
      var profileThing = getThing(profileDataset, webId);
      var mode = (getStringNoLocale(profileThing, SDM_REGISTRY_MODE) || "research").toLowerCase();
      var registries = (getUrlAll(profileThing, SDM_REGISTRY) || []).filter(Boolean).map(url => url.replace(/\/+$/, ""));
      var privateRegistry = getUrl(profileThing, SDM_PRIVATE_REGISTRY) || buildDefaultPrivateRegistry(webId, podRoot);
      return {
        mode: mode === "private" ? "private" : "research",
        registries,
        privateRegistry
      };
    } catch (err) {
      console.warn("Failed to load registry config from profile:", err);
      onLoadError === null || onLoadError === void 0 || onLoadError(err);
      return {
        mode: "research",
        registries: [],
        privateRegistry: buildDefaultPrivateRegistry(webId, podRoot)
      };
    }
  });
  return function loadRegistryConfig(_x21, _x22) {
    return _ref10.apply(this, arguments);
  };
}();
var saveRegistryConfig = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(function* (webId, fetch, config) {
    var {
      podRoot = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!webId || !fetch) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield getSolidDataset(profileDocUrl, {
      fetch
    });
    var profileThing = getThing(profileDataset, webId);
    if (!profileThing) {
      profileThing = createThing({
        url: webId
      });
    }
    var mode = (config === null || config === void 0 ? void 0 : config.mode) === "private" ? "private" : "research";
    var registries = ((config === null || config === void 0 ? void 0 : config.registries) || []).filter(Boolean).map(url => url.replace(/\/+$/, ""));
    var privateRegistry = (config === null || config === void 0 ? void 0 : config.privateRegistry) || buildDefaultPrivateRegistry(webId, podRoot);
    profileThing = removeAll(profileThing, SDM_REGISTRY_MODE);
    profileThing = setStringNoLocale(profileThing, SDM_REGISTRY_MODE, mode);
    profileThing = removeAll(profileThing, SDM_REGISTRY);
    registries.forEach(url => {
      profileThing = addUrl(profileThing, SDM_REGISTRY, url);
    });
    profileThing = removeAll(profileThing, SDM_PRIVATE_REGISTRY);
    if (privateRegistry) {
      profileThing = setUrl(profileThing, SDM_PRIVATE_REGISTRY, privateRegistry);
    }
    var updatedProfile = setThing(profileDataset, profileThing);
    yield saveSolidDatasetAt(profileDocUrl, updatedProfile, {
      fetch
    });
  });
  return function saveRegistryConfig(_x23, _x24, _x25) {
    return _ref11.apply(this, arguments);
  };
}();
var ensureRegistryContainer = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(function* (containerUrl, fetch) {
    yield ensureContainer(containerUrl, fetch);
    yield makePublicReadable(containerUrl, fetch);
  });
  return function ensureRegistryContainer(_x26, _x27) {
    return _ref12.apply(this, arguments);
  };
}();
var ensurePrivateRegistryContainer = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(function* (webId, fetch, privateRegistryUrl) {
    var {
      podRoot = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!webId || !fetch) return "";
    var target = normalizeContainerUrl$2(privateRegistryUrl || buildDefaultPrivateRegistry(webId, podRoot));
    if (!target) return "";
    yield ensureRegistryContainer(target, fetch);
    return target;
  });
  return function ensurePrivateRegistryContainer(_x28, _x29, _x30) {
    return _ref13.apply(this, arguments);
  };
}();
var resolveRegistryConfig = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(function* (webId, fetch, override) {
    var podRoot = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
    var base = override || (yield loadRegistryConfig(webId, fetch, {
      podRoot
    }));
    var mode = (base === null || base === void 0 ? void 0 : base.mode) === "private" ? "private" : "research";
    var registries = ((base === null || base === void 0 ? void 0 : base.registries) || []).filter(Boolean);
    var privateRegistry = (base === null || base === void 0 ? void 0 : base.privateRegistry) || buildDefaultPrivateRegistry(webId, podRoot);
    return {
      mode,
      registries,
      privateRegistry
    };
  });
  return function resolveRegistryConfig(_x31, _x32, _x33) {
    return _ref14.apply(this, arguments);
  };
}();
var registerWebIdInRegistryContainer = /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator(function* (containerUrl, fetch, memberWebId) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !memberWebId) return;
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield getSolidDataset(normalizedUrl, {
      fetch
    });
    var resources = getContainedResourceUrlAll(containerDataset);
    for (var resourceUrl of resources) {
      try {
        var memberDataset = yield getSolidDataset(resourceUrl, {
          fetch
        });
        var memberThing = getThing(memberDataset, "".concat(resourceUrl, "#it")) || getThingAll(memberDataset)[0];
        var existingWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
        if (existingWebId === memberWebId) return;
      } catch (_unused8) {
        // Ignore malformed entries.
      }
    }
    var turtle = ["@prefix foaf: <http://xmlns.com/foaf/0.1/>.", "@prefix dcterms: <http://purl.org/dc/terms/>.", "", "<#it> a foaf:Group ;", "  foaf:member <".concat(memberWebId, "> ;"), "  dcterms:modified \"".concat(new Date().toISOString(), "\"^^<http://www.w3.org/2001/XMLSchema#dateTime> ."), ""].join("\n");
    var res = yield fetch(normalizedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/turtle",
        "Slug": "member-".concat(encodeURIComponent(memberWebId))
      },
      body: turtle
    });
    if (!res.ok) {
      throw new Error("Failed to write registry (".concat(normalizedUrl, "): ").concat(res.status));
    }
  });
  return function registerWebIdInRegistryContainer(_x34, _x35, _x36) {
    return _ref15.apply(this, arguments);
  };
}();
var registerWebIdInRegistries = /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator(function* (webId, fetch, registryConfig) {
    var podRoot = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
    if (!webId) return;
    var config = yield resolveRegistryConfig(webId, fetch, registryConfig, podRoot);
    var containers = [];
    var allowCreate = false;
    if (config.mode === "private") {
      allowCreate = true;
      containers = [config.privateRegistry];
    } else {
      containers = config.registries;
    }
    var normalized = Array.from(new Set(containers.map(normalizeContainerUrl$2).filter(Boolean)));
    if (!normalized.length) return;
    for (var containerUrl of normalized) {
      try {
        yield registerWebIdInRegistryContainer(containerUrl, fetch, webId, {
          allowCreate
        });
      } catch (err) {
        throw new Error("Failed to access registry (".concat(containerUrl, "): ").concat((err === null || err === void 0 ? void 0 : err.message) || err));
      }
    }
  });
  return function registerWebIdInRegistries(_x37, _x38, _x39) {
    return _ref16.apply(this, arguments);
  };
}();
var loadRegistryMembersFromContainer = /*#__PURE__*/function () {
  var _ref17 = _asyncToGenerator(function* (containerUrl, fetch) {
    var {
      onLoadError
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !fetch) return [];
    try {
      var containerDataset = yield getSolidDataset(normalizedUrl, {
        fetch
      });
      var resourceUrls = getContainedResourceUrlAll(containerDataset);
      var members = new Set();
      for (var resourceUrl of resourceUrls) {
        try {
          var memberDataset = yield getSolidDataset(resourceUrl, {
            fetch
          });
          var memberThing = getThing(memberDataset, "".concat(resourceUrl, "#it")) || getThingAll(memberDataset)[0];
          var memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
          if (memberWebId) members.add(memberWebId);
        } catch (error) {
          onLoadError === null || onLoadError === void 0 || onLoadError(error);
        }
      }
      return Array.from(members);
    } catch (err) {
      var _err$response4;
      var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response4 = err.response) === null || _err$response4 === void 0 ? void 0 : _err$response4.status);
      onLoadError === null || onLoadError === void 0 || onLoadError(err);
      if (status === 404) return [];
      console.warn("Failed to load registry container", normalizedUrl, err);
      return [];
    }
  });
  return function loadRegistryMembersFromContainer(_x40, _x41) {
    return _ref17.apply(this, arguments);
  };
}();
var syncRegistryMembersInContainer = /*#__PURE__*/function () {
  var _ref18 = _asyncToGenerator(function* (containerUrl, fetch, members) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !fetch) return;
    var cleanedMembers = Array.from(new Set((members || []).map(m => (m || "").trim()).filter(Boolean)));
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield getSolidDataset(normalizedUrl, {
      fetch
    });
    var resourceUrls = getContainedResourceUrlAll(containerDataset);
    var existing = new Map();
    for (var resourceUrl of resourceUrls) {
      try {
        var memberDataset = yield getSolidDataset(resourceUrl, {
          fetch
        });
        var memberThing = getThing(memberDataset, "".concat(resourceUrl, "#it")) || getThingAll(memberDataset)[0];
        var memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
        if (memberWebId) {
          existing.set(memberWebId, resourceUrl);
        }
      } catch (_unused9) {
        // Ignore malformed entries.
      }
    }
    for (var [_memberWebId, _resourceUrl] of existing.entries()) {
      if (!cleanedMembers.includes(_memberWebId)) {
        yield deleteFile(_resourceUrl, {
          fetch
        });
        existing.delete(_memberWebId);
      }
    }
    for (var _memberWebId2 of cleanedMembers) {
      if (!existing.has(_memberWebId2)) {
        yield registerWebIdInRegistryContainer(normalizedUrl, fetch, _memberWebId2, {
          allowCreate
        });
      }
    }
  });
  return function syncRegistryMembersInContainer(_x42, _x43, _x44) {
    return _ref18.apply(this, arguments);
  };
}();
var ensureCatalogStructure = /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator(function* (session) {
    var _session$info;
    var {
      title,
      description,
      registryConfig,
      podRoot: podRootOverride
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!(session !== null && session !== void 0 && (_session$info = session.info) !== null && _session$info !== void 0 && _session$info.webId)) {
      throw new Error("No Solid WebID available.");
    }
    var webId = session.info.webId;
    var podRoot = podRootOverride || getPodRoot$1(webId);
    var fetch = session.fetch;
    yield ensureContainer("".concat(podRoot).concat(CATALOG_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(DATASET_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(SERIES_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(RECORDS_CONTAINER), fetch);

    // Legacy local registry.ttl is no longer used.

    var catalogDocUrl = getCatalogDocUrl(webId, podRoot);
    var catalogResourceUrl = getCatalogResourceUrl(webId, podRoot);
    yield ensureCatalogDocument(session, catalogDocUrl, {
      title: title || "Solid Dataspace Catalog",
      description: description || "",
      contactPoint: webId
    });
    yield makePublicReadable(catalogDocUrl, fetch);
    yield makePublicReadable("".concat(podRoot).concat(CATALOG_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(DATASET_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(SERIES_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(RECORDS_CONTAINER), fetch);
    yield setCatalogLinkInProfile(webId, catalogResourceUrl, fetch);
    yield registerWebIdInRegistries(webId, fetch, registryConfig, podRoot);
    return {
      catalogDocUrl,
      catalogUrl: catalogResourceUrl
    };
  });
  return function ensureCatalogStructure(_x45) {
    return _ref19.apply(this, arguments);
  };
}();
var resolveCatalogContextFromWebId = /*#__PURE__*/function () {
  var _ref22 = _asyncToGenerator(function* (webId, fetch) {
    var knownCatalogUrl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    var fallback = knownCatalogUrl || getCatalogResourceUrl(webId);
    if (!webId || !fetch) return catalogOrigin(fallback);
    try {
      var profileDoc = yield getSolidDataset(webId.split("#")[0], {
        fetch
      });
      var profile = getThing(profileDoc, webId);
      var storageRoots = profile ? safeGetUrlAll(profile, "http://www.w3.org/ns/pim/space#storage") : [];
      var profileCatalog = profile && (getUrl(profile, SDP_CATALOG) || getUrl(profile, LEGACY_SDP_CATALOG) || getUrl(profile, DCAT$1.catalog));
      var catalogUrl = knownCatalogUrl || profileCatalog || (storageRoots[0] ? "".concat(storageRoots[0].replace(/\/+$/, ""), "/").concat(CATALOG_DOC, "#it") : fallback);
      return catalogOrigin(catalogUrl, storageRoots);
    } catch (err) {
      console.warn("Failed to resolve catalog provenance from profile:", err);
      return catalogOrigin(fallback);
    }
  });
  return function resolveCatalogContextFromWebId(_x49, _x50) {
    return _ref22.apply(this, arguments);
  };
}();
var resolveCatalogUrlFromWebId = /*#__PURE__*/function () {
  var _ref23 = _asyncToGenerator(function* (webId, fetch) {
    var _yield$resolveCatalog;
    return ((_yield$resolveCatalog = yield resolveCatalogContextFromWebId(webId, fetch)) === null || _yield$resolveCatalog === void 0 ? void 0 : _yield$resolveCatalog.catalogUrl) || getCatalogResourceUrl(webId);
  });
  return function resolveCatalogUrlFromWebId(_x51, _x52) {
    return _ref23.apply(this, arguments);
  };
}();
var loadRegistryMembers = /*#__PURE__*/function () {
  var _ref24 = _asyncToGenerator(function* (webId, fetch) {
    var {
      podRoot = "",
      onLoadError
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var members = new Set();
    if (webId) members.add(webId);
    var config = yield loadRegistryConfig(webId, fetch, {
      podRoot,
      onLoadError
    });
    var containers = [];
    if (config.mode === "private") {
      containers = [config.privateRegistry];
    } else {
      containers = config.registries || [];
    }
    var normalized = Array.from(new Set(containers.map(normalizeContainerUrl$2).filter(Boolean)));
    if (!normalized.length) return Array.from(members);
    for (var containerUrl of normalized) {
      try {
        var containerDataset = yield getSolidDataset(containerUrl, {
          fetch
        });
        var resourceUrls = getContainedResourceUrlAll(containerDataset);
        for (var resourceUrl of resourceUrls) {
          try {
            var memberDataset = yield getSolidDataset(resourceUrl, {
              fetch
            });
            var memberThing = getThing(memberDataset, "".concat(resourceUrl, "#it")) || getThingAll(memberDataset)[0];
            var memberWebId = memberThing ? getUrl(memberThing, FOAF.member) : "";
            if (memberWebId) members.add(memberWebId);
          } catch (error) {
            onLoadError === null || onLoadError === void 0 || onLoadError(error);
          }
        }
      } catch (err) {
        console.warn("Failed to load registry container:", containerUrl, err);
        onLoadError === null || onLoadError === void 0 || onLoadError(err);
      }
    }
    return Array.from(members);
  });
  return function loadRegistryMembers(_x53, _x54) {
    return _ref24.apply(this, arguments);
  };
}();
var parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  var _datasetDoc$internal_, _primaryDistribution$;
  var datasetThing = resolveDatasetThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;
  var baseIri = (datasetDoc === null || datasetDoc === void 0 || (_datasetDoc$internal_ = datasetDoc.internal_resourceInfo) === null || _datasetDoc$internal_ === void 0 ? void 0 : _datasetDoc$internal_.sourceIri) || getDocumentUrl(datasetUrl);
  var identifier = getStringNoLocale(datasetThing, DCTERMS.identifier) || datasetUrl;
  var types = getUrlAll(datasetThing, RDF.type) || [];
  var seriesMembersRaw = safeGetUrlAll(datasetThing, DCAT_SERIES_MEMBER);
  var isService = types.includes(DATA_SERVICE);
  var isSeries = types.includes(DCAT_DATASET_SERIES) || types.includes(DCAT$1.DatasetSeries) || types.includes("http://www.w3.org/ns/dcat#DatasetSeries") || seriesMembersRaw.length > 0;
  var title = getAnyString(datasetThing, DCTERMS.title) || "Untitled dataset";
  var description = getAnyString(datasetThing, DCTERMS.description) || "";
  var issued = getDatetime(datasetThing, DCTERMS.issued);
  var modified = getDatetime(datasetThing, DCTERMS.modified);
  var publisherLiteral = getAnyString(datasetThing, DCTERMS.publisher) || "";
  var publisherRef = getUrl(datasetThing, DCTERMS.publisher) || "";
  var publisher = publisherLiteral;
  if (!publisher && publisherRef) {
    var publisherThing = getThing(datasetDoc, publisherRef);
    if (publisherThing) {
      publisher = getAnyString(publisherThing, FOAF.name) || getAnyString(publisherThing, VCARD.fn) || getAnyString(publisherThing, DCTERMS.title) || "";
    }
  }
  if (!publisher) publisher = publisherRef;
  var creator = getUrl(datasetThing, DCTERMS.creator) || "";
  var theme = getStringNoLocale(datasetThing, DCAT$1.theme) || getUrl(datasetThing, DCAT$1.theme) || "";
  if (!theme) {
    theme = getAnyString(datasetThing, DCAT$1.theme) || "";
  }
  var accessRights = getStringNoLocale(datasetThing, DCTERMS.accessRights) || "";
  var contactRef = getUrl(datasetThing, DCAT$1.contactPoint) || "";
  var contactLiteral = getStringNoLocale(datasetThing, DCAT$1.contactPoint) || getAnyString(datasetThing, DCAT$1.contactPoint) || "";
  var contact = stripMailto(contactLiteral);
  var contactType = contact ? contactLiteral.startsWith("mailto:") || contact.includes("@") ? "email" : isValidUrl(contact) ? "url" : "text" : "";
  if (!contact && contactRef) {
    var contactThing = getThing(datasetDoc, contactRef);
    if (contactThing) {
      var mailto = getUrl(contactThing, VCARD.hasEmail) || getUrl(contactThing, VCARD.value) || getStringNoLocale(contactThing, VCARD.hasEmail) || getStringNoLocale(contactThing, VCARD.value) || getUrl(contactThing, FOAF.mbox) || getStringNoLocale(contactThing, FOAF.mbox) || "";
      if (mailto) {
        contact = stripMailto(mailto);
        contactType = "email";
      } else {
        var contactUrl = getUrl(contactThing, VCARD_HAS_URL) || getUrl(contactThing, VCARD_URL) || "";
        if (contactUrl) {
          contact = contactUrl;
          contactType = "url";
        } else {
          contact = getAnyString(contactThing, VCARD.fn) || "";
          contactType = contact ? "text" : "";
        }
      }
    } else if (isValidUrl(contactRef)) {
      contact = contactRef;
      contactType = "url";
    }
  }
  var legacyModels = [...safeGetUrlAll(datasetThing, DCTERMS.conformsTo), ...safeGetUrlAll(datasetThing, LEGACY_DCAT_CONFORMS_TO)];
  var distributions = safeGetUrlAll(datasetThing, DCAT$1.distribution).map(url => {
    var distributionUrl = resolveUrl(url, baseIri);
    var thing = getThing(datasetDoc, distributionUrl) || getThing(datasetDoc, url);
    if (!thing) return null;
    var downloadURL = getUrl(thing, DCAT$1.downloadURL) || "";
    var accessURL = getUrl(thing, DCAT$1.accessURL) || "";
    var conformsTo = safeGetUrlAll(thing, DCTERMS.conformsTo);
    return {
      url: distributionUrl,
      downloadURL: downloadURL ? resolveUrl(downloadURL, baseIri) : "",
      accessURL: accessURL ? resolveUrl(accessURL, baseIri) : "",
      mediaType: getUrl(thing, DCAT$1.mediaType) || getStringNoLocale(thing, DCAT$1.mediaType) || getAnyString(thing, DCTERMS.format) || getUrl(thing, DCTERMS.format) || "",
      conformsTo: [...new Set(conformsTo.length ? conformsTo : legacyModels)]
    };
  }).filter(Boolean);
  var primaryDistribution = distributions.find(item => item.downloadURL || item.accessURL);
  var accessUrlDataset = (primaryDistribution === null || primaryDistribution === void 0 ? void 0 : primaryDistribution.downloadURL) || (primaryDistribution === null || primaryDistribution === void 0 ? void 0 : primaryDistribution.accessURL) || "";
  var semanticModels = [...new Set(distributions.flatMap(item => item.conformsTo).concat(legacyModels))];
  var accessUrlModel = (primaryDistribution === null || primaryDistribution === void 0 || (_primaryDistribution$ = primaryDistribution.conformsTo) === null || _primaryDistribution$ === void 0 ? void 0 : _primaryDistribution$[0]) || semanticModels[0] || "";
  var fileFormat = (primaryDistribution === null || primaryDistribution === void 0 ? void 0 : primaryDistribution.mediaType) || "";
  var distributionAccessType = !primaryDistribution || primaryDistribution.downloadURL ? "download" : "access";
  var isPublic = (accessRights || "").toLowerCase() === "public";
  var seriesMembers = isSeries ? seriesMembersRaw : [];
  var inSeries = safeGetUrlAll(datasetThing, DCAT_IN_SERIES);
  return _objectSpread2$2(_objectSpread2$2({
    identifier,
    title,
    description,
    issued: issued ? issued.toISOString() : "",
    modified: modified ? modified.toISOString() : "",
    publisher,
    publisher_url: publisherRef,
    contact_point: contact,
    contact_point_type: contactType,
    access_url_dataset: accessUrlDataset,
    access_url_semantic_model: accessUrlModel,
    distributions,
    semanticModels,
    file_format: fileFormat,
    distribution_access_type: distributionAccessType,
    theme,
    is_public: isPublic,
    webid: creator,
    datasetUrl,
    datasetType: isService ? "service" : isSeries ? "series" : "dataset"
  }, isService ? {
    endpointURL: getUrl(datasetThing, "http://www.w3.org/ns/dcat#endpointURL") || "",
    endpointDescription: getUrl(datasetThing, "http://www.w3.org/ns/dcat#endpointDescription") || "",
    authentication: getStringNoLocale(datasetThing, SERVICE_AUTH) || "public",
    servesDataset: safeGetUrlAll(datasetThing, "http://www.w3.org/ns/dcat#servesDataset")
  } : {}), {}, {
    seriesMembers,
    inSeries
  });
};
var loadCatalogDatasets = /*#__PURE__*/function () {
  var _ref25 = _asyncToGenerator(function* (catalogUrl, fetch, onLoadError) {
    var documents = new Map();
    var visited = new Set();
    var datasets = new Map();
    var reportedFailures = new Set();
    var read = url => {
      var docUrl = getDocumentUrl(url);
      if (!documents.has(docUrl)) {
        if (documents.size >= 1000) throw new Error("Catalog metadata document limit reached.");
        documents.set(docUrl, getSolidDataset(docUrl, {
          fetch
        }));
      }
      return documents.get(docUrl);
    };
    var pending = [catalogUrl];
    var _loop2 = function* _loop2() {
      var next = [];
      yield Promise.all(pending.map(/*#__PURE__*/function () {
        var _ref26 = _asyncToGenerator(function* (url) {
          if (visited.has(url)) return;
          visited.add(url);
          try {
            var doc = yield read(url);
            var thing = getThing(doc, url) || getThingByTypes(doc, [DCAT$1.Catalog, DCAT$1.CatalogRecord, DCAT$1.Dataset, DCAT$1.DatasetSeries, DATA_SERVICE]);
            if (!thing) return;
            var types = getUrlAll(thing, RDF.type);
            if (url === catalogUrl || types.includes(DCAT$1.Catalog)) {
              next.push(...safeGetUrlAll(thing, DCAT$1.dataset), ...safeGetUrlAll(thing, DCAT$1.record), ...safeGetUrlAll(thing, SERVICE_LINK), ...safeGetUrlAll(thing, "http://www.w3.org/ns/dcat#datasetSeries"));
              return;
            }
            if (types.includes(DCAT$1.CatalogRecord)) {
              next.push(...safeGetUrlAll(thing, FOAF.primaryTopic));
              return;
            }
            // Distribution descriptions are metadata. Never fetch downloadURL,
            // accessURL or conformsTo targets during catalog discovery.
            for (var distribution of safeGetUrlAll(thing, DCAT$1.distribution)) {
              if (!getThing(doc, distribution)) {
                var distributionDoc = yield read(distribution);
                getThingAll(distributionDoc).forEach(item => {
                  doc = setThing(doc, item);
                });
              }
            }
            var dataset = parseDatasetFromDoc(doc, thing.url);
            if (dataset) datasets.set(dataset.datasetUrl, _objectSpread2$2(_objectSpread2$2({}, dataset), {}, {
              catalogUrl,
              catalogOrigins: [catalogOrigin(catalogUrl)].filter(Boolean)
            }));
            next.push(...safeGetUrlAll(thing, DCAT_SERIES_MEMBER));
          } catch (err) {
            var _err$response6;
            var isCatalog = url === catalogUrl;
            var docUrl = getDocumentUrl(url);
            var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response6 = err.response) === null || _err$response6 === void 0 ? void 0 : _err$response6.status);
            // Private records may be linked by a public catalog. Respect their ACLs;
            // a rejected record is not a failed login or a broken registry.
            if (!isCatalog && status === 403) return;
            // dcat:record and dcat:dataset can point at the same failed document.
            if (!reportedFailures.has(docUrl)) {
              reportedFailures.add(docUrl);
              console.warn("Catalog metadata unavailable", docUrl, status || (err === null || err === void 0 ? void 0 : err.message));
              onLoadError === null || onLoadError === void 0 || onLoadError(err, {
                stage: isCatalog ? "catalog" : "dataset"
              });
            }
            if (isCatalog) throw err;
          }
        });
        return function (_x58) {
          return _ref26.apply(this, arguments);
        };
      }()));
      pending = [...new Set(next)].filter(url => !visited.has(url));
    };
    while (pending.length) {
      yield* _loop2();
    }
    return [...datasets.values()];
  });
  return function loadCatalogDatasets(_x55, _x56, _x57) {
    return _ref25.apply(this, arguments);
  };
}();
var mergeDatasets = lists => {
  var map = new Map();
  lists.flat().forEach(dataset => {
    if (!dataset) return;
    var key = dataset.datasetUrl || "".concat(dataset.catalogUrl || "unknown-catalog", "::").concat(dataset.identifier || "");
    var existing = map.get(key);
    if (!existing) {
      map.set(key, dataset);
      return;
    }
    var existingModified = existing.modified ? new Date(existing.modified).getTime() : 0;
    var nextModified = dataset.modified ? new Date(dataset.modified).getTime() : 0;
    var origins = datasetCatalogOrigins({
      catalogOrigins: [...datasetCatalogOrigins(existing), ...datasetCatalogOrigins(dataset)]
    });
    map.set(key, _objectSpread2$2(_objectSpread2$2({}, nextModified >= existingModified ? dataset : existing), {}, {
      catalogOrigins: origins
    }));
  });
  return Array.from(map.values());
};
var loadAggregatedDatasets = /*#__PURE__*/function () {
  var _ref27 = _asyncToGenerator(function* (session, fetchOverride) {
    var _session$info3;
    var {
      researchRegistries,
      registryUrl,
      requireEnrollment = false,
      onLoadError: _onLoadError,
      usePublicCache = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var webId = (session === null || session === void 0 || (_session$info3 = session.info) === null || _session$info3 === void 0 ? void 0 : _session$info3.webId) || "";
    var fetch = fetchOverride || (session === null || session === void 0 ? void 0 : session.fetch) || (typeof window !== "undefined" ? window.fetch.bind(window) : fetchOverride);
    if (!fetch) return {
      datasets: [],
      catalogs: []
    };
    var snapshots = [];
    if (requireEnrollment) {
      var _session$info4;
      if (!webId || !(session !== null && session !== void 0 && (_session$info4 = session.info) !== null && _session$info4 !== void 0 && _session$info4.isLoggedIn) || !registryUrl) return {
        datasets: [],
        catalogs: []
      };
      var failed = false;
      var config = yield loadRegistryConfig(webId, fetch, {
        onLoadError: error => {
          failed = true;
          _onLoadError === null || _onLoadError === void 0 || _onLoadError(error);
        }
      });
      var enrolled = (config.mode === 'private' ? [config.privateRegistry] : config.registries || []).map(normalizeContainerUrl$2);
      if (failed) throw new Error('Registry enrollment could not be loaded.');
      if (!enrolled.includes(normalizeContainerUrl$2(registryUrl))) throw new Error('The selected registry is not enrolled.');
      researchRegistries = [normalizeContainerUrl$2(registryUrl)];
    }
    var selectedRegistries = registryUrl ? [normalizeContainerUrl$2(registryUrl)] : researchRegistries;
    if (usePublicCache) {
      if (!Array.isArray(selectedRegistries)) {
        var registryConfig = yield loadRegistryConfig(webId, fetch, {
          onLoadError: _onLoadError
        });
        if (registryConfig.mode !== "private") selectedRegistries = registryConfig.registries;
      }
      if (Array.isArray(selectedRegistries)) snapshots = yield loadPublicCatalogCache(selectedRegistries);
    }
    var cachedMembers = new Map(snapshots.filter(s => s.discoveryComplete).map(s => [s.registryUrl, s.members]));
    var cachedCatalogs = new Map(snapshots.flatMap(s => s.members.map(m => [m.webId, m.catalogUrl])));
    var registryMembers;
    if (Array.isArray(selectedRegistries)) {
      var membersByRegistry = yield Promise.all(selectedRegistries.map(registryUrl => {
        var _cachedMembers$get;
        return ((_cachedMembers$get = cachedMembers.get(normalizeContainerUrl$2(registryUrl))) === null || _cachedMembers$get === void 0 ? void 0 : _cachedMembers$get.map(m => m.webId)) || loadRegistryMembersFromContainer(registryUrl, fetch, {
          onLoadError: _onLoadError
        });
      }));
      registryMembers = Array.from(new Set(membersByRegistry.flat().filter(memberWebId => {
        try {
          var url = new URL(memberWebId);
          return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password && !url.search;
        } catch (_unused10) {
          return false;
        }
      })));
      // An explicit host registry is complete: do not add the viewer's own Pod
      // unless their WebID is actually a member of this registry.
      if (!registryUrl && !Array.isArray(researchRegistries) && webId && !registryMembers.includes(webId)) registryMembers.push(webId);
    } else {
      registryMembers = yield loadRegistryMembers(webId, fetch, {
        onLoadError: _onLoadError
      });
    }
    var catalogContexts = yield Promise.all(registryMembers.map(member => resolveCatalogContextFromWebId(member, fetch, member !== webId ? cachedCatalogs.get(member) || "" : "")));
    var catalogUrls = catalogContexts.map(context => (context === null || context === void 0 ? void 0 : context.catalogUrl) || "");
    var origins = new Map(catalogContexts.filter(Boolean).map(context => [context.catalogUrl, context]));
    if (snapshots.length) {
      var _session$info5;
      var ownIndex = registryMembers.indexOf(webId);
      fetch = cachedCatalogFetch(snapshots, fetch, {
        ownCatalogUrl: catalogUrls[ownIndex],
        isLoggedIn: Boolean(session === null || session === void 0 || (_session$info5 = session.info) === null || _session$info5 === void 0 ? void 0 : _session$info5.isLoggedIn)
      });
    }
    var uniqueCatalogUrls = Array.from(new Set(catalogUrls.filter(catalogUrl => {
      if (!catalogUrl) return false;
      try {
        var url = new URL(catalogUrl);
        return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password && !url.search;
      } catch (_unused11) {
        return false;
      }
    })));
    var cache = loadCache();
    var now = Date.now();
    var useCacheOnly = now - cache.updatedAt < CACHE_TTL_MS;
    var results = [];
    var updatedCache = _objectSpread2$2(_objectSpread2$2({}, cache), {}, {
      catalogs: _objectSpread2$2({}, cache.catalogs)
    });
    var fetchCatalog = /*#__PURE__*/function () {
      var _ref28 = _asyncToGenerator(function* (catalogUrl) {
        try {
          var datasets = yield loadCatalogDatasets(catalogUrl, fetch, _onLoadError);
          updatedCache.catalogs[catalogUrl] = {
            datasets,
            lastSuccess: now
          };
          return {
            datasets,
            lastSuccess: now,
            failed: false
          };
        } catch (err) {
          console.warn("Catalog load failed", catalogUrl, err);
          _onLoadError === null || _onLoadError === void 0 || _onLoadError(err, {
            stage: "catalog"
          });
          var cached = cache.catalogs[catalogUrl];
          if (cached !== null && cached !== void 0 && cached.datasets) {
            return {
              datasets: cached.datasets,
              lastSuccess: cached.lastSuccess || 0,
              failed: true
            };
          }
          return {
            datasets: [],
            lastSuccess: 0,
            failed: true
          };
        }
      });
      return function fetchCatalog(_x61) {
        return _ref28.apply(this, arguments);
      };
    }();
    for (var catalogUrl of uniqueCatalogUrls) {
      if (useCacheOnly && cache.catalogs[catalogUrl]) {
        results.push({
          catalogUrl,
          datasets: cache.catalogs[catalogUrl].datasets || [],
          lastSuccess: cache.catalogs[catalogUrl].lastSuccess || 0,
          failed: false
        });
        continue;
      }
      var catalogResult = yield fetchCatalog(catalogUrl);
      results.push(_objectSpread2$2({
        catalogUrl
      }, catalogResult));
    }
    updatedCache.updatedAt = now;
    var annotated = results.flatMap(result => {
      var lastSeen = result.lastSuccess || 0;
      var age = now - lastSeen;
      if (lastSeen && age > DROP_AFTER_MS) {
        return [];
      }
      var stale = lastSeen && age > STALE_AFTER_MS;
      return (result.datasets || []).map(dataset => _objectSpread2$2(_objectSpread2$2({}, dataset), {}, {
        catalogUrl: result.catalogUrl,
        catalogOrigins: [origins.get(result.catalogUrl) || catalogOrigin(result.catalogUrl)].filter(Boolean),
        lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : "",
        isStale: Boolean(stale)
      }));
    });
    return {
      datasets: mergeDatasets(annotated),
      catalogs: uniqueCatalogUrls
    };
  });
  return function loadAggregatedDatasets(_x59, _x60) {
    return _ref27.apply(this, arguments);
  };
}();
var DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";
var DCAT_DATASET_SERIES = "http://www.w3.org/ns/dcat#DatasetSeries";
var DCAT_SERIES_MEMBER = DCAT$1.seriesMember || "http://www.w3.org/ns/dcat#seriesMember";
var DCAT_IN_SERIES = DCAT$1.inSeries || "http://www.w3.org/ns/dcat#inSeries";
var toThemeIri = value => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  var slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return "".concat(DEFAULT_THEME_NS).concat(encodeURIComponent(slug));
};
var isValidUrl = value => {
  if (!value || typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch (_unused12) {
    return false;
  }
};
var buildDatasetResource = function buildDatasetResource(datasetDocUrl, input) {
  var _ref29, _input$in_series;
  var previous = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var datasetUrl = "".concat(datasetDocUrl, "#it");
  var datasetThing = previous || createThing({
    url: datasetUrl
  });
  datasetThing = addUrl(datasetThing, RDF.type, DCAT$1.Dataset);
  datasetThing = removeAll(datasetThing, DCTERMS.identifier);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.identifier, input.identifier);
  datasetThing = removeAll(datasetThing, DCTERMS.title);
  datasetThing = setLocaleString(datasetThing, DCTERMS.title, input.title || "");
  datasetThing = removeAll(datasetThing, DCTERMS.description);
  datasetThing = setLocaleString(datasetThing, DCTERMS.description, input.description || "");
  datasetThing = removeAll(datasetThing, DCTERMS.issued);
  datasetThing = setDatetime(datasetThing, DCTERMS.issued, new Date(input.issued || safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.modified);
  datasetThing = setDatetime(datasetThing, DCTERMS.modified, new Date(safeNow()));
  datasetThing = removeAll(datasetThing, DCTERMS.publisher);
  if (input.publisher_url) {
    datasetThing = setUrl(datasetThing, DCTERMS.publisher, input.publisher_url);
  } else if (input.publisher) {
    datasetThing = setLocaleString(datasetThing, DCTERMS.publisher, input.publisher);
  }
  datasetThing = removeAll(datasetThing, DCTERMS.creator);
  if (input.webid) {
    datasetThing = setUrl(datasetThing, DCTERMS.creator, input.webid);
  }
  datasetThing = removeAll(datasetThing, DCAT$1.contactPoint);
  datasetThing = removeAll(datasetThing, DCAT$1.theme);
  if (input.theme) {
    datasetThing = setUrl(datasetThing, DCAT$1.theme, toThemeIri(input.theme));
  }
  datasetThing = removeAll(datasetThing, DCTERMS.conformsTo);
  datasetThing = removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  datasetThing = removeAll(datasetThing, DCTERMS.accessRights);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.accessRights, input.is_public ? "public" : "restricted");
  var inSeries = (_ref29 = (_input$in_series = input.in_series) !== null && _input$in_series !== void 0 ? _input$in_series : input.inSeries) !== null && _ref29 !== void 0 ? _ref29 : previous ? getUrlAll(previous, DCAT_IN_SERIES) : [];
  datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
  if (inSeries) {
    var seriesList = Array.isArray(inSeries) ? inSeries : [inSeries];
    seriesList.filter(Boolean).forEach(seriesUrl => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }
  return datasetThing;
};
var buildSeriesResource = function buildSeriesResource(seriesDocUrl, input) {
  var previous = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var seriesUrl = input.seriesUrl || "".concat(seriesDocUrl, "#it");
  var seriesThing = previous || createThing({
    url: seriesUrl
  });
  seriesThing = addUrl(seriesThing, RDF.type, DCAT_DATASET_SERIES);
  seriesThing = addUrl(seriesThing, RDF.type, DCAT$1.Dataset);
  seriesThing = removeAll(seriesThing, DCTERMS.identifier);
  if (input.identifier) {
    seriesThing = setStringNoLocale(seriesThing, DCTERMS.identifier, input.identifier);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.title);
  seriesThing = setLocaleString(seriesThing, DCTERMS.title, input.title || "");
  seriesThing = removeAll(seriesThing, DCTERMS.description);
  if (input.description) {
    seriesThing = setLocaleString(seriesThing, DCTERMS.description, input.description);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.issued);
  if (input.issued) {
    seriesThing = setDatetime(seriesThing, DCTERMS.issued, new Date(input.issued));
  }
  seriesThing = removeAll(seriesThing, DCTERMS.modified);
  seriesThing = setDatetime(seriesThing, DCTERMS.modified, new Date(safeNow()));
  seriesThing = removeAll(seriesThing, DCTERMS.publisher);
  if (input.publisher_url) {
    seriesThing = setUrl(seriesThing, DCTERMS.publisher, input.publisher_url);
  } else if (input.publisher) {
    seriesThing = setLocaleString(seriesThing, DCTERMS.publisher, input.publisher);
  }
  seriesThing = removeAll(seriesThing, DCTERMS.creator);
  if (input.webid) {
    seriesThing = setUrl(seriesThing, DCTERMS.creator, input.webid);
  }
  seriesThing = removeAll(seriesThing, DCAT$1.contactPoint);
  if (input.contact_point || input.contact_url) {
    var contactThing = buildContactThing(seriesDocUrl, input);
    input.__contactThing = contactThing;
    seriesThing = setUrl(seriesThing, DCAT$1.contactPoint, contactThing.url);
  }
  if (input.publisher_url && input.publisher) {
    input.__publisherThing = buildPublisherThing(input);
  }
  seriesThing = removeAll(seriesThing, DCAT$1.theme);
  if (input.theme) {
    seriesThing = setUrl(seriesThing, DCAT$1.theme, toThemeIri(input.theme));
  }
  seriesThing = removeAll(seriesThing, DCTERMS.accessRights);
  seriesThing = removeAll(seriesThing, DCAT_SERIES_MEMBER);
  (input.seriesMembers || []).filter(memberUrl => isValidUrl(memberUrl)).forEach(memberUrl => {
    seriesThing = addUrl(seriesThing, DCAT_SERIES_MEMBER, memberUrl);
  });
  return seriesThing;
};
var buildContactThing = (datasetDocUrl, input) => {
  if (!input.contact_point && !input.contact_url) return null;
  var contactUrl = "".concat(datasetDocUrl, "#contact");
  var contactThing = createThing({
    url: contactUrl
  });
  contactThing = addUrl(contactThing, RDF.type, VCARD.Individual);
  if (input.publisher) {
    contactThing = setLocaleString(contactThing, VCARD.fn, input.publisher);
  }
  contactThing = removeAll(contactThing, VCARD.hasEmail);
  if (input.contact_point) {
    contactThing = setUrl(contactThing, VCARD.hasEmail, "mailto:".concat(input.contact_point));
  }
  contactThing = removeAll(contactThing, VCARD_HAS_URL);
  if (input.contact_url) {
    contactThing = setUrl(contactThing, VCARD_HAS_URL, input.contact_url);
  }
  return contactThing;
};
var buildPublisherThing = input => {
  if (!input.publisher_url || !input.publisher) return null;
  var publisherThing = createThing({
    url: input.publisher_url
  });
  publisherThing = addUrl(publisherThing, RDF.type, FOAF.Agent);
  publisherThing = setLocaleString(publisherThing, FOAF.name, input.publisher);
  return publisherThing;
};
var isLocalPodResource = function isLocalPodResource(webId, targetUrl) {
  var podRootOverride = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  if (!webId || !targetUrl) return false;
  try {
    var root = new URL(podRootOverride || getPodRoot$1(webId));
    var target = new URL(targetUrl);
    if (root.protocol !== "https:" && root.protocol !== "http:" || root.username || root.password || root.search || root.hash || target.protocol !== "https:" && target.protocol !== "http:" || target.username || target.password || target.search) {
      return false;
    }
    var rootPath = root.pathname.endsWith("/") ? root.pathname : "".concat(root.pathname, "/");
    return target.origin === root.origin && target.pathname.startsWith(rootPath);
  } catch (_unused13) {
    return false;
  }
};
var getAclTargetUrl = resourceUrl => {
  var target = new URL(resourceUrl);
  target.hash = "";
  return target.href;
};
var ensurePublicReadOnlyResourceAccess = /*#__PURE__*/function () {
  var _ref30 = _asyncToGenerator(function* (session, resourceUrl) {
    var _session$info6;
    var {
      podRoot = ""
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!(session !== null && session !== void 0 && (_session$info6 = session.info) !== null && _session$info6 !== void 0 && _session$info6.webId) || typeof session.fetch !== "function") {
      throw new Error("An authenticated Solid session is required.");
    }
    if (!isLocalPodResource(session.info.webId, resourceUrl, podRoot)) {
      throw new Error("Public programmatic datasets must use a resource in the owner's Pod.");
    }
    var aclTargetUrl = getAclTargetUrl(resourceUrl);
    if (new URL(aclTargetUrl).pathname.endsWith("/")) {
      throw new Error("Public programmatic datasets must use a non-container resource.");
    }
    yield setPublicReadAccess(aclTargetUrl, session.fetch, true);
    var {
      resourceAcl
    } = yield getResourceAndAcl(aclTargetUrl, session.fetch);
    var publicAccess = getPublicResourceAccess(resourceAcl) || {};
    if (publicAccess.read !== true || publicAccess.append !== false || publicAccess.write !== false || publicAccess.control !== false) {
      throw new Error("Resource does not have verified public read-only access after ACL update: ".concat(resourceUrl));
    }
  });
  return function ensurePublicReadOnlyResourceAccess(_x62, _x63) {
    return _ref30.apply(this, arguments);
  };
}();
var ensureRestrictedResourceAccess = /*#__PURE__*/function () {
  var _ref31 = _asyncToGenerator(function* (session, resourceUrl) {
    var _session$info7;
    var {
      podRoot = ""
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!(session !== null && session !== void 0 && (_session$info7 = session.info) !== null && _session$info7 !== void 0 && _session$info7.webId) || typeof session.fetch !== "function") {
      throw new Error("An authenticated Solid session is required.");
    }
    if (!isLocalPodResource(session.info.webId, resourceUrl, podRoot)) {
      throw new Error("Restricted programmatic datasets must use a resource in the owner's Pod.");
    }
    var aclTargetUrl = getAclTargetUrl(resourceUrl);
    yield setPublicReadAccess(aclTargetUrl, session.fetch, false);
    var {
      resourceAcl
    } = yield getResourceAndAcl(aclTargetUrl, session.fetch);
    var publicAccess = getPublicResourceAccess(resourceAcl);
    if (publicAccess.read || publicAccess.append || publicAccess.write || publicAccess.control) {
      throw new Error("Resource still has public access after ACL update: ".concat(resourceUrl));
    }
  });
  return function ensureRestrictedResourceAccess(_x64, _x65) {
    return _ref31.apply(this, arguments);
  };
}();
var syncLinkedResourceAccess = /*#__PURE__*/function () {
  var _ref32 = _asyncToGenerator(function* (session, input) {
    var distributions = profileDistributions(input);
    var downloadUrls = new Set(distributions.map(item => item.downloadURL).filter(Boolean));
    var urls = [...new Set([...downloadUrls, ...distributions.flatMap(item => item.conformsTo)])];
    for (var url of urls) {
      var _session$info8;
      if (!isLocalPodResource(session === null || session === void 0 || (_session$info8 = session.info) === null || _session$info8 === void 0 ? void 0 : _session$info8.webId, url, input.podRoot)) {
        // External schema references describe local data; their ACL is not ours to change.
        // Restricted downloads must still be in the owner's Pod, even when also used as a model.
        if (downloadUrls.has(url) && input.strict_restricted_acl && !input.is_public) {
          throw new Error("Restricted linked resource is outside the owner's Pod: ".concat(url));
        }
        continue;
      }
      try {
        if (input.strict_restricted_acl && !input.is_public) {
          yield ensureRestrictedResourceAccess(session, url, {
            podRoot: input.podRoot
          });
        } else if (input.strict_public_acl && input.is_public) {
          yield ensurePublicReadOnlyResourceAccess(session, url, {
            podRoot: input.podRoot
          });
        } else {
          yield setPublicReadAccess(url, session.fetch, Boolean(input.is_public));
        }
      } catch (err) {
        console.warn("Failed to sync linked resource ACL for", url, err);
        if (input.is_public || input.strict_restricted_acl || input.strict_public_acl) {
          var accessLabel = input.is_public ? "public" : "restricted";
          throw new Error("Failed to make linked resource ".concat(accessLabel, ": ").concat(url));
        }
      }
    }
  });
  return function syncLinkedResourceAccess(_x66, _x67) {
    return _ref32.apply(this, arguments);
  };
}();
var withCatalogRecord = function withCatalogRecord(document, docUrl, datasetUrl) {
  var operationId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var record = getThing(document, docUrl) || createThing({
    url: docUrl
  });
  record = addUrl(record, RDF.type, DCAT$1.CatalogRecord);
  record = setUrl(record, FOAF.primaryTopic, datasetUrl);
  record = setDatetime(record, DCTERMS.modified, new Date());
  if (operationId) {
    var changeUrl = "".concat(docUrl, "#change-").concat(operationId);
    var change = createThing({
      url: changeUrl
    });
    change = addUrl(change, RDF.type, SDM_CHANGE_EVENT);
    change = setDatetime(change, DCTERMS.modified, new Date());
    document = setThing(document, change);
    if (!getUrlAll(record, SDM_CHANGELOG).includes(changeUrl)) record = addUrl(record, SDM_CHANGELOG, changeUrl);
  }
  return setThing(document, record);
};
var readExistingMetadata = /*#__PURE__*/function () {
  var _ref33 = _asyncToGenerator(function* (url, fetch) {
    var allowCreate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    try {
      return yield getSolidDataset(url, {
        fetch
      });
    } catch (error) {
      if (isNotFound(error) && allowCreate) return null;
      throw error;
    }
  });
  return function readExistingMetadata(_x68, _x69) {
    return _ref33.apply(this, arguments);
  };
}();
var addDistributionDescriptions = (document, datasetThing, docUrl, input) => {
  var values = profileDistributions(input);
  assertProfileDistributions(values);
  var original = document;
  var oldThing = getThing(document, datasetThing.url);
  for (var oldUrl of oldThing ? getUrlAll(oldThing, DCAT$1.distribution) : []) {
    if (oldUrl.startsWith("".concat(docUrl, "#"))) document = removeThing(document, oldUrl);
  }
  datasetThing = removeAll(datasetThing, DCAT$1.distribution);
  values.forEach((distribution, index) => {
    var _distribution$url;
    // All descriptions are secondary resources of this record document.
    var url = (_distribution$url = distribution.url) !== null && _distribution$url !== void 0 && _distribution$url.startsWith("".concat(docUrl, "#")) ? distribution.url : "".concat(docUrl, "#dist").concat(index || "");
    var thing = getThing(original, url) || createThing({
      url
    });
    for (var predicate of [DCAT$1.downloadURL, DCAT$1.accessURL, DCAT$1.mediaType, DCTERMS.format, DCTERMS.conformsTo]) {
      thing = removeAll(thing, predicate);
    }
    thing = addUrl(thing, RDF.type, DCAT$1.Distribution);
    thing = setUrl(thing, DCAT$1.downloadURL, distribution.downloadURL);
    if (distribution.accessURL) thing = setUrl(thing, DCAT$1.accessURL, distribution.accessURL);
    thing = /^https?:/.test(distribution.mediaType) ? setUrl(thing, DCAT$1.mediaType, distribution.mediaType) : setStringNoLocale(thing, DCAT$1.mediaType, distribution.mediaType);
    distribution.conformsTo.forEach(model => {
      thing = addUrl(thing, DCTERMS.conformsTo, model);
    });
    document = setThing(document, thing);
    datasetThing = addUrl(datasetThing, DCAT$1.distribution, url);
  });
  return setThing(document, datasetThing);
};
var prepareDatasetDocument = /*#__PURE__*/function () {
  var _ref34 = _asyncToGenerator(function* (session, datasetDocUrl, input) {
    var {
      allowCreate = true,
      createOnly = false
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var previous = yield readExistingMetadata(datasetDocUrl, session.fetch, allowCreate);
    if (createOnly && previous) {
      var error = new Error("A dataset with this identifier already exists. Use the edit action to update it.");
      error.code = "dataset-already-exists";
      throw error;
    }
    var document = previous || createSolidDataset();
    var datasetThing = buildDatasetResource(datasetDocUrl, input, getThing(document, "".concat(datasetDocUrl, "#it")));
    var publisher = buildPublisherThing(input);
    if (publisher) document = setThing(document, publisher);
    var contact = buildContactThing(datasetDocUrl, input);
    if (contact) {
      document = setThing(document, contact);
      datasetThing = setUrl(datasetThing, DCAT$1.contactPoint, contact.url);
    }
    document = addDistributionDescriptions(document, datasetThing, datasetDocUrl, input);
    document = withCatalogRecord(document, datasetDocUrl, datasetThing.url, input.operation_id);
    yield assertProfileRecord({
      url: datasetDocUrl,
      turtle: yield solidDatasetAsTurtle(document)
    }, session.fetch);
    return {
      previous,
      document
    };
  });
  return function prepareDatasetDocument(_x70, _x71, _x72) {
    return _ref34.apply(this, arguments);
  };
}();
var writeDatasetDocument = /*#__PURE__*/function () {
  var _ref35 = _asyncToGenerator(function* (session, datasetDocUrl, input) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var {
      previous,
      document
    } = options.prepared || (yield prepareDatasetDocument(session, datasetDocUrl, input, options));
    yield saveProfileDocument(datasetDocUrl, previous, document, session.fetch);
    try {
      yield makePublicReadable(datasetDocUrl, session.fetch);
      yield syncLinkedResourceAccess(session, input);
    } catch (error) {
      if (!previous) error.catalogDatasetCreated = true;
      throw error;
    }
  });
  return function writeDatasetDocument(_x73, _x74, _x75) {
    return _ref35.apply(this, arguments);
  };
}();
var validateSeriesMembers = /*#__PURE__*/function () {
  var _ref36 = _asyncToGenerator(function* (session, urls) {
    var members = [];
    var _loop3 = function* _loop3() {
      var doc = yield getSolidDataset(getDocumentUrl(url), {
        fetch: session.fetch
      });
      var thing = resolveDatasetThing(doc, url);
      for (var distribution of thing ? getUrlAll(thing, DCAT$1.distribution) : []) {
        if (!getThing(doc, distribution)) {
          var linked = yield getSolidDataset(getDocumentUrl(distribution), {
            fetch: session.fetch
          });
          getThingAll(linked).forEach(item => {
            doc = setThing(doc, item);
          });
        }
      }
      var member = parseDatasetFromDoc(doc, url);
      if (!member) throw new Error("Series member metadata is unavailable.");
      // Legacy fallback is for reading only; do not publish new series on that basis.
      var distributions = member.distributions.map(distribution => _objectSpread2$2(_objectSpread2$2({}, distribution), {}, {
        conformsTo: getUrlAll(getThing(doc, distribution.url), DCTERMS.conformsTo)
      }));
      assertProfileDistributions(distributions);
      yield assertProfileRecord({
        url: getDocumentUrl(url),
        turtle: yield solidDatasetAsTurtle(doc)
      }, session.fetch);
      members.push(member);
    };
    for (var url of urls) {
      yield* _loop3();
    }
    return members;
  });
  return function validateSeriesMembers(_x76, _x77) {
    return _ref36.apply(this, arguments);
  };
}();
var validateSeriesContainer = /*#__PURE__*/function () {
  var _ref37 = _asyncToGenerator(function* (session, containerUrl) {
    var resourceUrls = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    if (!containerUrl || !containerUrl.endsWith("/")) {
      throw new Error("A dataset series must describe a Solid container. Select files from one container or supply its URL.");
    }
    var container = yield getSolidDataset(containerUrl, {
      fetch: session.fetch
    });
    var root = getThing(container, containerUrl);
    var containerTypes = root ? getUrlAll(root, RDF.type) : [];
    var containerType = containerTypes.find(type => [LDP.Container, LDP.BasicContainer, "http://www.w3.org/ns/ldp#DirectContainer", "http://www.w3.org/ns/ldp#IndirectContainer"].includes(type));
    if (!containerType) throw new Error("The series URL is not an RDF description of a Solid container.");
    var contained = new Set(getContainedResourceUrlAll(container));
    if (resourceUrls.some(url => !contained.has(url))) {
      throw new Error("All series members must describe resources contained in the selected Solid container.");
    }
    return containerType;
  });
  return function validateSeriesContainer(_x78, _x79) {
    return _ref37.apply(this, arguments);
  };
}();
var seriesInput = /*#__PURE__*/function () {
  var _ref38 = _asyncToGenerator(function* (session, input) {
    var members = yield validateSeriesMembers(session, input.seriesMembers || []);
    var parents = [...new Set(members.map(member => new URL("./", member.access_url_dataset).href))];
    var containerUrl = input.container_url || input.access_url_dataset || (parents.length === 1 ? parents[0] : "");
    var containerType = yield validateSeriesContainer(session, containerUrl, members.map(member => member.access_url_dataset));
    return _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      access_url_dataset: containerUrl,
      file_format: "text/turtle",
      access_url_semantic_model: containerType,
      distribution_access_type: "download",
      distributions: [{
        downloadURL: containerUrl,
        mediaType: "text/turtle",
        conformsTo: [containerType]
      }]
    });
  });
  return function seriesInput(_x80, _x81) {
    return _ref38.apply(this, arguments);
  };
}();
var prepareSeriesDocument = /*#__PURE__*/function () {
  var _ref39 = _asyncToGenerator(function* (session, seriesDocUrl, input) {
    var {
      createOnly = false
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalized = yield seriesInput(session, input);
    var previous = yield readExistingMetadata(seriesDocUrl, session.fetch);
    if (createOnly && previous) throw new Error("A dataset series with this identifier already exists. Use the edit action to update it.");
    var document = previous || createSolidDataset();
    var seriesThing = buildSeriesResource(seriesDocUrl, normalized, getThing(document, input.seriesUrl || "".concat(seriesDocUrl, "#it")));
    if (normalized.__publisherThing) document = setThing(document, normalized.__publisherThing);
    if (normalized.__contactThing) document = setThing(document, normalized.__contactThing);
    document = addDistributionDescriptions(document, seriesThing, seriesDocUrl, normalized);
    document = withCatalogRecord(document, seriesDocUrl, seriesThing.url);
    yield assertProfileRecord({
      url: seriesDocUrl,
      turtle: yield solidDatasetAsTurtle(document)
    }, session.fetch);
    return {
      previous,
      document
    };
  });
  return function prepareSeriesDocument(_x82, _x83, _x84) {
    return _ref39.apply(this, arguments);
  };
}();
var writeSeriesDocument = /*#__PURE__*/function () {
  var _ref40 = _asyncToGenerator(function* (session, seriesDocUrl, input, prepared) {
    var {
      previous,
      document
    } = prepared || (yield prepareSeriesDocument(session, seriesDocUrl, input));
    yield saveProfileDocument(seriesDocUrl, previous, document, session.fetch);
    yield makePublicReadable(seriesDocUrl, session.fetch);
  });
  return function writeSeriesDocument(_x85, _x86, _x87, _x88) {
    return _ref40.apply(this, arguments);
  };
}();
var updateCatalogDatasets = /*#__PURE__*/function () {
  var _ref41 = _asyncToGenerator(function* (session, catalogDocUrl, datasetUrl) {
    var {
      remove,
      recordUrls = []
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
    if (!remove) yield assertProfileCatalogAddition(datasetUrl, session.fetch);
    yield mutateCatalogDocument(session, catalogDocUrl, (current, snapshot) => {
      var recordRef = toCatalogDatasetRef(catalogDocUrl, getDocumentUrl(datasetUrl));
      var records = new Set(snapshot.recordRefs);
      if (remove) {
        current.delete(datasetRef);
        records.delete(recordRef);
        recordUrls.forEach(url => records.delete(toCatalogDatasetRef(catalogDocUrl, url)));
      } else {
        current.add(datasetRef);
        records.add(recordRef);
      }
      snapshot.recordRefs = [...records];
      return current;
    });
    yield makePublicReadable(catalogDocUrl, session.fetch);
  });
  return function updateCatalogDatasets(_x89, _x90, _x91) {
    return _ref41.apply(this, arguments);
  };
}();
var linkDatasetToSeries = /*#__PURE__*/function () {
  var _ref42 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series link", datasetDocUrl, err);
      return;
    }
    var previous = solidDataset;
    var datasetThing = getThing(solidDataset, datasetUrl);
    if (!datasetThing) {
      datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
    }
    if (!datasetThing) return;
    var existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
    if (existing.includes(seriesUrl)) return;
    datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    solidDataset = setThing(solidDataset, datasetThing);
    yield saveProfileDocument(datasetDocUrl, previous, solidDataset, session.fetch);
    yield makePublicReadable(datasetDocUrl, session.fetch);
  });
  return function linkDatasetToSeries(_x92, _x93, _x94) {
    return _ref42.apply(this, arguments);
  };
}();
var unlinkDatasetFromSeries = /*#__PURE__*/function () {
  var _ref43 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series unlink", datasetDocUrl, err);
      return;
    }
    var previous = solidDataset;
    var datasetThing = getThing(solidDataset, datasetUrl);
    if (!datasetThing) {
      datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
    }
    if (!datasetThing) return;
    var existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
    datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
    existing.filter(url => url !== seriesUrl).forEach(url => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, url);
    });
    solidDataset = setThing(solidDataset, datasetThing);
    yield saveProfileDocument(datasetDocUrl, previous, solidDataset, session.fetch);
  });
  return function unlinkDatasetFromSeries(_x95, _x96, _x97) {
    return _ref43.apply(this, arguments);
  };
}();
var generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dataset-".concat(Date.now());
};
var validateDatasetCreation = /*#__PURE__*/function () {
  var _ref44 = _asyncToGenerator(function* (session, input) {
    var _session$info9, _session$info10;
    if (!(session !== null && session !== void 0 && (_session$info9 = session.info) !== null && _session$info9 !== void 0 && _session$info9.webId) || typeof session.fetch !== "function") throw new Error("An authenticated Solid session is required.");
    validateDatasetInput(input);
    var podRoot = (input === null || input === void 0 ? void 0 : input.podRoot) || getPodRoot$1(session === null || session === void 0 || (_session$info10 = session.info) === null || _session$info10 === void 0 ? void 0 : _session$info10.webId);
    var identifier = input.identifier || (input.datasetUrl ? getDocumentUrl(input.datasetUrl).split("/").pop().replace(/\.ttl$/, "") : generateIdentifier());
    if (!CATALOG_IDENTIFIER_PATTERN.test(identifier)) throw new Error("Dataset identifier contains unsupported characters.");
    var datasetDocUrl = "".concat(podRoot).concat(DATASET_CONTAINER).concat(identifier, ".ttl");
    var datasetUrl = "".concat(datasetDocUrl, "#it");
    var normalized = _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      identifier
    });
    // Complete validation before catalog setup, ACL changes or publication.
    var prepared = yield prepareDatasetDocument(session, datasetDocUrl, normalized, {
      createOnly: true
    });
    return {
      podRoot,
      identifier,
      datasetDocUrl,
      datasetUrl,
      normalized,
      prepared
    };
  });
  return function validateDatasetCreation(_x98, _x99) {
    return _ref44.apply(this, arguments);
  };
}();
var createDataset = /*#__PURE__*/function () {
  var _ref45 = _asyncToGenerator(function* (session, input) {
    var {
      podRoot,
      identifier,
      datasetDocUrl,
      datasetUrl,
      normalized,
      prepared
    } = yield validateDatasetCreation(session, input);
    yield ensureCatalogStructure(session, {
      podRoot,
      registryConfig: input === null || input === void 0 ? void 0 : input.registryConfig
    });
    yield writeDatasetDocument(session, datasetDocUrl, normalized, {
      prepared
    });
    try {
      yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), datasetUrl, {
        remove: false
      });
    } catch (error) {
      error.catalogDatasetCreated = true;
      throw error;
    }
    clearCache();
    return {
      datasetUrl,
      identifier,
      recordUrl: datasetDocUrl
    };
  });
  return function createDataset(_x100, _x101) {
    return _ref45.apply(this, arguments);
  };
}();
var createDatasetSeries = /*#__PURE__*/function () {
  var _ref46 = _asyncToGenerator(function* (session, input) {
    var _session$info11;
    if (!(session !== null && session !== void 0 && (_session$info11 = session.info) !== null && _session$info11 !== void 0 && _session$info11.webId)) throw new Error("No Solid WebID available.");
    var identifier = input.identifier || (input.datasetUrl ? getDocumentUrl(input.datasetUrl).split("/").pop().replace(/\.ttl$/, "") : generateIdentifier());
    if (!CATALOG_IDENTIFIER_PATTERN.test(identifier)) throw new Error("Dataset identifier contains unsupported characters.");
    var seriesDocUrl = getSeriesDocUrl(session.info.webId, identifier);
    var seriesUrl = getSeriesResourceUrl(seriesDocUrl);
    var seriesMembers = input.seriesMembers || [];
    if (!Array.isArray(seriesMembers) || seriesMembers.some(url => !isValidUrl(url))) throw new Error("Series members must be metadata IRIs.");
    var normalized = _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      identifier,
      seriesUrl,
      seriesMembers
    });
    var prepared = yield prepareSeriesDocument(session, seriesDocUrl, normalized, {
      createOnly: true
    });
    yield ensureCatalogStructure(session);
    yield writeSeriesDocument(session, seriesDocUrl, normalized, prepared);
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
      remove: false
    });
    for (var memberUrl of seriesMembers) {
      yield linkDatasetToSeries(session, memberUrl, seriesUrl);
    }
    clearCache();
    return {
      seriesUrl,
      identifier,
      recordUrl: seriesDocUrl
    };
  });
  return function createDatasetSeries(_x102, _x103) {
    return _ref46.apply(this, arguments);
  };
}();
var updateDataset = /*#__PURE__*/function () {
  var _ref47 = _asyncToGenerator(function* (session, input) {
    var _session$info12;
    if (!input.datasetUrl) throw new Error("Missing dataset URL.");
    validateDatasetInput(input);
    var podRoot = (input === null || input === void 0 ? void 0 : input.podRoot) || getPodRoot$1(session === null || session === void 0 || (_session$info12 = session.info) === null || _session$info12 === void 0 ? void 0 : _session$info12.webId);
    var datasetDocUrl = getDocumentUrl(input.datasetUrl);
    yield writeDatasetDocument(session, datasetDocUrl, input, {
      allowCreate: false
    });
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), input.datasetUrl, {
      remove: false
    });
    clearCache();
  });
  return function updateDataset(_x104, _x105) {
    return _ref47.apply(this, arguments);
  };
}();
var updateDatasetSeries = /*#__PURE__*/function () {
  var _ref48 = _asyncToGenerator(function* (session, input) {
    var seriesUrl = input.seriesUrl || input.datasetUrl;
    if (!seriesUrl) throw new Error("Missing series URL.");
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    var nextMembers = Array.isArray(input.seriesMembers) ? input.seriesMembers.filter(memberUrl => isValidUrl(memberUrl)) : [];
    var previousMembers = [];
    try {
      var seriesDoc = yield getSolidDataset(seriesDocUrl, {
        fetch: session.fetch
      });
      var seriesThing = getThing(seriesDoc, seriesUrl) || getThingAll(seriesDoc)[0];
      if (seriesThing) {
        previousMembers = getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
      }
    } catch (err) {
      console.warn("Failed to read series for update", seriesDocUrl, err);
    }
    yield writeSeriesDocument(session, seriesDocUrl, _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      seriesUrl,
      seriesMembers: nextMembers
    }));
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
      remove: false
    });
    var prevSet = new Set(previousMembers);
    var nextSet = new Set(nextMembers);
    var added = nextMembers.filter(url => !prevSet.has(url));
    var removed = previousMembers.filter(url => !nextSet.has(url));
    for (var memberUrl of added) {
      yield linkDatasetToSeries(session, memberUrl, seriesUrl);
    }
    for (var _memberUrl of removed) {
      yield unlinkDatasetFromSeries(session, _memberUrl, seriesUrl);
    }
    clearCache();
  });
  return function updateDatasetSeries(_x106, _x107) {
    return _ref48.apply(this, arguments);
  };
}();
var unlinkFromParentSeries = /*#__PURE__*/function () {
  var _ref49 = _asyncToGenerator(function* (session, datasetUrl, podRoot) {
    var doc = yield readExistingMetadata(getDocumentUrl(datasetUrl), session.fetch);
    if (!doc) return;
    var thing = resolveDatasetThing(doc, datasetUrl);
    var _loop4 = function* _loop4() {
        if (!isLocalPodResource(session.info.webId, seriesUrl, podRoot)) {
          throw new Error("A parent series belongs to another Pod; remove its member link before deleting this entry.");
        }
        var seriesDocUrl = getDocumentUrl(seriesUrl);
        var previous = yield readExistingMetadata(seriesDocUrl, session.fetch);
        if (!previous) return 0; // continue
        var series = getThing(previous, seriesUrl);
        if (!series) return 0; // continue
        var members = getUrlAll(series, DCAT_SERIES_MEMBER).filter(url => url !== datasetUrl);
        series = removeAll(series, DCAT_SERIES_MEMBER);
        members.forEach(url => {
          series = addUrl(series, DCAT_SERIES_MEMBER, url);
        });
        yield saveProfileDocument(seriesDocUrl, previous, setThing(previous, series), session.fetch);
      },
      _ret2;
    for (var seriesUrl of thing ? getUrlAll(thing, DCAT_IN_SERIES) : []) {
      _ret2 = yield* _loop4();
      if (_ret2 === 0) continue;
    }
  });
  return function unlinkFromParentSeries(_x108, _x109, _x110) {
    return _ref49.apply(this, arguments);
  };
}();
var deleteSeriesEntry = /*#__PURE__*/function () {
  var _ref50 = _asyncToGenerator(function* (session, seriesUrl, identifier) {
    if (!seriesUrl) return;
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    yield unlinkFromParentSeries(session, seriesUrl, getPodRoot$1(session.info.webId));
    var memberUrls = [];
    try {
      var seriesDoc = yield getSolidDataset(seriesDocUrl, {
        fetch: session.fetch
      });
      var seriesThing = getThing(seriesDoc, seriesUrl) || getThingAll(seriesDoc)[0];
      if (seriesThing) {
        memberUrls = getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
      }
    } catch (err) {
      console.warn("Failed to read series document", seriesDocUrl, err);
    }
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
      remove: true
    });
    for (var memberUrl of memberUrls) {
      yield unlinkDatasetFromSeries(session, memberUrl, seriesUrl);
    }
    try {
      yield deleteFile(seriesDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to delete series doc", seriesDocUrl, err);
    }
    clearCache();
  });
  return function deleteSeriesEntry(_x111, _x112, _x113) {
    return _ref50.apply(this, arguments);
  };
}();
var deleteDatasetEntry = /*#__PURE__*/function () {
  var _ref51 = _asyncToGenerator(function* (session, datasetUrl, identifier) {
    var {
      podRoot: podRootOverride = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!datasetUrl) return;
    var podRoot = podRootOverride || getPodRoot$1(session.info.webId);
    var safeDatasetUrl = assertCatalogDatasetDeletionTarget(podRoot, datasetUrl, identifier);
    var datasetDocUrl = getDocumentUrl(safeDatasetUrl);
    try {
      var recordDocUrl = identifier ? "".concat(podRoot).concat(RECORDS_CONTAINER).concat(identifier, ".ttl") : "";
      yield unlinkFromParentSeries(session, safeDatasetUrl, podRoot);
      yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), safeDatasetUrl, {
        remove: true,
        recordUrls: recordDocUrl ? [recordDocUrl, "".concat(recordDocUrl, "#desc")] : []
      });
      yield deleteCatalogDatasetDocuments({
        datasetDocUrl,
        recordDocUrl,
        fetch: session.fetch,
        deleteResource: deleteFile
      });
    } finally {
      clearCache();
    }
  });
  return function deleteDatasetEntry(_x114, _x115, _x116) {
    return _ref51.apply(this, arguments);
  };
}();

// API metadata uses an explicit extension profile. Existing dataset MUST rules
// and linked data/model ACLs remain unchanged.
var saveDataService = /*#__PURE__*/function () {
  var _ref53 = _asyncToGenerator(function* (session, input) {
    var _session$info14;
    if (!(session !== null && session !== void 0 && (_session$info14 = session.info) !== null && _session$info14 !== void 0 && _session$info14.webId) || typeof session.fetch !== "function") throw new Error("An authenticated Solid session is required.");
    var normalized = normalizeServiceInput(input);
    var root = getPodRoot$1(session.info.webId);
    var identifier = input.identifier || (input.datasetUrl ? getDocumentUrl(input.datasetUrl).split("/").pop().replace(/\.ttl$/, "") : generateIdentifier());
    if (!CATALOG_IDENTIFIER_PATTERN.test(identifier)) throw new Error("Dataset identifier contains unsupported characters.");
    var docUrl = input.datasetUrl ? getDocumentUrl(input.datasetUrl) : "".concat(root).concat(DATASET_CONTAINER).concat(identifier, ".ttl");
    if (new URL(docUrl).href !== docUrl || !docUrl.startsWith(root + DATASET_CONTAINER) || docUrl.slice((root + DATASET_CONTAINER).length).includes("/") || new URL(docUrl).search || new URL(docUrl).hash) throw new Error("API metadata must belong to your catalog.");
    var catalogDocUrl = getCatalogDocUrl(session.info.webId);
    var catalog = yield readCatalogSnapshot(session.fetch, catalogDocUrl);
    if (!catalog.exists) throw new Error("Set up your catalog before publishing an API.");
    var previous = yield readExistingMetadata(docUrl, session.fetch, !input.datasetUrl);
    if (!input.datasetUrl && previous) throw new Error("An entry with this identifier already exists.");
    if (previous && !getUrlAll(getThing(previous, docUrl + "#it"), RDF.type).includes(DATA_SERVICE)) throw new Error("This entry is not an API.");
    var document = previous || createSolidDataset();
    var service = getThing(document, docUrl + "#it") || createThing({
      url: docUrl + "#it"
    });
    service = setUrl(service, RDF.type, DATA_SERVICE);
    for (var [property, value] of [[DCTERMS.title, normalized.title], [DCTERMS.description, normalized.description], [DCTERMS.publisher, normalized.publisher], [DCTERMS.identifier, identifier], [DCTERMS.accessRights, normalized.authentication === "public" ? "public" : "restricted"], [SERVICE_AUTH, normalized.authentication]]) service = setStringNoLocale(service, property, value);
    service = setUrl(service, DCTERMS.creator, session.info.webId);
    service = setDatetime(service, DCTERMS.modified, new Date());
    if (!previous) service = setDatetime(service, DCTERMS.issued, new Date());
    service = setUrl(service, "http://www.w3.org/ns/dcat#endpointURL", normalized.endpointURL);
    service = removeAll(service, "http://www.w3.org/ns/dcat#endpointDescription");
    if (normalized.endpointDescription) service = setUrl(service, "http://www.w3.org/ns/dcat#endpointDescription", normalized.endpointDescription);
    service = removeAll(service, "http://www.w3.org/ns/dcat#servesDataset");
    normalized.servesDataset.forEach(url => {
      service = addUrl(service, "http://www.w3.org/ns/dcat#servesDataset", url);
    });
    document = withCatalogRecord(setThing(document, service), docUrl, service.url);
    document = setThing(document, addUrl(getThing(document, docUrl), DCTERMS.conformsTo, SERVICE_PROFILE));
    yield assertProfileRecord({
      url: docUrl,
      turtle: yield solidDatasetAsTurtle(document)
    }, session.fetch);
    yield saveProfileDocument(docUrl, previous, document, session.fetch);
    if (!previous) yield makePublicReadable(docUrl, session.fetch);
    yield mutateCatalogDocument(session, catalogDocUrl, (refs, snapshot) => {
      snapshot.serviceRefs = [...new Set([...(snapshot.serviceRefs || []), toCatalogDatasetRef(catalogDocUrl, service.url)])];
      snapshot.recordRefs = [...new Set([...snapshot.recordRefs, toCatalogDatasetRef(catalogDocUrl, docUrl)])];
      return refs;
    });
    clearCache();
    return {
      datasetUrl: service.url,
      identifier,
      recordUrl: docUrl
    };
  });
  return function saveDataService(_x118, _x119) {
    return _ref53.apply(this, arguments);
  };
}();
var removeDataService = /*#__PURE__*/function () {
  var _ref54 = _asyncToGenerator(function* (session, service) {
    var _session$info15;
    var root = getPodRoot$1(session === null || session === void 0 || (_session$info15 = session.info) === null || _session$info15 === void 0 ? void 0 : _session$info15.webId),
      docUrl = getDocumentUrl(service.datasetUrl);
    if (!root || new URL(docUrl).href !== docUrl || !docUrl.startsWith(root + DATASET_CONTAINER) || docUrl.slice((root + DATASET_CONTAINER).length).includes("/") || new URL(docUrl).search || new URL(docUrl).hash) throw new Error("API metadata must belong to your catalog.");
    var document = yield getSolidDataset(docUrl, {
      fetch: session.fetch
    });
    if (!getUrlAll(getThing(document, service.datasetUrl), RDF.type).includes(DATA_SERVICE)) throw new Error("This entry is not an API.");
    // Only remove discovery links. Keep the document, data, API and ACLs intact.
    var catalogDocUrl = getCatalogDocUrl(session.info.webId);
    yield mutateCatalogDocument(session, catalogDocUrl, (refs, snapshot) => {
      snapshot.serviceRefs = (snapshot.serviceRefs || []).filter(ref => ref !== toCatalogDatasetRef(catalogDocUrl, service.datasetUrl));
      snapshot.recordRefs = snapshot.recordRefs.filter(ref => ref !== toCatalogDatasetRef(catalogDocUrl, docUrl));
      return refs;
    });
    clearCache();
  });
  return function removeDataService(_x120, _x121) {
    return _ref54.apply(this, arguments);
  };
}();

var getPodRootFromWebId$2 = webId => {
  if (!webId) return "";
  try {
    var url = new URL(webId);
    var segments = url.pathname.split("/").filter(Boolean);
    var profileIndex = segments.indexOf("profile");
    var baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments.slice(0, -1);
    var basePath = baseSegments.length ? "/".concat(baseSegments.join("/"), "/") : "/";
    return "".concat(url.origin).concat(basePath);
  } catch (_unused) {
    var base = webId.split("/profile/")[0];
    return base.endsWith("/") ? base : "".concat(base, "/");
  }
};
var normalizeContainerUrl$1 = url => url && url.endsWith("/") ? url : "".concat(url, "/");
var getContainerName = function getContainerName(url) {
  var rootUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  if (rootUrl && normalizeContainerUrl$1(url) === normalizeContainerUrl$1(rootUrl)) return "Pod Root";
  var name = url.split("/").filter(Boolean).pop() || url;
  return decodeURIComponent(name);
};
var isCatalogContainer = url => url.includes("/catalog/");
var compareEntries$1 = (a, b) => a.name.localeCompare(b.name, undefined, {
  sensitivity: "base"
});
var getPathFromContainerUrl = (containerUrl, rootUrl) => {
  if (!containerUrl || !rootUrl) return "/";
  try {
    var root = new URL(normalizeContainerUrl$1(rootUrl));
    var current = new URL(normalizeContainerUrl$1(containerUrl));
    var rootPath = root.pathname.endsWith("/") ? root.pathname : "".concat(root.pathname, "/");
    var currentPath = current.pathname.endsWith("/") ? current.pathname : "".concat(current.pathname, "/");
    var relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
    var cleanPath = relativePath.replace(/^\/+|\/+$/g, "");
    return cleanPath ? "/".concat(cleanPath, "/") : "/";
  } catch (_unused2) {
    return "/";
  }
};
var sanitizeFolderName = value => value.trim().replace(/^\/+|\/+$/g, "");
function PodContainerPicker(_ref) {
  var {
    onSelectPath,
    webId
  } = _ref;
  var effectiveWebId = webId || session.info.webId;
  var rootUrl = useMemo(() => getPodRootFromWebId$2(effectiveWebId), [effectiveWebId]);
  var cacheRef = useRef(new Map());
  var [currentUrl, setCurrentUrl] = useState("");
  var [entries, setEntries] = useState([]);
  var [loading, setLoading] = useState(false);
  var [creating, setCreating] = useState(false);
  var [error, setError] = useState("");
  var [folderModalOpen, setFolderModalOpen] = useState(false);
  var [folderName, setFolderName] = useState("");
  var [folderModalError, setFolderModalError] = useState("");
  var mapEntries = useCallback((containerUrl, urls) => urls.filter(url => url.endsWith("/")).filter(url => !isCatalogContainer(url)).map(url => ({
    url: normalizeContainerUrl$1(url),
    name: getContainerName(url, containerUrl)
  })).sort(compareEntries$1), []);
  var loadContainer = useCallback(/*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (containerUrl) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!containerUrl) return;
      var normalizedUrl = normalizeContainerUrl$1(containerUrl);
      setCurrentUrl(normalizedUrl);
      setError("");
      if (!force && cacheRef.current.has(normalizedUrl)) {
        setEntries(cacheRef.current.get(normalizedUrl));
        return;
      }
      try {
        setLoading(true);
        var dataset = yield getSolidDataset(normalizedUrl, {
          fetch: session.fetch
        });
        var containedUrls = getContainedResourceUrlAll(dataset);
        var nextEntries = mapEntries(normalizedUrl, Array.from(new Set(containedUrls)));
        cacheRef.current.set(normalizedUrl, nextEntries);
        setEntries(nextEntries);
      } catch (err) {
        console.error("Failed to load pod container ".concat(normalizedUrl, ":"), err);
        setEntries([]);
        setError("This folder could not be loaded.");
      } finally {
        setLoading(false);
      }
    });
    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }(), [mapEntries]);
  useEffect(() => {
    cacheRef.current.clear();
    if (!rootUrl) {
      setCurrentUrl("");
      setEntries([]);
      return;
    }
    loadContainer(rootUrl, true);
  }, [rootUrl, loadContainer]);
  var crumbs = useMemo(() => {
    if (!rootUrl || !currentUrl) return [];
    try {
      var root = new URL(rootUrl);
      var current = new URL(currentUrl);
      var rootPath = root.pathname.endsWith("/") ? root.pathname : "".concat(root.pathname, "/");
      var currentPath = current.pathname.endsWith("/") ? current.pathname : "".concat(current.pathname, "/");
      var relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
      var parts = relativePath.split("/").filter(Boolean);
      var nextCrumbs = [{
        name: "Pod Root",
        url: rootUrl
      }];
      parts.forEach((part, index) => {
        nextCrumbs.push({
          name: decodeURIComponent(part),
          url: "".concat(rootUrl).concat(parts.slice(0, index + 1).join("/"), "/")
        });
      });
      return nextCrumbs;
    } catch (_unused3) {
      return [{
        name: "Pod Root",
        url: rootUrl
      }];
    }
  }, [currentUrl, rootUrl]);
  var openContainer = containerUrl => {
    if (!containerUrl) return;
    onSelectPath === null || onSelectPath === void 0 || onSelectPath(getPathFromContainerUrl(containerUrl, rootUrl));
    loadContainer(containerUrl);
  };
  var handleRefresh = () => {
    if (!currentUrl) return;
    cacheRef.current.delete(currentUrl);
    loadContainer(currentUrl, true);
  };
  var handleOpenFolderModal = () => {
    setFolderName("");
    setFolderModalError("");
    setFolderModalOpen(true);
  };
  var handleCloseFolderModal = () => {
    if (creating) return;
    setFolderModalOpen(false);
    setFolderName("");
    setFolderModalError("");
  };
  var handleCreateFolder = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(function* (event) {
      event === null || event === void 0 || event.preventDefault();
      var nextFolderName = sanitizeFolderName(folderName);
      if (!nextFolderName) {
        setFolderModalError("Folder name is required.");
        return;
      }
      if (/[\\/#?]/.test(nextFolderName)) {
        setFolderModalError("Folder name cannot contain /, \\, #, or ?.");
        return;
      }
      if (!currentUrl) return;
      var targetUrl = "".concat(normalizeContainerUrl$1(currentUrl)).concat(encodeURIComponent(nextFolderName), "/");
      try {
        setCreating(true);
        setError("");
        setFolderModalError("");
        yield createContainerAt(targetUrl, {
          fetch: session.fetch
        });
        cacheRef.current.delete(currentUrl);
        setFolderModalOpen(false);
        setFolderName("");
        onSelectPath === null || onSelectPath === void 0 || onSelectPath(getPathFromContainerUrl(targetUrl, rootUrl));
        yield loadContainer(targetUrl, true);
      } catch (err) {
        var _err$response;
        var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.status);
        if (status === 409 || status === 412) {
          setFolderModalOpen(false);
          setFolderName("");
          onSelectPath === null || onSelectPath === void 0 || onSelectPath(getPathFromContainerUrl(targetUrl, rootUrl));
          yield loadContainer(targetUrl, true);
          return;
        }
        console.error("Failed to create pod folder:", err);
        setFolderModalError("Folder could not be created.");
      } finally {
        setCreating(false);
      }
    });
    return function handleCreateFolder(_x2) {
      return _ref3.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "pod-container-picker"
  }, rootUrl ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-crumbs",
    translate: "no"
  }, crumbs.map((crumb, index) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: crumb.url
  }, index > 0 && /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-chevron-right pod-picker-crumb-separator"
  }), index === crumbs.length - 1 ? /*#__PURE__*/React.createElement("span", {
    className: "pod-picker-crumb-current"
  }, crumb.name) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-crumb-link",
    onClick: () => openContainer(crumb.url)
  }, crumb.name)))), /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-toolbar-actions pod-container-toolbar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-new-folder-button",
    onClick: handleOpenFolderModal,
    disabled: !currentUrl || loading || creating,
    title: "New Folder"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-folder-plus"
  }), creating ? "Creating..." : "New Folder"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-icon-button",
    onClick: handleRefresh,
    disabled: !currentUrl || loading,
    title: "Refresh"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-rotate-right"
  })))), error && /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state pod-picker-state--error"
  }, error), !error && loading && /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state"
  }, "Loading folders..."), !error && !loading && /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-table-wrap pod-container-table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "pod-picker-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Folder"))), /*#__PURE__*/React.createElement("tbody", null, entries.map(entry => /*#__PURE__*/React.createElement("tr", {
    key: entry.url,
    className: "pod-picker-folder",
    onClick: () => openContainer(entry.url)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-folder pod-picker-entry-icon"
  }), /*#__PURE__*/React.createElement("span", {
    title: entry.name,
    translate: "no"
  }, entry.name)))), entries.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    className: "pod-picker-empty"
  }, "No subfolders in this folder.")))))) : /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state pod-picker-state--error"
  }, "No Solid Pod is available."), folderModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "pod-folder-modal-backdrop",
    role: "presentation",
    onClick: handleCloseFolderModal,
    onKeyDownCapture: event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleCloseFolderModal();
      }
    }
  }, /*#__PURE__*/React.createElement("form", {
    className: "pod-folder-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "pod-folder-modal-title",
    onClick: event => event.stopPropagation(),
    onSubmit: handleCreateFolder
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-folder-modal-header"
  }, /*#__PURE__*/React.createElement("h6", {
    id: "pod-folder-modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-folder-plus"
  }), "New Folder"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-folder-modal-close",
    onClick: handleCloseFolderModal,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pod-folder-modal-body"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "pod-folder-name"
  }, "Folder name"), /*#__PURE__*/React.createElement("input", {
    id: "pod-folder-name",
    type: "text",
    value: folderName,
    onChange: event => setFolderName(event.target.value),
    placeholder: "e.g. raw-data",
    autoFocus: true
  }), folderModalError && /*#__PURE__*/React.createElement("div", {
    className: "pod-folder-modal-error"
  }, folderModalError)), /*#__PURE__*/React.createElement("div", {
    className: "pod-folder-modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-folder-modal-secondary",
    onClick: handleCloseFolderModal,
    disabled: creating
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pod-folder-modal-primary",
    disabled: creating || !folderName.trim()
  }, creating ? "Creating..." : "Create Folder")))));
}

var DATASET_EXTENSIONS = ["csv", "json", "geojson", "ttl", "jsonld", "rdf", "xml", "pdf", "docx", "txt"];
var SEMANTIC_MODEL_EXTENSIONS = ["ttl"];
var getPodRootFromWebId$1 = webId => {
  if (!webId) return "";
  try {
    var url = new URL(webId);
    var segments = url.pathname.split("/").filter(Boolean);
    var profileIndex = segments.indexOf("profile");
    var baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments.slice(0, -1);
    var basePath = baseSegments.length ? "/".concat(baseSegments.join("/"), "/") : "/";
    return "".concat(url.origin).concat(basePath);
  } catch (_unused) {
    var base = webId.split("/profile/")[0];
    return base.endsWith("/") ? base : "".concat(base, "/");
  }
};
var normalizeContainerUrl = url => url && url.endsWith("/") ? url : "".concat(url, "/");
var getResourceName = function getResourceName(url) {
  var containerUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var relative = containerUrl && url.startsWith(containerUrl) ? url.slice(containerUrl.length) : url.split("/").filter(Boolean).pop() || url;
  return decodeURIComponent(relative.replace(/\/$/, ""));
};
var getExtension = url => {
  var cleanUrl = url.split(/[?#]/)[0];
  var name = cleanUrl.split("/").filter(Boolean).pop() || "";
  var parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};
var isCatalogResource = url => url.includes("/catalog/");
var compareEntries = (a, b) => {
  if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, {
    sensitivity: "base"
  });
};
var isTtlResource = value => getExtension(value) === "ttl";
function PodResourcePicker(_ref) {
  var {
    multiple = false,
    resourceType = "dataset",
    selectedUrl = "",
    selectedUrls = [],
    onSelect,
    webId
  } = _ref;
  var effectiveWebId = webId || session.info.webId;
  var allowedExtensions = useMemo(() => new Set(resourceType === "semanticModel" ? SEMANTIC_MODEL_EXTENSIONS : DATASET_EXTENSIONS), [resourceType]);
  var rootUrl = useMemo(() => getPodRootFromWebId$1(effectiveWebId), [effectiveWebId]);
  var cacheRef = useRef(new Map());
  var [currentUrl, setCurrentUrl] = useState("");
  var [entries, setEntries] = useState([]);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [searchQuery, setSearchQuery] = useState("");
  var isSelectableResource = useCallback(url => allowedExtensions.has(getExtension(url)), [allowedExtensions]);
  var mapEntries = useCallback((containerUrl, urls) => urls.filter(url => !isCatalogResource(url)).map(url => {
    var isFolder = url.endsWith("/");
    return {
      url,
      name: getResourceName(url, containerUrl),
      isFolder,
      selectable: !isFolder && isSelectableResource(url)
    };
  }).filter(entry => entry.isFolder || entry.selectable).sort(compareEntries), [isSelectableResource]);
  var loadContainer = useCallback(/*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (containerUrl) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!containerUrl) return;
      var normalizedUrl = normalizeContainerUrl(containerUrl);
      setCurrentUrl(normalizedUrl);
      setError("");
      if (!force && cacheRef.current.has(normalizedUrl)) {
        setEntries(cacheRef.current.get(normalizedUrl));
        return;
      }
      try {
        setLoading(true);
        var dataset = yield getSolidDataset(normalizedUrl, {
          fetch: session.fetch
        });
        var containedUrls = getContainedResourceUrlAll(dataset);
        var nextEntries = mapEntries(normalizedUrl, Array.from(new Set(containedUrls)));
        cacheRef.current.set(normalizedUrl, nextEntries);
        setEntries(nextEntries);
      } catch (err) {
        console.error("Failed to load pod container ".concat(normalizedUrl, ":"), err);
        setEntries([]);
        setError("This folder could not be loaded.");
      } finally {
        setLoading(false);
      }
    });
    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }(), [mapEntries]);
  useEffect(() => {
    cacheRef.current.clear();
    setSearchQuery("");
    if (!rootUrl) {
      setCurrentUrl("");
      setEntries([]);
      return;
    }
    loadContainer(rootUrl, true);
  }, [rootUrl, loadContainer]);
  var crumbs = useMemo(() => {
    if (!rootUrl || !currentUrl) return [];
    try {
      var root = new URL(rootUrl);
      var current = new URL(currentUrl);
      var rootPath = root.pathname.endsWith("/") ? root.pathname : "".concat(root.pathname, "/");
      var currentPath = current.pathname.endsWith("/") ? current.pathname : "".concat(current.pathname, "/");
      var relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
      var parts = relativePath.split("/").filter(Boolean);
      var nextCrumbs = [{
        name: "Pod Root",
        url: rootUrl
      }];
      parts.forEach((part, index) => {
        nextCrumbs.push({
          name: decodeURIComponent(part),
          url: "".concat(rootUrl).concat(parts.slice(0, index + 1).join("/"), "/")
        });
      });
      return nextCrumbs;
    } catch (_unused2) {
      return [{
        name: "Pod Root",
        url: rootUrl
      }];
    }
  }, [currentUrl, rootUrl]);
  var visibleEntries = useMemo(() => {
    var query = searchQuery.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(entry => entry.name.toLowerCase().includes(query));
  }, [entries, searchQuery]);
  var selectedUrlList = useMemo(() => {
    var urls = multiple ? selectedUrls : [selectedUrl];
    return Array.from(new Set((urls || []).filter(Boolean)));
  }, [multiple, selectedUrl, selectedUrls]);
  var selectedUrlSet = useMemo(() => new Set(selectedUrlList), [selectedUrlList]);
  var hasSelectedUrls = selectedUrlList.length > 0;
  var selectedLabel = multiple && selectedUrlList.length > 1 ? "Selected Datasets (".concat(selectedUrlList.length, ")") : "Selected";
  var handleRefresh = () => {
    if (!currentUrl) return;
    cacheRef.current.delete(currentUrl);
    loadContainer(currentUrl, true);
  };
  var handleSelect = url => {
    if (!isSelectableResource(url)) return;
    if (!multiple) {
      onSelect === null || onSelect === void 0 || onSelect(url);
      return;
    }
    var nextUrls = selectedUrlSet.has(url) ? selectedUrlList.filter(selected => selected !== url) : [...selectedUrlList, url];
    onSelect === null || onSelect === void 0 || onSelect(nextUrls, url);
  };
  var handleRemoveSelected = url => {
    if (!multiple) return;
    onSelect === null || onSelect === void 0 || onSelect(selectedUrlList.filter(selected => selected !== url), url);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "pod-resource-picker"
  }, hasSelectedUrls && /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-heading"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-selected"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-circle-check"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, selectedLabel), /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-selected-list"
  }, selectedUrlList.map(url => /*#__PURE__*/React.createElement("div", {
    key: url,
    className: "pod-picker-selected-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-selected-text"
  }, /*#__PURE__*/React.createElement("strong", null, getResourceName(url)), /*#__PURE__*/React.createElement("small", null, url)), multiple && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-selected-remove",
    onClick: event => {
      event.stopPropagation();
      handleRemoveSelected(url);
    },
    "aria-label": "Remove ".concat(getResourceName(url)),
    title: "Remove"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  })))))))), rootUrl ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-crumbs",
    translate: "no"
  }, crumbs.map((crumb, index) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: crumb.url
  }, index > 0 && /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-chevron-right pod-picker-crumb-separator"
  }), index === crumbs.length - 1 ? /*#__PURE__*/React.createElement("span", {
    className: "pod-picker-crumb-current"
  }, crumb.name) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-crumb-link",
    onClick: () => loadContainer(crumb.url)
  }, crumb.name)))), /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-toolbar-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-search"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: event => setSearchQuery(event.target.value),
    placeholder: "Search files..."
  }), /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-magnifying-glass"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pod-picker-icon-button",
    onClick: handleRefresh,
    disabled: !currentUrl || loading,
    title: "Refresh"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-rotate-right"
  })))), error ? /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state pod-picker-state--error"
  }, error) : loading ? /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state"
  }, "Loading...") : /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "pod-picker-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"))), /*#__PURE__*/React.createElement("tbody", null, visibleEntries.map(entry => {
    var isSelected = selectedUrlSet.has(entry.url);
    return /*#__PURE__*/React.createElement("tr", {
      key: entry.url,
      className: "".concat(entry.isFolder ? "pod-picker-folder" : "pod-picker-file", " ").concat(isSelected ? "pod-picker-row-selected" : ""),
      onClick: () => {
        if (entry.isFolder) {
          loadContainer(entry.url);
        } else {
          handleSelect(entry.url);
        }
      }
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid ".concat(entry.isFolder ? "fa-folder" : "fa-file", " pod-picker-entry-icon")
    }), /*#__PURE__*/React.createElement("span", {
      title: entry.name,
      translate: "no"
    }, entry.name)));
  }), visibleEntries.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    className: "pod-picker-empty"
  }, "No matching files in this folder.")))))) : /*#__PURE__*/React.createElement("div", {
    className: "pod-picker-state pod-picker-state--error"
  }, "No Solid Pod is available."));
}

var DatasetAddModal = _ref => {
  var {
    onClose,
    fetchDatasets
  } = _ref;
  var {
    t
  } = useI18n();
  var [newDataset, setNewDataset] = useState({
    title: '',
    description: '',
    issued: '',
    modified: '',
    publisher: '',
    contact_point: '',
    access_url_dataset: '',
    access_url_semantic_model: '',
    file_format: '',
    distribution_access_type: 'download',
    theme: '',
    is_public: true
  });
  var [loading, setLoading] = useState(false);
  var [datasetSource, setDatasetSource] = useState("upload");
  var [modelSource, setModelSource] = useState("upload");
  var [datasetUpload, setDatasetUpload] = useState({
    files: [],
    urls: [],
    error: ""
  });
  var [modelUpload, setModelUpload] = useState({
    file: null,
    url: "",
    error: ""
  });
  var [selectedDatasetUrls, setSelectedDatasetUrls] = useState([]);
  var [externalDatasetLinks, setExternalDatasetLinks] = useState([""]);
  var showSemanticModel = true;

  // Use shared Solid session from solidSession.js
  var [solidUserName, setSolidUserName] = useState('');
  var [solidUserPhoto, setSolidUserPhoto] = useState('');
  var [webId, setWebId] = useState('');
  var [datasetUploadPath, setDatasetUploadPath] = useState("/");
  var [modelUploadPath, setModelUploadPath] = useState("/");
  var [existingDatasets, setExistingDatasets] = useState([]);
  var datasetUploadFiles = datasetUpload.files || [];
  var externalDatasetUrls = Array.from(new Set((externalDatasetLinks || []).map(url => url.trim()).filter(Boolean)));
  var selectedDatasetResourceUrls = datasetSource === "pod" ? selectedDatasetUrls : datasetSource === "upload" ? datasetUploadFiles.map((file, index) => "upload:".concat(index, ":").concat(file.name, ":").concat(file.size, ":").concat(file.lastModified)) : externalDatasetUrls;
  var isAutomaticSeries = selectedDatasetResourceUrls.length > 1;
  var hasRequiredFields = selectedDatasetResourceUrls.length > 0;
  var requiresPublicAccess = datasetSource === "external";
  useEffect(() => {
    if (!requiresPublicAccess || newDataset.is_public) return;
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      is_public: true
    }));
  }, [requiresPublicAccess, newDataset.is_public]);
  useEffect(() => {
    var fetchSolidProfile = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var profileDataset = yield getSolidDataset(session.info.webId, {
            fetch: session.fetch
          });
          var profile = getThing(profileDataset, session.info.webId);
          var name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || "Solid Pod User";
          var emailNodes = getUrlAll(profile, VCARD.hasEmail);
          var email = "";
          if (emailNodes.length > 0) {
            var emailThing = getThing(profileDataset, emailNodes[0]);
            var mailto = getUrl(emailThing, VCARD.value);
            if (mailto !== null && mailto !== void 0 && mailto.startsWith("mailto:")) {
              email = mailto.replace("mailto:", "");
            }
          }
          setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            publisher: name,
            contact_point: email
          }));
          setSolidUserName(name);
          setWebId(session.info.webId);
          setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            webid: session.info.webId
          }));
          var photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
          var photoUrl = "";
          if (photoRef) {
            try {
              var res = yield session.fetch(photoRef);
              if (res.ok) {
                var blob = yield res.blob();
                photoUrl = URL.createObjectURL(blob);
              } else {
                photoUrl = photoRef;
              }
            } catch (err) {
              photoUrl = photoRef;
            }
          }
          setSolidUserPhoto(photoUrl);
        } catch (err) {
          console.error("Failed to read pod profile:", err);
        }
      });
      return function fetchSolidProfile() {
        return _ref2.apply(this, arguments);
      };
    }();
    var loadExistingDatasets = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var {
            datasets
          } = yield loadAggregatedDatasets(session);
          var own = (datasets || []).filter(item => item.webid === session.info.webId && item.datasetType !== "series" && Boolean(item.datasetUrl));
          setExistingDatasets(own);
        } catch (err) {
          console.error("Failed to load existing datasets:", err);
        }
      });
      return function loadExistingDatasets() {
        return _ref3.apply(this, arguments);
      };
    }();
    fetchSolidProfile();
    loadExistingDatasets();
  }, [session]);
  var inferMediaType = value => {
    if (!value) return "";
    var lowered = value.toLowerCase();
    if (lowered.endsWith(".csv")) return "text/csv";
    if (lowered.endsWith(".json")) return "application/json";
    if (lowered.endsWith(".geojson")) return "application/geo+json";
    if (lowered.endsWith(".jsonld") || lowered.endsWith(".json-ld")) return "application/ld+json";
    if (lowered.endsWith(".ttl")) return "text/turtle";
    if (lowered.endsWith(".rdf") || lowered.endsWith(".xml")) return "application/rdf+xml";
    if (lowered.endsWith(".pdf")) return "application/pdf";
    if (lowered.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (lowered.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  };
  var uniqueUrls = urls => Array.from(new Set((urls || []).filter(Boolean)));
  var getFileNameFromUrl = url => {
    if (!url) return "Dataset";
    var cleanUrl = url.split(/[?#]/)[0];
    return decodeURIComponent(cleanUrl.split("/").filter(Boolean).pop() || "Dataset");
  };
  var getDatasetTitleFromUrl = url => {
    var fileName = getFileNameFromUrl(url);
    return fileName.replace(/\.[^.]+$/, "") || fileName || "Dataset";
  };
  var findExistingDatasetForResource = resourceUrl => existingDatasets.find(item => item.access_url_dataset === resourceUrl);
  var handleInputChange = e => {
    var {
      name,
      value
    } = e.target;
    var inferredMediaType = name === 'access_url_dataset' ? inferMediaType(value) : '';
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      [name]: value
    }, name === 'access_url_dataset' ? {
      file_format: inferredMediaType !== "application/octet-stream" ? inferredMediaType : ""
    } : {}));
  };
  var handleDatasetSourceChange = next => {
    setDatasetSource(next);
    setSelectedDatasetUrls([]);
    if (next !== "upload") {
      setDatasetUpload({
        files: [],
        urls: [],
        error: ""
      });
    }
    if (next !== "external") {
      setExternalDatasetLinks([""]);
    }
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: "",
      file_format: "",
      distribution_access_type: "download",
      is_public: next === "external" || modelSource === "external" ? true : prev.is_public
    }));
  };
  var handleModelSourceChange = next => {
    setModelSource(next);
    if (next !== "upload") {
      setModelUpload({
        file: null,
        url: "",
        error: ""
      });
    }
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: "",
      is_public: next === "external" || datasetSource === "external" ? true : prev.is_public
    }));
  };
  var getPodRoot = () => {
    if (!session.info.webId) return "";
    var base = session.info.webId.split("/profile/")[0];
    return base.endsWith("/") ? base : "".concat(base, "/");
  };
  var normalizeUploadPath = function normalizeUploadPath(value) {
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
    if (!value) return fallback;
    var path = value.trim();
    if (!path.startsWith("/")) path = "/".concat(path);
    if (!path.endsWith("/")) path = "".concat(path, "/");
    return path;
  };
  var ensureContainer = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (containerUrl) {
      try {
        yield createContainerAt(containerUrl, {
          fetch: session.fetch
        });
      } catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.statusCode) !== 409) {
          throw err;
        }
      }
    });
    return function ensureContainer(_x) {
      return _ref4.apply(this, arguments);
    };
  }();
  var ensureUploadContainer = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(function* (path) {
      var root = getPodRoot();
      if (!root) throw new Error("Missing pod root.");
      var normalized = normalizeUploadPath(path);
      var uploads = "".concat(root).concat(normalized.replace(/^\//, ""));
      var segments = normalized.split("/").filter(Boolean);
      var current = root;
      for (var segment of segments) {
        current = "".concat(current).concat(segment, "/");
        yield ensureContainer(current);
      }
      return uploads;
    });
    return function ensureUploadContainer(_x2) {
      return _ref5.apply(this, arguments);
    };
  }();
  var uploadFile = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (file, pathOverride) {
      if (!file) return "";
      var uploads = yield ensureUploadContainer(pathOverride);
      var safeName = encodeURIComponent(file.name || "upload-".concat(Date.now()));
      var targetUrl = "".concat(uploads).concat(safeName);
      var res = yield session.fetch(targetUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });
      if (!res.ok) {
        throw new Error("Upload failed (".concat(res.status, ")"));
      }
      return targetUrl;
    });
    return function uploadFile(_x3, _x4) {
      return _ref6.apply(this, arguments);
    };
  }();
  var handleDatasetFileSelect = event => {
    var _event$target;
    var files = Array.from((event === null || event === void 0 || (_event$target = event.target) === null || _event$target === void 0 ? void 0 : _event$target.files) || []);
    setDatasetUpload({
      files,
      urls: [],
      error: ""
    });
    setSelectedDatasetUrls([]);
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: "",
      file_format: files.length === 1 ? inferMediaType(files[0].name) : ""
    }));
  };
  var handleModelFileSelect = event => {
    var _event$target2;
    var file = event === null || event === void 0 || (_event$target2 = event.target) === null || _event$target2 === void 0 || (_event$target2 = _event$target2.files) === null || _event$target2 === void 0 ? void 0 : _event$target2[0];
    setModelUpload({
      file: file || null,
      url: "",
      error: ""
    });
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({
        file: null,
        url: "",
        error: "Only TTL files are allowed."
      });
      return;
    }
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: ""
    }));
  };
  var handleDatasetDrop = event => {
    var _event$dataTransfer;
    event.preventDefault();
    var files = Array.from(((_event$dataTransfer = event.dataTransfer) === null || _event$dataTransfer === void 0 ? void 0 : _event$dataTransfer.files) || []);
    if (files.length === 0) return;
    handleDatasetFileSelect({
      target: {
        files
      }
    });
  };
  var handleModelDrop = event => {
    var _event$dataTransfer2;
    event.preventDefault();
    var file = (_event$dataTransfer2 = event.dataTransfer) === null || _event$dataTransfer2 === void 0 || (_event$dataTransfer2 = _event$dataTransfer2.files) === null || _event$dataTransfer2 === void 0 ? void 0 : _event$dataTransfer2[0];
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({
        file: null,
        url: "",
        error: "Only TTL files are allowed."
      });
      return;
    }
    handleModelFileSelect({
      target: {
        files: [file]
      }
    });
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* () {
      try {
        setLoading(true);
        var pendingDataset = _objectSpread2$2({}, newDataset);
        var selectedUploadFiles = datasetUpload.files || [];
        var plannedDatasetResourceUrls = datasetSource === "pod" ? uniqueUrls(selectedDatasetUrls) : datasetSource === "upload" ? selectedUploadFiles.map((file, index) => "upload:".concat(index, ":").concat(file.name, ":").concat(file.size, ":").concat(file.lastModified)) : externalDatasetUrls;
        var plannedSaveAsSeries = plannedDatasetResourceUrls.length > 1;
        if (plannedDatasetResourceUrls.length === 0) {
          alert("Dataset link is required.");
          return;
        }
        if (plannedSaveAsSeries && !pendingDataset.title.trim()) {
          alert("Series title is required.");
          return;
        }
        if (datasetSource === "external" && !pendingDataset.is_public) {
          pendingDataset = _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
            is_public: true
          });
        }
        if (!pendingDataset.access_url_semantic_model && !(modelSource === "upload" && modelUpload.file)) {
          alert("A semantic model or schema is required for each dataset.");
          return;
        }
        if (plannedSaveAsSeries && datasetSource !== "upload") {
          var parents = new Set(plannedDatasetResourceUrls.map(url => new URL("./", url).href));
          if (parents.size !== 1) throw new Error("A series must describe files from one Solid container. Add unrelated files separately.");
          yield validateSeriesContainer(session, [...parents][0], plannedDatasetResourceUrls);
          for (var resourceUrl of plannedDatasetResourceUrls) {
            var existing = findExistingDatasetForResource(resourceUrl);
            if (existing !== null && existing !== void 0 && existing.datasetUrl) yield validateSeriesMembers(session, [existing.datasetUrl]);
          }
        }
        var uploadedDatasetUrls = [];
        if (datasetSource === "upload" && selectedUploadFiles.length > 0) {
          for (var file of selectedUploadFiles) {
            uploadedDatasetUrls.push(yield uploadFile(file, datasetUploadPath));
          }
          setDatasetUpload(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            urls: uploadedDatasetUrls,
            error: ""
          }));
          if (uploadedDatasetUrls.length === 1) {
            pendingDataset = _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
              access_url_dataset: uploadedDatasetUrls[0],
              file_format: inferMediaType(uploadedDatasetUrls[0])
            });
            setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
              access_url_dataset: uploadedDatasetUrls[0],
              file_format: inferMediaType(uploadedDatasetUrls[0])
            }));
          }
        }
        var datasetResourceUrls = datasetSource === "pod" ? uniqueUrls(selectedDatasetUrls) : datasetSource === "upload" ? uploadedDatasetUrls : externalDatasetUrls;
        var saveAsSeries = datasetResourceUrls.length > 1;
        var semanticModelUrl = pendingDataset.access_url_semantic_model;
        if (showSemanticModel && modelSource === "upload" && modelUpload.file && !semanticModelUrl) {
          var url = yield uploadFile(modelUpload.file, modelUploadPath);
          semanticModelUrl = url;
          setModelUpload(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            url,
            error: ""
          }));
          setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            access_url_semantic_model: url
          }));
        }
        yield ensureCatalogStructure(session, {
          title: solidUserName ? "".concat(solidUserName, "'s Catalog") : undefined
        });
        if (saveAsSeries) {
          var memberDatasetUrls = [];
          for (var _resourceUrl of datasetResourceUrls) {
            var existingDataset = findExistingDatasetForResource(_resourceUrl);
            if (existingDataset !== null && existingDataset !== void 0 && existingDataset.datasetUrl) {
              memberDatasetUrls.push(existingDataset.datasetUrl);
              continue;
            }
            var created = yield createDataset(session, _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
              title: getDatasetTitleFromUrl(_resourceUrl),
              access_url_dataset: _resourceUrl,
              access_url_semantic_model: semanticModelUrl,
              file_format: pendingDataset.file_format || inferMediaType(_resourceUrl),
              distribution_access_type: "download",
              is_public: datasetSource === "external" ? true : pendingDataset.is_public,
              webid: webId
            }));
            memberDatasetUrls.push(created.datasetUrl);
          }
          yield createDatasetSeries(session, {
            title: pendingDataset.title,
            description: pendingDataset.description,
            theme: pendingDataset.theme,
            issued: pendingDataset.issued,
            publisher: pendingDataset.publisher,
            contact_point: pendingDataset.contact_point,
            webid: webId,
            container_url: new URL("./", datasetResourceUrls[0]).href,
            seriesMembers: uniqueUrls(memberDatasetUrls)
          });
        } else {
          var _resourceUrl2 = datasetResourceUrls[0];
          yield createDataset(session, _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
            access_url_dataset: _resourceUrl2,
            access_url_semantic_model: semanticModelUrl,
            file_format: pendingDataset.file_format || inferMediaType(_resourceUrl2),
            webid: webId
          }));
        }
        yield fetchDatasets();
        onClose();
      } catch (err) {
        console.error("Error saving dataset/series:", err);
        alert("Failed to save: ".concat((err === null || err === void 0 ? void 0 : err.message) || err));
      } finally {
        setLoading(false);
      }
    });
    return function handleSave() {
      return _ref7.apply(this, arguments);
    };
  }();
  var renderInputWithIcon = function renderInputWithIcon(label, name) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'text';
    var icon = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'fa-circle';
    var disabled = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    return /*#__PURE__*/React.createElement("div", {
      className: "form-group position-relative mb-3"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid ".concat(icon, " input-icon ").concat(type === 'textarea' ? 'input-icon-textarea' : type === 'date' ? 'input-icon-date' : 'input-icon-text')
    }), type === 'textarea' ? /*#__PURE__*/React.createElement("textarea", {
      className: "form-control",
      name: name,
      value: newDataset[name] || '',
      onChange: handleInputChange,
      placeholder: label,
      rows: 2,
      disabled: disabled,
      style: {
        paddingLeft: '30px'
      }
    }) : /*#__PURE__*/React.createElement("input", {
      className: "form-control",
      type: type,
      name: name,
      value: newDataset[name] || '',
      onChange: handleInputChange,
      placeholder: label,
      disabled: disabled,
      style: {
        paddingLeft: '30px'
      }
    }));
  };
  var renderSourceToggle = (value, onChange) => /*#__PURE__*/React.createElement("div", {
    className: "source-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "upload" ? "active" : ""),
    onClick: () => onChange("upload")
  }, "Upload file"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "pod" ? "active" : ""),
    onClick: () => onChange("pod")
  }, "Select from pod"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "external" ? "active" : ""),
    onClick: () => onChange("external")
  }, "External link"));
  var handleRemoveDatasetUploadFile = indexToRemove => {
    var nextFiles = datasetUploadFiles.filter((_, index) => index !== indexToRemove);
    setDatasetUpload({
      files: nextFiles,
      urls: [],
      error: ""
    });
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: "",
      file_format: nextFiles.length === 1 ? inferMediaType(nextFiles[0].name) : ""
    }));
  };
  var syncExternalDatasetState = links => {
    var urls = Array.from(new Set((links || []).map(url => url.trim()).filter(Boolean)));
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: urls[0] || "",
      file_format: urls.length === 1 ? inferMediaType(urls[0]) : ""
    }));
  };
  var handleExternalDatasetLinkChange = (indexToUpdate, value) => {
    var nextLinks = externalDatasetLinks.map((link, index) => index === indexToUpdate ? value : link);
    setExternalDatasetLinks(nextLinks);
    syncExternalDatasetState(nextLinks);
  };
  var handleAddExternalDatasetLink = () => {
    setExternalDatasetLinks(prev => [...prev, ""]);
  };
  var handleRemoveExternalDatasetLink = indexToRemove => {
    var nextLinks = externalDatasetLinks.filter((_, index) => index !== indexToRemove);
    var safeLinks = nextLinks.length > 0 ? nextLinks : [""];
    setExternalDatasetLinks(safeLinks);
    syncExternalDatasetState(safeLinks);
  };
  var renderUploadBox = _ref8 => {
    var {
      label,
      accept,
      onFileChange,
      onDrop,
      state,
      inputId,
      hint,
      multiple = false,
      onRemoveFile
    } = _ref8;
    var selectedFiles = state.files || (state.file ? [state.file] : []);
    var uploadedUrls = state.urls || (state.url ? [state.url] : []);
    return /*#__PURE__*/React.createElement("div", {
      className: "upload-box"
    }, /*#__PURE__*/React.createElement("div", {
      className: "upload-drop",
      onDragOver: e => e.preventDefault(),
      onDrop: onDrop
    }, /*#__PURE__*/React.createElement("div", {
      className: "upload-icon"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-cloud-arrow-up"
    })), /*#__PURE__*/React.createElement("div", {
      className: "upload-text"
    }, /*#__PURE__*/React.createElement("strong", null, "Drag & drop"), " your file", multiple ? "s" : "", " here"), /*#__PURE__*/React.createElement("div", {
      className: "upload-subtext"
    }, "or"), /*#__PURE__*/React.createElement("label", {
      htmlFor: inputId,
      className: "upload-button"
    }, "Browse files"), /*#__PURE__*/React.createElement("input", {
      id: inputId,
      type: "file",
      accept: accept,
      multiple: multiple,
      onChange: onFileChange,
      className: "upload-input"
    })), selectedFiles.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "upload-selected-files"
    }, /*#__PURE__*/React.createElement("span", null, selectedFiles.length, " file", selectedFiles.length === 1 ? "" : "s", " selected"), selectedFiles.map((file, index) => /*#__PURE__*/React.createElement("div", {
      key: "".concat(file.name, "-").concat(file.size, "-").concat(file.lastModified, "-").concat(index),
      className: "upload-selected-file"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", {
      translate: "no"
    }, file.name), /*#__PURE__*/React.createElement("small", null, Math.ceil((file.size || 0) / 1024), " KB")), onRemoveFile && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onRemoveFile(index),
      "aria-label": "Remove ".concat(file.name),
      title: "Remove"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-xmark"
    }))))), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint), uploadedUrls.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint success"
    }, "Uploaded ", uploadedUrls.length, " file", uploadedUrls.length === 1 ? "" : "s", "."), state.error && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint error"
    }, state.error));
  };
  var renderExternalUrlInput = _ref9 => {
    var {
      label,
      name,
      value,
      placeholder,
      hint
    } = _ref9;
    return /*#__PURE__*/React.createElement("div", {
      className: "mb-3"
    }, /*#__PURE__*/React.createElement("label", {
      className: "font-weight-bold mb-2"
    }, label), /*#__PURE__*/React.createElement("input", {
      className: "form-control",
      type: "url",
      name: name,
      value: value,
      onChange: handleInputChange,
      placeholder: placeholder
    }), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint));
  };
  var renderExternalDatasetLinks = () => /*#__PURE__*/React.createElement("div", {
    className: "external-link-list"
  }, /*#__PURE__*/React.createElement("div", {
    className: "external-link-list-header"
  }, /*#__PURE__*/React.createElement("label", null, "Direct dataset download URL")), externalDatasetLinks.map((link, index) => /*#__PURE__*/React.createElement("div", {
    className: "external-link-row",
    key: "external-link-".concat(index)
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-control",
    type: "url",
    value: link,
    onChange: event => handleExternalDatasetLinkChange(index, event.target.value),
    placeholder: "https://..."
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "external-link-remove",
    onClick: () => handleRemoveExternalDatasetLink(index),
    disabled: externalDatasetLinks.length === 1 && !link.trim(),
    "aria-label": "Remove external link",
    title: "Remove"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  })))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "external-link-add",
    onClick: handleAddExternalDatasetLink
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus"
  }), "Add External Link"));
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-form-dialog",
    label: t("Add Dataset"),
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "dataset-add-modal catalog-form-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-2"
  }), " Add Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", null, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-info-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-info-left"
  }, solidUserPhoto ? /*#__PURE__*/React.createElement("img", {
    src: solidUserPhoto,
    alt: "Pod owner",
    className: "pod-avatar"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "pod-avatar pod-avatar--placeholder"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-user"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pod-name"
  }, solidUserName || "Solid Pod User"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta"
  }, newDataset.contact_point || "No email provided"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta pod-webid"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-link"
  }), /*#__PURE__*/React.createElement("span", null, webId || "No WebID"))))), /*#__PURE__*/React.createElement("div", {
    className: "form-section mb-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, isAutomaticSeries ? "Dataset Series" : "General Information"), isAutomaticSeries ? /*#__PURE__*/React.createElement(React.Fragment, null, renderInputWithIcon("Series Title", "title", "text", "fa-layer-group"), renderInputWithIcon("Series Description", "description", "textarea", "fa-align-left"), renderInputWithIcon("Series Theme (IRI)", "theme", "text", "fa-tags"), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")) : /*#__PURE__*/React.createElement(React.Fragment, null, renderInputWithIcon("Title", "title", "text", "fa-heading"), renderInputWithIcon("Description", "description", "textarea", "fa-align-left"), renderInputWithIcon("Theme", "theme", "text", "fa-tags"), !requiresPublicAccess && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Access Rights"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    name: "is_public",
    value: newDataset.is_public ? 'public' : 'restricted',
    onChange: e => setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      is_public: e.target.value === 'public'
    })),
    style: {
      paddingLeft: '30px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "public"
  }, "Public"), /*#__PURE__*/React.createElement("option", {
    value: "restricted"
  }, "Restricted")))), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus"))), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Dataset Resource"), renderInputWithIcon("Media type (e.g. application/json)", "file_format", "text", "fa-file-code"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
    onSelectPath: path => setDatasetUploadPath(normalizeUploadPath(path, "/")),
    webId: webId
  }), datasetSource === "upload" ? renderUploadBox({
    label: "Upload dataset files",
    accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
    onFileChange: handleDatasetFileSelect,
    onDrop: handleDatasetDrop,
    state: datasetUpload,
    inputId: "dataset-upload-input",
    multiple: true,
    onRemoveFile: handleRemoveDatasetUploadFile
  }) : datasetSource === "pod" ? /*#__PURE__*/React.createElement(PodResourcePicker, {
    multiple: true,
    resourceType: "dataset",
    selectedUrls: selectedDatasetUrls,
    webId: webId,
    onSelect: fileUrls => {
      var nextUrls = uniqueUrls(fileUrls);
      setSelectedDatasetUrls(nextUrls);
      setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
        access_url_dataset: nextUrls[0] || "",
        file_format: nextUrls.length === 1 ? inferMediaType(nextUrls[0]) : ""
      }));
    }
  }) : renderExternalDatasetLinks()), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic model or schema"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Required for each distribution")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2 semantic-model-actions"
  }, /*#__PURE__*/React.createElement("a", {
    href: "http://plasma.uni-wuppertal.de/modelings",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn btn-outline-primary btn-sm"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Create Semantic Model"))), /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
    onSelectPath: path => setModelUploadPath(normalizeUploadPath(path, "/")),
    webId: webId
  }), modelSource === "upload" ? renderUploadBox({
    label: "Upload semantic model",
    accept: ".ttl",
    onFileChange: handleModelFileSelect,
    onDrop: handleModelDrop,
    state: modelUpload,
    hint: "Allowed: TTL",
    inputId: "model-upload-input"
  }) : modelSource === "pod" ? /*#__PURE__*/React.createElement(PodResourcePicker, {
    label: "Select Semantic Model",
    resourceType: "semanticModel",
    selectedUrl: newDataset.access_url_semantic_model,
    webId: webId,
    onSelect: fileUrl => setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: fileUrl
    }))
  }) : renderExternalUrlInput({
    label: "Public model or schema IRI",
    name: "access_url_semantic_model",
    value: newDataset.access_url_semantic_model,
    placeholder: "https://example.org/model.ttl"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: handleSave,
    disabled: loading || !hasRequiredFields || isAutomaticSeries && !newDataset.title.trim(),
    title: !hasRequiredFields ? "Dataset link is required" : isAutomaticSeries && !newDataset.title.trim() ? "Series title is required" : ""
  }, loading ? /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-spinner fa-spin mr-2"
  }) : /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-floppy-disk mr-2"
  }), loading ? "Saving..." : isAutomaticSeries ? "Save Series" : "Save Dataset"))))));
};

function ApiServiceModal(_ref) {
  var {
    initial = {},
    datasets = [],
    onClose,
    onSaved
  } = _ref;
  var {
    t
  } = useI18n();
  var [form, setForm] = useState(_objectSpread2$2({
    title: '',
    description: '',
    publisher: '',
    endpointURL: '',
    endpointDescription: '',
    authentication: 'public',
    servesDataset: []
  }, initial));
  var [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  var change = (name, value) => setForm(f => _objectSpread2$2(_objectSpread2$2({}, f), {}, {
    [name]: value
  }));
  var submit = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (e) {
      e.preventDefault();
      setError('');
      setBusy(true);
      try {
        var input = normalizeServiceInput(form);
        yield saveDataService(session, input);
        yield onSaved === null || onSaved === void 0 ? void 0 : onSaved();
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    });
    return function submit(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var field = function field(name, label) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'text';
    var required = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    return /*#__PURE__*/React.createElement("label", null, t(label), type === 'textarea' ? /*#__PURE__*/React.createElement("textarea", {
      value: form[name],
      required: required,
      maxLength: 5000,
      rows: 3,
      onChange: e => change(name, e.target.value)
    }) : /*#__PURE__*/React.createElement("input", {
      type: type,
      value: form[name],
      required: required,
      maxLength: type === 'url' ? 2048 : 200,
      onChange: e => change(name, e.target.value)
    }));
  };
  return /*#__PURE__*/React.createElement(CatalogModal, {
    label: t(initial.datasetUrl ? 'Edit API' : 'Add API'),
    onClose: busy ? () => {} : onClose,
    className: "api-service-dialog"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "api-service-form",
    translate: "no"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-heading"
  }, /*#__PURE__*/React.createElement("h2", null, t(initial.datasetUrl ? 'Edit API' : 'Add API')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-icon-button",
    "aria-label": t('Close'),
    disabled: busy,
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("p", null, t('Describe an existing API. The catalog does not import its data or change its access rights.')), field('title', 'Title', 'text', true), field('description', 'Description', 'textarea', true), field('publisher', 'Publisher', 'text', true), field('endpointURL', 'API endpoint', 'url', true), field('endpointDescription', 'API documentation URL', 'url'), /*#__PURE__*/React.createElement("label", null, t('Authentication'), /*#__PURE__*/React.createElement("select", {
    value: form.authentication,
    onChange: e => change('authentication', e.target.value)
  }, AUTH_MODES.map(value => /*#__PURE__*/React.createElement("option", {
    key: value,
    value: value
  }, t({
    public: 'Public',
    'api-key': 'API key required',
    oauth2: 'OAuth 2.0',
    'solid-oidc': 'Solid login required'
  }[value]))))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, t('Linked datasets')), /*#__PURE__*/React.createElement("div", {
    className: "api-service-datasets"
  }, datasets.filter(d => d.datasetType !== 'service').map(d => /*#__PURE__*/React.createElement("label", {
    className: "api-service-check",
    key: d.datasetUrl
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.servesDataset.includes(d.datasetUrl),
    onChange: e => change('servesDataset', e.target.checked ? [...form.servesDataset, d.datasetUrl] : form.servesDataset.filter(u => u !== d.datasetUrl))
  }), /*#__PURE__*/React.createElement("span", null, d.title))), !datasets.some(d => d.datasetType !== 'service') && /*#__PURE__*/React.createElement("p", null, t('No datasets available to link.')))), /*#__PURE__*/React.createElement("p", {
    className: "api-service-note"
  }, t('API descriptions are public catalog metadata. Do not enter tokens, passwords or secret URLs.')), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "api-service-error"
  }, t(error)), /*#__PURE__*/React.createElement("div", {
    className: "api-service-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-button",
    disabled: busy,
    onClick: onClose
  }, t('Cancel')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-button catalog-button--primary",
    disabled: busy
  }, t(busy ? 'Saving...' : 'Save API')))));
}

function CatalogEntryAddModal(_ref) {
  var {
    onClose,
    fetchDatasets,
    datasets
  } = _ref;
  var {
    t
  } = useI18n();
  var [kind, setKind] = useState('');
  if (kind === 'dataset') return /*#__PURE__*/React.createElement(DatasetAddModal, {
    onClose: onClose,
    fetchDatasets: fetchDatasets
  });
  if (kind === 'service') return /*#__PURE__*/React.createElement(ApiServiceModal, {
    onClose: onClose,
    onSaved: fetchDatasets,
    datasets: datasets
  });
  return /*#__PURE__*/React.createElement(CatalogModal, {
    label: t('Add catalog entry'),
    onClose: onClose,
    className: "api-service-dialog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-form",
    translate: "no"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-heading"
  }, /*#__PURE__*/React.createElement("h2", null, t('Add catalog entry')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-icon-button",
    onClick: onClose,
    "aria-label": t('Close')
  }, "\xD7")), /*#__PURE__*/React.createElement("button", {
    className: "api-service-choice",
    onClick: () => setKind('dataset')
  }, /*#__PURE__*/React.createElement("strong", null, t('Dataset')), /*#__PURE__*/React.createElement("span", null, t('Describe files from a Pod, upload files or add external data links.'))), /*#__PURE__*/React.createElement("button", {
    className: "api-service-choice",
    onClick: () => setKind('service')
  }, /*#__PURE__*/React.createElement("strong", null, "API"), /*#__PURE__*/React.createElement("span", null, t('Describe an API endpoint, its documentation and linked datasets.')))));
}

function ApiServiceDetail(_ref) {
  var {
    service,
    datasets,
    onClose,
    onEdit,
    onChanged
  } = _ref;
  var {
    t
  } = useI18n();
  var [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false);
  var endpoint = safeServiceUrl(service.endpointURL),
    docs = safeServiceUrl(service.endpointDescription, {
      fragment: true
    });
  var owned = Boolean(session.info.webId && service.webid === session.info.webId);
  var remove = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* () {
      setBusy(true);
      setError('');
      try {
        yield removeDataService(session, service);
        yield onChanged === null || onChanged === void 0 ? void 0 : onChanged();
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    });
    return function remove() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "api-service-form",
    translate: "no"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "catalog-tag"
  }, "API"), /*#__PURE__*/React.createElement("h2", null, service.title)), /*#__PURE__*/React.createElement("button", {
    className: "catalog-icon-button",
    onClick: onClose,
    "aria-label": t('Close')
  }, "\xD7")), /*#__PURE__*/React.createElement("p", null, service.description), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, t('Publisher')), /*#__PURE__*/React.createElement("dd", null, service.publisher), /*#__PURE__*/React.createElement("dt", null, t('Authentication')), /*#__PURE__*/React.createElement("dd", null, t({
    public: 'Public',
    'api-key': 'API key required',
    oauth2: 'OAuth 2.0',
    'solid-oidc': 'Solid login required'
  }[service.authentication] || 'See API documentation')), /*#__PURE__*/React.createElement("dt", null, t('API endpoint')), /*#__PURE__*/React.createElement("dd", null, /*#__PURE__*/React.createElement("code", null, endpoint || t('Invalid API endpoint')))), /*#__PURE__*/React.createElement("div", {
    className: "api-service-actions"
  }, endpoint && /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    onClick: /*#__PURE__*/_asyncToGenerator(function* () {
      try {
        yield navigator.clipboard.writeText(endpoint);
        setCopied(true);
      } catch (_unused) {
        setError('Copy the address shown above.');
      }
    })
  }, t(copied ? 'Copied' : 'Copy API URL')), docs && /*#__PURE__*/React.createElement("a", {
    className: "catalog-button catalog-button--primary",
    href: docs,
    target: "_blank",
    rel: "noopener noreferrer"
  }, t('Open API documentation'))), /*#__PURE__*/React.createElement("h3", null, t('Linked datasets')), /*#__PURE__*/React.createElement("ul", null, (service.servesDataset || []).map(url => {
    var _datasets$find;
    return /*#__PURE__*/React.createElement("li", {
      key: url
    }, ((_datasets$find = datasets.find(d => d.datasetUrl === url)) === null || _datasets$find === void 0 ? void 0 : _datasets$find.title) || url);
  })), endpoint && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h3", null, t('Example request')), /*#__PURE__*/React.createElement("pre", null, "curl --get '".concat(endpoint.replace(/'/g, "'\\''"), "' \\\n  --header 'Accept: application/json'")), /*#__PURE__*/React.createElement("p", null, t('Parameters and required credentials are described in the API documentation.'))), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "api-service-error"
  }, t(error)), owned && /*#__PURE__*/React.createElement("div", {
    className: "api-service-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    onClick: onEdit
  }, t('Edit API')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    onClick: () => setConfirm(true)
  }, t('Remove API from catalog'))), confirm && /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": t('Remove API from catalog')
  }, /*#__PURE__*/React.createElement("p", null, t('Only the catalog links are removed. The API, metadata document and data remain unchanged.')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    disabled: busy,
    onClick: () => setConfirm(false)
  }, t('Cancel')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    disabled: busy,
    onClick: remove
  }, t('Confirm removal'))));
}

var normalizeRegistryUrl = value => {
  try {
    var url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    return "".concat(url.href.replace(/\/+$/, ''), "/");
  } catch (_unused) {
    return '';
  }
};

// These documents are supplied per host by the deployment's profile configuration.
// Personal memberships determine publication, never which registry this page browses.
function resolveCatalogRegistry() {
  var _appConfig$catalog$de, _appConfig$catalog;
  var appConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.__APP_CONFIG__;
  var env = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window._env_;
  var url = normalizeRegistryUrl((_appConfig$catalog$de = appConfig === null || appConfig === void 0 || (_appConfig$catalog = appConfig.catalog) === null || _appConfig$catalog === void 0 ? void 0 : _appConfig$catalog.defaultRegistry) !== null && _appConfig$catalog$de !== void 0 ? _appConfig$catalog$de : env === null || env === void 0 ? void 0 : env.CATALOG_DEFAULT_REGISTRY);
  if (!url) return {
    url: '',
    label: ''
  };
  var presets = (appConfig === null || appConfig === void 0 ? void 0 : appConfig.registries) || (env === null || env === void 0 ? void 0 : env.CATALOG_REGISTRIES) || [];
  var preset = presets.find(entry => normalizeRegistryUrl(entry.url) === url);
  return {
    url,
    label: (preset === null || preset === void 0 ? void 0 : preset.id) || new URL(url).pathname.split('/').filter(Boolean).pop() || new URL(url).hostname
  };
}

var publicDataBase = () => '/sync-worker/public-data/v1';
function publicDataUrl(path) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var url = new URL(publicDataBase() + path, window.location.origin);
  url.searchParams.set('registry', resolveCatalogRegistry().url);
  Object.entries(params).forEach(_ref => {
    var [key, value] = _ref;
    if (value !== '' && value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  return url.href;
}
function readPublicData(_x) {
  return _readPublicData.apply(this, arguments);
}
function _readPublicData() {
  _readPublicData = _asyncToGenerator(function* (url) {
    var _response$body;
    var {
      signal
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var target = new URL(url, window.location.origin);
    if (target.origin !== window.location.origin || !target.pathname.startsWith(publicDataBase() + '/')) throw new Error('Use the local public data API.');
    var response = yield fetch(target.href, {
      signal,
      credentials: 'omit',
      redirect: 'error',
      headers: {
        Accept: 'application/json'
      }
    });
    var declared = Number(response.headers.get('content-length'));
    if (declared > 4 * 1024 * 1024) throw new Error('Response is too large.');
    var reader = (_response$body = response.body) === null || _response$body === void 0 ? void 0 : _response$body.getReader();
    var text = '';
    if (reader) {
      var bytes = 0;
      var decoder = new TextDecoder();
      while (true) {
        var {
          done,
          value
        } = yield reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 4 * 1024 * 1024) {
          yield reader.cancel();
          throw new Error('Response is too large.');
        }
        text += decoder.decode(value, {
          stream: true
        });
      }
      text += decoder.decode();
    } else text = yield response.text();
    var result;
    try {
      result = JSON.parse(text);
    } catch (_unused) {
      throw new Error('The public data API is currently unavailable.');
    }
    if (!response.ok) throw new Error(result.error || 'The public data API is currently unavailable.');
    return result;
  });
  return _readPublicData.apply(this, arguments);
}

function PublicDataExplorer(_ref) {
  var {
    onClose,
    onPublish
  } = _ref;
  var {
    t
  } = useI18n();
  var [sources, setSources] = useState([]),
    [sourceId, setSourceId] = useState(''),
    [query, setQuery] = useState({
      from: '',
      to: '',
      timeField: '',
      recordsPath: '',
      fields: '',
      limit: '100'
    }),
    [latest, setLatest] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    [lastQuery, setLastQuery] = useState(null),
    [partial, setPartial] = useState(false);
  var active = useRef(null);
  var source = sources.find(s => s.id === sourceId);
  useEffect(() => {
    var c = new AbortController();
    active.current = c;
    readPublicData(publicDataUrl('/datasets'), {
      signal: c.signal
    }).then(d => {
      var _d$datasets$;
      setSources(d.datasets);
      setPartial(Boolean(d.partial));
      setSourceId(((_d$datasets$ = d.datasets[0]) === null || _d$datasets$ === void 0 ? void 0 : _d$datasets$.id) || '');
    }).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    }).finally(() => {
      if (!c.signal.aborted) setBusy(false);
    });
    return () => {
      var _active$current;
      return (_active$current = active.current) === null || _active$current === void 0 ? void 0 : _active$current.abort();
    };
  }, []);
  var run = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* () {
      var _active$current2;
      var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      (_active$current2 = active.current) === null || _active$current2 === void 0 || _active$current2.abort();
      var c = new AbortController();
      active.current = c;
      setBusy(true);
      setError('');
      var params = offset ? _objectSpread2$2(_objectSpread2$2({}, lastQuery.params), {}, {
        offset,
        revision: result.revision
      }) : _objectSpread2$2({}, query);
      var path = offset ? lastQuery.path : "/datasets/".concat(sourceId, "/").concat(latest ? 'latest' : 'data');
      try {
        var data = yield readPublicData(publicDataUrl(path, params), {
          signal: c.signal
        });
        setResult(data);
        setLastQuery({
          path,
          params
        });
      } catch (e) {
        if (!c.signal.aborted) {
          setError(e.message);
          setResult(null);
        }
      } finally {
        if (!c.signal.aborted) setBusy(false);
      }
    });
    return function run() {
      return _ref2.apply(this, arguments);
    };
  }();
  var update = (key, value) => {
    setQuery(q => _objectSpread2$2(_objectSpread2$2({}, q), {}, {
      [key]: value
    }));
    setResult(null);
  };
  return /*#__PURE__*/React.createElement(CatalogModal, {
    label: t('Query public data'),
    onClose: onClose,
    className: "api-service-dialog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-form",
    translate: "no"
  }, /*#__PURE__*/React.createElement("div", {
    className: "api-service-heading"
  }, /*#__PURE__*/React.createElement("h2", null, t('Query public data')), /*#__PURE__*/React.createElement("button", {
    className: "catalog-icon-button",
    "aria-label": t('Close'),
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("p", null, t('Query existing public Pod files. Original records and histories remain unchanged.')), /*#__PURE__*/React.createElement("label", null, t('Dataset'), /*#__PURE__*/React.createElement("select", {
    value: sourceId,
    disabled: busy,
    onChange: e => {
      setSourceId(e.target.value);
      setQuery({
        from: '',
        to: '',
        timeField: '',
        recordsPath: '',
        fields: '',
        limit: '100'
      });
      setResult(null);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, t('Select dataset')), sources.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.id
  }, s.title, " / ", s.podName)))), partial && /*#__PURE__*/React.createElement("p", {
    className: "api-service-note"
  }, t('Some catalog records are currently unavailable. Only discovered public sources are listed.')), /*#__PURE__*/React.createElement("div", {
    className: "api-service-grid"
  }, [['from', 'From (inclusive, ISO timestamp)'], ['to', 'To (exclusive, ISO timestamp)']].map(_ref3 => {
    var [key, label] = _ref3;
    return /*#__PURE__*/React.createElement("label", {
      key: key
    }, t(label), /*#__PURE__*/React.createElement("input", {
      disabled: busy,
      value: query[key],
      placeholder: "2026-10-22T00:00:00Z",
      onChange: e => update(key, e.target.value)
    }));
  }), /*#__PURE__*/React.createElement("label", null, t('Records per page'), /*#__PURE__*/React.createElement("input", {
    disabled: busy,
    type: "number",
    min: "1",
    max: "1000",
    value: query.limit,
    onChange: e => update('limit', e.target.value)
  }))), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, t('Field selection (optional)')), /*#__PURE__*/React.createElement("div", {
    className: "api-service-grid"
  }, [['timeField', 'Time field or JSON Pointer'], ['recordsPath', 'Record array JSON Pointer'], ['fields', 'Output fields (comma-separated)']].map(_ref4 => {
    var [key, label] = _ref4;
    return /*#__PURE__*/React.createElement("label", {
      key: key
    }, t(label), /*#__PURE__*/React.createElement("input", {
      disabled: busy,
      value: query[key],
      onChange: e => update(key, e.target.value)
    }));
  })), /*#__PURE__*/React.createElement("p", null, t('Time fields are detected only when every record has a valid timestamp. You can specify the field explicitly.'))), /*#__PURE__*/React.createElement("label", {
    className: "api-service-check"
  }, /*#__PURE__*/React.createElement("input", {
    disabled: busy,
    type: "checkbox",
    checked: latest,
    onChange: e => {
      setLatest(e.target.checked);
      setResult(null);
    }
  }), t('Latest timestamp only')), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "api-service-error"
  }, t(error)), /*#__PURE__*/React.createElement("div", {
    className: "api-service-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "catalog-button catalog-button--primary",
    disabled: busy || !source,
    onClick: () => run()
  }, t(busy ? 'Loading...' : 'Run query')), /*#__PURE__*/React.createElement("a", {
    className: "catalog-button",
    href: publicDataBase() + '/openapi.json',
    target: "_blank",
    rel: "noopener noreferrer"
  }, t('API documentation')), source && onPublish && /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    disabled: busy,
    onClick: () => onPublish({
      title: source.title + ' API',
      description: source.description || t('Read-only API for public Pod data.'),
      publisher: source.podName,
      endpointURL: publicDataUrl("/datasets/".concat(source.id, "/data")),
      endpointDescription: new URL(publicDataBase() + '/openapi.json', window.location.origin).href,
      authentication: 'public',
      servesDataset: [source.datasetUrl]
    })
  }, t('Add this API to catalog'))), result && /*#__PURE__*/React.createElement("section", {
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("h3", null, t('Query result')), /*#__PURE__*/React.createElement("p", null, result.count, " / ", result.total, " ", t('records')), /*#__PURE__*/React.createElement("p", null, t('Source'), ": ", /*#__PURE__*/React.createElement("code", null, result.sourceUrl)), /*#__PURE__*/React.createElement("pre", {
    tabIndex: "0"
  }, JSON.stringify(result.records, null, 2).slice(0, 50000), JSON.stringify(result.records).length > 50000 ? '\n' + t('Preview shortened. Use the API for the full page.') : ''), /*#__PURE__*/React.createElement("div", {
    className: "api-service-actions"
  }, ['json', 'csv', 'ndjson'].map(format => /*#__PURE__*/React.createElement("a", {
    className: "catalog-button",
    key: format,
    href: publicDataUrl(lastQuery.path, _objectSpread2$2(_objectSpread2$2({}, lastQuery.params), {}, {
      revision: result.revision,
      format
    })),
    target: "_blank",
    rel: "noopener noreferrer"
  }, format.toUpperCase())), result.nextOffset !== null && /*#__PURE__*/React.createElement("button", {
    className: "catalog-button",
    disabled: busy,
    onClick: () => run(result.nextOffset)
  }, t('Next page'))))));
}

var NS = 'https://w3id.org/solid-dataspace-manager#';
var TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
var CREATED = 'http://purl.org/dc/terms/created';
var INBOX = 'http://www.w3.org/ns/ldp#inbox';
var terminal = new Set(['approved', 'denied', 'revoked', 'expired', 'archived']);
var text = (thing, key) => getStringNoLocale(thing, NS + key) || '';
var iri = (thing, key) => getUrl(thing, NS + key) || '';
var time = value => Date.parse(value) || 0;
var stamp = (thing, predicate) => {
  var _getDatetime;
  return ((_getDatetime = getDatetime(thing, predicate)) === null || _getDatetime === void 0 ? void 0 : _getDatetime.toISOString()) || getStringNoLocale(thing, predicate) || '';
};
var httpUrl = value => {
  var url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid Pod URL.');
  return url.href;
};
var freshFetch = fetch => function (url) {
  var init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return fetch(url, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
    cache: 'no-store'
  }));
};
function legacyRequestKey(dataset, webId) {
  var key = (dataset === null || dataset === void 0 ? void 0 : dataset.identifier) || (dataset === null || dataset === void 0 ? void 0 : dataset.datasetUrl) || (dataset === null || dataset === void 0 ? void 0 : dataset.access_url_dataset) || (dataset === null || dataset === void 0 ? void 0 : dataset.title);
  return key && webId ? "sdm.request.pending.".concat(webId, ".").concat(key) : '';
}
function inboxFor(_x, _x2) {
  return _inboxFor.apply(this, arguments);
}
function _inboxFor() {
  _inboxFor = _asyncToGenerator(function* (webId, fetch) {
    var document = yield getSolidDataset(httpUrl(webId).split('#')[0], {
      fetch
    });
    var inbox = getUrl(getThing(document, webId), INBOX);
    if (!inbox) throw new Error('No Solid inbox found for this profile.');
    return httpUrl(inbox);
  });
  return _inboxFor.apply(this, arguments);
}
function receiptContainerFor(_x3, _x4) {
  return _receiptContainerFor.apply(this, arguments);
}
function _receiptContainerFor() {
  _receiptContainerFor = _asyncToGenerator(function* (webId, fetch) {
    var doc = yield getSolidDataset(webId.split('#')[0], {
      fetch
    });
    var profile = getThing(doc, webId);
    var root = getUrl(profile, 'http://www.w3.org/ns/pim/space#storage');
    if (!root) {
      var url = new URL(webId),
        index = url.pathname.indexOf('/profile/');
      if (index < 0) throw new Error('Pod storage URL is missing from the profile.');
      root = url.origin + url.pathname.slice(0, index + 1);
    }
    return new URL('catalog-requests/', httpUrl(root).replace(/\/?$/, '/')).href;
  });
  return _receiptContainerFor.apply(this, arguments);
}
function ensureReceiptContainer(_x5, _x6, _x7) {
  return _ensureReceiptContainer.apply(this, arguments);
}
function _ensureReceiptContainer() {
  _ensureReceiptContainer = _asyncToGenerator(function* (url, webId, _fetch) {
    var resource,
      created = false;
    try {
      resource = yield getResourceInfoWithAcl(url, {
        fetch: _fetch
      });
    } catch (error) {
      var _error$response;
      if ((error.statusCode || ((_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.status)) !== 404) throw error;
      // The conditional create must not replace a concurrently created container.
      yield createContainerAt(url, {
        fetch: function fetch(target) {
          var init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var headers = new Headers(init.headers);
          headers.set('If-None-Match', '*');
          return _fetch(target, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
            headers
          }));
        }
      });
      created = true;
      resource = yield getResourceInfoWithAcl(url, {
        fetch: _fetch
      });
    }
    if (created) {
      var access = {
        read: true,
        append: true,
        write: true,
        control: true
      };
      var acl = setAgentResourceAccess(createAcl(resource), webId, access);
      acl = setAgentDefaultAccess(acl, webId, access);
      yield saveAclFor(resource, acl, {
        fetch: _fetch
      });
      resource = yield getResourceInfoWithAcl(url, {
        fetch: _fetch
      });
    }
    assertPrivateReceiptContainer(resource, url, webId);
  });
  return _ensureReceiptContainer.apply(this, arguments);
}
function assertPrivateReceiptContainer(resource, url, webId) {
  // Unlike an inbox, this container must not accept third-party appends.
  // Do not change pre-existing grants; reject unsafe status storage instead.
  var acl = hasResourceAcl(resource) ? getResourceAcl(resource) : createAclFromFallbackAcl(resource);
  var ACL = 'http://www.w3.org/ns/auth/acl#';
  var relevant = getThingAll(acl).filter(rule => [...getUrlAll(rule, ACL + 'accessTo'), ...getUrlAll(rule, ACL + 'default'), ...getUrlAll(rule, ACL + 'defaultForNew')].includes(url));
  if (!relevant.length || relevant.some(rule => getUrlAll(rule, ACL + 'mode').length && (getUrlAll(rule, ACL + 'agent').some(agent => agent !== webId) || !getUrlAll(rule, ACL + 'agent').length || getUrlAll(rule, ACL + 'agentClass').length || getUrlAll(rule, ACL + 'agentGroup').length))) {
    throw new Error('Outgoing request storage must be private to its owner. Existing permissions were not changed.');
  }
}
function fields(thing, url) {
  return {
    url,
    requestId: text(thing, 'requestId'),
    requesterWebId: iri(thing, 'requesterWebId'),
    ownerWebId: iri(thing, 'ownerWebId'),
    decidedBy: iri(thing, 'decidedBy'),
    datasetUrl: iri(thing, 'catalogDatasetUrl'),
    dataUrl: iri(thing, 'datasetAccessUrl'),
    status: text(thing, 'decision') || text(thing, 'deliveryStatus'),
    createdAt: stamp(thing, CREATED),
    decidedAt: stamp(thing, NS + 'decidedAt')
  };
}
function resolveRequestState(_ref) {
  var {
    dataset,
    webId,
    receipts = [],
    decisions = [],
    legacyPending = false,
    complete = true
  } = _ref;
  var matches = item => item.requesterWebId === webId && (!item.ownerWebId || item.ownerWebId === dataset.webid) && (!item.decidedBy || item.decidedBy === dataset.webid) && (item.datasetUrl ? item.datasetUrl === dataset.datasetUrl : Boolean(item.dataUrl && item.dataUrl === dataset.access_url_dataset));
  var requests = receipts.filter(matches).sort((a, b) => time(b.createdAt) - time(a.createdAt));
  var latest = requests[0];
  var replies = decisions.filter(item => matches(item) && terminal.has(item.status) && (!latest || item.requestId && item.requestId === latest.requestId) && (!latest || time(item.decidedAt || item.createdAt) >= time(latest.createdAt))).sort((a, b) => time(b.decidedAt || b.createdAt) - time(a.decidedAt || a.createdAt));
  if (!complete) return {
    status: 'unknown'
  };
  if (replies.length) return _objectSpread2$2(_objectSpread2$2({}, replies[0]), {}, {
    status: replies[0].status
  });
  if (latest) return _objectSpread2$2(_objectSpread2$2({}, latest), {}, {
    status: latest.status === 'sent' ? 'pending' : latest.status === 'failed' ? 'none' : 'unknown'
  });
  return {
    status: legacyPending ? 'unknown' : 'none'
  };
}
function readAccessRequestState(_x8) {
  return _readAccessRequestState.apply(this, arguments);
}
function _readAccessRequestState() {
  _readAccessRequestState = _asyncToGenerator(function* (_ref2) {
    var {
      session,
      dataset,
      storage = globalThis.localStorage
    } = _ref2;
    var webId = session.info.webId;
    var key = legacyRequestKey(dataset, webId);
    var legacyPending = false;
    try {
      legacyPending = Boolean(key && (storage === null || storage === void 0 ? void 0 : storage.getItem(key)));
    } catch (_unused) {/* Storage is optional. */}
    var controller = new AbortController();
    var timer = setTimeout(() => controller.abort(), 20000);
    var fetch = freshFetch((url, init) => session.fetch(url, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
      signal: controller.signal
    })));
    try {
      var [inbox, receiptContainer] = yield Promise.all([inboxFor(webId, fetch), receiptContainerFor(webId, fetch)]);
      var receipts = [],
        decisions = [];
      var complete = true;
      var _loop = function* _loop(container, type, target) {
        var listing;
        try {
          listing = yield getSolidDataset(container, {
            fetch
          });
        } catch (error) {
          var _error$response2;
          if (container === receiptContainer && (error.statusCode || ((_error$response2 = error.response) === null || _error$response2 === void 0 ? void 0 : _error$response2.status)) === 404) return 1; // continue
          throw error;
        }
        if (container === receiptContainer) assertPrivateReceiptContainer(yield getResourceInfoWithAcl(container, {
          fetch
        }), container, webId);
        var urls = [...new Set(getContainedResourceUrlAll(listing))];
        if (urls.length > 2000) complete = false;
        var cursor = 0;
        yield Promise.all(Array.from({
          length: Math.min(6, urls.length)
        }, /*#__PURE__*/_asyncToGenerator(function* () {
          while (cursor < Math.min(urls.length, 2000)) {
            if (controller.signal.aborted) {
              complete = false;
              break;
            }
            var url = urls[cursor++];
            if (!url.startsWith(container.endsWith('/') ? container : container + '/')) {
              complete = false;
              continue;
            }
            try {
              var doc = yield getSolidDataset(url, {
                fetch
              });
              for (var thing of getThingAll(doc)) if (getUrlAll(thing, TYPE).includes(NS + type)) target.push(fields(thing, url));
            } catch (_unused3) {
              complete = false;
            }
          }
        })));
      };
      for (var [container, type, target] of [[receiptContainer, 'AccessRequestReceipt', receipts], [inbox, 'AccessDecision', decisions]]) {
        if (yield* _loop(container, type, target)) continue;
      }
      var result = resolveRequestState({
        dataset,
        webId,
        receipts,
        decisions,
        legacyPending,
        complete
      });
      if (terminal.has(result.status)) {
        try {
          if (key) storage === null || storage === void 0 || storage.removeItem(key);
        } catch (_unused2) {/* Optional legacy cache. */}
      }
      return result;
    } catch (_unused4) {
      return {
        status: 'unknown'
      };
    } finally {
      clearTimeout(timer);
    }
  });
  return _readAccessRequestState.apply(this, arguments);
}
var buildThing = (url, type, literals, urls) => {
  var thing = setUrl(createThing({
    url
  }), TYPE, NS + type);
  for (var [key, value] of Object.entries(literals)) if (value) thing = setStringNoLocale(thing, key === 'createdAt' ? CREATED : NS + key, value);
  for (var [_key, _value] of Object.entries(urls)) if (_value) thing = setUrl(thing, NS + _key, _value);
  return thing;
};
function postDocument(_x9, _x10, _x11, _x12) {
  return _postDocument.apply(this, arguments);
}
function _postDocument() {
  _postDocument = _asyncToGenerator(function* (inbox, document, slug, fetch) {
    var response = yield fetch(inbox, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/turtle',
        Slug: slug
      },
      body: new Writer$1().quadsToString(new Parser$1().parse(yield solidDatasetAsTurtle(document)).map(quad => quad.subject.value === inbox + '#request' ? DataFactory.quad(DataFactory.namedNode(''), quad.predicate, quad.object, quad.graph) : quad))
    });
    if (!response.ok) throw Object.assign(new Error("Inbox rejected request (".concat(response.status, ")")), {
      rejected: true
    });
    var location = response.headers.get('Location');
    var url = location ? new URL(location, inbox).href : '';
    return url.startsWith(inbox.endsWith('/') ? inbox : inbox + '/') ? url : '';
  });
  return _postDocument.apply(this, arguments);
}
function sendAccessRequest(_x13) {
  return _sendAccessRequest.apply(this, arguments);
}
function _sendAccessRequest() {
  _sendAccessRequest = _asyncToGenerator(function* (_ref3) {
    var {
      session,
      dataset,
      userName = '',
      userEmail = '',
      message
    } = _ref3;
    if (!session.info.isLoggedIn || !session.info.webId) throw new Error('Please sign in with Solid to request access.');
    if (!(message !== null && message !== void 0 && message.trim())) throw new Error('Please provide a reason for your request.');
    var webId = session.info.webId,
      fetch = freshFetch(session.fetch);
    var owner = httpUrl(dataset.webid);
    var [receiptContainer, ownerInbox] = yield Promise.all([receiptContainerFor(webId, fetch), inboxFor(owner, fetch)]);
    yield ensureReceiptContainer(receiptContainer, webId, fetch);
    var requestId = globalThis.crypto.randomUUID(),
      createdAt = new Date().toISOString();
    var urls = {
      requesterWebId: webId,
      ownerWebId: owner,
      catalogDatasetUrl: dataset.datasetUrl,
      catalogUrl: dataset.catalogUrl,
      datasetAccessUrl: dataset.access_url_dataset,
      datasetSemanticModelUrl: dataset.access_url_semantic_model
    };
    var literals = {
      requestId,
      createdAt,
      requesterName: userName,
      requesterEmail: userEmail,
      datasetIdentifier: dataset.identifier || '',
      datasetTitle: dataset.title || '',
      message: message.trim()
    };
    // Store outgoing status separately from the appendable inbox so other senders cannot forge pending receipts.
    var receiptThing = buildThing(receiptContainer + '#request', 'AccessRequestReceipt', _objectSpread2$2(_objectSpread2$2({}, literals), {}, {
      deliveryStatus: 'sending'
    }), urls);
    var receiptUrl = yield postDocument(receiptContainer, setThing(createSolidDataset(), receiptThing), 'catalog-request-' + requestId, fetch);
    if (!receiptUrl) throw new Error('The outgoing request could not be saved. No request was sent to the owner.');
    var persist = /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator(function* (status) {
        var requestResourceUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        var doc = yield getSolidDataset(receiptUrl, {
          fetch
        });
        var receipt = getThingAll(doc).find(item => text(item, 'requestId') === requestId);
        if (!receipt) throw new Error('Outgoing request receipt is unavailable.');
        var next = setStringNoLocale(receipt, NS + 'deliveryStatus', status);
        if (requestResourceUrl) next = setUrl(next, NS + 'requestResourceUrl', requestResourceUrl);
        yield saveSolidDatasetAt(receiptUrl, setThing(doc, next), {
          fetch
        });
      });
      return function persist(_x14) {
        return _ref5.apply(this, arguments);
      };
    }();
    var requestResourceUrl;
    try {
      var request = buildThing(ownerInbox + '#request', 'AccessRequest', _objectSpread2$2(_objectSpread2$2({}, literals), {}, {
        status: 'pending'
      }), urls);
      requestResourceUrl = yield postDocument(ownerInbox, setThing(createSolidDataset(), request), 'access-request-' + requestId, fetch);
    } catch (error) {
      try {
        yield persist(error.rejected ? 'failed' : 'unknown');
      } catch (_unused5) {/* Sending remains explicitly unconfirmed. */}
      throw error;
    }
    try {
      yield persist('sent', requestResourceUrl);
      return {
        status: 'pending',
        requestId
      };
    } catch (_unused6) {
      return {
        status: 'unknown',
        requestId
      };
    }
  });
  return _sendAccessRequest.apply(this, arguments);
}

var formats = {
  ttl: ["Turtle / RDF", "text/turtle"],
  n3: ["N3 / RDF", "text/n3"],
  nt: ["N-Triples / RDF", "application/n-triples"],
  nq: ["N-Quads / RDF", "application/n-quads"],
  trig: ["TriG / RDF", "application/trig"],
  rdf: ["RDF/XML", "application/rdf+xml"],
  owl: ["RDF/XML", "application/rdf+xml"],
  jsonld: ["JSON-LD", "application/ld+json"],
  json: ["JSON", "application/json"],
  pdf: ["PDF", "application/pdf"],
  html: ["HTML", "text/html"],
  htm: ["HTML", "text/html"],
  xml: ["XML", "application/xml"],
  yaml: ["YAML", "application/yaml"],
  yml: ["YAML", "application/yaml"]
};
var rdfTypes = new Set(["text/turtle", "application/x-turtle", "text/n3", "application/n-triples", "application/n-quads", "application/trig"]);
function describeModelReference(url) {
  var _formats$extension, _Object$values$find;
  var {
    contentType = "",
    text = ""
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var extension = "";
  try {
    var _URL$pathname$split$p;
    extension = ((_URL$pathname$split$p = new URL(url).pathname.split("/").pop().split(".").slice(1).pop()) === null || _URL$pathname$split$p === void 0 ? void 0 : _URL$pathname$split$p.toLowerCase()) || "";
  } catch (_unused) {/* Unknown reference. */}
  var mime = contentType.split(";")[0].trim().toLowerCase();
  if (!mime || ["text/plain", "application/octet-stream"].includes(mime)) mime = ((_formats$extension = formats[extension]) === null || _formats$extension === void 0 ? void 0 : _formats$extension[1]) || "";
  var format = ((_Object$values$find = Object.values(formats).find(entry => entry[1] === mime)) === null || _Object$values$find === void 0 ? void 0 : _Object$values$find[0]) || mime || "Not specified";
  var content = "Content: Model, schema or specification";
  var code = formats[extension] ? extension.toUpperCase() : "REF";
  var action = "open";
  if (rdfTypes.has(mime) || ["application/rdf+xml", "application/ld+json"].includes(mime)) {
    content = "Content: RDF model";
    action = "download";
    code = "RDF";
    if (mime === "application/x-turtle") format = "Turtle / RDF";
  } else if (["application/json", "application/schema+json"].includes(mime)) {
    code = "JSON";
    format = "JSON";
    action = "download";
    if (mime === "application/schema+json") content = "Content: JSON Schema";
  } else if (mime === "application/pdf" || mime === "text/html") {
    content = "Content: Specification / documentation";
    code = mime === "application/pdf" ? "PDF" : "WEB";
    action = mime === "application/pdf" ? "download" : "open";
  } else if (mime && mime !== "Not specified") action = "download";
  if (text) {
    try {
      var value = JSON.parse(text);
      format = "JSON";
      code = "JSON";
      action = "download";
      mime = "application/json";
      content = "Content: Model, schema or specification";
      if (value && !Array.isArray(value) && typeof value.$schema === "string" && /^https?:\/\/(www\.)?json-schema\.org\//i.test(value.$schema)) content = "Content: JSON Schema";else if (value && !Array.isArray(value) && value["@context"]) {
        format = "JSON-LD";
        mime = "application/ld+json";
        content = "Content: RDF model";
      }
    } catch (_unused2) {/* A non-JSON reference retains its advertised format. */}
  }
  return {
    content,
    format,
    code,
    action,
    mime
  };
}
function parseReferenceTriples(text, url, mime) {
  if (mime && !rdfTypes.has(mime)) return [];
  try {
    // Parse the complete document before showing a graph; partial RDF is not enough.
    return new Parser$1(_objectSpread2$2({
      baseIRI: url
    }, mime ? {
      format: mime
    } : {})).parse(text).filter(q => q.subject.value && q.predicate.value && q.object.value).map(q => ({
      subject: q.subject.value,
      predicate: q.predicate.value,
      object: q.object.value,
      fullPredicate: q.predicate.value
    }));
  } catch (_unused3) {
    return [];
  }
}

var RDFGraph = _ref => {
  var {
    triples,
    onDoubleClick
  } = _ref;
  var containerRef = useRef(null);
  var networkRef = useRef(null);
  var resizeObserverRef = useRef(null);
  useEffect(() => {
    if (!triples || triples.length === 0 || !containerRef.current) return;
    var nodes = [];
    var edges = [];
    var nodeSet = new Set();
    triples.forEach(triple => {
      if (!triple.subject || !triple.predicate || !triple.object) {
        return;
      }
      if (!nodeSet.has(triple.subject)) {
        nodes.push({
          id: triple.subject,
          label: triple.subject,
          shape: "box",
          color: {
            background: "#4CAF50",
            border: "#388E3C"
          },
          font: {
            color: "white",
            size: 14
          },
          title: triple.subject
        });
        nodeSet.add(triple.subject);
      }
      if (!nodeSet.has(triple.object)) {
        nodes.push({
          id: triple.object,
          label: triple.object,
          shape: "ellipse",
          color: {
            background: "#FFC107",
            border: "#FFA000"
          },
          font: {
            color: "black",
            size: 14
          },
          title: triple.object
        });
        nodeSet.add(triple.object);
      }
      edges.push({
        from: triple.subject,
        to: triple.object,
        label: triple.fullPredicate,
        font: {
          align: "middle",
          size: 12
        },
        arrows: "to",
        color: {
          color: "#000000",
          highlight: "#ff0000"
        }
      });
    });
    var data = {
      nodes,
      edges
    };
    var options = {
      nodes: {
        shape: "dot",
        size: 20,
        font: {
          size: 16
        },
        borderWidth: 2
      },
      edges: {
        width: 1.5,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1.2
          }
        },
        smooth: false
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -3e4,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.04
        }
      },
      layout: {
        hierarchical: {
          enabled: false
        }
      }
    };
    networkRef.current = new Network(containerRef.current, data, options);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        var network = networkRef.current;
        if (!containerRef.current || !network) return;
        try {
          network.redraw();
        } catch (_unused) {
          // Ignore resize events that race with vis-network teardown.
        }
      });
      resizeObserverRef.current.observe(containerRef.current);
    }
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      var network = networkRef.current;
      networkRef.current = null;
      if (network) {
        network.destroy();
      }
    };
  }, [triples]);
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    className: "rdf-graph-container",
    onDoubleClick: onDoubleClick
  });
};

var RequestDatasetModal = _ref => {
  var {
    dataset,
    sessionWebId,
    userName,
    userEmail,
    onClose,
    onSuccess
  } = _ref;
  var {
    t
  } = useI18n();
  var [message, setMessage] = useState('');
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [error, setError] = useState("");
  var handleRequest = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* () {
      try {
        setError("");
        if (!session.info.isLoggedIn || !sessionWebId) {
          setError("Please sign in with Solid to request access.");
          return;
        }
        if (!message.trim()) {
          setError("Please provide a reason for your request.");
          return;
        }
        if (!(dataset !== null && dataset !== void 0 && dataset.webid)) {
          setError("This dataset does not provide an owner WebID for access requests.");
          return;
        }
        setIsSubmitting(true);
        var result = yield sendAccessRequest({
          session,
          dataset,
          userName,
          userEmail,
          message
        });
        onClose();
        if (onSuccess) onSuccess(result);
      } catch (error) {
        console.error('Error requesting dataset access:', error);
        setError("Failed to send the access request. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
    });
    return function handleRequest() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-form-dialog catalog-request-dialog",
    label: t("Request Dataset Access"),
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-form-content request-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-envelope-open-text mr-2"
  }), " Request Dataset Access"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "mb-3"
  }, "Your request will be delivered to the owner's Solid inbox and handled in the Solid Dataspace Manager."), /*#__PURE__*/React.createElement("p", {
    className: "mb-3"
  }, "To submit a request, please include a short background explaining why you need this dataset."), /*#__PURE__*/React.createElement("textarea", {
    autoFocus: true,
    "aria-label": t("Required message..."),
    className: "form-control request-message",
    required: true,
    placeholder: "Required message...",
    value: message,
    onChange: e => setMessage(e.target.value)
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "text-danger mt-2"
  }, error)), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer justify-content-end"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: handleRequest,
    disabled: isSubmitting
  }, "Request Access"))))));
};

var RequestSuccessModal = _ref => {
  var {
    onClose
  } = _ref;
  var {
    t
  } = useI18n();
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-form-dialog catalog-request-dialog",
    label: t("Request Sent"),
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-form-content request-success-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-lg",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-paper-plane mr-2"
  }), " Request Sent"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body text-center"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-circle-check fa-4x text-success mb-3"
  }), /*#__PURE__*/React.createElement("p", null, "Your access request has been delivered to the dataset owner's Solid inbox.")), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer justify-content-end"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: onClose
  }, "Close"))))));
};

var STATISTICS_NS = "https://w3id.org/solid-dataspace-manager/statistics#";
var LDP_RESOURCE = "http://www.w3.org/ns/ldp#Resource";
var CATALOG_EVENT_TYPES = Object.freeze({
  datasetDownload: "dataset_download",
  semanticModelDownload: "semantic_model_download"
});
var CATALOG_SURVEY_VERSION = "catalog-usability-v1";
var CATALOG_SURVEY_QUESTION_IDS = Object.freeze({
  systemComprehensibility: "system_comprehensibility",
  datasetFindability: "dataset_findability"
});
var CATALOG_SURFACES = Object.freeze({
  embedded: "embedded",
  standalone: "standalone"
});
var ALLOWED_EVENT_TYPES = new Set(Object.values(CATALOG_EVENT_TYPES));
var ALLOWED_SURVEY_QUESTION_IDS = new Set(Object.values(CATALOG_SURVEY_QUESTION_IDS));
var ALLOWED_CATALOG_SURFACES = new Set(Object.values(CATALOG_SURFACES));
var UUID_PATTERN$1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var parseBoolean = value => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
};
var normalizeHttpUrl = function normalizeHttpUrl(value) {
  var {
    container = false,
    stripHash = false,
    stripQuery = false,
    requireHttps = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var raw = String(value || "").trim();
  if (!raw) return "";
  try {
    var parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    if (requireHttps && parsed.protocol !== "https:") return "";
    if (parsed.username || parsed.password) return "";
    if (stripHash) parsed.hash = "";
    if (container || stripQuery) parsed.search = "";
    var normalized = parsed.toString();
    return container && !normalized.endsWith("/") ? "".concat(normalized, "/") : normalized;
  } catch (_unused) {
    return "";
  }
};
var normalizeOptionalContext = value => String(value || "").trim();
var normalizeStatisticsConfig = function normalizeStatisticsConfig() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var podBaseUrl = normalizeHttpUrl(config === null || config === void 0 ? void 0 : config.podBaseUrl, {
    container: true,
    stripHash: true,
    requireHttps: true
  });
  var explicitEventsUrl = normalizeHttpUrl(config === null || config === void 0 ? void 0 : config.eventsUrl, {
    container: true,
    stripHash: true,
    requireHttps: true
  });
  var eventsUrl = explicitEventsUrl || (podBaseUrl ? new URL("events/downloads/", podBaseUrl).href : "");
  return {
    enabled: parseBoolean(config === null || config === void 0 ? void 0 : config.enabled) && Boolean(eventsUrl),
    podBaseUrl,
    eventsUrl,
    registryContext: normalizeOptionalContext(config === null || config === void 0 ? void 0 : config.registryContext)
  };
};
var resolveStatisticsConfig = function resolveStatisticsConfig() {
  var {
    embedded = false,
    statisticsConfig,
    runtimeEnv
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (statisticsConfig !== undefined) {
    return normalizeStatisticsConfig(statisticsConfig);
  }
  if (embedded) {
    return normalizeStatisticsConfig();
  }
  var env = runtimeEnv !== undefined ? runtimeEnv : typeof window !== "undefined" ? window._env_ : undefined;
  return normalizeStatisticsConfig({
    enabled: env === null || env === void 0 ? void 0 : env.STATISTICS_ENABLED,
    podBaseUrl: env === null || env === void 0 ? void 0 : env.STATISTICS_POD_BASE_URL,
    eventsUrl: env === null || env === void 0 ? void 0 : env.STATISTICS_EVENTS_URL,
    registryContext: env === null || env === void 0 ? void 0 : env.STATISTICS_REGISTRY_CONTEXT
  });
};
var deriveSurveyEventsUrl = eventsUrl => {
  var normalized = normalizeHttpUrl(eventsUrl, {
    container: true,
    stripHash: true,
    requireHttps: true
  });
  if (!normalized) return "";
  var parsed = new URL(normalized);
  var pathSegments = parsed.pathname.split("/").filter(Boolean);
  var suffixStart = pathSegments.length - 4;
  if (suffixStart < 0 || pathSegments[suffixStart] !== "events" || pathSegments[suffixStart + 1] !== "catalog-instances" || !pathSegments[suffixStart + 2] || pathSegments[suffixStart + 3] !== "downloads") {
    return "";
  }
  pathSegments[pathSegments.length - 1] = "survey-responses";
  parsed.pathname = "/".concat(pathSegments.join("/"), "/");
  return parsed.href;
};
var createUuid = () => {
  var cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (typeof (cryptoApi === null || cryptoApi === void 0 ? void 0 : cryptoApi.randomUUID) === "function") {
    return cryptoApi.randomUUID();
  }
  if (typeof (cryptoApi === null || cryptoApi === void 0 ? void 0 : cryptoApi.getRandomValues) === "function") {
    var bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = bytes[6] & 0x0f | 0x40;
    bytes[8] = bytes[8] & 0x3f | 0x80;
    return Array.from(bytes, (byte, index) => {
      var hex = byte.toString(16).padStart(2, "0");
      return [4, 6, 8, 10].includes(index) ? "-".concat(hex) : hex;
    }).join("");
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
    var random = Math.floor(Math.random() * 16);
    var value = char === "x" ? random : random & 0x3 | 0x8;
    return value.toString(16);
  });
};
var normalizeTimestamp = value => {
  var date = value instanceof Date ? value : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};
var createCatalogEvent = function createCatalogEvent() {
  var {
    eventType,
    dataset,
    resourceUrl,
    registryContext,
    eventId,
    occurredAt
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return null;
  var datasetUrl = normalizeHttpUrl(dataset === null || dataset === void 0 ? void 0 : dataset.datasetUrl, {
    stripQuery: true
  });
  // The action target may be a presigned URL. Validate it for the action, but
  // never persist it because query parameters can contain credentials.
  if (!datasetUrl || !normalizeHttpUrl(resourceUrl)) return null;
  return {
    eventId: eventId || createUuid(),
    eventType,
    datasetUrl,
    datasetTitle: String((dataset === null || dataset === void 0 ? void 0 : dataset.title) || "").trim(),
    registryContext: normalizeOptionalContext((dataset === null || dataset === void 0 ? void 0 : dataset.registryContext) || registryContext),
    occurredAt: normalizeTimestamp(occurredAt)
  };
};
var escapeTurtleLiteral = value => String(value || "").replace(/\\/g, "\\\\").replace(/\"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, char => "\\u".concat(char.charCodeAt(0).toString(16).padStart(4, "0")));
var turtleLiteral = function turtleLiteral(value) {
  var datatype = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  return "\"".concat(escapeTurtleLiteral(value), "\"").concat(datatype ? "^^".concat(datatype) : "");
};
var serializeCatalogEvent = event => {
  var predicates = ["  stats:eventId ".concat(turtleLiteral(event.eventId)), "  stats:eventType ".concat(turtleLiteral(event.eventType)), "  stats:datasetUrl ".concat(turtleLiteral(event.datasetUrl, "xsd:anyURI")), "  stats:datasetTitle ".concat(turtleLiteral(event.datasetTitle)), "  stats:occurredAt ".concat(turtleLiteral(event.occurredAt, "xsd:dateTime"))];
  if (event.registryContext) {
    predicates.push("  stats:registryContext ".concat(turtleLiteral(event.registryContext)));
  }
  return ["@prefix stats: <".concat(STATISTICS_NS, "> ."), "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .", "", "<#event> a stats:CatalogEvent ;", "".concat(predicates.join(" ;\n"), " ."), ""].join("\n");
};
var createCatalogSurveyEvent = function createCatalogSurveyEvent() {
  var {
    questionId,
    rating,
    catalogSurface,
    eventId,
    occurredAt,
    surveyVersion = CATALOG_SURVEY_VERSION
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var normalizedRating = Number(rating);
  if (!ALLOWED_SURVEY_QUESTION_IDS.has(questionId)) return null;
  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    return null;
  }
  if (!ALLOWED_CATALOG_SURFACES.has(catalogSurface)) return null;
  var normalizedSurveyVersion = String(surveyVersion || "").trim();
  if (normalizedSurveyVersion !== CATALOG_SURVEY_VERSION) return null;
  var normalizedEventId = eventId ? String(eventId).trim().toLowerCase() : createUuid();
  if (!UUID_PATTERN$1.test(normalizedEventId)) return null;
  return {
    eventId: normalizedEventId,
    surveyVersion: normalizedSurveyVersion,
    questionId,
    rating: normalizedRating,
    catalogSurface,
    occurredAt: normalizeTimestamp(occurredAt)
  };
};
var serializeCatalogSurveyEvent = event => ["@prefix stats: <".concat(STATISTICS_NS, "> ."), "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .", "", "<#event> a stats:CatalogSurveyResponse ;", "  stats:eventId ".concat(turtleLiteral(event.eventId), " ;"), "  stats:surveyVersion ".concat(turtleLiteral(event.surveyVersion), " ;"), "  stats:questionId ".concat(turtleLiteral(event.questionId), " ;"), "  stats:rating ".concat(turtleLiteral(event.rating, "xsd:integer"), " ;"), "  stats:catalogSurface ".concat(turtleLiteral(event.catalogSurface), " ;"), "  stats:occurredAt ".concat(turtleLiteral(event.occurredAt, "xsd:dateTime"), " ."), ""].join("\n");
var recordCatalogSurveyResponse = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* () {
    var _session$info;
    var {
      session,
      statisticsConfig,
      questionId,
      rating,
      catalogSurface,
      eventId,
      occurredAt,
      surveyVersion
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = normalizeStatisticsConfig(statisticsConfig);
    var surveyEventsUrl = deriveSurveyEventsUrl(config.eventsUrl);
    if (!config.enabled || !surveyEventsUrl) return false;
    if (!(session !== null && session !== void 0 && (_session$info = session.info) !== null && _session$info !== void 0 && _session$info.isLoggedIn) || typeof (session === null || session === void 0 ? void 0 : session.fetch) !== "function") return false;
    var event = createCatalogSurveyEvent({
      questionId,
      rating,
      catalogSurface,
      eventId,
      occurredAt,
      surveyVersion
    });
    if (!event) return false;
    var response = yield session.fetch(surveyEventsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/turtle",
        Link: "<".concat(LDP_RESOURCE, ">; rel=\"type\""),
        Slug: "".concat(event.eventId, ".ttl")
      },
      body: serializeCatalogSurveyEvent(event)
    });
    if (!(response !== null && response !== void 0 && response.ok)) {
      throw new Error("Survey response write failed (".concat((response === null || response === void 0 ? void 0 : response.status) || "unknown", ")."));
    }
    return true;
  });
  return function recordCatalogSurveyResponse() {
    return _ref.apply(this, arguments);
  };
}();
var recordCatalogEvent = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* () {
    var _session$info2;
    var {
      session,
      statisticsConfig,
      eventType,
      dataset,
      resourceUrl
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = normalizeStatisticsConfig(statisticsConfig);
    if (!config.enabled) return false;
    if (!(session !== null && session !== void 0 && (_session$info2 = session.info) !== null && _session$info2 !== void 0 && _session$info2.isLoggedIn) || typeof (session === null || session === void 0 ? void 0 : session.fetch) !== "function") return false;
    var event = createCatalogEvent({
      eventType,
      dataset,
      resourceUrl,
      registryContext: config.registryContext
    });
    if (!event) return false;
    var response = yield session.fetch(config.eventsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/turtle",
        Link: "<".concat(LDP_RESOURCE, ">; rel=\"type\""),
        Slug: "".concat(event.eventId, ".ttl")
      },
      body: serializeCatalogEvent(event)
    });
    if (!(response !== null && response !== void 0 && response.ok)) {
      throw new Error("Statistics event write failed (".concat((response === null || response === void 0 ? void 0 : response.status) || "unknown", ")."));
    }
    return true;
  });
  return function recordCatalogEvent() {
    return _ref2.apply(this, arguments);
  };
}();
var trackCatalogEvent = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(function* (options) {
    try {
      return yield recordCatalogEvent(options);
    } catch (error) {
      console.warn("Catalog statistics event could not be stored.", error);
      return false;
    }
  });
  return function trackCatalogEvent(_x) {
    return _ref3.apply(this, arguments);
  };
}();

var openExternalLink = (url, windowRef) => {
  var targetWindow = windowRef !== undefined ? windowRef : typeof window !== "undefined" ? window : undefined;
  if (!url || !(targetWindow !== null && targetWindow !== void 0 && targetWindow.open)) return false;
  targetWindow.open(url, "_blank", "noopener,noreferrer");
  return true;
};
var startTracking = (trackEvent, options) => {
  try {
    var result = trackEvent(options);
    if (result && typeof result.catch === "function") {
      result.catch(() => false);
    }
  } catch (_unused) {
    // Statistics are deliberately best effort and must never block the action.
  }
};
var triggerBrowserDownload = function triggerBrowserDownload(blob, fileName) {
  var browser = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var documentRef = browser.document !== undefined ? browser.document : typeof document !== "undefined" ? document : undefined;
  var urlApi = browser.URL !== undefined ? browser.URL : typeof URL !== "undefined" ? URL : undefined;
  if (!(documentRef !== null && documentRef !== void 0 && documentRef.createElement) || !(urlApi !== null && urlApi !== void 0 && urlApi.createObjectURL)) {
    throw new Error("Browser download APIs are unavailable.");
  }
  var objectUrl = urlApi.createObjectURL(blob);
  try {
    var link = documentRef.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
  } finally {
    var _urlApi$revokeObjectU;
    (_urlApi$revokeObjectU = urlApi.revokeObjectURL) === null || _urlApi$revokeObjectU === void 0 || _urlApi$revokeObjectU.call(urlApi, objectUrl);
  }
};
var openDatasetAccess = function openDatasetAccess() {
  var {
    resourceUrl,
    windowRef
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return openExternalLink(resourceUrl, windowRef);
};
var downloadCatalogResource = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* () {
    var {
      session,
      dataset,
      resourceUrl,
      fileName,
      eventType,
      statisticsConfig,
      trackEvent = trackCatalogEvent,
      openLink = openExternalLink,
      browser
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var blob;
    try {
      var response = yield session.fetch(resourceUrl);
      if (!response.ok) throw new Error("Download failed.");
      blob = yield response.blob();
    } catch (error) {
      console.error("Download error:", error);
      openLink(resourceUrl);
      return false;
    }

    // Recording starts only after the protected resource was fetched as a blob.
    startTracking(trackEvent, {
      session,
      statisticsConfig,
      eventType,
      dataset,
      resourceUrl
    });
    try {
      triggerBrowserDownload(blob, fileName, browser);
    } catch (error) {
      console.error("Browser download error:", error);
      openLink(resourceUrl);
    }
    return true;
  });
  return function downloadCatalogResource() {
    return _ref.apply(this, arguments);
  };
}();

var httpContactUrl = value => {
  try {
    var url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch (_unused) {
    return "";
  }
};
var getCatalogWebHref = value => httpContactUrl(String(value || "").trim());
var getContactPointHref = function getContactPointHref(value) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var contact = String(value || "").trim();
  if (!contact) return "";
  var webUrl = getCatalogWebHref(contact);
  if (type === "url" || webUrl) return webUrl;
  if (type === "email" || contact.includes("@") && !contact.includes(":")) {
    return "mailto:".concat(contact.replace(/^mailto:/, ""));
  }
  return "";
};

var normalizeSolidProfileEmail = value => {
  var normalized = String(value || "").trim().replace(/^mailto:/i, "");
  if (!normalized || normalized.includes(":") || /\s/.test(normalized)) return "";
  var at = normalized.indexOf("@");
  if (at <= 0 || at !== normalized.lastIndexOf("@") || at === normalized.length - 1) {
    return "";
  }
  return normalized;
};
var getSolidProfileEmail = (profileDataset, profile) => {
  if (!profileDataset || !profile) return "";
  for (var emailReference of getUrlAll(profile, VCARD.hasEmail) || []) {
    if (emailReference.toLowerCase().startsWith("mailto:")) {
      var _email = normalizeSolidProfileEmail(emailReference);
      if (_email) return _email;
      continue;
    }
    var emailThing = getThing(profileDataset, emailReference);
    var email = emailThing ? normalizeSolidProfileEmail(getUrl(emailThing, VCARD.value) || "") : "";
    if (email) return email;
  }
  for (var directEmail of getUrlAll(profile, VCARD.email) || []) {
    var _email2 = normalizeSolidProfileEmail(directEmail);
    if (_email2) return _email2;
  }
  return "";
};

var getPodRootFromWebId = webId => {
  if (!webId) return "";
  try {
    var url = new URL(webId);
    var segments = url.pathname.split("/").filter(Boolean);
    var profileIndex = segments.indexOf("profile");
    var baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
    var basePath = baseSegments.length ? "/".concat(baseSegments.join("/"), "/") : "/";
    return "".concat(url.origin).concat(basePath);
  } catch (_unused) {
    return "";
  }
};
var formatDate = dateString => {
  if (!dateString) return "N/A";
  var date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};
var getResourceLabel = function getResourceLabel(url) {
  var {
    fallback = "Open resource"
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!url) return fallback;
  try {
    var parsed = new URL(url);
    var segments = parsed.pathname.split("/").filter(Boolean);
    var lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.includes(".")) {
      return decodeURIComponent(lastSegment);
    }
    return parsed.hostname || fallback;
  } catch (_unused2) {
    return url;
  }
};
var DatasetDetailModal = _ref => {
  var {
    dataset,
    onClose,
    sessionWebId,
    userName,
    userEmail,
    datasets = [],
    onEditClick,
    onDeleteClick,
    statisticsConfig,
    presentation = "modal"
  } = _ref;
  var [showVisualization, setShowVisualization] = useState(false);
  var [modelReference, setModelReference] = useState(null);
  var modelUrl = (dataset === null || dataset === void 0 ? void 0 : dataset.access_url_semantic_model) || "";
  var currentModel = (modelReference === null || modelReference === void 0 ? void 0 : modelReference.url) === modelUrl ? modelReference : null;
  var triples = (currentModel === null || currentModel === void 0 ? void 0 : currentModel.triples) || [];
  var modelPresentation = (currentModel === null || currentModel === void 0 ? void 0 : currentModel.presentation) || describeModelReference(modelUrl);
  var [canAccessDataset, setCanAccessDataset] = useState(false);
  var [canAccessModel, setCanAccessModel] = useState(false);
  var [ownerProfile, setOwnerProfile] = useState({
    name: "",
    email: "",
    photo: "",
    webId: ""
  });
  var [showRequestModal, setShowRequestModal] = useState(false);
  var [showRequestSuccess, setShowRequestSuccess] = useState(false);
  var nestedDialogOpen = showRequestModal || showRequestSuccess;
  var [requestState, setRequestState] = useState({
    status: "loading"
  });
  var [requestAttempt, setRequestAttempt] = useState(0);
  var refreshRequest = useCallback(() => setRequestAttempt(value => value + 1), []);
  var requestPending = requestState.status === "pending";
  var isSeries = (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series";
  var datasetLookup = new Map((datasets || []).map(item => [item.datasetUrl, item]));
  var resolveSeriesMember = url => {
    var match = datasetLookup.get(url);
    if (!match) return {
      title: url,
      url
    };
    return {
      title: match.title || match.identifier || url,
      url
    };
  };
  var formatTheme = value => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) {
      try {
        var url = new URL(value);
        if (url.hash) return url.hash.replace("#", "");
        var parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1] || value;
      } catch (_unused3) {
        return value;
      }
    }
    if (value.includes(":")) {
      return value.split(":").pop();
    }
    return value;
  };
  var isPodManagedUrl = url => {
    if (!url) return false;
    var ownerRoot = getPodRootFromWebId(dataset === null || dataset === void 0 ? void 0 : dataset.webid);
    return Boolean(ownerRoot && url.startsWith(ownerRoot));
  };
  useEffect(() => {
    var cancelled = false;
    var controller = new AbortController();
    setShowVisualization(false);
    setModelReference(null);
    if (isSeries || !modelUrl || !canAccessModel) return undefined;
    var loadReference = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        try {
          var _response$headers;
          var response = yield session.fetch(modelUrl, {
            signal: controller.signal
          });
          if (!response.ok) return;
          var contentType = ((_response$headers = response.headers) === null || _response$headers === void 0 ? void 0 : _response$headers.get("content-type")) || "";
          var _presentation = describeModelReference(modelUrl, {
            contentType
          });
          var mapped = [];
          if (!["application/pdf", "text/html"].includes(_presentation.mime)) {
            var text = yield response.text();
            _presentation = describeModelReference(modelUrl, {
              contentType,
              text
            });
            mapped = parseReferenceTriples(text, response.url || modelUrl, _presentation.mime);
            if (mapped.length && !_presentation.mime) _presentation = _objectSpread2$2(_objectSpread2$2({}, _presentation), {}, {
              content: "Content: RDF model",
              format: "RDF",
              code: "RDF",
              action: "download"
            });
          } else {
            var _response$body;
            yield (_response$body = response.body) === null || _response$body === void 0 ? void 0 : _response$body.cancel();
          }
          if (!cancelled) setModelReference({
            url: modelUrl,
            presentation: _presentation,
            triples: mapped
          });
        } catch (_unused4) {
          // CORS, unavailable resources and unsupported formats keep the neutral URL-based label.
        }
      });
      return function loadReference() {
        return _ref2.apply(this, arguments);
      };
    }();
    loadReference();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [modelUrl, canAccessModel, isSeries]);
  useEffect(() => {
    var cancelled = false;
    setCanAccessDataset(false);
    setCanAccessModel(false);
    var checkAccess = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
        if (!dataset || isSeries) return;
        if (dataset.is_public || dataset.webid === sessionWebId) {
          setCanAccessDataset(true);
          setCanAccessModel(true);
          return;
        }
        if (!session.info.isLoggedIn || !sessionWebId) return;
        // Read access is determined by the resource response, not by being able
        // to inspect somebody else's ACL. HEAD also avoids downloading the data.
        var canRead = /*#__PURE__*/function () {
          var _ref4 = _asyncToGenerator(function* (url) {
            if (!url || !isPodManagedUrl(url)) return false;
            try {
              return (yield session.fetch(url, {
                method: "HEAD"
              })).ok;
            } catch (_unused5) {
              return false;
            }
          });
          return function canRead(_x) {
            return _ref4.apply(this, arguments);
          };
        }();
        var [datasetAccess, modelAccess] = yield Promise.all([canRead(dataset.access_url_dataset), canRead(dataset.access_url_semantic_model)]);
        if (!cancelled) {
          setCanAccessDataset(datasetAccess);
          setCanAccessModel(modelAccess);
        }
      });
      return function checkAccess() {
        return _ref3.apply(this, arguments);
      };
    }();
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [dataset, sessionWebId, isSeries, requestAttempt]);
  useEffect(() => {
    var cancelled = false;
    if (!dataset || isSeries || dataset.is_public || dataset.webid === sessionWebId || !sessionWebId) {
      setRequestState({
        status: "none"
      });
      return undefined;
    }
    setRequestState({
      status: "loading"
    });
    readAccessRequestState({
      session,
      dataset
    }).then(result => {
      if (!cancelled) setRequestState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [dataset, sessionWebId, isSeries, requestAttempt]);
  useEffect(() => {
    window.addEventListener("focus", refreshRequest);
    return () => window.removeEventListener("focus", refreshRequest);
  }, [refreshRequest]);
  useEffect(() => {
    var cancelled = false;
    var photoObjectUrl = "";
    var ownerWebId = (dataset === null || dataset === void 0 ? void 0 : dataset.webid) || "";
    var fallbackProfile = {
      name: (dataset === null || dataset === void 0 ? void 0 : dataset.publisher) || "Solid Pod User",
      email: getContactPointHref(dataset === null || dataset === void 0 ? void 0 : dataset.contact_point, dataset === null || dataset === void 0 ? void 0 : dataset.contact_point_type).startsWith("mailto:") ? dataset.contact_point : "No email provided",
      photo: "",
      webId: ownerWebId
    };
    var loadOwnerProfile = /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator(function* () {
        if (!ownerWebId) {
          setOwnerProfile(fallbackProfile);
          return;
        }
        try {
          var profileDocUrl = ownerWebId.split("#")[0] || ownerWebId;
          var profileDataset = yield getSolidDataset(profileDocUrl, {
            fetch: session.fetch
          });
          var profile = getThing(profileDataset, ownerWebId) || getThingAll(profileDataset).find(thing => thing.url === ownerWebId);
          if (!profile) {
            if (!cancelled) setOwnerProfile(fallbackProfile);
            return;
          }
          var name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || fallbackProfile.name;
          var email = getSolidProfileEmail(profileDataset, profile) || fallbackProfile.email;
          var photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
          var photo = "";
          if (photoRef) {
            try {
              var photoUrl = new URL(photoRef, profileDocUrl).toString();
              var photoResponse = yield session.fetch(photoUrl);
              if (photoResponse.ok) {
                var photoBlob = yield photoResponse.blob();
                photoObjectUrl = URL.createObjectURL(photoBlob);
                if (cancelled) {
                  URL.revokeObjectURL(photoObjectUrl);
                  return;
                }
                photo = photoObjectUrl;
              }
            } catch (_unused6) {
              photo = "";
            }
          }
          if (!cancelled) {
            setOwnerProfile({
              name,
              email,
              photo,
              webId: ownerWebId
            });
          }
        } catch (err) {
          console.error("Failed to load dataset owner profile:", err);
          if (!cancelled) setOwnerProfile(fallbackProfile);
        }
      });
      return function loadOwnerProfile() {
        return _ref5.apply(this, arguments);
      };
    }();
    loadOwnerProfile();
    return () => {
      cancelled = true;
      if (photoObjectUrl) {
        URL.revokeObjectURL(photoObjectUrl);
      }
    };
  }, [dataset]);
  if (!dataset) return null;
  var hasSemanticModel = Boolean(dataset.access_url_semantic_model);
  var datasetLinkType = dataset.distribution_access_type === "access" ? "access" : "download";
  var datasetFileName = getResourceLabel(dataset.access_url_dataset, {
    fallback: "Dataset resource"
  });
  var modelFileName = getResourceLabel(dataset.access_url_semantic_model, {
    fallback: "Model, schema or specification"
  });
  var datasetFileType = datasetLinkType === "access" ? "URL" : (datasetFileName.split(".").pop() || "DATA").slice(0, 5).toUpperCase();
  var modelFileType = modelPresentation.code;
  var datasetActionIsDownload = datasetLinkType === "download";
  var modelActionIsDownload = modelPresentation.action === "download";
  var hasUserAccess = dataset.is_public || canAccessDataset;
  var canRequestAccess = !isSeries && !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);
  var requestButtonDisabled = canRequestAccess && (requestPending || requestState.status === "loading");
  var canManageDataset = Boolean(dataset.webid && sessionWebId && dataset.webid === sessionWebId);
  var titleValue = dataset.title || "Untitled dataset";
  var descriptionValue = dataset.description || "No description provided.";
  var themeValues = String(dataset.theme || "").split(/[,;|]/).map(value => value.trim()).filter(Boolean);
  var accessRightsValue = dataset.is_public ? "Public" : hasUserAccess ? "Restricted (you have access)" : "Restricted";
  var contactPointHref = getContactPointHref(dataset.contact_point, dataset.contact_point_type);
  var contactPointIsWeb = contactPointHref.startsWith("http");
  var publisherHref = getCatalogWebHref(dataset.publisher_url);
  var detailRows = [{
    predicate: "dct:identifier",
    value: dataset.identifier
  }, {
    predicate: "dct:issued",
    value: formatDate(dataset.issued)
  }, {
    predicate: "dct:modified",
    value: formatDate(dataset.modified)
  }, {
    predicate: "dct:publisher",
    value: publisherHref ? /*#__PURE__*/React.createElement("a", {
      href: publisherHref,
      target: "_blank",
      rel: "noopener noreferrer"
    }, dataset.publisher || publisherHref) : dataset.publisher
  }, {
    predicate: "dcat:contactPoint",
    value: dataset.contact_point ? contactPointHref ? /*#__PURE__*/React.createElement("a", {
      href: contactPointHref,
      target: contactPointIsWeb ? "_blank" : undefined,
      rel: contactPointIsWeb ? "noopener noreferrer" : undefined
    }, dataset.contact_point) : dataset.contact_point : null
  }, {
    predicate: "dct:creator",
    value: dataset.webid ? /*#__PURE__*/React.createElement("a", {
      href: dataset.webid,
      target: "_blank",
      rel: "noopener noreferrer"
    }, dataset.webid) : null
  }, {
    predicate: "dct:accessRights",
    value: accessRightsValue,
    isUiCopy: true
  }, {
    predicate: "dcat:distribution",
    value: isSeries ? "Dataset series" : datasetLinkType === "access" ? "Access URL" : "Download URL",
    isUiCopy: true
  }];
  if (!isSeries && dataset.access_url_dataset) {
    detailRows.push({
      predicate: datasetLinkType === "access" ? "dcat:accessURL" : "dcat:downloadURL",
      value: /*#__PURE__*/React.createElement("a", {
        href: dataset.access_url_dataset,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: event => {
          event.preventDefault();
          triggerDatasetAction();
        }
      }, dataset.access_url_dataset)
    });
  }
  if (!isSeries && hasSemanticModel) {
    detailRows.push({
      predicate: "dct:conformsTo",
      value: /*#__PURE__*/React.createElement("a", {
        href: dataset.access_url_semantic_model,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: event => {
          event.preventDefault();
          triggerModelAction();
        }
      }, dataset.access_url_semantic_model)
    });
  }
  if (isSeries) {
    detailRows.push({
      predicate: "dcat:seriesMember",
      value: "".concat((dataset.seriesMembers || []).length, " member").concat((dataset.seriesMembers || []).length === 1 ? "" : "s")
    });
  }
  var renderDetailValue = value => {
    if (value === 0) return value;
    return value || /*#__PURE__*/React.createElement("span", {
      className: "text-muted"
    }, "N/A");
  };
  var triggerDatasetAction = () => {
    if (datasetActionIsDownload) {
      downloadCatalogResource({
        session,
        dataset,
        resourceUrl: dataset.access_url_dataset,
        fileName: datasetFileName,
        eventType: CATALOG_EVENT_TYPES.datasetDownload,
        statisticsConfig
      });
      return;
    }
    openDatasetAccess({
      resourceUrl: dataset.access_url_dataset
    });
  };
  var triggerModelAction = () => {
    if (modelActionIsDownload) {
      downloadCatalogResource({
        session,
        dataset,
        resourceUrl: dataset.access_url_semantic_model,
        fileName: modelFileName,
        eventType: CATALOG_EVENT_TYPES.semanticModelDownload,
        statisticsConfig
      });
      return;
    }
    openExternalLink(dataset.access_url_semantic_model);
  };
  var handleEditAction = () => {
    onEditClick === null || onEditClick === void 0 || onEditClick(dataset);
  };
  var handleDeleteAction = () => {
    onDeleteClick === null || onDeleteClick === void 0 || onDeleteClick(dataset);
  };
  var metadataLabels = {
    "dct:identifier": "Identifier",
    "dct:issued": "Issued Date",
    "dct:modified": "Modified Date",
    "dct:publisher": "Publisher",
    "dcat:contactPoint": "Contact point",
    "dct:creator": "Pod owner",
    "dct:accessRights": "Access Rights",
    "dcat:distribution": "Resource type",
    "dcat:accessURL": "Access URL",
    "dcat:downloadURL": "Download URL",
    "dct:conformsTo": "Model, schema or specification",
    "dcat:seriesMember": "Members"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: presentation === "inline" ? "catalog-detail-content" : undefined
  }, /*#__PURE__*/React.createElement("div", {
    inert: nestedDialogOpen ? true : undefined,
    className: presentation === "inline" ? "catalog-detail-inline" : "modal show modal-show dataset-add-modal dataset-detail-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl dataset-detail-dialog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-database mr-2"
  }), " Detail Dataset"), /*#__PURE__*/React.createElement("div", {
    className: "dataset-detail-header-actions"
  }, canManageDataset && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dataset-detail-action-button dataset-detail-action-button--edit",
    onClick: handleEditAction
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-regular fa-pen-to-square"
  }), /*#__PURE__*/React.createElement("span", null, "Edit")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dataset-detail-action-button dataset-detail-action-button--delete",
    onClick: handleDeleteAction
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash"
  }), /*#__PURE__*/React.createElement("span", null, "Delete"))), canRequestAccess && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light dataset-detail-request-button",
    onClick: () => setShowRequestModal(true),
    disabled: requestButtonDisabled,
    title: requestButtonDisabled ? "Request already sent. Waiting for the dataset owner." : "Request access to this dataset"
  }, requestState.status === "loading" ? "Checking request status..." : requestPending ? "Request Pending" : ["revoked", "denied", "expired", "archived", "unknown"].includes(requestState.status) ? "Request again" : "Request Dataset")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", null, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body dataset-detail-body"
  }, !isSeries && !dataset.is_public && dataset.webid !== sessionWebId && /*#__PURE__*/React.createElement("div", {
    className: "dataset-request-status",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, {
    loading: "Checking request status...",
    pending: "Request pending",
    approved: "Request approved",
    revoked: "Access revoked",
    denied: "Request denied",
    expired: "Access expired",
    archived: "Request closed",
    unknown: "Request status could not be confirmed. You can check again or send a new request."
  }[requestState.status]), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light",
    onClick: refreshRequest,
    disabled: requestState.status === "loading"
  }, "Check request status")), /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-predicate-label"
  }, "dct:title"), /*#__PURE__*/React.createElement("h2", {
    translate: dataset.title ? "no" : undefined
  }, titleValue), presentation === "inline" && /*#__PURE__*/React.createElement("div", {
    className: "catalog-detail-access"
  }, /*#__PURE__*/React.createElement("span", {
    className: "catalog-access catalog-access--".concat(isSeries ? "series" : dataset.is_public ? "public" : hasUserAccess ? "available" : "restricted")
  }, isSeries ? "Dataset Series" : accessRightsValue)), /*#__PURE__*/React.createElement("div", {
    className: "dataset-detail-description"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-predicate-label"
  }, "dct:description"), /*#__PURE__*/React.createElement("p", {
    translate: dataset.description ? "no" : undefined
  }, descriptionValue))), /*#__PURE__*/React.createElement("div", {
    className: "pod-info-card dataset-detail-owner-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-info-left"
  }, ownerProfile.photo ? /*#__PURE__*/React.createElement("img", {
    src: ownerProfile.photo,
    alt: "Dataset owner",
    className: "pod-avatar"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "pod-avatar pod-avatar--placeholder"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-user"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pod-name",
    translate: ownerProfile.name ? "no" : undefined
  }, ownerProfile.name || "Solid Pod User"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta"
  }, ownerProfile.email || "No email provided"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta pod-webid"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-link"
  }), /*#__PURE__*/React.createElement("span", null, ownerProfile.webId || "No WebID"))))), !isSeries && /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Files and Sources"), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-list"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-file-row ".concat(!canAccessDataset ? "is-restricted" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-file-icon"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-file-icon-code"
  }, datasetFileType)), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-file-title",
    translate: dataset.access_url_dataset ? "no" : undefined
  }, datasetFileName), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-meta"
  }, "Content: Dataset file"), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-meta"
  }, "Access: ", canAccessDataset ? accessRightsValue : "Restricted")), /*#__PURE__*/React.createElement("button", {
    className: "detail-download-button",
    onClick: triggerDatasetAction,
    disabled: !canAccessDataset || !dataset.access_url_dataset
  }, datasetActionIsDownload ? "Download" : "Open")), hasSemanticModel && /*#__PURE__*/React.createElement("div", {
    className: "detail-file-row ".concat(!canAccessModel ? "is-restricted" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-file-icon semantic"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-file-icon-code"
  }, modelFileType)), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-file-title",
    translate: "no"
  }, modelFileName), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-meta"
  }, modelPresentation.content), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Format:"), " ", /*#__PURE__*/React.createElement("span", {
    translate: modelPresentation.format === "Not specified" ? undefined : "no"
  }, modelPresentation.format))), /*#__PURE__*/React.createElement("button", {
    className: "detail-download-button",
    onClick: triggerModelAction,
    disabled: !canAccessModel
  }, modelActionIsDownload ? "Download" : "Open")))), /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card"
  }, /*#__PURE__*/React.createElement("h3", null, "Categories"), /*#__PURE__*/React.createElement("div", {
    className: "detail-predicate-label"
  }, "dcat:theme"), themeValues.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "detail-theme-list"
  }, themeValues.map(themeValue => /*#__PURE__*/React.createElement("span", {
    className: "detail-theme-chip",
    translate: "no",
    key: themeValue
  }, formatTheme(themeValue)))) : /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "N/A")), /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card"
  }, /*#__PURE__*/React.createElement("table", {
    className: "detail-metadata-table"
  }, /*#__PURE__*/React.createElement("tbody", null, detailRows.map(row => /*#__PURE__*/React.createElement("tr", {
    key: row.predicate
  }, /*#__PURE__*/React.createElement("th", {
    scope: "row"
  }, presentation === "inline" ? metadataLabels[row.predicate] || row.predicate : row.predicate), /*#__PURE__*/React.createElement("td", {
    translate: row.isUiCopy ? undefined : "no"
  }, renderDetailValue(row.value))))))), isSeries && /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card"
  }, /*#__PURE__*/React.createElement("h3", null, "dcat:seriesMember"), (dataset.seriesMembers || []).length === 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "No members listed.") : /*#__PURE__*/React.createElement("div", {
    className: "detail-series-list"
  }, dataset.seriesMembers.map(url => {
    var resolved = resolveSeriesMember(url);
    var info = datasetLookup.get(url);
    return /*#__PURE__*/React.createElement("div", {
      key: url,
      className: "detail-series-row"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "detail-series-title",
      translate: "no"
    }, resolved.title), (info === null || info === void 0 ? void 0 : info.description) && /*#__PURE__*/React.createElement("div", {
      className: "detail-series-description",
      translate: "no"
    }, info.description)), /*#__PURE__*/React.createElement("a", {
      href: resolved.url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, "Open dataset"));
  }))), !isSeries && canAccessModel && triples.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card dataset-detail-visualization"
  }, /*#__PURE__*/React.createElement("details", {
    open: showVisualization,
    onToggle: event => setShowVisualization(event.currentTarget.open)
  }, /*#__PURE__*/React.createElement("summary", null, "Semantic Model Visualization"), /*#__PURE__*/React.createElement("div", {
    className: "detail-graph-wide"
  }, showVisualization && /*#__PURE__*/React.createElement(RDFGraph, {
    triples: triples
  })))))))), showRequestModal && !isSeries && /*#__PURE__*/React.createElement(RequestDatasetModal, {
    dataset: dataset,
    sessionWebId: sessionWebId,
    userName: userName,
    userEmail: userEmail,
    onClose: () => setShowRequestModal(false),
    onSuccess: result => {
      setRequestState(result || {
        status: "unknown"
      });
      setShowRequestSuccess(true);
    }
  }), showRequestSuccess && !isSeries && /*#__PURE__*/React.createElement(RequestSuccessModal, {
    onClose: () => setShowRequestSuccess(false)
  }));
};

var SEARCH_PREFIXES = "PREFIX dcat: <http://www.w3.org/ns/dcat#>\nPREFIX dct: <http://purl.org/dc/terms/>\nPREFIX search: <https://w3id.org/solid-dataspace/search#>\n";
var SEARCH_EXAMPLES = [{
  label: 'Catalog datasets',
  query: "".concat(SEARCH_PREFIXES, "\nSELECT DISTINCT ?dataset ?title ?owner WHERE {\n  GRAPH <urn:solid-dataspace:semantic-search:index> {\n    ?dataset search:metadataGraph ?metadata ; search:owner ?owner .\n  }\n  GRAPH ?metadata { ?dataset dct:title ?title . }\n}\nORDER BY ?title\nLIMIT 100")
}, {
  label: 'Classes in semantic models',
  query: "".concat(SEARCH_PREFIXES, "\nSELECT DISTINCT ?dataset ?title ?class WHERE {\n  GRAPH <urn:solid-dataspace:semantic-search:index> {\n    ?dataset search:metadataGraph ?metadata ; search:modelGraph ?model .\n  }\n  GRAPH ?metadata { ?dataset dct:title ?title . }\n  GRAPH ?model { ?node a ?class . }\n}\nORDER BY ?title ?class\nLIMIT 100")
}, {
  label: 'Match a model pattern',
  query: "".concat(SEARCH_PREFIXES, "\n# Replace the example class and property with IRIs from your models.\nPREFIX example: <https://example.org/ontology/>\nSELECT DISTINCT ?dataset ?title WHERE {\n  GRAPH <urn:solid-dataspace:semantic-search:index> {\n    ?dataset search:metadataGraph ?metadata ; search:modelGraph ?model .\n  }\n  GRAPH ?metadata { ?dataset dct:title ?title . }\n  GRAPH ?model {\n    ?beam a example:SteelBeam ; example:hasType example:TypeX .\n  }\n}\nLIMIT 100")
}];
function searchRequest(_x) {
  return _searchRequest.apply(this, arguments);
}
function _searchRequest() {
  _searchRequest = _asyncToGenerator(function* (path) {
    var {
      baseUrl = '/api/semantic-search',
      registry,
      query,
      signal
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var response = yield fetch("".concat(baseUrl.replace(/\/$/, ''), "/").concat(path).concat(registry ? "?registry=".concat(encodeURIComponent(registry)) : ''), _objectSpread2$2({
      method: query === undefined ? 'GET' : 'POST',
      credentials: 'omit',
      cache: 'no-store',
      signal,
      headers: query === undefined ? {} : {
        'Content-Type': 'application/json'
      }
    }, query === undefined ? {} : {
      body: JSON.stringify({
        query
      })
    }));
    if (!response.ok) {
      var error = yield response.json().catch(() => ({}));
      throw new Error(typeof error.detail === 'string' ? error.detail : "Search request failed (".concat(response.status, ")."));
    }
    var contentType = response.headers.get('content-type') || '';
    var body = contentType.includes('json') ? yield response.json() : yield response.text();
    return {
      body,
      contentType,
      duration: response.headers.get('x-search-duration-ms')
    };
  });
  return _searchRequest.apply(this, arguments);
}
function safeResultUrl(value) {
  try {
    var url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch (_unused) {
    return null;
  }
}

function SemanticSearchResults(_ref) {
  var _result$body$head, _result$body$results;
  var {
    result,
    onOpenDataset
  } = _ref;
  var {
    t
  } = useI18n();
  if (!result) return /*#__PURE__*/React.createElement("p", {
    className: "semantic-search-muted"
  }, t('Run a query to see results.'));
  if (typeof result.body === 'string') return /*#__PURE__*/React.createElement("pre", {
    className: "semantic-search-rdf",
    tabIndex: 0
  }, result.body);
  if (typeof result.body.boolean === 'boolean') return /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, "ASK: ", /*#__PURE__*/React.createElement("strong", null, String(result.body.boolean)));
  var variables = ((_result$body$head = result.body.head) === null || _result$body$head === void 0 ? void 0 : _result$body$head.vars) || [];
  var rows = ((_result$body$results = result.body.results) === null || _result$body$results === void 0 ? void 0 : _result$body$results.bindings) || [];
  if (!rows.length) return /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, t('No matching results.'));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, rows.length, " ", t('results'), " \xB7 ", result.duration || '—', " ms"), rows.length > 1000 && /*#__PURE__*/React.createElement("p", null, t('Showing the first 1,000 rows. Export includes all returned rows.')), /*#__PURE__*/React.createElement("div", {
    className: "semantic-search-table",
    tabIndex: 0,
    role: "region",
    "aria-label": t('Query results')
  }, /*#__PURE__*/React.createElement("table", {
    translate: "no"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, variables.map(name => /*#__PURE__*/React.createElement("th", {
    scope: "col",
    key: name
  }, name)))), /*#__PURE__*/React.createElement("tbody", null, rows.slice(0, 1000).map((row, index) => /*#__PURE__*/React.createElement("tr", {
    key: index
  }, variables.map(name => {
    var _binding$value;
    var binding = row[name];
    var href = (binding === null || binding === void 0 ? void 0 : binding.type) === 'uri' ? safeResultUrl(binding.value) : null;
    return /*#__PURE__*/React.createElement("td", {
      key: name
    }, href ? /*#__PURE__*/React.createElement(React.Fragment, null, name === 'dataset' && onOpenDataset ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "semantic-search-dataset",
      onClick: () => onOpenDataset(href)
    }, binding.value) : /*#__PURE__*/React.createElement("a", {
      href: href,
      target: "_blank",
      rel: "noopener noreferrer"
    }, binding.value)) : /*#__PURE__*/React.createElement("span", {
      title: (binding === null || binding === void 0 ? void 0 : binding.datatype) || ''
    }, (_binding$value = binding === null || binding === void 0 ? void 0 : binding.value) !== null && _binding$value !== void 0 ? _binding$value : '—', binding !== null && binding !== void 0 && binding['xml:lang'] ? " @".concat(binding['xml:lang']) : ''));
  })))))));
}

function SemanticSearch(_ref) {
  var _status$errors;
  var {
    onOpenDataset,
    apiBaseUrl,
    registryUrl,
    embedded = false
  } = _ref;
  var {
    t
  } = useI18n();
  var [status, setStatus] = useState(null);
  var [query, setQuery] = useState(SEARCH_EXAMPLES[0].query);
  var [result, setResult] = useState(null);
  var [error, setError] = useState('');
  var [busy, setBusy] = useState(false);
  var [refresh, setRefresh] = useState(0);
  var activeQuery = useRef(null);
  var ready = ['ready', 'partial'].includes(status === null || status === void 0 ? void 0 : status.status);
  useEffect(() => {
    var controller = new AbortController();
    var disposed = false;
    var timer = setTimeout(() => controller.abort(), 15000);
    setStatus(null);
    searchRequest('status', {
      baseUrl: apiBaseUrl,
      registry: registryUrl,
      signal: controller.signal
    }).then(_ref2 => {
      var {
        body
      } = _ref2;
      return setStatus(body);
    }).catch(err => {
      if (!disposed) setError(err.name === 'AbortError' ? 'Search status request timed out.' : err.message);
    }).finally(() => clearTimeout(timer));
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [apiBaseUrl, registryUrl, refresh]);
  useEffect(() => () => {
    var _activeQuery$current;
    return (_activeQuery$current = activeQuery.current) === null || _activeQuery$current === void 0 ? void 0 : _activeQuery$current.abort();
  }, []);
  function run(_x) {
    return _run.apply(this, arguments);
  }
  function _run() {
    _run = _asyncToGenerator(function* (event) {
      var _activeQuery$current3;
      event.preventDefault();
      (_activeQuery$current3 = activeQuery.current) === null || _activeQuery$current3 === void 0 || _activeQuery$current3.abort();
      var controller = new AbortController();
      activeQuery.current = controller;
      setBusy(true);
      setError('');
      setResult(null);
      var timer = setTimeout(() => controller.abort(), 25000);
      try {
        setResult(yield searchRequest('query', {
          baseUrl: apiBaseUrl,
          registry: registryUrl,
          query,
          signal: controller.signal
        }));
      } catch (err) {
        setError(err.name === 'AbortError' ? t('Query cancelled or timed out.') : err.message);
      } finally {
        clearTimeout(timer);
        if (activeQuery.current === controller) {
          setBusy(false);
          activeQuery.current = null;
        }
      }
    });
    return _run.apply(this, arguments);
  }
  function download() {
    var rdf = typeof result.body === 'string';
    var blob = new Blob([rdf ? result.body : JSON.stringify(result.body, null, 2)], {
      type: rdf ? 'text/turtle' : 'application/sparql-results+json'
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = "semantic-search.".concat(rdf ? 'ttl' : 'json');
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "semantic-search",
    "aria-label": t('Semantic Search')
  }, !embedded && /*#__PURE__*/React.createElement("h1", null, t('Semantic Search')), !ready && /*#__PURE__*/React.createElement("div", {
    className: "semantic-search-notice",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, status || error ? t('Search is currently unavailable. Please try again shortly.') : t('Loading search...')), (status || error) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light",
    onClick: () => {
      setError('');
      setRefresh(v => v + 1);
    }
  }, t('Retry'))), (status === null || status === void 0 ? void 0 : status.errorCount) > 0 && /*#__PURE__*/React.createElement("details", {
    className: "semantic-search-errors"
  }, /*#__PURE__*/React.createElement("summary", null, status.errorCount, " ", t('sources could not be indexed')), /*#__PURE__*/React.createElement("ul", null, (_status$errors = status.errors) === null || _status$errors === void 0 ? void 0 : _status$errors.map((entry, index) => /*#__PURE__*/React.createElement("li", {
    key: index
  }, /*#__PURE__*/React.createElement("code", null, entry.source), ": ", entry.message)))), /*#__PURE__*/React.createElement("form", {
    onSubmit: run
  }, /*#__PURE__*/React.createElement("div", {
    className: "semantic-search-examples"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "semantic-search-example"
  }, t('Example query')), /*#__PURE__*/React.createElement("select", {
    id: "semantic-search-example",
    defaultValue: "",
    onChange: e => {
      if (e.target.value !== '') setQuery(SEARCH_EXAMPLES[Number(e.target.value)].query);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, t('Choose an example')), SEARCH_EXAMPLES.map((example, index) => /*#__PURE__*/React.createElement("option", {
    key: example.label,
    value: index
  }, t(example.label))))), /*#__PURE__*/React.createElement("label", {
    htmlFor: "semantic-search-query"
  }, "SPARQL"), /*#__PURE__*/React.createElement("textarea", {
    id: "semantic-search-query",
    value: query,
    onChange: e => setQuery(e.target.value),
    spellCheck: false,
    rows: 15,
    maxLength: 32000,
    "aria-describedby": "semantic-search-help"
  }), /*#__PURE__*/React.createElement("p", {
    id: "semantic-search-help",
    className: "semantic-search-muted"
  }, t('SELECT, ASK, CONSTRUCT and DESCRIBE. Use ?dataset for links to catalog details. Examples with ontology IRIs must be adapted to your models.')), /*#__PURE__*/React.createElement("div", {
    className: "semantic-search-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    type: "submit",
    disabled: busy || !ready || !query.trim()
  }, busy ? t('Running query…') : t('Run query')), busy && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light",
    type: "button",
    onClick: () => {
      var _activeQuery$current2;
      return (_activeQuery$current2 = activeQuery.current) === null || _activeQuery$current2 === void 0 ? void 0 : _activeQuery$current2.abort();
    }
  }, t('Cancel')), result && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light",
    type: "button",
    onClick: download
  }, t('Export results')))), error && /*#__PURE__*/React.createElement("p", {
    className: "semantic-search-error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "semantic-search-results",
    "aria-busy": busy
  }, /*#__PURE__*/React.createElement("h2", null, t('Query results')), /*#__PURE__*/React.createElement(SemanticSearchResults, {
    result: result,
    onOpenDataset: onOpenDataset
  })));
}

function SemanticSearchModal(_ref) {
  var {
    onClose,
    suspended,
    onOpenDataset,
    datasetOpenError,
    registryUrl
  } = _ref;
  var {
    t
  } = useI18n();
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-search-dialog",
    label: t('Semantic Search'),
    suspended: suspended,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-search-content"
  }, /*#__PURE__*/React.createElement("header", {
    className: "catalog-search-header"
  }, /*#__PURE__*/React.createElement("h2", null, t('Semantic Search')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-search-close",
    "aria-label": t('Close'),
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "catalog-search-body"
  }, datasetOpenError && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "semantic-search-error"
  }, datasetOpenError), /*#__PURE__*/React.createElement(SemanticSearch, {
    embedded: true,
    registryUrl: registryUrl,
    onOpenDataset: onOpenDataset
  }))));
}

var DatasetDeleteModal = _ref => {
  var {
    onClose,
    onDeleted,
    dataset,
    fetchDatasets
  } = _ref;
  var handleDelete = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* () {
      try {
        if (!dataset) return;
        if (dataset.datasetType === "series") {
          yield deleteSeriesEntry(session, dataset.datasetUrl, dataset.identifier);
        } else {
          yield deleteDatasetEntry(session, dataset.datasetUrl, dataset.identifier);
        }
        yield fetchDatasets();
        if (onDeleted) {
          onDeleted();
        } else {
          onClose();
        }
      } catch (error) {
        console.error("Error deleting dataset:", error);
      }
    });
    return function handleDelete() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "modal fade show modal-show dataset-add-modal dataset-delete-modal",
    tabIndex: "-1",
    role: "dialog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash mr-2"
  }), " Delete ", (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series" ? "Series" : "Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body text-center dataset-delete-modal-body"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-triangle-exclamation text-danger dataset-delete-modal-icon"
  }), /*#__PURE__*/React.createElement("p", {
    className: "lead dataset-delete-modal-message"
  }, "Are you sure you want to delete this ", (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series" ? "series" : "dataset", "?")), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer justify-content-end"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-danger",
    onClick: handleDelete
  }, "Delete")))));
};

var DatasetEditModal = _ref => {
  var {
    dataset,
    onClose,
    fetchDatasets
  } = _ref;
  var {
    t
  } = useI18n();
  // Shared Solid session instance

  var [editedDataset, setEditedDataset] = useState(null);
  var [webId, setWebId] = useState('');
  var [loading, setLoading] = useState(false);
  var [datasetSource, setDatasetSource] = useState("pod");
  var [modelSource, setModelSource] = useState("pod");
  var [datasetUpload, setDatasetUpload] = useState({
    file: null,
    url: "",
    error: ""
  });
  var [modelUpload, setModelUpload] = useState({
    file: null,
    url: "",
    error: ""
  });
  var [datasetUploadPath, setDatasetUploadPath] = useState("/");
  var [modelUploadPath, setModelUploadPath] = useState("/");
  var [solidUserName, setSolidUserName] = useState('');
  var [solidUserPhoto, setSolidUserPhoto] = useState('');
  var showSemanticModel = true;
  var [existingDatasets, setExistingDatasets] = useState([]);
  var [seriesMembers, setSeriesMembers] = useState([]);
  var [seriesData, setSeriesData] = useState({
    title: "",
    description: "",
    theme: "",
    issued: "",
    publisher: "",
    contact_point: ""
  });
  var hasRequiredFields = Boolean((editedDataset === null || editedDataset === void 0 ? void 0 : editedDataset.access_url_dataset) || datasetSource === "upload" && datasetUpload.file);
  var requiresPublicAccess = datasetSource === "external";
  var isSeries = (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series";
  useEffect(() => {
    if (!requiresPublicAccess || !editedDataset || editedDataset.is_public) return;
    setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      is_public: true
    }));
  }, [requiresPublicAccess, editedDataset]);
  useEffect(() => {
    var _dataset$issued, _dataset$modified;
    if (!dataset) return;
    var podRoot = session.info.webId ? (() => {
      var base = session.info.webId.split("/profile/")[0];
      return base.endsWith("/") ? base : "".concat(base, "/");
    })() : "";
    setEditedDataset(_objectSpread2$2(_objectSpread2$2({}, dataset), {}, {
      issued: ((_dataset$issued = dataset.issued) === null || _dataset$issued === void 0 ? void 0 : _dataset$issued.split('T')[0]) || '',
      modified: ((_dataset$modified = dataset.modified) === null || _dataset$modified === void 0 ? void 0 : _dataset$modified.split('T')[0]) || '',
      distribution_access_type: dataset.distribution_access_type || "download"
    }));
    setDatasetSource((dataset.distribution_access_type || "download") === "access" ? "external" : "pod");
    setModelSource(dataset.access_url_semantic_model && (!podRoot || !dataset.access_url_semantic_model.startsWith(podRoot)) ? "external" : "pod");
    if (dataset.datasetType === "series") {
      var _dataset$issued2;
      setSeriesData({
        title: dataset.title || "",
        description: dataset.description || "",
        theme: dataset.theme || "",
        issued: ((_dataset$issued2 = dataset.issued) === null || _dataset$issued2 === void 0 ? void 0 : _dataset$issued2.split('T')[0]) || '',
        publisher: dataset.publisher || "",
        contact_point: dataset.contact_point || ""
      });
      setSeriesMembers((dataset.seriesMembers || []).filter(Boolean).map(url => ({
        kind: "existing",
        datasetUrl: url,
        label: url
      })));
    } else {
      setSeriesMembers([]);
    }
  }, [dataset]);
  useEffect(() => {
    var loadProfileAndFiles = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var profileDataset = yield getSolidDataset(session.info.webId, {
            fetch: session.fetch
          });
          var profile = getThing(profileDataset, session.info.webId);
          var name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || 'Solid Pod User';
          var emailNode = getUrlAll(profile, VCARD.hasEmail)[0];
          var email = '';
          if (emailNode) {
            var _getUrl;
            var emailThing = getThing(profileDataset, emailNode);
            email = ((_getUrl = getUrl(emailThing, VCARD.value)) === null || _getUrl === void 0 ? void 0 : _getUrl.replace('mailto:', '')) || '';
          }
          setSolidUserName(name);
          setWebId(session.info.webId);
          setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            publisher: name,
            contact_point: email,
            webid: session.info.webId
          }));
          setSeriesData(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
            publisher: name,
            contact_point: email
          }));
          var photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
          var photoUrl = "";
          if (photoRef) {
            try {
              var res = yield session.fetch(photoRef);
              if (res.ok) {
                var blob = yield res.blob();
                photoUrl = URL.createObjectURL(blob);
              } else {
                photoUrl = photoRef;
              }
            } catch (err) {
              photoUrl = photoRef;
            }
          }
          setSolidUserPhoto(photoUrl);
          try {
            var {
              datasets
            } = yield loadAggregatedDatasets(session);
            var own = (datasets || []).filter(item => item.webid === session.info.webId && item.datasetType !== "series" && Boolean(item.datasetUrl));
            setExistingDatasets(own);
          } catch (err) {
            console.error("Failed to load existing datasets:", err);
          }
        } catch (err) {
          console.error("Failed to load pod data", err);
        }
      });
      return function loadProfileAndFiles() {
        return _ref2.apply(this, arguments);
      };
    }();
    loadProfileAndFiles();
  }, [session]);
  var getPodRoot = () => {
    if (!session.info.webId) return "";
    var base = session.info.webId.split("/profile/")[0];
    return base.endsWith("/") ? base : "".concat(base, "/");
  };
  var normalizeUploadPath = function normalizeUploadPath(value) {
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
    if (!value) return fallback;
    var path = value.trim();
    if (!path.startsWith("/")) path = "/".concat(path);
    if (!path.endsWith("/")) path = "".concat(path, "/");
    return path;
  };
  var ensureContainer = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(function* (containerUrl) {
      try {
        yield createContainerAt(containerUrl, {
          fetch: session.fetch
        });
      } catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.statusCode) !== 409) {
          throw err;
        }
      }
    });
    return function ensureContainer(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var ensureUploadContainer = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (path) {
      var root = getPodRoot();
      if (!root) throw new Error("Missing pod root.");
      var normalized = normalizeUploadPath(path);
      var uploads = "".concat(root).concat(normalized.replace(/^\//, ""));
      var segments = normalized.split("/").filter(Boolean);
      var current = root;
      for (var segment of segments) {
        current = "".concat(current).concat(segment, "/");
        yield ensureContainer(current);
      }
      return uploads;
    });
    return function ensureUploadContainer(_x2) {
      return _ref4.apply(this, arguments);
    };
  }();
  var uploadFile = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(function* (file, pathOverride) {
      if (!file) return "";
      var uploads = yield ensureUploadContainer(pathOverride);
      var safeName = encodeURIComponent(file.name || "upload-".concat(Date.now()));
      var targetUrl = "".concat(uploads).concat(safeName);
      var res = yield session.fetch(targetUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });
      if (!res.ok) {
        throw new Error("Upload failed (".concat(res.status, ")"));
      }
      return targetUrl;
    });
    return function uploadFile(_x3, _x4) {
      return _ref5.apply(this, arguments);
    };
  }();
  var handleDatasetFileSelect = event => {
    var _event$target;
    var file = event === null || event === void 0 || (_event$target = event.target) === null || _event$target === void 0 || (_event$target = _event$target.files) === null || _event$target === void 0 ? void 0 : _event$target[0];
    setDatasetUpload({
      file: file || null,
      url: "",
      error: ""
    });
    if (!file) return;
    setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      file_format: inferMediaType(file.name)
    }));
  };
  var handleModelFileSelect = event => {
    var _event$target2;
    var file = event === null || event === void 0 || (_event$target2 = event.target) === null || _event$target2 === void 0 || (_event$target2 = _event$target2.files) === null || _event$target2 === void 0 ? void 0 : _event$target2[0];
    setModelUpload({
      file: file || null,
      url: "",
      error: ""
    });
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({
        file: null,
        url: "",
        error: "Only TTL files are allowed."
      });
      return;
    }
  };
  var handleDatasetDrop = event => {
    var _event$dataTransfer;
    event.preventDefault();
    var file = (_event$dataTransfer = event.dataTransfer) === null || _event$dataTransfer === void 0 || (_event$dataTransfer = _event$dataTransfer.files) === null || _event$dataTransfer === void 0 ? void 0 : _event$dataTransfer[0];
    if (!file) return;
    handleDatasetFileSelect({
      target: {
        files: [file]
      }
    });
  };
  var handleModelDrop = event => {
    var _event$dataTransfer2;
    event.preventDefault();
    var file = (_event$dataTransfer2 = event.dataTransfer) === null || _event$dataTransfer2 === void 0 || (_event$dataTransfer2 = _event$dataTransfer2.files) === null || _event$dataTransfer2 === void 0 ? void 0 : _event$dataTransfer2[0];
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({
        file: null,
        url: "",
        error: "Only TTL files are allowed."
      });
      return;
    }
    handleModelFileSelect({
      target: {
        files: [file]
      }
    });
  };
  var inferMediaType = value => {
    if (!value) return "";
    var lowered = value.toLowerCase();
    if (lowered.endsWith(".csv")) return "text/csv";
    if (lowered.endsWith(".json")) return "application/json";
    if (lowered.endsWith(".geojson")) return "application/geo+json";
    if (lowered.endsWith(".jsonld") || lowered.endsWith(".json-ld")) return "application/ld+json";
    if (lowered.endsWith(".ttl")) return "text/turtle";
    if (lowered.endsWith(".rdf") || lowered.endsWith(".xml")) return "application/rdf+xml";
    if (lowered.endsWith(".pdf")) return "application/pdf";
    if (lowered.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (lowered.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  };
  var handleInputChange = e => {
    var {
      name,
      value
    } = e.target;
    var inferredMediaType = name === 'access_url_dataset' ? inferMediaType(value) : '';
    setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      [name]: value
    }, name === 'access_url_dataset' ? {
      file_format: inferredMediaType !== "application/octet-stream" ? inferredMediaType : ""
    } : {}));
  };
  var handleDatasetSourceChange = next => {
    setDatasetSource(next);
    if (next !== "upload") {
      setDatasetUpload({
        file: null,
        url: "",
        error: ""
      });
    }
    setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: "",
      file_format: "",
      distribution_access_type: "download",
      is_public: next === "external" || modelSource === "external" ? true : prev.is_public
    }));
  };
  var handleModelSourceChange = next => {
    setModelSource(next);
    if (next !== "upload") {
      setModelUpload({
        file: null,
        url: "",
        error: ""
      });
    }
    setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: "",
      is_public: next === "external" || datasetSource === "external" ? true : prev.is_public
    }));
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* () {
      try {
        setLoading(true);
        if (isSeries) {
          if (!seriesData.title.trim()) {
            alert("Series title is required.");
            return;
          }
          if (seriesMembers.length === 0) {
            alert("Please add at least one series member.");
            return;
          }
          var memberUrls = seriesMembers.filter(member => member.kind === "existing" && member.datasetUrl).map(member => member.datasetUrl);
          yield updateDatasetSeries(session, _objectSpread2$2(_objectSpread2$2({}, seriesData), {}, {
            container_url: dataset.access_url_dataset,
            identifier: dataset.identifier,
            datasetUrl: dataset.datasetUrl,
            seriesUrl: dataset.datasetUrl,
            seriesMembers: Array.from(new Set(memberUrls)),
            webid: webId
          }));
        } else {
          var datasetToSave = _objectSpread2$2({}, editedDataset);
          if (!datasetToSave.access_url_dataset && !(datasetSource === "upload" && datasetUpload.file)) {
            alert("Dataset link is required.");
            return;
          }
          if (datasetSource === "external" && !datasetToSave.is_public) {
            datasetToSave = _objectSpread2$2(_objectSpread2$2({}, datasetToSave), {}, {
              is_public: true
            });
          }
          if (!datasetToSave.access_url_semantic_model && !(modelSource === "upload" && modelUpload.file)) {
            alert("A semantic model or schema is required for this distribution.");
            return;
          }
          if (datasetSource === "upload" && datasetUpload.file) {
            var url = yield uploadFile(datasetUpload.file, datasetUploadPath);
            datasetToSave = _objectSpread2$2(_objectSpread2$2({}, datasetToSave), {}, {
              access_url_dataset: url,
              file_format: inferMediaType(url)
            });
            setDatasetUpload(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
              url,
              error: ""
            }));
            setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
              access_url_dataset: url,
              file_format: inferMediaType(url)
            }));
          }
          if (showSemanticModel && modelSource === "upload" && modelUpload.file) {
            var _url = yield uploadFile(modelUpload.file, modelUploadPath);
            datasetToSave = _objectSpread2$2(_objectSpread2$2({}, datasetToSave), {}, {
              access_url_semantic_model: _url
            });
            setModelUpload(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
              url: _url,
              error: ""
            }));
            setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
              access_url_semantic_model: _url
            }));
          }
          yield updateDataset(session, _objectSpread2$2(_objectSpread2$2({}, datasetToSave), {}, {
            distribution_access_type: "download"
          }));
        }
        yield fetchDatasets();
        onClose();
      } catch (err) {
        console.error("Error updating dataset:", err);
        alert((err === null || err === void 0 ? void 0 : err.message) || "The dataset could not be saved.");
      } finally {
        setLoading(false);
      }
    });
    return function handleSave() {
      return _ref6.apply(this, arguments);
    };
  }();
  var renderInput = function renderInput(label, name) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'text';
    var icon = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'fa-circle';
    var disabled = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    return /*#__PURE__*/React.createElement("div", {
      className: "form-group position-relative mb-3"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid ".concat(icon, " input-icon ").concat(type === 'textarea' ? 'input-icon-textarea' : type === 'date' ? 'input-icon-date' : 'input-icon-text')
    }), type === 'textarea' ? /*#__PURE__*/React.createElement("textarea", {
      className: "form-control",
      name: name,
      value: editedDataset[name],
      onChange: handleInputChange,
      placeholder: label,
      rows: 2,
      disabled: disabled,
      style: {
        paddingLeft: '30px'
      }
    }) : /*#__PURE__*/React.createElement("input", {
      className: "form-control",
      type: type,
      name: name,
      value: editedDataset[name],
      onChange: handleInputChange,
      placeholder: label,
      disabled: disabled,
      style: {
        paddingLeft: '30px'
      }
    }));
  };
  var renderSourceToggle = (value, onChange) => /*#__PURE__*/React.createElement("div", {
    className: "source-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "upload" ? "active" : ""),
    onClick: () => onChange("upload")
  }, "Upload file"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "pod" ? "active" : ""),
    onClick: () => onChange("pod")
  }, "Select from pod"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle-btn ".concat(value === "external" ? "active" : ""),
    onClick: () => onChange("external")
  }, "External link"));
  var renderUploadBox = _ref7 => {
    var {
      label,
      accept,
      onFileChange,
      onDrop,
      state,
      inputId,
      hint
    } = _ref7;
    return /*#__PURE__*/React.createElement("div", {
      className: "upload-box"
    }, /*#__PURE__*/React.createElement("div", {
      className: "upload-drop",
      onDragOver: e => e.preventDefault(),
      onDrop: onDrop
    }, /*#__PURE__*/React.createElement("div", {
      className: "upload-icon"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-cloud-arrow-up"
    })), /*#__PURE__*/React.createElement("div", {
      className: "upload-text"
    }, /*#__PURE__*/React.createElement("strong", null, "Drag & drop"), " your file here"), /*#__PURE__*/React.createElement("div", {
      className: "upload-subtext"
    }, "or"), /*#__PURE__*/React.createElement("label", {
      htmlFor: inputId,
      className: "upload-button"
    }, "Browse files"), /*#__PURE__*/React.createElement("input", {
      id: inputId,
      type: "file",
      accept: accept,
      onChange: onFileChange,
      className: "upload-input"
    })), state.file && /*#__PURE__*/React.createElement("div", {
      className: "upload-selected-files"
    }, /*#__PURE__*/React.createElement("span", null, "1 file selected"), /*#__PURE__*/React.createElement("div", {
      className: "upload-selected-file"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", {
      translate: "no"
    }, state.file.name), /*#__PURE__*/React.createElement("small", null, Math.ceil((state.file.size || 0) / 1024), " KB")))), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint), state.url && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint success"
    }, "Uploaded to ", state.url), state.error && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint error"
    }, state.error));
  };
  var renderExternalUrlInput = _ref8 => {
    var {
      label,
      name,
      value,
      placeholder,
      hint
    } = _ref8;
    return /*#__PURE__*/React.createElement("div", {
      className: "mb-3"
    }, /*#__PURE__*/React.createElement("label", {
      className: "font-weight-bold mb-2"
    }, label), /*#__PURE__*/React.createElement("input", {
      className: "form-control",
      type: "url",
      name: name,
      value: value || "",
      onChange: handleInputChange,
      placeholder: placeholder
    }), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint));
  };
  if (!editedDataset) return null;
  var resolveMemberLabel = member => {
    if (!member) return "Dataset";
    var match = existingDatasets.find(item => item.datasetUrl === member.datasetUrl);
    var resolved = (match === null || match === void 0 ? void 0 : match.title) || (match === null || match === void 0 ? void 0 : match.identifier) || member.datasetUrl || "Dataset";
    if (!member.label) return resolved;
    if (member.label === member.datasetUrl) return resolved;
    return member.label;
  };
  return /*#__PURE__*/React.createElement(CatalogModal, {
    className: "catalog-form-dialog",
    label: t(isSeries ? "Edit Dataset Series" : "Edit Dataset"),
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "dataset-add-modal catalog-form-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-pen-to-square mr-2"
  }), " ", isSeries ? "Edit Dataset Series" : "Edit Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", null, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-info-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pod-info-left"
  }, solidUserPhoto ? /*#__PURE__*/React.createElement("img", {
    src: solidUserPhoto,
    alt: "Pod owner",
    className: "pod-avatar"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "pod-avatar pod-avatar--placeholder"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-user"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pod-name"
  }, solidUserName || "Solid Pod User"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta"
  }, editedDataset.contact_point || "No email provided"), /*#__PURE__*/React.createElement("div", {
    className: "pod-meta pod-webid"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-link"
  }), /*#__PURE__*/React.createElement("span", null, webId || "No WebID"))))), !isSeries && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-section mb-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "General Information"), renderInput("Title", "title", "text", "fa-heading"), renderInput("Description", "description", "textarea", "fa-align-left"), renderInput("Theme", "theme", "text", "fa-tags"), !requiresPublicAccess && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Access Rights"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    name: "is_public",
    value: editedDataset.is_public ? 'public' : 'restricted',
    onChange: e => setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      is_public: e.target.value === 'public'
    })),
    style: {
      paddingLeft: '30px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "public"
  }, "Public"), /*#__PURE__*/React.createElement("option", {
    value: "restricted"
  }, "Restricted")))), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), renderInput("Issued Date", "issued", "date", "fa-calendar-plus")), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Dataset Resource"), renderInput("Media type (e.g. application/json)", "file_format", "text", "fa-file-code"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
    onSelectPath: path => setDatasetUploadPath(normalizeUploadPath(path, "/")),
    webId: webId
  }), datasetSource === "upload" ? renderUploadBox({
    label: "Upload dataset file",
    accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
    onFileChange: handleDatasetFileSelect,
    onDrop: handleDatasetDrop,
    state: datasetUpload,
    inputId: "edit-dataset-upload-input"
  }) : datasetSource === "pod" ? /*#__PURE__*/React.createElement(PodResourcePicker, {
    label: "Select Dataset File",
    resourceType: "dataset",
    selectedUrl: editedDataset.access_url_dataset,
    webId: webId,
    onSelect: fileUrl => setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_dataset: fileUrl,
      file_format: inferMediaType(fileUrl)
    }))
  }) : renderExternalUrlInput({
    label: "Direct dataset download URL",
    name: "access_url_dataset",
    value: editedDataset.access_url_dataset,
    placeholder: "https://..."
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic model or schema"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Required for each distribution")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2 semantic-model-actions"
  }, /*#__PURE__*/React.createElement("a", {
    href: "http://plasma.uni-wuppertal.de/modelings",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn btn-outline-primary btn-sm"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Create Semantic Model"))), /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
    onSelectPath: path => setModelUploadPath(normalizeUploadPath(path, "/")),
    webId: webId
  }), modelSource === "upload" ? renderUploadBox({
    label: "Upload semantic model",
    accept: ".ttl",
    onFileChange: handleModelFileSelect,
    onDrop: handleModelDrop,
    state: modelUpload,
    hint: "Allowed: TTL",
    inputId: "edit-model-upload-input"
  }) : modelSource === "pod" ? /*#__PURE__*/React.createElement(PodResourcePicker, {
    label: "Select Semantic Model",
    resourceType: "semanticModel",
    selectedUrl: editedDataset.access_url_semantic_model,
    webId: webId,
    onSelect: fileUrl => setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: fileUrl
    }))
  }) : renderExternalUrlInput({
    label: "Public model or schema IRI",
    name: "access_url_semantic_model",
    value: editedDataset.access_url_semantic_model,
    placeholder: "https://example.org/model.ttl"
  })))), isSeries && /*#__PURE__*/React.createElement("div", {
    className: "form-section mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Dataset Series")), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-layer-group input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-control",
    type: "text",
    placeholder: "Series Title",
    value: seriesData.title,
    onChange: e => setSeriesData(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      title: e.target.value
    })),
    style: {
      paddingLeft: '30px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-align-left input-icon input-icon-textarea"
  }), /*#__PURE__*/React.createElement("textarea", {
    className: "form-control",
    placeholder: "Series Description",
    rows: 2,
    value: seriesData.description,
    onChange: e => setSeriesData(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      description: e.target.value
    })),
    style: {
      paddingLeft: '30px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-tags input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-control",
    type: "text",
    placeholder: "Series Theme (IRI)",
    value: seriesData.theme,
    onChange: e => setSeriesData(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      theme: e.target.value
    })),
    style: {
      paddingLeft: '30px'
    }
  })), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-calendar-plus input-icon input-icon-date"
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-control",
    type: "date",
    value: seriesData.issued,
    onChange: e => setSeriesData(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      issued: e.target.value
    })),
    style: {
      paddingLeft: '30px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Series Members (Existing Datasets)"), /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap gap-2"
  }, existingDatasets.map(item => {
    var selected = seriesMembers.some(member => member.kind === "existing" && member.datasetUrl === item.datasetUrl);
    return /*#__PURE__*/React.createElement("button", {
      key: item.datasetUrl,
      type: "button",
      className: "btn btn-sm ".concat(selected ? "btn-primary" : "btn-outline-secondary"),
      onClick: () => {
        if (selected) {
          setSeriesMembers(prev => prev.filter(member => !(member.kind === "existing" && member.datasetUrl === item.datasetUrl)));
        } else {
          setSeriesMembers(prev => [...prev, {
            kind: "existing",
            datasetUrl: item.datasetUrl,
            label: item.title || item.identifier || item.datasetUrl
          }]);
        }
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-database mr-2"
    }), item.title || item.identifier || "Dataset");
  }))), seriesMembers.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Current Members"), /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap gap-2"
  }, seriesMembers.map((member, idx) => /*#__PURE__*/React.createElement("span", {
    key: "".concat(member.kind, "-").concat(idx),
    className: "badge badge-light border"
  }, resolveMemberLabel(member), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-link btn-sm ml-2",
    onClick: () => setSeriesMembers(prev => prev.filter((_, index) => index !== idx))
  }, "x"))))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: handleSave,
    disabled: loading || !isSeries && !hasRequiredFields,
    title: !isSeries && !hasRequiredFields ? "Dataset link is required" : ""
  }, loading ? /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-spinner fa-spin mr-2"
  }) : /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-floppy-disk mr-2"
  }), loading ? "Saving..." : "Save Changes"))))));
};

// Assets keep their build URL; the router and home link follow the entry URL.
function standaloneCatalogBase(pathname) {
  var publicUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : process.env.PUBLIC_URL || "";
  return /^\/catalog(?:\/|$)/.test(pathname) ? "/catalog" : publicUrl;
}

var LoginIssuerModal = _ref => {
  var {
    onClose,
    onLogin
  } = _ref;
  var [customIssuer, setCustomIssuer] = useState('');
  var solidLogo = process.env.PUBLIC_URL + "/assets/images/solid.svg";
  return /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show d-block",
    tabIndex: "-1",
    role: "dialog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-lg modal-dialog-centered",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content shadow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-right-to-bracket mr-2"
  }), " Choose Solid Pod Provider"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "mb-4"
  }, "Please select a provider or enter your own Solid OIDC Issuer:"), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn provider-btn w-100 d-flex align-items-center mb-2",
    onClick: () => onLogin('https://solid-community-server.tmdt.info')
  }, /*#__PURE__*/React.createElement("img", {
    src: solidLogo,
    alt: "solid",
    width: "24",
    height: "24",
    className: "mr-2"
  }), "solid-community-server.tmdt.info"), /*#__PURE__*/React.createElement("button", {
    className: "btn provider-btn w-100 d-flex align-items-center mb-2",
    onClick: () => onLogin('https://solidcommunity.net')
  }, /*#__PURE__*/React.createElement("img", {
    src: solidLogo,
    alt: "solid",
    width: "24",
    height: "24",
    className: "mr-2"
  }), "solidcommunity.net")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "customIssuer"
  }, /*#__PURE__*/React.createElement("strong", null, "Custom Issuer URL")), /*#__PURE__*/React.createElement("div", {
    className: "input-group"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "customIssuer",
    className: "form-control",
    value: customIssuer,
    onChange: e => setCustomIssuer(e.target.value),
    placeholder: "https://your-pod-provider.example"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-outline-success btn-solid-login",
    type: "button",
    onClick: () => onLogin(customIssuer),
    disabled: !customIssuer.trim()
  }, "Login")))))));
};

var loadProfilePhoto = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (dataset, profile, fetch) {
    var photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
    if (!photoRef) return '';
    var photoUrl = photoRef;
    if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(photoRef)) {
      var photoThing = getThing(dataset, photoRef);
      if (photoThing) {
        photoUrl = getUrl(photoThing, VCARD.value) || getUrl(photoThing, VCARD.url) || '';
      }
    }
    if (photoUrl) {
      try {
        var response = yield fetch(photoUrl);
        if (response.ok) return URL.createObjectURL(yield response.blob());
      } catch (_unused) {
        // A missing avatar does not prevent access to the catalog.
      }
    }
    return photoUrl;
  });
  return function loadProfilePhoto(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var HeaderBar = _ref2 => {
  var {
    onLoginStatusChange,
    onWebIdChange,
    onUserInfoChange,
    languageControl,
    initialUserInfo
  } = _ref2;
  var [showLoginModal, setShowLoginModal] = useState(false);
  var [userInfo, setUserInfo] = useState(initialUserInfo || {
    loggedIn: false,
    name: '',
    email: '',
    photo: '',
    webId: ''
  });

  // Use a dedicated session instance for this app
  // (see ../solidSession.js)

  var loginWithIssuer = issuer => {
    session.login({
      oidcIssuer: issuer,
      redirectUrl: window.location.href,
      clientName: "Semantic Data Catalog"
    });
  };
  var fetchPodUserInfo = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(function* (webId) {
      try {
        var dataset = yield getSolidDataset(webId, {
          fetch: session.fetch
        });
        var profile = getThing(dataset, webId);
        var name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || "Solid User";
        var photo = yield loadProfilePhoto(dataset, profile, session.fetch);
        var email = "";
        var emailNode = getUrl(profile, VCARD.hasEmail);
        if (emailNode) {
          var emailThing = getThing(dataset, emailNode);
          if (emailThing) {
            var mailto = getUrl(emailThing, VCARD.value);
            if (mailto && mailto.startsWith("mailto:")) {
              email = mailto.replace("mailto:", "");
            }
          }
        }
        setUserInfo({
          loggedIn: true,
          name,
          email,
          photo,
          webId
        });
        if (onLoginStatusChange) onLoginStatusChange(true);
        if (onWebIdChange) onWebIdChange(webId);
        if (onUserInfoChange) onUserInfoChange({
          name,
          email
        });
      } catch (err) {
        console.error("Error loading pod profile info:", err);
      }
    });
    return function fetchPodUserInfo(_x4) {
      return _ref3.apply(this, arguments);
    };
  }();
  useEffect(() => {
    if ((initialUserInfo === null || initialUserInfo === void 0 ? void 0 : initialUserInfo.webId) === session.info.webId && initialUserInfo !== null && initialUserInfo !== void 0 && initialUserInfo.loggedIn) return;
    if (session.info.isLoggedIn && session.info.webId) {
      localStorage.setItem("solid-was-logged-in", "true");
      fetchPodUserInfo(session.info.webId);
    } else {
      var wasLoggedIn = localStorage.getItem("solid-was-logged-in") === "true";
      if (wasLoggedIn) {
        var lastIssuer = localStorage.getItem("solid-oidc-issuer") || process.env.REACT_APP_OIDC_ISSUER;
        loginWithIssuer(lastIssuer);
      } else {
        if (onLoginStatusChange) onLoginStatusChange(false);
      }
    }
  }, []);
  var handleLogout = () => {
    localStorage.removeItem("solid-was-logged-in");
    setUserInfo({
      loggedIn: false,
      name: '',
      email: '',
      photo: '',
      webId: ''
    });
    if (onLoginStatusChange) onLoginStatusChange(false);
    if (onUserInfoChange) onUserInfoChange({
      name: '',
      email: ''
    });
    session.logout({
      logoutRedirectUrl: window.location.href
    });
    window.location.reload();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "header-bar",
    "data-standalone-header": true
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-title"
  }, /*#__PURE__*/React.createElement("a", {
    "data-standalone-brand": true,
    href: standaloneCatalogBase(window.location.pathname) + '/'
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faBookOpen,
    className: "header-icon",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, "Semantic ", /*#__PURE__*/React.createElement("span", {
    className: "highlight"
  }, "Data"), " Catalog")))), /*#__PURE__*/React.createElement("div", {
    className: "header-right header-right--catalog",
    "data-standalone-actions": true
  }, userInfo.loggedIn ? /*#__PURE__*/React.createElement("div", {
    className: "header-user"
  }, userInfo.photo && /*#__PURE__*/React.createElement("img", {
    src: userInfo.photo,
    alt: "Profile",
    className: "profile-picture"
  }), /*#__PURE__*/React.createElement("span", {
    className: "header-user-name"
  }, /*#__PURE__*/React.createElement("strong", {
    translate: userInfo.name ? "no" : undefined
  }, userInfo.name || "Solid User"), ' ', /*#__PURE__*/React.createElement("span", {
    className: "header-user-webid"
  }, "(", userInfo.webId, ")")), languageControl, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light btn-sm header-logout",
    onClick: handleLogout
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-right-from-bracket mr-1"
  }), " Logout")) : /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center"
  }, languageControl, /*#__PURE__*/React.createElement("span", {
    className: "mr-3"
  }, /*#__PURE__*/React.createElement("strong", null, "Not logged in")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-outline-primary btn-sm",
    onClick: () => setShowLoginModal(true)
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-right-to-bracket mr-1"
  }), " Login with Solid"))), showLoginModal && /*#__PURE__*/React.createElement(LoginIssuerModal, {
    onClose: () => setShowLoginModal(false),
    onLogin: issuer => {
      setShowLoginModal(false);
      localStorage.setItem("solid-oidc-issuer", issuer);
      loginWithIssuer(issuer);
    }
  }));
};

var revision = "2026-10-11";
var privacyStatus = "publication";
var sources = [
	{
		label: "University legal notice",
		url: "https://www.uni-wuppertal.de/de/impressum/"
	},
	{
		label: "TMDT contact",
		url: "https://tmdt.uni-wuppertal.de/de/lehrstuhl/kontakt/"
	},
	{
		label: "University privacy notice and scope",
		url: "https://www.uni-wuppertal.de/de/datenschutz/"
	},
	{
		label: "Supervisory authority",
		url: "https://www.ldi.nrw.de/kontakt"
	},
	{
		label: "General Data Protection Regulation",
		url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679"
	},
	{
		label: "North Rhine-Westphalia Data Protection Act",
		url: "https://recht.nrw.de/taxonomy/term/32158/"
	},
	{
		label: "North Rhine-Westphalia Higher Education Act",
		url: "https://recht.nrw.de/lrgv/gesetz/04082026-hochschulgesetz-hg/"
	},
	{
		label: "Terminal equipment privacy, section 25 TDDDG",
		url: "https://www.gesetze-im-internet.de/ttdsg/__25.html"
	}
];
var de = {
	brand: "Solid Dataspace (TMDT)",
	imprint: "Impressum",
	privacy: "Datenschutzerklärung",
	home: "Zur Hauptseite",
	language: "Sprache",
	updated: "Stand",
	contents: "Auf dieser Seite",
	draftTitle: "Entwurf",
	draftBody: "Diese Fassung wird redaktionell bearbeitet.",
	summary: "Gemeinsame Angaben für den TMDT Solid Community Server und die Solid-Dataspace-Instanzen.",
	imprintSections: [
		{
			title: "Anbieter und Kontakt",
			paragraphs: [
				"Lehrstuhl für Technologien und Management der Digitalen Transformation (TMDT), Bergische Universität Wuppertal.",
				"Ansprechpartner für dieses Angebot: Florian Hölken. E-Mail: hoelken@uni-wuppertal.de.",
				"Postanschrift TMDT: Rainer-Gruenter-Straße 21, 42119 Wuppertal, Deutschland. Standort: Gebäude FZ, Lise-Meitner-Straße 27, 42119 Wuppertal."
			],
			links: [
				{
					label: "Florian Hölken kontaktieren",
					url: "mailto:hoelken@uni-wuppertal.de"
				},
				{
					label: "Offizielle TMDT-Kontaktseite",
					url: "https://tmdt.uni-wuppertal.de/de/lehrstuhl/kontakt/"
				}
			]
		},
		{
			title: "Trägereinrichtung",
			paragraphs: [
				"Bergische Universität Wuppertal, Gaußstraße 20, 42119 Wuppertal, Deutschland. Telefon: +49 202 439-0.",
				"Die Universität ist eine vom Land getragene rechtsfähige Körperschaft des öffentlichen Rechts. Gesetzliche Vertreterin ist die Rektorin Prof. Dr. Birgitta Wolff."
			],
			links: [
				{
					label: "Bergische Universität Wuppertal",
					url: "https://www.uni-wuppertal.de/"
				}
			]
		},
		{
			title: "Aufsicht und steuerliche Angaben",
			paragraphs: [
				"Zuständige Aufsichtsbehörde der Universität: Ministerium für Kultur und Wissenschaft des Landes Nordrhein-Westfalen, Völklinger Straße 49, 40221 Düsseldorf.",
				"Umsatzsteuer-Identifikationsnummer: DE 811300283."
			],
			links: [
				{
					label: "Offizielles Impressum der Universität",
					url: "https://www.uni-wuppertal.de/de/impressum/"
				}
			]
		},
		{
			title: "Geltungsbereich",
			paragraphs: [
				"Diese Angaben gelten gemeinsam für den von TMDT an der Bergischen Universität Wuppertal betriebenen Solid Community Server und alle von TMDT betriebenen Solid-Dataspace-Instanzen. Je nach Instanz stehen unterschiedliche Anwendungen zur Verfügung. Die beschriebenen Funktionen betreffen Sie, soweit Sie diese nutzen. Externe Pod-Anbieter und eigenständig verantwortete Angebote anderer Einrichtungen haben eigene Datenschutzhinweise."
			]
		},
		{
			title: "Über dieses Angebot: Forschungsprototyp",
			paragraphs: [
				"Dieses Angebot ist ein Forschungsprototyp zur Erprobung und Demonstration der technischen Machbarkeit von Solid-basierten Datenräumen. Es ist nicht für den produktiven Einsatz vorgesehen. Nach Ende der jeweiligen Projektförderung kann das Angebot weiterlaufen, ohne dass eine regelmäßige Weiterentwicklung oder Wartung zugesagt wird. Ein dauerhaft verfügbarer Betrieb wird nicht zugesagt. Der Prototypstatus lässt gesetzliche Datenschutz- und Sicherheitsanforderungen unberührt.",
				"Für die Verarbeitung personenbezogener Daten beachten Sie bitte die gesonderte Datenschutzerklärung. Die Nutzung des Angebots ist keine pauschale Einwilligung in wissenschaftliche Auswertungen oder Datenveröffentlichungen."
			]
		}
	],
	privacySections: [
		{
			title: "1. Geltungsbereich",
			paragraphs: [
				"Diese Angaben gelten gemeinsam für den von TMDT an der Bergischen Universität Wuppertal betriebenen Solid Community Server und alle von TMDT betriebenen Solid-Dataspace-Instanzen. Je nach Instanz stehen unterschiedliche Anwendungen zur Verfügung. Die beschriebenen Funktionen betreffen Sie, soweit Sie diese nutzen. Externe Pod-Anbieter und eigenständig verantwortete Angebote anderer Einrichtungen haben eigene Datenschutzhinweise.",
				"Die Hinweise umfassen sowohl die direkte Registrierung beim TMDT Solid Community Server als auch die Registrierung über den Solid Dataspace Manager. Der Manager verwendet dafür die Account- und Pod-Schnittstellen des ausgewählten Anbieters."
			]
		},
		{
			title: "2. Verantwortliche Stelle und Kontakt",
			paragraphs: [
				"Bergische Universität Wuppertal, Körperschaft des öffentlichen Rechts, vertreten durch die Rektorin, Gaußstraße 20, 42119 Wuppertal, Deutschland. Betrieb des Angebots: TMDT.",
				"Kontakt für Fragen zu diesem Angebot und zur Datenverarbeitung: Florian Hölken, hoelken@uni-wuppertal.de."
			],
			links: [
				{
					label: "Kontakt zum Angebot",
					url: "mailto:hoelken@uni-wuppertal.de"
				}
			]
		},
		{
			title: "3. Datenschutzbeauftragter",
			paragraphs: [
				"Behördlicher Datenschutzbeauftragter der Bergischen Universität Wuppertal, Geschäftsstelle Datenschutz, Gaußstraße 20, 42119 Wuppertal. Telefon: +49 202 439-5226. E-Mail: dsb@uni-wuppertal.de.",
				"Für die Datenschutz-Beratung nennt die Universität außerdem datenschutz@uni-wuppertal.de."
			],
			links: [
				{
					label: "Datenschutzbeauftragten kontaktieren",
					url: "mailto:dsb@uni-wuppertal.de"
				},
				{
					label: "Datenschutz an der Universität",
					url: "https://www.uni-wuppertal.de/de/universitaet/organisation/stabsstellen-beauftragte/dsb/"
				}
			]
		},
		{
			title: "4. Aufruf, Registrierung und Anmeldung",
			paragraphs: [
				"Wir verarbeiten technisch erforderliche Verbindungsdaten, um die Dienste bereitzustellen, Anmeldungen und Zugriffe zu ermöglichen sowie Fehler und Sicherheitsvorfälle zu erkennen und zu bearbeiten. Dazu gehören insbesondere IP-Adresse, angeforderte Adresse, Browserangaben und Zeitpunkt. Zugriffs-, Betriebs- und Fehlerprotokolle können Client- oder Proxy-IP-Adressen, angefragte URLs, Antwortstatus und Fehlermeldungen enthalten. Bei Fehlern der Datensynchronisierung kann außerdem die betroffene WebID protokolliert werden.",
				"Reguläre Serverprotokolle werden spätestens 14 Tage nach ihrer Erfassung gelöscht. Bei konkreten Sicherheitsvorfällen können die hierfür erforderlichen Auszüge gesondert gesichert werden. Ihr Zugriff wird beschränkt; sie werden nur für die Aufklärung und Bearbeitung des Vorfalls oder erforderliche Rechtsverfahren verwendet und gelöscht, sobald dieser Zweck entfällt und keine gesetzliche Aufbewahrungspflicht besteht.",
				"Bei der Registrierung verarbeitet der ausgewählte Pod-Anbieter insbesondere E-Mail-Adresse, Passwort beziehungsweise Authentifizierungsdaten und den gewünschten Pod-Namen. Dabei werden ein Account, ein Pod und eine WebID eingerichtet. Bei einer Registrierung über den Manager übermittelt dieser die Formulardaten an die Schnittstellen des ausgewählten Anbieters.",
				"Zur Anmeldung und zur Ausführung Ihrer Aktionen verarbeiten wir Sitzungs- und Berechtigungsinformationen. TMDT betreibt den eigenen Solid Community Server auf einem Server in Deutschland. Wenn Sie einen externen Pod-Anbieter auswählen, gelten für dessen Betrieb zusätzlich seine Datenschutzhinweise.",
				"Es besteht keine gesetzliche Pflicht, einen Account anzulegen oder an dem Angebot teilzunehmen. Die bei der Registrierung als erforderlich bezeichneten Daten benötigen wir zur Einrichtung und Verwaltung des Accounts. Ohne diese Angaben können wir keinen eigenen Account oder Pod bereitstellen. Optionale Angaben und Funktionen sind entsprechend gekennzeichnet.",
				"Der selbst betriebene Dienst versendet keine automatischen System-E-Mails, beispielsweise zur Registrierung oder zum Zurücksetzen eines Passworts. Externe Pod-Anbieter können eigene E-Mail-Funktionen anbieten. Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Absenderadresse und den Inhalt zur Bearbeitung Ihrer Anfrage."
			]
		},
		{
			title: "5. Profile, Katalog und Anwendungen",
			paragraphs: [
				"Je nach Nutzung verarbeiten wir Profilangaben wie Name, Kontakt-E-Mail, Bild und Sprache, Pod-Dateien, Katalogbeschreibungen, Freigaben und Zugriffsentscheidungen. Die Daten stammen aus Ihren Eingaben, den von Ihnen ausgewählten Pods und Datenverbindungen sowie aus freigegebenen oder öffentlich zugänglichen Profilen und Katalogen. Eingerichtete Synchronisierungen können Daten verbundener Quellen in Ihren Pod übertragen.",
				"Sie bestimmen, welche eigenen Inhalte Sie speichern, verbinden oder freigeben. Personenbezogene Katalogmetadaten veröffentlichen wir im Rahmen Ihrer gesonderten Freigabe. Öffentliche Beschreibungen können durch Registries, Suchindizes und öffentliche Caches verarbeitet werden. Die Zugriffsrechte an den Quelldaten gelten nicht automatisch auch für deren Katalogbeschreibung. Vor einer Veröffentlichung informieren wir Sie über die betroffenen Angaben und deren Sichtbarkeit.",
				"City Tours verarbeitet geplante und abgeschlossene Routen, genaue Koordinaten, Zeitangaben, Aktivitätsarten sowie daraus berechnete Aktivitäts- und gesundheitsbezogene Werte. Die Werte sind Schätzungen und keine medizinischen Messungen oder Diagnosen. Routen können Rückschlüsse auf Personen, Aufenthaltsorte und Gewohnheiten ermöglichen. Andere Gesundheitsanwendungen können von Ihnen eingegebene oder ausdrücklich verbundene Gesundheitsangaben verarbeiten.",
				"Soweit Funktionen Gesundheitsdaten verarbeiten, holen wir zuvor Ihre ausdrückliche Einwilligung für die bezeichneten Zwecke ein. Die Verarbeitung, eine Datenspende und eine öffentliche Darstellung werden dabei nach ihrem jeweiligen Umfang erläutert. Ohne die betreffende Einwilligung verwenden wir diese Daten nicht für die optionale Funktion; die übrige Nutzung bleibt möglich.",
				"Die Berechnung von Aktivitätswerten dient der Darstellung im Prototyp. Wir treffen keine ausschließlich automatisierten Entscheidungen einschließlich Profiling, die Ihnen gegenüber rechtliche Wirkung entfalten oder Sie in vergleichbarer Weise erheblich beeinträchtigen."
			]
		},
		{
			title: "6. Freigaben, Datenspenden und Nutzungsstatistik",
			paragraphs: [
				"Solid-Zugriffsberechtigungen bestimmen, welche Anwendungen und Dienstkonten auf Ressourcen zugreifen dürfen. Innerhalb des eigenen Betriebs erhalten befugte Beschäftigte und Administratoren Zugriff, soweit dies für Betrieb, Unterstützung, Sicherheit oder die Bearbeitung Ihrer Anliegen erforderlich ist. Eine Speicherung im eigenen Pod schließt administrative Zugriffsmöglichkeiten nicht aus.",
				"Datenspenden und Veröffentlichungen sind freiwillig und erfordern eine gesonderte Einwilligung. Bei einer fortlaufenden City-Tours-Spende können bis zu Ihrem Widerruf auch künftige abgeschlossene Touren einbezogen werden. Öffentliche Katalogmetadaten können dabei Ihren Anbieternamen, Ihre WebID und Ihre Kontakt-E-Mail enthalten. Nach Ihrer entsprechenden Zugriffsfreigabe kann Environmental Monitoring Routen und abgeleitete Aktivitätswerte öffentlich darstellen, auch wenn nur eine Person beigetragen hat. Das Entfernen direkter Kennungen macht eine genaue Route nicht automatisch anonym.",
				"Sie können eine Einwilligung jederzeit für die Zukunft über die angebotenen Freigabefunktionen oder per E-Mail an hoelken@uni-wuppertal.de widerrufen. Wir beenden die betroffene weitere Verarbeitung und bereinigen die zugehörigen personenbezogenen Daten nach dem unten beschriebenen Löschverfahren. Die Rechtmäßigkeit der Verarbeitung vor dem Widerruf bleibt unberührt. Unabhängig angefertigte Kopien Dritter lassen sich nicht vollständig zurückholen.",
				"Die Nutzungsstatistik ist freiwillig und unabhängig von der Registrierung. Nur mit Ihrer Einwilligung erfassen wir den Zeitpunkt Ihrer letzten Aktivität und den aktiven Kalendermonat im Pod; ein Statistik-Dienstkonto erhält hierfür Lesezugriff. Die Statistik dient der Beurteilung der Nutzung des Demonstrationsangebots. Eine Ablehnung oder ein Widerruf hat keine Nachteile für die übrige Nutzung.",
				"Personenbezogene Statistik-Rohereignisse werden spätestens nach 90 Tagen, personenbezogene monatliche Statistikauswertungen spätestens nach 24 Monaten gelöscht. Bei Widerruf oder Wegfall des Zwecks erfolgt die Löschung früher, soweit keine andere Rechtsgrundlage die weitere Speicherung erfordert. Tatsächlich anonymisierte Ergebnisse können erhalten bleiben.",
				"Das Angebot dient Demonstrationen und ersten Machbarkeitsanalysen. Es findet derzeit keine darüber hinausgehende wissenschaftliche Auswertung oder Weitergabe personenbezogener Daten an die Stadt oder andere Projektpartner statt. Von Ihnen veranlasste Freigaben und die öffentliche Darstellung von Datenspenden erfolgen im jeweils erläuterten Umfang. Über eine zusätzliche Forschungsauswertung informieren wir vorab gesondert und schaffen zuvor die dafür erforderliche Rechtsgrundlage."
			]
		},
		{
			title: "7. Speicherung im Browser",
			paragraphs: [
				"Für Anmeldung, Sitzung und die von Ihnen angeforderten Funktionen verwenden wir je nach Anwendung Cookies, Session Storage und Local Storage. Dabei können insbesondere Sitzungsinformationen, Account-Tokens, Sprache und Einstellungen gespeichert werden. Die Solid-Anmeldung kann weitere Sitzungsmechanismen des ausgewählten Pod-Anbieters verwenden.",
				"Soweit eine Speicherung oder ein Zugriff unbedingt erforderlich ist, um eine von Ihnen ausdrücklich gewünschte Funktion bereitzustellen, erfolgt dies auf Grundlage von § 25 Absatz 2 Nummer 2 TDDDG. Für darüber hinausgehende optionale Speicherungen holen wir zuvor eine Einwilligung nach § 25 Absatz 1 TDDDG ein. Die Verarbeitung personenbezogener Daten richtet sich zusätzlich nach den in Abschnitt 10 genannten Rechtsgrundlagen.",
				"Das Merken einer Anmeldung oder von Darstellungseinstellungen ist optional. Bei einer von Ihnen aktivierten Google-Verbindung in der Health App können Zugangstokens und ausgewählte Aktivitätsmetriken für diese Verbindung und Darstellung lokal verarbeitet werden. Ohne Ihre entsprechende Auswahl beziehungsweise erforderliche Einwilligung werden optionale Speicherungen nicht aktiviert.",
				"Sitzungsbezogene Daten werden nur für die jeweilige Sitzung benötigt. Dauerhaft gespeicherte Einstellungen und Verbindungsinformationen bleiben bis zur Deaktivierung der betreffenden Funktion, dem Wegfall ihres Zwecks oder Ihrer Löschung über die Anwendung beziehungsweise die Browsereinstellungen erhalten. Externe Pod-Anbieter bestimmen die Laufzeiten ihrer eigenen Sitzungsmechanismen.",
				"Sie können lokale Daten über die Einstellungen Ihres Browsers löschen. Dadurch können Anmeldungen und Einstellungen verloren gehen; serverseitige Accounts, Pods und weitere Kopien werden dadurch nicht automatisch gelöscht. Einwilligungen können Sie über die angebotenen Einstellungen oder den oben genannten Kontakt widerrufen."
			]
		},
		{
			title: "8. Externe Dienste, Empfänger und internationale Übermittlungen",
			paragraphs: [
				"Optionale externe Inhalte und Dienste binden wir nach Ihrer vorherigen Einwilligung ein. Ihre Auswahl ist freiwillig und widerruflich. Bei Ablehnung bleiben die davon unabhängigen Funktionen nutzbar. Bei direkten Browseranfragen erhalten die angesprochenen Anbieter insbesondere Ihre IP-Adresse, Browser- und Anfragedaten sowie gegebenenfalls die verweisende Seite. Erforderliche Informationen zu Anbieter, Zweck und einer Übermittlung außerhalb des Europäischen Wirtschaftsraums erhalten Sie vor der Aktivierung.",
				"Für Schriften, Symbole, Darstellungen und Skripte können je nach Anwendung Google Fonts (fonts.googleapis.com und fonts.gstatic.com), cdnjs (cdnjs.cloudflare.com), BootstrapCDN (stackpath.bootstrapcdn.com), jQuery CDN (code.jquery.com) und jsDelivr (cdn.jsdelivr.net) eingebunden werden. Für deren externe Abrufe gilt die vorstehende Einwilligungsregel.",
				"Die Karten in City Tours und Environmental Monitoring verwenden Kartenkacheln von OpenStreetMap (tile.openstreetmap.org einschließlich Subdomains). Kachelanfragen enthalten den angezeigten Kartenausschnitt und die Zoomstufe. Diese Integration übermittelt nicht die vollständige Tour als Routendatei. Sie aktivieren die externe Karte nach entsprechender Information und Einwilligung.",
				"Wetter- und Luftqualitätsdaten für Wuppertal stammen von Open-Meteo (api.open-meteo.com und air-quality-api.open-meteo.com). Die Anwendung fragt zuerst unseren öffentlichen Datencache ab. Ist dieser nicht verfügbar, erfolgt ein direkter Browserabruf nur mit Ihrer entsprechenden Einwilligung. Dabei werden feste Koordinaten für Wuppertal verwendet, nicht Ihr persönlicher Gerätestandort. Bei einem direkten Abruf erhält Open-Meteo die technischen Verbindungsdaten Ihres Browsers.",
				"Wenn Sie die Google-Verbindung in der Health App aktivieren, wird nach Ihrer Einwilligung das Anmeldeskript von accounts.google.com geladen. Nach gesonderter Autorisierung sind Datenabrufe über www.googleapis.com und ein Widerruf von Tokens über oauth2.googleapis.com möglich. Je nach Berechtigung betreffen die Abrufe Schritte, Kalorien, Schlaf, Gewicht oder Herzfrequenz. Der Umfang wird vor der Verbindung erläutert. Die Verfügbarkeit einzelner Funktionen hängt vom externen Anbieter ab.",
				"Die Ansicht für Datenverbindungen kann nach Ihrer Einwilligung das Home-Assistant-Logo von brands.home-assistant.io laden. Eine von Ihnen eingerichtete Home-Assistant- oder andere API-Verbindung kommuniziert mit der von Ihnen ausgewählten Adresse. Weitere Empfänger ergeben sich aus dem gewählten Pod-Anbieter, verlinkten Katalogen und Modellen, externen Profilbildern sowie Ihren ausdrücklich eingerichteten Freigaben. Reine RDF-Vokabularbezeichnungen lösen für sich genommen keinen Abruf des jeweiligen Webservers aus.",
				"Unser eigener Server steht in Deutschland. Externe Anbieter können Daten auch außerhalb des Europäischen Wirtschaftsraums verarbeiten, insbesondere in den USA. Wir aktivieren solche Übermittlungen nur, wenn die Voraussetzungen der Artikel 44 ff. DSGVO erfüllt sind. Bei einem einschlägigen Angemessenheitsbeschluss stützen wir die Übermittlung auf Artikel 45 DSGVO; bei US-Empfängern gilt dies nur, soweit eine wirksame Zertifizierung und deren Umfang die Übermittlung abdecken. Andernfalls setzen wir geeignete Garantien nach Artikel 46 DSGVO voraus, insbesondere anwendbare Standardvertragsklauseln und erforderliche ergänzende Schutzmaßnahmen. Liegen diese Voraussetzungen nicht vor, wird die betreffende Übermittlung nicht aktiviert.",
				"Informationen über die für den jeweiligen Dienst geltende Übermittlungsgrundlage und eine Kopie der einschlägigen Garantien erhalten Sie über hoelken@uni-wuppertal.de. Die verlinkten Anbieterhinweise beschreiben deren eigene Verarbeitung. Eine Einwilligung in eine optionale Funktion ersetzt nicht die erforderliche Absicherung einer internationalen Übermittlung."
			],
			links: [
				{
					label: "Datenschutzhinweise von Google",
					url: "https://policies.google.com/privacy"
				},
				{
					label: "Datenschutzhinweise der OpenStreetMap Foundation",
					url: "https://osmfoundation.org/wiki/Privacy_Policy"
				},
				{
					label: "Bedingungen und Datenschutz bei Open-Meteo",
					url: "https://open-meteo.com/en/terms"
				},
				{
					label: "Datenschutzhinweise von jsDelivr",
					url: "https://www.jsdelivr.com/terms/privacy-policy"
				},
				{
					label: "Google: Rahmenbedingungen für Datenübermittlungen",
					url: "https://policies.google.com/privacy/frameworks?hl=de"
				}
			]
		},
		{
			title: "9. Speicherdauer und Löschung",
			paragraphs: [
				"Accounts und Pod-Inhalte speichern wir für die Dauer Ihrer Nutzung, bis Sie die betreffenden Daten löschen oder deren Löschung beantragen. Daten, die für ihren Zweck nicht mehr erforderlich sind, löschen wir auch ohne Antrag, sofern keine andere Rechtsgrundlage ihre Aufbewahrung erfordert. Das Ende einer Projektförderung allein beendet den fortgeführten Dienst nicht und löst daher keine pauschale Löschung aller Pods aus.",
				"Für den selbst betriebenen Dienst werden keine Backups angelegt. Angaben hierzu beziehen sich auf den eigenen Betrieb; sie beschreiben nicht die Sicherungspraxis externer Pod-Anbieter oder anderer Empfänger.",
				"Löschanfragen richten Sie an Florian Hölken unter hoelken@uni-wuppertal.de. Wir bearbeiten Anfragen zur Löschung Ihres Accounts, Ihres Pods und der zugehörigen personenbezogenen Daten einschließlich weiterer Kopien und abgeleiteter Daten in unserem Verantwortungsbereich.",
				"Nach Prüfung der betroffenen Daten und, bei begründeten Zweifeln, der Identität unterbinden wir Synchronisierungen, laufende Freigaben oder erneute Indexierungen, soweit diese die zu löschenden Daten wieder anlegen würden. Anschließend löschen wir die zugehörigen personenbezogenen Daten in unserem Verantwortungsbereich ohne unangemessene Verzögerung, soweit die gesetzlichen Voraussetzungen vorliegen.",
				"Die Löschung umfasst neben Account und Pod auch personenbezogene Katalog- und Registryeinträge, Suchindizes, Caches, gespeicherte Tourspenden und daraus abgeleitete personenbezogene Auswertungen. Betroffene Auswertungen bereinigen wir oder berechnen sie neu. Echte, nicht mehr auf eine Person zurückführbare anonyme Statistiken können erhalten bleiben; bloß pseudonymisierte Daten gelten nicht als anonym.",
				"Soweit gesetzlich erforderlich, informieren wir Empfänger über die Löschung und veranlassen bei veröffentlichten personenbezogenen Daten angemessene Schritte hinsichtlich weiterer Verlinkungen oder Kopien. Eine vollständige Entfernung unabhängig erstellter Kopien im Internet kann nicht garantiert werden. Gesetzlich erforderliche Ausnahmen von der Löschung behandeln wir begrenzt und erläutern sie der betroffenen Person.",
				"Über die Bearbeitung einer Anfrage und die ergriffenen Maßnahmen informieren wir grundsätzlich spätestens innerhalb eines Monats nach Eingang. Ist wegen Komplexität oder Anzahl der Anfragen eine zulässige Verlängerung erforderlich, teilen wir dies innerhalb dieses Monats mit Gründen mit; die Frist kann dann um bis zu zwei weitere Monate verlängert werden. Diese Informationsfrist ist keine pauschale Wartefrist für die Löschung.",
				"Kontaktanfragen löschen wir nach abschließender Bearbeitung, soweit keine gesetzlichen Pflichten oder erforderlichen Nachweise eine weitere Aufbewahrung verlangen. Für reguläre Serverprotokolle gilt die Frist von 14 Tagen aus Abschnitt 4; für freiwillige Nutzungsstatistik gelten die Fristen aus Abschnitt 6. Erforderliche Nachweise über Einwilligungen, Widerrufe und die Bearbeitung von Anfragen bewahren wir nur so lange auf, wie dies zur Erfüllung der jeweiligen Nachweispflichten erforderlich ist, mit beschränktem Zugriff und ohne Nutzung für andere Zwecke."
			],
			links: [
				{
					label: "Rechtsgrundlage für Auskunft und Löschung: DSGVO, Artikel 12, 17 und 19",
					url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679"
				}
			]
		},
		{
			title: "10. Zwecke und Rechtsgrundlagen",
			paragraphs: [
				"Die Bereitstellung und Absicherung des Forschungs- und Demonstrationsangebots, die dafür erforderliche Account- und Pod-Verwaltung sowie die Bearbeitung betriebsbezogener Anfragen erfolgen auf Grundlage von Artikel 6 Absatz 1 Buchstabe e DSGVO in Verbindung mit § 3 Absatz 1 DSG NRW und § 3 Absatz 1 Hochschulgesetz NRW. Sie dienen der Erprobung und Vermittlung von Technologien für selbstbestimmte Datenräume im Rahmen der Aufgaben der Universität in Forschung und Wissenstransfer. Wir beschränken die hierfür verarbeiteten Daten auf das für diese Zwecke Erforderliche.",
				"Freiwillige Nutzungsstatistik, personenbezogene Veröffentlichungen, Datenspenden sowie optionale externe Inhalte und Verbindungen verarbeiten wir auf Grundlage Ihrer jeweiligen Einwilligung nach Artikel 6 Absatz 1 Buchstabe a DSGVO. Wenn hierbei Gesundheitsdaten verarbeitet werden, holen wir zusätzlich eine ausdrückliche Einwilligung nach Artikel 9 Absatz 2 Buchstabe a DSGVO ein.",
				"Soweit wir gesetzliche Pflichten erfüllen, insbesondere Anfragen zu Betroffenenrechten bearbeiten und erforderliche Nachweise zur Erfüllung unserer Datenschutzpflichten führen, erfolgt die dafür notwendige Verarbeitung auf Grundlage von Artikel 6 Absatz 1 Buchstabe c DSGVO in Verbindung mit den jeweiligen Pflichten, insbesondere Artikeln 5 Absatz 2, 7 Absatz 1 und 12 bis 22 DSGVO. Aufbewahrung und Zugriff auf solche Nachweise werden auf den erforderlichen Umfang begrenzt.",
				"Diese Datenschutzerklärung informiert über die Verarbeitung. Ihre Kenntnisnahme ist keine Einwilligung. Einwilligungen werden für die jeweilige Funktion gesondert eingeholt, sind freiwillig und können ohne Auswirkungen auf die Rechtmäßigkeit der bisherigen Verarbeitung widerrufen werden. Ein Widerruf ist auch per E-Mail an hoelken@uni-wuppertal.de möglich."
			],
			links: [
				{
					label: "Datenschutz-Grundverordnung (DSGVO)",
					url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679"
				},
				{
					label: "Datenschutzgesetz Nordrhein-Westfalen",
					url: "https://recht.nrw.de/taxonomy/term/32158/"
				},
				{
					label: "Hochschulgesetz Nordrhein-Westfalen",
					url: "https://recht.nrw.de/lrgv/gesetz/04082026-hochschulgesetz-hg/"
				},
				{
					label: "§ 25 TDDDG",
					url: "https://www.gesetze-im-internet.de/ttdsg/__25.html"
				}
			]
		},
		{
			title: "11. Ihre Rechte",
			paragraphs: [
				"Sie haben nach Maßgabe der gesetzlichen Voraussetzungen Rechte auf Auskunft über Ihre personenbezogenen Daten, Berichtigung, Löschung und Einschränkung der Verarbeitung. Für automatisiert verarbeitete Daten, die Sie bereitgestellt haben und deren Verarbeitung auf Einwilligung oder Vertrag beruht, besteht außerdem das Recht auf Datenübertragbarkeit.",
				"Soweit wir Daten auf Grundlage von Artikel 6 Absatz 1 Buchstabe e DSGVO verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch einlegen. Wir verarbeiten die Daten dann nicht weiter, sofern nicht die gesetzlichen Voraussetzungen für eine Fortsetzung vorliegen. Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.",
				"Zur Ausübung Ihrer Rechte wenden Sie sich an Florian Hölken unter hoelken@uni-wuppertal.de. Für die Bearbeitung gelten die in Abschnitt 9 beschriebenen Fristen. Sie können sich außerdem an den behördlichen Datenschutzbeauftragten wenden.",
				"Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Zuständig für die Universität ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Postfach 20 04 44, 40102 Düsseldorf. E-Mail: poststelle@ldi.nrw.de."
			],
			links: [
				{
					label: "Kontakt und Beschwerde bei der LDI NRW",
					url: "https://www.ldi.nrw.de/kontakt"
				}
			]
		},
		{
			title: "12. Forschungsprototyp und Stand",
			paragraphs: [
				"Dieses Angebot ist ein Forschungsprototyp zur Erprobung und Demonstration der technischen Machbarkeit von Solid-basierten Datenräumen. Es ist nicht für den produktiven Einsatz vorgesehen. Nach Ende der jeweiligen Projektförderung kann das Angebot weiterlaufen, ohne dass eine regelmäßige Weiterentwicklung oder Wartung zugesagt wird. Ein dauerhaft verfügbarer Betrieb wird nicht zugesagt. Der Prototypstatus lässt gesetzliche Datenschutz- und Sicherheitsanforderungen unberührt.",
				"Wir aktualisieren diese Datenschutzerklärung bei Änderungen des Angebots oder der Verarbeitung. Maßgeblich ist der oben angegebene Stand. Über zusätzliche Zwecke oder wesentliche Änderungen informieren wir Sie vor Beginn der betreffenden Verarbeitung und holen, soweit erforderlich, eine neue Einwilligung ein."
			]
		}
	]
};
var en = {
	brand: "Solid Dataspace (TMDT)",
	imprint: "Legal notice",
	privacy: "Privacy notice",
	home: "Back to the main page",
	language: "Language",
	updated: "Last updated",
	contents: "On this page",
	draftTitle: "Draft",
	draftBody: "This version is undergoing editorial review.",
	summary: "Shared information for the TMDT Solid Community Server and Solid Dataspace instances.",
	imprintSections: [
		{
			title: "Service provider and contact",
			paragraphs: [
				"Institute for Technologies and Management of Digital Transformation (TMDT), University of Wuppertal.",
				"Contact for this service: Florian Hölken. Email: hoelken@uni-wuppertal.de.",
				"TMDT postal address: Rainer-Gruenter-Straße 21, 42119 Wuppertal, Germany. Visiting address: Building FZ, Lise-Meitner-Straße 27, 42119 Wuppertal."
			],
			links: [
				{
					label: "Contact Florian Hölken",
					url: "mailto:hoelken@uni-wuppertal.de"
				},
				{
					label: "Official TMDT contact page",
					url: "https://www.tmdt.uni-wuppertal.de/en/chair/contact/"
				}
			]
		},
		{
			title: "Parent institution",
			paragraphs: [
				"Bergische Universität Wuppertal (University of Wuppertal), Gaußstraße 20, 42119 Wuppertal, Germany. Telephone: +49 202 439-0.",
				"The University is a state-supported legal entity under public law. Its legal representative is the Rector, Prof. Dr. Birgitta Wolff."
			],
			links: [
				{
					label: "University of Wuppertal",
					url: "https://www.uni-wuppertal.de/en/"
				}
			]
		},
		{
			title: "Supervisory authority and tax information",
			paragraphs: [
				"The University’s supervisory authority is the Ministry of Culture and Science of the State of North Rhine-Westphalia, Völklinger Straße 49, 40221 Düsseldorf, Germany.",
				"VAT identification number: DE 811300283."
			],
			links: [
				{
					label: "Official University legal notice",
					url: "https://www.uni-wuppertal.de/de/impressum/"
				}
			]
		},
		{
			title: "Scope",
			paragraphs: [
				"This information applies jointly to the Solid Community Server operated by TMDT at the University of Wuppertal and all Solid Dataspace instances operated by TMDT. Available applications vary by instance. The functions described apply where you use them. External Pod providers and services independently operated by other organisations have their own privacy notices."
			]
		},
		{
			title: "About this service: research prototype",
			paragraphs: [
				"This service is a research prototype for exploring and demonstrating the technical feasibility of Solid-based data spaces. It is not intended for production use. The service may continue after the relevant project funding ends, without a commitment to regular development or maintenance. Continued availability is not guaranteed. Its prototype status does not remove statutory data protection and security obligations.",
				"Please refer to the separate privacy notice for information on processing personal data. Using the service does not constitute blanket consent to scientific analysis or publication of your data."
			]
		}
	],
	privacySections: [
		{
			title: "1. Scope",
			paragraphs: [
				"This information applies jointly to the Solid Community Server operated by TMDT at the University of Wuppertal and all Solid Dataspace instances operated by TMDT. Available applications vary by instance. The functions described apply where you use them. External Pod providers and services independently operated by other organisations have their own privacy notices.",
				"This notice covers both direct registration with the TMDT Solid Community Server and registration through the Solid Dataspace Manager. The Manager uses the selected provider’s account and Pod APIs."
			]
		},
		{
			title: "2. Controller and contact",
			paragraphs: [
				"Bergische Universität Wuppertal (University of Wuppertal), a legal entity under public law represented by its Rector, Gaußstraße 20, 42119 Wuppertal, Germany. The service is operated by TMDT.",
				"Contact for this service and its processing of data: Florian Hölken, hoelken@uni-wuppertal.de."
			],
			links: [
				{
					label: "Contact the service",
					url: "mailto:hoelken@uni-wuppertal.de"
				}
			]
		},
		{
			title: "3. Data protection officer",
			paragraphs: [
				"University of Wuppertal Data Protection Officer, Geschäftsstelle Datenschutz, Gaußstraße 20, 42119 Wuppertal, Germany. Telephone: +49 202 439-5226. Email: dsb@uni-wuppertal.de.",
				"The University also lists datenschutz@uni-wuppertal.de for data protection advice."
			],
			links: [
				{
					label: "Contact the data protection officer",
					url: "mailto:dsb@uni-wuppertal.de"
				},
				{
					label: "University data protection contacts",
					url: "https://www.uni-wuppertal.de/de/universitaet/organisation/stabsstellen-beauftragte/dsb/"
				}
			]
		},
		{
			title: "4. Access, registration and sign-in",
			paragraphs: [
				"We process technically necessary connection data to provide the services, enable sign-in and access, and identify and address errors and security incidents. This includes IP addresses, requested addresses, browser information and timestamps. Access, operational and error logs may contain client or proxy IP addresses, requested URLs, response statuses and error messages. Synchronisation errors may also include the affected WebID.",
				"Regular server logs are deleted no later than 14 days after collection. Where a specific security incident occurs, necessary extracts may be retained separately. Access is restricted; these extracts are used only to investigate and address the incident or for necessary legal proceedings, and are deleted once that purpose ends and no statutory retention obligation applies.",
				"During registration, the selected Pod provider processes in particular your email address, password or authentication details and requested Pod name. An account, a Pod and a WebID are created. When you register through the Manager, it sends the form data to the selected provider’s interfaces.",
				"We process session and permission information for sign-in and to carry out your actions. TMDT operates its own Solid Community Server on a server in Germany. If you select an external Pod provider, its own privacy notice also applies to its operations.",
				"There is no statutory obligation to create an account or participate in this service. We need the information marked as required during registration to create and manage your account. Without it, we cannot provide an account or Pod on our own server. Optional information and functions are identified as such.",
				"The self-hosted service does not send automated system emails, for example for registration or password resets. External Pod providers may offer their own email functions. If you contact us by email, we process your sender address and message to handle your enquiry."
			]
		},
		{
			title: "5. Profiles, catalogues and applications",
			paragraphs: [
				"Depending on your use, we process profile information such as name, contact email, photo and language, Pod files, catalogue descriptions, permissions and access decisions. The data comes from your entries, the Pods and connections you select, and shared or publicly accessible profiles and catalogues. Configured synchronisation may transfer data from connected sources into your Pod.",
				"You decide which of your own contents to store, connect or share. We publish personal catalogue metadata within the scope of your separate permission. Public descriptions may be processed by registries, search indexes and public caches. Access permissions for source data do not automatically apply to its catalogue description. Before publication, we inform you about the information concerned and its visibility.",
				"City Tours processes planned and completed routes, precise coordinates, dates and times, activity types, and calculated activity and health-related values. These values are estimates, not medical measurements or diagnoses. Routes may reveal information about individuals, locations and habits. Other health applications may process health information you enter or explicitly connect.",
				"Where functions process health data, we obtain your explicit consent for the specified purposes beforehand. Processing, donation and public display are explained according to their respective scope. Without the relevant consent, we do not use the data for that optional function; other use remains possible.",
				"Activity values are calculated for display in the prototype. We do not make decisions based solely on automated processing, including profiling, that produce legal effects concerning you or similarly significantly affect you."
			]
		},
		{
			title: "6. Sharing, donations and usage statistics",
			paragraphs: [
				"Solid permissions determine which applications and service accounts may access resources. Within our own operations, authorised staff and administrators receive access where necessary for operation, support, security or handling your requests. Storage in your own Pod does not exclude administrative access capabilities.",
				"Donations and publications are voluntary and require separate consent. A continuous City Tours donation may include future completed tours until you withdraw consent. Public catalogue metadata may include your publisher name, WebID and contact email. Following your corresponding access permission, Environmental Monitoring may display routes and derived activity values publicly, even where only one person has contributed. Removing direct identifiers does not automatically make a precise route anonymous.",
				"You may withdraw consent at any time for the future using the available sharing functions or by emailing hoelken@uni-wuppertal.de. We stop the affected further processing and clean up the related personal data under the deletion procedure below. Withdrawal does not affect the lawfulness of processing before withdrawal. Independently created third-party copies cannot be fully retrieved.",
				"Usage statistics are voluntary and independent of registration. Only with your consent do we record your last activity time and active calendar month in your Pod; a statistics service account receives read access for this purpose. Statistics help assess use of the demonstration service. Refusal or withdrawal does not disadvantage your other use.",
				"Personal raw statistical events are deleted no later than after 90 days, and personal monthly statistical summaries no later than after 24 months. Withdrawal or the end of the purpose triggers earlier deletion unless another legal basis requires continued storage. Truly anonymous results may remain.",
				"The service is used for demonstrations and initial feasibility assessments. No further scientific analysis or disclosure of personal data to the city or other project partners currently takes place. Sharing you initiate and public display of donations take place within the scope explained for those functions. We provide separate information and establish the necessary legal basis before any additional research analysis."
			]
		},
		{
			title: "7. Browser storage",
			paragraphs: [
				"Depending on the application, we use cookies, Session Storage and Local Storage for sign-in, sessions and functions you request. This may include session information, account tokens, language and settings. Solid sign-in may use additional session mechanisms of the selected Pod provider.",
				"Where storage or access is strictly necessary to provide a function you explicitly request, it is based on section 25(2), point 2 of the German Telecommunications Digital Services Data Protection Act (TDDDG). We obtain prior consent under section 25(1) TDDDG for additional optional storage. Processing personal data is also subject to the legal bases in section 10.",
				"Remembering a login or display preferences is optional. Where you activate a Google connection in the Health App, access tokens and selected activity metrics may be processed locally for that connection and display. Optional storage is not activated without your corresponding choice or required consent.",
				"Session-related data is needed only for the respective session. Persistent settings and connection information remain until the relevant function is deactivated, their purpose ends, or you delete them through the application or browser settings. External Pod providers determine the lifetimes of their own session mechanisms.",
				"You can delete local data through your browser settings. This may remove sign-ins and preferences; it does not automatically delete server-side accounts, Pods or other copies. You may withdraw consent through the available settings or the contact above."
			]
		},
		{
			title: "8. External services, recipients and international transfers",
			paragraphs: [
				"We integrate optional external content and services following your prior consent. Your choice is voluntary and may be withdrawn. Functions independent of that content remain available if you decline. Direct browser requests disclose in particular your IP address, browser and request information and, where applicable, the referring page to the contacted provider. Before activation, we provide the necessary information about the provider, purpose and any transfer outside the European Economic Area.",
				"Depending on the application, fonts, icons, styles and scripts may use Google Fonts (fonts.googleapis.com and fonts.gstatic.com), cdnjs (cdnjs.cloudflare.com), BootstrapCDN (stackpath.bootstrapcdn.com), jQuery CDN (code.jquery.com) and jsDelivr (cdn.jsdelivr.net). The prior-consent rule above applies to these external requests.",
				"Maps in City Tours and Environmental Monitoring use tiles from OpenStreetMap (tile.openstreetmap.org including subdomains). Tile requests identify the displayed map area and zoom level. This integration does not send the complete tour as a route file. You activate the external map after receiving the relevant information and giving consent.",
				"Weather and air-quality data for Wuppertal come from Open-Meteo (api.open-meteo.com and air-quality-api.open-meteo.com). The application first requests our public data cache. If the cache is unavailable, a direct browser request is made only with your corresponding consent. Fixed coordinates for Wuppertal are used, not your device’s personal location. Direct requests disclose your browser’s technical connection information to Open-Meteo.",
				"If you activate the Google connection in the Health App, the sign-in script from accounts.google.com is loaded following your consent. Separate authorisation permits data requests through www.googleapis.com and token revocation through oauth2.googleapis.com. Depending on permissions, requests cover steps, calories, sleep, weight or heart rate. The scope is explained before connection. Availability of individual functions depends on the external provider.",
				"Following your consent, the data-connections view may load the Home Assistant logo from brands.home-assistant.io. A Home Assistant or other API connection you configure communicates with the address you select. Further recipients depend on your selected Pod provider, linked catalogues and models, external profile images and explicitly configured permissions. An RDF vocabulary identifier alone does not trigger a request to the relevant web server.",
				"Our own server is located in Germany. External providers may also process data outside the European Economic Area, particularly in the United States. We activate such transfers only where the requirements of Articles 44 et seq. GDPR are met. Where an applicable adequacy decision exists, we rely on Article 45 GDPR; for US recipients, this applies only where a valid certification and its scope cover the transfer. Otherwise, we require appropriate safeguards under Article 46 GDPR, particularly applicable Standard Contractual Clauses and any necessary supplementary safeguards. Where these conditions are not met, the transfer is not activated.",
				"Information about the transfer basis applicable to a particular service and a copy of the relevant safeguards are available through hoelken@uni-wuppertal.de. The linked provider notices explain their own processing. Consent to an optional function does not replace the necessary safeguards for an international transfer."
			],
			links: [
				{
					label: "Google privacy policy",
					url: "https://policies.google.com/privacy"
				},
				{
					label: "OpenStreetMap Foundation privacy policy",
					url: "https://osmfoundation.org/wiki/Privacy_Policy"
				},
				{
					label: "Open-Meteo terms and privacy",
					url: "https://open-meteo.com/en/terms"
				},
				{
					label: "jsDelivr privacy policy",
					url: "https://www.jsdelivr.com/terms/privacy-policy"
				},
				{
					label: "Google: data transfer frameworks",
					url: "https://policies.google.com/privacy/frameworks?hl=en"
				}
			]
		},
		{
			title: "9. Retention and deletion",
			paragraphs: [
				"We store accounts and Pod contents for the duration of your use, until you delete the relevant data or request its deletion. We also delete data without a request once it is no longer necessary for its purpose, unless another legal basis requires retention. The end of project funding alone does not end a continuing service and therefore does not trigger blanket deletion of all Pods.",
				"No backups are made for the self-hosted service. This describes the service’s own operations, not the backup practices of external Pod providers or other recipients.",
				"Send deletion requests to Florian Hölken at hoelken@uni-wuppertal.de. We handle requests to delete your account, your Pod and related personal data, including additional copies and derived data under our control.",
				"After identifying the affected data and, where reasonable doubts exist, verifying identity, we stop synchronisation, ongoing sharing or re-indexing where these would recreate the data to be deleted. We then erase the related personal data under our control without undue delay where the statutory conditions apply.",
				"Erasure covers accounts and Pods as well as personal catalogue and registry entries, search indexes, caches, stored tour donations and derived personal analyses. We clean up or recalculate affected analyses. Truly anonymous statistics that can no longer be linked to a person may remain; merely pseudonymised data are not anonymous.",
				"Where legally required, we notify recipients of erasure and take reasonable steps concerning links or copies of published personal data. Complete removal of independently created copies on the internet cannot be guaranteed. We handle statutory exceptions to erasure narrowly and explain them to the affected person.",
				"We generally provide information on the handling of a request and measures taken within one month of receipt. If complexity or the number of requests justifies a permitted extension, we inform the person within that month, with reasons; the period may then be extended by up to two further months. This response period is not a general waiting period for erasure.",
				"We delete contact enquiries after they have been resolved unless statutory duties or necessary records require further retention. Regular server logs follow the 14-day period in section 4; voluntary usage statistics follow the periods in section 6. Necessary records of consent, withdrawal and the handling of requests are kept only for as long as required to fulfil the relevant accountability duties, with restricted access and no use for other purposes."
			],
			links: [
				{
					label: "Rules on requests and erasure: GDPR, Articles 12, 17 and 19",
					url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679"
				}
			]
		},
		{
			title: "10. Purposes and legal bases",
			paragraphs: [
				"Providing and securing the research and demonstration service, necessary account and Pod administration, and handling operational enquiries are based on Article 6(1)(e) GDPR in conjunction with section 3(1) of the North Rhine-Westphalia Data Protection Act (DSG NRW) and section 3(1) of the North Rhine-Westphalia Higher Education Act (HG NRW). These activities explore and communicate technologies for user-controlled data spaces within the University’s research and knowledge-transfer tasks. We limit processing to the data necessary for these purposes.",
				"Voluntary usage statistics, personal-data publications, donations, and optional external content and connections are processed on the basis of your respective consent under Article 6(1)(a) GDPR. Where health data is processed, we also obtain explicit consent under Article 9(2)(a) GDPR.",
				"Where we fulfil statutory obligations, in particular handling data-subject requests and keeping necessary records of compliance with data protection duties, the necessary processing is based on Article 6(1)(c) GDPR in conjunction with the relevant obligations, in particular Articles 5(2), 7(1) and 12–22 GDPR. Retention of and access to such records are limited to what is necessary.",
				"This privacy notice explains processing; acknowledging it is not consent. Consent is obtained separately for the relevant function, is voluntary and may be withdrawn without affecting the lawfulness of earlier processing. You may also withdraw consent by emailing hoelken@uni-wuppertal.de."
			],
			links: [
				{
					label: "General Data Protection Regulation (GDPR)",
					url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679"
				},
				{
					label: "North Rhine-Westphalia Data Protection Act",
					url: "https://recht.nrw.de/taxonomy/term/32158/"
				},
				{
					label: "North Rhine-Westphalia Higher Education Act",
					url: "https://recht.nrw.de/lrgv/gesetz/04082026-hochschulgesetz-hg/"
				},
				{
					label: "Section 25 TDDDG",
					url: "https://www.gesetze-im-internet.de/ttdsg/__25.html"
				}
			]
		},
		{
			title: "11. Your rights",
			paragraphs: [
				"Subject to the statutory conditions, you have rights of access to your personal data, rectification, erasure and restriction of processing. You also have a right to data portability for data you have provided that is processed by automated means on the basis of consent or a contract.",
				"Where we process data under Article 6(1)(e) GDPR, you may object at any time on grounds relating to your particular situation. We then stop processing unless the statutory conditions for continuing apply. You may withdraw consent at any time for the future.",
				"To exercise your rights, contact Florian Hölken at hoelken@uni-wuppertal.de. The response periods in section 9 apply. You may also contact the University’s data protection officer.",
				"You have the right to lodge a complaint with a supervisory authority. The authority responsible for the University is the State Commissioner for Data Protection and Freedom of Information North Rhine-Westphalia (LDI NRW), Postfach 20 04 44, 40102 Düsseldorf, Germany. Email: poststelle@ldi.nrw.de."
			],
			links: [
				{
					label: "Contact and complaints to LDI NRW",
					url: "https://www.ldi.nrw.de/kontakt"
				}
			]
		},
		{
			title: "12. Research prototype and revision",
			paragraphs: [
				"This service is a research prototype for exploring and demonstrating the technical feasibility of Solid-based data spaces. It is not intended for production use. The service may continue after the relevant project funding ends, without a commitment to regular development or maintenance. Continued availability is not guaranteed. Its prototype status does not remove statutory data protection and security obligations.",
				"We update this privacy notice when the service or processing changes. The revision date is shown above. We inform you about additional purposes or material changes before the relevant processing starts and obtain new consent where required."
			]
		}
	]
};
var content = {
	revision: revision,
	privacyStatus: privacyStatus,
	sources: sources,
	de: de,
	en: en
};

function LegalDialog(_ref) {
  var {
    page,
    locale,
    onClose
  } = _ref;
  var ref = useRef(null);
  var copy = content[locale];
  useEffect(() => {
    var dialog = ref.current;
    if (!dialog) return;
    var trigger = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({
        preventScroll: true
      });
    };
  }, []);
  return /*#__PURE__*/createPortal(/*#__PURE__*/React.createElement("dialog", {
    ref: ref,
    className: "ds-legal-dialog",
    "aria-label": copy[page],
    "aria-modal": "true",
    lang: locale,
    translate: "no",
    "data-i18n-skip": true,
    onCancel: event => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    },
    onClick: event => {
      if (event.target === event.currentTarget) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-legal-dialog__layout"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h2", null, copy[page]), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": locale === "de" ? "Schließen" : "Close",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("article", {
    tabIndex: 0
  }, /*#__PURE__*/React.createElement("p", null, copy.updated, ": ", /*#__PURE__*/React.createElement("time", {
    dateTime: content.revision
  }, content.revision)), /*#__PURE__*/React.createElement("p", null, copy.summary), page === "privacy" && content.privacyStatus === "draft", copy[page === "imprint" ? "imprintSections" : "privacySections"].map((section, index) => /*#__PURE__*/React.createElement("section", {
    key: index
  }, /*#__PURE__*/React.createElement("h3", null, section.title), section.paragraphs.map((paragraph, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, paragraph)), "links" in section && section.links && /*#__PURE__*/React.createElement("ul", null, section.links.map(link => /*#__PURE__*/React.createElement("li", {
    key: link.url
  }, /*#__PURE__*/React.createElement("a", {
    href: /^(https:\/\/|mailto:)/.test(link.url) ? link.url : undefined
  }, link.label))))))))), document.body);
}
function StandaloneFooter(_ref2) {
  var {
    title,
    version,
    language,
    assetsBase,
    children,
    className = ""
  } = _ref2;
  var [page, setPage] = useState(null);
  var locale = language === "de" ? "de" : "en";
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("footer", {
    "data-standalone-footer": true,
    className: className
  }, /*#__PURE__*/React.createElement("nav", {
    className: "ds-footer-legal",
    "aria-label": locale === "de" ? "Rechtliche Informationen" : "Legal information",
    lang: locale,
    translate: "no",
    "data-i18n-skip": true
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-haspopup": "dialog",
    onClick: () => setPage("imprint")
  }, content[locale].imprint), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-haspopup": "dialog",
    onClick: () => setPage("privacy")
  }, content[locale].privacy)), /*#__PURE__*/React.createElement("div", {
    className: "ds-footer-logos",
    "aria-label": locale === "de" ? "Projektpartner" : "Project partners"
  }, /*#__PURE__*/React.createElement("img", {
    src: "".concat(assetsBase, "/assets/images/Logo_BUW.png"),
    alt: "Bergische Universit\xE4t Wuppertal"
  }), /*#__PURE__*/React.createElement("img", {
    src: "".concat(assetsBase, "/assets/images/Logo_TMDT.png"),
    alt: "TMDT"
  })), /*#__PURE__*/React.createElement("div", {
    className: "footer-version"
  }, /*#__PURE__*/React.createElement("span", null, title), /*#__PURE__*/React.createElement("span", {
    className: "ds-version-badge",
    translate: "no"
  }, version)), children && /*#__PURE__*/React.createElement("div", {
    className: "ds-footer-extra"
  }, children)), page && /*#__PURE__*/React.createElement(LegalDialog, {
    page: page,
    locale: locale,
    onClose: () => setPage(null)
  }));
}

var appVersion = "0.8.90";

function FooterBar() {
  var {
    language
  } = useI18n();
  return /*#__PURE__*/React.createElement(StandaloneFooter, {
    title: "Semantic Data Catalog",
    version: appVersion,
    language: language,
    assetsBase: process.env.PUBLIC_URL || ""
  });
}

function CatalogLoadingState(_ref) {
  var {
    title,
    description = "",
    embedded = false,
    error = false,
    onRetry
  } = _ref;
  var {
    language,
    t
  } = useI18n();
  var translatedTitle = t(title);
  var translatedDescription = t(description);
  return /*#__PURE__*/React.createElement("div", {
    lang: language,
    className: "catalog-loading-app catalog-loading-app--loading catalog-loading-app--".concat(embedded ? "embedded" : "standalone")
  }, /*#__PURE__*/React.createElement("main", {
    className: "catalog-full-loader",
    "aria-busy": !error
  }, /*#__PURE__*/React.createElement("span", {
    className: "catalog-full-loader__mark",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faBookOpen
  })), /*#__PURE__*/React.createElement("h1", null, translatedTitle), /*#__PURE__*/React.createElement("p", {
    role: error ? "alert" : "status",
    "aria-live": error ? "assertive" : "polite"
  }, translatedDescription), error ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-full-loader__retry",
    onClick: onRetry
  }, t("Try again")) : /*#__PURE__*/React.createElement("span", {
    className: "catalog-full-loader__rail",
    role: "progressbar",
    "aria-label": translatedDescription
  }, /*#__PURE__*/React.createElement("span", null))));
}

var VCARD_TYPE = "http://www.w3.org/2006/vcard/ns#type";
var guessContentType = function guessContentType(filename) {
  var _filename$split$pop;
  var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "application/octet-stream";
  var ext = (_filename$split$pop = filename.split(".").pop()) === null || _filename$split$pop === void 0 ? void 0 : _filename$split$pop.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return fallback;
  }
};
var getProfileDocUrl = webId => webId ? webId.split("#")[0] : "";
var getPodRoot = webId => {
  var url = new URL(webId);
  var segments = url.pathname.split("/").filter(Boolean);
  var profileIndex = segments.indexOf("profile");
  var baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
  var basePath = baseSegments.length ? "/".concat(baseSegments.join("/"), "/") : "/";
  return "".concat(url.origin).concat(basePath);
};
var normalizeEmails = values => values.map(value => value.trim()).filter(value => value.length > 0);
function OnboardingWizard(_ref) {
  var {
    webId,
    embedded = false,
    onComplete,
    onCancel
  } = _ref;
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [step, setStep] = useState(1);
  var [error, setError] = useState("");
  var [dataset, setDataset] = useState(null);
  var [profileThing, setProfileThing] = useState(null);
  var [profileDocUrl, setProfileDocUrl] = useState("");
  var [name, setName] = useState("");
  var [org, setOrg] = useState("");
  var [role, setRole] = useState("");
  var [emails, setEmails] = useState([""]);
  var [inboxUrl, setInboxUrl] = useState("");
  var [photoIri, setPhotoIri] = useState("");
  var [photoSrc, setPhotoSrc] = useState("");
  var [photoUploading, setPhotoUploading] = useState(false);
  var [inboxAcknowledged, setInboxAcknowledged] = useState(false);
  var [catalogUrl, setCatalogUrl] = useState("");
  var [catalogAcknowledged, setCatalogAcknowledged] = useState(false);
  var [privateRegistryUrl, setPrivateRegistryUrl] = useState("");
  var [privateRegistryAcknowledged, setPrivateRegistryAcknowledged] = useState(false);
  var steps = useMemo(() => [{
    id: 1,
    title: "Basics"
  }, {
    id: 2,
    title: "Email"
  }, {
    id: 3,
    title: "Inbox, Catalog & Registry"
  }], []);
  var basicsComplete = Boolean(name.trim() && org.trim() && role.trim());
  var emailsComplete = normalizeEmails(emails).length > 0;
  var defaultPrivateRegistry = buildDefaultPrivateRegistry(webId);
  var getRegistryConfig = () => ({
    mode: "private",
    registries: [],
    privateRegistry: privateRegistryUrl || defaultPrivateRegistry
  });
  var loadProfile = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* () {
      if (!webId) return;
      setLoading(true);
      setError("");
      try {
        var profileDoc = getProfileDocUrl(webId);
        setProfileDocUrl(profileDoc);
        var ds = yield getSolidDataset(profileDoc, {
          fetch: session.fetch
        });
        setDataset(ds);
        var me = getThing(ds, webId) || getThingAll(ds).find(t => t.url === webId);
        if (!me) me = createThing({
          url: webId
        });
        setProfileThing(me);
        var nm = getStringNoLocale(me, VCARD.fn) || getStringNoLocale(me, FOAF.name) || "".concat(getStringNoLocale(me, VCARD.given_name) || "", " ").concat(getStringNoLocale(me, VCARD.family_name) || "").trim();
        setName(nm || "");
        setOrg(getStringNoLocale(me, VCARD.organization_name) || "");
        setRole(getStringNoLocale(me, VCARD.role) || "");
        var emailUris = getUrlAll(me, VCARD.hasEmail) || [];
        var collected = [];
        emailUris.forEach(uri => {
          if (uri.startsWith("mailto:")) {
            collected.push(uri.replace(/^mailto:/, ""));
          } else {
            var thing = getThing(ds, uri);
            if (thing) {
              var email = (getUrl(thing, VCARD.value) || "").replace(/^mailto:/, "");
              if (email) collected.push(email);
            }
          }
        });
        var directEmails = (getUrlAll(me, VCARD.email) || []).map(uri => uri.replace(/^mailto:/, ""));
        var allEmails = [...collected, ...directEmails].filter(Boolean);
        setEmails(allEmails.length ? allEmails : [""]);
        var inbox = getUrl(me, LDP.inbox) || "";
        setInboxUrl(inbox);
        setInboxAcknowledged(Boolean(inbox));
        var photo = getUrl(me, VCARD.hasPhoto) || getUrl(me, FOAF.img) || "";
        setPhotoIri(photo);
        var profileCatalog = getUrl(me, SDP_CATALOG) || getUrl(me, LEGACY_SDP_CATALOG) || "";
        var catalogResolved = profileCatalog;
        var hasCatalog = false;
        if (profileCatalog) {
          try {
            yield getSolidDataset(profileCatalog.split("#")[0], {
              fetch: session.fetch
            });
            hasCatalog = true;
          } catch (_unused) {
            hasCatalog = false;
          }
        } else {
          try {
            catalogResolved = yield resolveCatalogUrlFromWebId(webId, session.fetch);
          } catch (_unused2) {
            catalogResolved = "";
          }
        }
        setCatalogUrl(catalogResolved);
        setCatalogAcknowledged(hasCatalog);
        var registryConfig = yield loadRegistryConfig(webId, session.fetch);
        var resolvedPrivateRegistry = registryConfig.privateRegistry || buildDefaultPrivateRegistry(webId);
        setPrivateRegistryUrl(resolvedPrivateRegistry);
        var hasPrivateRegistry = Boolean(resolvedPrivateRegistry);
        if (resolvedPrivateRegistry) {
          try {
            yield getSolidDataset(resolvedPrivateRegistry, {
              fetch: session.fetch
            });
          } catch (err) {
            var _err$response;
            var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.status);
            if (status === 404) hasPrivateRegistry = false;
          }
        }
        setPrivateRegistryAcknowledged(hasPrivateRegistry);
        var missingBasics = !(nm && org && role);
        var missingEmail = allEmails.length === 0;
        var missingInbox = !inbox;
        var missingCatalog = !hasCatalog;
        var registryMissing = !hasPrivateRegistry;
        if (!missingBasics && !missingEmail && !missingInbox && !missingCatalog && !registryMissing) {
          onComplete();
          return;
        }
        if (missingBasics) setStep(1);else if (missingEmail) setStep(2);else setStep(3);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile information.");
      } finally {
        setLoading(false);
      }
    });
    return function loadProfile() {
      return _ref2.apply(this, arguments);
    };
  }();
  useEffect(() => {
    loadProfile();
  }, [webId]);
  useEffect(() => {
    var revoked = false;
    var objectUrl = "";
    _asyncToGenerator(function* () {
      try {
        if (!photoIri) {
          setPhotoSrc("");
          return;
        }
        var res = yield session.fetch(photoIri);
        if (!res.ok) throw new Error("Avatar ".concat(res.status));
        var blob = yield res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!revoked) setPhotoSrc(objectUrl);
      } catch (_unused3) {
        setPhotoSrc("");
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoIri]);
  useEffect(() => {
    if (!privateRegistryUrl && webId) {
      setPrivateRegistryUrl(buildDefaultPrivateRegistry(webId));
    }
  }, [privateRegistryUrl, webId]);
  var uploadAvatar = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (file) {
      var _file$name$split$pop;
      var podRoot = getPodRoot(webId);
      var ensureContainer = /*#__PURE__*/function () {
        var _ref5 = _asyncToGenerator(function* (containerUrl) {
          try {
            yield getSolidDataset(containerUrl, {
              fetch: session.fetch
            });
          } catch (e) {
            var _e$response;
            if ((e === null || e === void 0 ? void 0 : e.statusCode) === 404 || (e === null || e === void 0 || (_e$response = e.response) === null || _e$response === void 0 ? void 0 : _e$response.status) === 404) {
              yield createContainerAt(containerUrl, {
                fetch: session.fetch
              });
            } else {
              throw e;
            }
          }
        });
        return function ensureContainer(_x2) {
          return _ref5.apply(this, arguments);
        };
      }();
      var profileUrl = "".concat(podRoot, "profile/");
      yield ensureContainer(profileUrl);
      var ext = ((_file$name$split$pop = file.name.split(".").pop()) === null || _file$name$split$pop === void 0 ? void 0 : _file$name$split$pop.toLowerCase()) || "png";
      var targetUrl = "".concat(profileUrl, "avatar-").concat(Date.now(), ".").concat(ext);
      yield overwriteFile(targetUrl, file, {
        contentType: file.type || guessContentType(file.name, "image/*"),
        fetch: session.fetch
      });
      return targetUrl;
    });
    return function uploadAvatar(_x) {
      return _ref4.apply(this, arguments);
    };
  }();
  var onPickAvatar = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (e) {
      var _e$target$files;
      var file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
      if (!file) return;
      setPhotoUploading(true);
      setError("");
      try {
        var url = yield uploadAvatar(file);
        setPhotoIri(url);
      } catch (err) {
        console.error("Avatar upload failed:", err);
        setError("Avatar upload failed. Please try again.");
      } finally {
        setPhotoUploading(false);
      }
    });
    return function onPickAvatar(_x3) {
      return _ref6.apply(this, arguments);
    };
  }();
  var saveBasics = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* () {
      if (!dataset || !profileDocUrl) return;
      var me = profileThing || createThing({
        url: webId
      });
      me = removeAll(me, VCARD.fn);
      me = removeAll(me, VCARD.organization_name);
      me = removeAll(me, VCARD.role);
      me = setStringNoLocale(me, VCARD.fn, name.trim());
      me = setStringNoLocale(me, VCARD.organization_name, org.trim());
      me = setStringNoLocale(me, VCARD.role, role.trim());
      me = removeAll(me, VCARD.hasPhoto);
      if (photoIri) {
        me = setUrl(me, VCARD.hasPhoto, photoIri);
      }
      var updated = setThing(dataset, me);
      yield saveSolidDatasetAt(profileDocUrl, updated, {
        fetch: session.fetch
      });
      setDataset(updated);
      setProfileThing(me);
    });
    return function saveBasics() {
      return _ref7.apply(this, arguments);
    };
  }();
  var saveEmails = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(function* () {
      if (!dataset || !profileDocUrl) return;
      var me = profileThing || createThing({
        url: webId
      });
      var ds = dataset;
      me = removeAll(me, VCARD.hasEmail);
      me = removeAll(me, VCARD.email);
      var list = normalizeEmails(emails);
      list.forEach((email, idx) => {
        var nodeUrl = "".concat(profileDocUrl, "#email-").concat(Date.now(), "-").concat(idx);
        var emailNode = createThing({
          url: nodeUrl
        });
        emailNode = removeAll(emailNode, VCARD.value);
        emailNode = setUrl(emailNode, VCARD.value, "mailto:".concat(email));
        emailNode = setStringNoLocale(emailNode, VCARD_TYPE, "Work");
        ds = setThing(ds, emailNode);
        me = addUrl(me, VCARD.hasEmail, nodeUrl);
      });
      ds = setThing(ds, me);
      yield saveSolidDatasetAt(profileDocUrl, ds, {
        fetch: session.fetch
      });
      setDataset(ds);
      setProfileThing(me);
    });
    return function saveEmails() {
      return _ref8.apply(this, arguments);
    };
  }();
  var getResourceAndAcl = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(function* (url) {
      var resource = yield getSolidDatasetWithAcl(url, {
        fetch: session.fetch
      });
      var resourceAcl;
      if (!hasResourceAcl(resource)) {
        if (!hasAccessibleAcl(resource)) {
          throw new Error("No access to ACL.");
        }
        resourceAcl = createAclFromFallbackAcl(resource);
      } else {
        resourceAcl = getResourceAcl(resource);
      }
      return {
        resource,
        resourceAcl
      };
    });
    return function getResourceAndAcl(_x4) {
      return _ref9.apply(this, arguments);
    };
  }();
  var configureInbox = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(function* () {
      if (!webId || !profileDocUrl) return;
      var targetInboxUrl = "".concat(getPodRoot(webId), "inbox/");
      try {
        yield getSolidDataset(targetInboxUrl, {
          fetch: session.fetch
        });
      } catch (e) {
        var _e$response2;
        if ((e === null || e === void 0 ? void 0 : e.statusCode) === 404 || (e === null || e === void 0 || (_e$response2 = e.response) === null || _e$response2 === void 0 ? void 0 : _e$response2.status) === 404) {
          yield createContainerAt(targetInboxUrl, {
            fetch: session.fetch
          });
        } else {
          throw e;
        }
      }
      var {
        resource,
        resourceAcl
      } = yield getResourceAndAcl(targetInboxUrl);
      var updatedAcl = setPublicResourceAccess(resourceAcl, {
        read: false,
        append: true,
        write: false,
        control: false
      });
      yield saveAclFor(resource, updatedAcl, {
        fetch: session.fetch
      });
      var ds = dataset;
      if (!ds) {
        ds = yield getSolidDataset(profileDocUrl, {
          fetch: session.fetch
        });
      }
      var me = profileThing || createThing({
        url: webId
      });
      me = removeAll(me, LDP.inbox);
      me = setUrl(me, LDP.inbox, targetInboxUrl);
      ds = setThing(ds, me);
      yield saveSolidDatasetAt(profileDocUrl, ds, {
        fetch: session.fetch
      });
      setDataset(ds);
      setProfileThing(me);
      setInboxUrl(targetInboxUrl);
    });
    return function configureInbox() {
      return _ref10.apply(this, arguments);
    };
  }();
  var configureCatalog = /*#__PURE__*/function () {
    var _ref11 = _asyncToGenerator(function* () {
      if (!webId) return;
      var title = name ? "".concat(name, "'s Catalog") : "Semantic Data Catalog";
      var registryConfig = getRegistryConfig();
      yield saveRegistryConfig(webId, session.fetch, registryConfig);
      yield ensurePrivateRegistryContainer(webId, session.fetch, registryConfig.privateRegistry);
      var {
        catalogUrl: configuredUrl
      } = yield ensureCatalogStructure(session, {
        title,
        registryConfig
      });
      setCatalogUrl(configuredUrl);
    });
    return function configureCatalog() {
      return _ref11.apply(this, arguments);
    };
  }();
  var handleNext = /*#__PURE__*/function () {
    var _ref12 = _asyncToGenerator(function* () {
      setError("");
      setSaving(true);
      try {
        if (step === 1) {
          yield saveBasics();
          setStep(2);
        } else if (step === 2) {
          yield saveEmails();
          setStep(3);
        } else if (step === 3) {
          yield configureInbox();
          yield configureCatalog();
          onComplete();
        }
      } catch (err) {
        console.error("Setup step failed:", err);
        setError((err === null || err === void 0 ? void 0 : err.message) || "Saving failed. Please try again.");
      } finally {
        setSaving(false);
      }
    });
    return function handleNext() {
      return _ref12.apply(this, arguments);
    };
  }();
  var handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(CatalogLoadingState, {
      title: "Semantic Data Catalog",
      description: "Loading your personal catalog workspace \u2026",
      embedded: embedded
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "onboarding-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-title"
  }, "Welcome to the Semantic Data Catalog"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-subtitle"
  }, "Complete these steps to activate your catalog access.")), /*#__PURE__*/React.createElement("button", {
    className: "onboarding-cancel",
    type: "button",
    onClick: onCancel
  }, "Cancel")), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-steps"
  }, steps.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "onboarding-step ".concat(item.id === step ? "active" : "", " ").concat(item.id < step ? "done" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-step__index"
  }, item.id), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-step__label"
  }, item.title)))), error && /*#__PURE__*/React.createElement("div", {
    className: "onboarding-error"
  }, error), step === 1 && /*#__PURE__*/React.createElement("div", {
    className: "onboarding-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Basics"), /*#__PURE__*/React.createElement("p", null, "Please provide your profile basics."), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-basics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-avatar"
  }, photoSrc ? /*#__PURE__*/React.createElement("img", {
    src: photoSrc,
    alt: "Profile avatar"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "onboarding-avatar__placeholder"
  }, "No photo"), /*#__PURE__*/React.createElement("label", {
    className: "onboarding-avatar__btn",
    "aria-label": "Upload profile photo",
    title: "Upload profile photo (optional)"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "onboarding-avatar__icon",
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "currentColor",
    d: "M9 4h6l1.2 2H20a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3.8L9 4Zm3 5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z"
  })), photoUploading ? "Uploading..." : "", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: onPickAvatar
  }))), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: name,
    onChange: e => setName(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Organization"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: org,
    onChange: e => setOrg(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Role"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: role,
    onChange: e => setRole(e.target.value)
  }))))), step === 2 && /*#__PURE__*/React.createElement("div", {
    className: "onboarding-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Email"), /*#__PURE__*/React.createElement("p", null, "Add at least one contact email."), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-list"
  }, emails.map((email, idx) => /*#__PURE__*/React.createElement("div", {
    className: "onboarding-list__row",
    key: idx
  }, /*#__PURE__*/React.createElement("input", {
    type: "email",
    placeholder: "name@example.org",
    value: email,
    onChange: e => {
      var next = [...emails];
      next[idx] = e.target.value;
      setEmails(next);
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "onboarding-remove",
    onClick: () => {
      var next = emails.filter((_, i) => i !== idx);
      setEmails(next.length ? next : [""]);
    }
  }, "Remove"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "onboarding-add",
    onClick: () => setEmails([...emails, ""])
  }, "Add email"))), step === 3 && /*#__PURE__*/React.createElement("div", {
    className: "onboarding-section"
  }, /*#__PURE__*/React.createElement("h3", null, "Solid Inbox, Catalog & Registry"), /*#__PURE__*/React.createElement("p", null, "Configure your Solid inbox, catalog, and private registry so access requests and metadata stay in your pod."), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox"
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__label"
  }, "Inbox URL"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__value"
  }, inboxUrl || "Not configured"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__hint"
  }, "The inbox will be created in a ", /*#__PURE__*/React.createElement("code", null, "inbox/"), " container in your pod."), /*#__PURE__*/React.createElement("label", {
    className: "onboarding-checkbox"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: inboxAcknowledged,
    onChange: e => setInboxAcknowledged(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "I understand that finishing will create and configure my inbox."))), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__label"
  }, "Catalog URL"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__value"
  }, catalogUrl || "Not configured"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__hint"
  }, "The catalog metadata will be created in a ", /*#__PURE__*/React.createElement("code", null, "catalog/"), " container in your pod."), /*#__PURE__*/React.createElement("label", {
    className: "onboarding-checkbox"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: catalogAcknowledged,
    onChange: e => setCatalogAcknowledged(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "I understand that finishing will create and configure my catalog."))), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__label"
  }, "Private Registry"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__value"
  }, privateRegistryUrl || defaultPrivateRegistry || "Not configured"), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-inbox__hint"
  }, "The registry will always be created in your pod root under ", /*#__PURE__*/React.createElement("code", null, "registry/"), "."), /*#__PURE__*/React.createElement("label", {
    className: "onboarding-checkbox"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: privateRegistryAcknowledged,
    onChange: e => setPrivateRegistryAcknowledged(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "I understand that finishing will create and configure my private registry.")))), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "onboarding-back",
    onClick: handleBack,
    disabled: step === 1 || saving
  }, "Back"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "onboarding-next",
    onClick: handleNext,
    disabled: saving || step === 1 && !basicsComplete || step === 2 && !emailsComplete || step === 3 && (!inboxAcknowledged || !catalogAcknowledged || !privateRegistryAcknowledged)
  }, saving ? "Saving..." : step === 3 ? "Finish" : "Next"))));
}

var PrivateRegistryModal = _ref => {
  var {
    onClose,
    onSaved
  } = _ref;
  var [registryUrl, setRegistryUrl] = useState("");
  var [members, setMembers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState("");
  var normalizeMembers = (list, webId) => {
    var cleaned = Array.from(new Set((list || []).map(value => (value || "").trim()).filter(Boolean)));
    if (webId) {
      var idx = cleaned.indexOf(webId);
      if (idx !== -1) cleaned.splice(idx, 1);
    }
    return cleaned.map((value, idx) => ({
      id: "member-".concat(Date.now(), "-").concat(idx),
      value
    }));
  };
  useEffect(() => {
    var load = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        setLoading(true);
        setError("");
        try {
          var webId = session.info.webId;
          var config = yield loadRegistryConfig(webId, session.fetch);
          var targetUrl = config.privateRegistry || buildDefaultPrivateRegistry(webId);
          setRegistryUrl(targetUrl);
          var list = yield loadRegistryMembersFromContainer(targetUrl, session.fetch);
          setMembers(normalizeMembers(list, webId));
        } catch (err) {
          console.error("Failed to load private registry:", err);
          setError("Failed to load private registry.");
        } finally {
          setLoading(false);
        }
      });
      return function load() {
        return _ref2.apply(this, arguments);
      };
    }();
    load();
  }, []);
  var addMember = () => {
    setMembers(prev => [...prev, {
      id: "member-".concat(Date.now(), "-").concat(prev.length),
      value: ""
    }]);
  };
  var updateMember = (id, value) => {
    setMembers(prev => prev.map(item => item.id === id ? _objectSpread2$2(_objectSpread2$2({}, item), {}, {
      value
    }) : item));
  };
  var removeMember = id => {
    setMembers(prev => prev.filter(item => item.id !== id));
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(function* () {
      if (!session.info.isLoggedIn || !session.info.webId) return;
      setSaving(true);
      setError("");
      try {
        var webId = session.info.webId;
        var config = yield loadRegistryConfig(webId, session.fetch);
        var targetUrl = config.privateRegistry || buildDefaultPrivateRegistry(webId);
        if (!config.privateRegistry) {
          yield saveRegistryConfig(webId, session.fetch, _objectSpread2$2(_objectSpread2$2({}, config), {}, {
            mode: "private",
            privateRegistry: targetUrl
          }));
        }
        var list = members.map(item => (item.value || "").trim()).filter(Boolean);
        if (webId && !list.includes(webId)) list.unshift(webId);
        yield syncRegistryMembersInContainer(targetUrl, session.fetch, list, {
          allowCreate: true
        });
        if (onSaved) onSaved();
        onClose();
      } catch (err) {
        console.error("Failed to save private registry:", err);
        setError((err === null || err === void 0 ? void 0 : err.message) || "Failed to save private registry.");
      } finally {
        setSaving(false);
      }
    });
    return function handleSave() {
      return _ref3.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show dataset-add-modal private-registry-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl",
    role: "document"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, "Private Registry"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", null, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, error && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-danger"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Registry URL"), /*#__PURE__*/React.createElement("div", {
    className: "form-control",
    style: {
      height: "auto"
    }
  }, registryUrl || "Not configured"), /*#__PURE__*/React.createElement("small", {
    className: "form-text text-muted"
  }, "This registry is stored in your pod under ", /*#__PURE__*/React.createElement("code", null, "registry/"), ".")), loading ? /*#__PURE__*/React.createElement("div", null, "Loading registry members...") : /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Members (WebIDs)"), members.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-muted mb-2"
  }, "No WebIDs added yet."), members.map(member => /*#__PURE__*/React.createElement("div", {
    key: member.id,
    className: "d-flex mb-2 member-row"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-control mr-2",
    type: "text",
    placeholder: "https://example.org/profile/card#me",
    value: member.value,
    onChange: e => updateMember(member.id, e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-danger btn-sm",
    onClick: () => removeMember(member.id),
    "aria-label": "Remove WebID",
    title: "Remove WebID"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash"
  })))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light",
    onClick: addMember
  }, "Add WebID"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: handleSave,
    disabled: saving
  }, saving ? "Saving..." : "Save")))));
};

var LEGACY_STORAGE_PREFIX = "semantic-data-catalog:survey";
var STORAGE_PREFIX = "".concat(LEGACY_STORAGE_PREFIX, ":v2");
var VALID_STATUSES = new Set(["pending", "submitted"]);
var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var normalizeCatalogSurveyWebId = webId => {
  var raw = String(webId || "").trim();
  if (!raw) return "";
  try {
    var parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.username || parsed.password) return "";
    return parsed.href;
  } catch (_unused) {
    return "";
  }
};
var buildLegacyCatalogSurveyStorageKey = function buildLegacyCatalogSurveyStorageKey() {
  var {
    surveyEventsUrl,
    questionId,
    surveyVersion = CATALOG_SURVEY_VERSION
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var endpoint = String(surveyEventsUrl || "").trim();
  var question = String(questionId || "").trim();
  var version = String(surveyVersion || "").trim();
  if (!endpoint || !question || !version) return "";
  return "".concat(LEGACY_STORAGE_PREFIX, ":").concat(encodeURIComponent(endpoint), ":").concat(encodeURIComponent(version), ":").concat(encodeURIComponent(question));
};
var buildCatalogSurveyStorageKey = function buildCatalogSurveyStorageKey() {
  var {
    surveyEventsUrl,
    questionId,
    webId,
    surveyVersion = CATALOG_SURVEY_VERSION
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var endpoint = String(surveyEventsUrl || "").trim();
  var question = String(questionId || "").trim();
  var accountWebId = normalizeCatalogSurveyWebId(webId);
  var version = String(surveyVersion || "").trim();
  if (!endpoint || !question || !accountWebId || !version) return "";
  return "".concat(STORAGE_PREFIX, ":").concat(encodeURIComponent(endpoint), ":").concat(encodeURIComponent(version), ":").concat(encodeURIComponent(accountWebId), ":").concat(encodeURIComponent(question));
};
var readCatalogSurveyQuestionState = function readCatalogSurveyQuestionState() {
  var {
    storage,
    surveyEventsUrl,
    questionId,
    webId,
    surveyVersion = CATALOG_SURVEY_VERSION
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var key = buildCatalogSurveyStorageKey({
    surveyEventsUrl,
    questionId,
    webId,
    surveyVersion
  });
  if (!key || !(storage !== null && storage !== void 0 && storage.getItem)) return null;
  try {
    // Legacy markers were browser-wide and cannot be assigned safely to any
    // particular account. Remove them instead of copying them into v2.
    var legacyKey = buildLegacyCatalogSurveyStorageKey({
      surveyEventsUrl,
      questionId,
      surveyVersion
    });
    if (legacyKey && storage.getItem(legacyKey) !== null) {
      var _storage$removeItem;
      (_storage$removeItem = storage.removeItem) === null || _storage$removeItem === void 0 || _storage$removeItem.call(storage, legacyKey);
    }
    var value = JSON.parse(storage.getItem(key) || "null");
    if (!value || !VALID_STATUSES.has(value.status)) return null;
    if (value.status === "submitted") {
      return UUID_PATTERN.test(String(value.eventId || "")) ? value : null;
    }
    var event = value.event;
    if (!UUID_PATTERN.test(String((event === null || event === void 0 ? void 0 : event.eventId) || "")) || event.questionId !== questionId || event.surveyVersion !== surveyVersion || !Number.isInteger(event.rating) || event.rating < 1 || event.rating > 5) {
      return null;
    }
    return value;
  } catch (_unused2) {
    return null;
  }
};
var writeCatalogSurveyQuestionState = function writeCatalogSurveyQuestionState() {
  var {
    storage,
    surveyEventsUrl,
    questionId,
    webId,
    surveyVersion = CATALOG_SURVEY_VERSION,
    state
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var key = buildCatalogSurveyStorageKey({
    surveyEventsUrl,
    questionId,
    webId,
    surveyVersion
  });
  if (!key || !(storage !== null && storage !== void 0 && storage.setItem) || !state || !VALID_STATUSES.has(state.status)) return false;
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch (_unused3) {
    return false;
  }
};

var QUESTIONS = [{
  id: CATALOG_SURVEY_QUESTION_IDS.systemComprehensibility,
  title: "How understandable is the system?"
}, {
  id: CATALOG_SURVEY_QUESTION_IDS.datasetFindability,
  title: "How easy is it to find relevant datasets?"
}];
var RATINGS = [{
  value: 1,
  icon: faFaceFrownOpen,
  label: "Very poor"
}, {
  value: 2,
  icon: faFaceFrown,
  label: "Poor"
}, {
  value: 3,
  icon: faFaceMeh,
  label: "Neutral"
}, {
  value: 4,
  icon: faFaceSmile,
  label: "Good"
}, {
  value: 5,
  icon: faFaceLaughBeam,
  label: "Very good"
}];
var browserStorage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (_unused) {
    return null;
  }
};
var loadQuestionStates = (surveyEventsUrl, webId) => {
  var storage = browserStorage();
  return Object.fromEntries(QUESTIONS.map(_ref => {
    var {
      id
    } = _ref;
    return [id, readCatalogSurveyQuestionState({
      storage,
      surveyEventsUrl,
      questionId: id,
      webId
    })];
  }));
};
var firstOpenQuestionIndex = states => {
  var index = QUESTIONS.findIndex(_ref2 => {
    var _states$id;
    var {
      id
    } = _ref2;
    return ((_states$id = states[id]) === null || _states$id === void 0 ? void 0 : _states$id.status) !== "submitted";
  });
  return index < 0 ? QUESTIONS.length : index;
};
function CatalogSurvey(_ref3) {
  var _session$info, _session$info2, _questionStates$quest;
  var {
    session,
    statisticsConfig,
    catalogSurface,
    authenticated = false,
    webId
  } = _ref3;
  var {
    t
  } = useI18n();
  var launcherRef = useRef(null);
  var drawerRef = useRef(null);
  var closeRef = useRef(null);
  var savingRef = useRef(false);
  var activeScopeRef = useRef("");
  var normalizedConfig = useMemo(() => normalizeStatisticsConfig(statisticsConfig), [statisticsConfig]);
  var surveyEventsUrl = useMemo(() => deriveSurveyEventsUrl(normalizedConfig.eventsUrl), [normalizedConfig.eventsUrl]);
  var accountWebId = normalizeCatalogSurveyWebId(webId);
  var sessionWebId = normalizeCatalogSurveyWebId(session === null || session === void 0 || (_session$info = session.info) === null || _session$info === void 0 ? void 0 : _session$info.webId);
  var available = Boolean(authenticated && accountWebId && sessionWebId === accountWebId && normalizedConfig.enabled && surveyEventsUrl && (session === null || session === void 0 || (_session$info2 = session.info) === null || _session$info2 === void 0 ? void 0 : _session$info2.isLoggedIn) && typeof (session === null || session === void 0 ? void 0 : session.fetch) === "function");
  var activeScope = available ? "".concat(surveyEventsUrl, "|").concat(accountWebId) : "";
  activeScopeRef.current = activeScope;
  var [open, setOpen] = useState(false);
  var [stateScope, setStateScope] = useState("");
  var [questionStates, setQuestionStates] = useState({});
  var [questionIndex, setQuestionIndex] = useState(0);
  var [selectedRating, setSelectedRating] = useState(null);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState("");
  savingRef.current = saving;
  var refreshState = useCallback(() => {
    var _nextStates$QUESTIONS, _nextStates$QUESTIONS2;
    var nextStates = loadQuestionStates(surveyEventsUrl, accountWebId);
    var nextIndex = firstOpenQuestionIndex(nextStates);
    setQuestionStates(nextStates);
    setQuestionIndex(nextIndex);
    setSelectedRating(nextIndex < QUESTIONS.length ? (_nextStates$QUESTIONS = (_nextStates$QUESTIONS2 = nextStates[QUESTIONS[nextIndex].id]) === null || _nextStates$QUESTIONS2 === void 0 || (_nextStates$QUESTIONS2 = _nextStates$QUESTIONS2.event) === null || _nextStates$QUESTIONS2 === void 0 ? void 0 : _nextStates$QUESTIONS2.rating) !== null && _nextStates$QUESTIONS !== void 0 ? _nextStates$QUESTIONS : null : null);
    setStateScope(activeScope);
    return nextStates;
  }, [accountWebId, activeScope, surveyEventsUrl]);
  useEffect(() => {
    setOpen(false);
    setSaving(false);
    setError("");
    if (!available) {
      setStateScope("");
      setQuestionStates({});
      setQuestionIndex(0);
      setSelectedRating(null);
      return;
    }
    refreshState();
  }, [available, refreshState]);
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    var previouslyFocused = document.activeElement;
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    var focusTimer = window.setTimeout(() => {
      var _closeRef$current;
      return (_closeRef$current = closeRef.current) === null || _closeRef$current === void 0 ? void 0 : _closeRef$current.focus();
    }, 0);
    var handleKeyDown = event => {
      var _drawerRef$current;
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      var focusable = Array.from(((_drawerRef$current = drawerRef.current) === null || _drawerRef$current === void 0 ? void 0 : _drawerRef$current.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')) || []);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      var _launcherRef$current;
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused !== null && previouslyFocused !== void 0 && previouslyFocused.focus) previouslyFocused.focus();else (_launcherRef$current = launcherRef.current) === null || _launcherRef$current === void 0 || _launcherRef$current.focus();
    };
  }, [open]);
  if (!available || stateScope !== activeScope) return null;
  var completed = questionIndex >= QUESTIONS.length;
  var question = completed ? null : QUESTIONS[questionIndex];
  var pendingEvent = question ? (_questionStates$quest = questionStates[question.id]) === null || _questionStates$quest === void 0 ? void 0 : _questionStates$quest.event : null;
  var handleOpen = () => {
    refreshState();
    setError("");
    setOpen(true);
  };
  var handleClose = () => {
    if (saving) return;
    setError("");
    setOpen(false);
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* () {
      if (!question || selectedRating === null) {
        setError(t("Please select a rating."));
        return;
      }
      setSaving(true);
      setError("");
      var submissionWebId = accountWebId;
      var submissionScope = activeScope;
      var isCurrentScope = () => activeScopeRef.current === submissionScope;
      var event = pendingEvent || createCatalogSurveyEvent({
        questionId: question.id,
        rating: selectedRating,
        catalogSurface
      });
      if (!event) {
        setSaving(false);
        setError(t("Feedback could not be saved. Please try again."));
        return;
      }
      var pendingState = {
        status: "pending",
        event
      };
      var statesWithPending = _objectSpread2$2(_objectSpread2$2({}, questionStates), {}, {
        [question.id]: pendingState
      });
      setQuestionStates(statesWithPending);
      writeCatalogSurveyQuestionState({
        storage: browserStorage(),
        surveyEventsUrl,
        questionId: question.id,
        webId: submissionWebId,
        state: pendingState
      });
      try {
        var _nextStates$QUESTIONS3, _nextStates$QUESTIONS4;
        var saved = yield recordCatalogSurveyResponse(_objectSpread2$2({
          session,
          statisticsConfig: normalizedConfig
        }, event));
        if (!saved) throw new Error("Survey response was not stored.");
        var submittedState = {
          status: "submitted",
          eventId: event.eventId,
          occurredAt: event.occurredAt
        };
        writeCatalogSurveyQuestionState({
          storage: browserStorage(),
          surveyEventsUrl,
          questionId: question.id,
          webId: submissionWebId,
          state: submittedState
        });
        if (!isCurrentScope()) return;
        var nextStates = _objectSpread2$2(_objectSpread2$2({}, statesWithPending), {}, {
          [question.id]: submittedState
        });
        var nextIndex = firstOpenQuestionIndex(nextStates);
        setQuestionStates(nextStates);
        setQuestionIndex(nextIndex);
        setSelectedRating(nextIndex < QUESTIONS.length ? (_nextStates$QUESTIONS3 = (_nextStates$QUESTIONS4 = nextStates[QUESTIONS[nextIndex].id]) === null || _nextStates$QUESTIONS4 === void 0 || (_nextStates$QUESTIONS4 = _nextStates$QUESTIONS4.event) === null || _nextStates$QUESTIONS4 === void 0 ? void 0 : _nextStates$QUESTIONS4.rating) !== null && _nextStates$QUESTIONS3 !== void 0 ? _nextStates$QUESTIONS3 : null : null);
      } catch (saveError) {
        console.warn("Catalog survey response could not be stored.", saveError);
        if (isCurrentScope()) {
          setError(t("Feedback could not be saved. Please try again."));
        }
      } finally {
        if (isCurrentScope()) setSaving(false);
      }
    });
    return function handleSave() {
      return _ref4.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    ref: launcherRef,
    type: "button",
    className: "catalog-survey-launcher",
    onClick: handleOpen,
    "aria-controls": "catalog-survey-drawer",
    "aria-expanded": open,
    "aria-label": t("Give feedback")
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faCommentDots,
    "aria-hidden": "true",
    className: "catalog-survey-launcher__icon"
  }), /*#__PURE__*/React.createElement("span", {
    className: "catalog-survey-launcher__label"
  }, t(completed ? "Feedback completed" : "Feedback"))), open && /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-layer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-survey-backdrop",
    onClick: handleClose,
    "aria-label": t("Close feedback survey"),
    tabIndex: -1
  }), /*#__PURE__*/React.createElement("aside", {
    id: "catalog-survey-drawer",
    ref: drawerRef,
    className: "catalog-survey-drawer",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "catalog-survey-title"
  }, /*#__PURE__*/React.createElement("header", {
    className: "catalog-survey-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "catalog-survey-eyebrow"
  }, t("User survey")), /*#__PURE__*/React.createElement("h2", {
    id: "catalog-survey-title"
  }, t("Your feedback"))), /*#__PURE__*/React.createElement("button", {
    ref: closeRef,
    type: "button",
    className: "catalog-survey-close",
    onClick: handleClose,
    disabled: saving,
    "aria-label": t("Close")
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faXmark,
    "aria-hidden": "true"
  }))), completed ? /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-complete",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-complete__icon",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faCheck
  })), /*#__PURE__*/React.createElement("h3", null, t("Thank you for your feedback!")), /*#__PURE__*/React.createElement("p", null, t("Both answers were saved and evaluated separately.")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-survey-primary",
    onClick: handleClose
  }, t("Close"))) : /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-progress",
    "aria-label": t("Step ".concat(questionIndex + 1, " of 2"))
  }, /*#__PURE__*/React.createElement("span", null, t("Step ".concat(questionIndex + 1, " of 2"))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-progress__track",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "".concat((questionIndex + 1) / 2 * 100, "%")
    }
  }))), /*#__PURE__*/React.createElement("h3", null, t(question.title)), /*#__PURE__*/React.createElement("p", {
    className: "catalog-survey-hint"
  }, questionIndex === 0 ? t("Choose the answer that best matches your experience.") : t("Your first answer has already been saved separately.")), /*#__PURE__*/React.createElement("fieldset", {
    className: "catalog-survey-ratings",
    disabled: saving || Boolean(pendingEvent)
  }, /*#__PURE__*/React.createElement("legend", {
    className: "catalog-survey-sr-only"
  }, t(question.title)), RATINGS.map(_ref5 => {
    var {
      value,
      icon,
      label
    } = _ref5;
    return /*#__PURE__*/React.createElement("label", {
      key: value,
      className: "catalog-survey-rating".concat(selectedRating === value ? " is-selected" : "")
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "catalog-survey-".concat(question.id),
      value: value,
      checked: selectedRating === value,
      onChange: () => {
        setSelectedRating(value);
        setError("");
      }
    }), /*#__PURE__*/React.createElement(FontAwesomeIcon, {
      icon: icon,
      className: "catalog-survey-rating__icon",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", {
      className: "catalog-survey-rating__label"
    }, t(label)));
  })), error && /*#__PURE__*/React.createElement("p", {
    className: "catalog-survey-error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "catalog-survey-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-survey-secondary",
    onClick: handleClose,
    disabled: saving
  }, t("Cancel")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "catalog-survey-primary",
    onClick: handleSave,
    disabled: saving || selectedRating === null
  }, saving ? t("Saving...") : t(pendingEvent ? "Try again" : questionIndex === 0 ? "Next" : "Submit")))))));
}

function useCatalogDatasets(session, webId, isLoggedIn) {
  var registryUrl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var context = "".concat(isLoggedIn, ":").concat(webId || "", ":").concat(registryUrl);
  var [result, setResult] = useState(null);
  var [attempt, setAttempt] = useState(0);
  var activeRun = useRef(null);
  var fetchDatasets = useCallback(/*#__PURE__*/_asyncToGenerator(function* () {
    var run = activeRun.current;
    if (!run || run.context !== context) return;
    var request = ++run.request;
    if (!isLoggedIn || !registryUrl || session.info.webId !== webId) {
      setResult({
        context,
        datasets: [],
        catalogs: [],
        error: false
      });
      return;
    }
    var failed = false;
    var partial = false;
    try {
      var loaded = yield loadAggregatedDatasets(session, isLoggedIn ? null : window.fetch.bind(window), {
        usePublicCache: true,
        registryUrl,
        onLoadError: (_error, detail) => {
          // A registry can link to deleted, private or offline entries.
          // Wait for the complete traversal, but do not let one such entry
          // hide every successful result. Discovery failures remain blocking.
          if ((detail === null || detail === void 0 ? void 0 : detail.stage) === "dataset" || (detail === null || detail === void 0 ? void 0 : detail.stage) === "catalog") partial = true;else failed = true;
        }
      });
      if (activeRun.current !== run || run.request !== request) return;
      setResult({
        context,
        datasets: loaded.datasets.map(dataset => _objectSpread2$2(_objectSpread2$2({}, dataset), {}, {
          userHasAccess: dataset.is_public || dataset.webid === webId
        })),
        catalogs: loaded.catalogs || [],
        error: failed,
        partial
      });
    } catch (error) {
      if (activeRun.current !== run || run.request !== request) return;
      console.error("Error fetching datasets:", error);
      setResult({
        context,
        datasets: [],
        catalogs: [],
        error: true
      });
    }
  }), [session, context, isLoggedIn, webId, registryUrl]);
  useEffect(() => {
    var run = {
      context,
      request: 0
    };
    activeRun.current = run;
    setResult(null);
    fetchDatasets();
    // Ignore stale responses after account changes or unmounts.
    // https://react.dev/reference/react/useEffect#fetching-data-with-effects
    return () => {
      if (activeRun.current === run) activeRun.current = null;
    };
  }, [session, context, isLoggedIn, webId, attempt, fetchDatasets]);
  var current = (result === null || result === void 0 ? void 0 : result.context) === context ? result : null;
  return {
    datasets: (current === null || current === void 0 ? void 0 : current.datasets) || [],
    catalogs: (current === null || current === void 0 ? void 0 : current.catalogs) || [],
    loading: !current,
    error: Boolean(current === null || current === void 0 ? void 0 : current.error),
    partial: Boolean(current === null || current === void 0 ? void 0 : current.partial),
    fetchDatasets,
    retry: () => {
      setResult(null);
      setAttempt(value => value + 1);
    }
  };
}

var defaultIssuer = process.env.REACT_APP_OIDC_ISSUER || 'https://solid-community-server.tmdt.info';
var App = function App() {
  var {
    embedded = false,
    webIdOverride = null,
    datasetUrl = null,
    LoginScreenComponent = null,
    language = null,
    statisticsConfig
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var [apiServiceForm, setApiServiceForm] = useState(null);
  var [showPublicData, setShowPublicData] = useState(() => new URLSearchParams(window.location.search).get('view') === 'public-data');
  var [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  var [showDetailModal, setShowDetailModal] = useState(false);
  var [showDeleteModal, setShowDeleteModal] = useState(false);
  var [showEditModal, setShowEditModal] = useState(false);
  var [showRegistryModal, setShowRegistryModal] = useState(false);
  var [selectedDataset, setSelectedDataset] = useState(null);
  var [sessionLoggedIn, setIsLoggedIn] = useState(() => Boolean(session.info.isLoggedIn));
  var [sessionWebId, setWebId] = useState(() => session.info.webId || null);
  var isLoggedIn = embedded ? Boolean(webIdOverride) : sessionLoggedIn;
  var webId = embedded ? webIdOverride : sessionWebId;
  var registry = resolveCatalogRegistry();
  var scopeRef = useRef(null);
  var [userName, setUserName] = useState('');
  var [userEmail, setUserEmail] = useState('');
  var [headerUserInfo, setHeaderUserInfo] = useState(null);
  var [isPopulating, setIsPopulating] = useState(false);
  var populateTriggerRef = useRef(false);
  var [showSemanticSearch, setShowSemanticSearch] = useState(() => new URLSearchParams(window.location.search).get('view') === 'semantic-search');
  var [datasetOpenError, setDatasetOpenError] = useState('');
  var closeSemanticSearch = () => {
    var _window$history$state;
    setShowSemanticSearch(false);
    setDatasetOpenError('');
    if (((_window$history$state = window.history.state) === null || _window$history$state === void 0 ? void 0 : _window$history$state.catalogSearch) === window.location.href) {
      window.history.back();
    } else {
      var url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState(window.history.state, '', url);
    }
  };
  useEffect(() => {
    var onPopState = () => setShowSemanticSearch(new URLSearchParams(window.location.search).get('view') === 'semantic-search');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  var openSearchDataset = useCallback(/*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (url) {
      setDatasetOpenError('');
      try {
        var scope = scopeRef.current;
        if (!safeResultUrl(url)) throw new Error('Invalid dataset URL.');
        if (!(scope !== null && scope !== void 0 && scope.registry) || scope.loading || !scope.datasets.some(dataset => dataset.datasetUrl === url)) {
          throw new Error('This dataset is not part of this registry.');
        }
        var doc = yield getSolidDataset(url.split('#')[0], {
          // Use the shared session for authorized private links as well as public results.
          fetch: session.info.isLoggedIn ? (input, init) => session.fetch(input, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
            cache: 'no-store'
          })) : (input, init) => fetch(input, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
            credentials: 'omit',
            cache: 'no-store'
          }))
        });
        var dataset = parseDatasetFromDoc(doc, url);
        if (!dataset) throw new Error('Dataset is no longer available.');
        if (scopeRef.current.registry !== scope.registry || scopeRef.current.webId !== scope.webId) return;
        window.history.pushState(_objectSpread2$2(_objectSpread2$2({}, window.history.state), {}, {
          catalogDetail: window.location.href
        }), "");
        setSelectedDataset(dataset);
        setShowDetailModal(true);
      } catch (error) {
        setDatasetOpenError(error.message);
      }
    });
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(), []);
  var [onboardingRequired, setOnboardingRequired] = useState(false);
  var [profileCheck, setProfileCheck] = useState(null);
  var [profileAttempt, setProfileAttempt] = useState(0);
  var [isPrivateRegistry, setIsPrivateRegistry] = useState(false);
  var [issuer, setIssuer] = useState(defaultIssuer);
  var {
    datasets,
    loading: loadingDatasets,
    error: datasetLoadError,
    fetchDatasets,
    retry: retryDatasets
  } = useCatalogDatasets(session, webId, isLoggedIn, registry.url);
  scopeRef.current = {
    registry: registry.url,
    webId,
    loading: loadingDatasets,
    datasets
  };
  useEffect(() => {
    setSelectedDataset(null);
    setShowDetailModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setDatasetOpenError('');
  }, [webId, registry.url]);
  useEffect(() => {
    var requested = datasetUrl || !embedded && new URLSearchParams(window.location.search).get('dataset');
    if (requested && isLoggedIn && !loadingDatasets) openSearchDataset(requested);
  }, [datasetUrl, embedded, isLoggedIn, loadingDatasets, registry.url, openSearchDataset]);
  var effectiveStatisticsConfig = resolveStatisticsConfig({
    embedded,
    statisticsConfig
  });
  useEffect(() => {
    if (embedded) return;
    if (session.info.isLoggedIn && session.info.webId) {
      localStorage.setItem("solid-was-logged-in", "true");
      setIsLoggedIn(true);
      setWebId(session.info.webId);
    } else {
      setIsLoggedIn(false);
      setWebId(null);
    }
  }, [embedded]);
  var loginToSolid = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (nextIssuer) {
      var resolvedIssuer = nextIssuer || issuer;
      if (!resolvedIssuer) return;
      localStorage.setItem("solid-oidc-issuer", resolvedIssuer);
      yield session.login({
        oidcIssuer: resolvedIssuer,
        redirectUrl: window.location.href,
        clientName: "Semantic Data Catalog"
      });
    });
    return function loginToSolid(_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  useEffect(() => {
    var cancelled = false;
    var profilePhoto = '';
    if (!isLoggedIn) {
      setProfileCheck(null);
      setOnboardingRequired(false);
      setIsPrivateRegistry(false);
      return;
    }
    var checkProfileCompleteness = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
        if (!isLoggedIn || !webId) return;
        setProfileCheck(null);
        var failed = false;
        try {
          var {
            getSolidDataset: _getSolidDataset,
            getThing,
            getThingAll,
            getStringNoLocale,
            getUrl,
            getUrlAll
          } = yield import('@inrupt/solid-client');
          var {
            FOAF,
            VCARD,
            LDP
          } = yield import('@inrupt/vocab-common-rdf');
          var profileDocUrl = webId.split("#")[0];
          var ds = yield _getSolidDataset(profileDocUrl, {
            fetch: session.fetch
          });
          if (cancelled) return;
          var me = getThing(ds, webId) || getThingAll(ds).find(t => t.url === webId);
          if (!me) {
            setOnboardingRequired(true);
            return;
          }
          var name = getStringNoLocale(me, VCARD.fn) || getStringNoLocale(me, FOAF.name) || "".concat(getStringNoLocale(me, VCARD.given_name) || "", " ").concat(getStringNoLocale(me, VCARD.family_name) || "").trim();
          var org = getStringNoLocale(me, VCARD.organization_name) || "";
          var role = getStringNoLocale(me, VCARD.role) || "";
          var inbox = getUrl(me, LDP.inbox) || "";
          var emailUris = getUrlAll(me, VCARD.hasEmail) || [];
          var collected = [];
          emailUris.forEach(uri => {
            if (uri.startsWith("mailto:")) {
              collected.push(uri.replace(/^mailto:/, ""));
            } else {
              var emailThing = getThing(ds, uri);
              var mailto = emailThing ? getUrl(emailThing, VCARD.value) : "";
              if (mailto && mailto.startsWith("mailto:")) {
                collected.push(mailto.replace(/^mailto:/, ""));
              }
            }
          });
          var directEmails = (getUrlAll(me, VCARD.email) || []).filter(Boolean).map(uri => uri.replace(/^mailto:/, ""));
          var allEmails = [...collected, ...directEmails].filter(Boolean);
          var missingBasics = !(name && org && role);
          var missingEmail = allEmails.length === 0;
          var missingInbox = !inbox;
          var profileCatalog = getUrl(me, SDP_CATALOG) || getUrl(me, LEGACY_SDP_CATALOG) || "";
          var missingCatalog = !profileCatalog;
          if (profileCatalog) {
            try {
              yield _getSolidDataset(profileCatalog.split("#")[0], {
                fetch: session.fetch
              });
              missingCatalog = false;
            } catch (error) {
              var _error$response;
              if (((error === null || error === void 0 ? void 0 : error.statusCode) || (error === null || error === void 0 || (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.status)) !== 404) throw error;
              missingCatalog = true;
            }
          }
          var missingRegistry = false;
          var registryConfig = yield loadRegistryConfig(webId, session.fetch, {
            onLoadError: error => {
              throw error;
            }
          });
          if (cancelled) return;
          setIsPrivateRegistry(registryConfig.mode === "private");
          var privateRegistry = registryConfig.privateRegistry || buildDefaultPrivateRegistry(webId);
          if (!privateRegistry) {
            missingRegistry = true;
          } else {
            try {
              yield _getSolidDataset(privateRegistry, {
                fetch: session.fetch
              });
            } catch (err) {
              var _err$response;
              var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.status);
              if (status === 404) missingRegistry = true;else throw err;
            }
          }
          if (!embedded) profilePhoto = yield loadProfilePhoto(ds, me, session.fetch);
          if (cancelled && profilePhoto.startsWith('blob:')) URL.revokeObjectURL(profilePhoto);
          if (cancelled) return;
          setUserName(name);
          setUserEmail(allEmails[0] || "");
          setHeaderUserInfo({
            loggedIn: true,
            webId,
            name,
            email: allEmails[0] || "",
            photo: profilePhoto
          });
          setOnboardingRequired(missingBasics || missingEmail || missingInbox || missingCatalog || missingRegistry);
        } catch (err) {
          var _err$response2;
          if (cancelled) return;
          console.error("Profile completeness check failed:", err);
          failed = ((err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response2 = err.response) === null || _err$response2 === void 0 ? void 0 : _err$response2.status)) !== 404;
          setOnboardingRequired(!failed);
        } finally {
          if (!cancelled) setProfileCheck({
            webId,
            error: failed
          });
        }
      });
      return function checkProfileCompleteness() {
        return _ref3.apply(this, arguments);
      };
    }();
    checkProfileCompleteness();
    return () => {
      cancelled = true;
      if (profilePhoto.startsWith('blob:')) URL.revokeObjectURL(profilePhoto);
    };
  }, [isLoggedIn, webId, profileAttempt, embedded]);
  var handleRowClick = dataset => {
    if (!showDetailModal) window.history.pushState(_objectSpread2$2(_objectSpread2$2({}, window.history.state), {}, {
      catalogDetail: window.location.href
    }), "");
    setSelectedDataset(dataset);
    setShowDetailModal(true);
  };
  var handleEditClick = dataset => {
    setSelectedDataset(dataset);
    setShowEditModal(true);
  };
  var handleDeleteClick = dataset => {
    setSelectedDataset(dataset);
    setShowDeleteModal(true);
  };
  var handleCloseModal = () => {
    var _window$history$state2;
    if (((_window$history$state2 = window.history.state) === null || _window$history$state2 === void 0 ? void 0 : _window$history$state2.catalogDetail) === window.location.href) window.history.back();
    setShowNewDatasetModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setSelectedDataset(null);
  };
  var handleCloseNestedModal = () => {
    setShowDeleteModal(false);
    setShowEditModal(false);
  };
  var handleSemanticSearch = () => {
    setDatasetOpenError('');
    var url = new URL(window.location.href);
    url.searchParams.set('view', 'semantic-search');
    window.history.pushState(_objectSpread2$2(_objectSpread2$2({}, window.history.state), {}, {
      catalogSearch: url.href
    }), '', url);
    setShowSemanticSearch(true);
  };
  var previousDatasetsRef = useRef(datasets);
  useEffect(() => {
    // Refresh an open detail only when the listing itself is reloaded. A newly
    // fetched direct-link detail must not be replaced by older list metadata.
    if (previousDatasetsRef.current === datasets) return;
    previousDatasetsRef.current = datasets;
    if (!selectedDataset || !showDetailModal && !showEditModal && !showDeleteModal) return;
    var selectedKey = selectedDataset.datasetUrl || selectedDataset.identifier;
    if (!selectedKey) return;
    var updatedDataset = datasets.find(item => {
      var itemKey = item.datasetUrl || item.identifier;
      return itemKey === selectedKey;
    });
    if (updatedDataset && updatedDataset !== selectedDataset) {
      setSelectedDataset(updatedDataset);
    }
  }, [datasets, selectedDataset, showDetailModal, showEditModal, showDeleteModal]);
  var populateFromSeed = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(function* (_ref4) {
      var {
        publisher,
        webId
      } = _ref4;
      if (!session.info.isLoggedIn || !session.info.webId) return;
      setIsPopulating(true);
      try {
        var res = yield fetch("".concat(process.env.PUBLIC_URL, "/assets/populate/create-datasets-new-model.json"));
        if (!res.ok) throw new Error("Seed file missing (".concat(res.status, ")"));
        var allItems = yield res.json();
        var filtered = (allItems || []).filter(item => item.publisher === publisher && item.webid === webId);
        var today = new Date().toISOString();
        var existingDatasetIds = new Set(datasets.filter(item => item.datasetType !== "series").map(item => item.identifier).filter(Boolean));
        var existingSeriesById = new Map(datasets.filter(item => item.datasetType === "series" && item.identifier).map(item => [item.identifier, item]));
        var datasetUrlById = new Map(datasets.filter(item => item.datasetType !== "series" && item.identifier && item.datasetUrl).map(item => [item.identifier, item.datasetUrl]));
        var seriesQueue = new Map();
        for (var entry of filtered) {
          var identifier = entry.identifier || entry.id || "";
          var baseUrl = entry.base_url ? entry.base_url.replace(/\/$/, "") : "";
          var accessUrlDataset = baseUrl && entry.data_file ? "".concat(baseUrl, "/").concat(entry.data_file) : "";
          var accessUrlSemantic = baseUrl && entry.file_name ? "".concat(baseUrl, "/").concat(entry.file_name) : "";
          var _datasetUrl = "";
          if (identifier && existingDatasetIds.has(identifier)) {
            _datasetUrl = datasetUrlById.get(identifier) || "";
          } else {
            var created = yield createDataset(session, {
              identifier: identifier || undefined,
              title: entry.title || "",
              description: entry.description || "",
              theme: entry.theme || "",
              issued: today,
              modified: today,
              publisher: entry.publisher || "",
              contact_point: entry.contact_point || "",
              access_url_dataset: accessUrlDataset,
              access_url_semantic_model: accessUrlSemantic,
              file_format: entry.file_format || "",
              is_public: true,
              webid: entry.webid || session.info.webId
            });
            _datasetUrl = (created === null || created === void 0 ? void 0 : created.datasetUrl) || "";
          }
          var seriesInfo = entry.series || {};
          var seriesIdentifier = entry.series_identifier || entry.series_id || seriesInfo.identifier || "";
          var seriesTitle = entry.series_title || seriesInfo.title || "";
          var seriesKey = seriesIdentifier || seriesTitle;
          if (seriesKey && _datasetUrl) {
            var existing = seriesQueue.get(seriesKey) || {
              identifier: seriesIdentifier || undefined,
              title: seriesTitle || "Dataset Series",
              description: entry.series_description || seriesInfo.description || "",
              theme: entry.series_theme || seriesInfo.theme || "",
              issued: seriesInfo.issued || today,
              publisher: seriesInfo.publisher || entry.publisher || "",
              contact_point: seriesInfo.contact_point || entry.contact_point || "",
              webid: seriesInfo.webid || entry.webid || session.info.webId,
              members: []
            };
            existing.members.push(_datasetUrl);
            seriesQueue.set(seriesKey, existing);
          }
        }
        for (var seriesEntry of seriesQueue.values()) {
          var members = Array.from(new Set(seriesEntry.members));
          if (!members.length) continue;
          if (seriesEntry.identifier && existingSeriesById.has(seriesEntry.identifier)) {
            var existingSeries = existingSeriesById.get(seriesEntry.identifier);
            var mergedMembers = Array.from(new Set([...(existingSeries.seriesMembers || []), ...members]));
            yield updateDatasetSeries(session, {
              seriesUrl: existingSeries.datasetUrl,
              identifier: existingSeries.identifier,
              title: existingSeries.title || seriesEntry.title,
              description: existingSeries.description || seriesEntry.description,
              theme: existingSeries.theme || seriesEntry.theme,
              issued: existingSeries.issued || seriesEntry.issued,
              publisher: existingSeries.publisher || seriesEntry.publisher,
              contact_point: existingSeries.contact_point || seriesEntry.contact_point,
              webid: existingSeries.webid || seriesEntry.webid,
              seriesMembers: mergedMembers
            });
            continue;
          }
          yield createDatasetSeries(session, {
            identifier: seriesEntry.identifier || undefined,
            title: seriesEntry.title,
            description: seriesEntry.description,
            theme: seriesEntry.theme,
            issued: seriesEntry.issued,
            publisher: seriesEntry.publisher,
            contact_point: seriesEntry.contact_point,
            webid: seriesEntry.webid,
            seriesMembers: members
          });
        }
        yield fetchDatasets();
      } catch (error) {
        console.error("Failed to populate catalog:", error);
      } finally {
        setIsPopulating(false);
      }
    });
    return function populateFromSeed(_x3) {
      return _ref5.apply(this, arguments);
    };
  }();
  useEffect(() => {
    if (populateTriggerRef.current) return;
    if (!isLoggedIn || !session.info.webId) return;
    if (typeof window === "undefined") return;
    var path = window.location.pathname;
    var isFlorian = path.endsWith("/populate-florian");
    var isJakob = path.endsWith("/populate-jakob");
    if (!isFlorian && !isJakob) return;
    var publisher = isFlorian ? "Florian Hölken" : "Jakob Deich";
    var targetWebId = session.info.webId;
    if (!targetWebId) return;
    populateTriggerRef.current = true;
    populateFromSeed({
      publisher,
      webId: targetWebId
    });
    var cleanedPath = path.replace(/\/populate-(florian|jakob)$/, "");
    var cleanUrl = "".concat(window.location.origin).concat(cleanedPath).concat(window.location.search);
    window.history.replaceState({}, "", cleanUrl);
  }, [isLoggedIn, webId]);
  var renderWithI18n = content => /*#__PURE__*/React.createElement(I18nProvider, {
    language: language
  }, content);
  var checkingProfile = isLoggedIn && (profileCheck === null || profileCheck === void 0 ? void 0 : profileCheck.webId) !== webId;
  var showLogin = !embedded && !isLoggedIn;
  if (!showLogin && !showSemanticSearch && !datasetUrl && (checkingProfile || loadingDatasets || isPopulating)) {
    return renderWithI18n(/*#__PURE__*/React.createElement(CatalogLoadingState, {
      title: "Semantic Data Catalog",
      description: "Loading your personal catalog workspace \u2026",
      embedded: embedded
    }));
  }
  if (onboardingRequired && isLoggedIn) {
    return renderWithI18n(/*#__PURE__*/React.createElement(OnboardingWizard, {
      webId: webId,
      embedded: embedded,
      onComplete: () => {
        setOnboardingRequired(false);
        setProfileCheck(null);
        setProfileAttempt(value => value + 1);
        retryDatasets();
      },
      onCancel: /*#__PURE__*/_asyncToGenerator(function* () {
        yield session.logout({
          logoutType: "app"
        });
        window.location.reload();
      })
    }));
  }
  if (!showLogin && !showSemanticSearch && !datasetUrl && (datasetLoadError || !registry.url || profileCheck !== null && profileCheck !== void 0 && profileCheck.error)) {
    return renderWithI18n(/*#__PURE__*/React.createElement(CatalogLoadingState, {
      title: "Semantic Data Catalog",
      description: "Some catalog sources could not be loaded. Please try again.",
      embedded: embedded,
      error: true,
      onRetry: () => {
        setProfileCheck(null);
        setProfileAttempt(value => value + 1);
        retryDatasets();
      }
    }));
  }
  if (!embedded && !isLoggedIn) {
    var ActiveLoginScreen = LoginScreenComponent;
    return renderWithI18n(/*#__PURE__*/React.createElement("div", {
      className: "standalone-login-page",
      "data-standalone-shell": true
    }, ActiveLoginScreen && /*#__PURE__*/React.createElement(ActiveLoginScreen, {
      defaultIssuer: issuer,
      languageControl: /*#__PURE__*/React.createElement(LanguageSelect, {
        className: "language-select--login"
      }),
      onLogin: nextIssuer => {
        setIssuer(nextIssuer);
        loginToSolid(nextIssuer);
      }
    }), /*#__PURE__*/React.createElement(FooterBar, null)));
  }
  return renderWithI18n(/*#__PURE__*/React.createElement("div", {
    "data-standalone-shell": embedded ? undefined : true,
    className: "catalog-app catalog-app--".concat(embedded ? "embedded" : "standalone")
  }, !embedded && /*#__PURE__*/React.createElement(HeaderBar, {
    initialUserInfo: headerUserInfo,
    onLoginStatusChange: setIsLoggedIn,
    onWebIdChange: setWebId,
    onUserInfoChange: _ref7 => {
      var {
        name,
        email
      } = _ref7;
      setUserName(name);
      setUserEmail(email);
    },
    languageControl: /*#__PURE__*/React.createElement(LanguageSelect, {
      className: "language-select--header"
    })
  }), datasetOpenError && !showSemanticSearch && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "semantic-search-error"
  }, datasetOpenError), /*#__PURE__*/React.createElement(CatalogWorkspace, {
    key: "catalog:".concat(webId, ":").concat(registry.url),
    datasets: datasets,
    selectedDataset: showDetailModal ? selectedDataset : null,
    onSelect: handleRowClick,
    onCloseDetail: handleCloseModal,
    onSemanticSearch: registry.url ? handleSemanticSearch : undefined,
    detailSuspended: showEditModal || showDeleteModal || Boolean(apiServiceForm),
    detail: showDetailModal ? (selectedDataset === null || selectedDataset === void 0 ? void 0 : selectedDataset.datasetType) === "service" ? /*#__PURE__*/React.createElement(ApiServiceDetail, {
      service: selectedDataset,
      datasets: datasets,
      onClose: handleCloseModal,
      onEdit: () => setApiServiceForm(selectedDataset),
      onChanged: fetchDatasets
    }) : /*#__PURE__*/React.createElement(DatasetDetailModal, {
      key: (selectedDataset === null || selectedDataset === void 0 ? void 0 : selectedDataset.datasetUrl) || (selectedDataset === null || selectedDataset === void 0 ? void 0 : selectedDataset.identifier),
      presentation: "inline",
      dataset: selectedDataset,
      onClose: handleCloseModal,
      sessionWebId: webId,
      userName: userName,
      userEmail: userEmail,
      datasets: datasets,
      onEditClick: handleEditClick,
      onDeleteClick: handleDeleteClick,
      statisticsConfig: effectiveStatisticsConfig
    }) : null,
    actions: t => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "catalog-button catalog-button--primary",
      onClick: () => setShowNewDatasetModal(true),
      disabled: !isLoggedIn,
      title: t(isLoggedIn ? "Add a new dataset" : "Please log in to add datasets")
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-plus mr-2"
    }), t("Add entry")), /*#__PURE__*/React.createElement("button", {
      className: "catalog-button",
      disabled: !registry.url,
      onClick: () => setShowPublicData(true)
    }, t("Query data")), isPrivateRegistry && isLoggedIn && /*#__PURE__*/React.createElement("button", {
      className: "catalog-button",
      onClick: () => setShowRegistryModal(true),
      title: t("Manage private registry members")
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-users mr-2"
    }), t("Private Registry")))
  }), showSemanticSearch && registry.url && /*#__PURE__*/React.createElement(SemanticSearchModal, {
    key: "search:".concat(webId, ":").concat(registry.url),
    registryUrl: registry.url,
    onClose: closeSemanticSearch,
    suspended: showDetailModal || showEditModal || showDeleteModal,
    onOpenDataset: openSearchDataset,
    datasetOpenError: datasetOpenError
  }), showNewDatasetModal && /*#__PURE__*/React.createElement(CatalogEntryAddModal, {
    datasets: datasets,
    onClose: handleCloseModal,
    fetchDatasets: fetchDatasets
  }), showDeleteModal && /*#__PURE__*/React.createElement(DatasetDeleteModal, {
    onClose: handleCloseNestedModal,
    onDeleted: handleCloseModal,
    dataset: selectedDataset,
    fetchDatasets: fetchDatasets
  }), showRegistryModal && /*#__PURE__*/React.createElement(PrivateRegistryModal, {
    onClose: () => setShowRegistryModal(false),
    onSaved: fetchDatasets
  }), showEditModal && /*#__PURE__*/React.createElement(DatasetEditModal, {
    dataset: selectedDataset,
    onClose: handleCloseNestedModal,
    fetchDatasets: fetchDatasets
  }), showPublicData && /*#__PURE__*/React.createElement(PublicDataExplorer, {
    onClose: () => setShowPublicData(false),
    onPublish: isLoggedIn ? input => {
      setShowPublicData(false);
      setApiServiceForm(input);
    } : undefined
  }), apiServiceForm && /*#__PURE__*/React.createElement(ApiServiceModal, {
    initial: apiServiceForm,
    datasets: datasets,
    onSaved: fetchDatasets,
    onClose: () => {
      setApiServiceForm(null);
      handleCloseModal();
    }
  }), /*#__PURE__*/React.createElement(CatalogSurvey, {
    session: session,
    webId: webId,
    statisticsConfig: effectiveStatisticsConfig,
    catalogSurface: embedded ? CATALOG_SURFACES.embedded : CATALOG_SURFACES.standalone,
    authenticated: isLoggedIn && Boolean(webId)
  }), !embedded && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "footer-spacer"
  }), /*#__PURE__*/React.createElement(FooterBar, null))));
};

function SemanticDataCatalogEmbed(_ref) {
  var {
    webId,
    language,
    statisticsConfig,
    datasetUrl
  } = _ref;
  return /*#__PURE__*/React.createElement(App, {
    embedded: true,
    webIdOverride: webId,
    datasetUrl: datasetUrl,
    language: language,
    statisticsConfig: statisticsConfig
  });
}

function SemanticSearchEmbed(_ref) {
  var {
    language,
    onOpenDataset,
    apiBaseUrl
  } = _ref;
  return /*#__PURE__*/React.createElement(I18nProvider, {
    language: language
  }, /*#__PURE__*/React.createElement(SemanticSearch, {
    embedded: true,
    onOpenDataset: onOpenDataset,
    apiBaseUrl: apiBaseUrl
  }));
}

export { SemanticDataCatalogEmbed as CatalogEmbed, SemanticDataCatalogEmbed, SemanticSearchEmbed, appVersion as catalogVersion, setSession };
//# sourceMappingURL=index.js.map
