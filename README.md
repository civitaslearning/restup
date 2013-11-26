restup
======

[![Build Status](https://travis-ci.org/civitaslearning/restup.png)](https://travis-ci.org/civitaslearning/restup)

An opinionated node module for building REST APIs

This module doesn't build a REST API for HTTP, but rather a Javascript API that
conforms to REST standards (more-or-less) that you can, perhaps, use to
implement an HTTP API.

## API

Let's follow the following standards:

Each resource must be defined by the following actions:

* `GET    /users`                    - retrieves a list of users
* `GET    /users/4152` - retrieves a specific user
* `POST   /users`                    - creates a new user
* `PUT    /users/4152` - updates user: 4152
* `PATCH  /users/4152` - partially updates user: 4152
* `DELETE /users/4152` - deletes user: 4152

Using the Javascript restup-based api, you would execute:

* `api().users().get()` - retrieves a list of users
* `api().users('4152').get()` - retrieves a specific user
* `api().users().post(userObj)` - creates a new user
* `api().users('4152').put(userObj)` - updates user 4152
* `api().users('4152').patch(userObj)` - partially updates user 4152
* `api().users('4152').delete()` - deletes user 4152

### Expressing relationships

Sometimes resources might be entirely contained by another resource.  If it
makes sense that a resource belongs to another resource, and will never be
referenced independently, then make the path like so:

* `/users/4152/courses` - retrieves a list of courses for user 4152
* `/users/4152/courses/MATH_101` - retrieves MATH 101 course for user 4152

Using the javascript api:

* `api().users('4152').courses({ subject: 'MATH', catalog_nbr: '101' }).get()`

If it makes sense for the relation to be accessed independently, then create it
as its own resource.  If the relation is commonly requested alongside the
resource, the API could add functionality to embed the relation to avoid a
second hit to the API.

### What about actions that don't fit into the world of CRUD operations?

This is where things can get fuzzy. There are a number of approaches:

1. Restructure the action to appear like a field of a resource. This works if
   the action doesn't take parameters. For example an activate action could be
   mapped to a boolean `activated` field and updated via a PATCH to the
   resource.

2. Treat it like a sub-resource with RESTful principles. For example, GitHub's
   API lets you star a gist with `PUT /gists/:id/star` and unstar with `DELETE
   /gists/:id/star`.

3. Sometimes you really have no way to map the action to a sensible RESTful
   structure. For example, a multi-resource search doesn't really make sense to
   be applied to a specific resource's endpoint. In this case, `/search` would
   make the most sense even though it isn't a noun. This is OK - just do what's
   right from the perspective of the API consumer and make sure it's documented
   clearly to avoid confusion.

   For this reason, we may add a new "REST extension" action called "search".

   `POST /enrollments/search` - search for enrollments based on filter criteria

   It will be a POST because often filter criteria doesn't fit within a query
   string.

## Developing a new resource

We'll use the restup module to define our REST api.  Define a resource's
actions between the `resource` and `end` functions.

### Example
```javascript
// myapi/index.js
var restUp = require('restup');
var model = require('./model');

module.exports = restUp()
	.resource('users')
		.get(model.getUser)
		.post(model.addUser)
		.put(model.updateUser)
		.delete(model.deleteUser)
		.resource('courses')
			.post(model.grantUserCourse)
			.delete(model.revokeUserCourse)
		.end()
	.end()
.end();
```

Each function takes the following args:

1. __ids__: a mapping of resource to id (GET, PUT, PATCH, DELETE only)

   ```javascript
   // api().things(1).widgets(2).get() ->
   {
     things: 1,
     widgets: 2
   }
 
   ```

2. __object__: the object to save/update (PUT, POST only)

3. __callback__: node-style callback for when the operation is done

### Example

```javascript
exports.deleteUser = function (ids, callback) {
	var pk = ids.users;
	database.del('users', pk, callback);
};

exports.getUser = function (ids, callback) {
	if (ids.hasOwnProperty('users')) {
		pk = ids.users;
		database.get('users', pk, callback);
	}
	else {
		database.getAll('users', callback);
	}
};

exports.createUser = function (userObj, callback) {
	database.create('users', userObj, callback);
};
```

## Using the API

### Example

Include your restup-based api in your project like so:

```javascript
var api = require('myapi');

```

`api` provides a chainable api for accessing project data.  The format of these chains is as follows:

```javascript
var promise = api().resourceOne(pk1).resourceTwo(pk2).resourceN(pkN).action()
```

Where _action_ is one of the REST verbs defined above, or the custom `search` verb.

This chain returns a [Q](https://github.com/kriskowal/q) promise so you can chain or parallelize api calls:

```javascript
api().things(pk).get().then(function (data) {
	// handle data
}, function (err) {
	// handle error
});

Q.all([
	api().things(12).get(),
	api().stuffs(54).get()
]).spread(thing, stuff) {
	// handle data
}, function (err) {
	// handle error
});
```

## FAQ

### What about "session" data?

What happens when we have to pass some session data along, for instance, the
logged-in user? You can pass arbitrary data via the root "api" object like so:

```javascript
api({ user: '4152' }).enrollments().search(filters)
```

### What about multi-column PKs?

You can provide an object as the pk instead of a primitive:

```javascript
// api().enrollments({ student_id: 123, section_id: 345 }) ->

getEnrollments(ids, callback) {
	db.get('enrollments', [ids.student_ids, ids.section_id], callback);
}
```

### How do I do paging?

Just like the session data, you can pass _limit_ and _offset_ along through the
"api" function.

```javascript
api({ limit: 10, offset: 20 }).enrollments().get();
```

Really, there are no limits as to what you can pass through this function, but
be judicious in using it because it's not something that is documented in the
API definition.

### TODO

1. `search` pseudo-action
2. event-based or streaming api
