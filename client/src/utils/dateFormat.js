/**
 * Date/Time formatting utilities for NeevTime
 * 
 * IMPORTANT: The database stores timestamps in LOCAL timezone (not UTC).
 * Using new Date().toLocaleString() will incorrectly add timezone offset again.
 * Use these functions to format timestamps correctly.
 */

/**
 * Format a database timestamp without timezone conversion
 * @param {string} timestamp - Database timestamp string
 * @returns {object} { date: 'M/D/YYYY', time: 'h:mm:ss AM/PM', datetime: 'M/D/YYYY h:mm:ss AM/PM' }
 */
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: '-', time: '-', datetime: '-' };

    const str = String(timestamp);
    let datePart, timePart;

    if (str.includes('T')) {
        // ISO format: 2026-01-05T17:52:00.000Z
        const [d, t] = str.split('T');
        datePart = d;
        timePart = t.split('.')[0].replace('Z', '');
    } else if (str.includes(' ')) {
        // Space format: 2026-01-05 17:52:00
        const [d, t] = str.split(' ');
        datePart = d;
        timePart = t ? t.split('.')[0] : '00:00:00';
    } else {
        // Date only: 2026-01-05
        datePart = str;
        timePart = '00:00:00';
    }

    // Format date as M/D/YYYY
    const [year, month, day] = datePart.split('-');
    const formattedDate = `${parseInt(month)}/${parseInt(day)}/${year}`;

    // Format time as h:mm:ss AM/PM
    const timeParts = timePart.split(':');
    const hours = parseInt(timeParts[0] || 0);
    const minutes = timeParts[1] || '00';
    const seconds = timeParts[2] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const formattedTime = `${h12}:${minutes}:${seconds} ${ampm}`;

    return {
        date: formattedDate,
        time: formattedTime,
        datetime: `${formattedDate} ${formattedTime}`
    };
};

/**
 * Format time only (for in_time, out_time display)
 * @param {string} timestamp - Database timestamp string
 * @returns {string} 'h:mm:ss AM/PM' or '-' if null
 */
export const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return formatTimestamp(timestamp).time;
};

/**
 * Format date only
 * @param {string} timestamp - Database timestamp string
 * @returns {string} 'M/D/YYYY' or '-' if null
 */
export const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return formatTimestamp(timestamp).date;
};

/**
 * Format datetime (combined)
 * @param {string} timestamp - Database timestamp string
 * @returns {string} 'M/D/YYYY h:mm:ss AM/PM' or '-' if null
 */
export const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    return formatTimestamp(timestamp).datetime;
};

/**
 * Format time in short format (for dashboard)
 * @param {string} timestamp - Database timestamp string
 * @returns {string} 'h:mm AM/PM' or '-' if null
 */
export const formatTimeShort = (timestamp) => {
    if (!timestamp) return '-';
    const { time } = formatTimestamp(timestamp);
    // Remove seconds: "6:02:35 PM" -> "6:02 PM"
    return time.replace(/:\d{2}\s/, ' ');
};
