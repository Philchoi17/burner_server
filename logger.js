class Logger {
	debug(...msg) {
		console.log('DEBUG:', ...msg)
	}
	warn(...msg) {
		console.warn('WARN:', ...msg)
	}
	info(...msg) {
		console.info('INFO:', ...msg)
	}
	err(...msg) {
		console.error('ERR:', ...msg)
	}
}

module.exports = new Logger()
