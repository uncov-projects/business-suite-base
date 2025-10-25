import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/SliderAuth.module.css";
import "../styles/Messages.css";
import { v4 as uuidv4 } from "uuid";

const SliderAuth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [username, setUsername] = useState("");

  const navigate = useNavigate(); // Initialize useNavigate

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setEmailError("Enter a valid email"); // Show custom tooltip
    } else {
      setEmailError(""); // Remove error if valid
    }
  };

  /* This code helps in Registration and Login of a user using database (SQLite3), 
    piece of code should be comment till testing on the Electron.js application */

  // Register via IPC
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        user_uuid: uuidv4(),
        username,
        email,
        password,
      };
      await window.electron.registerUser(newUser);
      setMessage("Registration successful!");
      setMessageType("success");
      setTimeout(() => {
        setIsSignup(false);
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage("Registration failed: " + err.message);
      setMessageType("error");
    }
  };

  // Login via IPC
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await window.electron.loginUser({ email, password });
      if (result) {
        setMessage("Login successful!");
        setMessageType("success");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage("Invalid email or password.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Login error: " + err.message);
      setMessageType("error");
    }
  };

  return (
    <>
      <div className={styles["auth-page"]}>
        <h1 className={styles["main-heading"]}>
          Welcome to <span className={styles["app-name"]}>uNCov.</span> Business
          Suite
        </h1>
        <p className={styles["sub-heading"]}>
          Streamline your operations and unlock smart insights.
        </p>
        <div className={`${styles.container} ${isSignup ? styles.active : ""}`}>
          {/* Login Form */}
          <div className={`${styles["form-box"]} ${styles.login}`}>
            <form onSubmit={handleLogin}>
              <h1>Login</h1>
              <div className={styles["input-box"]}>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                />
                <i className="bx bxs-user"></i>
              </div>
              <div className={styles["input-box"]}>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i className="bx bxs-lock-alt"></i>
              </div>
              <div className={styles["forgot-link"]}>
                <a href="#">Forgot password?</a>
              </div>
              {message && messageType === "error" && (
                <div className="messageContainer error">
                  <i className="bx bx-error-circle"></i> {message}
                </div>
              )}
              {message && messageType === "success" && (
                <div className="messageContainer success">
                  <i className="bx bx-check-circle"></i> {message}
                </div>
              )}
              <button type="submit" className={styles.btn}>
                Login
              </button>
            </form>
          </div>

          {/* Signup Form */}
          {/* Signup Form */}
          <div className={`${styles["form-box"]} ${styles["sign-up"]}`}>
            <form onSubmit={handleRegister} noValidate>
              <h1>Sign Up</h1>

              {/* Username Field */}
              <div className={styles["input-box"]}>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <i className="bx bxs-user"></i>
              </div>

              {/* Email Field */}
              {/* Email Field */}
              <div className={styles["input-box"]}>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={() => validateEmail(email)}
                />
                <i className="bx bxs-envelope"></i>
                {emailError && <small className="error">{emailError}</small>}
              </div>

              {/* Password Field */}
              <div className={styles["input-box"]}>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i className="bx bxs-lock-alt"></i>
              </div>

              {message && messageType === "error" && (
                <div className="messageContainer error">
                  <i className="bx bx-error-circle"></i> {message}
                </div>
              )}
              {message && messageType === "success" && (
                <div className="messageContainer success">
                  <i className="bx bx-check-circle"></i> {message}
                </div>
              )}

              <button type="submit" className={styles.btn}>
                Sign Up
              </button>
            </form>
          </div>

          {/* Toggle Panels */}
          <div className={styles["toggle-box"]}>
            <div
              className={`${styles["toggle-panel"]} ${styles["toggle-left"]}`}
            >
              <h1>Hello, Welcome!</h1>
              <p>Don't have an account?</p>
              <button
                className={`${styles["btn"]} ${styles["sign-up-btn"]}`}
                onClick={() => {
                  setIsSignup(true);
                  setMessage(null);
                  setMessageType("");
                  setEmail(""); // Clear email
                  setPassword(""); // Clear password
                  setEmailError("");
                  setEmailTouched(false);
                }}
              >
                Sign Up
              </button>
            </div>
            <div
              className={`${styles["toggle-panel"]} ${styles["toggle-right"]}`}
            >
              <h1>Welcome Back!</h1>
              <p>Already have an account?</p>
              <button
                className={`${styles["btn"]} ${styles["login-btn"]}`}
                onClick={() => {
                  setIsSignup(false);
                  setMessage(null);
                  setMessageType("");
                  setEmail(""); // Clear email
                  setPassword(""); // Clear password
                  setEmailError("");
                  setEmailTouched(false);
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        © {new Date().getFullYear()} uNCov. All rights reserved.
      </footer>
    </>
  );
};

export default SliderAuth;
