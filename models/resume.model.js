const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
	_id: String,
	userId: String,
	coverLetter: String,
	workHistory: Array,
	references: Array,
	createdAt: Date,
	updatedAt: Date,
})

module.exports = resumeSchema
