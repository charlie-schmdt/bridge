import React, { useState } from "react";
import Header from "./components/Header";
import Banner from "./components/Banner";

const LogInLayout: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Please fill in all required fields.");
            return;
        }
        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        // TODO: Add authentication logic here
        alert(isLogin ? "Logged in!" : "Account created!");
    };

    return (
        <div>
            <Header />
            <Banner />
            <div style={styles.container}>
                <div style={styles.formContainer}>
                    <h2>{isLogin ? "Log In" : "Create Account"}</h2>
                    <form onSubmit={handleSubmit} style={styles.form}>
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
                        <button type="submit" style={styles.button}>
                            {isLogin ? "Log In" : "Create Account"}
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
        fontSize: "0.95rem",
        marginBottom: "0.5rem",
        textAlign: "center",
    },
};

export default LogInLayout;