'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const workHistorySchema = require('../models/workHistory.model')

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
					this.logger.info('**workHistory** =', workHistory)
					const insertMany = await this.workHistoryInsertMany(
						userId,
						workHistory,
					)
					return insertMany
				} catch (error) {
					this.logger.error('saveWorkHistories: error =', error)
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
					// this.logger.info('getOne =', getOne)
					return getOne
				} catch (error) {
					this.logger.error('getWorkHistory: error =', error)
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
					this.logger.error('deleteAllWorkHistory: error =', error)
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
				this.logger.info(
					'workHistoryInsertMany: workHistoryArr =',
					workHistoryArr,
				)
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
				this.logger.error('workHistoryInsertMany: error =', error)
				return false
			}
		},
		async userWorkHistoryDeleteHandler(userId) {
			try {
				const removeMany = await this.adapter.removeMany({ userId })
				return removeMany
			} catch (error) {
				this.logger.error('userWorkHistoryDeleteHandler: error =', error)
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
