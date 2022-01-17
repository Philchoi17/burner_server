const mongoose = require('mongoose')

const workHistory = new mongoose.Schema({
	_id: String,
	userId: String,
	//_content: Object,
	companyName: String,
	startedWork: Date,
	finishedWork: Date,
	description: String,
	createdAt: Date,
	updatedAt: Date,
})

module.exports = workHistory
