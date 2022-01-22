'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const userSchema = require('../models/users.model')
const jwt = require('jsonwebtoken')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'users',
	/**
	 * mixins
	 */
	mixins: [DbMixin('users')],

	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		fields: userSchema,
	},
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
		/**
		 * create user doc in collection
		 * @param {String} email - user email
		 * @param {String} password - user password
		 * @param {String} name - user name
		 * @param {Boolean} isAdmin - user role
		 *
		 * @returns {Object} user document
		 */
		createUser: {
			rest: 'POST /create-user',
			params: {
				email: { type: 'string', required: true },
				password: { type: 'string', required: true },
				name: { type: 'string', required: true },
				isAdmin: { type: 'boolean', optional: true },
			},
			async handler(ctx) {
				try {
					const { email, password, name } = ctx.params
					const repeated = await this.findOne('email', email)
					if (repeated) throw new MoleculerClientError('same')
					const user = this.userFormat(email, password, name)

					const insert = await this.insertUser(user)
					return insert
				} catch (error) {
					this.logger.error('createUser: handler: error =', error)
					if (error == 'MoleculerClientError: same') {
						throw new MoleculerClientError('email already exists ...', 409)
					}
					throw new MoleculerClientError('required authentication', 500)
				}
			},
		},
		loginUser: {
			rest: 'POST /login-user',
			params: {
				email: { type: 'string', required: true },
				password: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { email, password } = ctx.params
					const user = await this.getUser(email, password)
					if (!user) {
						throw new MoleculerClientError()
					}
					// return user
					const token = await this.generateJWT(user)
					return {
						token,
					}
				} catch (error) {
					this.logger.error('loginUser: error =', error)
					throw new MoleculerClientError('Wrong credentials ...', 401)
				}
			},
		},
		updateUser: {
			rest: 'POST /update-user',
			auth: 'required',
			params: {
				userId: { type: 'string', required: true },
				updateKey: { type: 'string', required: true },
				updateVal: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					const { userId, updateKey, updateVal } = ctx.params
					// const user = await this.adapter.findById(userId)
					const update = {
						$set: {
							[updateKey]: updateVal,
						},
					}
					const updated = await this.adapter.updateById(userId, update)
					return updated
				} catch (error) {
					this.logger.error('updateUser: error =', error)
					throw new MoleculerClientError('something went wrong ...', error)
				}
			},
		},
		sendDeleteCode: {
			rest: 'GET /delete-code',
			params: {
				to: { type: 'string' },
				text: { type: 'string' },
			},
			async handler(ctx) {
				const { to, text } = ctx.params
				const sendText = await ctx.call('sms.sendText', {
					to,
					text,
				})
				return sendText
			},
		},
		/**
		 * deletes user
		 */
		deleteUser: {
			rest: 'POST /delete-user',
			params: {
				email: { type: 'string' },
				// password: { type: 'string' },
				// code: { type: 'string' },
			},
			async handler(ctx) {
				this.logger.info('Hello')
				return true
			},
		},
		decodeToken: {
			rest: 'POST /decode-token',
			cache: {
				keys: ['token'],
				ttl: 60 * 60, // 1 hour
			},
			params: {
				token: 'string',
			},
			async handler(ctx) {
				try {
					const { token } = ctx.params
					const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
					return decoded
				} catch (error) {
					this.logger.error('resolveToken: error =', error)
					throw new MoleculerClientError(error)
				}
				// const decoded = await new this.Promise((resolve, reject) => {
				// 	jwt.verify(ctx.params.token, TOKEN_SECRET, (err, decoded) => {
				// 		if (err) {
				// 			return reject(err)
				// 		}

				// 		resolve(decoded)
				// 	})
				// })
				// if (decoded._id) {
				// 	return this.getById(decoded._id)
				// }
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
		userFormat(email, password, name, role = 0) {
			const now = new Date()
			return {
				email,
				password,
				name,
				role,
				createdAt: now,
				updatedAt: now,
			}
		},
		async findOne(key, val) {
			try {
				this.logger.info('findOne =', val)
				const find = await this.adapter.findOne({ [key]: val })
				if (find) return true
				else return false
			} catch (error) {
				this.logger.error('findOne: error =', error)
				return false
			}
		},
		async insertUser(userPayload) {
			try {
				return await this.adapter.insert(userPayload)
			} catch (error) {
				this.logger.error('methods: insertUser: error =', error)
				return error
			}
		},
		async getUser(email, password) {
			try {
				const user = await this.adapter.findOne({ email, password })
				// this.logger.info(user)
				// this.logger.debug('DEBUG')
				// this.logger.trace('TRACE')
				// this.logger.error('ERROR')
				// this.logger.fatal('FATAL')
				// this.logger.warn('WARN')
				if (user) return user
				return false
			} catch (error) {
				this.logger.error('getUser: error =', error)
				return error
			}
		},
		async generateJWT(user) {
			try {
				const token = jwt.sign(
					{
						...user,
						// exp: Math.floor(Date.now() / 1000) * 3600 * 60 * 60 * 365,
					},
					process.env.TOKEN_SECRET,
					{
						expiresIn: 10, //  1000, "2 days", "10h", "7d"
					},
				)
				return token
			} catch (error) {
				this.logger.error('generateJWT: error =', error)
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
