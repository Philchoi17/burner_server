'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const emailSchema = require('../models/email.model')
// const { SMTPClient } = require('emailjs')
const nodemailer = require('nodemailer')
const logger = require('../logger')

// const client = new SMTPClient({
// 	user: process.env.EMAIL,
// 	password: process.env.EMAIL_PASSWORD,
// 	host: 'smtp.mail.me.com', // 'smtp.gmail.com',
// 	ssl: true,
// })

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL,
		pass: process.env.EMAIL_PASSWORD,
	},
})

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'email',
	/**
	 * mixins
	 */
	mixins: [DbMixin('email')],

	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		fields: emailSchema,
	},
	// deletes message after 300 seconds
	async afterConnected() {
		try {
			await this.adapter.db.createIndex(
				'email',
				{ createdAt: 1 },
				{ expireAfterSeconds: 300 },
			)
		} catch (error) {
			console.error(error)
		}
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
		send: {
			rest: 'POST /send-email',
			params: {
				to: { type: 'string', required: true },
				text: { type: 'string', optional: true },
			},
			async handler(ctx) {
				try {
					const { to, text } = ctx.params
					const code = this.codeGen()
					await transporter.sendMail({
						from: `"Phil" <${process.env.EMAIL}>`,
						to,
						subject: 'Message from Burner Server',
						text,
						html: `
							<a href='#'>send to: ${to}</a>
							<p>${text}</p>
							<p>${code}</p>
						`,
					})
					const insertedEmail = await this.handleInsert(text, to, code)

					return insertedEmail
				} catch (error) {
					logger.err('error =', error)
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
		codeGen() {
			let result = ''
			const CHARS = 'ABCDEFGHIJKLMNPQRSTUV123456789'
			for (let i = 0; i < 6; i++) {
				result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
			}
			return result
		},
		async handleInsert(text, to, code) {
			// 		_id: String,
			// text: String,
			// to: String,
			// code: String,
			// createdAt: Date,
			// updatedAt: Date,
			const now = new Date()
			const insert = this.adapter.insert({
				text,
				to,
				code,
				createdAt: now,
				updatedAt: now,
			})
			return insert
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
