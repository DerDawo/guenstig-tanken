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

    setTimeout(function(){ 
        snackbar.className = snackbar.className.replace('show', '');
    }, timeout);
  }
  