const isIOS = /iP(hone|(o|a)d)/.test(navigator.userAgent);

if ('serviceWorker' in navigator && !isIOS) {
	navigator.serviceWorker.register('/service-worker.js')
	.then(function(registration) {
		console.log('Registration successful, scope is:', registration.scope);
	})
	.catch(function(error) {
		console.log('Service worker registration failed, error:', error);
	});
}