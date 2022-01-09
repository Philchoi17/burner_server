const userModel = [
	"_id", // primary
	"email", // string
	"password", // string ( sha256 )
	"name", // string
	"role", // number [ 0 - client, 1 - admin, 2 - superAdmin, 4 - owner]
	"hasBeenDeleted", // boolean [ deleted user - true default false]
	"createdAt", // dateTime
	"updatedAt", // dateTime
	"deleteCode", // string
];

module.exports = userModel;
