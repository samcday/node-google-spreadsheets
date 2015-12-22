"use strict";

var request = require("request");
var statuses = require("statuses");
var querystring = require("querystring");

// If caller has installed googleapis, we do some sanity checking to make sure it's a version we know.
try {
  if (process.env.NODE_ENV !== "production") {
    var semver = require("semver");
    var googleapisVersion = module.parent.require("googleapis/package.json").version;
    if (!semver.satisfies(googleapisVersion, "1.x || 2.x")) {
      console.log("WARN: google-spreadsheets detected googleapis@" + googleapisVersion + " is installed. This version is unrecognised by this version of google-spreadsheets and may not work correctly.");
    }
  }
} catch(e) { }

var FEED_URL = "https://spreadsheets.google.com/feeds/";

var Spreadsheets;

var forceArray = function(val) {
  if(Array.isArray(val)) {
    return val;
  }

  return [val];
};

var getFeed = function(params, auth, query, cb) {
  var visibility = "public";
  var projection = "values";

  var options = {
    followRedirect: false
  };

  if (auth) {
    visibility = "private";
    projection = "full";
  }

  params.push(visibility, projection);

  query = query || {};
  query.v = "3.0";
  query.alt = "json";

  options.url = FEED_URL + params.join("/");

  if (query) {
    options.url += "?" + querystring.stringify(query);
  }

  var reqCallback = function(err, response) {
    if (err) {
      if (err.message.indexOf('CORS request rejected') === 0) {
        return cb(new Error("No access to that spreadsheet, check your auth."));
      }
      return cb(err);
    }
    if (!response) {
      cb(new Error("Missing response."));
      return;
    }

    if (response.statusCode === 302) {
      return cb(new Error("No access to that spreadsheet, check your auth."));
    }

    if (response.statusCode === 401) {
      return cb(new Error("Invalid authorization key."));
    }

    if (response.statusCode >= 400) {
      return cb(new Error("HTTP error " + response.statusCode + ": " + statuses[response.statusCode]));
    }

    cb(null, JSON.parse(response.body).feed);
  };

  if (!auth) {
    request.get(options, reqCallback);
  } else {
    auth.request(options, function(err, body, response) {
      // For some crazy reason, googleapis DefaultTransporter swaps the ordering of the args...
      reqCallback(err, response, body);
    });
  }
};

var Worksheet = function(spreadsheet, data) {
  // This should be okay, unless Google decided to change their URL scheme...
  var id = data.id.$t;
  this.id = id.substring(id.lastIndexOf("/") + 1);
  this.spreadsheet = spreadsheet;
  this.rowCount = data.gs$rowCount.$t;
  this.colCount = data.gs$colCount.$t;
  this.title = data.title.$t;
};

function prepareRowsOrCellsOpts(worksheet, opts) {
  opts = opts || {};
  opts.key = worksheet.spreadsheet.key;
  opts.auth = worksheet.spreadsheet.auth;
  opts.worksheet = worksheet.id;
  return opts;
}

Worksheet.prototype.rows = function(opts, cb) {
  Spreadsheets.rows(prepareRowsOrCellsOpts(this, opts), cb);
};

Worksheet.prototype.cells = function(opts, cb) {
  Spreadsheets.cells(prepareRowsOrCellsOpts(this, opts), cb);
};

var Spreadsheet = function(key, auth, data) {
  this.key = key;
  this.auth = auth;
  this.title = data.title.$t;
  this.updated = data.updated.$t;
  this.author = {
    name: data.author[0].name.$t,
    email: data.author[0].email.$t
  };

  this.worksheets = [];
  var worksheets = forceArray(data.entry);

  worksheets.forEach(function(worksheetData) {
    this.worksheets.push(new Worksheet(this, worksheetData));
  }, this);
};

