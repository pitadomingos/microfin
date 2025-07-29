import React from 'react';

export const Icon = ({ name, className }) => {
    return React.createElement('i', { className: `fas fa-${name} ${className || ''}` });
};
