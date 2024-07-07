function loadSnackbarCSS() {
  if (!document.getElementById('components')) {
    var link = document.createElement('link');
    link.id = 'components';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = './components.css'; // Update the path to your CSS file
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

export function showSnackbar(message, timeout) {
  // Load the CSS file
  loadSnackbarCSS();

  // Create the snackbar container if it doesn't exist
  if (!document.getElementById('snackbar')) {
    var snackbar = document.createElement('div');
    snackbar.id = 'snackbar';
    document.body.appendChild(snackbar);
  }

  // Get the snackbar div
  var snackbar = document.getElementById('snackbar');

  // Set the message
  snackbar.innerHTML = message;

  // Show the snackbar
  snackbar.className = 'show';

  setTimeout(function () {
    snackbar.className = snackbar.className.replace('show', '');
  }, timeout);
}

class ToggleSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'toggle-slider.css';

    const container = document.createElement('div');
    container.className = 'slider-container';
    container.title = 'Sortierung';

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.id = 'toggle-slider';
    this.checkbox.className = 'slider-checkbox';

    const label = document.createElement('label');
    label.htmlFor = 'toggle-slider';
    label.className = 'slider-label';

    this.span1 = document.createElement('span');
    this.span1.className = 'slider-text';
    this.span1.dataset.text = 'Distance';
    this.span1.textContent = 'Distanz';

    this.span2 = document.createElement('span');
    this.span2.className = 'slider-text';
    this.span2.dataset.text = 'Price';
    this.span2.textContent = 'Preis';

    label.appendChild(this.span1);
    label.appendChild(this.span2);
    container.appendChild(this.checkbox);
    container.appendChild(label);

    this.shadowRoot.append(link, container);

    this.checkbox.addEventListener('change', () => this.handleToggle());
  }

  connectedCallback() {
    this.handleToggle();
  }

  handleToggle() {
    const value = this.checkbox.checked ? 'Price' : 'Distance';
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: {
        checked: this.checkbox.checked,
        value: value
      }
    }));
  }

  get value() {
    return this.checkbox.checked ? 'Price' : 'Distance';
  }

  set value(newValue) {
    if (newValue === 'Price') {
      this.checkbox.checked = true;
    } else if (newValue === 'Distance') {
      this.checkbox.checked = false;
    }
    this.handleToggle();
  }
}

customElements.define('toggle-slider', ToggleSlider);
