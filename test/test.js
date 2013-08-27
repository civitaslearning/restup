var should  = require('chai').should(),
	restUp  = require('../index'),
	chai    = require('chai'),
	METHODS = require('../lib/utils').METHODS,
	util    = require('util'),
	Q       = require('q'),
	_       = require('underscore')
;

//chai.Assertion.includeStack = true; // defaults to false

describe('definition', function () {
	describe('chaining', function () {
		it('should handle nested resources', function () {
			var nest = restUp().resource('nest');
			nest.resource('nest_two').end().should.equal(nest);
			var api = nest.end();
			should.exist(api);
		});

		it('should return the same resource when an action is added to the chain', function () {
			result = restUp();

			var noop = function () {};
			METHODS.forEach(function (method) {
				var newResult = result[method](noop);
				newResult.should.equal(result);
				result = newResult;
			});
		});
	});
});

describe('the api', function () {
	var noop = function () {};
	var echo = function () {
		var args = Array.prototype.slice.call(arguments);
		var cb = args.pop();
		cb(null, args);
	};
	var api = restUp()
		.resource('A')
			.get(_.partial(echo, 'A.get'))
			.resource('B')
				.get(_.partial(echo, 'B.get'))
			.end()
		.end()
	.end();

	var RU = restUp();
	var resourceA = RU.resource('A');
	METHODS.forEach(function (method) {
		resourceA[method](_.partial(echo, ['A', method].join('.')));
	});
	var resourceB = resourceA.resource('B');
	METHODS.forEach(function (method) {
		resourceB[method](_.partial(echo, ['B', method].join('.')));
	});
	resourceB.end();
	resourceA.end();
	var api2 = RU.end();


	it('should chain resources', function () {
		api().should.respondTo("A");
		api().A().should.respondTo("B");
	});

	it('should chain actions', function () {
		METHODS.forEach(function (method) {
			api2().A().should.respondTo(method);
		});

		METHODS.forEach(function (method) {
			api2().A().B().should.respondTo(method);
		});
	});

	it('should return promises from actions', function () {
		METHODS.forEach(function (method) {
			api2().A().should.respondTo(method);
			api2().A()[method]().should.satisfy(function (promise) { return Q.isPromise(promise); });
		});
	});

	it('should properly curry arguments through the nested resources', function (done) {
		Q.all([
			api().A().get(),
			api().A(1).get(),
			api().A(1).B().get(),
			api().A(1).B(2).get(),
			api({ api: 3 }).A(1).B(2).get()
		]).spread(function (test1, test2, test3, test4, test5) {
			test1.should.deep.equal(['A.get', {} ]);
			test2.should.deep.equal(['A.get', { 'A': 1 }]);
			test3.should.deep.equal(['B.get', { 'A': 1 }]);
			test4.should.deep.equal(['B.get', { 'A': 1, 'B': 2 }]);
			test5.should.deep.equal(['B.get', { 'A': 1, 'B': 2, 'api': 3 }]);
			done();
		}, function (err) {
			should.not.exist(err);
			done();
		});
	});

	it('should allow users to define custom methods');
});
