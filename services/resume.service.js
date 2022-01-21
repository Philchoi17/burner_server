'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const resumeSchema = require('../models/resume.model')
const logger = require('../logger')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'resume',
	/**
	 * mixins
	 */
	mixins: [DbMixin('resume')],
	/**
	 * Settings
	 */

	settings: {
		idField: '_id',
		fields: resumeSchema,
	},
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		// _id: String,
		// userId: String,
		// coverLetter: String,
		// workHistory: Array,
		// references: Array,
		// createdAt: Date,
		// updatedAt: Date,
		setResume: {
			rest: 'POST /set-resume',
			params: {
				userId: { type: 'string', required: true },
				coverLetter: { type: 'string', optional: true },
				workHistory: { type: 'array', optional: true },
				references: { type: 'array', optional: true },
			},
			async handler(ctx) {
				try {
					const { userId, coverLetter, workHistory, references } = ctx.params
					const existing = await this.adapter.findOne({
						userId,
					})
					if (existing) throw new MoleculerClientError('existing')
					// handle work history
					// _id: String,
					// userId: String,
					// //_content: Object,
					// companyName: String,
					// startedWork: Date,
					// finishedWork: Date,
					// description: String,
					// createdAt: Date,
					// updatedAt: Date,
					let workHistoryIds = []
					if (workHistory) {
						workHistoryIds = await ctx.call('workHistory.saveWorkHistories', {
							userId,
							workHistory,
						})
					}
					// *****
					let referenceIds = []
					if (references)
						referenceIds = await ctx.call('references.saveReferences', {
							userId,
							references,
						})

					const insert = await this.handleInsertResume(
						userId,
						coverLetter,
						workHistory ? workHistoryIds : [],
						references ? referenceIds : [],
					)
					return insert
				} catch (error) {
					logger.err('setResume: error =', error)
					if (error == 'MoleculerClientError: existing') {
						throw new MoleculerClientError('resume already exists ...')
					}
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},

		updateResume: {
			rest: 'POST /update-resume',
			params: {
				id: { type: 'string', required: true },
				updateKey: { type: 'string', required: true },
				updateVal: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { id, updateKey, updateVal } = ctx.params
					const update = {
						$set: {
							[updateKey]: updateVal,
							updatedAt: new Date(),
						},
					}
					const updated = await this.adapter.updatedById(id, update)
					return updated
				} catch (error) {
					logger.err('updateResume: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		deleteResume: {
			rest: 'POST /delete-resume',
			params: {
				id: { type: 'string', optional: true },
				userId: { type: 'string', optional: true },
			},
			async handler(ctx) {
				try {
					const { id, userId } = ctx.params
					const deleteResume = await this.handleDeleteResume(id)
					const deleteWorkHistory = ctx.call(
						'workHistory.deleteUserWorkHistory',
						{
							userId,
						},
					)
					const deleteReferences = ctx.call('references.deleteReferences', {
						userId,
					})
					return { deleteResume, deleteWorkHistory, deleteReferences }
				} catch (error) {
					logger.err('deleteResume: error =', error)
					throw new MoleculerClientError('something went wrong ...')
				}
			},
		},
		getResume: {
			rest: 'GET /get-resume',
			params: {
				userId: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { userId } = ctx.params
					const resume = await this.getResumeHandler(userId)
					if (!resume) throw new MoleculerClientError()
					const { workHistory, references } = resume
					let workHistories = await workHistory.map((workHistoryId) =>
						ctx.call('workHistory.getWorkHistory', {
							id: String(workHistoryId),
						}),
					)
					workHistories = await Promise.all(workHistories)

					let workReferences = await references.map((referenceId) =>
						ctx.call('references.getReference', {
							id: String(referenceId),
						}),
					)
					workReferences = await Promise.all(workReferences)

					const resumePayload = {
						...resume,
						workHistory: workHistories,
						references: workReferences,
					}

					return resumePayload
				} catch (error) {
					logger.err('getResume: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		addReference: {
			rest: 'POST /add-reference',
			params: {
				userId: { type: 'string', required: true },
				reference: { type: 'object', required: true },
			},
			async handler(ctx) {
				try {
					const { userId, reference } = ctx.params
					reference.userId = userId
					const addReference = await ctx.call('references.addReference', {
						reference,
					})
					// return addReference
					const updatedResume = await this.addReferenceHandler(
						userId,
						addReference._id,
					)
					return updatedResume
				} catch (error) {
					logger.err('addReference: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		deleteReference: {
			rest: 'POST /delete-reference',
			params: {
				userId: { type: 'string', required: true },
				referenceId: { type: 'string', required: true },
				resumeId: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { userId, referenceId } = ctx.params
					const removeReference = await removeReferenceHandler(
						userId,
						referenceId,
					)
					await ctx.call('references.removeReference', { id: referenceId })
					return removeReference
				} catch (error) {
					logger.err('deleteReference: error =', error)
					throw new MoleculerClientError('something went wrong', error)
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
		async handleInsertResume(userId, coverLetter, workHistory, references) {
			const now = new Date()
			const insertResume = this.adapter.insert({
				userId,
				coverLetter,
				workHistory,
				references,
				createdAt: now,
				updatedAt: now,
			})
			return insertResume
		},
		async getResumeHandler(userId) {
			const resume = await this.adapter.findOne({ userId })
			if (!resume) return false
			return resume
		},
		async handleDeleteResume(_id) {
			const removeById = await this.adapter.removeById(_id)
			return removeById
		},
		async addReferenceHandler(userId, referenceId) {
			const resume = await this.adapter.findOne({ userId })
			logger.debug('resume =', resume)
			const update = {
				$set: {
					references: [...resume.references, referenceId],
					updatedAt: new Date(),
				},
			}
			const updated = this.adapter.updateById(resume._id, update)
			return updated
		},
		async removeReferenceHandler(userId, referenceId) {
			try {
				const resume = await this.adapter.findOne({ userId })
				const update = {
					$set: {
						references: resume.references.filter(
							(reference) => reference != referenceId,
						),
					},
				}
				const updated = await this.adapter.updateById(resume._id, update)
				return updated
			} catch (error) {
				logger.err('removeReferenceHandler: error =', error)
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
