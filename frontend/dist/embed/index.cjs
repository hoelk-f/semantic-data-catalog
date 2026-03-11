'use strict';

var React = require('react');
var material = require('@mui/material');
var xDataGrid = require('@mui/x-data-grid');
var solidClientAuthnBrowser = require('@inrupt/solid-client-authn-browser');
var solidClient = require('@inrupt/solid-client');
var vocabCommonRdf = require('@inrupt/vocab-common-rdf');
var require$$0 = require('buffer');
var n3 = require('n3');
var visNetwork = require('vis-network');

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
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
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

var SearchBar = _ref => {
  var {
    onSearch
  } = _ref;
  var [searchQuery, setSearchQuery] = React.useState('');
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

var DatasetTable = _ref => {
  var {
    datasets,
    onRowClick: _onRowClick,
    onEditClick,
    onDeleteClick,
    sessionWebId,
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
      className: "grid-title"
    }, params.value)
  }, {
    field: "description",
    headerName: "Description",
    flex: 2,
    minWidth: 240,
    cellClassName: "grid-cell-desc"
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
    cellClassName: "grid-cell-meta"
  }, {
    field: "contact_point",
    headerName: "Contact",
    flex: 1,
    minWidth: 200,
    cellClassName: "grid-cell-meta"
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
  }, {
    field: "actions",
    headerName: "Actions",
    minWidth: 130,
    sortable: false,
    filterable: false,
    renderCell: params => {
      var dataset = params.row;
      if (!dataset || !sessionWebId || dataset.webid !== sessionWebId) return null;
      return /*#__PURE__*/React.createElement("div", {
        className: "inline-action-buttons"
      }, /*#__PURE__*/React.createElement("button", {
        className: "edit-button",
        onClick: e => {
          e.stopPropagation();
          onEditClick(dataset);
        }
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa-regular fa-pen-to-square"
      })), /*#__PURE__*/React.createElement("button", {
        className: "delete-button",
        onClick: e => {
          e.stopPropagation();
          onDeleteClick(dataset);
        }
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-trash"
      })));
    }
  }];
  return /*#__PURE__*/React.createElement(material.Box, {
    className: "dataset-grid"
  }, /*#__PURE__*/React.createElement(xDataGrid.DataGrid, {
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
      var _params$row;
      var base = params.indexRelativeToCurrentPage % 2 === 0 ? "grid-row-even" : "grid-row-odd";
      return (_params$row = params.row) !== null && _params$row !== void 0 && _params$row.isStale ? "".concat(base, " grid-row-stale") : base;
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

// Simple IStorage wrapper backed by the browser's sessionStorage so that
// authentication data is kept only for the lifetime of the tab.
var sessionStorageWrapper = {
  get: function () {
    var _get = _asyncToGenerator(function* (key) {
      var _window$sessionStorag;
      return typeof window === "undefined" ? undefined : (_window$sessionStorag = window.sessionStorage.getItem(key)) !== null && _window$sessionStorag !== void 0 ? _window$sessionStorag : undefined;
    });
    function get(_x) {
      return _get.apply(this, arguments);
    }
    return get;
  }(),
  set: function () {
    var _set = _asyncToGenerator(function* (key, value) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, value);
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
        window.sessionStorage.removeItem(key);
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
var session = new solidClientAuthnBrowser.Session({
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

var CATALOG_CONTAINER = "catalog/";
var DATASET_CONTAINER = "catalog/ds/";
var SERIES_CONTAINER = "catalog/series/";
var RECORDS_CONTAINER = "catalog/records/";
var CATALOG_DOC = "catalog/cat.ttl";
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
  return solidClient.getThingAll(datasetDoc).find(thing => {
    var thingTypes = solidClient.getUrlAll(thing, vocabCommonRdf.RDF.type);
    return thingTypes.some(type => typeSet.has(type));
  }) || null;
};
var resolveDatasetThing = (datasetDoc, datasetUrl) => {
  if (!datasetDoc) return null;
  var docUrl = getDocumentUrl(datasetUrl);
  var candidates = [datasetUrl, "".concat(docUrl, "#it")];
  for (var candidate of candidates) {
    var thing = solidClient.getThing(datasetDoc, candidate);
    if (thing) return thing;
  }
  return getThingByTypes(datasetDoc, [vocabCommonRdf.DCAT.Dataset, vocabCommonRdf.DCAT.DatasetSeries]) || solidClient.getThingAll(datasetDoc)[0] || null;
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
var resolveRecordRefs = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* (session) {
    var _session$info;
    var webId = session === null || session === void 0 || (_session$info = session.info) === null || _session$info === void 0 ? void 0 : _session$info.webId;
    if (!webId) return [];
    var recordsContainerUrl = "".concat(getPodRoot$1(webId)).concat(RECORDS_CONTAINER);
    var recordDocs = [];
    try {
      var recordsContainer = yield solidClient.getSolidDataset(recordsContainerUrl, {
        fetch: session.fetch
      });
      recordDocs = solidClient.getContainedResourceUrlAll(recordsContainer);
    } catch (_unused3) {
      return [];
    }
    var recordRefs = [];
    for (var recordDocUrl of recordDocs) {
      try {
        var recordDataset = yield solidClient.getSolidDataset(recordDocUrl, {
          fetch: session.fetch
        });
        solidClient.getThingAll(recordDataset).forEach(thing => {
          var types = solidClient.getUrlAll(thing, vocabCommonRdf.RDF.type);
          if (types.includes(vocabCommonRdf.DCAT.CatalogRecord)) {
            recordRefs.push(thing.url);
          }
        });
      } catch (_unused4) {
        // Skip unreadable record docs.
      }
    }
    return recordRefs;
  });
  return function resolveRecordRefs(_x) {
    return _ref2.apply(this, arguments);
  };
}();
var writeCatalogDoc = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(function* (session, catalogDocUrl, datasetRefs) {
    var title = "Solid Dataspace Catalog";
    var description = "";
    var contactPoint = "";
    try {
      var catalogDataset = yield solidClient.getSolidDataset(catalogDocUrl, {
        fetch: session.fetch
      });
      var catalogThing = solidClient.getThing(catalogDataset, "".concat(catalogDocUrl, "#it"));
      if (catalogThing) {
        title = getAnyString(catalogThing, vocabCommonRdf.DCTERMS.title) || title;
        description = getAnyString(catalogThing, vocabCommonRdf.DCTERMS.description) || "";
        contactPoint = solidClient.getUrl(catalogThing, vocabCommonRdf.DCAT.contactPoint) || "";
      }
    } catch (_unused5) {
      // Use defaults.
    }
    var turtle = buildCatalogTurtle({
      title,
      description,
      modified: safeNow(),
      datasetRefs,
      recordRefs: yield resolveRecordRefs(session),
      contactPoint
    });
    var res = yield session.fetch(catalogDocUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "text/turtle"
      },
      body: turtle
    });
    if (!res.ok) {
      throw new Error("Failed to write catalog document (".concat(res.status, ")"));
    }
    yield makePublicReadable(catalogDocUrl, session.fetch);
  });
  return function writeCatalogDoc(_x2, _x3, _x4) {
    return _ref3.apply(this, arguments);
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
var buildDefaultPrivateRegistry = webId => {
  if (!webId) return "";
  return "".concat(getPodRoot$1(webId), "registry/");
};
var normalizeContainerUrl = value => {
  if (!value) return "";
  try {
    var url = new URL(value);
    return url.href.endsWith("/") ? url.href : "".concat(url.href, "/");
  } catch (_unused6) {
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
  var noLocale = solidClient.getStringNoLocale(thing, predicate);
  if (noLocale) return noLocale;
  try {
    var values = normalizeLocaleValues(solidClient.getStringWithLocaleAll(thing, predicate));
    if (!values || values.length === 0) return "";
    return values[0] || "";
  } catch (_unused7) {
    return "";
  }
};
var safeGetUrlAll = (thing, predicate) => {
  if (!thing) return [];
  try {
    return (solidClient.getUrlAll(thing, predicate) || []).filter(Boolean);
  } catch (err) {
    console.warn("Invalid URL value for predicate", predicate, err);
    return [];
  }
};
var setLocaleString = (thing, predicate, value) => {
  if (!value) return thing;
  return solidClient.setStringNoLocale(thing, predicate, value);
};
var getCatalogDocUrl = webId => "".concat(getPodRoot$1(webId)).concat(CATALOG_DOC);
var getCatalogResourceUrl = webId => "".concat(getCatalogDocUrl(webId), "#it");
var getSeriesDocUrl = (webId, identifier) => "".concat(getPodRoot$1(webId)).concat(SERIES_CONTAINER).concat(identifier, ".ttl");
var getSeriesResourceUrl = seriesDocUrl => "".concat(seriesDocUrl, "#it");
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
  var _ref4 = _asyncToGenerator(function* (containerUrl, fetch) {
    try {
      var res = yield fetch(containerUrl, {
        method: "GET",
        headers: {
          Accept: "text/turtle"
        }
      });
      if (res.ok) return;
      if (res.status !== 404) return;
    } catch (_unused8) {
      // Continue and attempt creation.
    }
    try {
      yield solidClient.createContainerAt(containerUrl, {
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
  return function ensureContainer(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();
var getResourceAndAcl = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(function* (url, fetch) {
    var resource = yield solidClient.getSolidDatasetWithAcl(url, {
      fetch
    });
    var resourceAcl;
    if (!solidClient.hasResourceAcl(resource)) {
      if (!solidClient.hasAccessibleAcl(resource)) {
        throw new Error("No access to ACL.");
      }
      resourceAcl = solidClient.createAclFromFallbackAcl(resource);
    } else {
      resourceAcl = solidClient.getResourceAcl(resource);
    }
    return {
      resource,
      resourceAcl
    };
  });
  return function getResourceAndAcl(_x7, _x8) {
    return _ref5.apply(this, arguments);
  };
}();
var makePublicReadable = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(function* (url, fetch) {
    try {
      var {
        resource,
        resourceAcl
      } = yield getResourceAndAcl(url, fetch);
      var updatedAcl = solidClient.setPublicResourceAccess(resourceAcl, {
        read: true,
        append: false,
        write: false,
        control: false
      });
      yield solidClient.saveAclFor(resource, updatedAcl, {
        fetch
      });
    } catch (err) {
      console.warn("Failed to set public read ACL for", url, err);
    }
  });
  return function makePublicReadable(_x9, _x10) {
    return _ref6.apply(this, arguments);
  };
}();
var setCatalogLinkInProfile = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(function* (webId, catalogUrl, fetch) {
    if (!webId || !catalogUrl) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield solidClient.getSolidDataset(profileDocUrl, {
      fetch
    });
    var profileThing = solidClient.getThing(profileDataset, webId);
    if (!profileThing) {
      profileThing = solidClient.createThing({
        url: webId
      });
    }
    profileThing = solidClient.removeAll(profileThing, SDP_CATALOG);
    profileThing = solidClient.removeAll(profileThing, vocabCommonRdf.DCAT.catalog);
    profileThing = solidClient.setUrl(profileThing, SDP_CATALOG, catalogUrl);
    var updatedProfile = solidClient.setThing(profileDataset, profileThing);
    yield solidClient.saveSolidDatasetAt(profileDocUrl, updatedProfile, {
      fetch
    });
  });
  return function setCatalogLinkInProfile(_x11, _x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();
var loadRegistryConfig = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(function* (webId, fetch) {
    if (!webId || !fetch) {
      return {
        mode: "research",
        registries: [],
        privateRegistry: ""
      };
    }
    var profileDocUrl = webId.split("#")[0];
    try {
      var profileDataset = yield solidClient.getSolidDataset(profileDocUrl, {
        fetch
      });
      var profileThing = solidClient.getThing(profileDataset, webId);
      var mode = (solidClient.getStringNoLocale(profileThing, SDM_REGISTRY_MODE) || "research").toLowerCase();
      var registries = (solidClient.getUrlAll(profileThing, SDM_REGISTRY) || []).filter(Boolean).map(url => url.replace(/\/+$/, ""));
      var privateRegistry = solidClient.getUrl(profileThing, SDM_PRIVATE_REGISTRY) || buildDefaultPrivateRegistry(webId);
      return {
        mode: mode === "private" ? "private" : "research",
        registries,
        privateRegistry
      };
    } catch (err) {
      console.warn("Failed to load registry config from profile:", err);
      return {
        mode: "research",
        registries: [],
        privateRegistry: buildDefaultPrivateRegistry(webId)
      };
    }
  });
  return function loadRegistryConfig(_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();
var saveRegistryConfig = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator(function* (webId, fetch, config) {
    if (!webId || !fetch) return;
    var profileDocUrl = webId.split("#")[0];
    var profileDataset = yield solidClient.getSolidDataset(profileDocUrl, {
      fetch
    });
    var profileThing = solidClient.getThing(profileDataset, webId);
    if (!profileThing) {
      profileThing = solidClient.createThing({
        url: webId
      });
    }
    var mode = (config === null || config === void 0 ? void 0 : config.mode) === "private" ? "private" : "research";
    var registries = ((config === null || config === void 0 ? void 0 : config.registries) || []).filter(Boolean).map(url => url.replace(/\/+$/, ""));
    var privateRegistry = (config === null || config === void 0 ? void 0 : config.privateRegistry) || buildDefaultPrivateRegistry(webId);
    profileThing = solidClient.removeAll(profileThing, SDM_REGISTRY_MODE);
    profileThing = solidClient.setStringNoLocale(profileThing, SDM_REGISTRY_MODE, mode);
    profileThing = solidClient.removeAll(profileThing, SDM_REGISTRY);
    registries.forEach(url => {
      profileThing = solidClient.addUrl(profileThing, SDM_REGISTRY, url);
    });
    profileThing = solidClient.removeAll(profileThing, SDM_PRIVATE_REGISTRY);
    if (privateRegistry) {
      profileThing = solidClient.setUrl(profileThing, SDM_PRIVATE_REGISTRY, privateRegistry);
    }
    var updatedProfile = solidClient.setThing(profileDataset, profileThing);
    yield solidClient.saveSolidDatasetAt(profileDocUrl, updatedProfile, {
      fetch
    });
  });
  return function saveRegistryConfig(_x16, _x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}();
var ensureRegistryContainer = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator(function* (containerUrl, fetch) {
    yield ensureContainer(containerUrl, fetch);
    yield makePublicReadable(containerUrl, fetch);
  });
  return function ensureRegistryContainer(_x19, _x20) {
    return _ref10.apply(this, arguments);
  };
}();
var ensurePrivateRegistryContainer = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator(function* (webId, fetch, privateRegistryUrl) {
    if (!webId || !fetch) return "";
    var target = normalizeContainerUrl(privateRegistryUrl || buildDefaultPrivateRegistry(webId));
    if (!target) return "";
    yield ensureRegistryContainer(target, fetch);
    return target;
  });
  return function ensurePrivateRegistryContainer(_x21, _x22, _x23) {
    return _ref11.apply(this, arguments);
  };
}();
var resolveRegistryConfig = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator(function* (webId, fetch, override) {
    var base = override || (yield loadRegistryConfig(webId, fetch));
    var mode = (base === null || base === void 0 ? void 0 : base.mode) === "private" ? "private" : "research";
    var registries = ((base === null || base === void 0 ? void 0 : base.registries) || []).filter(Boolean);
    var privateRegistry = (base === null || base === void 0 ? void 0 : base.privateRegistry) || buildDefaultPrivateRegistry(webId);
    return {
      mode,
      registries,
      privateRegistry
    };
  });
  return function resolveRegistryConfig(_x24, _x25, _x26) {
    return _ref12.apply(this, arguments);
  };
}();
var registerWebIdInRegistryContainer = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator(function* (containerUrl, fetch, memberWebId) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl(containerUrl);
    if (!normalizedUrl || !memberWebId) return;
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield solidClient.getSolidDataset(normalizedUrl, {
      fetch
    });
    var resources = solidClient.getContainedResourceUrlAll(containerDataset);
    for (var resourceUrl of resources) {
      try {
        var memberDataset = yield solidClient.getSolidDataset(resourceUrl, {
          fetch
        });
        var memberThing = solidClient.getThing(memberDataset, "".concat(resourceUrl, "#it")) || solidClient.getThingAll(memberDataset)[0];
        var existingWebId = memberThing ? solidClient.getUrl(memberThing, vocabCommonRdf.FOAF.member) : "";
        if (existingWebId === memberWebId) return;
      } catch (_unused9) {
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
  return function registerWebIdInRegistryContainer(_x27, _x28, _x29) {
    return _ref13.apply(this, arguments);
  };
}();
var registerWebIdInRegistries = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator(function* (webId, fetch, registryConfig) {
    if (!webId) return;
    var config = yield resolveRegistryConfig(webId, fetch, registryConfig);
    var containers = [];
    var allowCreate = false;
    if (config.mode === "private") {
      allowCreate = true;
      containers = [config.privateRegistry];
    } else {
      containers = config.registries;
    }
    var normalized = Array.from(new Set(containers.map(normalizeContainerUrl).filter(Boolean)));
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
  return function registerWebIdInRegistries(_x30, _x31, _x32) {
    return _ref14.apply(this, arguments);
  };
}();
var loadRegistryMembersFromContainer = /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator(function* (containerUrl, fetch) {
    var normalizedUrl = normalizeContainerUrl(containerUrl);
    if (!normalizedUrl || !fetch) return [];
    try {
      var containerDataset = yield solidClient.getSolidDataset(normalizedUrl, {
        fetch
      });
      var resourceUrls = solidClient.getContainedResourceUrlAll(containerDataset);
      var members = new Set();
      for (var resourceUrl of resourceUrls) {
        try {
          var memberDataset = yield solidClient.getSolidDataset(resourceUrl, {
            fetch
          });
          var memberThing = solidClient.getThing(memberDataset, "".concat(resourceUrl, "#it")) || solidClient.getThingAll(memberDataset)[0];
          var memberWebId = memberThing ? solidClient.getUrl(memberThing, vocabCommonRdf.FOAF.member) : "";
          if (memberWebId) members.add(memberWebId);
        } catch (_unused10) {
          // Ignore malformed entries.
        }
      }
      return Array.from(members);
    } catch (err) {
      var _err$response4;
      var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response4 = err.response) === null || _err$response4 === void 0 ? void 0 : _err$response4.status);
      if (status === 404) return [];
      console.warn("Failed to load registry container", normalizedUrl, err);
      return [];
    }
  });
  return function loadRegistryMembersFromContainer(_x33, _x34) {
    return _ref15.apply(this, arguments);
  };
}();
var syncRegistryMembersInContainer = /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator(function* (containerUrl, fetch, members) {
    var {
      allowCreate
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var normalizedUrl = normalizeContainerUrl(containerUrl);
    if (!normalizedUrl || !fetch) return;
    var cleanedMembers = Array.from(new Set((members || []).map(m => (m || "").trim()).filter(Boolean)));
    if (allowCreate) {
      yield ensureRegistryContainer(normalizedUrl, fetch);
    }
    var containerDataset = yield solidClient.getSolidDataset(normalizedUrl, {
      fetch
    });
    var resourceUrls = solidClient.getContainedResourceUrlAll(containerDataset);
    var existing = new Map();
    for (var resourceUrl of resourceUrls) {
      try {
        var memberDataset = yield solidClient.getSolidDataset(resourceUrl, {
          fetch
        });
        var memberThing = solidClient.getThing(memberDataset, "".concat(resourceUrl, "#it")) || solidClient.getThingAll(memberDataset)[0];
        var memberWebId = memberThing ? solidClient.getUrl(memberThing, vocabCommonRdf.FOAF.member) : "";
        if (memberWebId) {
          existing.set(memberWebId, resourceUrl);
        }
      } catch (_unused11) {
        // Ignore malformed entries.
      }
    }
    for (var [_memberWebId, _resourceUrl] of existing.entries()) {
      if (!cleanedMembers.includes(_memberWebId)) {
        yield solidClient.deleteFile(_resourceUrl, {
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
  return function syncRegistryMembersInContainer(_x35, _x36, _x37) {
    return _ref16.apply(this, arguments);
  };
}();
var ensureCatalogStructure = /*#__PURE__*/function () {
  var _ref17 = _asyncToGenerator(function* (session) {
    var _session$info2;
    var {
      title,
      description,
      registryConfig
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!(session !== null && session !== void 0 && (_session$info2 = session.info) !== null && _session$info2 !== void 0 && _session$info2.webId)) {
      throw new Error("No Solid WebID available.");
    }
    var webId = session.info.webId;
    var podRoot = getPodRoot$1(webId);
    var fetch = session.fetch;
    yield ensureContainer("".concat(podRoot).concat(CATALOG_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(DATASET_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(SERIES_CONTAINER), fetch);
    yield ensureContainer("".concat(podRoot).concat(RECORDS_CONTAINER), fetch);

    // Legacy local registry.ttl is no longer used.

    var catalogDocUrl = getCatalogDocUrl(webId);
    var catalogResourceUrl = getCatalogResourceUrl(webId);
    var catalogDataset;
    try {
      catalogDataset = yield solidClient.getSolidDataset(catalogDocUrl, {
        fetch
      });
    } catch (err) {
      var _err$response5;
      if ((err === null || err === void 0 ? void 0 : err.statusCode) === 404 || (err === null || err === void 0 || (_err$response5 = err.response) === null || _err$response5 === void 0 ? void 0 : _err$response5.status) === 404) {
        catalogDataset = solidClient.createSolidDataset();
      } else {
        throw err;
      }
    }
    var catalogThing = solidClient.getThing(catalogDataset, catalogResourceUrl);
    if (!catalogThing) {
      catalogThing = solidClient.createThing({
        url: catalogResourceUrl
      });
    }
    catalogThing = solidClient.removeAll(catalogThing, vocabCommonRdf.RDF.type);
    catalogThing = solidClient.addUrl(catalogThing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.Catalog);
    catalogThing = solidClient.removeAll(catalogThing, vocabCommonRdf.DCAT.contactPoint);
    catalogThing = solidClient.setUrl(catalogThing, vocabCommonRdf.DCAT.contactPoint, webId);
    catalogThing = solidClient.removeAll(catalogThing, vocabCommonRdf.DCTERMS.title);
    catalogThing = setLocaleString(catalogThing, vocabCommonRdf.DCTERMS.title, title || "Solid Dataspace Catalog");
    catalogThing = solidClient.removeAll(catalogThing, vocabCommonRdf.DCTERMS.description);
    if (description) {
      catalogThing = setLocaleString(catalogThing, vocabCommonRdf.DCTERMS.description, description);
    }
    catalogThing = solidClient.removeAll(catalogThing, vocabCommonRdf.DCTERMS.modified);
    catalogThing = solidClient.setDatetime(catalogThing, vocabCommonRdf.DCTERMS.modified, new Date());
    catalogDataset = solidClient.setThing(catalogDataset, catalogThing);
    yield solidClient.saveSolidDatasetAt(catalogDocUrl, catalogDataset, {
      fetch
    });
    yield makePublicReadable(catalogDocUrl, fetch);
    yield makePublicReadable("".concat(podRoot).concat(CATALOG_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(DATASET_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(SERIES_CONTAINER), fetch);
    yield makePublicReadable("".concat(podRoot).concat(RECORDS_CONTAINER), fetch);
    yield setCatalogLinkInProfile(webId, catalogResourceUrl, fetch);
    yield registerWebIdInRegistries(webId, fetch, registryConfig);
    return {
      catalogDocUrl,
      catalogUrl: catalogResourceUrl
    };
  });
  return function ensureCatalogStructure(_x38) {
    return _ref17.apply(this, arguments);
  };
}();
var resolveCatalogUrlFromWebId = /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator(function* (webId, fetch) {
    if (!webId || !fetch) return getCatalogResourceUrl(webId);
    try {
      var profileDocUrl = webId.split("#")[0];
      var profileDoc = yield solidClient.getSolidDataset(profileDocUrl, {
        fetch
      });
      var profileThing = solidClient.getThing(profileDoc, webId);
      var profileCatalog = profileThing ? solidClient.getUrl(profileThing, SDP_CATALOG) || solidClient.getUrl(profileThing, vocabCommonRdf.DCAT.catalog) : null;
      if (profileCatalog) return profileCatalog;
    } catch (err) {
      console.warn("Failed to resolve catalog URL from profile:", err);
    }
    return getCatalogResourceUrl(webId);
  });
  return function resolveCatalogUrlFromWebId(_x42, _x43) {
    return _ref20.apply(this, arguments);
  };
}();
var loadRegistryMembers = /*#__PURE__*/function () {
  var _ref21 = _asyncToGenerator(function* (webId, fetch) {
    var members = new Set();
    if (webId) members.add(webId);
    var config = yield loadRegistryConfig(webId, fetch);
    var containers = [];
    if (config.mode === "private") {
      containers = [config.privateRegistry];
    } else {
      containers = config.registries || [];
    }
    var normalized = Array.from(new Set(containers.map(normalizeContainerUrl).filter(Boolean)));
    if (!normalized.length) return Array.from(members);
    for (var containerUrl of normalized) {
      try {
        var containerDataset = yield solidClient.getSolidDataset(containerUrl, {
          fetch
        });
        var resourceUrls = solidClient.getContainedResourceUrlAll(containerDataset);
        for (var resourceUrl of resourceUrls) {
          try {
            var memberDataset = yield solidClient.getSolidDataset(resourceUrl, {
              fetch
            });
            var memberThing = solidClient.getThing(memberDataset, "".concat(resourceUrl, "#it")) || solidClient.getThingAll(memberDataset)[0];
            var memberWebId = memberThing ? solidClient.getUrl(memberThing, vocabCommonRdf.FOAF.member) : "";
            if (memberWebId) members.add(memberWebId);
          } catch (_unused12) {
            // Ignore malformed registry entries.
          }
        }
      } catch (err) {
        console.warn("Failed to load registry container:", containerUrl, err);
      }
    }
    return Array.from(members);
  });
  return function loadRegistryMembers(_x44, _x45) {
    return _ref21.apply(this, arguments);
  };
}();
var parseDatasetFromDoc = (datasetDoc, datasetUrl) => {
  var _datasetDoc$internal_;
  var datasetThing = resolveDatasetThing(datasetDoc, datasetUrl);
  if (!datasetThing) return null;
  var baseIri = (datasetDoc === null || datasetDoc === void 0 || (_datasetDoc$internal_ = datasetDoc.internal_resourceInfo) === null || _datasetDoc$internal_ === void 0 ? void 0 : _datasetDoc$internal_.sourceIri) || getDocumentUrl(datasetUrl);
  var identifier = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.identifier) || datasetUrl;
  var types = solidClient.getUrlAll(datasetThing, vocabCommonRdf.RDF.type) || [];
  var seriesMembersRaw = safeGetUrlAll(datasetThing, DCAT_SERIES_MEMBER);
  var isSeries = types.includes(DCAT_DATASET_SERIES) || types.includes(vocabCommonRdf.DCAT.DatasetSeries) || types.includes("http://www.w3.org/ns/dcat#DatasetSeries") || seriesMembersRaw.length > 0;
  var title = getAnyString(datasetThing, vocabCommonRdf.DCTERMS.title) || "Untitled dataset";
  var description = getAnyString(datasetThing, vocabCommonRdf.DCTERMS.description) || "";
  var issued = solidClient.getDatetime(datasetThing, vocabCommonRdf.DCTERMS.issued);
  var modified = solidClient.getDatetime(datasetThing, vocabCommonRdf.DCTERMS.modified);
  var publisherLiteral = getAnyString(datasetThing, vocabCommonRdf.DCTERMS.publisher) || "";
  var publisher = publisherLiteral;
  if (!publisher) {
    var publisherRef = solidClient.getUrl(datasetThing, vocabCommonRdf.DCTERMS.publisher) || "";
    if (publisherRef) {
      var publisherThing = solidClient.getThing(datasetDoc, publisherRef);
      if (publisherThing) {
        publisher = getAnyString(publisherThing, vocabCommonRdf.FOAF.name) || getAnyString(publisherThing, vocabCommonRdf.VCARD.fn) || getAnyString(publisherThing, vocabCommonRdf.DCTERMS.title) || "";
      }
    }
  }
  var creator = solidClient.getUrl(datasetThing, vocabCommonRdf.DCTERMS.creator) || "";
  var theme = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCAT.theme) || solidClient.getUrl(datasetThing, vocabCommonRdf.DCAT.theme) || "";
  if (!theme) {
    theme = getAnyString(datasetThing, vocabCommonRdf.DCAT.theme) || "";
  }
  var accessRights = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.accessRights) || "";
  var contactRef = solidClient.getUrl(datasetThing, vocabCommonRdf.DCAT.contactPoint) || "";
  var contactLiteral = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCAT.contactPoint) || getAnyString(datasetThing, vocabCommonRdf.DCAT.contactPoint) || "";
  var contact = stripMailto(contactLiteral);
  if (!contact && contactRef) {
    var contactThing = solidClient.getThing(datasetDoc, contactRef);
    if (contactThing) {
      var mailto = solidClient.getUrl(contactThing, vocabCommonRdf.VCARD.hasEmail) || solidClient.getUrl(contactThing, vocabCommonRdf.VCARD.value) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.VCARD.hasEmail) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.VCARD.value) || solidClient.getUrl(contactThing, vocabCommonRdf.FOAF.mbox) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.FOAF.mbox) || "";
      if (mailto) {
        contact = stripMailto(mailto);
      } else {
        contact = getAnyString(contactThing, vocabCommonRdf.VCARD.fn) || "";
      }
    }
  }
  var conformsTo = solidClient.getUrl(datasetThing, vocabCommonRdf.DCTERMS.conformsTo) || solidClient.getUrl(datasetThing, LEGACY_DCAT_CONFORMS_TO) || "";
  var distributions = safeGetUrlAll(datasetThing, vocabCommonRdf.DCAT.distribution);
  var accessUrlDataset = "";
  var accessUrlModel = "";
  var fileFormat = "";
  var distributionAccessType = DISTRIBUTION_ACCESS_TYPES.download;
  distributions.forEach(distUrl => {
    var resolvedDistUrl = resolveUrl(distUrl, baseIri);
    var distThing = solidClient.getThing(datasetDoc, resolvedDistUrl) || solidClient.getThing(datasetDoc, distUrl);
    if (!distThing) return;
    var rawDownloadUrl = solidClient.getUrl(distThing, vocabCommonRdf.DCAT.downloadURL) || "";
    var rawAccessUrl = solidClient.getUrl(distThing, vocabCommonRdf.DCAT.accessURL) || "";
    var distributionUrl = resolveUrl(rawDownloadUrl || rawAccessUrl || "", baseIri);
    var mediaType = solidClient.getStringNoLocale(distThing, vocabCommonRdf.DCAT.mediaType) || solidClient.getStringNoLocale(distThing, vocabCommonRdf.DCTERMS.format) || getAnyString(distThing, vocabCommonRdf.DCTERMS.format) || "";
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
    contact_point: contact,
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
  var _ref22 = _asyncToGenerator(function* (catalogUrl, fetch) {
    var catalogDocUrl = getDocumentUrl(catalogUrl);
    var catalogDataset = yield solidClient.getSolidDataset(catalogDocUrl, {
      fetch
    });
    var catalogThing = solidClient.getThing(catalogDataset, catalogUrl);
    var datasetUrls = catalogThing ? safeGetUrlAll(catalogThing, vocabCommonRdf.DCAT.dataset) : [];
    var resolvedUrls = Array.from(new Set(datasetUrls)).map(url => resolveUrl(url, catalogDocUrl)).filter(Boolean);
    var datasets = yield Promise.all(resolvedUrls.map(/*#__PURE__*/function () {
      var _ref23 = _asyncToGenerator(function* (datasetUrl) {
        try {
          var datasetDoc = yield solidClient.getSolidDataset(getDocumentUrl(datasetUrl), {
            fetch
          });
          return parseDatasetFromDoc(datasetDoc, datasetUrl);
        } catch (err) {
          console.warn("Failed to load dataset", datasetUrl, err);
          return null;
        }
      });
      return function (_x48) {
        return _ref23.apply(this, arguments);
      };
    }()));
    return datasets.filter(Boolean);
  });
  return function loadCatalogDatasets(_x46, _x47) {
    return _ref22.apply(this, arguments);
  };
}();
var mergeDatasets = lists => {
  var map = new Map();
  lists.flat().forEach(dataset => {
    if (!dataset) return;
    var key = dataset.identifier || dataset.datasetUrl;
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
  var _ref24 = _asyncToGenerator(function* (session, fetchOverride) {
    var _session$info4;
    var webId = (session === null || session === void 0 || (_session$info4 = session.info) === null || _session$info4 === void 0 ? void 0 : _session$info4.webId) || "";
    var fetch = fetchOverride || (session === null || session === void 0 ? void 0 : session.fetch) || (typeof window !== "undefined" ? window.fetch.bind(window) : fetchOverride);
    if (!fetch) return {
      datasets: [],
      catalogs: []
    };
    var registryMembers = yield loadRegistryMembers(webId, fetch);
    var catalogUrls = yield Promise.all(registryMembers.map(member => resolveCatalogUrlFromWebId(member, fetch)));
    var uniqueCatalogUrls = Array.from(new Set(catalogUrls.filter(Boolean)));
    var cache = loadCache();
    var now = Date.now();
    var useCacheOnly = now - cache.updatedAt < CACHE_TTL_MS;
    var results = [];
    var updatedCache = _objectSpread2(_objectSpread2({}, cache), {}, {
      catalogs: _objectSpread2({}, cache.catalogs)
    });
    var fetchCatalog = /*#__PURE__*/function () {
      var _ref25 = _asyncToGenerator(function* (catalogUrl) {
        try {
          var datasets = yield loadCatalogDatasets(catalogUrl, fetch);
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
      return function fetchCatalog(_x51) {
        return _ref25.apply(this, arguments);
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
      results.push(_objectSpread2({
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
      return (result.datasets || []).map(dataset => _objectSpread2(_objectSpread2({}, dataset), {}, {
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
  return function loadAggregatedDatasets(_x49, _x50) {
    return _ref24.apply(this, arguments);
  };
}();
var DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";
var DCAT_DATASET_SERIES = "http://www.w3.org/ns/dcat#DatasetSeries";
var DCAT_SERIES_MEMBER = vocabCommonRdf.DCAT.seriesMember || "http://www.w3.org/ns/dcat#seriesMember";
var DCAT_IN_SERIES = vocabCommonRdf.DCAT.inSeries || "http://www.w3.org/ns/dcat#inSeries";
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
  } catch (_unused13) {
    return false;
  }
};
var buildDatasetResource = (datasetDocUrl, input) => {
  var datasetUrl = "".concat(datasetDocUrl, "#it");
  var datasetThing = solidClient.createThing({
    url: datasetUrl
  });
  datasetThing = solidClient.addUrl(datasetThing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.Dataset);
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.identifier);
  datasetThing = solidClient.setStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.identifier, input.identifier);
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.title);
  datasetThing = setLocaleString(datasetThing, vocabCommonRdf.DCTERMS.title, input.title || "");
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.description);
  datasetThing = setLocaleString(datasetThing, vocabCommonRdf.DCTERMS.description, input.description || "");
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.issued);
  datasetThing = solidClient.setDatetime(datasetThing, vocabCommonRdf.DCTERMS.issued, new Date(input.issued || safeNow()));
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.modified);
  datasetThing = solidClient.setDatetime(datasetThing, vocabCommonRdf.DCTERMS.modified, new Date(safeNow()));
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.publisher);
  datasetThing = setLocaleString(datasetThing, vocabCommonRdf.DCTERMS.publisher, input.publisher || "");
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.creator);
  if (input.webid) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCTERMS.creator, input.webid);
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCAT.theme);
  if (input.theme) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCAT.theme, toThemeIri(input.theme));
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.conformsTo);
  datasetThing = solidClient.removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  if (input.access_url_semantic_model) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCTERMS.conformsTo, input.access_url_semantic_model);
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.accessRights);
  datasetThing = solidClient.setStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.accessRights, input.is_public ? "public" : "restricted");
  datasetThing = solidClient.removeAll(datasetThing, DCAT_IN_SERIES);
  if (input.in_series) {
    var seriesList = Array.isArray(input.in_series) ? input.in_series : [input.in_series];
    seriesList.filter(Boolean).forEach(seriesUrl => {
      datasetThing = solidClient.addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }
  return datasetThing;
};
var buildSeriesResource = (seriesDocUrl, input) => {
  var seriesUrl = input.seriesUrl || "".concat(seriesDocUrl, "#it");
  var seriesThing = solidClient.createThing({
    url: seriesUrl
  });
  seriesThing = solidClient.addUrl(seriesThing, vocabCommonRdf.RDF.type, DCAT_DATASET_SERIES);
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.identifier);
  if (input.identifier) {
    seriesThing = solidClient.setStringNoLocale(seriesThing, vocabCommonRdf.DCTERMS.identifier, input.identifier);
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.title);
  seriesThing = setLocaleString(seriesThing, vocabCommonRdf.DCTERMS.title, input.title || "");
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.description);
  if (input.description) {
    seriesThing = setLocaleString(seriesThing, vocabCommonRdf.DCTERMS.description, input.description);
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.issued);
  if (input.issued) {
    seriesThing = solidClient.setDatetime(seriesThing, vocabCommonRdf.DCTERMS.issued, new Date(input.issued));
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.modified);
  seriesThing = solidClient.setDatetime(seriesThing, vocabCommonRdf.DCTERMS.modified, new Date(safeNow()));
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.publisher);
  if (input.publisher) {
    seriesThing = setLocaleString(seriesThing, vocabCommonRdf.DCTERMS.publisher, input.publisher);
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.creator);
  if (input.webid) {
    seriesThing = solidClient.setUrl(seriesThing, vocabCommonRdf.DCTERMS.creator, input.webid);
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCAT.contactPoint);
  if (input.contact_point) {
    var contactUrl = "".concat(seriesDocUrl, "#contact");
    var contactThing = solidClient.createThing({
      url: contactUrl
    });
    contactThing = setLocaleString(contactThing, vocabCommonRdf.VCARD.fn, input.publisher || "");
    contactThing = solidClient.removeAll(contactThing, vocabCommonRdf.VCARD.hasEmail);
    contactThing = solidClient.setUrl(contactThing, vocabCommonRdf.VCARD.hasEmail, "mailto:".concat(input.contact_point));
    input.__contactThing = contactThing;
    seriesThing = solidClient.setUrl(seriesThing, vocabCommonRdf.DCAT.contactPoint, contactUrl);
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCAT.theme);
  if (input.theme) {
    seriesThing = solidClient.setUrl(seriesThing, vocabCommonRdf.DCAT.theme, toThemeIri(input.theme));
  }
  seriesThing = solidClient.removeAll(seriesThing, vocabCommonRdf.DCTERMS.accessRights);
  seriesThing = solidClient.removeAll(seriesThing, DCAT_SERIES_MEMBER);
  (input.seriesMembers || []).filter(memberUrl => isValidUrl(memberUrl)).forEach(memberUrl => {
    seriesThing = solidClient.addUrl(seriesThing, DCAT_SERIES_MEMBER, memberUrl);
  });
  return seriesThing;
};
var buildContactThing = (datasetDocUrl, input) => {
  if (!input.contact_point) return null;
  var contactUrl = "".concat(datasetDocUrl, "#contact");
  var contactThing = solidClient.createThing({
    url: contactUrl
  });
  contactThing = setLocaleString(contactThing, vocabCommonRdf.VCARD.fn, input.publisher || "");
  contactThing = solidClient.removeAll(contactThing, vocabCommonRdf.VCARD.hasEmail);
  contactThing = solidClient.setUrl(contactThing, vocabCommonRdf.VCARD.hasEmail, "mailto:".concat(input.contact_point));
  return contactThing;
};
var buildDistributionThing = (datasetDocUrl, slug, distributionUrl, mediaType, distributionAccessType) => {
  if (!distributionUrl) return null;
  var distUrl = "".concat(datasetDocUrl, "#").concat(slug);
  var distThing = solidClient.createThing({
    url: distUrl
  });
  var linkType = normalizeDistributionAccessType(distributionAccessType);
  distThing = solidClient.addUrl(distThing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.Distribution);
  distThing = solidClient.removeAll(distThing, vocabCommonRdf.DCAT.downloadURL);
  distThing = solidClient.removeAll(distThing, vocabCommonRdf.DCAT.accessURL);
  distThing = linkType === DISTRIBUTION_ACCESS_TYPES.access ? solidClient.setUrl(distThing, vocabCommonRdf.DCAT.accessURL, distributionUrl) : solidClient.setUrl(distThing, vocabCommonRdf.DCAT.downloadURL, distributionUrl);
  distThing = solidClient.removeAll(distThing, vocabCommonRdf.DCAT.mediaType);
  if (mediaType) {
    distThing = solidClient.setStringNoLocale(distThing, vocabCommonRdf.DCAT.mediaType, mediaType);
  }
  return distThing;
};
var addLdpTypeIfLocal = (solidDataset, webId, targetUrl) => {
  if (!solidDataset || !webId || !targetUrl) return solidDataset;
  try {
    var podRoot = getPodRoot$1(webId);
    if (!targetUrl.startsWith(podRoot)) return solidDataset;
  } catch (_unused14) {
    return solidDataset;
  }
  var isContainer = targetUrl.endsWith("/");
  var resourceThing = solidClient.createThing({
    url: targetUrl
  });
  resourceThing = solidClient.addUrl(resourceThing, vocabCommonRdf.RDF.type, vocabCommonRdf.LDP.Resource);
  if (isContainer) {
    resourceThing = solidClient.addUrl(resourceThing, vocabCommonRdf.RDF.type, vocabCommonRdf.LDP.Container);
  }
  return solidClient.setThing(solidDataset, resourceThing);
};
var writeDatasetDocument = /*#__PURE__*/function () {
  var _ref26 = _asyncToGenerator(function* (session, datasetDocUrl, input) {
    var solidDataset;
    try {
      solidDataset = yield solidClient.getSolidDataset(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      if (isNotFound(err)) {
        solidDataset = solidClient.createSolidDataset();
      } else {
        throw err;
      }
    }
    var datasetThing = buildDatasetResource(datasetDocUrl, input);
    var contactThing = buildContactThing(datasetDocUrl, input);
    if (contactThing) {
      solidDataset = solidClient.setThing(solidDataset, contactThing);
      datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCAT.contactPoint, contactThing.url);
    }
    var distDataset = buildDistributionThing(datasetDocUrl, "dist", input.access_url_dataset, input.file_format, input.distribution_access_type);
    if (distDataset) {
      var _session$info5;
      solidDataset = solidClient.setThing(solidDataset, distDataset);
      datasetThing = solidClient.addUrl(datasetThing, vocabCommonRdf.DCAT.distribution, distDataset.url);
      solidDataset = addLdpTypeIfLocal(solidDataset, session === null || session === void 0 || (_session$info5 = session.info) === null || _session$info5 === void 0 ? void 0 : _session$info5.webId, input.access_url_dataset);
    }
    if (input.access_url_semantic_model) {
      var _session$info6;
      solidDataset = addLdpTypeIfLocal(solidDataset, session === null || session === void 0 || (_session$info6 = session.info) === null || _session$info6 === void 0 ? void 0 : _session$info6.webId, input.access_url_semantic_model);
    }
    solidDataset = solidClient.setThing(solidDataset, datasetThing);
    yield solidClient.saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
    var head = yield session.fetch(datasetDocUrl, {
      method: "HEAD"
    });
    if (!head.ok) {
      throw new Error("Dataset write failed (".concat(head.status, ")"));
    }
    yield makePublicReadable(datasetDocUrl, session.fetch);
  });
  return function writeDatasetDocument(_x52, _x53, _x54) {
    return _ref26.apply(this, arguments);
  };
}();
var writeSeriesDocument = /*#__PURE__*/function () {
  var _ref27 = _asyncToGenerator(function* (session, seriesDocUrl, input) {
    var solidDataset;
    try {
      solidDataset = yield solidClient.getSolidDataset(seriesDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      if (isNotFound(err)) {
        solidDataset = solidClient.createSolidDataset();
      } else {
        throw err;
      }
    }
    var seriesThing = buildSeriesResource(seriesDocUrl, input);
    if (input.__contactThing) {
      solidDataset = solidClient.setThing(solidDataset, input.__contactThing);
    }
    solidDataset = solidClient.setThing(solidDataset, seriesThing);
    yield solidClient.saveSolidDatasetAt(seriesDocUrl, solidDataset, {
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
  return function writeSeriesDocument(_x55, _x56, _x57) {
    return _ref27.apply(this, arguments);
  };
}();
var updateCatalogDatasets = /*#__PURE__*/function () {
  var _ref28 = _asyncToGenerator(function* (session, catalogDocUrl, datasetUrl) {
    var {
      remove
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var current = new Set();
    try {
      var catalogDataset = yield solidClient.getSolidDataset(catalogDocUrl, {
        fetch: session.fetch
      });
      var catalogThing = solidClient.getThing(catalogDataset, "".concat(catalogDocUrl, "#it"));
      var existing = catalogThing ? solidClient.getUrlAll(catalogThing, vocabCommonRdf.DCAT.dataset) : [];
      current = new Set(existing.map(url => toCatalogDatasetRef(catalogDocUrl, url)));
    } catch (_unused15) {
      current = new Set();
    }
    var datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
    if (remove) {
      current.delete(datasetRef);
    } else {
      current.add(datasetRef);
    }
    yield writeCatalogDoc(session, catalogDocUrl, Array.from(current));
  });
  return function updateCatalogDatasets(_x58, _x59, _x60) {
    return _ref28.apply(this, arguments);
  };
}();
var linkDatasetToSeries = /*#__PURE__*/function () {
  var _ref29 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield solidClient.getSolidDataset(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series link", datasetDocUrl, err);
      return;
    }
    var datasetThing = solidClient.getThing(solidDataset, datasetUrl);
    if (!datasetThing) {
      datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
    }
    if (!datasetThing) return;
    var existing = solidClient.getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
    if (existing.includes(seriesUrl)) return;
    datasetThing = solidClient.addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    solidDataset = solidClient.setThing(solidDataset, datasetThing);
    yield solidClient.saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
    yield makePublicReadable(datasetDocUrl, session.fetch);
  });
  return function linkDatasetToSeries(_x61, _x62, _x63) {
    return _ref29.apply(this, arguments);
  };
}();
var unlinkDatasetFromSeries = /*#__PURE__*/function () {
  var _ref30 = _asyncToGenerator(function* (session, datasetUrl, seriesUrl) {
    if (!datasetUrl || !seriesUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    var solidDataset;
    try {
      solidDataset = yield solidClient.getSolidDataset(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to read dataset for series unlink", datasetDocUrl, err);
      return;
    }
    var datasetThing = solidClient.getThing(solidDataset, datasetUrl);
    if (!datasetThing) {
      datasetThing = resolveDatasetThing(solidDataset, datasetUrl);
    }
    if (!datasetThing) return;
    var existing = solidClient.getUrlAll(datasetThing, DCAT_IN_SERIES) || [];
    datasetThing = solidClient.removeAll(datasetThing, DCAT_IN_SERIES);
    existing.filter(url => url !== seriesUrl).forEach(url => {
      datasetThing = solidClient.addUrl(datasetThing, DCAT_IN_SERIES, url);
    });
    solidDataset = solidClient.setThing(solidDataset, datasetThing);
    yield solidClient.saveSolidDatasetAt(datasetDocUrl, solidDataset, {
      fetch: session.fetch
    });
  });
  return function unlinkDatasetFromSeries(_x64, _x65, _x66) {
    return _ref30.apply(this, arguments);
  };
}();
var writeRecordDocument = /*#__PURE__*/function () {
  var _ref31 = _asyncToGenerator(function* (session, datasetDocUrl, identifier) {
    var recordDocUrl = "".concat(getPodRoot$1(session.info.webId)).concat(RECORDS_CONTAINER).concat(identifier, ".ttl");
    var recordDataset;
    try {
      recordDataset = yield solidClient.getSolidDataset(recordDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      var _err$response7;
      if ((err === null || err === void 0 ? void 0 : err.statusCode) === 404 || (err === null || err === void 0 || (_err$response7 = err.response) === null || _err$response7 === void 0 ? void 0 : _err$response7.status) === 404) {
        recordDataset = solidClient.createSolidDataset();
      } else {
        throw err;
      }
    }
    var descUrl = "".concat(recordDocUrl, "#desc");
    var existingDesc = solidClient.getThing(recordDataset, descUrl);
    var existingChanges = existingDesc ? solidClient.getUrlAll(existingDesc, SDM_CHANGELOG) : [];
    var descThing = solidClient.createThing({
      url: descUrl
    });
    descThing = solidClient.addUrl(descThing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.CatalogRecord);
    descThing = solidClient.setStringNoLocale(descThing, vocabCommonRdf.DCTERMS.title, "Dataset description record");
    descThing = solidClient.setStringNoLocale(descThing, vocabCommonRdf.DCTERMS.description, "Catalog record for dataset metadata.");
    descThing = solidClient.setUrl(descThing, vocabCommonRdf.FOAF.primaryTopic, datasetDocUrl);
    descThing = solidClient.setDatetime(descThing, vocabCommonRdf.DCTERMS.modified, new Date());
    var changeUrl = "".concat(recordDocUrl, "#change-").concat(Date.now());
    var changeThing = solidClient.createThing({
      url: changeUrl
    });
    changeThing = solidClient.addUrl(changeThing, vocabCommonRdf.RDF.type, SDM_CHANGE_EVENT);
    changeThing = solidClient.setDatetime(changeThing, vocabCommonRdf.DCTERMS.modified, new Date());
    changeThing = solidClient.setStringNoLocale(changeThing, vocabCommonRdf.DCTERMS.description, "Dataset metadata updated.");
    recordDataset = solidClient.setThing(recordDataset, changeThing);
    existingChanges.forEach(url => {
      descThing = solidClient.addUrl(descThing, SDM_CHANGELOG, url);
    });
    descThing = solidClient.addUrl(descThing, SDM_CHANGELOG, changeUrl);
    recordDataset = solidClient.setThing(recordDataset, descThing);
    var aclUrl = "".concat(datasetDocUrl, ".acl");
    var wacUrl = "".concat(recordDocUrl, "#wac");
    var wacThing = solidClient.createThing({
      url: wacUrl
    });
    wacThing = solidClient.addUrl(wacThing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.CatalogRecord);
    wacThing = solidClient.setStringNoLocale(wacThing, vocabCommonRdf.DCTERMS.title, "Dataset ACL record");
    wacThing = solidClient.setStringNoLocale(wacThing, vocabCommonRdf.DCTERMS.description, "Catalog record for the dataset access control.");
    wacThing = solidClient.setUrl(wacThing, vocabCommonRdf.FOAF.primaryTopic, aclUrl);
    wacThing = solidClient.setDatetime(wacThing, vocabCommonRdf.DCTERMS.modified, new Date());
    recordDataset = solidClient.setThing(recordDataset, wacThing);
    yield solidClient.saveSolidDatasetAt(recordDocUrl, recordDataset, {
      fetch: session.fetch
    });
    yield makePublicReadable(recordDocUrl, session.fetch);
  });
  return function writeRecordDocument(_x67, _x68, _x69) {
    return _ref31.apply(this, arguments);
  };
}();
var generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dataset-".concat(Date.now());
};
var createDataset = /*#__PURE__*/function () {
  var _ref32 = _asyncToGenerator(function* (session, input) {
    yield ensureCatalogStructure(session);
    validateDatasetInput(input);
    var identifier = input.identifier || generateIdentifier();
    var datasetDocUrl = "".concat(getPodRoot$1(session.info.webId)).concat(DATASET_CONTAINER).concat(identifier, ".ttl");
    var datasetUrl = "".concat(datasetDocUrl, "#it");
    yield writeDatasetDocument(session, datasetDocUrl, _objectSpread2(_objectSpread2({}, input), {}, {
      identifier
    }));
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), datasetUrl, {
      remove: false
    });
    yield writeRecordDocument(session, datasetDocUrl, identifier);
    clearCache();
    return {
      datasetUrl,
      identifier
    };
  });
  return function createDataset(_x70, _x71) {
    return _ref32.apply(this, arguments);
  };
}();
var createDatasetSeries = /*#__PURE__*/function () {
  var _ref33 = _asyncToGenerator(function* (session, input) {
    var _session$info7;
    if (!(session !== null && session !== void 0 && (_session$info7 = session.info) !== null && _session$info7 !== void 0 && _session$info7.webId)) throw new Error("No Solid WebID available.");
    yield ensureCatalogStructure(session);
    var identifier = input.identifier || generateIdentifier();
    var seriesDocUrl = getSeriesDocUrl(session.info.webId, identifier);
    var seriesUrl = getSeriesResourceUrl(seriesDocUrl);
    var seriesMembers = Array.isArray(input.seriesMembers) ? input.seriesMembers.filter(memberUrl => isValidUrl(memberUrl)) : [];
    yield writeSeriesDocument(session, seriesDocUrl, _objectSpread2(_objectSpread2({}, input), {}, {
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
  return function createDatasetSeries(_x72, _x73) {
    return _ref33.apply(this, arguments);
  };
}();
var updateDataset = /*#__PURE__*/function () {
  var _ref34 = _asyncToGenerator(function* (session, input) {
    if (!input.datasetUrl) throw new Error("Missing dataset URL.");
    validateDatasetInput(input);
    var datasetDocUrl = getDocumentUrl(input.datasetUrl);
    yield writeDatasetDocument(session, datasetDocUrl, input);
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), input.datasetUrl, {
      remove: false
    });
    if (input.identifier) {
      yield writeRecordDocument(session, datasetDocUrl, input.identifier);
    }
    clearCache();
  });
  return function updateDataset(_x74, _x75) {
    return _ref34.apply(this, arguments);
  };
}();
var updateDatasetSeries = /*#__PURE__*/function () {
  var _ref35 = _asyncToGenerator(function* (session, input) {
    var seriesUrl = input.seriesUrl || input.datasetUrl;
    if (!seriesUrl) throw new Error("Missing series URL.");
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    var nextMembers = Array.isArray(input.seriesMembers) ? input.seriesMembers.filter(memberUrl => isValidUrl(memberUrl)) : [];
    var previousMembers = [];
    try {
      var seriesDoc = yield solidClient.getSolidDataset(seriesDocUrl, {
        fetch: session.fetch
      });
      var seriesThing = solidClient.getThing(seriesDoc, seriesUrl) || solidClient.getThingAll(seriesDoc)[0];
      if (seriesThing) {
        previousMembers = solidClient.getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
      }
    } catch (err) {
      console.warn("Failed to read series for update", seriesDocUrl, err);
    }
    yield writeSeriesDocument(session, seriesDocUrl, _objectSpread2(_objectSpread2({}, input), {}, {
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
  return function updateDatasetSeries(_x76, _x77) {
    return _ref35.apply(this, arguments);
  };
}();
var deleteSeriesEntry = /*#__PURE__*/function () {
  var _ref36 = _asyncToGenerator(function* (session, seriesUrl, identifier) {
    if (!seriesUrl) return;
    var seriesDocUrl = getDocumentUrl(seriesUrl);
    var memberUrls = [];
    try {
      var seriesDoc = yield solidClient.getSolidDataset(seriesDocUrl, {
        fetch: session.fetch
      });
      var seriesThing = solidClient.getThing(seriesDoc, seriesUrl) || solidClient.getThingAll(seriesDoc)[0];
      if (seriesThing) {
        memberUrls = solidClient.getUrlAll(seriesThing, DCAT_SERIES_MEMBER) || [];
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
      yield solidClient.deleteFile(seriesDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to delete series doc", seriesDocUrl, err);
    }
    clearCache();
  });
  return function deleteSeriesEntry(_x78, _x79, _x80) {
    return _ref36.apply(this, arguments);
  };
}();
var deleteDatasetEntry = /*#__PURE__*/function () {
  var _ref37 = _asyncToGenerator(function* (session, datasetUrl, identifier) {
    if (!datasetUrl) return;
    var datasetDocUrl = getDocumentUrl(datasetUrl);
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId), datasetUrl, {
      remove: true
    });
    try {
      yield solidClient.deleteFile(datasetDocUrl, {
        fetch: session.fetch
      });
    } catch (err) {
      console.warn("Failed to delete dataset doc", datasetDocUrl, err);
    }
    if (identifier) {
      var recordDocUrl = "".concat(getPodRoot$1(session.info.webId)).concat(RECORDS_CONTAINER).concat(identifier, ".ttl");
      try {
        yield solidClient.deleteFile(recordDocUrl, {
          fetch: session.fetch
        });
      } catch (err) {
        console.warn("Failed to delete record doc", recordDocUrl, err);
      }
    }
    clearCache();
  });
  return function deleteDatasetEntry(_x81, _x82, _x83) {
    return _ref37.apply(this, arguments);
  };
}();
var cleanupCatalogSeriesLinks = /*#__PURE__*/function () {
  var _ref38 = _asyncToGenerator(function* (session) {
    var _session$info8;
    if (!(session !== null && session !== void 0 && (_session$info8 = session.info) !== null && _session$info8 !== void 0 && _session$info8.webId)) throw new Error("No Solid WebID available.");
    var catalogDocUrl = getCatalogDocUrl(session.info.webId);
    var catalogUrl = "".concat(catalogDocUrl, "#it");
    var datasetSeriesPredicate = vocabCommonRdf.DCAT.datasetSeries || "http://www.w3.org/ns/dcat#datasetSeries";
    var catalogDataset = yield solidClient.getSolidDataset(catalogDocUrl, {
      fetch: session.fetch
    });
    var catalogThing = solidClient.getThing(catalogDataset, catalogUrl);
    if (!catalogThing) throw new Error("Catalog thing not found.");
    var datasetRefs = safeGetUrlAll(catalogThing, vocabCommonRdf.DCAT.dataset);
    var seriesRefs = safeGetUrlAll(catalogThing, datasetSeriesPredicate);
    var allRefs = Array.from(new Set([...datasetRefs, ...seriesRefs]));
    var resolvedUrls = allRefs.map(url => resolveUrl(url, catalogDocUrl)).filter(Boolean);
    var catalogDatasets = new Set(datasetRefs.map(url => toCatalogDatasetRef(catalogDocUrl, url)));
    var catalogSeries = new Set(seriesRefs.map(url => toCatalogDatasetRef(catalogDocUrl, url)));
    var finalRefs = new Set([...catalogDatasets, ...catalogSeries]);
    for (var resourceUrl of resolvedUrls) {
      try {
        var docUrl = getDocumentUrl(resourceUrl);
        var doc = yield solidClient.getSolidDataset(docUrl, {
          fetch: session.fetch
        });
        var thing = resolveDatasetThing(doc, resourceUrl);
        if (!thing) continue;
        var types = solidClient.getUrlAll(thing, vocabCommonRdf.RDF.type) || [];
        var isSeries = types.includes(DCAT_DATASET_SERIES) || types.includes(vocabCommonRdf.DCAT.DatasetSeries) || safeGetUrlAll(thing, DCAT_SERIES_MEMBER).length > 0;
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
    yield writeCatalogDoc(session, catalogDocUrl, Array.from(finalRefs));
    clearCache();
  });
  return function cleanupCatalogSeriesLinks(_x84) {
    return _ref38.apply(this, arguments);
  };
}();
var parseTurtleIntoStore = /*#__PURE__*/function () {
  var _ref39 = _asyncToGenerator(function* (store, turtle, baseIRI) {
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
  return function parseTurtleIntoStore(_x85, _x86, _x87) {
    return _ref39.apply(this, arguments);
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
  var _ref40 = _asyncToGenerator(function* (session) {
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
  return function buildMergedCatalogDownload(_x88) {
    return _ref40.apply(this, arguments);
  };
}();

var DatasetAddModal = _ref => {
  var {
    onClose,
    fetchDatasets
  } = _ref;
  var [newDataset, setNewDataset] = React.useState({
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
  var [datasetPodFiles, setDatasetPodFiles] = React.useState([]);
  var [modelPodFiles, setModelPodFiles] = React.useState([]);
  var [loading, setLoading] = React.useState(false);
  var [datasetSource, setDatasetSource] = React.useState("upload");
  var [modelSource, setModelSource] = React.useState("upload");
  var [datasetUpload, setDatasetUpload] = React.useState({
    file: null,
    url: "",
    error: ""
  });
  var [modelUpload, setModelUpload] = React.useState({
    file: null,
    url: "",
    error: ""
  });
  var hasRequiredFields = Boolean(newDataset.access_url_dataset);
  var [showSemanticModel, setShowSemanticModel] = React.useState(false);

  // Use shared Solid session from solidSession.js
  var [solidUserName, setSolidUserName] = React.useState('');
  var [solidUserPhoto, setSolidUserPhoto] = React.useState('');
  var [webId, setWebId] = React.useState('');
  var [datasetUploadPath, setDatasetUploadPath] = React.useState("/public/");
  var [modelUploadPath, setModelUploadPath] = React.useState("/public/");
  var [datasetType, setDatasetType] = React.useState("dataset");
  var [existingDatasets, setExistingDatasets] = React.useState([]);
  var [seriesMembers, setSeriesMembers] = React.useState([]);
  var [seriesData, setSeriesData] = React.useState({
    title: "",
    description: "",
    theme: "",
    issued: "",
    publisher: "",
    contact_point: ""
  });
  var requiresPublicAccess = datasetSource === "external" || modelSource === "external";
  React.useEffect(() => {
    if (!requiresPublicAccess || newDataset.is_public) return;
    setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      is_public: true
    }));
  }, [requiresPublicAccess, newDataset.is_public]);
  React.useEffect(() => {
    var fetchSolidProfile = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var profileDataset = yield solidClient.getSolidDataset(session.info.webId, {
            fetch: session.fetch
          });
          var profile = solidClient.getThing(profileDataset, session.info.webId);
          var name = solidClient.getStringNoLocale(profile, vocabCommonRdf.FOAF.name) || solidClient.getStringNoLocale(profile, vocabCommonRdf.VCARD.fn) || "Solid Pod User";
          var emailNodes = solidClient.getUrlAll(profile, vocabCommonRdf.VCARD.hasEmail);
          var email = "";
          if (emailNodes.length > 0) {
            var emailThing = solidClient.getThing(profileDataset, emailNodes[0]);
            var mailto = solidClient.getUrl(emailThing, vocabCommonRdf.VCARD.value);
            if (mailto !== null && mailto !== void 0 && mailto.startsWith("mailto:")) {
              email = mailto.replace("mailto:", "");
            }
          }
          setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
            publisher: name,
            contact_point: email
          }));
          setSolidUserName(name);
          setWebId(session.info.webId);
          setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
            webid: session.info.webId
          }));
          setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
            publisher: name,
            contact_point: email
          }));
          var photoRef = solidClient.getUrl(profile, vocabCommonRdf.VCARD.hasPhoto) || solidClient.getUrl(profile, vocabCommonRdf.FOAF.img);
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
    var loadPodFiles = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
        if (!session.info.webId) return;
        var datasetFiles = [];
        var modelFiles = [];
        var isCatalogResource = url => url.includes("/catalog/");
        var _traverse = /*#__PURE__*/function () {
          var _ref4 = _asyncToGenerator(function* (containerUrl) {
            try {
              if (isCatalogResource(containerUrl)) return;
              var dataset = yield solidClient.getSolidDataset(containerUrl, {
                fetch: session.fetch
              });
              var resources = solidClient.getContainedResourceUrlAll(dataset);
              for (var res of resources) {
                if (isCatalogResource(res)) {
                  continue;
                }
                if (res.endsWith('/')) {
                  yield _traverse(res);
                } else if (/\.(csv|json|ttl|jsonld|rdf|xml|pdf|docx|txt)$/i.test(res)) {
                  datasetFiles.push(res);
                  if (res.endsWith('.ttl')) {
                    modelFiles.push(res);
                  }
                } else if (res.endsWith('.ttl')) {
                  modelFiles.push(res);
                }
              }
            } catch (err) {
              console.error("Error loading container ".concat(containerUrl, ":"), err);
            }
          });
          return function traverse(_x) {
            return _ref4.apply(this, arguments);
          };
        }();
        try {
          var podRoot = session.info.webId.split("/profile/")[0];
          var rootContainer = podRoot.endsWith('/') ? podRoot : "".concat(podRoot, "/");
          yield _traverse(rootContainer);
          setDatasetPodFiles(datasetFiles);
          setModelPodFiles(modelFiles);
        } catch (err) {
          console.error("Error loading pod files:", err);
        }
      });
      return function loadPodFiles() {
        return _ref3.apply(this, arguments);
      };
    }();
    var loadExistingDatasets = /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator(function* () {
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
        return _ref5.apply(this, arguments);
      };
    }();
    fetchSolidProfile();
    loadPodFiles();
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
  var handleInputChange = e => {
    var {
      name,
      value
    } = e.target;
    var inferredMediaType = name === 'access_url_dataset' ? inferMediaType(value) : '';
    setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/public/";
    if (!value) return fallback;
    var path = value.trim();
    if (!path.startsWith("/")) path = "/".concat(path);
    if (!path.endsWith("/")) path = "".concat(path, "/");
    return path;
  };
  var ensureContainer = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (containerUrl) {
      try {
        yield solidClient.createContainerAt(containerUrl, {
          fetch: session.fetch
        });
      } catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.statusCode) !== 409) {
          throw err;
        }
      }
    });
    return function ensureContainer(_x2) {
      return _ref6.apply(this, arguments);
    };
  }();
  var ensureUploadContainer = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* (path) {
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
    return function ensureUploadContainer(_x3) {
      return _ref7.apply(this, arguments);
    };
  }();
  var uploadFile = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(function* (file, pathOverride) {
      if (!file) return "";
      var uploads = yield ensureUploadContainer(pathOverride);
      var safeName = file.name || "upload-".concat(Date.now());
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
    return function uploadFile(_x4, _x5) {
      return _ref8.apply(this, arguments);
    };
  }();
  var handleDatasetFileSelect = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(function* (event) {
      var _event$target;
      var file = event === null || event === void 0 || (_event$target = event.target) === null || _event$target === void 0 || (_event$target = _event$target.files) === null || _event$target === void 0 ? void 0 : _event$target[0];
      setDatasetUpload({
        file: file || null,
        url: "",
        error: ""
      });
      if (!file) return;
      try {
        var url = yield uploadFile(file, datasetUploadPath);
        setDatasetUpload({
          file,
          url,
          error: ""
        });
        setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
          access_url_dataset: url,
          file_format: inferMediaType(url)
        }));
      } catch (err) {
        setDatasetUpload({
          file,
          url: "",
          error: "Upload failed. Please try again."
        });
      }
    });
    return function handleDatasetFileSelect(_x6) {
      return _ref9.apply(this, arguments);
    };
  }();
  var handleModelFileSelect = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(function* (event) {
      var _event$target2;
      var file = event === null || event === void 0 || (_event$target2 = event.target) === null || _event$target2 === void 0 || (_event$target2 = _event$target2.files) === null || _event$target2 === void 0 ? void 0 : _event$target2[0];
      setModelUpload({
        file: file || null,
        url: "",
        error: ""
      });
      if (!file) return;
      try {
        var url = yield uploadFile(file, modelUploadPath);
        setModelUpload({
          file,
          url,
          error: ""
        });
        setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
          access_url_semantic_model: url
        }));
      } catch (err) {
        setModelUpload({
          file,
          url: "",
          error: "Upload failed. Please try again."
        });
      }
    });
    return function handleModelFileSelect(_x7) {
      return _ref10.apply(this, arguments);
    };
  }();
  var handleDatasetDrop = /*#__PURE__*/function () {
    var _ref11 = _asyncToGenerator(function* (event) {
      var _event$dataTransfer;
      event.preventDefault();
      var file = (_event$dataTransfer = event.dataTransfer) === null || _event$dataTransfer === void 0 || (_event$dataTransfer = _event$dataTransfer.files) === null || _event$dataTransfer === void 0 ? void 0 : _event$dataTransfer[0];
      if (!file) return;
      yield handleDatasetFileSelect({
        target: {
          files: [file]
        }
      });
    });
    return function handleDatasetDrop(_x8) {
      return _ref11.apply(this, arguments);
    };
  }();
  var handleModelDrop = /*#__PURE__*/function () {
    var _ref12 = _asyncToGenerator(function* (event) {
      var _event$dataTransfer2;
      event.preventDefault();
      var file = (_event$dataTransfer2 = event.dataTransfer) === null || _event$dataTransfer2 === void 0 || (_event$dataTransfer2 = _event$dataTransfer2.files) === null || _event$dataTransfer2 === void 0 ? void 0 : _event$dataTransfer2[0];
      if (!file) return;
      yield handleModelFileSelect({
        target: {
          files: [file]
        }
      });
    });
    return function handleModelDrop(_x9) {
      return _ref12.apply(this, arguments);
    };
  }();
  var handleSave = /*#__PURE__*/function () {
    var _ref13 = _asyncToGenerator(function* () {
      try {
        setLoading(true);
        if (datasetType === "dataset") {
          if (!hasRequiredFields) {
            alert("Dataset link is required.");
            return;
          }
          if (datasetSource === "external" && !newDataset.is_public) {
            alert("Public external links are currently supported only for public datasets.");
            return;
          }
          if (modelSource === "external" && !newDataset.is_public) {
            alert("External semantic model links are currently supported only for public datasets.");
            return;
          }
          if (datasetSource === "upload" && datasetUpload.file && !newDataset.access_url_dataset) {
            var url = yield uploadFile(datasetUpload.file, datasetUploadPath);
            setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
              access_url_dataset: url
            }));
          }
          if (showSemanticModel && modelSource === "upload" && modelUpload.file && !newDataset.access_url_semantic_model) {
            var _url = yield uploadFile(modelUpload.file, modelUploadPath);
            setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
              access_url_semantic_model: _url
            }));
          }
          yield ensureCatalogStructure(session, {
            title: solidUserName ? "".concat(solidUserName, "'s Catalog") : undefined
          });
          yield createDataset(session, _objectSpread2(_objectSpread2({}, newDataset), {}, {
            webid: webId
          }));
          yield fetchDatasets();
          onClose();
          return;
        }
        if (!seriesData.title.trim()) {
          alert("Series title is required.");
          return;
        }
        if (seriesMembers.length === 0) {
          alert("Please add at least one series member.");
          return;
        }
        var createdMembers = seriesMembers.filter(member => member.kind === "existing" && member.datasetUrl).map(member => member.datasetUrl);
        yield createDatasetSeries(session, _objectSpread2(_objectSpread2({}, seriesData), {}, {
          webid: webId,
          seriesMembers: Array.from(new Set(createdMembers))
        }));
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
      return _ref13.apply(this, arguments);
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
  var renderFileCards = (label, selectedValue, files, icon, onSelect) => /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "font-weight-bold mb-2"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap file-card-container"
  }, files.map(fileUrl => {
    var fileName = fileUrl.split('/').pop();
    var isSelected = selectedValue === fileUrl;
    return /*#__PURE__*/React.createElement("div", {
      key: fileUrl,
      onClick: () => onSelect(fileUrl),
      className: "card p-2 shadow-sm file-card ".concat(isSelected ? 'file-card-selected border-primary' : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-flex align-items-center"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid ".concat(icon, " fa-lg text-secondary mr-2")
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-truncate",
      title: fileName
    }, fileName)));
  })));
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
  var renderUploadBox = _ref14 => {
    var {
      label,
      accept,
      onFileChange,
      onDrop,
      state,
      inputId,
      hint
    } = _ref14;
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
    })), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint), state.url && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint success"
    }, "Uploaded to ", state.url), state.error && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint error"
    }, state.error));
  };
  var renderExternalUrlInput = _ref15 => {
    var {
      label,
      name,
      value,
      placeholder,
      hint
    } = _ref15;
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
  }), " Add Dataset (Series)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose
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
  }, "What do you want to add?"), /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn ".concat(datasetType === "dataset" ? "btn-primary" : "btn-outline-secondary"),
    onClick: () => setDatasetType("dataset")
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-database mr-2"
  }), "Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn ".concat(datasetType === "series" ? "btn-primary" : "btn-outline-secondary"),
    onClick: () => setDatasetType("series")
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-layer-group mr-2"
  }), "Dataset Series"))), datasetType === "dataset" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-section mb-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "General Information"), renderInputWithIcon("Title", "title", "text", "fa-heading"), renderInputWithIcon("Description", "description", "textarea", "fa-align-left"), renderInputWithIcon("Theme", "theme", "text", "fa-tags"), /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Access Rights"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    name: "is_public",
    value: newDataset.is_public ? 'public' : 'restricted',
    onChange: e => setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      is_public: e.target.value === 'public'
    })),
    disabled: requiresPublicAccess,
    style: {
      paddingLeft: '30px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "public"
  }, "Public"), /*#__PURE__*/React.createElement("option", {
    value: "restricted"
  }, "Restricted"))), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Dataset Resource"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "upload-path-row"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "dataset-upload-path"
  }, "Save files to"), /*#__PURE__*/React.createElement("input", {
    id: "dataset-upload-path",
    type: "text",
    value: datasetUploadPath,
    onChange: e => setDatasetUploadPath(e.target.value),
    onBlur: e => setDatasetUploadPath(normalizeUploadPath(e.target.value, "/public/")),
    placeholder: "/public/"
  })), datasetSource === "upload" ? renderUploadBox({
    label: "Upload dataset file",
    accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
    onFileChange: handleDatasetFileSelect,
    onDrop: handleDatasetDrop,
    state: datasetUpload,
    hint: "Allowed: CSV, JSON, TTL, JSON-LD, RDF, XML, PDF, DOCX, TXT",
    inputId: "dataset-upload-input"
  }) : datasetSource === "pod" ? renderFileCards("Select Dataset File", newDataset.access_url_dataset, datasetPodFiles, "fa-file-csv", fileUrl => setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
    access_url_dataset: fileUrl,
    file_format: inferMediaType(fileUrl)
  }))) : renderExternalUrlInput({
    label: "External Dataset link",
    name: "access_url_dataset",
    value: newDataset.access_url_dataset,
    placeholder: "https://..."
  }), datasetSource === "external" && /*#__PURE__*/React.createElement("div", {
    className: "upload-hint"
  }, "External links are currently supported only for public datasets.")), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic Model File"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Optional")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2"
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
      setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
  }), " Create Semantic Model"))), showSemanticModel && /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "upload-path-row"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "model-upload-path"
  }, "Save files to"), /*#__PURE__*/React.createElement("input", {
    id: "model-upload-path",
    type: "text",
    value: modelUploadPath,
    onChange: e => setModelUploadPath(e.target.value),
    onBlur: e => setModelUploadPath(normalizeUploadPath(e.target.value, "/public/")),
    placeholder: "/public/"
  })), modelSource === "upload" ? renderUploadBox({
    label: "Upload semantic model",
    accept: ".ttl",
    onFileChange: handleModelFileSelect,
    onDrop: handleModelDrop,
    state: modelUpload,
    hint: "Allowed: TTL",
    inputId: "model-upload-input"
  }) : modelSource === "pod" ? renderFileCards("", newDataset.access_url_semantic_model, modelPodFiles, "fa-project-diagram", fileUrl => setNewDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
    access_url_semantic_model: fileUrl
  }))) : renderExternalUrlInput({
    label: "Public external semantic model link",
    name: "access_url_semantic_model",
    value: newDataset.access_url_semantic_model,
    placeholder: "https://example.org/model.ttl",
    hint: "The detail view can only render the graph if this URL returns RDF/Turtle directly."
  })))), datasetType === "series" && /*#__PURE__*/React.createElement("div", {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      theme: e.target.value
    })),
    style: {
      paddingLeft: '30px'
    }
  })), /*#__PURE__*/React.createElement("label", {
    htmlFor: "series-issued",
    className: "form-label-compact"
  }, "Issued Date"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-calendar-plus input-icon input-icon-date"
  }), /*#__PURE__*/React.createElement("input", {
    id: "series-issued",
    className: "form-control",
    type: "date",
    value: seriesData.issued,
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
  }, seriesMembers.map((member, idx) => {
    var _member$input;
    var label = member.kind === "existing" ? member.label : ((_member$input = member.input) === null || _member$input === void 0 ? void 0 : _member$input.title) || "New dataset";
    return /*#__PURE__*/React.createElement("span", {
      key: "".concat(member.kind, "-").concat(idx),
      className: "badge badge-light border"
    }, label, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-link btn-sm ml-2",
      onClick: () => setSeriesMembers(prev => prev.filter((_, index) => index !== idx))
    }, "x"));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success",
    onClick: handleSave,
    disabled: loading || datasetType === "dataset" && !hasRequiredFields || datasetType === "series" && !seriesData.title.trim(),
    title: datasetType === "dataset" && !hasRequiredFields ? "Dataset link is required" : ""
  }, loading ? /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-spinner fa-spin mr-2"
  }) : /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-floppy-disk mr-2"
  }), loading ? "Saving..." : datasetType === "series" ? "Save Series" : "Save Dataset")))));
};

