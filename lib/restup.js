var _ = require('underscore'),
	Action = require('./action'),
	Resource = require('./resource'),
	METHODS = require('./utils').METHODS
;

var Link = function () {
	this.context = [new Resource('root')];
};

Link.prototype.resource = function (resourceName) {
	var prevResource = this.context[this.context.length - 1];
	var currentResource = new Resource(resourceName);

	prevResource.addSubResource(currentResource);
	this.context.push(currentResource);

	return this;
};

Link.prototype.end = function () {
	this.context.pop();
	return this;
};

Link.prototype.api = function () {
	return this.context[0].resources;
};

var buildMethodHandler = function (method) {
	return function (fn) {
		if (this.context.length === 0) {
			throw new Error('Define a resource first');
		}
		else {
			var currentResource = this.context[this.context.length - 1];
			currentResource.handlers[method] = fn;
		}

		return this;
	};
};

_.each(METHODS, function (method) {
	Link.prototype[method] = buildMethodHandler(method);
});

module.exports = function () {
	return new Link();
};
