import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendApiRequest } from "../api.js";

/* This component shows the login form for teachers. */
export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("FatimaMansoori");
  const [password, setPassword] = useState("Pass1234!");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await sendApiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("teacher", JSON.stringify(data.teacher));

      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h1 className="loginTitle">Teacher Login</h1>
        <p className="loginText">
          Sign in to reserve test dates and avoid schedule clashes.
        </p>

        {errorMessage && <div className="errorBox">{errorMessage}</div>}

        <form onSubmit={handleLogin} className="formBox">
          <label className="inputLabel">Username</label>
          <input
            className="textInput"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label className="inputLabel">Password</label>
          <input
            className="textInput"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button className="mainButton" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="demoBox">
          Demo accounts:
          <br />
          FatimaMansoori / Pass1234!
          <br />
          JohnGillooley / Word!4321
        </div>
      </div>
    </div>
  );
}