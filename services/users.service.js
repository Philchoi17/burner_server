"use strict";

const DbMixin = require("../mixins/db.mixin");
const { MoleculerClientError } = require("moleculer").Errors;
const userModel = require("../models/users.model");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "users",
	/**
	 * mixins
	 */
	mixins: [DbMixin("users")],

	/**
	 * Settings
	 */
	settings: {
		idField: "_id",
		fields: userModel,
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
		 * create user
		 */
		createUser: {
			rest: "POST /create-user",
			params: {
				email: { type: "string", required: true },
				password: { type: "string", required: true },
				name: { type: "string", required: true },
				isAdmin: { type: "boolean", optional: true },
			},
			async handler(ctx) {
				try {
					const { email, password, name } = ctx.params;
					const repeated = await this.findOne(email);
					if (repeated) return "User already exists";
					const user = this.userFormat(email, password, name);
					console.log("** user ** ::", user);
					const insert = await this.insertUser(user);
					return insert;
				} catch (error) {
					console.error("createUser: handler: error =", error);
					throw new MoleculerClientError(
						"required authentication",
						500
					);
				}
			},
		},
		loginUser: {
			rest: "POST /login-user",
			params: {
				email: { type: "string", required: true },
				password: { type: "string", required: true },
			},
			async handler(ctx) {
				try {
					const { email, password } = ctx.params;
					const user = await this.getUser(email, password);
					return user;
				} catch (error) {
					console.error("loginUser: error =", error);
					return "Wrong Credentials";
				}
			},
		},
		sendDeleteCode: {
			rest: "GET /delete-code",
			params: {
				to: { type: "string" },
				text: { type: "string" },
			},
			async handler(ctx) {
				const { to, text } = ctx.params;
				const sendText = await ctx.call("sms.sendText", {
					to,
					text,
				});
				return sendText;
			},
		},
		deleteUser: {
			rest: "POST /delete-user",
			params: {
				email: { type: "string" },
				password: { type: "string" },
				code: { type: "string" },
			},
			async handler(ctx) {
				return true;
			},
		},
	},
	/**
	 * deletes user
	 */

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		userFormat(email, password, name, role = 0, hasBeenDeleted = false) {
			// "_id", // primary
			// "email", // string
			// "password", // string ( sha256 )
			// "name", // string
			// "role", // number [ 0 - client, 1 - admin, 2 - superAdmin, 4 - owner]
			// "hasBeenDeleted", // boolean [ deleted user - true default false]
			// "createdAt", // dateTime
			// "updatedAt", // dateTime
			const now = new Date();
			return {
				email,
				password,
				name,
				role,
				hasBeenDeleted,
				createdAt: now,
				updatedAt: now,
			};
		},
		async findOne(email) {
			try {
				const find = await this.adapter.findOne({ email });
				if (find) return true;
				else return false;
			} catch (error) {
				console.error("findOne: error =", error);
				return false;
			}
		},
		async insertUser(userPayload) {
			try {
				return await this.adapter.insert(userPayload);
			} catch (error) {
				console.error("methods: insertUser: error =", error);
				return error;
			}
		},
		async getUser(email, password) {
			try {
				const user = await this.adapter.findOne({ email, password });
				console.log(user);
				if (user) return user;
				return false;
			} catch (error) {
				console.error("getUser: error =", error);
				return error;
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
};