var RDFGraph = _ref => {
  var {
    triples,
    onDoubleClick
  } = _ref;
  var containerRef = React.useRef(null);
  var networkRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  React.useEffect(() => {
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
    networkRef.current = new visNetwork.Network(containerRef.current, data, options);
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
  var [message, setMessage] = React.useState('');
  var [isSubmitting, setIsSubmitting] = React.useState(false);
  var [error, setError] = React.useState("");
  var resolveInboxUrl = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (ownerWebId) {
      var profileDataset = yield solidClient.getSolidDataset(ownerWebId, {
        fetch: session.fetch
      });
      var profile = solidClient.getThing(profileDataset, ownerWebId);
      if (!profile) return null;
      return solidClient.getUrl(profile, vocabCommonRdf.LDP.inbox);
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

var SemanticModelModal = _ref => {
  var {
    triples,
    onClose
  } = _ref;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal fade show modal-show semantic-model-modal",
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
    className: "fa-solid fa-project-diagram mr-2"
  }), " Semantic Model"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, triples.length > 0 ? /*#__PURE__*/React.createElement(RDFGraph, {
    triples: triples
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-muted"
  }, "No RDF triples found.")))));
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
var handleFileDownload = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (url, fileName) {
    try {
      var res = yield session.fetch(url);
      if (!res.ok) throw new Error("Download failed.");
      var blob = yield res.blob();
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file.");
    }
  });
  return function handleFileDownload(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var openExternalLink = url => {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
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
var DatasetDetailModal = _ref2 => {
  var {
    dataset,
    onClose,
    sessionWebId,
    userName,
    userEmail,
    datasets = []
  } = _ref2;
  var [triples, setTriples] = React.useState([]);
  var [canAccessDataset, setCanAccessDataset] = React.useState(false);
  var [canAccessModel, setCanAccessModel] = React.useState(false);
  var [showRequestModal, setShowRequestModal] = React.useState(false);
  var [showRequestSuccess, setShowRequestSuccess] = React.useState(false);
  var [showSemanticModal, setShowSemanticModal] = React.useState(false);
  var [requestPending, setRequestPending] = React.useState(false);
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
  React.useEffect(() => {
    var cancelled = false;
    var loadTriples = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* () {
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
          var parser = new n3.Parser();
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
        return _ref3.apply(this, arguments);
      };
    }();
    loadTriples();
    return () => {
      cancelled = true;
    };
  }, [dataset, canAccessModel]);
  React.useEffect(() => {
    var checkAccess = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator(function* () {
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
          var _ref5 = _asyncToGenerator(function* (url) {
            if (!url) return false;
            if (!isPodManagedUrl(url)) {
              return false;
            }
            try {
              var file = yield solidClient.getFileWithAcl(url, {
                fetch: session.fetch
              });
              var access = solidClient.getAgentAccess(file, sessionWebId);
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
          return function hasAclAccess(_x3) {
            return _ref5.apply(this, arguments);
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
        return _ref4.apply(this, arguments);
      };
    }();
    checkAccess();
  }, [dataset, sessionWebId]);
  React.useEffect(() => {
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
  if (!dataset) return null;
  var hasSemanticModel = Boolean(dataset.access_url_semantic_model);
  var datasetLinkType = dataset.distribution_access_type === "access" ? "access" : "download";
  var datasetFileName = getResourceLabel(dataset.access_url_dataset, {
    fallback: "Dataset resource"
  });
  var modelFileName = getResourceLabel(dataset.access_url_semantic_model, {
    fallback: "Semantic model"
  });
  var datasetActionIsDownload = datasetLinkType === "download" && isPodManagedUrl(dataset.access_url_dataset);
  var modelActionIsDownload = hasSemanticModel && isPodManagedUrl(dataset.access_url_semantic_model);
  var hasUserAccess = dataset.is_public || canAccessDataset || canAccessModel;
  var canRequestAccess = !isSeries && !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);
  var requestButtonDisabled = canRequestAccess && requestPending;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal show modal-show dataset-detail-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-circle-info mr-2"
  }), ' ', isSeries ? "Dataset Series Details" : "Dataset Details"), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center"
  }, canRequestAccess && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light mr-2",
    onClick: () => setShowRequestModal(true),
    disabled: requestButtonDisabled,
    title: requestButtonDisabled ? "Request already sent. Waiting for the dataset owner." : "Request access to this dataset"
  }, requestButtonDisabled ? "Request Pending" : "Request Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("span", null, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body d-flex ".concat(isSeries ? "series-only" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "dataset-detail-left"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "list-group"
  }, /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-heading mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Title:"), " ", dataset.title), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-align-left mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Description:"), " ", dataset.description), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-tags mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Theme:"), " ", formatTheme(dataset.theme)), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-calendar-plus mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Issued Date:"), " ", formatDate(dataset.issued)), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-calendar-check mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Modified Date:"), " ", formatDate(dataset.modified)), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-user mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Publisher:"), " ", dataset.publisher), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-envelope mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Contact:"), ' ', dataset.contact_point ? /*#__PURE__*/React.createElement("a", {
    href: "mailto:".concat(dataset.contact_point)
  }, dataset.contact_point) : /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "N/A")), isSeries ? /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-layer-group mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Series Members:"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, (dataset.seriesMembers || []).length === 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "No members listed.") : /*#__PURE__*/React.createElement("div", {
    className: "series-members-scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-column gap-3"
  }, dataset.seriesMembers.map(url => {
    var resolved = resolveSeriesMember(url);
    var info = datasetLookup.get(url);
    return /*#__PURE__*/React.createElement("div", {
      key: url,
      className: "card shadow-sm border-0 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-flex justify-content-between align-items-start"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-weight-bold"
    }, resolved.title), (info === null || info === void 0 ? void 0 : info.description) && /*#__PURE__*/React.createElement("div", {
      className: "text-muted small mt-1"
    }, info.description)), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-light"
    }, info !== null && info !== void 0 && info.is_public ? "Public" : "Restricted")), /*#__PURE__*/React.createElement("div", {
      className: "small text-muted mt-2"
    }, (info === null || info === void 0 ? void 0 : info.publisher) && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Publisher:"), " ", info.publisher), (info === null || info === void 0 ? void 0 : info.issued) && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Issued:"), " ", formatDate(info.issued)), (info === null || info === void 0 ? void 0 : info.modified) && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Modified:"), " ", formatDate(info.modified))), /*#__PURE__*/React.createElement("div", {
      className: "mt-2"
    }, /*#__PURE__*/React.createElement("a", {
      href: resolved.url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, "Open dataset")));
  }))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("li", {
    className: "list-group-item d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-file-csv mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Dataset:"), ' ', canAccessDataset ? /*#__PURE__*/React.createElement("a", {
    href: dataset.access_url_dataset,
    target: "_blank",
    rel: "noopener noreferrer"
  }, datasetFileName) : /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "Restricted")), canAccessDataset && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-link text-dark",
    onClick: () => {
      if (datasetActionIsDownload) {
        handleFileDownload(dataset.access_url_dataset, datasetFileName);
        return;
      }
      openExternalLink(dataset.access_url_dataset);
    },
    title: datasetActionIsDownload ? "Download dataset" : "Open external link"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid ".concat(datasetActionIsDownload ? "fa-download" : "fa-arrow-up-right-from-square")
  }))), hasSemanticModel && /*#__PURE__*/React.createElement("li", {
    className: "list-group-item d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-project-diagram mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Semantic Model:"), ' ', canAccessModel ? /*#__PURE__*/React.createElement("a", {
    href: dataset.access_url_semantic_model,
    target: "_blank",
    rel: "noopener noreferrer"
  }, modelFileName) : /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "Restricted")), canAccessModel && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-link text-dark",
    onClick: () => {
      if (modelActionIsDownload) {
        handleFileDownload(dataset.access_url_semantic_model, modelFileName);
        return;
      }
      openExternalLink(dataset.access_url_semantic_model);
    },
    title: modelActionIsDownload ? "Download semantic model" : "Open semantic model link"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid ".concat(modelActionIsDownload ? "fa-download" : "fa-arrow-up-right-from-square")
  }))), /*#__PURE__*/React.createElement("li", {
    className: "list-group-item"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock mr-2"
  }), /*#__PURE__*/React.createElement("strong", null, "Access Rights:"), ' ', dataset.is_public ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-globe",
    title: "Public"
  }), " Public") : hasUserAccess ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock-open text-success",
    title: "Restricted (You have access)"
  }), " Restricted (You have access)") : /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock text-danger",
    title: "Restricted"
  }), " Restricted"))))), !isSeries && hasSemanticModel && /*#__PURE__*/React.createElement("div", {
    className: "dataset-detail-right d-flex align-items-center justify-content-center ml-3",
    title: "Double-click to enlarge"
  }, triples.length > 0 ? /*#__PURE__*/React.createElement(RDFGraph, {
    triples: triples,
    onDoubleClick: () => setShowSemanticModal(true)
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-muted"
  }, "No RDF triples found.")))))), showRequestModal && !isSeries && /*#__PURE__*/React.createElement(RequestDatasetModal, {
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
  }), showSemanticModal && !isSeries && /*#__PURE__*/React.createElement(SemanticModelModal, {
    triples: triples,
    onClose: () => setShowSemanticModal(false)
  }));
};

