var _ = require('underscore'),
	Action = require('./action'),
	Resource = require('./resource'),
	METHODS = require('./utils').METHODS
;

var Link = function () {
	this.context = [new Resource('root')];
};

Link.prototype.resource = function (resourceName) {
	var currentResource = new Resource(resourceName, this.context[this.context.length - 1]);
	this.context[this.context.length - 1].resources[resourceName] = currentResource;
	this.context.push(currentResource);
	return this;
};

Link.prototype.end = function () {
	this.context.pop();
	return this;
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

module.exports = new Link();
