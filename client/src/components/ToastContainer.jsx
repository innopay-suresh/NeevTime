import React from 'react';
import Toast from './Toast';

let toastId = 0;
let toastListeners = [];

export const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration)
};

const showToast = (message, type, duration = 4000) => {
    const id = toastId++;
    toastListeners.forEach(listener => listener({ id, message, type, duration }));
    return id;
};

export default function ToastContainer() {
    const [toasts, setToasts] = React.useState([]);

    React.useEffect(() => {
        const listener = (toast) => {
            setToasts(prev => [...prev, toast]);
        };

        toastListeners.push(listener);

        return () => {
            toastListeners = toastListeners.filter(l => l !== listener);
        };
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div
            className="fixed top-4 right-4 z-[9999] pointer-events-none"
            style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
            <div className="pointer-events-auto">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
}

