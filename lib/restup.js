/*
 * restup
 * Copyright (c) 2013 Civitas Learning Inc
 * MIT Licensed
 */

var _       = require('underscore'),
    METHODS = require('./utils').METHODS,
    Q       = require('q')
;

var RestUp = function (options, parent) {
	options = options || {};
	_.defaults(options, {
		custom_methods: []
	});

	var self = {
		resource_name: null,
		resource: function (name) {
			var resource = RestUp(options, self);
			resource.resource_name = name;
			return resource;
		},
		end: function () {
			var resource = function () {
				// Combine all arguments into a single object with
				// the resource name as the key, and the id as the
				// value
				var args = Array.prototype.slice.call(arguments);

				var combinedArgs = _.reduce(args, function (memo, arg) {
					if (!_.isObject(arg)) {
						memo[self.resource_name] = arg;
					}
					else {
						_.extend(memo, arg);
					}
					return memo;
				}, {});
				
				var api = _.clone(self.api);
				_.each(api, function (value, key) {
					api[key] = _.partial(value, combinedArgs);
				});

				return api;
			};


			if (parent) {
				parent.api[self.resource_name] = resource;
				return parent;
			}
			return resource;
		},
		api: {}
	};

	// denodeify core methods and custom methods
	_.each(_.compact(_.union(METHODS, options.custom_methods)), function (method) {
		self[method] = function (handler) {
			self.api[method] = Q.denodeify(handler);
			return self;
		};
	});

	return self;
};

module.exports = RestUp;
