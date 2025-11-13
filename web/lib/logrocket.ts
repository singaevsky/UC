// Safe shim for LogRocket in web layer.
// If the real LogRocket package isn't installed or the project provides its own implementation
// at the repository root, this file prevents build-time failures by exporting no-op functions.
// Replace with a proper implementation or install `logrocket` package to enable full functionality.

function noop() {
	// no-op
}

export function initializeLogRocket() { noop(); }
export function identifyUser(_userId: string, _userInfo?: Record<string, any>) { noop(); }
export function trackEvent(_eventName: string, _properties?: Record<string, any>) { noop(); }
export function captureException(_error: Error, _context?: Record<string, any>) { noop(); }
export function captureMessage(_message: string, _level: 'info' | 'warn' | 'error' = 'info') { noop(); }
export function startSession(_name?: string) { noop(); }
export function endSession(_reason?: string) { noop(); }

export const logrocketHelpers = {
	trackPageView: (_pageName: string) => noop(),
	trackUserAction: (_action: string, _details?: Record<string, any>) => noop(),
	trackError: (_error: Error, _context?: Record<string, any>) => noop(),
	setCustomData: (_key: string, _value: any) => noop(),
};

const LogRocketShim = {
	init: noop,
	identify: noop,
	track: noop,
	captureException: noop,
	captureMessage: noop,
	setUserIDGenerator: noop,
	addRawMetadata: noop,
};

export default LogRocketShim;
