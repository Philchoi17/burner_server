'use strict'

const DbMixin = require('../mixins/db.mixin')
const { MoleculerClientError } = require('moleculer').Errors
const smsSchema = require('../models/sms.model')
const { config, msg, Group } = require('coolsms-node-sdk')

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: 'sms',
	/**
	 * mixins
	 */
	mixins: [DbMixin('sms')],

	/**
	 * Settings
	 */
	//  "_id", // primary
	//  "text", // string
	//  "type", // string
	//  "code", // verification code
	//  "createdAt", // dateTime
	//  "updatedAt", // dateTime
	settings: {
		idField: '_id',
		fields: smsSchema,
	},
	// deletes message after 300 seconds
	async afterConnected() {
		try {
			await this.adapter.db.createIndex(
				'sms',
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
		sendText: {
			rest: 'POST /send-text',
			params: {
				to: { type: 'string', required: true },
				text: { type: 'string', required: true },
			},
			async handler(ctx) {
				try {
					//  "groupId": "G4V202201091613499GZENCFX8ITJUPP",
					// "to": "01048359703",
					// "from": "01033925605",
					// "type": "SMS",
					// "statusMessage": "정상 접수(이통사로 접수 예정) ",
					// "country": "82",
					// "messageId": "M4V20220109161349BKAAOL9SVDUOPZR",
					// "statusCode": "2000",
					// "accountId": "22010924481171"

					const { to, text } = ctx.params
					if (to != 'TESTING') {
						const sms = await Group.sendSimpleMessage({
							type: 'SMS',
							text,
							to,
							from: process.env.SMS_FROM_NUMBER,
							// from: "01033925605",
						})
						// return sms;
						return this.textHandler(sms)
					}
					const handle = this.textHandler({
						type: 'SMS',
						text,
						to,
						from: '01033925605',
					})
					if (handle) {
						return handle
					}
					throw MoleculerClientError()
					// return this.textHandler(sms);
				} catch (error) {
					console.error('sendText: error =', error)
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
		insertMsg(msg) {
			//  "_id", // primary
			//  "text", // string
			//  "type", // string
			//  "code", // verification code
			//  "createdAt", // dateTime
			//  "updatedAt", // dateTime
			// this.adapater.insert({
			// });
			//  "groupId": "G4V202201091613499GZENCFX8ITJUPP",
			// "to": "01048359703",
			// "from": "01033925605",
			// "type": "SMS",
			// "statusMessage": "정상 접수(이통사로 접수 예정) ",
			// "country": "82",
			// "messageId": "M4V20220109161349BKAAOL9SVDUOPZR",
			// "statusCode": "2000",
			// "accountId": "22010924481171"
		},
		async textHandler(smsPayload) {
			try {
				const { type, text, to, from } = smsPayload
				const now = new Date()
				const sms = await this.adapter.insert({
					text,
					type,
					to,
					from,
					code: this.codeGen(),
					createdAt: now,
					updatedAt: now,
				})
				return sms
			} catch (error) {
				console.error('textHandler: error =', error)
				return false
			}
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		config.init({
			apiKey: process.env.SMS_KEY,
			apiSecret: process.env.SMS_SECRET,
		})
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
}
