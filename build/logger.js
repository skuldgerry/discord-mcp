export function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [${level}] ${message}\n`);
}
export function info(message) {
    log(message, 'info');
}
export function error(message) {
    log(message, 'error');
}
