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
    return s.toLowerCase()
            .split('-')
            .map(part => part[0].toUpperCase() + part.slice(1))
            .join('-')
            .split(' ')
            .map(part => part[0].toUpperCase() + part.slice(1))
            .join(' ');
}

export function superscriptLastElement(s){
    s = String(s)
    return `${s.slice(0, -1)}<span class="milli_cent">${s.slice(-1)}</span>`;
}

export function $id(id){
    return document.getElementById(id);
}

export function $class(id){
    return document.getElementsByClassname(id);
}

export function addLeadingZero(s) {
    let str = String(s)
    if (str.length === 4) {
        return '0' + str;
    }
    return str;
}