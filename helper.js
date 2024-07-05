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
    return s[0].toUpperCase() + s.slice(1);
}

export function $id(id){
    return document.getElementById(id);
}

export function $class(id){
    return document.getElemntsByClassname(id);
}