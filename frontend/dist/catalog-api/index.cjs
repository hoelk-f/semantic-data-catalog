'use strict';

var n3 = require('n3');
var solidClient = require('@inrupt/solid-client');
var vocabCommonRdf = require('@inrupt/vocab-common-rdf');
var require$$0 = require('buffer');

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

var serialize = quads => new Promise((resolve, reject) => {
  var writer = new n3.Writer({
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
    var parse = text => new n3.Parser({
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
    return "@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n_:patch a solid:InsertDeletePatch;\n solid:where { ".concat(deletes, " };\n solid:deletes { ").concat(deletes, " };\n solid:inserts { ").concat(inserts, " }.\n");
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
        headers: _objectSpread2({
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
    return writeMetadataTurtle(url, previous ? yield solidClient.solidDatasetAsTurtle(previous) : null, yield solidClient.solidDatasetAsTurtle(next), fetch);
  });
  return _saveProfileDocument.apply(this, arguments);
}
function profileDistributions(input) {
  var _input$semanticModels;
  var supplied = Array.isArray(input.distributions) && input.distributions.length ? input.distributions : [{
    url: "",
    downloadURL: input.distribution_access_type === "access" ? "" : input.access_url_dataset,
    accessURL: input.distribution_access_type === "access" ? input.access_url_dataset : "",
    mediaType: input.file_format,
    conformsTo: (_input$semanticModels = input.semanticModels) !== null && _input$semanticModels !== void 0 && _input$semanticModels.length ? input.semanticModels : [input.access_url_semantic_model].filter(Boolean)
  }];
  return supplied.map((item, index) => {
    var _input$distributions;
    var current = _objectSpread2({}, item);
    if (index === 0 && (_input$distributions = input.distributions) !== null && _input$distributions !== void 0 && _input$distributions.length && Object.hasOwn(input, "access_url_dataset")) {
      current.downloadURL = input.distribution_access_type === "access" ? "" : input.access_url_dataset;
      current.accessURL = input.distribution_access_type === "access" ? input.access_url_dataset : current.accessURL;
      current.mediaType = input.file_format || current.mediaType;
      if (Object.hasOwn(input, "access_url_semantic_model")) {
        current.conformsTo = [input.access_url_semantic_model, ...(current.conformsTo || []).slice(1)].filter(Boolean);
      }
    }
    if (current.conformsTo != null && !Array.isArray(current.conformsTo)) throw new Error("Model/schema references must be an array of IRIs.");
    return _objectSpread2(_objectSpread2({}, current), {}, {
      conformsTo: [...new Set(current.conformsTo || [])]
    });
  });
}
function assertProfileDistributions(distributions) {
  var absoluteIri = value => {
    try {
      return Boolean(value && new URL(value).protocol && !/[<>"{}|^`\\\s]/.test(value));
    } catch (_unused) {
      return false;
    }
  };
  if (!distributions.length) throw new Error("At least one distribution is required.");
  for (var distribution of distributions) {
    var _distribution$mediaTy;
    if (!absoluteIri(distribution.downloadURL) || !/^https?:/.test(distribution.downloadURL)) {
      throw new Error("A direct HTTP(S) download URL is required; an access or landing-page link alone does not satisfy the Solid DCAT Profile.");
    }
    if (!((_distribution$mediaTy = distribution.mediaType) !== null && _distribution$mediaTy !== void 0 && _distribution$mediaTy.trim())) throw new Error("A media type is required for every distribution.");
    if (!distribution.conformsTo.length || distribution.conformsTo.some(url => !absoluteIri(url))) {
      throw new Error("A model or schema IRI is required for every distribution.");
    }
  }
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
        if (!isNotFound$1(error)) failures.push(_objectSpread2(_objectSpread2({}, target), {}, {
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
            if (value.nextOffset === null) return _objectSpread2(_objectSpread2({}, metadata), {}, {
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
var SDP_NS = "http://purl.org/sdp/terms#";
var LEGACY_SDP_CATALOG = "https://w3id.org/solid-dcat-profile#catalog";
var SDP_CATALOG = "".concat(SDP_NS, "catalog");
var SDM_NS = "https://w3id.org/solid-dataspace-manager#";
var SDM_REGISTRY_MODE = "".concat(SDM_NS, "registryMode");
var SDM_REGISTRY = "".concat(SDM_NS, "registry");
var SDM_PRIVATE_REGISTRY = "".concat(SDM_NS, "privateRegistry");
var REGISTRY_PRESETS = [{
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
}, {
  id: "test2",
  label: "Test 2",
  url: "https://solid-community-server.tmdt.info/semanticdatacatalog/public/test2",
  icon: "flask"
}];
var SDM_CHANGELOG = "".concat(SDM_NS, "changeLog");
var SDM_CHANGE_EVENT = "".concat(SDM_NS, "ChangeEvent");
var LEGACY_DCAT_CONFORMS_TO = "http://www.w3.org/ns/dcat#conformsTo";
var VCARD_HAS_URL = vocabCommonRdf.VCARD.hasURL || "http://www.w3.org/2006/vcard/ns#hasURL";
var VCARD_URL = vocabCommonRdf.VCARD.url || "http://www.w3.org/2006/vcard/ns#url";
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
    if (thing && !solidClient.getUrlAll(thing, vocabCommonRdf.RDF.type).includes(vocabCommonRdf.DCAT.CatalogRecord)) return thing;
    if (thing) {
      var topic = solidClient.getUrl(thing, vocabCommonRdf.FOAF.primaryTopic);
      var topicThing = topic && solidClient.getThing(datasetDoc, topic);
      if (topicThing) return topicThing;
    }
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
  var types = values(vocabCommonRdf.RDF.type);
  if (!types.includes(vocabCommonRdf.DCAT.Catalog)) {
    throw new Error("Catalog document does not contain the expected dcat:Catalog resource.");
  }
  return {
    turtle,
    title: values(vocabCommonRdf.DCTERMS.title)[0] || "Solid Dataspace Catalog",
    description: values(vocabCommonRdf.DCTERMS.description)[0] || "",
    contactPoint: values(vocabCommonRdf.DCAT.contactPoint)[0] || "",
    datasetRefs: Array.from(new Set(values(vocabCommonRdf.DCAT.dataset).map(url => toCatalogDatasetRef(catalogDocUrl, url)))),
    recordRefs: Array.from(new Set(values(vocabCommonRdf.DCAT.record).map(url => toCatalogDatasetRef(catalogDocUrl, url))))
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
    return _objectSpread2({
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
        if (snapshot.exists) {
          var managed = new Set([vocabCommonRdf.DCTERMS.title, vocabCommonRdf.DCTERMS.description, vocabCommonRdf.DCTERMS.modified, vocabCommonRdf.DCAT.contactPoint, vocabCommonRdf.DCAT.dataset, vocabCommonRdf.DCAT.record]);
          var extras = new Parser({
            baseIRI: catalogDocUrl,
            blankNodePrefix: ""
          }).parse(snapshot.turtle).filter(quad => quad.subject.value !== "".concat(catalogDocUrl, "#it") || !managed.has(quad.predicate.value) && !(quad.predicate.value === vocabCommonRdf.RDF.type && quad.object.value === vocabCommonRdf.DCAT.Catalog));
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
var getPodRoot = webId => {
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
  return "".concat(podRoot || getPodRoot(webId), "registry/");
};
var normalizeContainerUrl = value => {
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
  var noLocale = solidClient.getStringNoLocale(thing, predicate);
  if (noLocale) return noLocale;
  try {
    var values = normalizeLocaleValues(solidClient.getStringWithLocaleAll(thing, predicate));
    if (!values || values.length === 0) return "";
    return values[0] || "";
  } catch (_unused5) {
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
var getCatalogDocUrl = function getCatalogDocUrl(webId) {
  var podRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  return "".concat(podRoot || getPodRoot(webId)).concat(CATALOG_DOC);
};
var getCatalogResourceUrl = function getCatalogResourceUrl(webId) {
  var podRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  return "".concat(getCatalogDocUrl(webId, podRoot), "#it");
};
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
  return function ensureContainer(_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();
var getResourceWithAcl = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(function* (url, fetch) {
    try {
      return yield solidClient.getSolidDatasetWithAcl(url, {
        fetch
      });
    } catch (datasetErr) {
      try {
        return yield solidClient.getFileWithAcl(url, {
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
    var updatedAcl = solidClient.setPublicResourceAccess(resourceAcl, {
      read,
      append: false,
      write: false,
      control: false
    });
    yield solidClient.saveAclFor(resource, updatedAcl, {
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
    // Keep older deployed applications able to discover the same catalog.
    profileThing = solidClient.setUrl(profileThing, LEGACY_SDP_CATALOG, catalogUrl);
    var updatedProfile = solidClient.setThing(profileDataset, profileThing);
    yield solidClient.saveSolidDatasetAt(profileDocUrl, updatedProfile, {
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
      var profileDataset = yield solidClient.getSolidDataset(profileDocUrl, {
        fetch
      });
      var profileThing = solidClient.getThing(profileDataset, webId);
      var mode = (solidClient.getStringNoLocale(profileThing, SDM_REGISTRY_MODE) || "research").toLowerCase();
      var registries = (solidClient.getUrlAll(profileThing, SDM_REGISTRY) || []).filter(Boolean).map(url => url.replace(/\/+$/, ""));
      var privateRegistry = solidClient.getUrl(profileThing, SDM_PRIVATE_REGISTRY) || buildDefaultPrivateRegistry(webId, podRoot);
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
    var privateRegistry = (config === null || config === void 0 ? void 0 : config.privateRegistry) || buildDefaultPrivateRegistry(webId, podRoot);
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
  return function registerWebIdInRegistries(_x41, _x42, _x43) {
    return _ref18.apply(this, arguments);
  };
}();
var loadRegistryMembersFromContainer = /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator(function* (containerUrl, fetch) {
    var {
      onLoadError
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
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
    var podRoot = podRootOverride || getPodRoot(webId);
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
      var profileDoc = yield solidClient.getSolidDataset(profileDocUrl, {
        fetch
      });
      var profileThing = solidClient.getThing(profileDoc, webId);
      var profileCatalog = profileThing ? solidClient.getUrl(profileThing, SDP_CATALOG) || solidClient.getUrl(profileThing, LEGACY_SDP_CATALOG) || solidClient.getUrl(profileThing, vocabCommonRdf.DCAT.catalog) : null;
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
  var _datasetDoc$internal_, _primaryDistribution$;
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
  var publisherRef = solidClient.getUrl(datasetThing, vocabCommonRdf.DCTERMS.publisher) || "";
  var publisher = publisherLiteral;
  if (!publisher && publisherRef) {
    var publisherThing = solidClient.getThing(datasetDoc, publisherRef);
    if (publisherThing) {
      publisher = getAnyString(publisherThing, vocabCommonRdf.FOAF.name) || getAnyString(publisherThing, vocabCommonRdf.VCARD.fn) || getAnyString(publisherThing, vocabCommonRdf.DCTERMS.title) || "";
    }
  }
  if (!publisher) publisher = publisherRef;
  var creator = solidClient.getUrl(datasetThing, vocabCommonRdf.DCTERMS.creator) || "";
  var theme = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCAT.theme) || solidClient.getUrl(datasetThing, vocabCommonRdf.DCAT.theme) || "";
  if (!theme) {
    theme = getAnyString(datasetThing, vocabCommonRdf.DCAT.theme) || "";
  }
  var accessRights = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.accessRights) || "";
  var contactRef = solidClient.getUrl(datasetThing, vocabCommonRdf.DCAT.contactPoint) || "";
  var contactLiteral = solidClient.getStringNoLocale(datasetThing, vocabCommonRdf.DCAT.contactPoint) || getAnyString(datasetThing, vocabCommonRdf.DCAT.contactPoint) || "";
  var contact = stripMailto(contactLiteral);
  var contactType = contact ? contactLiteral.startsWith("mailto:") || contact.includes("@") ? "email" : isValidUrl(contact) ? "url" : "text" : "";
  if (!contact && contactRef) {
    var contactThing = solidClient.getThing(datasetDoc, contactRef);
    if (contactThing) {
      var mailto = solidClient.getUrl(contactThing, vocabCommonRdf.VCARD.hasEmail) || solidClient.getUrl(contactThing, vocabCommonRdf.VCARD.value) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.VCARD.hasEmail) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.VCARD.value) || solidClient.getUrl(contactThing, vocabCommonRdf.FOAF.mbox) || solidClient.getStringNoLocale(contactThing, vocabCommonRdf.FOAF.mbox) || "";
      if (mailto) {
        contact = stripMailto(mailto);
        contactType = "email";
      } else {
        var contactUrl = solidClient.getUrl(contactThing, VCARD_HAS_URL) || solidClient.getUrl(contactThing, VCARD_URL) || "";
        if (contactUrl) {
          contact = contactUrl;
          contactType = "url";
        } else {
          contact = getAnyString(contactThing, vocabCommonRdf.VCARD.fn) || "";
          contactType = contact ? "text" : "";
        }
      }
    } else if (isValidUrl(contactRef)) {
      contact = contactRef;
      contactType = "url";
    }
  }
  var legacyModels = [...safeGetUrlAll(datasetThing, vocabCommonRdf.DCTERMS.conformsTo), ...safeGetUrlAll(datasetThing, LEGACY_DCAT_CONFORMS_TO)];
  var distributions = safeGetUrlAll(datasetThing, vocabCommonRdf.DCAT.distribution).map(url => {
    var distributionUrl = resolveUrl(url, baseIri);
    var thing = solidClient.getThing(datasetDoc, distributionUrl) || solidClient.getThing(datasetDoc, url);
    if (!thing) return null;
    var downloadURL = solidClient.getUrl(thing, vocabCommonRdf.DCAT.downloadURL) || "";
    var accessURL = solidClient.getUrl(thing, vocabCommonRdf.DCAT.accessURL) || "";
    var conformsTo = safeGetUrlAll(thing, vocabCommonRdf.DCTERMS.conformsTo);
    return {
      url: distributionUrl,
      downloadURL: downloadURL ? resolveUrl(downloadURL, baseIri) : "",
      accessURL: accessURL ? resolveUrl(accessURL, baseIri) : "",
      mediaType: solidClient.getUrl(thing, vocabCommonRdf.DCAT.mediaType) || solidClient.getStringNoLocale(thing, vocabCommonRdf.DCAT.mediaType) || getAnyString(thing, vocabCommonRdf.DCTERMS.format) || solidClient.getUrl(thing, vocabCommonRdf.DCTERMS.format) || "",
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
    distributions,
    semanticModels,
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
    var documents = new Map();
    var visited = new Set();
    var datasets = new Map();
    var read = url => {
      var docUrl = getDocumentUrl(url);
      if (!documents.has(docUrl)) {
        if (documents.size >= 1000) throw new Error("Catalog metadata document limit reached.");
        documents.set(docUrl, solidClient.getSolidDataset(docUrl, {
          fetch
        }));
      }
      return documents.get(docUrl);
    };
    var pending = [catalogUrl];
    var _loop2 = function* _loop2() {
      var next = [];
      yield Promise.all(pending.map(/*#__PURE__*/function () {
        var _ref27 = _asyncToGenerator(function* (url) {
          if (visited.has(url)) return;
          visited.add(url);
          try {
            var doc = yield read(url);
            var thing = solidClient.getThing(doc, url) || getThingByTypes(doc, [vocabCommonRdf.DCAT.Catalog, vocabCommonRdf.DCAT.CatalogRecord, vocabCommonRdf.DCAT.Dataset, vocabCommonRdf.DCAT.DatasetSeries]);
            if (!thing) return;
            var types = solidClient.getUrlAll(thing, vocabCommonRdf.RDF.type);
            if (url === catalogUrl || types.includes(vocabCommonRdf.DCAT.Catalog)) {
              next.push(...safeGetUrlAll(thing, vocabCommonRdf.DCAT.dataset), ...safeGetUrlAll(thing, vocabCommonRdf.DCAT.record), ...safeGetUrlAll(thing, "http://www.w3.org/ns/dcat#datasetSeries"));
              return;
            }
            if (types.includes(vocabCommonRdf.DCAT.CatalogRecord)) {
              next.push(...safeGetUrlAll(thing, vocabCommonRdf.FOAF.primaryTopic));
              return;
            }
            // Distribution descriptions are metadata. Never fetch downloadURL,
            // accessURL or conformsTo targets during catalog discovery.
            for (var distribution of safeGetUrlAll(thing, vocabCommonRdf.DCAT.distribution)) {
              if (!solidClient.getThing(doc, distribution)) {
                var distributionDoc = yield read(distribution);
                solidClient.getThingAll(distributionDoc).forEach(item => {
                  doc = solidClient.setThing(doc, item);
                });
              }
            }
            var dataset = parseDatasetFromDoc(doc, thing.url);
            if (dataset) datasets.set(dataset.datasetUrl, dataset);
            next.push(...safeGetUrlAll(thing, DCAT_SERIES_MEMBER));
          } catch (err) {
            console.warn("Failed to load catalog metadata", url, err);
            onLoadError === null || onLoadError === void 0 || onLoadError(err, {
              stage: url === catalogUrl ? "catalog" : "dataset"
            });
            if (url === catalogUrl) throw err;
          }
        });
        return function (_x60) {
          return _ref27.apply(this, arguments);
        };
      }()));
      pending = [...new Set(next)].filter(url => !visited.has(url));
    };
    while (pending.length) {
      yield* _loop2();
    }
    return [...datasets.values()];
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
        return ((_cachedMembers$get = cachedMembers.get(normalizeContainerUrl(registryUrl))) === null || _cachedMembers$get === void 0 ? void 0 : _cachedMembers$get.map(m => m.webId)) || loadRegistryMembersFromContainer(registryUrl, fetch, {
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
    var updatedCache = _objectSpread2(_objectSpread2({}, cache), {}, {
      catalogs: _objectSpread2({}, cache.catalogs)
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
  return function loadAggregatedDatasets(_x61, _x62) {
    return _ref28.apply(this, arguments);
  };
}();
var DEFAULT_THEME_NS$1 = "https://w3id.org/solid-dataspace-manager/theme/";
var DCAT_DATASET_SERIES = "http://www.w3.org/ns/dcat#DatasetSeries";
var DCAT_SERIES_MEMBER = vocabCommonRdf.DCAT.seriesMember || "http://www.w3.org/ns/dcat#seriesMember";
var DCAT_IN_SERIES = vocabCommonRdf.DCAT.inSeries || "http://www.w3.org/ns/dcat#inSeries";
var toThemeIri = value => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  var slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return "".concat(DEFAULT_THEME_NS$1).concat(encodeURIComponent(slug));
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
  var _ref30, _input$in_series;
  var previous = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var datasetUrl = "".concat(datasetDocUrl, "#it");
  var datasetThing = previous || solidClient.createThing({
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
  if (input.publisher_url) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCTERMS.publisher, input.publisher_url);
  } else if (input.publisher) {
    datasetThing = setLocaleString(datasetThing, vocabCommonRdf.DCTERMS.publisher, input.publisher);
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.creator);
  if (input.webid) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCTERMS.creator, input.webid);
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCAT.contactPoint);
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCAT.theme);
  if (input.theme) {
    datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCAT.theme, toThemeIri(input.theme));
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.conformsTo);
  datasetThing = solidClient.removeAll(datasetThing, LEGACY_DCAT_CONFORMS_TO);
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCTERMS.accessRights);
  datasetThing = solidClient.setStringNoLocale(datasetThing, vocabCommonRdf.DCTERMS.accessRights, input.is_public ? "public" : "restricted");
  var inSeries = (_ref30 = (_input$in_series = input.in_series) !== null && _input$in_series !== void 0 ? _input$in_series : input.inSeries) !== null && _ref30 !== void 0 ? _ref30 : previous ? solidClient.getUrlAll(previous, DCAT_IN_SERIES) : [];
  datasetThing = solidClient.removeAll(datasetThing, DCAT_IN_SERIES);
  if (inSeries) {
    var seriesList = Array.isArray(inSeries) ? inSeries : [inSeries];
    seriesList.filter(Boolean).forEach(seriesUrl => {
      datasetThing = solidClient.addUrl(datasetThing, DCAT_IN_SERIES, seriesUrl);
    });
  }
  return datasetThing;
};
var buildContactThing = (datasetDocUrl, input) => {
  if (!input.contact_point && !input.contact_url) return null;
  var contactUrl = "".concat(datasetDocUrl, "#contact");
  var contactThing = solidClient.createThing({
    url: contactUrl
  });
  contactThing = solidClient.addUrl(contactThing, vocabCommonRdf.RDF.type, vocabCommonRdf.VCARD.Individual);
  if (input.publisher) {
    contactThing = setLocaleString(contactThing, vocabCommonRdf.VCARD.fn, input.publisher);
  }
  contactThing = solidClient.removeAll(contactThing, vocabCommonRdf.VCARD.hasEmail);
  if (input.contact_point) {
    contactThing = solidClient.setUrl(contactThing, vocabCommonRdf.VCARD.hasEmail, "mailto:".concat(input.contact_point));
  }
  contactThing = solidClient.removeAll(contactThing, VCARD_HAS_URL);
  if (input.contact_url) {
    contactThing = solidClient.setUrl(contactThing, VCARD_HAS_URL, input.contact_url);
  }
  return contactThing;
};
var buildPublisherThing = input => {
  if (!input.publisher_url || !input.publisher) return null;
  var publisherThing = solidClient.createThing({
    url: input.publisher_url
  });
  publisherThing = solidClient.addUrl(publisherThing, vocabCommonRdf.RDF.type, vocabCommonRdf.FOAF.Agent);
  publisherThing = setLocaleString(publisherThing, vocabCommonRdf.FOAF.name, input.publisher);
  return publisherThing;
};
var isLocalPodResource = function isLocalPodResource(webId, targetUrl) {
  var podRootOverride = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  if (!webId || !targetUrl) return false;
  try {
    var root = new URL(podRootOverride || getPodRoot(webId));
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
  var _ref31 = _asyncToGenerator(function* (session, resourceUrl) {
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
    var publicAccess = solidClient.getPublicResourceAccess(resourceAcl) || {};
    if (publicAccess.read !== true || publicAccess.append !== false || publicAccess.write !== false || publicAccess.control !== false) {
      throw new Error("Resource does not have verified public read-only access after ACL update: ".concat(resourceUrl));
    }
  });
  return function ensurePublicReadOnlyResourceAccess(_x64, _x65) {
    return _ref31.apply(this, arguments);
  };
}();
var ensureRestrictedResourceAccess = /*#__PURE__*/function () {
  var _ref32 = _asyncToGenerator(function* (session, resourceUrl) {
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
    var publicAccess = solidClient.getPublicResourceAccess(resourceAcl);
    if (publicAccess.read || publicAccess.append || publicAccess.write || publicAccess.control) {
      throw new Error("Resource still has public access after ACL update: ".concat(resourceUrl));
    }
  });
  return function ensureRestrictedResourceAccess(_x66, _x67) {
    return _ref32.apply(this, arguments);
  };
}();
var syncLinkedResourceAccess = /*#__PURE__*/function () {
  var _ref33 = _asyncToGenerator(function* (session, input) {
    var distributions = profileDistributions(input);
    var downloadUrls = new Set(distributions.map(item => item.downloadURL).filter(Boolean));
    var urls = [...new Set([...downloadUrls, ...distributions.flatMap(item => item.conformsTo)])];
    for (var url of urls) {
      var _session$info7;
      if (!isLocalPodResource(session === null || session === void 0 || (_session$info7 = session.info) === null || _session$info7 === void 0 ? void 0 : _session$info7.webId, url, input.podRoot)) {
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
  return function syncLinkedResourceAccess(_x68, _x69) {
    return _ref33.apply(this, arguments);
  };
}();
var withCatalogRecord = function withCatalogRecord(document, docUrl, datasetUrl) {
  var operationId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var record = solidClient.getThing(document, docUrl) || solidClient.createThing({
    url: docUrl
  });
  record = solidClient.addUrl(record, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.CatalogRecord);
  record = solidClient.setUrl(record, vocabCommonRdf.FOAF.primaryTopic, datasetUrl);
  record = solidClient.setDatetime(record, vocabCommonRdf.DCTERMS.modified, new Date());
  if (operationId) {
    var changeUrl = "".concat(docUrl, "#change-").concat(operationId);
    var change = solidClient.createThing({
      url: changeUrl
    });
    change = solidClient.addUrl(change, vocabCommonRdf.RDF.type, SDM_CHANGE_EVENT);
    change = solidClient.setDatetime(change, vocabCommonRdf.DCTERMS.modified, new Date());
    document = solidClient.setThing(document, change);
    if (!solidClient.getUrlAll(record, SDM_CHANGELOG).includes(changeUrl)) record = solidClient.addUrl(record, SDM_CHANGELOG, changeUrl);
  }
  return solidClient.setThing(document, record);
};
var readExistingMetadata = /*#__PURE__*/function () {
  var _ref34 = _asyncToGenerator(function* (url, fetch) {
    var allowCreate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    try {
      return yield solidClient.getSolidDataset(url, {
        fetch
      });
    } catch (error) {
      if (isNotFound(error) && allowCreate) return null;
      throw error;
    }
  });
  return function readExistingMetadata(_x70, _x71) {
    return _ref34.apply(this, arguments);
  };
}();
var addDistributionDescriptions = (document, datasetThing, docUrl, input) => {
  var values = profileDistributions(input);
  assertProfileDistributions(values);
  var original = document;
  var oldThing = solidClient.getThing(document, datasetThing.url);
  for (var oldUrl of oldThing ? solidClient.getUrlAll(oldThing, vocabCommonRdf.DCAT.distribution) : []) {
    if (oldUrl.startsWith("".concat(docUrl, "#"))) document = solidClient.removeThing(document, oldUrl);
  }
  datasetThing = solidClient.removeAll(datasetThing, vocabCommonRdf.DCAT.distribution);
  values.forEach((distribution, index) => {
    var _distribution$url;
    // All descriptions are secondary resources of this record document.
    var url = (_distribution$url = distribution.url) !== null && _distribution$url !== void 0 && _distribution$url.startsWith("".concat(docUrl, "#")) ? distribution.url : "".concat(docUrl, "#dist").concat(index || "");
    var thing = solidClient.getThing(original, url) || solidClient.createThing({
      url
    });
    for (var predicate of [vocabCommonRdf.DCAT.downloadURL, vocabCommonRdf.DCAT.accessURL, vocabCommonRdf.DCAT.mediaType, vocabCommonRdf.DCTERMS.format, vocabCommonRdf.DCTERMS.conformsTo]) {
      thing = solidClient.removeAll(thing, predicate);
    }
    thing = solidClient.addUrl(thing, vocabCommonRdf.RDF.type, vocabCommonRdf.DCAT.Distribution);
    thing = solidClient.setUrl(thing, vocabCommonRdf.DCAT.downloadURL, distribution.downloadURL);
    if (distribution.accessURL) thing = solidClient.setUrl(thing, vocabCommonRdf.DCAT.accessURL, distribution.accessURL);
    thing = /^https?:/.test(distribution.mediaType) ? solidClient.setUrl(thing, vocabCommonRdf.DCAT.mediaType, distribution.mediaType) : solidClient.setStringNoLocale(thing, vocabCommonRdf.DCAT.mediaType, distribution.mediaType);
    distribution.conformsTo.forEach(model => {
      thing = solidClient.addUrl(thing, vocabCommonRdf.DCTERMS.conformsTo, model);
    });
    document = solidClient.setThing(document, thing);
    datasetThing = solidClient.addUrl(datasetThing, vocabCommonRdf.DCAT.distribution, url);
  });
  return solidClient.setThing(document, datasetThing);
};
var writeDatasetDocument = /*#__PURE__*/function () {
  var _ref35 = _asyncToGenerator(function* (session, datasetDocUrl, input) {
    var {
      allowCreate = true
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var previous = yield readExistingMetadata(datasetDocUrl, session.fetch, allowCreate);
    var document = previous || solidClient.createSolidDataset();
    var datasetThing = buildDatasetResource(datasetDocUrl, input, solidClient.getThing(document, "".concat(datasetDocUrl, "#it")));
    var publisher = buildPublisherThing(input);
    if (publisher) document = solidClient.setThing(document, publisher);
    var contact = buildContactThing(datasetDocUrl, input);
    if (contact) {
      document = solidClient.setThing(document, contact);
      datasetThing = solidClient.setUrl(datasetThing, vocabCommonRdf.DCAT.contactPoint, contact.url);
    }
    document = addDistributionDescriptions(document, datasetThing, datasetDocUrl, input);
    document = withCatalogRecord(document, datasetDocUrl, datasetThing.url, input.operation_id);
    yield saveProfileDocument(datasetDocUrl, previous, document, session.fetch);
    yield makePublicReadable(datasetDocUrl, session.fetch);
    yield syncLinkedResourceAccess(session, input);
  });
  return function writeDatasetDocument(_x72, _x73, _x74) {
    return _ref35.apply(this, arguments);
  };
}();
var updateCatalogDatasets = /*#__PURE__*/function () {
  var _ref40 = _asyncToGenerator(function* (session, catalogDocUrl, datasetUrl) {
    var {
      remove,
      recordUrls = []
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var datasetRef = toCatalogDatasetRef(catalogDocUrl, datasetUrl);
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
  return function updateCatalogDatasets(_x84, _x85, _x86) {
    return _ref40.apply(this, arguments);
  };
}();
var generateIdentifier$1 = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dataset-".concat(Date.now());
};
var createDataset = /*#__PURE__*/function () {
  var _ref43 = _asyncToGenerator(function* (session, input) {
    var _session$info8;
    validateDatasetInput(input);
    var podRoot = (input === null || input === void 0 ? void 0 : input.podRoot) || getPodRoot(session === null || session === void 0 || (_session$info8 = session.info) === null || _session$info8 === void 0 ? void 0 : _session$info8.webId);
    yield ensureCatalogStructure(session, {
      podRoot,
      registryConfig: input === null || input === void 0 ? void 0 : input.registryConfig
    });
    var identifier = input.identifier || generateIdentifier$1();
    var datasetDocUrl = "".concat(podRoot).concat(DATASET_CONTAINER).concat(identifier, ".ttl");
    var datasetUrl = "".concat(datasetDocUrl, "#it");
    yield writeDatasetDocument(session, datasetDocUrl, _objectSpread2(_objectSpread2({}, input), {}, {
      identifier
    }));
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), datasetUrl, {
      remove: false
    });
    clearCache();
    return {
      datasetUrl,
      identifier,
      recordUrl: datasetDocUrl
    };
  });
  return function createDataset(_x93, _x94) {
    return _ref43.apply(this, arguments);
  };
}();
var updateDataset = /*#__PURE__*/function () {
  var _ref45 = _asyncToGenerator(function* (session, input) {
    var _session$info10;
    if (!input.datasetUrl) throw new Error("Missing dataset URL.");
    validateDatasetInput(input);
    var podRoot = (input === null || input === void 0 ? void 0 : input.podRoot) || getPodRoot(session === null || session === void 0 || (_session$info10 = session.info) === null || _session$info10 === void 0 ? void 0 : _session$info10.webId);
    var datasetDocUrl = getDocumentUrl(input.datasetUrl);
    yield writeDatasetDocument(session, datasetDocUrl, input, {
      allowCreate: false
    });
    yield updateCatalogDatasets(session, getCatalogDocUrl(session.info.webId, podRoot), input.datasetUrl, {
      remove: false
    });
    clearCache();
  });
  return function updateDataset(_x97, _x98) {
    return _ref45.apply(this, arguments);
  };
}();
var unlinkFromParentSeries = /*#__PURE__*/function () {
  var _ref47 = _asyncToGenerator(function* (session, datasetUrl, podRoot) {
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
        var series = solidClient.getThing(previous, seriesUrl);
        if (!series) return 0; // continue
        var members = solidClient.getUrlAll(series, DCAT_SERIES_MEMBER).filter(url => url !== datasetUrl);
        series = solidClient.removeAll(series, DCAT_SERIES_MEMBER);
        members.forEach(url => {
          series = solidClient.addUrl(series, DCAT_SERIES_MEMBER, url);
        });
        yield saveProfileDocument(seriesDocUrl, previous, solidClient.setThing(previous, series), session.fetch);
      },
      _ret2;
    for (var seriesUrl of thing ? solidClient.getUrlAll(thing, DCAT_IN_SERIES) : []) {
      _ret2 = yield* _loop4();
      if (_ret2 === 0) continue;
    }
  });
  return function unlinkFromParentSeries(_x101, _x102, _x103) {
    return _ref47.apply(this, arguments);
  };
}();
var deleteDatasetEntry = /*#__PURE__*/function () {
  var _ref49 = _asyncToGenerator(function* (session, datasetUrl, identifier) {
    var {
      podRoot: podRootOverride = ""
    } = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!datasetUrl) return;
    var podRoot = podRootOverride || getPodRoot(session.info.webId);
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
        deleteResource: solidClient.deleteFile
      });
    } finally {
      clearCache();
    }
  });
  return function deleteDatasetEntry(_x107, _x108, _x109) {
    return _ref49.apply(this, arguments);
  };
}();

var IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
var OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
var DEFAULT_THEME_NS = "https://w3id.org/solid-dataspace-manager/theme/";
var generateIdentifier = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dataset-".concat(Date.now());
};
var normalizeContactEmail = value => {
  var candidate = String(value || "").trim().replace(/^mailto:/, "");
  return candidate.includes("@") && !candidate.includes(":") ? candidate : "";
};
var normalizeContactUrl = value => {
  var candidate = String(value || "").trim();
  if (!candidate) return "";
  try {
    var url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch (_unused) {
    return "";
  }
};
var normalizePodRoot = value => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim() !== value) {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  var url;
  try {
    url = new URL(value);
  } catch (_unused2) {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:" || url.username || url.password || url.search || url.hash) {
    throw new Error("Pod root must be an absolute HTTP(S) container URL.");
  }
  return url.href.endsWith("/") ? url.href : "".concat(url.href, "/");
};
var normalizeHttpUrl = function normalizeHttpUrl(value, label) {
  var {
    allowHash = false,
    allowEmpty = false
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var candidate = String(value || "").trim();
  if (!candidate && allowEmpty) return "";
  var url;
  try {
    url = new URL(candidate);
  } catch (_unused3) {
    throw new Error("".concat(label, " must be an absolute HTTP(S) URL."));
  }
  if (url.protocol !== "https:" && url.protocol !== "http:" || url.username || url.password || url.search || !allowHash && url.hash) {
    throw new Error("".concat(label, " must be an absolute HTTP(S) URL."));
  }
  return url.href;
};
var normalizeRegistryUrl = value => {
  try {
    var url = new URL(String(value || "").trim());
    var localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !localHttp || url.username || url.password || url.search || url.hash) {
      return "";
    }
    return url.href.replace(/\/+$/, "");
  } catch (_unused4) {
    return "";
  }
};
var normalizeTheme = value => {
  var candidate = String(value || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return normalizeHttpUrl(candidate, "Theme", {
      allowHash: true
    });
  }
  var slug = candidate.toLowerCase().replace(/\s+/g, "-");
  return "".concat(DEFAULT_THEME_NS).concat(encodeURIComponent(slug));
};
var normalizeOperationId = value => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim() !== value) {
    throw new Error("Operation ID contains unsupported characters.");
  }
  if (!OPERATION_ID_PATTERN.test(value)) {
    throw new Error("Operation ID contains unsupported characters.");
  }
  return value;
};
var requireSession = session => {
  var _session$info;
  if (!(session !== null && session !== void 0 && (_session$info = session.info) !== null && _session$info !== void 0 && _session$info.webId) || typeof session.fetch !== "function") {
    throw new Error("An authenticated Solid session is required.");
  }
};
var loadResearchRegistryContext = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (session) {
    var {
      podRoot = ""
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    requireSession(session);
    var registryConfig = yield loadRegistryConfig(session.info.webId, session.fetch, {
      podRoot
    });
    var publicRegistries = Array.from(new Set((Array.isArray(registryConfig === null || registryConfig === void 0 ? void 0 : registryConfig.registries) ? registryConfig.registries : []).map(normalizeRegistryUrl).filter(Boolean)));
    return {
      catalogConfigured: (registryConfig === null || registryConfig === void 0 ? void 0 : registryConfig.mode) === "research" && publicRegistries.length > 0,
      publicRegistries: (registryConfig === null || registryConfig === void 0 ? void 0 : registryConfig.mode) === "research" ? publicRegistries : [],
      registryConfig: _objectSpread2(_objectSpread2({}, registryConfig), {}, {
        mode: (registryConfig === null || registryConfig === void 0 ? void 0 : registryConfig.mode) === "private" ? "private" : "research",
        registries: publicRegistries
      })
    };
  });
  return function loadResearchRegistryContext(_x) {
    return _ref.apply(this, arguments);
  };
}();
var discoverableRegistryError = () => {
  var error = new Error("A public Dataspace registry must be configured before this operation can continue.");
  error.code = "discoverable-registry-required";
  return error;
};
function normalizeRestrictedDatasetInput(session) {
  var _input$distributions, _input$conformsTo, _input$semanticModels, _primary$conformsTo;
  var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  requireSession(session);
  var identifier = String(input.identifier || generateIdentifier()).trim();
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error("Dataset identifier contains unsupported characters.");
  }
  var primary = ((_input$distributions = input.distributions) === null || _input$distributions === void 0 ? void 0 : _input$distributions[0]) || {};
  var distributionUrl = String(input.distributionUrl || input.access_url_dataset || input.dataUrl || primary.downloadURL || "").trim();
  if (!distributionUrl) throw new Error("A dataset distribution URL is required.");
  var includeCreator = input.includeCreator !== false && input.omitCreator !== true;
  var contactPoint = input.contactPoint || input.contact_point || "";
  var explicitContactUrl = input.contactPointWebId || input.contactWebId || input.contactPointUrl || input.contactUrl || input.contact_url || contactPoint;
  var normalized = {
    podRoot: normalizePodRoot(input.podRoot || input.pod_root),
    identifier,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    issued: input.issued || new Date().toISOString(),
    publisher: String(input.publisher || "").trim(),
    publisher_url: normalizeContactUrl(input.publisherWebId || input.publisherUrl || input.publisher_url),
    contact_point: normalizeContactEmail(contactPoint),
    contact_url: normalizeContactUrl(explicitContactUrl),
    access_url_dataset: distributionUrl,
    distributions: input.distributions,
    semanticModels: input.conformsTo || input.semanticModels || [],
    access_url_semantic_model: String(input.semanticModelUrl || input.access_url_semantic_model || ((_input$conformsTo = input.conformsTo) === null || _input$conformsTo === void 0 ? void 0 : _input$conformsTo[0]) || ((_input$semanticModels = input.semanticModels) === null || _input$semanticModels === void 0 ? void 0 : _input$semanticModels[0]) || ((_primary$conformsTo = primary.conformsTo) === null || _primary$conformsTo === void 0 ? void 0 : _primary$conformsTo[0]) || "").trim(),
    file_format: String(input.mediaType || input.file_format || primary.mediaType || "").trim(),
    theme: String(input.theme || "").trim(),
    webid: includeCreator ? String(input.creatorWebId || input.webid || session.info.webId).trim() : "",
    distribution_access_type: "download",
    is_public: false,
    strict_restricted_acl: true,
    require_discoverable_registry: input.requireDiscoverableRegistry === true || input.require_discoverable_registry === true
  };
  assertProfileDistributions(profileDistributions(normalized));
  return normalized;
}
function normalizePublicDatasetInput(session) {
  var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var normalized = normalizeRestrictedDatasetInput(session, input);
  if (!normalized.title) {
    throw new Error("A public dataset title is required.");
  }
  if (!normalized.file_format) {
    throw new Error("A public dataset media type is required.");
  }
  return _objectSpread2(_objectSpread2({}, normalized), {}, {
    access_url_dataset: normalizeHttpUrl(normalized.access_url_dataset, "Dataset distribution URL"),
    access_url_semantic_model: normalized.access_url_semantic_model,
    theme: normalizeTheme(normalized.theme),
    is_public: true,
    strict_restricted_acl: false,
    strict_public_acl: true,
    require_discoverable_registry: true
  });
}
function getCatalogReadiness(_x2) {
  return _getCatalogReadiness.apply(this, arguments);
}
function _getCatalogReadiness() {
  _getCatalogReadiness = _asyncToGenerator(function* (session) {
    var _session$info2;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var explicitPodRoot = normalizePodRoot(options.podRoot || options.pod_root);
    var podRoot = explicitPodRoot || getPodRoot(session === null || session === void 0 || (_session$info2 = session.info) === null || _session$info2 === void 0 ? void 0 : _session$info2.webId);
    var {
      catalogConfigured,
      publicRegistries
    } = yield loadResearchRegistryContext(session, {
      podRoot
    });
    return {
      catalogConfigured,
      publicRegistries
    };
  });
  return _getCatalogReadiness.apply(this, arguments);
}
function getPublicRegistryPresets() {
  var presets = new Map();
  for (var preset of REGISTRY_PRESETS || []) {
    var url = normalizeRegistryUrl(preset === null || preset === void 0 ? void 0 : preset.url);
    var id = String((preset === null || preset === void 0 ? void 0 : preset.id) || "").trim();
    var label = String((preset === null || preset === void 0 ? void 0 : preset.label) || "").trim();
    if (!id || !label || !url || presets.has(url)) continue;
    presets.set(url, {
      id,
      label,
      url
    });
  }
  return Array.from(presets.values());
}
function ensurePublicCatalogReadiness(_x3) {
  return _ensurePublicCatalogReadiness.apply(this, arguments);
}
function _ensurePublicCatalogReadiness() {
  _ensurePublicCatalogReadiness = _asyncToGenerator(function* (session) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    requireSession(session);
    var explicitPodRoot = normalizePodRoot(options.podRoot || options.pod_root);
    var podRoot = explicitPodRoot || getPodRoot(session.info.webId);
    var registryUrl = normalizeRegistryUrl(options.registryUrl || options.registry_url);
    if (!registryUrl) {
      throw new Error("Choose a valid public research registry.");
    }
    var current = yield loadResearchRegistryContext(session, {
      podRoot
    });
    var allowedRegistries = new Set([...getPublicRegistryPresets().map(preset => preset.url), ...current.publicRegistries]);
    if (!allowedRegistries.has(registryUrl)) {
      throw new Error("The selected public research registry is not an available preset.");
    }

    // Preserve already-active public memberships and the user's private registry
    // location. Only the explicit app consent switches the profile to research
    // mode and adds the selected public registry.
    var registryConfig = _objectSpread2(_objectSpread2({}, current.registryConfig), {}, {
      mode: "research",
      registries: Array.from(new Set([...current.publicRegistries, registryUrl]))
    });
    yield saveRegistryConfig(session.info.webId, session.fetch, registryConfig, {
      podRoot
    });
    yield ensureCatalogStructure(session, {
      podRoot,
      registryConfig,
      title: String(options.catalogTitle || "Solid Dataspace Catalog").trim()
    });
    var verified = yield loadResearchRegistryContext(session, {
      podRoot
    });
    if (!verified.catalogConfigured || !verified.publicRegistries.includes(registryUrl)) {
      throw new Error("The public research registry setup could not be verified.");
    }
    return {
      catalogConfigured: true,
      publicRegistries: verified.publicRegistries,
      selectedRegistry: registryUrl
    };
  });
  return _ensurePublicCatalogReadiness.apply(this, arguments);
}
var prepareDistributionAccess = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* (session, input, podRoot) {
    var ensureAccess = input.is_public ? ensurePublicReadOnlyResourceAccess : ensureRestrictedResourceAccess;
    var root = new URL(podRoot);
    var localModel = url => {
      var target = new URL(url);
      return target.origin === root.origin && target.pathname.startsWith(root.pathname);
    };
    var resources = new Set();
    for (var distribution of profileDistributions(input)) {
      resources.add(distribution.downloadURL);
      distribution.conformsTo.filter(localModel).forEach(url => resources.add(url));
    }
    for (var url of resources) yield ensureAccess(session, url, {
      podRoot
    });
  });
  return function prepareDistributionAccess(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();
function publishPublicDataset(_x7) {
  return _publishPublicDataset.apply(this, arguments);
}
function _publishPublicDataset() {
  _publishPublicDataset = _asyncToGenerator(function* (session) {
    var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var normalized = normalizePublicDatasetInput(session, input);
    var podRoot = normalized.podRoot || getPodRoot(session.info.webId);
    var datasetUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl#it");
    var recordUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl");
    var catalogUrl = "".concat(podRoot, "catalog/cat.ttl");
    var readiness = yield loadResearchRegistryContext(session, {
      podRoot
    });
    if (!readiness.catalogConfigured) throw discoverableRegistryError();
    normalized.registryConfig = readiness.registryConfig;
    yield prepareDistributionAccess(session, normalized, podRoot);
    try {
      var created = yield createDataset(session, normalized);
      yield ensurePublicReadOnlyResourceAccess(session, created.datasetUrl, {
        podRoot
      });
      yield ensurePublicReadOnlyResourceAccess(session, recordUrl, {
        podRoot
      });
      yield ensurePublicReadOnlyResourceAccess(session, catalogUrl, {
        podRoot
      });
      return _objectSpread2(_objectSpread2({}, created), {}, {
        recordUrl,
        distributionUrl: normalized.access_url_dataset
      });
    } catch (error) {
      try {
        yield deleteDatasetEntry(session, datasetUrl, normalized.identifier, {
          podRoot
        });
      } catch (cleanupError) {
        console.warn("Failed to clean up incomplete public dataset metadata.", cleanupError);
      }
      throw error;
    }
  });
  return _publishPublicDataset.apply(this, arguments);
}
function updatePublicDataset(_x8) {
  return _updatePublicDataset.apply(this, arguments);
}
function _updatePublicDataset() {
  _updatePublicDataset = _asyncToGenerator(function* (session) {
    var _input$operationId;
    var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var normalized = normalizePublicDatasetInput(session, input);
    var operationId = normalizeOperationId((_input$operationId = input.operationId) !== null && _input$operationId !== void 0 ? _input$operationId : input.operation_id);
    var podRoot = normalized.podRoot || getPodRoot(session.info.webId);
    var expectedDatasetUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl#it");
    var requestedDatasetUrl = String(input.datasetUrl || input.catalogDatasetUrl || "").trim();
    if (!requestedDatasetUrl) {
      throw new Error("An existing catalog dataset URL is required for an update.");
    }
    var datasetUrl = assertCatalogDatasetDeletionTarget(podRoot, requestedDatasetUrl, normalized.identifier);
    if (new URL(datasetUrl).href !== new URL(expectedDatasetUrl).href) {
      throw new Error("Dataset URL must match the deterministic catalog URL for its identifier.");
    }
    var recordUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl");
    var catalogUrl = "".concat(podRoot, "catalog/cat.ttl");
    var readiness = yield loadResearchRegistryContext(session, {
      podRoot
    });
    if (!readiness.catalogConfigured) throw discoverableRegistryError();
    normalized.registryConfig = readiness.registryConfig;
    yield prepareDistributionAccess(session, normalized, podRoot);

    // Updating an existing deterministic entry deliberately has no create-style
    // cleanup path. If a later verification fails, keep the existing metadata in
    // place so callers can retry or compensate without losing the Catalog entry.
    yield updateDataset(session, _objectSpread2(_objectSpread2({}, normalized), {}, {
      podRoot,
      datasetUrl
    }, operationId ? {
      operation_id: operationId
    } : {}));
    yield ensurePublicReadOnlyResourceAccess(session, datasetUrl, {
      podRoot
    });
    yield ensurePublicReadOnlyResourceAccess(session, recordUrl, {
      podRoot
    });
    yield ensurePublicReadOnlyResourceAccess(session, catalogUrl, {
      podRoot
    });
    return {
      identifier: normalized.identifier,
      datasetUrl,
      recordUrl,
      distributionUrl: normalized.access_url_dataset
    };
  });
  return _updatePublicDataset.apply(this, arguments);
}
var normalizeDiscoveryOptions = function normalizeDiscoveryOptions() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var identifierPrefix = String(options.identifierPrefix || "").trim();
  if (identifierPrefix && !IDENTIFIER_PATTERN.test(identifierPrefix)) {
    throw new Error("Dataset identifier prefix contains unsupported characters.");
  }
  return {
    podRoot: normalizePodRoot(options.podRoot || options.pod_root),
    identifierPrefix,
    mediaType: String(options.mediaType || "").trim().toLowerCase(),
    theme: options.theme ? normalizeTheme(options.theme) : ""
  };
};
var safeDiscoveredUrl = function safeDiscoveredUrl(value) {
  var {
    allowHash = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  try {
    return normalizeHttpUrl(value, "Discovered URL", {
      allowHash
    });
  } catch (_unused5) {
    return "";
  }
};
function discoverPublicDatasets(_x9) {
  return _discoverPublicDatasets.apply(this, arguments);
}
function _discoverPublicDatasets() {
  _discoverPublicDatasets = _asyncToGenerator(function* (session) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    requireSession(session);
    var filters = normalizeDiscoveryOptions(options);
    var podRoot = filters.podRoot || getPodRoot(session.info.webId);
    var readiness = yield loadResearchRegistryContext(session, {
      podRoot
    });
    if (!readiness.catalogConfigured) throw discoverableRegistryError();
    var aggregated = yield loadAggregatedDatasets(session, undefined, {
      researchRegistries: readiness.publicRegistries
    });
    var discovered = new Map();
    for (var dataset of (aggregated === null || aggregated === void 0 ? void 0 : aggregated.datasets) || []) {
      var identifier = String((dataset === null || dataset === void 0 ? void 0 : dataset.identifier) || "").trim();
      var title = String((dataset === null || dataset === void 0 ? void 0 : dataset.title) || "").trim();
      var mediaType = String((dataset === null || dataset === void 0 ? void 0 : dataset.file_format) || "").trim();
      var theme = String((dataset === null || dataset === void 0 ? void 0 : dataset.theme) || "").trim();
      var datasetUrl = safeDiscoveredUrl(dataset === null || dataset === void 0 ? void 0 : dataset.datasetUrl, {
        allowHash: true
      });
      var distributionUrl = safeDiscoveredUrl(dataset === null || dataset === void 0 ? void 0 : dataset.access_url_dataset);
      if ((dataset === null || dataset === void 0 ? void 0 : dataset.datasetType) !== "dataset" || (dataset === null || dataset === void 0 ? void 0 : dataset.is_public) !== true || !IDENTIFIER_PATTERN.test(identifier) || !title || !mediaType || !theme || !datasetUrl || !distributionUrl || filters.identifierPrefix && !identifier.startsWith(filters.identifierPrefix) || filters.mediaType && mediaType.toLowerCase() !== filters.mediaType || filters.theme && theme !== filters.theme) {
        continue;
      }
      discovered.set(datasetUrl, {
        identifier,
        title,
        description: String(dataset.description || "").trim(),
        publisher: String(dataset.publisher || "").trim(),
        creatorWebId: safeDiscoveredUrl(dataset.webid, {
          allowHash: true
        }),
        datasetUrl,
        distributionUrl,
        mediaType,
        theme
      });
    }
    return Array.from(discovered.values());
  });
  return _discoverPublicDatasets.apply(this, arguments);
}
function publishRestrictedDataset(_x10) {
  return _publishRestrictedDataset.apply(this, arguments);
}
function _publishRestrictedDataset() {
  _publishRestrictedDataset = _asyncToGenerator(function* (session) {
    var input = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var normalized = normalizeRestrictedDatasetInput(session, input);
    var podRoot = normalized.podRoot || getPodRoot(session.info.webId);
    var datasetUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl#it");
    var recordUrl = "".concat(podRoot, "catalog/ds/").concat(normalized.identifier, ".ttl");
    if (normalized.require_discoverable_registry) {
      var registryConfig = yield loadRegistryConfig(session.info.webId, session.fetch, {
        podRoot
      });
      if ((registryConfig === null || registryConfig === void 0 ? void 0 : registryConfig.mode) !== "research" || !Array.isArray(registryConfig.registries) || registryConfig.registries.length === 0) {
        var error = new Error("A public Dataspace registry must be configured before this dataset can be published.");
        error.code = "discoverable-registry-required";
        throw error;
      }
      normalized.registryConfig = registryConfig;
    }
    yield prepareDistributionAccess(session, normalized, podRoot);
    try {
      var created = yield createDataset(session, normalized);
      return _objectSpread2(_objectSpread2({}, created), {}, {
        recordUrl,
        distributionUrl: normalized.access_url_dataset
      });
    } catch (error) {
      try {
        yield deleteDatasetEntry(session, datasetUrl, normalized.identifier, {
          podRoot
        });
      } catch (cleanupError) {
        console.warn("Failed to clean up incomplete restricted dataset metadata.", cleanupError);
      }
      throw error;
    }
  });
  return _publishRestrictedDataset.apply(this, arguments);
}
function removeDataset(_x11) {
  return _removeDataset.apply(this, arguments);
}
function _removeDataset() {
  _removeDataset = _asyncToGenerator(function* (session) {
    var reference = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    requireSession(session);
    var input = typeof reference === "string" ? {
      datasetUrl: reference
    } : reference;
    var explicitPodRoot = normalizePodRoot(input.podRoot || input.pod_root);
    var podRoot = explicitPodRoot || getPodRoot(session.info.webId);
    var identifier = String(input.identifier || "").trim();
    if (identifier && !IDENTIFIER_PATTERN.test(identifier)) {
      throw new Error("Dataset identifier contains unsupported characters.");
    }
    var datasetUrl = String(input.datasetUrl || (identifier ? "".concat(podRoot, "catalog/ds/").concat(identifier, ".ttl#it") : "")).trim();
    if (!datasetUrl) throw new Error("datasetUrl or identifier is required.");
    var safeDatasetUrl = assertCatalogDatasetDeletionTarget(podRoot, datasetUrl, identifier);
    yield deleteDatasetEntry(session, safeDatasetUrl, identifier, {
      podRoot
    });
    return {
      removed: true,
      datasetUrl: safeDatasetUrl,
      identifier
    };
  });
  return _removeDataset.apply(this, arguments);
}

exports.discoverPublicDatasets = discoverPublicDatasets;
exports.ensurePublicCatalogReadiness = ensurePublicCatalogReadiness;
exports.getCatalogReadiness = getCatalogReadiness;
exports.getPublicRegistryPresets = getPublicRegistryPresets;
exports.normalizeRestrictedDatasetInput = normalizeRestrictedDatasetInput;
exports.publishPublicDataset = publishPublicDataset;
exports.publishRestrictedDataset = publishRestrictedDataset;
exports.removeDataset = removeDataset;
exports.updatePublicDataset = updatePublicDataset;
//# sourceMappingURL=index.cjs.map
