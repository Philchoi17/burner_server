'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const reservationSchema = require('../models/reservation.model')
const logger = require('../logger')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'reservation',
	/**
	 * mixins
	 */
	mixins: [DbMixin('reservation')],

	/**
	 * Settings
	 */
	//  companyId: String,
	//  date: Date,
	//  timeSlot: String,
	//  slotLength: Number,
	settings: {
		idField: '_id',
		fields: reservationSchema,
	},
	// deletes message after 300 seconds
	// async afterConnected() {
	// 	try {
	// 		await this.adapter.db.createIndex(
	// 			'sms',
	// 			{ createdAt: 1 },
	// 			{ expireAfterSeconds: 300 },
	// 		)
	// 	} catch (error) {
	// 		console.error(error)
	// 	}
	// },
	/**
	 * Model
	 */
	// model: UserModel,

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		setReservation: {
			rest: 'POST /set-reservation',
			params: {
				companyId: { type: 'string', required: true },
				date: { type: 'string', required: true },
				timeSlot: { type: 'number', required: true },
				slotLength: { type: 'number', required: true },
			},
			async handler(ctx) {
				try {
					const { companyId, date, timeSlot, slotLength } = ctx.params
					const handler = await this.reservationHandler(ctx.params)
					if (!handler) throw new MoleculerClientError()
					return handler
				} catch (error) {
					logger.err('setReservation: error =', error)
					throw new MoleculerClientError('something went wrong ...')
				}
			},
		},
		updateReservation: {
			rest: 'POST /update-reservation',
			params: {
				companyId: { type: 'string', required: true },
				update: { type: 'object', required: true },
			},
			async handler(ctx) {
				try {
					const { companyId, update } = ctx.params
					const reservation = await this.adapter.findOne({ companyId })
					if (!reservation) throw new MoleculerClientError()
					// const reservationUpdate = await this.reservationUpdateHandler()
					const resUpdate = {
						$set: update,
					}
					const updated = await this.adapter.updateById(
						reservation._id,
						resUpdate,
					)
					logger.debug('updated =', updated)
					return updated
				} catch (error) {
					logger.err('updateReservation: error =', error)
					throw new MoleculerClientError('something went wrong ...')
				}
			},
		},
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		async reservationHandler(reservationPayload) {
			const { companyId, date, timeSlot, slotLength } = reservationPayload
			const reservation = await this.adapter.findOne({
				companyId,
				timeSlot,
				date,
			})
			// logger.debug('reservation =', reservation)
			if (!reservation) {
				const now = new Date()
				const insert = await this.adapter.insert({
					companyId,
					timeSlot,
					date,
					slotLength,
					createdAt: now,
					updateAt: now,
				})
				return insert
			}
			return false
		},
		reservationUpdateHandler() {
			return true
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
}
