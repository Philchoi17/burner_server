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
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * sets reservation
		 * @param {String} companyId
		 * @param {String} date a string with dash date format
		 * @param {Number} timeSlot time in military time i.e. 1400
		 * @param {Number} slotLength number in hours
		 * @return {Object} resertvation doc
		 */
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
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		/**
		 * updates reservation document
		 * @param {String} reservationId
		 * @param {Object} update key value pair for update wanted
		 * @return {Object} returns updated reservation doc
		 */
		updateReservation: {
			rest: 'POST /update-reservation',
			params: {
				reservationId: { type: 'string', required: true },
				update: { type: 'object', required: true },
			},
			async handler(ctx) {
				try {
					const { reservationId, update } = ctx.params
					const reservation = await this.adapter.findById(reservationId)
					if (!reservation) throw new MoleculerClientError()
					// const reservationUpdate = await this.reservationUpdateHandler()
					const resUpdate = {
						$set: {
							...update,
							updatedAt: new Date(),
						},
					}
					const updated = await this.adapter.updateById(
						reservation._id,
						resUpdate,
					)
					logger.debug('updated =', updated)
					return updated
				} catch (error) {
					logger.err('updateReservation: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		/**
		 * get reservations of company
		 * @param {String} companyId string of company id
		 * @return {Array} array of reservation objects
		 */
		getReservations: {
			rest: 'GET /get-reservations',
			params: {
				companyId: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { companyId } = ctx.params
					const reservations = await this.adapter.find({ companyId })
					const now = new Date()
					return await reservations.filter(
						(reservation) => new Date(reservation.date) > now,
					)
					// const reservation = await this.adapter.findById(ctx.params.id)
					// return reservation
				} catch (error) {
					logger.err('getReservation: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		/**
		 * delete reservation
		 * @param {String} id reservation id
		 *
		 *
		 */
		deleteReservation: {
			rest: 'POST /delete-reservation',
			params: {
				id: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { id } = ctx.params
					const reservation = await this.adapter.findById(id)
					if (!reservation) throw new MoleculerClientError()
					const remove = await this.adapter.removeById(reservation._id)
					// logger.debug('remove =', remove)
					return remove
				} catch (error) {
					logger.err('deleteReservation: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
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
					updatedAt: now,
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
