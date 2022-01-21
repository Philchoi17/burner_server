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
		/**
		 * saves references on initial save of resume
		 * @param {Array} references array of objects
		 * @return {Array} array of reference objects
		 */
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
					// throw new MoleculerClientError('something went wrong ...', error)
					return error
				}
			},
		},
		/**
		 * get single reference to be used when getting resume of user
		 * @param {String} id object id of document
		 * @return {Object} reference doc
		 */
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
					return error
					// throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		deleteReferences: {
			params: {
				userId: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { userId } = ctx.params
					const handleDelete = await this.referencesDeleteHandler(userId)
					return handleDelete
				} catch (error) {
					logger.err('deleteReference: error =', error)
					return error
				}
			},
		},
		addReference: {
			params: {
				reference: { type: 'object', required: true },
			},
			async handler(ctx) {
				try {
					const { reference } = ctx.params
					const now = new Date()
					logger.debug('reference =', reference)
					const insert = await this.adapter.insert({
						...reference,
						createdAt: now,
						updatedAt: now,
					})
					return insert
				} catch (error) {
					logger.err('addReference: error =', error)
					return false
				}
			},
		},
		removeReference: {
			params: {
				id: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { id } = ctx.params
					const removeById = await this.adapter.removeById(id)
					return removeById
				} catch (error) {
					logger.err('removeReference: error =', error)
					return false
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
		async referencesDeleteHandler(userId) {
			try {
				const removeMany = await this.adapter.removeMany({ userId })
				return removeMany
			} catch (error) {
				logger.err('referenceDeleteHandler: error =', error)
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
