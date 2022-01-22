'use strict'
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context

 *
 */

const axios = require('axios')
const CronMixIn = require('../mixins/cron.mixin')
const _ = require('lodash')

module.exports = {
	name: 'cron.tick',
	mixins: [CronMixIn],
	// put service depends on
	dependencies: [],
	crons: [
		{
			name: 'cronjob',
			cronTime:
				process.env.NODE_ENV == 'production' ? '*/10 * * *' : '*/10 * * * *',
			onTick: async function () {
				try {
					console.log('tick')
					console.log('tick')
					console.log('tick')
					console.log('tick')
					console.log('tick')
					console.log('SOMETHING')
				} catch (error) {
					this.logger.error('onTick: error =', error)
				}
			},
			runOnInit: function () {
				console.log('cronjob: runOnIt')
			},
			timeZone: 'Asia/Seoul',
		},
	],
	actions: {},
}
