var should  = require('chai').should(),
	restUp  = require('../index'),
	chai    = require('chai'),
	DB      = require('./db'),
	express = require('express'),
	request = require('supertest')
;

//chai.Assertion.includeStack = true; // defaults to false

describe('actions', function() {
	var db = new DB();

	beforeEach(function (done) {
		db.clear(function () {
			db.createIntervention({ name: 'one', recipients: ['zoop'] }, {}, done);
		});
	});

	describe("GET", function () {
		it('should return an object via GET', function (done) {
			var api = restUp()
				.resource('interventions')
				.get(db.getIntervention.bind(db))
				.end()
				.api();


			api.interventions.get(0).data(function (err, data) {
				should.not.exist(err);
				should.exist(data);
				data.should.deep.equal([ { name: 'one', recipients: ['zoop'] } ]);
				done();
			});
		});

		it('should return all rows if no id is provided', function (done) {
			var api = restUp()
				.resource('interventions')
				.get(db.getIntervention.bind(db))
				.end()
				.api();


			api.interventions.get().data(function (err, data) {
				should.not.exist(err);
				should.exist(data);
				data.should.deep.equal([ { name: 'one', recipients: ['zoop'] } ]);
				done();
			});

		});
	});

	describe("POST", function () {
		it('should create a new object by POST', function (done) {
			var api = restUp()
				.resource('interventions')
				.post(db.createIntervention.bind(db))
				.end()
				.api();

			var intervention = { name: 'two', recipients: [] };
			api.interventions.post(intervention).data(function (err, id) {
				should.not.exist(err);
				should.exist(id);
				id.should.equal(1);

				db.getIntervention({ interventions: id }, function (err, obj) {
					should.not.exist(err);
					obj.should.deep.equal([intervention]);
				});
				done();
			});
		});
	});

	describe("PUT", function () {
		it('should update an object by PUT', function (done) {
			var api = restUp()
				.resource('interventions')
				.put(db.updateIntervention.bind(db))
				.end()
				.api();

			var intervention = { name: 'prime', recipients: ['zoopzoop'] };

			api.interventions.put(intervention, 0).data(function (err, obj) {
				should.not.exist(err);
				should.exist(obj);

				db.getIntervention({ interventions: 0 }, function (err, obj) {
					should.not.exist(err);
					obj.should.deep.equal([intervention]);
					done();
				});

			});

		});
	});

	describe("DELETE", function () {
		it('should delete an object by DELETE', function (done) {
			var api = restUp()
				.resource('interventions')
				.delete(db.deleteIntervention.bind(db))
				.end()
				.api();

			api.interventions.delete(0).data(function (err) {
				should.not.exist(err);

				db.getIntervention({ interventions: 0 }, function (err) {
					should.exist(err);
					err.should.have.property('message').and.equal('Not Found');
					done();
				});
			});
		});
	});

	describe.skip("query", function () {
		it('should query an object', function (done) {
			var api = restUp()
				.resource('interventions')
				.query(db.queryIntervention.bind(db))
				.end()
				.api();

			api.interventions.query({ name: 'one' }).data(function (err, data) {
				should.not.exist(err);
				should.exist(data);
				data.should.deep.equal([ { name: 'one', recipients: ['zoop'] } ]);

				done();
			});
		});
	});
});

describe("global data", function () {
	describe("object", function () {
		it('should curry the object all the way down to the action handler', function (done) {
			var api = restUp()
				.resource('intervention')
				.get(function (ids, cb) {
					ids.should.have.property('as');
					ids.as.should.equal('user@site.com');
				})
				.end()
				.api();

			api({ as: 'user@site.com' }).interventions.get(0).data(done);
		});
	});
});

describe("formatters", function () {
	var db = new DB();

	var api = restUp()
		.resource('interventions')
		.get(db.getIntervention.bind(db))
		.end()
		.resource('bust')
		.get(function (ids, cb) { cb(new Error('BUST!')); })
		.api();

	before(function (done) {
		db.createIntervention({ name: 'one', recipients: ['zoop'] }, {}, done);
	});

	describe("json", function () {
		it('should return a JSON string', function (done) {
			api.interventions.get(0).json(function (err, str) {
				var fn = function () {
					JSON.parse(str);
				};
				fn.should.not.throw(SyntaxError);
				done();
			});
		});

		it('should contain an error and data property', function (done) {
			api.interventions.get(0).json(function (err, str) {
				var obj = {};
				var fn = function () {
					obj = JSON.parse(str);
				};
				fn.should.not.throw(SyntaxError);
				obj.should.have.property('error');
				obj.should.have.property('data');
				obj.error.should.equal(false);
				obj.data.should.deep.equal([{ name: 'one', recipients: ['zoop']}]);
				done();
			});
		});
	});

	describe("route", function () {
		it('should return an express route');

		it('should accept POST/PUT JSON data');

		it('should respond with a JSON response');

		it('should forward errors to the express error handler (... should it?)');

	});

	describe("data", function () {
		it('should call a callback and provide an error and data object', function (done) {
			api.interventions.get(0).data(function (err, data) {
				should.not.exist(err);
				should.exist(data);

				api.bust.get().data(function (err, data) {
					should.exist(err);
					done();
				});
			});
			
		});
	});

	describe("stream", function () {
		it('should return a readable stream... but with objects (event-stream?)... or just skip this and do jsonstream');
	});

});

