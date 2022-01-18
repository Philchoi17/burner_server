'use strict'
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context

 *
 */

const axios = require('axios')
const CronMixIn = require('../mixins/cron.mixin')
const _ = require('lodash')
const logger = require('../logger')

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
					logger.debug('tick')
					logger.debug('tick')
					logger.debug('tick')
					logger.debug('tick')
					logger.debug('tick')
					console.log('SOMETHING')
				} catch (error) {
					logger.err('onTick: error =', error)
				}
			},
			runOnInit: function () {
				logger.debug('cronjob: runOnIt')
			},
			timeZone: 'Asia/Seoul',
		},
	],
	actions: {},
}
