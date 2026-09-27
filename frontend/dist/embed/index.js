import React, { useState, useMemo, useRef, useCallback, useEffect, useContext, createContext } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Session } from '@inrupt/solid-client-authn-browser';
import { getSolidDataset as getSolidDataset$1, getThing, getUrlAll, getStringNoLocale, getDatetime, getUrl, getThingAll, getStringWithLocaleAll, addUrl, setThing, saveSolidDatasetAt, getContainedResourceUrlAll, deleteFile, createThing, removeAll, setStringNoLocale, setUrl, createSolidDataset, setDatetime, setPublicResourceAccess, saveAclFor, createContainerAt, hasResourceAcl, hasAccessibleAcl, createAclFromFallbackAcl, getResourceAcl, getPublicResourceAccess, getSolidDatasetWithAcl, getFileWithAcl, getAgentAccess, overwriteFile } from '@inrupt/solid-client';
import { DCAT, RDF, DCTERMS, FOAF, VCARD, LDP } from '@inrupt/vocab-common-rdf';
import require$$0 from 'buffer';
import { Parser as Parser$1 } from 'n3';
import { Network } from 'vis-network';

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

var SearchBar = _ref => {
  var {
    onSearch
  } = _ref;
  var [searchQuery, setSearchQuery] = useState('');
  var handleSearchChange = event => {
    if (!event || !event.target) {
      console.warn("Search event is undefined or invalid");
      return;
    }
    var value = event.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "search-bar search-bar-container"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search datasets...",
    value: searchQuery,
    onChange: handleSearchChange
  }), /*#__PURE__*/React.createElement("i", {
    className: "fas fa-search"
  }));
};

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