describe("nested resources", function () {
	var db = new DB();

	beforeEach(function (done) {
		db.clear(function () {
			db.createIntervention({ name: 'one', recipients: ['zoop'] }, {}, done);
		});
	});

	describe("definition", function () {
		it('should signal completion of a sub-resource via the `end` function', function (done) {
			var api = restUp()
				.resource('interventions')
				.get(db.getIntervention.bind(db))
					.resource('recipients')
					.get(db.getRecipient.bind(db))
					.end()
				.post(db.createIntervention.bind(db))
				.end()
				.api();

			api.interventions.get(0).recipients.get(0).data(function (err, data) {
				should.not.exist(err);
				should.exist(data);
				data.should.deep.equal(['zoop']);

				// interventions/post was defined AFTER recipients.end so...
				api.interventions.should.have.property('post');
				api.interventions.post.should.be.a('function');
				done();
			});
		});

		it("should forward the parent resources' arguments down to the children", function (done) {
			var api = restUp()
				.resource('interventions')
				.get(db.getIntervention.bind(db))
					.resource('recipients')
					.get(function (ids, cb) {
						should.exist(ids);
						ids.should.deep.equal({
							interventions: 'intervention-id',
							recipients: 'recipient-id'
						});
						cb();
					})
					.end()
				.end()
				.api();

			api.interventions.get('intervention-id').recipients.get('recipient-id').data(done);
		});

		it('should only allow `get` actions on the parent resources');

		describe('nested actions', function () {
			it('should get');
			it('should post');
			it('should put');
			it('should delete');
		})
	});

});


/*
 * TODO:
 * 1. what do I return from a PUT?  The object I just sent in?  Nothing?
 * 2. what about paging.  I don't want to be required to implement paging everywhere.  Is there a way to automate that in the express routes?  what about in the query?
 *       answer: api.students.query({ foo: 'bar' }, { limit: 10, offset: 20 }) // query stringish stuff goes in 2nd arg?
 *               api.students.get(null, { limit: 10, offset: 20 })
 *       answer: api.students.get().page({ limit: 10, offset: 20 }).data()
 *       answer: api({ limit: 10, offset: 20 }).students.get() // see question 6, beloew
 *
 * 3. Do i want to require action methods to produce 'row'/'done' events like pg? (maybe just get?) (what about elastic?)
 *    pg -> row, error, end
 *    elastic -> data, error, done
 *    streams -> data, end
 *    use "through" to handle buffering
 *    use jsonstream to write
 *    create YET ANOTHER MODULE pgstream, elasticstream?
 *    maybe get() should return a stream, period.  Dunno what to do about put,post,delete... doesn't make sense
 *
 * 4. allow for custom actions? "query" and the like can be implemented this way
 *       answer: restUp({
 *                   custom_actions: {
 *                       query: function (ids) {
 *                           ...
 *                           var action = new Action(...);
 *                           return action;
 *                       }
 *                   }
 *       answer: no it's too complex
 *
 * 5. What about PKs that are >1 column: enrollment = student_id, section_id
 *       answer: allow get({ student_id: '1234', section_id: '2345' })
 *       answer: create surrogate key
 *
 * 6. how do i pass creds/cookies around like the user?  also RBAC 
 *       answer: api({ as: 'devteam@civitaslearning.com' }).interventions.get('').... // mixin arbitrary stuff
 *       answer: api.session({ user: userObj }).interventions.get('')                 // use "session" concept, may extend to express routes
 *
 * 7. somehow i would need to use scrubbed ids for the external api vs source ids for the internal
 *       answer: api.students_hashed.get('342ea3c235b043') // create a different resource
 *       answer: don't ever use source ids
 *
 * 8. should the actions return a promise instead of accept a callback?
 *       answer: api.blah.get().json().then(function () {})
 *               Q.all([api.blah.get().json(), api.bloo.get().json()]).then(function (blahJson, blooJson) {})
 *               Let's do it

api.interventions.get(1).json(function (err, str) { console.log(str); });
api.interventions.get(1).recipients.get(0).json(function (err, str) { console.log(str); });
// TODO: rows:5?  it needs to return the id, not the rows, yeah?
api.interventions.post({ name: 'test put', recipients: [] }).json(function (err, id) { if (err) { return console.log("error: " + err); } console.log("created: " + id); });
api.users.get(email).courses.post({ subject: foo, catalog_nbr: bar }).data(...)


should I change the api to:

api().interventions(1).get.json()
api().interventions().post({}).json()
api().interventions().search({}).json()
api().interventions(1).courses(0).get().json()

so the resource function mixes in ids:
    api().interventions(1).courses(0).get().json()
          ^^^^^^^^^^^^^^^^
          returns { interventions: 1 }
    api().interventions(1).courses(0).get().json()
                           ^^^^^^^^^^
                           returns: { interventions: 1, courses: 0 }
which gets passed into the action (get/post/put/delete/search)
Also, api()'s 1st param gets mixed-in too so you can do things like:

    api({ user: 'devteam@civitaslearning.com' }).interventions(1).courses(0).get()

Don't abuse this because "user" would become a required parameter which would not be well documented.


api().interventions().get({limit: 10, offset: 20}).json() // get args are query string
api().interventions().search({foo: 'bar', limit: 10, offset: 20}).json() // search args are POST body
api().interventions().post({name: 'joe', recipients: []}).json() // post args are POST body

So what are some realistic endpoints?

api().user('devteam@civitaslearning.com').enrollments().search({
	term: '1136',
	subject: 'AMBA',
	catalog_nbr: '610',
	session: 'OL1',
	section: '4213',
	group: 'PILOT-1',
	level: 'graduate',
	limit: 10,
	offset: 20
}).json(function (err, json) {
	res.json(json);
});

api().user('devteam@civitaslearning.com').student('5534de32c43a1').data(function (err, rows) {
	// why include the user in the path?  We only want the logged-in user to see their own students.
	// maybe we can handle RBAC in another way.
	// this is the biggest open question left, IMO
});

It seems more logical this way
*/