var DatasetDeleteModal = _ref => {
  var {
    onClose,
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
        onClose();
      } catch (error) {
        console.error("Error deleting dataset:", error);
      }
    });
    return function handleDelete() {
      return _ref2.apply(this, arguments);
    };
  }();
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
    className: "fa-solid fa-trash mr-2"
  }), " Delete ", (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series" ? "Series" : "Dataset"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "close",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body text-center"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-triangle-exclamation fa-8x text-danger mb-4"
  }), /*#__PURE__*/React.createElement("p", {
    className: "lead"
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

  var [editedDataset, setEditedDataset] = React.useState(null);
  var [datasetPodFiles, setDatasetPodFiles] = React.useState([]);
  var [modelPodFiles, setModelPodFiles] = React.useState([]);
  var [webId, setWebId] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  var [datasetSource, setDatasetSource] = React.useState("pod");
  var [modelSource, setModelSource] = React.useState("pod");
  var [datasetUpload, setDatasetUpload] = React.useState({
    file: null,
    url: "",
    error: ""
  });
  var [modelUpload, setModelUpload] = React.useState({
    file: null,
    url: "",
    error: ""
  });
  var [datasetUploadPath, setDatasetUploadPath] = React.useState("/public/");
  var [modelUploadPath, setModelUploadPath] = React.useState("/public/");
  var [solidUserName, setSolidUserName] = React.useState('');
  var [solidUserPhoto, setSolidUserPhoto] = React.useState('');
  var [showSemanticModel, setShowSemanticModel] = React.useState(false);
  var [existingDatasets, setExistingDatasets] = React.useState([]);
  var [seriesMembers, setSeriesMembers] = React.useState([]);
  var [seriesData, setSeriesData] = React.useState({
    title: "",
    description: "",
    theme: "",
    issued: "",
    publisher: "",
    contact_point: ""
  });
  var hasRequiredFields = Boolean(editedDataset === null || editedDataset === void 0 ? void 0 : editedDataset.access_url_dataset);
  var requiresPublicAccess = datasetSource === "external" || modelSource === "external";
  var isSeries = (dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) === "series";
  React.useEffect(() => {
    if (!requiresPublicAccess || !editedDataset || editedDataset.is_public) return;
    setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      is_public: true
    }));
  }, [requiresPublicAccess, editedDataset]);
  React.useEffect(() => {
    var _dataset$issued, _dataset$modified;
    if (!dataset) return;
    var podRoot = session.info.webId ? (() => {
      var base = session.info.webId.split("/profile/")[0];
      return base.endsWith("/") ? base : "".concat(base, "/");
    })() : "";
    setEditedDataset(_objectSpread2(_objectSpread2({}, dataset), {}, {
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
  React.useEffect(() => {
    var loadProfileAndFiles = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* () {
        if (!session.info.isLoggedIn || !session.info.webId) return;
        try {
          var profileDataset = yield solidClient.getSolidDataset(session.info.webId, {
            fetch: session.fetch
          });
          var profile = solidClient.getThing(profileDataset, session.info.webId);
          var name = solidClient.getStringNoLocale(profile, vocabCommonRdf.FOAF.name) || solidClient.getStringNoLocale(profile, vocabCommonRdf.VCARD.fn) || 'Solid Pod User';
          var emailNode = solidClient.getUrlAll(profile, vocabCommonRdf.VCARD.hasEmail)[0];
          var email = '';
          if (emailNode) {
            var _getUrl;
            var emailThing = solidClient.getThing(profileDataset, emailNode);
            email = ((_getUrl = solidClient.getUrl(emailThing, vocabCommonRdf.VCARD.value)) === null || _getUrl === void 0 ? void 0 : _getUrl.replace('mailto:', '')) || '';
          }
          setSolidUserName(name);
          setWebId(session.info.webId);
          setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
            publisher: name,
            contact_point: email,
            webid: session.info.webId
          }));
          setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
            publisher: name,
            contact_point: email
          }));
          var photoRef = solidClient.getUrl(profile, vocabCommonRdf.VCARD.hasPhoto) || solidClient.getUrl(profile, vocabCommonRdf.FOAF.img);
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
          var podRoot = session.info.webId.split("/profile/")[0];
          var rootContainer = podRoot.endsWith('/') ? podRoot : "".concat(podRoot, "/");
          var datasetFiles = [];
          var modelFiles = [];
          var isCatalogResource = url => url.includes("/catalog/");
          var _traverse = /*#__PURE__*/function () {
            var _ref3 = _asyncToGenerator(function* (containerUrl) {
              try {
                if (isCatalogResource(containerUrl)) return;
                var _dataset = yield solidClient.getSolidDataset(containerUrl, {
                  fetch: session.fetch
                });
                var resources = solidClient.getContainedResourceUrlAll(_dataset);
                for (var _res of resources) {
                  if (isCatalogResource(_res)) {
                    continue;
                  }
                  if (_res.endsWith('/')) {
                    yield _traverse(_res);
                  } else if (/\.(csv|json|ttl|jsonld|rdf|xml|pdf|docx|txt)$/i.test(_res)) {
                    datasetFiles.push(_res);
                    if (_res.endsWith('.ttl')) {
                      modelFiles.push(_res);
                    }
                  } else if (_res.endsWith('.ttl')) {
                    modelFiles.push(_res);
                  }
                }
              } catch (err) {
                console.error("Failed to load container ".concat(containerUrl), err);
              }
            });
            return function traverse(_x) {
              return _ref3.apply(this, arguments);
            };
          }();
          yield _traverse(rootContainer);
          setDatasetPodFiles(datasetFiles);
          setModelPodFiles(modelFiles);
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
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/public/";
    if (!value) return fallback;
    var path = value.trim();
    if (!path.startsWith("/")) path = "/".concat(path);
    if (!path.endsWith("/")) path = "".concat(path, "/");
    return path;
  };
  var ensureContainer = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (containerUrl) {
      try {
        yield solidClient.createContainerAt(containerUrl, {
          fetch: session.fetch
        });
      } catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.statusCode) !== 409) {
          throw err;
        }
      }
    });
    return function ensureContainer(_x2) {
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
    return function ensureUploadContainer(_x3) {
      return _ref5.apply(this, arguments);
    };
  }();
  var uploadFile = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (file, pathOverride) {
      if (!file) return "";
      var uploads = yield ensureUploadContainer(pathOverride);
      var safeName = file.name || "upload-".concat(Date.now());
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
    return function uploadFile(_x4, _x5) {
      return _ref6.apply(this, arguments);
    };
  }();
  var handleDatasetFileSelect = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* (event) {
      var _event$target;
      var file = event === null || event === void 0 || (_event$target = event.target) === null || _event$target === void 0 || (_event$target = _event$target.files) === null || _event$target === void 0 ? void 0 : _event$target[0];
      setDatasetUpload({
        file: file || null,
        url: "",
        error: ""
      });
      if (!file) return;
      try {
        var url = yield uploadFile(file, datasetUploadPath);
        setDatasetUpload({
          file,
          url,
          error: ""
        });
        setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
          access_url_dataset: url,
          file_format: inferMediaType(url)
        }));
      } catch (err) {
        setDatasetUpload({
          file,
          url: "",
          error: "Upload failed. Please try again."
        });
      }
    });
    return function handleDatasetFileSelect(_x6) {
      return _ref7.apply(this, arguments);
    };
  }();
  var handleModelFileSelect = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(function* (event) {
      var _event$target2;
      var file = event === null || event === void 0 || (_event$target2 = event.target) === null || _event$target2 === void 0 || (_event$target2 = _event$target2.files) === null || _event$target2 === void 0 ? void 0 : _event$target2[0];
      setModelUpload({
        file: file || null,
        url: "",
        error: ""
      });
      if (!file) return;
      try {
        var url = yield uploadFile(file, modelUploadPath);
        setModelUpload({
          file,
          url,
          error: ""
        });
        setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
          access_url_semantic_model: url
        }));
      } catch (err) {
        setModelUpload({
          file,
          url: "",
          error: "Upload failed. Please try again."
        });
      }
    });
    return function handleModelFileSelect(_x7) {
      return _ref8.apply(this, arguments);
    };
  }();
  var handleDatasetDrop = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(function* (event) {
      var _event$dataTransfer;
      event.preventDefault();
      var file = (_event$dataTransfer = event.dataTransfer) === null || _event$dataTransfer === void 0 || (_event$dataTransfer = _event$dataTransfer.files) === null || _event$dataTransfer === void 0 ? void 0 : _event$dataTransfer[0];
      if (!file) return;
      yield handleDatasetFileSelect({
        target: {
          files: [file]
        }
      });
    });
    return function handleDatasetDrop(_x8) {
      return _ref9.apply(this, arguments);
    };
  }();
  var handleModelDrop = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(function* (event) {
      var _event$dataTransfer2;
      event.preventDefault();
      var file = (_event$dataTransfer2 = event.dataTransfer) === null || _event$dataTransfer2 === void 0 || (_event$dataTransfer2 = _event$dataTransfer2.files) === null || _event$dataTransfer2 === void 0 ? void 0 : _event$dataTransfer2[0];
      if (!file) return;
      yield handleModelFileSelect({
        target: {
          files: [file]
        }
      });
    });
    return function handleModelDrop(_x9) {
      return _ref10.apply(this, arguments);
    };
  }();
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
    setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      access_url_semantic_model: "",
      is_public: next === "external" || datasetSource === "external" ? true : prev.is_public
    }));
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref11 = _asyncToGenerator(function* () {
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
          yield updateDatasetSeries(session, _objectSpread2(_objectSpread2({}, seriesData), {}, {
            identifier: dataset.identifier,
            datasetUrl: dataset.datasetUrl,
            seriesUrl: dataset.datasetUrl,
            seriesMembers: Array.from(new Set(memberUrls)),
            webid: webId
          }));
        } else {
          if (!hasRequiredFields) {
            alert("Dataset link is required.");
            return;
          }
          if (datasetSource === "external" && !editedDataset.is_public) {
            alert("Public external links are currently supported only for public datasets.");
            return;
          }
          if (modelSource === "external" && !editedDataset.is_public) {
            alert("External semantic model links are currently supported only for public datasets.");
            return;
          }
          if (datasetSource === "upload" && datasetUpload.file && !editedDataset.access_url_dataset) {
            var url = yield uploadFile(datasetUpload.file, datasetUploadPath);
            setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
              access_url_dataset: url
            }));
          }
          if (showSemanticModel && modelSource === "upload" && modelUpload.file && !editedDataset.access_url_semantic_model) {
            var _url = yield uploadFile(modelUpload.file, modelUploadPath);
            setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
              access_url_semantic_model: _url
            }));
          }
          yield updateDataset(session, editedDataset);
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
      return _ref11.apply(this, arguments);
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
  var renderFileCards = (label, name, files, icon) => /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "font-weight-bold mb-2"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap file-card-container"
  }, files.map(fileUrl => {
    var fileName = fileUrl.split('/').pop();
    var isSelected = editedDataset[name] === fileUrl;
    return /*#__PURE__*/React.createElement("div", {
      key: fileUrl,
      onClick: () => setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
        [name]: fileUrl
      }, name === 'access_url_dataset' ? {
        file_format: inferMediaType(fileUrl)
      } : {})),
      className: "card p-2 shadow-sm file-card ".concat(isSelected ? 'file-card-selected border-primary' : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-flex align-items-center"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid ".concat(icon, " fa-lg text-secondary mr-2")
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-truncate",
      title: fileName
    }, fileName)));
  })));
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
  var renderUploadBox = _ref12 => {
    var {
      label,
      accept,
      onFileChange,
      onDrop,
      state,
      inputId,
      hint
    } = _ref12;
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
    })), hint && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint"
    }, hint), state.url && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint success"
    }, "Uploaded to ", state.url), state.error && /*#__PURE__*/React.createElement("div", {
      className: "upload-hint error"
    }, state.error));
  };
  var renderExternalUrlInput = _ref13 => {
    var {
      label,
      name,
      value,
      placeholder,
      hint
    } = _ref13;
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
    onClick: onClose
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
  }, "General Information"), renderInput("Title", "title", "text", "fa-heading"), renderInput("Description", "description", "textarea", "fa-align-left"), renderInput("Theme", "theme", "text", "fa-tags"), /*#__PURE__*/React.createElement("label", {
    className: "form-label-compact"
  }, "Access Rights"), /*#__PURE__*/React.createElement("div", {
    className: "form-group position-relative mb-3"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-lock input-icon input-icon-text"
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    name: "is_public",
    value: editedDataset.is_public ? 'public' : 'restricted',
    onChange: e => setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
      is_public: e.target.value === 'public'
    })),
    disabled: requiresPublicAccess,
    style: {
      paddingLeft: '30px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "public"
  }, "Public"), /*#__PURE__*/React.createElement("option", {
    value: "restricted"
  }, "Restricted"))), /*#__PURE__*/React.createElement("label", {
    htmlFor: "issued",
    className: "form-label-compact"
  }, "Issued Date"), renderInput("Issued Date", "issued", "date", "fa-calendar-plus")), /*#__PURE__*/React.createElement("div", {
    className: "form-section"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Dataset Resource"), renderSourceToggle(datasetSource, handleDatasetSourceChange), datasetSource === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "upload-path-row"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "dataset-upload-path"
  }, "Save files to"), /*#__PURE__*/React.createElement("input", {
    id: "dataset-upload-path",
    type: "text",
    value: datasetUploadPath,
    onChange: e => setDatasetUploadPath(e.target.value),
    onBlur: e => setDatasetUploadPath(normalizeUploadPath(e.target.value, "/public/")),
    placeholder: "/public/"
  })), datasetSource === "upload" ? renderUploadBox({
    label: "Upload dataset file",
    accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
    onFileChange: handleDatasetFileSelect,
    onDrop: handleDatasetDrop,
    state: datasetUpload,
    hint: "Allowed: CSV, JSON, TTL, JSON-LD, RDF, XML, PDF, DOCX, TXT",
    inputId: "edit-dataset-upload-input"
  }) : datasetSource === "pod" ? renderFileCards("Select Dataset File", "access_url_dataset", datasetPodFiles, "fa-file-csv") : renderExternalUrlInput({
    label: "External Dataset link",
    name: "access_url_dataset",
    value: editedDataset.access_url_dataset,
    placeholder: "https://..."
  }), datasetSource === "external" && /*#__PURE__*/React.createElement("div", {
    className: "upload-hint"
  }, "External links are currently supported only for public datasets."), /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h6", {
    className: "section-title"
  }, "Semantic Model File"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted"
  }, "Optional")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex gap-2"
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
      setEditedDataset(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
  }), " Create Semantic Model"))), showSemanticModel && /*#__PURE__*/React.createElement(React.Fragment, null, renderSourceToggle(modelSource, handleModelSourceChange), modelSource === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "upload-path-row"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "model-upload-path"
  }, "Save files to"), /*#__PURE__*/React.createElement("input", {
    id: "model-upload-path",
    type: "text",
    value: modelUploadPath,
    onChange: e => setModelUploadPath(e.target.value),
    onBlur: e => setModelUploadPath(normalizeUploadPath(e.target.value, "/public/")),
    placeholder: "/public/"
  })), modelSource === "upload" ? renderUploadBox({
    label: "Upload semantic model",
    accept: ".ttl",
    onFileChange: handleModelFileSelect,
    onDrop: handleModelDrop,
    state: modelUpload,
    hint: "Allowed: TTL",
    inputId: "edit-model-upload-input"
  }) : modelSource === "pod" ? renderFileCards("", "access_url_semantic_model", modelPodFiles, "fa-project-diagram") : renderExternalUrlInput({
    label: "Public external semantic model link",
    name: "access_url_semantic_model",
    value: editedDataset.access_url_semantic_model,
    placeholder: "https://example.org/model.ttl",
    hint: "The detail view can only render the graph if this URL returns RDF/Turtle directly."
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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
    onChange: e => setSeriesData(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
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

var LoginIssuerModal = _ref => {
  var {
    onClose,
    onLogin
  } = _ref;
  var [customIssuer, setCustomIssuer] = React.useState('');
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
    onClick: () => onLogin('https://tmdt-solid-community-server.de')
  }, /*#__PURE__*/React.createElement("img", {
    src: solidLogo,
    alt: "solid",
    width: "24",
    height: "24",
    className: "mr-2"
  }), "tmdt-solid-community-server.de"), /*#__PURE__*/React.createElement("button", {
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

var HeaderBar = _ref => {
  var {
    onLoginStatusChange,
    onWebIdChange,
    onUserInfoChange,
    activeTab,
    setActiveTab
  } = _ref;
  var [showLoginModal, setShowLoginModal] = React.useState(false);
  var [userInfo, setUserInfo] = React.useState({
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
    var _ref2 = _asyncToGenerator(function* (webId) {
      try {
        var dataset = yield solidClient.getSolidDataset(webId, {
          fetch: session.fetch
        });
        var profile = solidClient.getThing(dataset, webId);
        var name = solidClient.getStringNoLocale(profile, vocabCommonRdf.FOAF.name) || solidClient.getStringNoLocale(profile, vocabCommonRdf.VCARD.fn) || "Solid User";
        var photoRef = solidClient.getUrl(profile, vocabCommonRdf.VCARD.hasPhoto) || solidClient.getUrl(profile, vocabCommonRdf.FOAF.img);
        var photo = '';
        if (photoRef) {
          var photoUrl = photoRef;
          if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(photoRef)) {
            var photoThing = solidClient.getThing(dataset, photoRef);
            if (photoThing) {
              photoUrl = solidClient.getUrl(photoThing, vocabCommonRdf.VCARD.value) || solidClient.getUrl(photoThing, vocabCommonRdf.VCARD.url) || '';
            }
          }
          if (photoUrl) {
            try {
              var response = yield session.fetch(photoUrl);
              if (response.ok) {
                var blob = yield response.blob();
                photoUrl = URL.createObjectURL(blob);
              }
            } catch (e) {
              // Ignore fetch errors and fall back to the original URL
            }
            photo = photoUrl;
          }
        }
        var email = "";
        var emailNode = solidClient.getUrl(profile, vocabCommonRdf.VCARD.hasEmail);
        if (emailNode) {
          var emailThing = solidClient.getThing(dataset, emailNode);
          if (emailThing) {
            var mailto = solidClient.getUrl(emailThing, vocabCommonRdf.VCARD.value);
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
    return function fetchPodUserInfo(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  React.useEffect(() => {
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
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-book-open header-icon",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, "Semantic ", /*#__PURE__*/React.createElement("span", {
    className: "highlight"
  }, "Data"), " Catalog")))), userInfo.loggedIn ? /*#__PURE__*/React.createElement("div", {
    className: "header-user"
  }, userInfo.photo && /*#__PURE__*/React.createElement("img", {
    src: userInfo.photo,
    alt: "Profile",
    className: "profile-picture"
  }), /*#__PURE__*/React.createElement("span", {
    className: "header-user-name"
  }, /*#__PURE__*/React.createElement("strong", null, userInfo.name || "Solid User"), ' ', /*#__PURE__*/React.createElement("span", {
    className: "header-user-webid"
  }, "(", userInfo.webId, ")")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light btn-sm header-logout",
    onClick: handleLogout
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-right-from-bracket mr-1"
  }), " Logout")) : /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-3"
  }, /*#__PURE__*/React.createElement("strong", null, "Not logged in")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-outline-primary btn-sm",
    onClick: () => setShowLoginModal(true)
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-right-to-bracket mr-1"
  }), " Login with Solid")), showLoginModal && /*#__PURE__*/React.createElement(LoginIssuerModal, {
    onClose: () => setShowLoginModal(false),
    onLogin: issuer => {
      setShowLoginModal(false);
      localStorage.setItem("solid-oidc-issuer", issuer);
      loginWithIssuer(issuer);
    }
  }));
};

