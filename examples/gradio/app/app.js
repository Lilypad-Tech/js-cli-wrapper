function onLoadFunction() {
    let wasDisconnected = false;
    setInterval(async function() {
        // console.log('Pinging server...');
        try {
            const response = await fetch(window.location.href);
            if (!response.ok) throw new Error('Network response was not ok');
            if (wasDisconnected) {
                location.reload();
            }
            wasDisconnected = false;
        } catch (error) {
            if (!wasDisconnected) {
                showSpinner();
            }
            wasDisconnected = true;
            
        }
    }, 1000); // Ping every 5 seconds
}
function showSpinner() {
    // const spinner = document.getElementById('spinner');
    const spinner = document.createElement('div');
    spinner.id = 'spinner';
    spinner.style.display = 'none';
    spinner.style.position = 'fixed';
    spinner.style.top = '0';
    spinner.style.left = '0';
    spinner.style.right = '0';
    spinner.style.bottom = '0';
    spinner.style.margin = 'auto';
    spinner.style.border = '16px solid #f3f3f3';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTop = '16px solid #3498db';
    spinner.style.width = '120px';
    spinner.style.height = '120px';
    spinner.style.animation = 'spin 5s linear infinite';
    document.body.appendChild(spinner);

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }`;
    document.head.appendChild(style);
    if (spinner) {
        spinner.style.display = 'block';
    }
}
onLoadFunction();