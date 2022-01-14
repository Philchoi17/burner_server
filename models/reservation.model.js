const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema({
	_id: String,
	companyId: String,
	date: Date,
	timeSlot: String,
	slotLength: Number,
	createdAt: Date,
	updatedAt: Date,
})

module.exports = reservationSchema
