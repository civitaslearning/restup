var should = require('chai').should(),
	api    = require('../index'),
	util   = require('util');

var rows = function (id, cb) {
	if (id) {
		return cb(null, ['one row with id ' + id]);
	}
	return cb(null, ['row a', 'row b']);
};

api
.resource('interventions')
	.get(rows)
	/*
	.post(_(rows).partial('post - interventions'))
	.resource('recipients')
		.get(_(rows).partial('get - recipients'))
	.end()
	.put(_(rows).partial('put - interventions'))
.end()
.resource('users')
	.get(_(rows).partial('get - users'))
	*/
.end()
	
;

console.log(util.inspect(api.context[0].resources, { showHidden: false, depth: null }));
api.context[0].resources.interventions.get().rows(function (err, rows) {
	if (err) {
		console.error(err);
	}
	else {
		console.log(rows);
	}
});
api.context[0].resources.interventions.get(12).json(function (err, str) { console.log(str); });
//api.context[0].resources.interventions.get(12).rows(); .json(); .stream(); .jsonStream(); .route();
