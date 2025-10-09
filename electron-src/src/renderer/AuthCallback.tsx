import React, { useEffect } from 'react';
import { supabase } from './lib/supabase';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Processing OAuth callback...');
        
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          // Send error to parent window
          window.opener?.postMessage({
            type: 'SUPABASE_AUTH_ERROR',
            error: error.message
          }, window.location.origin);
          window.close();
          return;
        }

        if (session?.user) {
          console.log(' OAuth session found, sending to parent...');
          
          // Send success data to parent window
          window.opener?.postMessage({
            type: 'SUPABASE_AUTH_SUCCESS',
            user: session.user,
            session: session
          }, window.location.origin);
          
          window.close();
        } else {
          console.log('No session found in callback');
          window.opener?.postMessage({
            type: 'SUPABASE_AUTH_ERROR',
            error: 'No session found'
          }, window.location.origin);
          window.close();
        }
      } catch (error) {
        console.error('❌ Callback processing error:', error);
        window.opener?.postMessage({
          type: 'SUPABASE_AUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, window.location.origin);
        window.close();
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.spinner}></div>
        <h2>Processing Login...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  content: {
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    maxWidth: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #0078d4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  }
};

export default AuthCallback;