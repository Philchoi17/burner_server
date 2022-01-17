'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const referenceSchema = require('../models/reference.model')
const logger = require('../logger')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'references',
	/**
	 * mixins
	 */
	mixins: [DbMixin('references')],
	/**
	 * Settings
	 */

	settings: {
		idField: '_id',
		fields: referenceSchema,
	},
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		saveReferences: {
			params: {
				references: { type: 'array', required: true },
			},
			async handler(ctx) {
				try {
					const { userId, references } = ctx.params
					const insertMany = await this.referencesInsertMany(userId, references)
					if (insertMany) return insertMany
					else throw new MoleculerClientError()
				} catch (error) {
					logger.err('saveReferences: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		getReference: {
			params: {
				id: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const getOne = await this.adapter.findById(ctx.params.id)
					return getOne
				} catch (error) {
					logger.err('getReferences: error =', error)
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
		// userId: String
		// contactName: String,
		// contactPhoneNo: String,
		// contactEmail: String,
		// createdAt: Date,
		// updatedAt: Date,
		async referencesInsertMany(userId, referenceArr) {
			try {
				const now = new Date()
				const insertMany = await this.adapter.insertMany(
					referenceArr.map((reference) => {
						return {
							userId,
							...reference,
							createdAt: now,
							updatedAt: now,
						}
					}),
				)
				return insertMany.map((reference) => reference._id)
			} catch (error) {
				logger.err('referencesInsertMany: error =', error)
				return false
			}
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
