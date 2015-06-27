"use strict";

var assert = require("assert");
var GoogleSpreadsheets = require("../lib/spreadsheets");
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
			err.message.should.equal("Cannot read property \'title\' of undefined");
			done();
		});
	});
});
