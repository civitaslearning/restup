var _ = require('underscore');

var Action = function (resource, fn, args) {
	this.resource = resource;
	this.fn = _.partial(fn, args);
};

Action.prototype.rows = function (cb) {
	this.fn(cb);
};

Action.prototype.json = function (cb) {
	this.rows(function (err, rows) {
		if (err) {
			return cb(null, JSON.stringify({
				error: true,
				message: err
			}));
		}
		return cb(null, JSON.stringify({
			error: false,
			rows: rows
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
