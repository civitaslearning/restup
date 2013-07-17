var _ = require('underscore');

var Action = function (resource, fn, args, object) {
	this.resource = resource;
	if (object) {
		this.fn = _.partial(fn, object, args);
	}
	else { // POST or PUT requires an object to be passed along
		this.fn = _.partial(fn, args);
	}

	// wire together delegation to sub-resources
	var self = this;
	_.each(resource.resources, function (subResource) {
		self[subResource.name] = subResource.delegate(args);
	});
};

Action.prototype.data = function (cb) {
	this.fn(cb);
};

Action.prototype.json = function (cb) {
	this.data(function (err, data) {
		if (err) {
			return cb(null, JSON.stringify({
				error: true,
				message: err
			}));
		}
		return cb(null, JSON.stringify({
			error: false,
			data: data
		}));
	});
};

Action.prototype.route = function () {
	var self = this;
	return function (req, res, next) {
		self.json(function (err, str) {
			if (err) {
				return next(err);
			}
			res.type('application/json');
			res.send(str);
		});
	};
};

module.exports = Action;
