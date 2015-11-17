# google-spreadsheets

[![Build Status][badge-travis-img]][badge-travis-url]
[![Dependency Information][badge-david-img]][badge-david-url]
[![Code Climate][badge-climate-img]][badge-climate-url]
[![Test Coverage][badge-coverage-img]][badge-coverage-url]
[![npm][badge-npm-img]][badge-npm-url]

A simple node.js library to read data from a Google Spreadsheet.

## Quickstart

```
npm install google-spreadsheets --save
```

```js
var GoogleSpreadsheets = require('google-spreadsheets');

// OPTIONAL: if you want to perform authenticated requests.
// You must install this dependency yourself if you need it.
var google = require('googleapis');

var oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
// Assuming you already obtained an OAuth2 token that has access to the correct scopes somehow...
oauth2Client.setCredentials({
	access_token: ACCESS_TOKEN,
	refresh_token: REFRESH_TOKEN
});

GoogleSpreadsheets({
	key: '<spreadsheet key>',
	auth: oauth2Client
}, function(err, spreadsheet) {
	spreadsheet.worksheets[0].cells({
		range: 'R1C1:R5C5'
	}, function(err, cells) {
		// Cells will contain a 2 dimensional array with all cell data in the
		// range requested.
	});
});
```

### In browser

Build browser bundle with `npm run build`. Then include
`lib/spreadsheets.browser.min.js` in your HTML:

```html
<script src='http://url.to/spreadsheets.browser.min.js'></script>
```

Usage is same as above, module is available at `window.Spreadsheets`:

```js
window.Spreadsheets(options, callback);
```

## Authentication

By default, `google-spreadsheets` will attempt requests for a spreadsheet as an unauthenticated (anonymous) user. There are some caveats to this, which you should read about in the [Anonymous Requests](#Anonymous Requests) section below.

As shown in the example above, you can depend on Google's official [`googleapis`](https://github.com/google/google-api-nodejs-client) module and provide it to `google-spreadsheets`. This will allow you to easily make OAuth2 or JWT authenticated requests. See the `googleapis` project for more detailed information about configuring authentication.

## API

### GoogleSpreadsheets(opts, callback)

Loads a `Spreadsheet` from the API. `opts` may contain the following:

 * `key`: *(required)* spreadsheet key
 * `auth`: *(optional)* authentication key from Google ClientLogin


### GoogleSpreadsheets.rows(opts, callback)

Loads a set of rows for a specific Spreadsheet from the API. Note that this call is direct, you must supply all auth, spreadsheet and worksheet information.

`opts`:
 * `key`: *(required)* spreadsheet key
 * `worksheet`: *(required)* worksheet id. Can be a numeric index (starting from 1), or the proper string identifier for a worksheet.
 * `start`: *(optional)* starting index for returned results
 * `num`: *(optional)* number of results to return 
 * `auth`: *(optional)* authentication key from Google ClientLogin
 * `sq`: *(optional)* structured query (not URL encoded) - https://developers.google.com/google-apps/spreadsheets/#sending_a_structured_query_for_rows 


### GoogleSpreadsheets.cells(opts, callback)

Loads a group of cells for a specific Spreadsheet from the API. Note that this call is direct, you must supply all auth, spreadsheet and worksheet information.

`opts`:
 * `key`: *(required)* spreadsheet key
 * `worksheet`: *(required)* worksheet id. Can be a numeric index (starting from 1), or the proper string identifier for a worksheet.
 * `range`: *(optional)* A range (in the format of R1C1) of cells to retrieve. e.g R15C2:R37C8. Range is inclusive.
 * `auth`: *(optional)* authentication key from Google ClientLogin

### `Spreadsheet` object

Object returned from `GoogleSpreadsheets()` call. This object has the following properties:
 * `title`: title of Spreadsheet
 * `updated`: date Spreadsheet was last updated.
 * `author`: object containing `name` and `email` of author of Spreadsheet.
 * `worksheets`: Array of Worksheets contained in this spreadsheet.

### `Worksheet` object

Represents a single worksheet contained in a Spreadsheet. Obtain this via `Spreadsheet.worksheets`.

A Worksheet has the following properties:
 * `rowCount`: number of rows in worksheet.
 * `colCount`: number of columns in worksheet.
 * `Worksheet.rows(opts, cb)`: convenience method to call `Spreadsheets.rows`, just pass in `start` and `num` - will automatically pass spreadsheet key, worksheet id, and auth info (if applicable) 
 * `Worksheet.cols(opts, cb)`: convenience method to call `Spreadsheets.cols`, will automatically pass spreadsheet key, worksheet id, and auth info (if applicable). opts can contain `range`, etc.

## Anonymous Requests

As mentioned earlier, `google-spreadsheets` defaults to issuing anonymous requests to the API. This will only work for reading Google Spreadsheets that have had link sharing enabled for "Anyone on the internet", and have been published to the web.

Furthermore, the Google Spreadsheets Data API reference and developers guide is a little ambiguous about how you access a "published" public Spreadsheet.

If you wish to work with a Google Spreadsheet without authenticating, not only must the Spreadsheet in question be visible to the web, but it must also have been explicitly published using the "Share" button in the top right corner of the Google Spreadsheets GUI.

You may discover that a particular public spreadsheet you're trying to anonymously read may not have had this treatment, so your best bet is to issue authenticated requests for the spreadsheet (or contact the owner and ask them to fix their spreadsheet).

## Further possibilities for this library

 * Edit functionality
 * Sorting/filtering on row listing
 * Filtering on cell listing.

## Links

 * <http://code.google.com/apis/spreadsheets/>
 * <https://github.com/google/google-api-nodejs-client>

## License

node-google-spreadsheets is free and unencumbered public domain software. For more information, see the accompanying [UNLICENSE](UNLICENSE) file.

[badge-travis-img]: https://img.shields.io/travis/samcday/node-google-spreadsheets.svg?style=flat-square
[badge-travis-url]: https://travis-ci.org/samcday/node-google-spreadsheets
[badge-david-img]: https://img.shields.io/david/samcday/node-google-spreadsheets.svg?style=flat-square
[badge-david-url]: https://david-dm.org/samcday/node-google-spreadsheets
[badge-npm-img]: https://nodei.co/npm/google-spreadsheets.png?downloads=true&downloadRank=true&stars=true
[badge-npm-url]: https://www.npmjs.org/package/google-spreadsheets
[badge-climate-img]: https://img.shields.io/codeclimate/github/samcday/node-google-spreadsheets.svg?style=flat-square
[badge-climate-url]: https://codeclimate.com/github/samcday/node-google-spreadsheets
[badge-coverage-img]: https://img.shields.io/codeclimate/coverage/github/samcday/node-google-spreadsheets.svg?style=flat-square
[badge-coverage-url]: https://codeclimate.com/github/samcday/node-google-spreadsheets
[badge-npm-img]: https://img.shields.io/npm/dm/google-spreadsheets.svg?style=flat-square
[badge-npm-url]: https://www.npmjs.org/package/google-spreadsheets