var Row = function(data) {
  Object.keys(data).forEach(function(key) {
    var val;
    val = data[key];
    if(key.substring(0, 4) === "gsx:")  {
      if(typeof val === 'object' && Object.keys(val).length === 0) {
        val = null;
      }
      if (key === "gsx:") {
        this[key.substring(0, 3)] = val;
      } else {
        this[key.substring(4)] = val;
      }
    } else if(key.substring(0, 4) === "gsx$") {
      if (key === "gsx$") {
        this[key.substring(0, 3)] = val;
      } else {
        this[key.substring(4)] = val.$t || val;
      }
    } else {
      if (key === "id") {
        this[key] = val;
      } else if (val.$t) {
        this[key] = val.$t;
      }
    }
  }, this);
};

var Cells = function(data) {
  // Populate the cell data into an array grid.
  this.cells = {};

  var entries = forceArray(data.entry);
  var cell, row, col;
  entries.forEach(function(entry) {
    cell = entry.gs$cell;
    row = cell.row;
    col = cell.col;

    if(!this.cells[row]) {
      this.cells[row] = {};
    }

    this.cells[row][col] = {
      row: row,
      col: col,
      value: cell.$t || ""
    };
  }, this);
};

Spreadsheets = module.exports = function(opts, cb) {
  if(!opts) {
    throw new Error("Invalid arguments.");
  }
  if(!opts.key) {
    throw new Error("Spreadsheet key not provided.");
  }

  getFeed(["worksheets", opts.key], opts.auth, null, function(err, data) {
    if(err) {
      return cb(err);
    }

    var spreadSheet = null;
    try {
        spreadSheet = new Spreadsheet(opts.key, opts.auth, data);
    } catch (ex) {
        cb(ex, null);
        return;
    }
    cb(null, spreadSheet);
  });
};

Spreadsheets.rows = function(opts, cb) {
  if(!opts) {
    throw new Error("Invalid arguments.");
  }
  if(!opts.key) {
    throw new Error("Spreadsheet key not provided.");
  }
  if(!opts.worksheet) {
    throw new Error("Worksheet not specified.");
  }

  var query = {};
  if(opts.start) {
    query["start-index"] = opts.start;
  }
  if(opts.num) {
    query["max-results"] = opts.num;
  }
  if(opts.orderby) {
    query.orderby = opts.orderby;
  }
  if(opts.reverse) {
    query.reverse = opts.reverse;
  }
  if(opts.sq) {
    query.sq = opts.sq;
  }

  getFeed(["list", opts.key, opts.worksheet], opts.auth, query, function(err, data) {
    if(err) {
      return cb(err);
    }

    var rows = [];

    if(typeof data.entry !== "undefined" && data.entry !== null) {
      var entries = forceArray(data.entry);

      entries.forEach(function(entry) {
        rows.push(new Row(entry));
      });
    }

    cb(null, rows);
  });
};

Spreadsheets.cells = function(opts, cb) {
  if(!opts) {
    throw new Error("Invalid arguments.");
  }
  if(!opts.key) {
    throw new Error("Spreadsheet key not provided.");
  }
  if(!opts.worksheet) {
    throw new Error("Worksheet not specified.");
  }

  var query = {
  };
  if(opts.range) {
    query.range = opts.range;
  }
  if (opts.maxRow) {
    query["max-row"] = opts.maxRow;
  }
  if (opts.minRow) {
    query["min-row"] = opts.minRow;
  }
  if (opts.maxCol) {
    query["max-col"] = opts.maxCol;
  }
  if (opts.minCol) {
    query["min-col"] = opts.minCol;
  }

  getFeed(["cells", opts.key, opts.worksheet], opts.auth, query, function(err, data) {
    if(err) {
      return cb(err);
    }

    if(typeof data.entry !== "undefined" && data.entry !== null) {
      return cb(null, new Cells(data));
    } else {
      return cb(null, { cells: {} }); // Not entirely happy about defining the data format in 2 places (here and in Cells()), but the alternative is moving this check for undefined into that constructor, which means it's in a different place than the one for .rows() above -- and that mismatch is what led to it being missed
    }
  });
};
