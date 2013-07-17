var _ = require('underscore'),
	Action = require('./action'),
	METHODS = require('./utils').METHODS
;

var Resource = function (name) {
	this.name = name;
	this.resources = {};
	this.handlers = {};
};

var buildResourceMethodHandler = function (method) {
	return function () {
		var args = Array.prototype.slice.call(arguments);

		if (! _.has(this.handlers, method)) {
			throw new Error('No handler defined for resource: ' + this.name + ', method: ' + method );
		}
		var handler = this.handlers[method];

		var obj = null;
		if (method === 'post' || method === 'put') {
			obj = args.shift();
		}

		var id = args.shift();

		// create params to the handler that maps resource => id
		var params = {};
		if (!_.isUndefined(id)) {
			if (!_.isObject(id)) {
				params[this.name] = id;
			}
			else {
				_.extend(params, id);
			}
		}

		var action = new Action(this, handler, params, obj);
		return action;
	};
};

_.each(METHODS, function (method) {
	Resource.prototype[method] = buildResourceMethodHandler(method);
});

Resource.prototype.addSubResource = function (subResource) {
	this.resources[subResource.name] = subResource;
};

/*
 * Creates a clone of this resource that passes along the params from the parent
 * resource
 */
Resource.prototype.delegate = function (args) {
	var self = this;
	var delegate = new Resource();
	_.extend(delegate, self);
	_.each(METHODS, function (method) {
		delegate[method] = _.wrap(delegate[method], function (inner, id) {
			var params = _.extend({}, args);
			params[delegate.name] = id;
			return inner.call(this, params);
		});
	});
	return delegate;
};

module.exports = Resource;
