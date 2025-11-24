// File to test console log removal
console.log('Debug: Starting application');
console.log('User data:', { id: 1, name: 'Test' });
console.warn('Warning: This is a test warning');
console.error('Error: This is a test error');
console.info('Info: Application initialized');
console.debug('Debug info');
console.table([{ a: 1, b: 2 }]);
console.trace('Trace log');

export function processData(data: any) {
    console.log('Processing data:', data);

    if (!data) {
        console.error('No data provided!');
        return null;
    }

    console.log('Data processed successfully');
    return data;
}

export const debugHelper = () => {
    console.log('Helper called');
    console.warn('This should be removed');
};
