import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import Banner from "./components/Banner";

const LogInLayout: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState(""); 
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { loginManual, loginWithGoogle, register, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            console.log('✅ User already authenticated, redirecting to main page');
            navigate('/');
        }
    }, [isAuthenticated, navigate]);


    // Manual form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        if (!email || !password || (!isLogin && !name)) {
            setError("Please fill in all required fields.");
            setIsLoading(false);
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
        
        try {
            if (isLogin) {
                await loginManual(email, password);
            } else {
                await register(email, password, name);
            }
            console.log('✅ Manual authentication successful');
            navigate('/');
        } catch (error: any) {
            console.error('❌ Manual authentication failed:', error);
            setError(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth
const handleGoogleLogin = async () => {
  try {
    setError("");
    setIsLoading(true);
    console.log('🔄 Starting Google OAuth...');
    
    await loginWithGoogle();
    
    // Don't navigate here - the AuthContext will handle navigation after OAuth completes
    console.log('✅ OAuth initiated, waiting for completion...');
    
  } catch (error: any) {
    console.error('❌ Google OAuth failed:', error);
    setError('Google login failed: ' + (error.message || 'Unknown error'));
    setIsLoading(false);
  }
};

    return (
        <div>
            <Header />
            <Banner />
            <div style={styles.container}>
                <div style={styles.formContainer}>
                    <h2>{isLogin ? "Log In" : "Create Account"}</h2>
                    
                    {/* OAuth Buttons */}
                    <div style={styles.oauthSection}>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            style={styles.googleButton}
                            disabled={isLoading}
                        >
                            {isLoading ? '🔄' : '🔍'} Continue with Google
                        </button>
                    </div>

                    <div style={styles.divider}>
                        <span>or</span>
                    </div>

                    {/* Manual Form */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {!isLogin && (
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={styles.input}
                                required
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                        {!isLogin && (
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={styles.input}
                                required
                            />
                        )}
                        
                        {error && <div style={styles.error}>{error}</div>}
                        
                        <button 
                            type="submit" 
                            style={{
                                ...styles.button,
                                opacity: isLoading ? 0.6 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : (isLogin ? "Log In" : "Create Account")}
                        </button>
                    </form>

                    <div style={styles.toggle}>
                        {isLogin ? (
                            <>
                                Don't have an account?{" "}
                                <button style={styles.link} onClick={() => setIsLogin(false)}>
                                    Create one
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button style={styles.link} onClick={() => setIsLogin(true)}>
                                    Log in
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    formContainer: {
        background: "#fff",
        padding: "2rem 2.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        minWidth: "400px",
        maxWidth: "500px",
    },
    oauthSection: {
        marginBottom: "1rem",
    },
    googleButton: {
        width: "100%",
        padding: "0.75rem",
        borderRadius: "4px",
        border: "1px solid #dadce0",
        background: "#fff",
        color: "#3c4043",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        transition: "background-color 0.2s",
    },
    divider: {
        textAlign: "center",
        margin: "1.5rem 0",
        position: "relative",
        color: "#666",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    input: {
        padding: "0.75rem",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1rem",
    },
    button: {
        padding: "0.75rem",
        borderRadius: "4px",
        border: "none",
        background: "#0078d4",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "1rem",
        cursor: "pointer",
    },
    toggle: {
        marginTop: "1rem",
        fontSize: "0.95rem",
        textAlign: "center",
    },
    link: {
        background: "none",
        border: "none",
        color: "#0078d4",
        cursor: "pointer",
        textDecoration: "underline",
        fontSize: "inherit",
        padding: 0,
    },
    error: {
        color: "#d32f2f",
        fontSize: "0.95rem",
        marginBottom: "0.5rem",
        textAlign: "center",
        backgroundColor: "#ffebee",
        padding: "0.5rem",
        borderRadius: "4px",
        border: "1px solid #ffcdd2",
    },
};

export default LogInLayout;