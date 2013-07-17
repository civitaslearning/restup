var _ = require('underscore');

var DB = function () {
	this.interventions = [];
};

DB.prototype.clear = function (cb) {
	this.interventions = [];
	cb(null);
};

// check if the index exists in the array (this)
var exists = function (id) {
	return (id < this.length);
};

var find = function (resource, ids, callback) {
	// return the resource by id (the array index)
	if (_.has(ids, resource)) {
		if (!exists.call(this, ids[resource])) {
			return callback(new Error('Not Found'));
		}
		var retval = _.compact(this.slice(ids[resource], ids[resource] + 1));
		if (retval.length) {
			return callback(null, retval);
		}
		// in the case that only nulls are returned...
		return callback(new Error('Not Found'));
	}
	// else return all
	return callback(null, this);
};

DB.prototype.getIntervention = function (ids, callback) {
	find.call(this.interventions, 'interventions', ids, callback);
};

DB.prototype.getRecipient = function (ids, callback) {
	var self = this;
	this.getIntervention(ids, function (err, rows) {
		if (err) {
			return callback(err);
		}
		find.call(rows[0].recipients, 'recipients', ids, callback);
	});
};

DB.prototype.createIntervention = function (intervention, ids, callback) {
	this.interventions.push(intervention);
	callback(null, this.interventions.length - 1);
};

DB.prototype.createRecipient = function (recipient, ids, callback) {
	this.getIntervention(ids, function (err, rows) {
		if (err) {
			return callback(err);
		}
		rows[0].recipients.push(recipient);
		callback(null, rows[0].recipients.length - 1);
	});
};

DB.prototype.updateIntervention = function (intervention, ids, callback) {
	if (!_.has(ids, 'interventions')) {
		return callback(new Error('ID required'));
	}
	if (!exists.call(this.interventions, ids.interventions)) {
		return callback(new Error('Not Found'));
	}
	this.interventions[ids.interventions] = intervention;
	callback(null, intervention);
};

DB.prototype.deleteIntervention = function (ids, callback) {
	if (!_.has(ids, 'interventions')) {
		return callback(new Error('ID required'));
	}
	if (!exists.call(this.interventions, ids.interventions)) {
		return callback(new Error('Not Found'));
	}
	delete this.interventions[ids.interventions];
	callback(null);
};


module.exports = DB;