var renderPublisherCell = params => params.value || "";
var DatasetTable = _ref => {
  var {
    datasets,
    onRowClick: _onRowClick,
    searchQuery
  } = _ref;
  var formatDate = dateString => {
    if (!dateString) return "";
    var date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("de-DE");
  };
  var getSeriesCount = row => {
    if (!row || row.datasetType !== "series") return "";
    return (row.seriesMembers || []).length;
  };
  var columns = [{
    field: "datasetType",
    headerName: "Type",
    minWidth: 120,
    sortable: false,
    renderCell: params => {
      var type = params.value || "dataset";
      return /*#__PURE__*/React.createElement("span", {
        className: "badge ".concat(type === "series" ? "badge-info" : "badge-light")
      }, type === "series" ? "Series" : "Dataset");
    }
  }, {
    field: "seriesCount",
    headerName: "Members",
    minWidth: 120,
    sortable: false,
    filterable: false,
    valueGetter: (value, row) => getSeriesCount(row || (value === null || value === void 0 ? void 0 : value.row) || value),
    renderCell: params => {
      var dataset = params === null || params === void 0 ? void 0 : params.row;
      if (!dataset || dataset.datasetType !== "series") {
        return /*#__PURE__*/React.createElement("span", {
          className: "text-muted"
        }, "-");
      }
      var count = (dataset.seriesMembers || []).length;
      return /*#__PURE__*/React.createElement("span", {
        className: "badge badge-pill badge-secondary"
      }, count, " ", count === 1 ? "Member" : "Members");
    }
  }, {
    field: "title",
    headerName: "Title",
    flex: 1,
    minWidth: 200,
    cellClassName: "grid-cell-title",
    renderCell: params => /*#__PURE__*/React.createElement("span", {
      className: "grid-title",
      translate: "no"
    }, params.value)
  }, {
    field: "description",
    headerName: "Description",
    flex: 2,
    minWidth: 240,
    cellClassName: "grid-cell-desc",
    renderCell: params => /*#__PURE__*/React.createElement("span", {
      translate: "no"
    }, params.value)
  }, {
    field: "issued",
    headerName: "Issued Date",
    minWidth: 140,
    cellClassName: "grid-cell-meta",
    valueFormatter: value => formatDate(value)
  }, {
    field: "modified",
    headerName: "Modified Date",
    minWidth: 170,
    cellClassName: "grid-cell-meta",
    valueFormatter: value => formatDate(value)
  }, {
    field: "publisher",
    headerName: "Publisher",
    flex: 1,
    minWidth: 180,
    cellClassName: "grid-cell-meta",
    renderCell: params => /*#__PURE__*/React.createElement("span", {
      translate: "no"
    }, renderPublisherCell(params))
  }, {
    field: "contact_point",
    headerName: "Contact",
    flex: 1,
    minWidth: 200,
    cellClassName: "grid-cell-meta",
    renderCell: params => {
      var _params$row;
      var href = getContactPointHref(params.value, (_params$row = params.row) === null || _params$row === void 0 ? void 0 : _params$row.contact_point_type);
      if (!href) return /*#__PURE__*/React.createElement("span", {
        translate: "no"
      }, params.value || "");
      var isWeb = href.startsWith("http");
      return /*#__PURE__*/React.createElement("a", {
        href: href,
        translate: "no",
        target: isWeb ? "_blank" : undefined,
        rel: isWeb ? "noopener noreferrer" : undefined,
        onClick: event => event.stopPropagation()
      }, params.value);
    }
  }, {
    field: "access",
    headerName: "Access Rights",
    minWidth: 130,
    sortable: false,
    filterable: false,
    renderCell: params => {
      var dataset = params.row;
      if (!dataset) return null;
      if (dataset.datasetType === "series") {
        return /*#__PURE__*/React.createElement("span", {
          className: "text-muted"
        }, "\u2014");
      }
      if (dataset.is_public) {
        return /*#__PURE__*/React.createElement("i", {
          className: "fa-solid fa-globe",
          title: "Public"
        });
      }
      if (dataset.userHasAccess) {
        return /*#__PURE__*/React.createElement("span", {
          className: "access-lock-pair",
          title: "Restricted (You have access)"
        }, /*#__PURE__*/React.createElement("i", {
          className: "fa-solid fa-lock text-danger"
        }), /*#__PURE__*/React.createElement("span", {
          className: "access-lock-divider"
        }, "("), /*#__PURE__*/React.createElement("i", {
          className: "fa-solid fa-lock-open text-success"
        }), /*#__PURE__*/React.createElement("span", {
          className: "access-lock-divider"
        }, ")"));
      }
      return /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-lock text-danger",
        title: "Restricted"
      });
    }
  }];
  return /*#__PURE__*/React.createElement(Box, {
    className: "dataset-grid"
  }, /*#__PURE__*/React.createElement(DataGrid, {
    rows: datasets,
    columns: columns,
    getRowId: row => row.identifier || row.datasetUrl,
    autoHeight: true,
    disableRowSelectionOnClick: true,
    pageSizeOptions: [10, 25, 50],
    getRowHeight: () => "auto",
    columnHeaderHeight: 82,
    initialState: {
      pagination: {
        paginationModel: {
          pageSize: 10,
          page: 0
        }
      }
    },
    filterModel: {
      items: [],
      quickFilterValues: searchQuery ? [searchQuery] : []
    },
    getRowClassName: params => {
      var _params$row2;
      var base = params.indexRelativeToCurrentPage % 2 === 0 ? "grid-row-even" : "grid-row-odd";
      return (_params$row2 = params.row) !== null && _params$row2 !== void 0 && _params$row2.isStale ? "".concat(base, " grid-row-stale") : base;
    },
    onRowClick: params => _onRowClick(params.row),
    sx: {
      border: "none",
      fontFamily: '"Manrope","Segoe UI",system-ui,-apple-system,Arial,sans-serif',
      "& .MuiDataGrid-columnHeaders": {
        backgroundColor: "#142642",
        color: "#f8fafc",
        borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
        fontWeight: 800
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontSize: "0.95rem",
        whiteSpace: "normal",
        lineHeight: 1.2
      },
      "& .MuiDataGrid-cell": {
        color: "#0f172a",
        borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
        fontSize: "0.92rem",
        whiteSpace: "normal",
        lineHeight: 1.6,
        alignItems: "flex-start",
        py: 2.1
      },
      "& .MuiDataGrid-row": {
        maxHeight: "none !important"
      },
      "& .MuiDataGrid-columnHeader": {
        alignItems: "flex-start",
        paddingTop: "12px"
      },
      "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
        backgroundColor: "#eaf2ff"
      },
      "& .MuiDataGrid-footerContainer": {
        borderTop: "1px solid rgba(255, 255, 255, 0.22)",
        color: "#cbd5f5",
        backgroundColor: "#142642"
      },
      "& .MuiTablePagination-toolbar": {
        flexWrap: "nowrap",
        alignItems: "center",
        gap: "10px"
      },
      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
        margin: 0
      },
      "& .MuiTablePagination-root": {
        color: "#cbd5f5"
      },
      "& .MuiDataGrid-iconButtonContainer .MuiButtonBase-root": {
        color: "#cbd5f5"
      },
      "& .MuiDataGrid-columnSeparator": {
        color: "rgba(255, 255, 255, 0.35)"
      },
      "& .MuiDataGrid-menuIconButton": {
        color: "#cbd5f5"
      },
      "& .MuiDataGrid-sortIcon": {
        color: "#cbd5f5"
      }
    }
  }));
};

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

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
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
var SDP_NS = "https://w3id.org/solid-dcat-profile#";
var SDP_CATALOG = "".concat(SDP_NS, "catalog");
var SDM_NS$1 = "https://w3id.org/solid-dataspace-manager#";
var SDM_REGISTRY_MODE = "".concat(SDM_NS$1, "registryMode");
var SDM_REGISTRY = "".concat(SDM_NS$1, "registry");
var SDM_PRIVATE_REGISTRY = "".concat(SDM_NS$1, "privateRegistry");
var SDM_CHANGELOG = "".concat(SDM_NS$1, "changeLog");
var SDM_CHANGE_EVENT = "".concat(SDM_NS$1, "ChangeEvent");
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
    if (thing) return thing;
  }
  return getThingByTypes(datasetDoc, [DCAT.Dataset, DCAT.DatasetSeries]) || getThingAll(datasetDoc)[0] || null;
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
  if (!types.includes(DCAT.Catalog)) {
    throw new Error("Catalog document does not contain the expected dcat:Catalog resource.");
  }
  return {
    title: values(DCTERMS.title)[0] || "Solid Dataspace Catalog",
    description: values(DCTERMS.description)[0] || "",
    contactPoint: values(DCAT.contactPoint)[0] || "",
    datasetRefs: Array.from(new Set(values(DCAT.dataset).map(url => toCatalogDatasetRef(catalogDocUrl, url)))),
    recordRefs: Array.from(new Set(values(DCAT.record).map(url => toCatalogDatasetRef(catalogDocUrl, url))))
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
    for (var attempt = 0; attempt < CATALOG_CAS_MAX_ATTEMPTS; attempt += 1) {
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
      var response = yield session.fetch(catalogDocUrl, {
        method: "PUT",
        headers: _objectSpread2$2({
          "Content-Type": "text/turtle"
        }, snapshot.exists ? {
          "If-Match": snapshot.etag
        } : {
          "If-None-Match": "*"
        }),
        body: turtle,
        redirect: "error"
      });
      assertExactCatalogResponse(response, catalogDocUrl, "write");
      if (response.ok) {
        return {
          datasetRefs,
          created: !snapshot.exists
        };
      }
      if (!CATALOG_CONFLICT_STATUSES.has(response.status)) {
        throw new Error("Failed to write catalog document (".concat(response.status, ")."));
      }
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
var COMMON_PREFIXES = {
  dcat: "http://www.w3.org/ns/dcat#",
  dcterms: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#"
};
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
var DISTRIBUTION_ACCESS_TYPES = {
  download: "download",
  access: "access"
};
var normalizeDistributionAccessType = value => value === DISTRIBUTION_ACCESS_TYPES.access ? DISTRIBUTION_ACCESS_TYPES.access : DISTRIBUTION_ACCESS_TYPES.download;
var validateDatasetInput = input => {
  if (!(input !== null && input !== void 0 && input.access_url_dataset)) {
    throw new Error("Dataset distribution URL is required (dcat:downloadURL or dcat:accessURL).");
  }
  if (normalizeDistributionAccessType(input === null || input === void 0 ? void 0 : input.distribution_access_type) === DISTRIBUTION_ACCESS_TYPES.access && !(input !== null && input !== void 0 && input.is_public)) {
    throw new Error("Public external links are supported only for public datasets.");
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
var getResourceWithAcl = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(function* (url, fetch) {
    try {
      return yield getSolidDatasetWithAcl(url, {
        fetch
      });
    } catch (datasetErr) {
      try {
        return yield getFileWithAcl(url, {
          fetch
        });
      } catch (fileErr) {
        throw isNotFound(datasetErr) ? datasetErr : fileErr;
      }
    }
  });
  return function getResourceWithAcl(_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();
var getResourceAndAcl = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(function* (url, fetch) {
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
  return function getResourceAndAcl(_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}();
var setPublicReadAccess = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(function* (url, fetch, read) {
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
  return function setPublicReadAccess(_x17, _x18, _x19) {
    return _ref9.apply(this, arguments);
  };
}();
var makePublicReadable = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(function* (url, fetch) {
    try {
      yield setPublicReadAccess(url, fetch, true);
    } catch (err) {
      console.warn("Failed to set public read ACL for", url, err);
    }
  });
  return function makePublicReadable(_x20, _x21) {
    return _ref10.apply(this, arguments);
  };
}();
var setCatalogLinkInProfile = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(function* (webId, catalogUrl, fetch) {
    if (!webId || !catalogUrl) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield getSolidDataset$1(profileDocUrl, {
      fetch
    });
    var profileThing = getThing(profileDataset, webId);
    if (!profileThing) {
      profileThing = createThing({
        url: webId
      });
    }
    profileThing = removeAll(profileThing, SDP_CATALOG);
    profileThing = removeAll(profileThing, DCAT.catalog);
    profileThing = setUrl(profileThing, SDP_CATALOG, catalogUrl);
    var updatedProfile = setThing(profileDataset, profileThing);
    yield saveSolidDatasetAt(profileDocUrl, updatedProfile, {
      fetch
    });
  });
  return function setCatalogLinkInProfile(_x22, _x23, _x24) {
    return _ref11.apply(this, arguments);
  };
}();
var loadRegistryConfig = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(function* (webId, fetch) {
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
      var profileDataset = yield getSolidDataset$1(profileDocUrl, {
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
  return function loadRegistryConfig(_x25, _x26) {
    return _ref12.apply(this, arguments);
  };
}();
var saveRegistryConfig = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(function* (webId, fetch, config) {
    var {
      podRoot = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!webId || !fetch) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield getSolidDataset$1(profileDocUrl, {
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
  return function saveRegistryConfig(_x27, _x28, _x29) {
    return _ref13.apply(this, arguments);
  };
}();
var ensureRegistryContainer = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(function* (containerUrl, fetch) {
    yield ensureContainer(containerUrl, fetch);
    yield makePublicReadable(containerUrl, fetch);
  });
  return function ensureRegistryContainer(_x30, _x31) {
    return _ref14.apply(this, arguments);
  };
}();
var ensurePrivateRegistryContainer = /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator(function* (webId, fetch, privateRegistryUrl) {
    var {
      podRoot = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!webId || !fetch) return "";
    var target = normalizeContainerUrl$2(privateRegistryUrl || buildDefaultPrivateRegistry(webId, podRoot));
    if (!target) return "";
    yield ensureRegistryContainer(target, fetch);
    return target;
  });
  return function ensurePrivateRegistryContainer(_x32, _x33, _x34) {
    return _ref15.apply(this, arguments);
  };
}();
var resolveRegistryConfig = /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator(function* (webId, fetch, override) {
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
  return function resolveRegistryConfig(_x35, _x36, _x37) {
    return _ref16.apply(this, arguments);
  };
}();
var registerWebIdInRegistryContainer = /*#__PURE__*/function () {
  var _ref17 = _asyncToGenerator(function* (containerUrl, fetch, memberWebId) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !memberWebId) return;
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield getSolidDataset$1(normalizedUrl, {
      fetch
    });
    var resources = getContainedResourceUrlAll(containerDataset);
    for (var resourceUrl of resources) {
      try {
        var memberDataset = yield getSolidDataset$1(resourceUrl, {
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
  return function registerWebIdInRegistryContainer(_x38, _x39, _x40) {
    return _ref17.apply(this, arguments);
  };
}();
var registerWebIdInRegistries = /*#__PURE__*/function () {
  var _ref18 = _asyncToGenerator(function* (webId, fetch, registryConfig) {
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
  return function registerWebIdInRegistries(_x41, _x42, _x43) {
    return _ref18.apply(this, arguments);
  };
}();
var loadRegistryMembersFromContainer = /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator(function* (containerUrl, fetch) {
    var {
      onLoadError
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !fetch) return [];
    try {
      var containerDataset = yield getSolidDataset$1(normalizedUrl, {
        fetch
      });
      var resourceUrls = getContainedResourceUrlAll(containerDataset);
      var members = new Set();
      for (var resourceUrl of resourceUrls) {
        try {
          var memberDataset = yield getSolidDataset$1(resourceUrl, {
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
  return function loadRegistryMembersFromContainer(_x44, _x45) {
    return _ref19.apply(this, arguments);
  };
}();
var syncRegistryMembersInContainer = /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator(function* (containerUrl, fetch, members) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl$2(containerUrl);
    if (!normalizedUrl || !fetch) return;
    var cleanedMembers = Array.from(new Set((members || []).map(m => (m || "").trim()).filter(Boolean)));
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield getSolidDataset$1(normalizedUrl, {
      fetch
    });
    var resourceUrls = getContainedResourceUrlAll(containerDataset);
    var existing = new Map();
    for (var resourceUrl of resourceUrls) {
      try {
        var memberDataset = yield getSolidDataset$1(resourceUrl, {
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
  return function syncRegistryMembersInContainer(_x46, _x47, _x48) {
    return _ref20.apply(this, arguments);
  };
}();
var ensureCatalogStructure = /*#__PURE__*/function () {
  var _ref21 = _asyncToGenerator(function* (session) {
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
  return function ensureCatalogStructure(_x49) {
    return _ref21.apply(this, arguments);
  };
}();
var resolveCatalogUrlFromWebId = /*#__PURE__*/function () {
  var _ref24 = _asyncToGenerator(function* (webId, fetch) {
    if (!webId || !fetch) return getCatalogResourceUrl(webId);
    try {
      var profileDocUrl = webId.split("#")[0];
      var profileDoc = yield getSolidDataset$1(profileDocUrl, {
        fetch
      });
      var profileThing = getThing(profileDoc, webId);
      var profileCatalog = profileThing ? getUrl(profileThing, SDP_CATALOG) || getUrl(profileThing, DCAT.catalog) : null;
      if (profileCatalog) return profileCatalog;
    } catch (err) {
      console.warn("Failed to resolve catalog URL from profile:", err);
    }
    return getCatalogResourceUrl(webId);
  });
  return function resolveCatalogUrlFromWebId(_x53, _x54) {
    return _ref24.apply(this, arguments);
  };
}();
var loadRegistryMembers = /*#__PURE__*/function () {
  var _ref25 = _asyncToGenerator(function* (webId, fetch) {
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
        var containerDataset = yield getSolidDataset$1(containerUrl, {
          fetch
        });
        var resourceUrls = getContainedResourceUrlAll(containerDataset);
        for (var resourceUrl of resourceUrls) {
          try {
            var memberDataset = yield getSolidDataset$1(resourceUrl, {
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
  return function loadRegistryMembers(_x55, _x56) {
    return _ref25.apply(this, arguments);
  };
}();
var parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  var _datasetDoc$internal_;
  var datasetThing = resolveDatasetThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;
  var baseIri = (datasetDoc === null || datasetDoc === void 0 || (_datasetDoc$internal_ = datasetDoc.internal_resourceInfo) === null || _datasetDoc$internal_ === void 0 ? void 0 : _datasetDoc$internal_.sourceIri) || getDocumentUrl(datasetUrl);
  var identifier = getStringNoLocale(datasetThing, DCTERMS.identifier) || datasetUrl;
  var types = getUrlAll(datasetThing, RDF.type) || [];
  var seriesMembersRaw = safeGetUrlAll(datasetThing, DCAT_SERIES_MEMBER);
  var isSeries = types.includes(DCAT_DATASET_SERIES) || types.includes(DCAT.DatasetSeries) || types.includes("http://www.w3.org/ns/dcat#DatasetSeries") || seriesMembersRaw.length > 0;
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
  var theme = getStringNoLocale(datasetThing, DCAT.theme) || getUrl(datasetThing, DCAT.theme) || "";
  if (!theme) {
    theme = getAnyString(datasetThing, DCAT.theme) || "";
  }
  var accessRights = getStringNoLocale(datasetThing, DCTERMS.accessRights) || "";
  var contactRef = getUrl(datasetThing, DCAT.contactPoint) || "";
  var contactLiteral = getStringNoLocale(datasetThing, DCAT.contactPoint) || getAnyString(datasetThing, DCAT.contactPoint) || "";
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
  var conformsTo = getUrl(datasetThing, DCTERMS.conformsTo) || getUrl(datasetThing, LEGACY_DCAT_CONFORMS_TO) || "";
  var distributions = safeGetUrlAll(datasetThing, DCAT.distribution);
  var accessUrlDataset = "";
  var accessUrlModel = "";
  var fileFormat = "";
  var distributionAccessType = DISTRIBUTION_ACCESS_TYPES.download;
  distributions.forEach(distUrl => {
    var resolvedDistUrl = resolveUrl(distUrl, baseIri);
    var distThing = getThing(datasetDoc, resolvedDistUrl) || getThing(datasetDoc, distUrl);
    if (!distThing) return;
    var rawDownloadUrl = getUrl(distThing, DCAT.downloadURL) || "";
    var rawAccessUrl = getUrl(distThing, DCAT.accessURL) || "";
    var distributionUrl = resolveUrl(rawDownloadUrl || rawAccessUrl || "", baseIri);
    var mediaType = getStringNoLocale(distThing, DCAT.mediaType) || getStringNoLocale(distThing, DCTERMS.format) || getAnyString(distThing, DCTERMS.format) || "";
    if (!accessUrlDataset) {
      accessUrlDataset = distributionUrl;
      fileFormat = mediaType;
      distributionAccessType = rawDownloadUrl ? DISTRIBUTION_ACCESS_TYPES.download : DISTRIBUTION_ACCESS_TYPES.access;
    }
  });
  if (conformsTo) {
    accessUrlModel = conformsTo;
  }
  var isPublic = (accessRights || "").toLowerCase() === "public";
  var seriesMembers = isSeries ? seriesMembersRaw : [];
  var inSeries = !isSeries ? safeGetUrlAll(datasetThing, DCAT_IN_SERIES) : [];
  return {
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
    file_format: fileFormat,
    distribution_access_type: distributionAccessType,
    theme,
    is_public: isPublic,
    webid: creator,
    datasetUrl,
    datasetType: isSeries ? "series" : "dataset",
    seriesMembers,
    inSeries
  };
};
var loadCatalogDatasets = /*#__PURE__*/function () {
  var _ref26 = _asyncToGenerator(function* (catalogUrl, fetch, onLoadError) {
    var catalogDocUrl = getDocumentUrl(catalogUrl);
    var catalogDataset = yield getSolidDataset$1(catalogDocUrl, {
      fetch
    });
    var catalogThing = getThing(catalogDataset, catalogUrl);
    var datasetUrls = catalogThing ? safeGetUrlAll(catalogThing, DCAT.dataset) : [];
    var resolvedUrls = Array.from(new Set(datasetUrls)).map(url => resolveUrl(url, catalogDocUrl)).filter(Boolean);
    var datasets = yield Promise.all(resolvedUrls.map(/*#__PURE__*/function () {
      var _ref27 = _asyncToGenerator(function* (datasetUrl) {
        try {
          var datasetDoc = yield getSolidDataset$1(getDocumentUrl(datasetUrl), {
            fetch
          });
          return parseDatasetFromDoc(datasetDoc, datasetUrl);
        } catch (err) {
          console.warn("Failed to load dataset", datasetUrl, err);
          onLoadError === null || onLoadError === void 0 || onLoadError(err, {
            stage: "dataset"
          });
          return null;
        }
      });
      return function (_x60) {
        return _ref27.apply(this, arguments);
      };
    }()));
    return datasets.filter(Boolean);
  });
  return function loadCatalogDatasets(_x57, _x58, _x59) {
    return _ref26.apply(this, arguments);
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
    if (nextModified >= existingModified) {
      map.set(key, dataset);
    }
  });
  return Array.from(map.values());
};
var loadAggregatedDatasets = /*#__PURE__*/function () {
  var _ref28 = _asyncToGenerator(function* (session, fetchOverride) {
    var _session$info3;
    var {
      researchRegistries,
      onLoadError,
      usePublicCache = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var webId = (session === null || session === void 0 || (_session$info3 = session.info) === null || _session$info3 === void 0 ? void 0 : _session$info3.webId) || "";
    var fetch = fetchOverride || (session === null || session === void 0 ? void 0 : session.fetch) || (typeof window !== "undefined" ? window.fetch.bind(window) : fetchOverride);
    if (!fetch) return {
      datasets: [],
      catalogs: []
    };
    var snapshots = [];
    var selectedRegistries = researchRegistries;
    if (usePublicCache) {
      if (!Array.isArray(selectedRegistries)) {
        var registryConfig = yield loadRegistryConfig(webId, fetch, {
          onLoadError
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
          onLoadError
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
      if (!Array.isArray(researchRegistries) && webId && !registryMembers.includes(webId)) registryMembers.push(webId);
    } else {
      registryMembers = yield loadRegistryMembers(webId, fetch, {
        onLoadError
      });
    }
    var catalogUrls = yield Promise.all(registryMembers.map(member => member !== webId && cachedCatalogs.get(member) || resolveCatalogUrlFromWebId(member, fetch)));
    if (snapshots.length) {
      var _session$info4;
      var ownIndex = registryMembers.indexOf(webId);
      fetch = cachedCatalogFetch(snapshots, fetch, {
        ownCatalogUrl: catalogUrls[ownIndex],
        isLoggedIn: Boolean(session === null || session === void 0 || (_session$info4 = session.info) === null || _session$info4 === void 0 ? void 0 : _session$info4.isLoggedIn)
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
      var _ref29 = _asyncToGenerator(function* (catalogUrl) {
        try {
          var datasets = yield loadCatalogDatasets(catalogUrl, fetch, onLoadError);
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
          onLoadError === null || onLoadError === void 0 || onLoadError(err, {
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
      return function fetchCatalog(_x63) {
        return _ref29.apply(this, arguments);
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
        lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : "",
        isStale: Boolean(stale)
      }));
    });
    return {
      datasets: mergeDatasets(annotated),
      catalogs: uniqueCatalogUrls
    };
  });
  return function loadAggregatedDatasets(_x61, _x62) {
    return _ref28.apply(this, arguments);
  };
}();
var DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";
var DCAT_DATASET_SERIES = "http://www.w3.org/ns/dcat#DatasetSeries";
var DCAT_SERIES_MEMBER = DCAT.seriesMember || "http://www.w3.org/ns/dcat#seriesMember";
var DCAT_IN_SERIES = DCAT.inSeries || "http://www.w3.org/ns/dcat#inSeries";
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
var buildDatasetResource = (datasetDocUrl, input) => {
  var datasetUrl = "".concat(datasetDocUrl, "#it");
  var datasetThing = createThing({
    url: datasetUrl
  });
  datasetThing = addUrl(datasetThing, RDF.type, DCAT.Dataset);
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
  datasetThing = removeAll(datasetThing, DCAT.theme);
  if (input.theme) {
    datasetThing = setUrl(datasetThing, DCAT.theme, toThemeIri(input.theme));
  }
  datasetThing = removeAll(datasetThing, DCTERMS.conformsTo);
  datasetThing = removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  if (input.access_url_semantic_model) {
    datasetThing = setUrl(datasetThing, DCTERMS.conformsTo, input.access_url_semantic_model);
  }
  datasetThing = removeAll(datasetThing, DCTERMS.accessRights);
  datasetThing = setStringNoLocale(datasetThing, DCTERMS.accessRights, input.is_public ? "public" : "restricted");
  datasetThing = removeAll(datasetThing, DCAT_IN_SERIES);
  if (input.in_series) {
    var seriesList = Array.isArray(input.in_series) ? input.in_series : [input.in_series];
    seriesList.filter(Boolean).forEach(seriesUrl => {
      datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }
  return datasetThing;
};
var buildSeriesResource = (seriesDocUrl, input) => {
  var seriesUrl = input.seriesUrl || "".concat(seriesDocUrl, "#it");
  var seriesThing = createThing({
    url: seriesUrl
  });
  seriesThing = addUrl(seriesThing, RDF.type, DCAT_DATASET_SERIES);
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
  seriesThing = removeAll(seriesThing, DCAT.contactPoint);
  if (input.contact_point || input.contact_url) {
    var contactThing = buildContactThing(seriesDocUrl, input);
    input.__contactThing = contactThing;
    seriesThing = setUrl(seriesThing, DCAT.contactPoint, contactThing.url);
  }
  if (input.publisher_url && input.publisher) {
    input.__publisherThing = buildPublisherThing(input);
  }
  seriesThing = removeAll(seriesThing, DCAT.theme);
  if (input.theme) {
    seriesThing = setUrl(seriesThing, DCAT.theme, toThemeIri(input.theme));
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
var buildDistributionThing = (datasetDocUrl, slug, distributionUrl, mediaType, distributionAccessType) => {
  if (!distributionUrl) return null;
  var distUrl = "".concat(datasetDocUrl, "#").concat(slug);
  var distThing = createThing({
    url: distUrl
  });
  var linkType = normalizeDistributionAccessType(distributionAccessType);
  distThing = addUrl(distThing, RDF.type, DCAT.Distribution);
  distThing = removeAll(distThing, DCAT.downloadURL);
  distThing = removeAll(distThing, DCAT.accessURL);
  distThing = linkType === DISTRIBUTION_ACCESS_TYPES.access ? setUrl(distThing, DCAT.accessURL, distributionUrl) : setUrl(distThing, DCAT.downloadURL, distributionUrl);
  distThing = removeAll(distThing, DCAT.mediaType);
  if (mediaType) {
    distThing = setStringNoLocale(distThing, DCAT.mediaType, mediaType);
  }
  return distThing;
};
var addLdpTypeIfLocal = function addLdpTypeIfLocal(solidDataset, webId, targetUrl) {
  var podRootOverride = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  if (!solidDataset || !webId || !targetUrl) return solidDataset;
  if (!isLocalPodResource(webId, targetUrl, podRootOverride)) return solidDataset;
  var isContainer = targetUrl.endsWith("/");
  var resourceThing = createThing({
    url: targetUrl
  });
  resourceThing = addUrl(resourceThing, RDF.type, LDP.Resource);
  if (isContainer) {
    resourceThing = addUrl(resourceThing, RDF.type, LDP.Container);
  }
  return setThing(solidDataset, resourceThing);
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
    var _session$info5;
    var {
      podRoot = ""
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!(session !== null && session !== void 0 && (_session$info5 = session.info) !== null && _session$info5 !== void 0 && _session$info5.webId) || typeof session.fetch !== "function") {
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
  return function ensurePublicReadOnlyResourceAccess(_x64, _x65) {
    return _ref30.apply(this, arguments);
  };
}();
var ensureRestrictedResourceAccess = /*#__PURE__*/function () {
  var _ref31 = _asyncToGenerator(function* (session, resourceUrl) {
    var _session$info6;
    var {
      podRoot = ""
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!(session !== null && session !== void 0 && (_session$info6 = session.info) !== null && _session$info6 !== void 0 && _session$info6.webId) || typeof session.fetch !== "function") {
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
  return function ensureRestrictedResourceAccess(_x66, _x67) {
    return _ref31.apply(this, arguments);
  };
}();
var syncLinkedResourceAccess = /*#__PURE__*/function () {
  var _ref32 = _asyncToGenerator(function* (session, input) {
    var urls = [input.access_url_dataset, input.access_url_semantic_model].filter(Boolean);
    for (var url of urls) {
      var _session$info7;
      if (!isLocalPodResource(session === null || session === void 0 || (_session$info7 = session.info) === null || _session$info7 === void 0 ? void 0 : _session$info7.webId, url, input.podRoot)) {
        if (input.strict_restricted_acl && !input.is_public) {
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
  return function syncLinkedResourceAccess(_x68, _x69) {
    return _ref32.apply(this, arguments);
  };
}();
var writeDatasetDocument = /*#__PURE__*/function () {
  var _ref33 = _asyncToGenerator(function* (session, datasetDocUrl, input) {
    var {
      allowCreate = true
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset$1(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      if (isNotFound(err) && allowCreate) {
        solidDataset = createSolidDataset();
      } else {
        throw err;
      }
    }
    var datasetThing = buildDatasetResource(datasetDocUrl, input);
    var publisherThing = buildPublisherThing(input);
    if (publisherThing) {
      solidDataset = setThing(solidDataset, publisherThing);
    }
    var contactThing = buildContactThing(datasetDocUrl, input);
    if (contactThing) {
      solidDataset = setThing(solidDataset, contactThing);
      datasetThing = setUrl(datasetThing, DCAT.contactPoint, contactThing.url);
    }
    var distDataset = buildDistributionThing(datasetDocUrl, "dist", input.access_url_dataset, input.file_format, input.distribution_access_type);
    if (distDataset) {
      var _session$info8;
      solidDataset = setThing(solidDataset, distDataset);
      datasetThing = addUrl(datasetThing, DCAT.distribution, distDataset.url);
      solidDataset = addLdpTypeIfLocal(solidDataset, session === null || session === void 0 || (_session$info8 = session.info) === null || _session$info8 === void 0 ? void 0 : _session$info8.webId, input.access_url_dataset, input.podRoot);
    }
    if (input.access_url_semantic_model) {
      var _session$info9;
      solidDataset = addLdpTypeIfLocal(solidDataset, session === null || session === void 0 || (_session$info9 = session.info) === null || _session$info9 === void 0 ? void 0 : _session$info9.webId, input.access_url_semantic_model, input.podRoot);
    }
    solidDataset = setThing(solidDataset, datasetThing);
    yield saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
    var head = yield session.fetch(datasetDocUrl, {
      method: "HEAD"
    });
    if (!head.ok) {
      throw new Error("Dataset write failed (".concat(head.status, ")"));
    }
    yield makePublicReadable(datasetDocUrl, session.fetch);
    yield syncLinkedResourceAccess(session, input);
  });
  return function writeDatasetDocument(_x70, _x71, _x72) {
    return _ref33.apply(this, arguments);
  };
}();
var writeSeriesDocument = /*#__PURE__*/function () {
  var _ref34 = _asyncToGenerator(function* (session, seriesDocUrl, input) {
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset$1(seriesDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      if (isNotFound(err)) {
        solidDataset = createSolidDataset();
      } else {
        throw err;
      }
    }
    var seriesThing = buildSeriesResource(seriesDocUrl, input);
    if (input.__publisherThing) {
      solidDataset = setThing(solidDataset, input.__publisherThing);
    }
    if (input.__contactThing) {
      solidDataset = setThing(solidDataset, input.__contactThing);
    }
    solidDataset = setThing(solidDataset, seriesThing);
    yield saveSolidDatasetAt(seriesDocUrl, solidDataset, {
      fetch: session.fetch
    });
    var head = yield session.fetch(seriesDocUrl, {
      method: "HEAD"
    });
    if (!head.ok) {
      throw new Error("Series write failed (".concat(head.status, ")"));
    }
    // Skip ACL update here to avoid noisy 404s on servers without WAC ACL support.
  });
  return function writeSeriesDocument(_x73, _x74, _x75) {
    return _ref34.apply(this, arguments);
  };
}();
var updateCatalogDatasets = /*#__PURE__*/function () {
  var _ref35 = _asyncToGenerator(function* (session, catalogDocUrl, datasetUrl) {
    var {
      remove
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
    yield mutateCatalogDocument(session, catalogDocUrl, current => {
      if (remove) {
        current.delete(datasetRef);
      } else {
        current.add(datasetRef);
      }
      return current;
    });
    yield makePublicReadable(catalogDocUrl, session.fetch);
  });
  return function updateCatalogDatasets(_x76, _x77, _x78) {
    return _ref35.apply(this, arguments);
  };
}();
var linkDatasetToSeries = /*#__PURE__*/function () {
  var _ref36 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset$1(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series link", datasetDocUrl, err);
      return;
    }
    var datasetThing = getThing(solidDataset, datasetUrl);
    if (!datasetThing) {
      datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
    }
    if (!datasetThing) return;
    var existing = getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
    if (existing.includes(seriesUrl)) return;
    datasetThing = addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    solidDataset = setThing(solidDataset, datasetThing);
    yield saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
    yield makePublicReadable(datasetDocUrl, session.fetch);
  });
  return function linkDatasetToSeries(_x79, _x80, _x81) {
    return _ref36.apply(this, arguments);
  };
}();
var unlinkDatasetFromSeries = /*#__PURE__*/function () {
  var _ref37 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield getSolidDataset$1(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series unlink", datasetDocUrl, err);
      return;
    }
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
    yield saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
  });
  return function unlinkDatasetFromSeries(_x82, _x83, _x84) {
    return _ref37.apply(this, arguments);
  };
}();
var writeRecordDocument = /*#__PURE__*/function () {
  var _ref38 = _asyncToGenerator(function* (session, datasetDocUrl, identifier) {
    var podRootOverride = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
    var operationId = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";
    var podRoot = podRootOverride || getPodRoot$1(session.info.webId);
    var recordDocUrl = "".concat(podRoot).concat(RECORDS_CONTAINER).concat(identifier, ".ttl");
    var recordDataset;
    try {
      recordDataset = yield getSolidDataset$1(recordDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      var _err$response6;
      if ((err === null || err === void 0 ? void 0 : err.statusCode) === 404 || (err === null || err === void 0 || (_err$response6 = err.response) === null || _err$response6 === void 0 ? void 0 : _err$response6.status) === 404) {
        recordDataset = createSolidDataset();
      } else {
        throw err;
      }
    }
    var descUrl = "".concat(recordDocUrl, "#desc");
    var existingDesc = getThing(recordDataset, descUrl);
    var existingChanges = existingDesc ? getUrlAll(existingDesc, SDM_CHANGELOG) : [];
    var descThing = createThing({
      url: descUrl
    });
    descThing = addUrl(descThing, RDF.type, DCAT.CatalogRecord);
    descThing = setStringNoLocale(descThing, DCTERMS.title, "Dataset description record");
    descThing = setStringNoLocale(descThing, DCTERMS.description, "Catalog record for dataset metadata.");
    descThing = setUrl(descThing, FOAF.primaryTopic, datasetDocUrl);
    descThing = setDatetime(descThing, DCTERMS.modified, new Date());
    var changeUrl = "".concat(recordDocUrl, "#change-").concat(operationId || Date.now());
    var changeThing = createThing({
      url: changeUrl
    });
    changeThing = addUrl(changeThing, RDF.type, SDM_CHANGE_EVENT);
    changeThing = setDatetime(changeThing, DCTERMS.modified, new Date());
    changeThing = setStringNoLocale(changeThing, DCTERMS.description, "Dataset metadata updated.");
    recordDataset = setThing(recordDataset, changeThing);
    existingChanges.forEach(url => {
      descThing = addUrl(descThing, SDM_CHANGELOG, url);
    });
    if (!existingChanges.includes(changeUrl)) {
      descThing = addUrl(descThing, SDM_CHANGELOG, changeUrl);
    }
    recordDataset = setThing(recordDataset, descThing);
    var aclUrl = "".concat(datasetDocUrl, ".acl");
    var wacUrl = "".concat(recordDocUrl, "#wac");
    var wacThing = createThing({
      url: wacUrl
    });
    wacThing = addUrl(wacThing, RDF.type, DCAT.CatalogRecord);
    wacThing = setStringNoLocale(wacThing, DCTERMS.title, "Dataset ACL record");
    wacThing = setStringNoLocale(wacThing, DCTERMS.description, "Catalog record for the dataset access control.");
    wacThing = setUrl(wacThing, FOAF.primaryTopic, aclUrl);
    wacThing = setDatetime(wacThing, DCTERMS.modified, new Date());
    recordDataset = setThing(recordDataset, wacThing);
    yield saveSolidDatasetAt(recordDocUrl, recordDataset, {
      fetch: session.fetch
    });
    yield makePublicReadable(recordDocUrl, session.fetch);
  });
  return function writeRecordDocument(_x85, _x86, _x87) {
    return _ref38.apply(this, arguments);
  };
}();
var generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dataset-".concat(Date.now());
};
var createDataset = /*#__PURE__*/function () {
  var _ref39 = _asyncToGenerator(function* (session, input) {
    var _session$info10;
    var podRoot = (input === null || input === void 0 ? void 0 : input.podRoot) || getPodRoot$1(session === null || session === void 0 || (_session$info10 = session.info) === null || _session$info10 === void 0 ? void 0 : _session$info10.webId);
    yield ensureCatalogStructure(session, {
      podRoot,
      registryConfig: input === null || input === void 0 ? void 0 : input.registryConfig
    });
    validateDatasetInput(input);
    var identifier = input.identifier || generateIdentifier();
    var datasetDocUrl = "".concat(podRoot).concat(DATASET_CONTAINER).concat(identifier, ".ttl");
    var datasetUrl = "".concat(datasetDocUrl, "#it");
    yield writeDatasetDocument(session, datasetDocUrl, _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      identifier
    }));
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), datasetUrl, {
      remove: false
    });
    yield writeRecordDocument(session, datasetDocUrl, identifier, podRoot);
    clearCache();
    return {
      datasetUrl,
      identifier
    };
  });
  return function createDataset(_x88, _x89) {
    return _ref39.apply(this, arguments);
  };
}();
var createDatasetSeries = /*#__PURE__*/function () {
  var _ref40 = _asyncToGenerator(function* (session, input) {
    var _session$info11;
    if (!(session !== null && session !== void 0 && (_session$info11 = session.info) !== null && _session$info11 !== void 0 && _session$info11.webId)) throw new Error("No Solid WebID available.");
    yield ensureCatalogStructure(session);
    var identifier = input.identifier || generateIdentifier();
    var seriesDocUrl = getSeriesDocUrl(session.info.webId, identifier);
    var seriesUrl = getSeriesResourceUrl(seriesDocUrl);
    var seriesMembers = Array.isArray(input.seriesMembers) ? input.seriesMembers.filter(memberUrl => isValidUrl(memberUrl)) : [];
    yield writeSeriesDocument(session, seriesDocUrl, _objectSpread2$2(_objectSpread2$2({}, input), {}, {
      identifier,
      seriesUrl,
      seriesMembers
    }));
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), seriesUrl, {
      remove: false
    });
    for (var memberUrl of seriesMembers) {
      yield linkDatasetToSeries(session, memberUrl, seriesUrl);
    }
    clearCache();
    return {
      seriesUrl,
      identifier
    };
  });
  return function createDatasetSeries(_x90, _x91) {
    return _ref40.apply(this, arguments);
  };
}();
var updateDataset = /*#__PURE__*/function () {
  var _ref41 = _asyncToGenerator(function* (session, input) {
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
    if (input.identifier) {
      yield writeRecordDocument(session, datasetDocUrl, input.identifier, podRoot, input.operation_id);
    }
    clearCache();
  });
  return function updateDataset(_x92, _x93) {
    return _ref41.apply(this, arguments);
  };
}();
var updateDatasetSeries = /*#__PURE__*/function () {
  var _ref42 = _asyncToGenerator(function* (session, input) {
    var seriesUrl = input.seriesUrl || input.datasetUrl;
    if (!seriesUrl) throw new Error("Missing series URL.");
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    var nextMembers = Array.isArray(input.seriesMembers) ? input.seriesMembers.filter(memberUrl => isValidUrl(memberUrl)) : [];
    var previousMembers = [];
    try {
      var seriesDoc = yield getSolidDataset$1(seriesDocUrl, {
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
  return function updateDatasetSeries(_x94, _x95) {
    return _ref42.apply(this, arguments);
  };
}();
var deleteSeriesEntry = /*#__PURE__*/function () {
  var _ref43 = _asyncToGenerator(function* (session, seriesUrl, identifier) {
    if (!seriesUrl) return;
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    var memberUrls = [];
    try {
      var seriesDoc = yield getSolidDataset$1(seriesDocUrl, {
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
  return function deleteSeriesEntry(_x96, _x97, _x98) {
    return _ref43.apply(this, arguments);
  };
}();
var deleteDatasetEntry = /*#__PURE__*/function () {
  var _ref44 = _asyncToGenerator(function* (session, datasetUrl, identifier) {
    var {
      podRoot: podRootOverride = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!datasetUrl) return;
    var podRoot = podRootOverride || getPodRoot$1(session.info.webId);
    var safeDatasetUrl = assertCatalogDatasetDeletionTarget(podRoot, datasetUrl, identifier);
    var datasetDocUrl = getDocumentUrl(safeDatasetUrl);
    try {
      var recordDocUrl = identifier ? "".concat(podRoot).concat(RECORDS_CONTAINER).concat(identifier, ".ttl") : "";
      yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), safeDatasetUrl, {
        remove: true
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
  return function deleteDatasetEntry(_x99, _x100, _x101) {
    return _ref44.apply(this, arguments);
  };
}();
var cleanupCatalogSeriesLinks = /*#__PURE__*/function () {
  var _ref45 = _asyncToGenerator(function* (session) {
    var _session$info13;
    if (!(session !== null && session !== void 0 && (_session$info13 = session.info) !== null && _session$info13 !== void 0 && _session$info13.webId)) throw new Error("No Solid WebID available.");
    var catalogDocUrl = getCatalogDocUrl(session.info.webId);
    var catalogUrl = "".concat(catalogDocUrl, "#it");
    var datasetSeriesPredicate = DCAT.datasetSeries || "http://www.w3.org/ns/dcat#datasetSeries";
    var catalogDataset = yield getSolidDataset$1(catalogDocUrl, {
      fetch: session.fetch
    });
    var catalogThing = getThing(catalogDataset, catalogUrl);
    if (!catalogThing) throw new Error("Catalog thing not found.");
    var datasetRefs = safeGetUrlAll(catalogThing, DCAT.dataset);
    var seriesRefs = safeGetUrlAll(catalogThing, datasetSeriesPredicate);
    var allRefs = Array.from(new Set([...datasetRefs, ...seriesRefs]));
    var resolvedUrls = allRefs.map(url => resolveUrl(url, catalogDocUrl)).filter(Boolean);
    var catalogDatasets = new Set(datasetRefs.map(url => toCatalogDatasetRef(catalogDocUrl, url)));
    var catalogSeries = new Set(seriesRefs.map(url => toCatalogDatasetRef(catalogDocUrl, url)));
    var finalRefs = new Set([...catalogDatasets, ...catalogSeries]);
    for (var resourceUrl of resolvedUrls) {
      try {
        var docUrl = getDocumentUrl(resourceUrl);
        var doc = yield getSolidDataset$1(docUrl, {
          fetch: session.fetch
        });
        var thing = resolveDatasetThing(doc, resourceUrl);
        if (!thing) continue;
        var types = getUrlAll(thing, RDF.type) || [];
        var isSeries = types.includes(DCAT_DATASET_SERIES) || types.includes(DCAT.DatasetSeries) || safeGetUrlAll(thing, DCAT_SERIES_MEMBER).length > 0;
        if (isSeries) {
          finalRefs.add(toCatalogDatasetRef(catalogDocUrl, resourceUrl));
          var members = safeGetUrlAll(thing, DCAT_SERIES_MEMBER);
          for (var memberUrl of members) {
            var resolvedMember = resolveUrl(memberUrl, docUrl);
            yield linkDatasetToSeries(session, resolvedMember, resourceUrl);
          }
        } else {
          finalRefs.add(toCatalogDatasetRef(catalogDocUrl, resourceUrl));
        }
      } catch (err) {
        console.warn("Cleanup failed for resource", resourceUrl, err);
      }
    }
    yield mutateCatalogDocument(session, catalogDocUrl, current => {
      finalRefs.forEach(ref => current.add(ref));
      return current;
    });
    yield makePublicReadable(catalogDocUrl, session.fetch);
    clearCache();
  });
  return function cleanupCatalogSeriesLinks(_x102) {
    return _ref45.apply(this, arguments);
  };
}();
var parseTurtleIntoStore = /*#__PURE__*/function () {
  var _ref46 = _asyncToGenerator(function* (store, turtle, baseIRI) {
    return new Promise((resolve, reject) => {
      var parser = new Parser({
        baseIRI
      });
      parser.parse(turtle, (err, quad) => {
        if (err) {
          reject(err);
          return;
        }
        if (quad) {
          store.addQuad(quad);
          return;
        }
        resolve();
      });
    });
  });
  return function parseTurtleIntoStore(_x103, _x104, _x105) {
    return _ref46.apply(this, arguments);
  };
}();
var createQuadStore = () => {
  var quads = [];
  return {
    addQuad: quad => quads.push(quad),
    getQuads: () => quads
  };
};
var buildMergedCatalogDownload = /*#__PURE__*/function () {
  var _ref47 = _asyncToGenerator(function* (session) {
    var {
      catalogs = [],
      datasets = []
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var fetch = (session === null || session === void 0 ? void 0 : session.fetch) || (typeof window !== "undefined" ? window.fetch.bind(window) : null);
    if (!fetch) throw new Error("No fetch available.");
    var store = createQuadStore();
    var docUrls = new Set();
    (catalogs || []).forEach(catalogUrl => {
      if (catalogUrl) docUrls.add(getDocumentUrl(catalogUrl));
    });
    (datasets || []).forEach(dataset => {
      if (dataset !== null && dataset !== void 0 && dataset.datasetUrl) docUrls.add(getDocumentUrl(dataset.datasetUrl));
    });
    for (var docUrl of docUrls) {
      try {
        var res = yield fetch(docUrl, {
          headers: {
            Accept: "text/turtle"
          }
        });
        if (!res.ok) {
          console.warn("Failed to fetch catalog/data doc", docUrl, res.status);
          continue;
        }
        var turtle = yield res.text();
        yield parseTurtleIntoStore(store, turtle, docUrl);
      } catch (err) {
        console.warn("Failed to parse catalog/data doc", docUrl, err);
      }
    }
    var writer = new Writer({
      prefixes: COMMON_PREFIXES
    });
    writer.addQuads(store.getQuads(null, null, null, null));
    return new Promise((resolve, reject) => {
      writer.end((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  });
  return function buildMergedCatalogDownload(_x106) {
    return _ref47.apply(this, arguments);
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
        var dataset = yield getSolidDataset$1(normalizedUrl, {
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
    onClick: handleCloseFolderModal
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
        var dataset = yield getSolidDataset$1(normalizedUrl, {
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
  var [showSemanticModel, setShowSemanticModel] = useState(false);

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
  var requiresPublicAccess = datasetSource === "external" || !isAutomaticSeries && modelSource === "external";
  useEffect(() => {
    if (!requiresPublicAccess || newDataset.is_public) return;
    setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      is_public: true
    }));
  }, [requiresPublicAccess, newDataset.is_public]);
  useEffect(() => {
    if (!isAutomaticSeries) return;
    setShowSemanticModel(false);
    setModelSource("upload");
    setModelUpload({
      file: null,
      url: "",
      error: ""
    });
    setNewDataset(prev => prev.access_url_semantic_model ? _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
      access_url_semantic_model: ""
    }) : prev);
  }, [isAutomaticSeries]);
  useEffect(() => {
    var fetchSolidProfile = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var profileDataset = yield getSolidDataset$1(session.info.webId, {
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
      distribution_access_type: next === "external" ? "access" : "download",
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
        if ((datasetSource === "external" || !plannedSaveAsSeries && modelSource === "external") && !pendingDataset.is_public) {
          pendingDataset = _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
            is_public: true
          });
        }
        if (!plannedSaveAsSeries && showSemanticModel && pendingDataset.access_url_semantic_model && !isTtlResource(pendingDataset.access_url_semantic_model)) {
          alert("Semantic Models must be TTL files.");
          return;
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
        var semanticModelUrl = saveAsSeries ? "" : pendingDataset.access_url_semantic_model;
        if (!saveAsSeries && showSemanticModel && modelSource === "upload" && modelUpload.file && !semanticModelUrl) {
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
          for (var resourceUrl of datasetResourceUrls) {
            var existingDataset = findExistingDatasetForResource(resourceUrl);
            if (existingDataset !== null && existingDataset !== void 0 && existingDataset.datasetUrl) {
              memberDatasetUrls.push(existingDataset.datasetUrl);
              continue;
            }
            var created = yield createDataset(session, _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
              title: getDatasetTitleFromUrl(resourceUrl),
              access_url_dataset: resourceUrl,
              access_url_semantic_model: "",
              file_format: inferMediaType(resourceUrl),
              distribution_access_type: datasetSource === "external" ? "access" : "download",
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
            seriesMembers: uniqueUrls(memberDatasetUrls)
          });
        } else {
          var _resourceUrl = datasetResourceUrls[0];
          yield createDataset(session, _objectSpread2$2(_objectSpread2$2({}, pendingDataset), {}, {
            access_url_dataset: _resourceUrl,
            access_url_semantic_model: semanticModelUrl,
            file_format: pendingDataset.file_format || inferMediaType(_resourceUrl),
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
  }, /*#__PURE__*/React.createElement("label", null, "External Dataset link")), externalDatasetLinks.map((link, index) => /*#__PURE__*/React.createElement("div", {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show dataset-add-modal"
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
  }, "Dataset Resource"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
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
  }) : renderExternalDatasetLinks()), !isAutomaticSeries && /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic Model File"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Optional")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2 semantic-model-actions"
  }, !showSemanticModel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary btn-sm",
    onClick: () => setShowSemanticModel(true)
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Add Semantic Model File"), showSemanticModel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary btn-sm",
    onClick: () => {
      setShowSemanticModel(false);
      setModelUpload({
        file: null,
        url: "",
        error: ""
      });
      setModelSource("upload");
      setNewDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
        access_url_semantic_model: ""
      }));
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash mr-1"
  }), " Remove Semantic Model"), /*#__PURE__*/React.createElement("a", {
    href: "http://plasma.uni-wuppertal.de/modelings",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn btn-outline-primary btn-sm"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Create Semantic Model"))), showSemanticModel && /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
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
    label: "Public external semantic model link",
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
  }), loading ? "Saving..." : isAutomaticSeries ? "Save Series" : "Save Dataset")))));
};

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

var SDM_NS = "https://w3id.org/solid-dataspace-manager#";
var XSD_NS = "http://www.w3.org/2001/XMLSchema#";
var escapeLiteral = function escapeLiteral() {
  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
};
var buildNotificationTurtle = payload => {
  var lines = ["@prefix sdm: <" + SDM_NS + ">.", "@prefix dct: <http://purl.org/dc/terms/>.", "@prefix as: <https://www.w3.org/ns/activitystreams#>.", "@prefix xsd: <" + XSD_NS + ">.", "", "<> a sdm:AccessRequest, as:Offer;", "  dct:created \"".concat(payload.createdAt, "\"^^xsd:dateTime;"), "  sdm:status \"pending\";", "  sdm:requesterWebId <".concat(payload.requesterWebId, ">;"), "  sdm:requesterName \"".concat(escapeLiteral(payload.requesterName), "\";"), "  sdm:requesterEmail \"".concat(escapeLiteral(payload.requesterEmail), "\";"), "  sdm:datasetIdentifier \"".concat(escapeLiteral(payload.datasetIdentifier), "\";"), "  sdm:datasetTitle \"".concat(escapeLiteral(payload.datasetTitle), "\";"), "  dct:title \"".concat(escapeLiteral(payload.datasetTitle), "\";")];
  if (payload.datasetAccessUrl) {
    lines.push("  sdm:datasetAccessUrl <".concat(payload.datasetAccessUrl, ">;"));
  }
  if (payload.datasetSemanticModelUrl) {
    lines.push("  sdm:datasetSemanticModelUrl <".concat(payload.datasetSemanticModelUrl, ">;"));
  }
  if (payload.catalogUrl) {
    lines.push("  sdm:catalogUrl <".concat(payload.catalogUrl, ">;"));
  }
  if (payload.message) {
    lines.push("  sdm:message \"".concat(escapeLiteral(payload.message), "\";"));
  }
  lines.push("  .");
  return lines.join("\n");
};
var getPendingRequestKey$1 = (dataset, sessionWebId) => {
  if (!dataset || !sessionWebId) return null;
  var datasetKey = dataset.identifier || dataset.datasetUrl || dataset.access_url_dataset || dataset.title;
  if (!datasetKey) return null;
  return "sdm.request.pending.".concat(sessionWebId, ".").concat(datasetKey);
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
  var [message, setMessage] = useState('');
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [error, setError] = useState("");
  var resolveInboxUrl = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (ownerWebId) {
      var profileDataset = yield getSolidDataset$1(ownerWebId, {
        fetch: session.fetch
      });
      var profile = getThing(profileDataset, ownerWebId);
      if (!profile) return null;
      return getUrl(profile, LDP.inbox);
    });
    return function resolveInboxUrl(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var handleRequest = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(function* () {
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
        var inboxUrl = yield resolveInboxUrl(dataset.webid);
        if (!inboxUrl) {
          setError("The dataset owner has no Solid inbox configured.");
          return;
        }
        var payload = {
          createdAt: new Date().toISOString(),
          requesterWebId: sessionWebId,
          requesterName: userName || "",
          requesterEmail: userEmail || "",
          datasetIdentifier: dataset.identifier || "",
          datasetTitle: dataset.title || "",
          datasetAccessUrl: dataset.access_url_dataset || "",
          datasetSemanticModelUrl: dataset.access_url_semantic_model || "",
          catalogUrl: window.location.origin + "/semantic-data-catalog/",
          message: message || ""
        };
        var turtle = buildNotificationTurtle(payload);
        var res = yield session.fetch(inboxUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/turtle",
            "Slug": "access-request-".concat(dataset.identifier || "dataset", "-").concat(Date.now())
          },
          body: turtle
        });
        if (!res.ok) {
          throw new Error("Inbox rejected request (".concat(res.status, ")"));
        }
        var storageKey = getPendingRequestKey$1(dataset, sessionWebId);
        if (storageKey && typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, "pending");
        }
        onClose();
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error('Error requesting dataset access:', error);
        setError("Failed to send the access request. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
    });
    return function handleRequest() {
      return _ref3.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "modal fade show modal-show request-modal",
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
  }, "Request Access")))));
};

var RequestSuccessModal = _ref => {
  var {
    onClose
  } = _ref;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal fade show modal-show",
    tabIndex: "-1",
    role: "dialog"
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
  }, "Close")))));
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
var getPendingRequestKey = (dataset, sessionWebId) => {
  if (!dataset || !sessionWebId) return null;
  var datasetKey = dataset.identifier || dataset.datasetUrl || dataset.access_url_dataset || dataset.title;
  if (!datasetKey) return null;
  return "sdm.request.pending.".concat(sessionWebId, ".").concat(datasetKey);
};
var isPendingFromDataset = dataset => {
  if (!dataset) return false;
  var raw = dataset.request_status || dataset.requestStatus || dataset.access_request_status || dataset.accessRequestStatus || dataset.requestState;
  if (!raw) return false;
  var status = String(raw).toLowerCase();
  return status === "pending" || status === "waiting" || status === "requested";
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
    statisticsConfig
  } = _ref;
  var [triples, setTriples] = useState([]);
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
  var [requestPending, setRequestPending] = useState(false);
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
    var loadTriples = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (isSeries || !(dataset !== null && dataset !== void 0 && dataset.access_url_semantic_model) || !canAccessModel) {
          setTriples([]);
          return;
        }
        try {
          var res = yield session.fetch(dataset.access_url_semantic_model);
          if (!res.ok) {
            setTriples([]);
            return;
          }
          var turtle = yield res.text();
          var parser = new Parser$1();
          var quads = [];
          parser.parse(turtle, (error, quad) => {
            if (error || cancelled) return;
            if (quad) {
              quads.push(quad);
            } else {
              var mapped = quads.map(q => ({
                subject: q.subject.value,
                predicate: q.predicate.value,
                object: q.object.value,
                fullPredicate: q.predicate.value
              }));
              setTriples(mapped);
            }
          });
        } catch (err) {
          console.error("Failed to load semantic model:", err);
          setTriples([]);
        }
      });
      return function loadTriples() {
        return _ref2.apply(this, arguments);
      };
    }();
    loadTriples();
    return () => {
      cancelled = true;
    };
  }, [dataset, canAccessModel]);
  useEffect(() => {
    var checkAccess = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
        if (!dataset) return;
        if (isSeries) {
          setCanAccessDataset(false);
          setCanAccessModel(false);
          return;
        }
        if (dataset.is_public || dataset.webid === sessionWebId) {
          setCanAccessDataset(true);
          setCanAccessModel(true);
          return;
        }
        if (!session.info.isLoggedIn || !sessionWebId) {
          setCanAccessDataset(false);
          setCanAccessModel(false);
          return;
        }
        var hasAclAccess = /*#__PURE__*/function () {
          var _ref4 = _asyncToGenerator(function* (url) {
            if (!url) return false;
            if (!isPodManagedUrl(url)) {
              return false;
            }
            try {
              var file = yield getFileWithAcl(url, {
                fetch: session.fetch
              });
              var access = getAgentAccess(file, sessionWebId);
              return access && Object.values(access).some(Boolean);
            } catch (err) {
              if (err.statusCode !== 403 && err.statusCode !== 401) {
                console.error("Failed to check ACL for", url, err);
              }
              // Fallback: resource may be readable while ACL is not.
              try {
                var res = yield session.fetch(url, {
                  method: "HEAD"
                });
                return res.ok;
              } catch (fetchErr) {
                return false;
              }
            }
          });
          return function hasAclAccess(_x) {
            return _ref4.apply(this, arguments);
          };
        }();
        var datasetAccess = yield hasAclAccess(dataset.access_url_dataset);
        var modelAccess = datasetAccess;
        if (!modelAccess) {
          modelAccess = yield hasAclAccess(dataset.access_url_semantic_model);
        }
        setCanAccessDataset(datasetAccess);
        setCanAccessModel(modelAccess);
      });
      return function checkAccess() {
        return _ref3.apply(this, arguments);
      };
    }();
    checkAccess();
  }, [dataset, sessionWebId]);
  useEffect(() => {
    if (!dataset) {
      setRequestPending(false);
      return;
    }
    var pendingFromDataset = isPendingFromDataset(dataset);
    if (pendingFromDataset) {
      setRequestPending(true);
      return;
    }
    var storageKey = getPendingRequestKey(dataset, sessionWebId);
    if (storageKey && typeof window !== "undefined") {
      setRequestPending(window.localStorage.getItem(storageKey) === "pending");
      return;
    }
    setRequestPending(false);
  }, [dataset, sessionWebId]);
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
          var profileDataset = yield getSolidDataset$1(profileDocUrl, {
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
            } catch (_unused4) {
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
    fallback: "Semantic model"
  });
  var datasetFileType = datasetLinkType === "access" ? "URL" : (datasetFileName.split(".").pop() || "DATA").slice(0, 5).toUpperCase();
  var modelFileType = (modelFileName.split(".").pop() || "RDF").slice(0, 5).toUpperCase();
  var datasetActionIsDownload = datasetLinkType === "download";
  var modelActionIsDownload = hasSemanticModel;
  var hasUserAccess = dataset.is_public || canAccessDataset || canAccessModel;
  var canRequestAccess = !isSeries && !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);
  var requestButtonDisabled = canRequestAccess && requestPending;
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show dataset-add-modal dataset-detail-modal"
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
  }, requestButtonDisabled ? "Request Pending" : "Request Dataset")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", null, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body dataset-detail-body"
  }, /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("span", null, ownerProfile.webId || "No WebID"))))), /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-predicate-label"
  }, "dct:title"), /*#__PURE__*/React.createElement("h2", {
    translate: dataset.title ? "no" : undefined
  }, titleValue), /*#__PURE__*/React.createElement("div", {
    className: "dataset-detail-description"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-predicate-label"
  }, "dct:description"), /*#__PURE__*/React.createElement("p", {
    translate: dataset.description ? "no" : undefined
  }, descriptionValue))), !isSeries && /*#__PURE__*/React.createElement("section", {
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
  }, "Content: Semantic model"), /*#__PURE__*/React.createElement("div", {
    className: "detail-file-meta"
  }, "Format: Turtle/RDF model")), /*#__PURE__*/React.createElement("button", {
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
  }, row.predicate), /*#__PURE__*/React.createElement("td", {
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
  }))), !isSeries && hasSemanticModel && /*#__PURE__*/React.createElement("section", {
    className: "dataset-detail-section dataset-detail-card dataset-detail-visualization"
  }, /*#__PURE__*/React.createElement("h3", null, "Semantic Model Visualization"), /*#__PURE__*/React.createElement("div", {
    className: "detail-graph-wide"
  }, triples.length > 0 ? /*#__PURE__*/React.createElement(RDFGraph, {
    triples: triples
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-muted"
  }, "No RDF triples found."))))))), showRequestModal && !isSeries && /*#__PURE__*/React.createElement(RequestDatasetModal, {
    dataset: dataset,
    sessionWebId: sessionWebId,
    userName: userName,
    userEmail: userEmail,
    onClose: () => setShowRequestModal(false),
    onSuccess: () => {
      setRequestPending(true);
      setShowRequestSuccess(true);
    }
  }), showRequestSuccess && !isSeries && /*#__PURE__*/React.createElement(RequestSuccessModal, {
    onClose: () => setShowRequestSuccess(false)
  }));
};

var DEFAULT_LANGUAGE = "en";
var LANGUAGE_STORAGE_KEY = "solid-dataspace.language";
var LANGUAGE_EVENT = "solid-dataspace-language-change";
var LANGUAGE_MESSAGE_TYPE = "solid-dataspace-language-change";
var enToDe = {
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
  "Download Catalog": "Katalog herunterladen",
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
  "Failed to build merged catalog download.": "Der zusammengeführte Katalog konnte nicht erstellt werden.",
  "Catalog downloads": "Katalog-Downloads",
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
      query,
      signal
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var response = yield fetch("".concat(baseUrl.replace(/\/$/, ''), "/").concat(path), _objectSpread2$2({
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
  }, [apiBaseUrl, refresh]);
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
  var [showSemanticModel, setShowSemanticModel] = useState(false);
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
  var requiresPublicAccess = datasetSource === "external" || modelSource === "external";
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
    setShowSemanticModel(Boolean(dataset.access_url_semantic_model));
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
          var profileDataset = yield getSolidDataset$1(session.info.webId, {
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
      distribution_access_type: next === "external" ? "access" : "download",
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
          if ((datasetSource === "external" || modelSource === "external") && !datasetToSave.is_public) {
            datasetToSave = _objectSpread2$2(_objectSpread2$2({}, datasetToSave), {}, {
              is_public: true
            });
          }
          if (showSemanticModel && datasetToSave.access_url_semantic_model && !isTtlResource(datasetToSave.access_url_semantic_model)) {
            alert("Semantic Models must be TTL files.");
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
          yield updateDataset(session, datasetToSave);
        }
        yield fetchDatasets();
        onClose();
      } catch (err) {
        console.error("Error updating dataset:", err);
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
  return /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show dataset-add-modal"
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
  }, "Dataset Resource"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
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
    label: "External Dataset link",
    name: "access_url_dataset",
    value: editedDataset.access_url_dataset,
    placeholder: "https://..."
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic Model File"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Optional")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2 semantic-model-actions"
  }, !showSemanticModel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary btn-sm",
    onClick: () => setShowSemanticModel(true)
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Add Semantic Model File"), showSemanticModel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary btn-sm",
    onClick: () => {
      setShowSemanticModel(false);
      setModelUpload({
        file: null,
        url: "",
        error: ""
      });
      setModelSource("upload");
      setEditedDataset(prev => _objectSpread2$2(_objectSpread2$2({}, prev), {}, {
        access_url_semantic_model: ""
      }));
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash mr-1"
  }), " Remove Semantic Model"), /*#__PURE__*/React.createElement("a", {
    href: "http://plasma.uni-wuppertal.de/modelings",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn btn-outline-primary btn-sm"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-1"
  }), " Create Semantic Model"))), showSemanticModel && /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement(PodContainerPicker, {
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
    label: "Public external semantic model link",
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
  }), loading ? "Saving..." : "Save Changes")))));
};

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
var _excluded = ["style"];
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
    remaining = _objectWithoutProperties(extraProps, _excluded);
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
var faFaceMeh = {
  prefix: 'fas',
  iconName: 'face-meh',
  icon: [512, 512, [128528, "meh"], "f11a", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM176 176a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm128 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM176 320l160 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-160 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"]
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
var faFaceFrown = {
  prefix: 'fas',
  iconName: 'face-frown',
  icon: [512, 512, [9785, "frown"], "f119", "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm90.6-113.9c-20.4-28-53.4-46.1-90.6-46.1s-70.2 18.1-90.6 46.1c-7.8 10.7-22.8 13.1-33.5 5.3s-13.1-22.8-5.3-33.5C155.7 330 202.8 304 256 304s100.3 26 129.4 65.9c7.8 10.7 5.4 25.7-5.3 33.5s-25.7 5.4-33.5-5.3zM144 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]
};
var faXmark = {
  prefix: 'fas',
  iconName: 'xmark',
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"]
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
    activeTab,
    setActiveTab,
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
        var dataset = yield getSolidDataset$1(webId, {
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
    className: "header-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-title"
  }, /*#__PURE__*/React.createElement("a", {
    href: process.env.PUBLIC_URL + '/'
  }, /*#__PURE__*/React.createElement(FontAwesomeIcon, {
    icon: faBookOpen,
    className: "header-icon",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, "Semantic ", /*#__PURE__*/React.createElement("span", {
    className: "highlight"
  }, "Data"), " Catalog")))), /*#__PURE__*/React.createElement("div", {
    className: "header-right header-right--catalog"
  }, userInfo.loggedIn && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light",
    onClick: () => setActiveTab(activeTab === 'semantic-search' ? 'dataset' : 'semantic-search')
  }, activeTab === 'semantic-search' ? 'Semantic Data Catalog' : 'Semantic Search'), userInfo.loggedIn ? /*#__PURE__*/React.createElement("div", {
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

var appVersion = "0.8.78";

var FooterBar = () => {
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-logo-group"
  }, /*#__PURE__*/React.createElement("img", {
    src: process.env.PUBLIC_URL + '/assets/images/Logo_BUW.png',
    alt: "Logo BUW",
    className: "logo-small"
  }), /*#__PURE__*/React.createElement("img", {
    src: process.env.PUBLIC_URL + '/assets/images/Logo_TMDT.png',
    alt: "Logo TMDT",
    className: "logo-medium"
  })), /*#__PURE__*/React.createElement("div", {
    className: "footer-version"
  }, "Semantic Data Catalog ", appVersion));
};

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
        var ds = yield getSolidDataset$1(profileDoc, {
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
        var profileCatalog = getUrl(me, SDP_CATALOG) || "";
        var catalogResolved = profileCatalog;
        var hasCatalog = false;
        if (profileCatalog) {
          try {
            yield getSolidDataset$1(profileCatalog.split("#")[0], {
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
            yield getSolidDataset$1(resolvedPrivateRegistry, {
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
            yield getSolidDataset$1(containerUrl, {
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
        yield getSolidDataset$1(targetInboxUrl, {
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
        ds = yield getSolidDataset$1(profileDocUrl, {
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
  var context = "".concat(isLoggedIn, ":").concat(webId || "");
  var [result, setResult] = useState(null);
  var [attempt, setAttempt] = useState(0);
  var activeRun = useRef(null);
  var cleanup = useRef(null);
  var fetchDatasets = useCallback(/*#__PURE__*/_asyncToGenerator(function* () {
    var run = activeRun.current;
    if (!run || run.context !== context) return;
    var request = ++run.request;
    var failed = false;
    var partial = false;
    try {
      var loaded = yield loadAggregatedDatasets(session, isLoggedIn ? null : window.fetch.bind(window), {
        usePublicCache: true,
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
  }), [session, context, isLoggedIn, webId]);
  useEffect(() => {
    var _cleanup$current, _cleanup$current2, _cleanup$current3;
    var run = {
      context,
      request: 0
    };
    activeRun.current = run;
    setResult(null);
    // Keep the existing maintenance step, but load the final catalog only
    // afterwards. Sharing its promise also avoids duplicate Strict Mode writes.
    if (isLoggedIn && webId && (((_cleanup$current = cleanup.current) === null || _cleanup$current === void 0 ? void 0 : _cleanup$current.context) !== context || ((_cleanup$current2 = cleanup.current) === null || _cleanup$current2 === void 0 ? void 0 : _cleanup$current2.session) !== session)) {
      cleanup.current = {
        context,
        session,
        promise: cleanupCatalogSeriesLinks(session).catch(error => {
          console.error("Cleanup failed:", error);
        })
      };
    }
    var preparation = isLoggedIn ? (_cleanup$current3 = cleanup.current) === null || _cleanup$current3 === void 0 ? void 0 : _cleanup$current3.promise : undefined;
    Promise.resolve(preparation).then(() => {
      if (activeRun.current === run) fetchDatasets();
    });
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
  var [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  var [showDetailModal, setShowDetailModal] = useState(false);
  var [showDeleteModal, setShowDeleteModal] = useState(false);
  var [showEditModal, setShowEditModal] = useState(false);
  var [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  var [showRegistryModal, setShowRegistryModal] = useState(false);
  var [selectedDataset, setSelectedDataset] = useState(null);
  var [sessionLoggedIn, setIsLoggedIn] = useState(() => Boolean(session.info.isLoggedIn));
  var [sessionWebId, setWebId] = useState(() => session.info.webId || null);
  var isLoggedIn = embedded ? Boolean(webIdOverride) : sessionLoggedIn;
  var webId = embedded ? webIdOverride : sessionWebId;
  var [userName, setUserName] = useState('');
  var [userEmail, setUserEmail] = useState('');
  var [headerUserInfo, setHeaderUserInfo] = useState(null);
  var [searchQuery, setSearchQuery] = useState('');
  var [isPopulating, setIsPopulating] = useState(false);
  var populateTriggerRef = useRef(false);
  var [activeTab, setActiveTabState] = useState(() => !embedded && new URLSearchParams(window.location.search).get('view') === 'semantic-search' ? 'semantic-search' : 'dataset');
  var [datasetOpenError, setDatasetOpenError] = useState('');
  var setActiveTab = tab => {
    setActiveTabState(tab);
    if (!embedded) {
      var url = new URL(window.location.href);
      if (tab === 'semantic-search') url.searchParams.set('view', tab);else url.searchParams.delete('view');
      window.history.pushState({}, '', url);
    }
  };
  useEffect(() => {
    if (embedded) return undefined;
    var onPopState = () => setActiveTabState(new URLSearchParams(window.location.search).get('view') === 'semantic-search' ? 'semantic-search' : 'dataset');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [embedded]);
  var openSearchDataset = useCallback(/*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (url) {
      setDatasetOpenError('');
      try {
        if (!safeResultUrl(url)) throw new Error('Invalid dataset URL.');
        var doc = yield getSolidDataset(url.split('#')[0], {
          fetch: function (_fetch) {
            function fetch(_x2, _x3) {
              return _fetch.apply(this, arguments);
            }
            fetch.toString = function () {
              return _fetch.toString();
            };
            return fetch;
          }((input, init) => fetch(input, _objectSpread2$2(_objectSpread2$2({}, init), {}, {
            credentials: 'omit',
            cache: 'no-store'
          })))
        });
        var dataset = parseDatasetFromDoc(doc, url);
        if (!dataset) throw new Error('Dataset is no longer available.');
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
  useEffect(() => {
    var requested = datasetUrl || !embedded && new URLSearchParams(window.location.search).get('dataset');
    if (requested && isLoggedIn) openSearchDataset(requested);
    // This loads the requested document independently of the profile's registry selection.
  }, [datasetUrl, embedded, isLoggedIn, openSearchDataset]);
  var [onboardingRequired, setOnboardingRequired] = useState(false);
  var [profileCheck, setProfileCheck] = useState(null);
  var [profileAttempt, setProfileAttempt] = useState(0);
  var [isPrivateRegistry, setIsPrivateRegistry] = useState(false);
  var [issuer, setIssuer] = useState(defaultIssuer);
  var {
    datasets,
    catalogs,
    loading: loadingDatasets,
    error: datasetLoadError,
    fetchDatasets,
    retry: retryDatasets
  } = useCatalogDatasets(session, webId, isLoggedIn);
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
    return function loginToSolid(_x4) {
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
          var profileCatalog = getUrl(me, SDP_CATALOG) || "";
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
  var handleSearch = searchValue => {
    setSearchQuery(searchValue || "");
  };
  var handleRowClick = dataset => {
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
    setShowNewDatasetModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setShowAddDatasetModal(false);
    setSelectedDataset(null);
  };
  var handleCloseNestedModal = () => {
    setShowDeleteModal(false);
    setShowEditModal(false);
  };
  useEffect(() => {
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
    return function populateFromSeed(_x5) {
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
  if (!showLogin && activeTab !== 'semantic-search' && !datasetUrl && (checkingProfile || loadingDatasets || isPopulating)) {
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
  if (!showLogin && activeTab !== 'semantic-search' && !datasetUrl && (datasetLoadError || profileCheck !== null && profileCheck !== void 0 && profileCheck.error)) {
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
      className: "standalone-login-page"
    }, ActiveLoginScreen && /*#__PURE__*/React.createElement(ActiveLoginScreen, {
      defaultIssuer: issuer,
      languageControl: /*#__PURE__*/React.createElement(LanguageSelect, {
        className: "language-select--login"
      }),
      onLogin: nextIssuer => {
        setIssuer(nextIssuer);
        loginToSolid(nextIssuer);
      }
    })));
  }
  return renderWithI18n(/*#__PURE__*/React.createElement("div", null, !embedded && /*#__PURE__*/React.createElement(HeaderBar, {
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
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    languageControl: /*#__PURE__*/React.createElement(LanguageSelect, {
      className: "language-select--header"
    })
  }), datasetOpenError && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "semantic-search-error"
  }, datasetOpenError), activeTab === 'semantic-search' && /*#__PURE__*/React.createElement(SemanticSearch, {
    onOpenDataset: openSearchDataset
  }), activeTab === 'dataset' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "catalog-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions-inner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "catalog-title"
  }, "All datasets & dataset series"), /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions-right"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light mr-2",
    onClick: () => setShowNewDatasetModal(true),
    disabled: !isLoggedIn,
    title: isLoggedIn ? "Add a new dataset" : "Please log in to add datasets"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-2"
  }), "Add Dataset"), isPrivateRegistry && isLoggedIn && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light mr-2",
    onClick: () => setShowRegistryModal(true),
    title: "Manage private registry members"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-users mr-2"
  }), "Private Registry"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-light mr-2",
    onClick: /*#__PURE__*/_asyncToGenerator(function* () {
      try {
        var turtle = yield buildMergedCatalogDownload(session, {
          catalogs,
          datasets
        });
        var blob = new Blob([turtle], {
          type: "text/turtle"
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "semantic_data_catalog.ttl";
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to build merged catalog download:", err);
        alert("Failed to build merged catalog download.");
      }
    })
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-download mr-2"
  }), "Download Catalog"), /*#__PURE__*/React.createElement(SearchBar, {
    onSearch: handleSearch
  })))), /*#__PURE__*/React.createElement("div", {
    className: "catalog-table"
  }, /*#__PURE__*/React.createElement(DatasetTable, {
    datasets: datasets,
    onRowClick: handleRowClick,
    searchQuery: searchQuery
  })))), activeTab === 'collection' && /*#__PURE__*/React.createElement("div", {
    className: "text-center mt-5"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-hammer mr-2"
  }), "Under Construction"), /*#__PURE__*/React.createElement("p", null, "This section is not yet available.")), showNewDatasetModal && /*#__PURE__*/React.createElement(DatasetAddModal, {
    onClose: handleCloseModal,
    fetchDatasets: fetchDatasets
  }), showDetailModal && /*#__PURE__*/React.createElement(DatasetDetailModal, {
    dataset: selectedDataset,
    onClose: handleCloseModal,
    sessionWebId: webId,
    userName: userName,
    userEmail: userEmail,
    datasets: datasets,
    onEditClick: handleEditClick,
    onDeleteClick: handleDeleteClick,
    statisticsConfig: effectiveStatisticsConfig
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