var appVersion = "0.8.10";

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
    onComplete,
    onCancel
  } = _ref;
  var [loading, setLoading] = React.useState(true);
  var [saving, setSaving] = React.useState(false);
  var [step, setStep] = React.useState(1);
  var [error, setError] = React.useState("");
  var [dataset, setDataset] = React.useState(null);
  var [profileThing, setProfileThing] = React.useState(null);
  var [profileDocUrl, setProfileDocUrl] = React.useState("");
  var [name, setName] = React.useState("");
  var [org, setOrg] = React.useState("");
  var [role, setRole] = React.useState("");
  var [emails, setEmails] = React.useState([""]);
  var [inboxUrl, setInboxUrl] = React.useState("");
  var [photoIri, setPhotoIri] = React.useState("");
  var [photoSrc, setPhotoSrc] = React.useState("");
  var [photoUploading, setPhotoUploading] = React.useState(false);
  var [inboxAcknowledged, setInboxAcknowledged] = React.useState(false);
  var [catalogUrl, setCatalogUrl] = React.useState("");
  var [catalogAcknowledged, setCatalogAcknowledged] = React.useState(false);
  var [privateRegistryUrl, setPrivateRegistryUrl] = React.useState("");
  var [privateRegistryAcknowledged, setPrivateRegistryAcknowledged] = React.useState(false);
  var steps = React.useMemo(() => [{
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
        var ds = yield solidClient.getSolidDataset(profileDoc, {
          fetch: session.fetch
        });
        setDataset(ds);
        var me = solidClient.getThing(ds, webId) || solidClient.getThingAll(ds).find(t => t.url === webId);
        if (!me) me = solidClient.createThing({
          url: webId
        });
        setProfileThing(me);
        var nm = solidClient.getStringNoLocale(me, vocabCommonRdf.VCARD.fn) || solidClient.getStringNoLocale(me, vocabCommonRdf.FOAF.name) || "".concat(solidClient.getStringNoLocale(me, vocabCommonRdf.VCARD.given_name) || "", " ").concat(solidClient.getStringNoLocale(me, vocabCommonRdf.VCARD.family_name) || "").trim();
        setName(nm || "");
        setOrg(solidClient.getStringNoLocale(me, vocabCommonRdf.VCARD.organization_name) || "");
        setRole(solidClient.getStringNoLocale(me, vocabCommonRdf.VCARD.role) || "");
        var emailUris = solidClient.getUrlAll(me, vocabCommonRdf.VCARD.hasEmail) || [];
        var collected = [];
        emailUris.forEach(uri => {
          if (uri.startsWith("mailto:")) {
            collected.push(uri.replace(/^mailto:/, ""));
          } else {
            var thing = solidClient.getThing(ds, uri);
            if (thing) {
              var email = (solidClient.getUrl(thing, vocabCommonRdf.VCARD.value) || "").replace(/^mailto:/, "");
              if (email) collected.push(email);
            }
          }
        });
        var directEmails = (solidClient.getUrlAll(me, vocabCommonRdf.VCARD.email) || []).map(uri => uri.replace(/^mailto:/, ""));
        var allEmails = [...collected, ...directEmails].filter(Boolean);
        setEmails(allEmails.length ? allEmails : [""]);
        var inbox = solidClient.getUrl(me, vocabCommonRdf.LDP.inbox) || "";
        setInboxUrl(inbox);
        setInboxAcknowledged(Boolean(inbox));
        var photo = solidClient.getUrl(me, vocabCommonRdf.VCARD.hasPhoto) || solidClient.getUrl(me, vocabCommonRdf.FOAF.img) || "";
        setPhotoIri(photo);
        var profileCatalog = solidClient.getUrl(me, SDP_CATALOG) || "";
        var catalogResolved = profileCatalog;
        var hasCatalog = false;
        if (profileCatalog) {
          try {
            yield solidClient.getSolidDataset(profileCatalog.split("#")[0], {
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
            yield solidClient.getSolidDataset(resolvedPrivateRegistry, {
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
  React.useEffect(() => {
    loadProfile();
  }, [webId]);
  React.useEffect(() => {
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
  React.useEffect(() => {
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
            yield solidClient.getSolidDataset(containerUrl, {
              fetch: session.fetch
            });
          } catch (e) {
            var _e$response;
            if ((e === null || e === void 0 ? void 0 : e.statusCode) === 404 || (e === null || e === void 0 || (_e$response = e.response) === null || _e$response === void 0 ? void 0 : _e$response.status) === 404) {
              yield solidClient.createContainerAt(containerUrl, {
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
      yield solidClient.overwriteFile(targetUrl, file, {
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
      var me = profileThing || solidClient.createThing({
        url: webId
      });
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.fn);
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.organization_name);
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.role);
      me = solidClient.setStringNoLocale(me, vocabCommonRdf.VCARD.fn, name.trim());
      me = solidClient.setStringNoLocale(me, vocabCommonRdf.VCARD.organization_name, org.trim());
      me = solidClient.setStringNoLocale(me, vocabCommonRdf.VCARD.role, role.trim());
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.hasPhoto);
      if (photoIri) {
        me = solidClient.setUrl(me, vocabCommonRdf.VCARD.hasPhoto, photoIri);
      }
      var updated = solidClient.setThing(dataset, me);
      yield solidClient.saveSolidDatasetAt(profileDocUrl, updated, {
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
      var me = profileThing || solidClient.createThing({
        url: webId
      });
      var ds = dataset;
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.hasEmail);
      me = solidClient.removeAll(me, vocabCommonRdf.VCARD.email);
      var list = normalizeEmails(emails);
      list.forEach((email, idx) => {
        var nodeUrl = "".concat(profileDocUrl, "#email-").concat(Date.now(), "-").concat(idx);
        var emailNode = solidClient.createThing({
          url: nodeUrl
        });
        emailNode = solidClient.removeAll(emailNode, vocabCommonRdf.VCARD.value);
        emailNode = solidClient.setUrl(emailNode, vocabCommonRdf.VCARD.value, "mailto:".concat(email));
        emailNode = solidClient.setStringNoLocale(emailNode, VCARD_TYPE, "Work");
        ds = solidClient.setThing(ds, emailNode);
        me = solidClient.addUrl(me, vocabCommonRdf.VCARD.hasEmail, nodeUrl);
      });
      ds = solidClient.setThing(ds, me);
      yield solidClient.saveSolidDatasetAt(profileDocUrl, ds, {
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
      var resource = yield solidClient.getSolidDatasetWithAcl(url, {
        fetch: session.fetch
      });
      var resourceAcl;
      if (!solidClient.hasResourceAcl(resource)) {
        if (!solidClient.hasAccessibleAcl(resource)) {
          throw new Error("No access to ACL.");
        }
        resourceAcl = solidClient.createAclFromFallbackAcl(resource);
      } else {
        resourceAcl = solidClient.getResourceAcl(resource);
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
        yield solidClient.getSolidDataset(targetInboxUrl, {
          fetch: session.fetch
        });
      } catch (e) {
        var _e$response2;
        if ((e === null || e === void 0 ? void 0 : e.statusCode) === 404 || (e === null || e === void 0 || (_e$response2 = e.response) === null || _e$response2 === void 0 ? void 0 : _e$response2.status) === 404) {
          yield solidClient.createContainerAt(targetInboxUrl, {
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
      var updatedAcl = solidClient.setPublicResourceAccess(resourceAcl, {
        read: false,
        append: true,
        write: false,
        control: false
      });
      yield solidClient.saveAclFor(resource, updatedAcl, {
        fetch: session.fetch
      });
      var ds = dataset;
      if (!ds) {
        ds = yield solidClient.getSolidDataset(profileDocUrl, {
          fetch: session.fetch
        });
      }
      var me = profileThing || solidClient.createThing({
        url: webId
      });
      me = solidClient.removeAll(me, vocabCommonRdf.LDP.inbox);
      me = solidClient.setUrl(me, vocabCommonRdf.LDP.inbox, targetInboxUrl);
      ds = solidClient.setThing(ds, me);
      yield solidClient.saveSolidDatasetAt(profileDocUrl, ds, {
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
    return /*#__PURE__*/React.createElement("div", {
      className: "onboarding-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "onboarding-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "onboarding-title"
    }, "Preparing your profile...")));
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
  }, "On finish, we will create an inbox container in your pod root (if needed) and set the permissions required for notifications."), /*#__PURE__*/React.createElement("label", {
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
  }, "We will create a registry container in your pod root under ", /*#__PURE__*/React.createElement("code", null, "registry/"), "."), /*#__PURE__*/React.createElement("label", {
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
  var [registryUrl, setRegistryUrl] = React.useState("");
  var [members, setMembers] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [saving, setSaving] = React.useState(false);
  var [error, setError] = React.useState("");
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
  React.useEffect(() => {
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
    setMembers(prev => prev.map(item => item.id === id ? _objectSpread2(_objectSpread2({}, item), {}, {
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
          yield saveRegistryConfig(webId, session.fetch, _objectSpread2(_objectSpread2({}, config), {}, {
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
    onClick: onClose
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

var App = function App() {
  var {
    embedded = false,
    webIdOverride = null
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var [datasets, setDatasets] = React.useState([]);
  var [catalogs, setCatalogs] = React.useState([]);
  var [showNewDatasetModal, setShowNewDatasetModal] = React.useState(false);
  var [showDetailModal, setShowDetailModal] = React.useState(false);
  var [showDeleteModal, setShowDeleteModal] = React.useState(false);
  var [showEditModal, setShowEditModal] = React.useState(false);
  var [showAddDatasetModal, setShowAddDatasetModal] = React.useState(false);
  var [showRegistryModal, setShowRegistryModal] = React.useState(false);
  var [selectedDataset, setSelectedDataset] = React.useState(null);
  var [isLoggedIn, setIsLoggedIn] = React.useState(false);
  var [webId, setWebId] = React.useState(null);
  var [userName, setUserName] = React.useState('');
  var [userEmail, setUserEmail] = React.useState('');
  var [searchQuery, setSearchQuery] = React.useState('');
  var [isPopulating, setIsPopulating] = React.useState(false);
  var accessCacheRef = React.useRef(new Map());
  var populateTriggerRef = React.useRef(false);
  var [activeTab, setActiveTab] = React.useState('dataset');
  var [onboardingRequired, setOnboardingRequired] = React.useState(false);
  var [checkingProfile, setCheckingProfile] = React.useState(false);
  var [isPrivateRegistry, setIsPrivateRegistry] = React.useState(false);
  var retryTimeoutRef = React.useRef(null);
  var cleanupTriggerRef = React.useRef(false);
  React.useEffect(() => {
    if (!embedded) return;
    if (webIdOverride) {
      setWebId(webIdOverride);
      setIsLoggedIn(true);
    } else {
      setWebId(null);
      setIsLoggedIn(false);
    }
  }, [embedded, webIdOverride]);
  var enrichAccessFlags = (data, currentWebId) => data.map(dataset => _objectSpread2(_objectSpread2({}, dataset), {}, {
    userHasAccess: dataset.is_public || dataset.webid === currentWebId
  }));
  var _fetchDatasets = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* () {
      try {
        var fetchOverride = session.info.isLoggedIn ? null : typeof window !== "undefined" ? window.fetch.bind(window) : null;
        var {
          datasets: loadedDatasets,
          catalogs: loadedCatalogs
        } = yield loadAggregatedDatasets(session, fetchOverride);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        var enriched = enrichAccessFlags(loadedDatasets, webId);
        setDatasets(enriched);
        setCatalogs(loadedCatalogs || []);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        retryTimeoutRef.current = setTimeout(_fetchDatasets, 8000);
      }
    });
    return function fetchDatasets() {
      return _ref.apply(this, arguments);
    };
  }();
  React.useEffect(() => {
    _fetchDatasets();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  React.useEffect(() => {
    if (webId) {
      accessCacheRef.current.clear();
      _fetchDatasets();
    }
  }, [webId]);
  React.useEffect(() => {
    if (!isLoggedIn || !webId) {
      setIsPrivateRegistry(false);
      return;
    }
    _asyncToGenerator(function* () {
      try {
        var registryConfig = yield loadRegistryConfig(webId, session.fetch);
        setIsPrivateRegistry(registryConfig.mode === "private");
      } catch (_unused) {
        setIsPrivateRegistry(false);
      }
    })();
  }, [isLoggedIn, webId]);
  React.useEffect(() => {
    if (!isLoggedIn || !webId) return;
    if (cleanupTriggerRef.current) return;
    cleanupTriggerRef.current = true;
    _asyncToGenerator(function* () {
      try {
        yield cleanupCatalogSeriesLinks(session);
        yield _fetchDatasets();
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    })();
  }, [isLoggedIn, webId]);
  React.useEffect(() => {
    if (!isLoggedIn) {
      setCheckingProfile(false);
      setOnboardingRequired(false);
      return;
    }
    var checkProfileCompleteness = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator(function* () {
        if (!isLoggedIn || !webId) return;
        setCheckingProfile(true);
        try {
          var {
            getSolidDataset,
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
          var ds = yield getSolidDataset(profileDocUrl, {
            fetch: session.fetch
          });
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
              yield getSolidDataset(profileCatalog.split("#")[0], {
                fetch: session.fetch
              });
              missingCatalog = false;
            } catch (_unused2) {
              missingCatalog = true;
            }
          }
          var missingRegistry = false;
          try {
            var registryConfig = yield loadRegistryConfig(webId, session.fetch);
            var privateRegistry = registryConfig.privateRegistry || buildDefaultPrivateRegistry(webId);
            if (!privateRegistry) {
              missingRegistry = !privateRegistry;
            } else {
              try {
                yield getSolidDataset(privateRegistry, {
                  fetch: session.fetch
                });
              } catch (err) {
                var _err$response;
                var status = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 || (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.status);
                if (status === 404) missingRegistry = true;
              }
            }
          } catch (_unused3) {
            missingRegistry = true;
          }
          setOnboardingRequired(missingBasics || missingEmail || missingInbox || missingCatalog || missingRegistry);
        } catch (err) {
          console.error("Profile completeness check failed:", err);
          setOnboardingRequired(true);
        } finally {
          setCheckingProfile(false);
        }
      });
      return function checkProfileCompleteness() {
        return _ref4.apply(this, arguments);
      };
    }();
    checkProfileCompleteness();
  }, [isLoggedIn, webId]);
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
  var populateFromSeed = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (_ref5) {
      var {
        publisher,
        webId
      } = _ref5;
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
          var datasetUrl = "";
          if (identifier && existingDatasetIds.has(identifier)) {
            datasetUrl = datasetUrlById.get(identifier) || "";
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
            datasetUrl = (created === null || created === void 0 ? void 0 : created.datasetUrl) || "";
          }
          var seriesInfo = entry.series || {};
          var seriesIdentifier = entry.series_identifier || entry.series_id || seriesInfo.identifier || "";
          var seriesTitle = entry.series_title || seriesInfo.title || "";
          var seriesKey = seriesIdentifier || seriesTitle;
          if (seriesKey && datasetUrl) {
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
            existing.members.push(datasetUrl);
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
        yield _fetchDatasets();
      } catch (error) {
        console.error("Failed to populate catalog:", error);
      } finally {
        setIsPopulating(false);
      }
    });
    return function populateFromSeed(_x) {
      return _ref6.apply(this, arguments);
    };
  }();
  React.useEffect(() => {
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
  if (checkingProfile) {
    return /*#__PURE__*/React.createElement("div", {
      className: "onboarding-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "onboarding-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "onboarding-title"
    }, "Checking profile"), /*#__PURE__*/React.createElement("div", {
      className: "onboarding-subtitle"
    }, "We are verifying your Solid profile and catalog configuration.")));
  }
  if (onboardingRequired && isLoggedIn) {
    return /*#__PURE__*/React.createElement(OnboardingWizard, {
      webId: webId,
      onComplete: () => setOnboardingRequired(false),
      onCancel: /*#__PURE__*/_asyncToGenerator(function* () {
        yield session.logout({
          logoutType: "app"
        });
        window.location.reload();
      })
    });
  }
  return /*#__PURE__*/React.createElement("div", null, !embedded && /*#__PURE__*/React.createElement(HeaderBar, {
    onLoginStatusChange: setIsLoggedIn,
    onWebIdChange: setWebId,
    onUserInfoChange: _ref8 => {
      var {
        name,
        email
      } = _ref8;
      setUserName(name);
      setUserEmail(email);
    },
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), activeTab === 'dataset' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "catalog-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions-inner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "catalog-title"
  }, "All datasets & series"), /*#__PURE__*/React.createElement("div", {
    className: "catalog-actions-right"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-light mr-2",
    onClick: () => setShowNewDatasetModal(true),
    disabled: !isLoggedIn,
    title: isLoggedIn ? "Add a new dataset" : "Please log in to add datasets"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-plus mr-2"
  }), "Add Dataset (Series)"), isPrivateRegistry && isLoggedIn && /*#__PURE__*/React.createElement("button", {
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
    onEditClick: handleEditClick,
    onDeleteClick: handleDeleteClick,
    sessionWebId: webId,
    searchQuery: searchQuery
  })))), activeTab === 'collection' && /*#__PURE__*/React.createElement("div", {
    className: "text-center mt-5"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-hammer mr-2"
  }), "Under Construction"), /*#__PURE__*/React.createElement("p", null, "This section is not yet available.")), showNewDatasetModal && /*#__PURE__*/React.createElement(DatasetAddModal, {
    onClose: handleCloseModal,
    fetchDatasets: _fetchDatasets
  }), showDetailModal && /*#__PURE__*/React.createElement(DatasetDetailModal, {
    dataset: selectedDataset,
    onClose: handleCloseModal,
    sessionWebId: webId,
    userName: userName,
    userEmail: userEmail,
    datasets: datasets
  }), showDeleteModal && /*#__PURE__*/React.createElement(DatasetDeleteModal, {
    onClose: handleCloseModal,
    dataset: selectedDataset,
    fetchDatasets: _fetchDatasets
  }), showRegistryModal && /*#__PURE__*/React.createElement(PrivateRegistryModal, {
    onClose: () => setShowRegistryModal(false),
    onSaved: _fetchDatasets
  }), showEditModal && /*#__PURE__*/React.createElement(DatasetEditModal, {
    dataset: selectedDataset,
    onClose: handleCloseModal,
    fetchDatasets: _fetchDatasets
  }), !embedded && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "footer-spacer"
  }), /*#__PURE__*/React.createElement(FooterBar, null)));
};

function SemanticDataCatalogEmbed(_ref) {
  var {
    webId
  } = _ref;
  return /*#__PURE__*/React.createElement(App, {
    embedded: true,
    webIdOverride: webId
  });
}

exports.CatalogEmbed = SemanticDataCatalogEmbed;
exports.SemanticDataCatalogEmbed = SemanticDataCatalogEmbed;
exports.catalogVersion = appVersion;
exports.setSession = setSession;
//# sourceMappingURL=index.cjs.map
