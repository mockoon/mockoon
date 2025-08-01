export const checkSingleInstance = () => {
  const broadcastChannel = new BroadcastChannel('mockoon-web-app');
  const loadingDiv = document.querySelector('app-root > div');

  return new Promise((resolve) => {
    let existingInstance = false;

    broadcastChannel.onmessage = (event) => {
      if (event.data === 'check-instance') {
        broadcastChannel.postMessage('existing-instance');
      }

      if (event.data === 'existing-instance' && !existingInstance) {
        existingInstance = true;

        resolve(false);

        if (loadingDiv) {
          loadingDiv.innerHTML = `
      <div style="text-align: center; margin: 0 auto; color: #a7acba">
        <p style="opacity: 0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="48px" viewBox="0 -960 960 960" fill="#a7acba"><path d="M819-28 407-440H160v280h480v-161l80 80v81q0 33-23.5 56.5T640-80H160q-33 0-56.5-23.5T80-160v-360q0-33 23.5-56.5T160-600h80v-7L27-820l57-57L876-85l-57 57Zm-99-327-80-80-165-165h165q33 0 56.5 23.5T720-520v80h80v-280H355L246-829q8-23 28.5-37t45.5-14h480q33 0 56.5 23.5T880-800v360q0 33-23.5 56.5T800-360h-80v5Z"/></svg>
        </p>
        <p style="margin: 0; font-size: 16px; font-weight: 500;">Mockoon is already running in another tab</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Please switch to the existing tab or close this one</p>
      </div>
    `;
        }
      }
    };

    broadcastChannel.postMessage('check-instance');

    // If no response after 500ms, assume it's the first instance
    setTimeout(() => {
      if (!existingInstance) {
        resolve(true);
      }
    }, 500);
  });
};
