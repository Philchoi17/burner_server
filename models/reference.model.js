const mongoose = require('mongoose')

const referenceSchema = new mongoose.Schema({
	_id: String,
	userId: String,
	// _content: Object,
	contactName: String,
	contactPhoneNo: String,
	contactEmail: String,
	createdAt: Date,
	updatedAt: Date,
})

module.exports = referenceSchema
