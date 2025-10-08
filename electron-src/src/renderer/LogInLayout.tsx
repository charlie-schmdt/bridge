import React, { useState } from "react";
import Header from "./components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from './contexts/AuthContext';
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
    const { login } = useAuth();


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
            return;
        }
        
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin 
                ? { email, password }
                : { email, password, name };

            console.log('🔄 Attempting authentication:', { endpoint, email });

            const response = await fetch(`http://localhost:50031${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('📡 Backend response:', data);

            if (data.success) {
                // Store token securely (we'll improve this later)
                await login(data.data.token, data.data.user);
                
                console.log('✅ Authentication successful:', data.data.user.email);
                // alert(`${isLogin ? 'Login' : 'Registration'} successful!`);

                // Redirect to home page
                navigate('/');
            } else {
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                const errorMessage = `${data.message}:\n• ${data.errors.join('\n• ')}`;
                setError(errorMessage);
            } else {
                setError(data.message || 'Authentication failed');
            }
            }
        } catch (error) {
            console.error('❌ Authentication error:', error);
            setError('Network error. Please make sure the backend is running.');
        } finally {
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
        minWidth: "320px",
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
        fontSize: "0.9rem",
        marginBottom: "0.5rem",
        textAlign: "left", 
        backgroundColor: "#ffebee",
        padding: "0.75rem",
        borderRadius: "4px",
        border: "1px solid #ffcdd2",
        whiteSpace: "pre-line",
        fontFamily: "monospace", 
    },
};

export default LogInLayout;