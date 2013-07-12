var _ = require('underscore'),
	Action = require('./action'),
	METHODS = require('./utils').METHODS
;

var Resource = function (name, parent) {
	this.name = name;
	this.resources = {};
	this.handlers = {};
	this.parent = parent;
};

var buildResourceMethodHandler = function (method) {
	var self = this;
	return function (id) {
		if (! _.has(this.handlers, method)) {
			throw new Error('No handler defined for resource: ' + this.name + ', method: ' + method );
		}
		var handler = this.handlers[method];
		var action = new Action(self, handler, id);
		return action;
	};
};

_.each(METHODS, function (method) {
	Resource.prototype[method] = buildResourceMethodHandler(method);
});


module.exports = Resource;
