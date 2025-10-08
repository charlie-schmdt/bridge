const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, 
    }
  });

  const indexPath = path.join('dist', 'index.html');
  win.loadFile(indexPath);

  // Store OAuth tokens when detected, process them after React loads
  let pendingOAuthTokens = null;

win.webContents.on('will-redirect', (event, navigationUrl) => {
    console.log('🔍 Redirect detected:', navigationUrl);
    
    if (navigationUrl.includes('access_token=')) {
      console.log('✅ OAuth callback detected!');
      
      // IMPORTANT: Prevent the redirect completely
      event.preventDefault();
      
      // Extract tokens
      const url = new URL(navigationUrl);
      const fragment = url.hash.substring(1);
      
      const params = new URLSearchParams(fragment);
      pendingOAuthTokens = {
        access_token: params.get('access_token'),
        provider_token: params.get('provider_token'),
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in')
      };
      
      console.log('💾 OAuth tokens extracted:', {
        hasAccessToken: !!pendingOAuthTokens.access_token,
        hasProviderToken: !!pendingOAuthTokens.provider_token
      });
      
      // Navigate back to your app first, then process tokens
      console.log('🏠 Navigating back to app...');
      win.loadFile(indexPath).then(() => {
        console.log('✅ App reloaded, processing OAuth tokens...');
        setTimeout(() => processOAuthTokens(), 1000);
      });
    }
  });

  const processOAuthTokens = () => {
    if (!pendingOAuthTokens) return;
    
    console.log('🔄 Processing OAuth tokens in app context...');
    
    const script = `
      (async function() {
        console.log('🚀 OAuth processing in Electron app context');
        
        const tokens = ${JSON.stringify(pendingOAuthTokens)};
        const providerToken = tokens.provider_token || tokens.access_token;
        
        if (!providerToken) {
          console.error('❌ No provider token found');
          return;
        }
        
        try {
          console.log('🔄 Step 1: Getting user info from Google...');
          
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': 'Bearer ' + providerToken
            }
          });
          
          if (!userResponse.ok) {
            throw new Error('Google API failed: ' + userResponse.status);
          }
          
          const googleUser = await userResponse.json();
          console.log('✅ Got Google user:', googleUser.email);
          
          console.log('🔄 Step 2: Sending to backend...');
          
          const backendResponse = await fetch('http://localhost:3000/api/auth/oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
              provider: 'google',
              providerId: googleUser.id
            }),
          });
          
          if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error('Backend failed: ' + backendResponse.status + ' - ' + errorText);
          }
          
          const backendData = await backendResponse.json();
          console.log('📨 Backend response:', backendData);
          
          if (backendData.success) {
            console.log('✅ Authentication successful!');
            
            // Store user data
            localStorage.setItem('bridge_token', backendData.data.token);
            localStorage.setItem('bridge_user', JSON.stringify(backendData.data.user));
            
            console.log('💾 User data stored');
            console.log('🏠 Redirecting to home...');
            
            // Show success message
            
            // Navigate to home
            window.location.hash = '#/';
            
            // Reload to update React state
            setTimeout(() => {
              window.location.reload();
            }, 500);
            
          } else {
            throw new Error('Backend processing failed: ' + backendData.message);
          }
          
        } catch (error) {
          console.error('❌ OAuth processing error:', error);
          alert('Login failed: ' + error.message);
          
          // Redirect back to login page
          window.location.hash = '#/login';
        }
      })();
    `;
    
    win.webContents.executeJavaScript(script).catch(error => {
      console.error('❌ Failed to execute OAuth script:', error);
    });
    
    // Clear tokens after processing
    pendingOAuthTokens = null;
  };

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  return win;
};

app.whenReady().then(() => {
  createWindow();
}).catch((err) => {
  console.error('❌ App failed to start:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
