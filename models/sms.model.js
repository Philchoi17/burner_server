const smsModel = [
	"_id", // primary
	"text", // string
	"type", // string
	"to", // string [ phone no. ]
	"code", // verification code
	"createdAt", // dateTime
	"updatedAt", // dateTime
];

module.exports = smsModel;
