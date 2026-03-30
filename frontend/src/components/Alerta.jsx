import { useEffect, useState } from 'react';

function Alerta({ type, message, duration = 5000, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div className={`alert alert-${type}`} style={{ animation: 'slideIn 0.3s ease' }}>
            {message}
        </div>
    );
}

export default Alerta;