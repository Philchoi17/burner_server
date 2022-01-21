'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const workHistorySchema = require('../models/workHistory.model')
const logger = require('../logger')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'workHistory',
	/**
	 * mixins
	 */
	mixins: [DbMixin('workHistory')],
	/**
	 * Settings
	 */

	settings: {
		idField: '_id',
		fields: workHistorySchema,
	},
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		saveWorkHistory: {
			params: {
				userId: { type: 'string', required: true },
				workHistory: { type: 'object', required: true },
			},
			async handler(ctx) {
				return true
			},
		},
		saveWorkHistories: {
			params: {
				userId: { type: 'string', required: true },
				workHistory: { type: 'array', required: true },
			},
			async handler(ctx) {
				try {
					const { userId, workHistory } = ctx.params
					logger.debug('**workHistory** =', workHistory)
					const insertMany = await this.workHistoryInsertMany(
						userId,
						workHistory,
					)
					return insertMany
				} catch (error) {
					logger.err('saveWorkHistories: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		getWorkHistory: {
			params: {
				id: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const getOne = await this.adapter.findById(ctx.params.id)
					// logger.debug('getOne =', getOne)
					return getOne
				} catch (error) {
					logger.err('getWorkHistory: error =', error)
					return false
				}
			},
		},
		deleteUserWorkHistory: {
			params: {
				userId: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { userId } = ctx.params
					const handleDelete = await this.userWorkHistoryDeleteHandler(userId)
					return handleDelete
				} catch (error) {
					logger.err('deleteAllWorkHistory: error =', error)
					return error
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
		async workHistoryInsertMany(userId, workHistoryArr) {
			try {
				logger.debug('workHistoryInsertMany: workHistoryArr =', workHistoryArr)
				const now = new Date()
				const insertMany = await this.adapter.insertMany(
					workHistoryArr.map((workHistory) => {
						return {
							userId,
							...workHistory,
							startedWork: new Date(workHistory.startedWork),
							finishedWork: new Date(workHistory.finishedWork),
							createdAt: now,
							updatedAt: now,
						}
					}),
				)
				const docIds = await insertMany.map((item) => item._id)
				return docIds
			} catch (error) {
				logger.err('workHistoryInsertMany: error =', error)
				return false
			}
		},
		async userWorkHistoryDeleteHandler(userId) {
			try {
				const removeMany = await this.adapter.removeMany({ userId })
				return removeMany
			} catch (error) {
				logger.err('userWorkHistoryDeleteHandler: error =', error)
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
