export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function capitalize(s) {
    return s.split('-')
            .map(part => part[0].toUpperCase() + part.slice(1))
            .join('-');
}


export function $id(id){
    return document.getElementById(id);
}

export function $class(id){
    return document.getElementsByClassname(id);
}