export function log(message: string, level: 'info' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [${level}] ${message}\n`);
}

export function info(message: string) {
    log(message, 'info');
}

export function error(message: string) {
    log(message, 'error');
} 
