"use strict";

var assert = require("assert");
var GoogleSpreadsheets = require("../lib/spreadsheets");
try {
  // browserify fails requiring googleapis
  var google = require("googleapis");
} catch(e) {
  console.log("Not testing Google API.")
}
require("should");

describe("google-spreadsheets", function() {
	this.timeout(0);
	it("can load a spreadsheet", function(done) {
		GoogleSpreadsheets({
			key: "0ApDvWFF4RPZBdEFucnJya1hxVG9wZzhJQWZUWkpfekE"
		}, function(err, spreadsheet) {
			if(err) return done(err);
			spreadsheet.title.should.equal("Example Spreadsheet");
			spreadsheet.author.name.should.equal("sam.c.day");
			spreadsheet.author.email.should.equal("sam.c.day@gmail.com");
			done();
		});
	});
  it("can load a Team Drive spreadsheet", function(done) {
    GoogleSpreadsheets({
      key: "1sla_yK0U3bVzTEby-rt5_hLFDDxlDfhn59JRRZe_QjA"
    }, function(err, spreadsheet) {
      if(err) return done(err);
      spreadsheet.title.should.equal("Example Team Drive sheet");
      spreadsheet.author.name.should.equal("Team Drive");
      spreadsheet.author.email.should.equal("teamdrive@gmail.com");
      done();
    });
  });
	it("can load spreadsheet cells", function(done) {
		GoogleSpreadsheets({
			key: "0ApDvWFF4RPZBdEFucnJya1hxVG9wZzhJQWZUWkpfekE"
		}, function(err, spreadsheet) {
			if(err) return done(err);
			spreadsheet.worksheets[0].cells({
				range: "R1C1:R1C2"
			}, function(err, result) {
				result.cells[1][1].value.should.equal("Hello,");
				result.cells[1][2].value.should.equal("World!");
				done();
			});
		});
	});
	it("can retrieve spreadsheet row which conforms to query", function(done) {
		GoogleSpreadsheets({
			key: "0ApDvWFF4RPZBdEFucnJya1hxVG9wZzhJQWZUWkpfekE"
		}, function(err, spreadsheet) {
			if(err) return done(err);
			spreadsheet.worksheets[0].rows({
				sq: "hello>1"
			}, function(err, result) {
				result[0].world.should.equal("10");
				result[0].hello.should.equal("2");
				done();
			});
		});
	});
	it("can retrieve no rows with query", function(done) {
		GoogleSpreadsheets({
			key: "0ApDvWFF4RPZBdEFucnJya1hxVG9wZzhJQWZUWkpfekE"
		}, function(err, spreadsheet) {
			if(err) return done(err);
			spreadsheet.worksheets[0].rows({
				sq: "hello>2"
			}, function(err, result) {
				result.length.should.equal(0);
				done();
			});
		});
	});
	it("fails gracefully on nonexistent spreadsheets", function(done) {
		GoogleSpreadsheets({
			key: "BACON"
		}, function(err) {
			err.message.should.equal("HTTP error 400: Bad Request");
			done();
		});
	});
	it("fails gracefully on unpublished spreadsheets", function(done) {
		GoogleSpreadsheets({
			key: "1Y9_ldGHQt6SWXsu18BlAWQKYu_axFfowlqhJ97SxEHQ"
		}, function(err) {
			err.message.should.equal("No access to that spreadsheet, check your auth.");
			done();
		});
	});
	if (process.env.PRIVATE_SPREADSHEET_KEY) {
		it("uses googleapis@2 auth correctly", function(done) {
			var auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
			auth.setCredentials({
				refresh_token: process.env.GOOGLE_REFRESH_TOKEN
			});

			GoogleSpreadsheets({
				key: process.env.PRIVATE_SPREADSHEET_KEY,
				auth: auth
			}, function(err, spreadsheet) {
				if(err) return done(err);
				spreadsheet.title.should.equal("Private Spreadsheet");
				done();
			});
		});
	}
});
