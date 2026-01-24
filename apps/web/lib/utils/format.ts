/**
 * Format timestamp to relative or absolute time string
 * Handles both seconds and milliseconds timestamps
 */
export function formatTimestamp(timestamp: number | string | null): string {
    if (!timestamp) return '';

    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (isNaN(numTimestamp)) return '';

    try {
        // If timestamp is in seconds (10 digits), convert to milliseconds
        const msTimestamp = numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp;

        const date = new Date(msTimestamp);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes === 0 ? 'Just now' : `${minutes}m`;
        }
        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        if (hours < 48) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
        return '';
    }
}

/**
 * Format timestamp to time only (HH:MM)
 */
export function formatTime(timestamp: number | string): string {
    if (!timestamp) return '';

    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (isNaN(numTimestamp)) return '';

    try {
        // If timestamp is in seconds (10 digits), convert to milliseconds
        const msTimestamp = numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp;
        const date = new Date(msTimestamp);

        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

/**
 * Format timestamp to date string (Today, Yesterday, or date)
 */
export function formatDate(timestamp: number | string): string {
    if (!timestamp) return 'Unknown Date';

    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (isNaN(numTimestamp)) return 'Unknown Date';

    try {
        // If timestamp is in seconds (10 digits), convert to milliseconds
        const msTimestamp = numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp;
        const date = new Date(msTimestamp);

        if (isNaN(date.getTime())) return 'Unknown Date';

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return 'Unknown Date';
    }
}
