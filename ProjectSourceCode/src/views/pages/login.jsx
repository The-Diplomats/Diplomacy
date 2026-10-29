import { useState } from "react";


const svg = `<svg xmlns="ProjectSourceCode/src/resources/img/DiplomacyPlaceHolder.jpg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c28b"/><stop offset=".6" stop-color="#f0e1c8"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#s)"/>
<circle cx="1180" cy="330" r="110" fill="#ffe8bc" opacity=".9"/>
<path d="M0 560 Q300 420 620 540 T1240 500 T1600 560 V900 H0Z" fill="#6f9a8f"/>
<path d="M0 660 Q360 540 700 640 T1300 620 T1600 680 V900 H0Z" fill="#3f7468"/>
<path d="M0 780 Q420 690 820 770 T1600 760 V900 H0Z" fill="#10373a"/>
</svg>`;
const BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const css = `
.auth *{box-sizing:border-box}
.auth{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;color:#2a2418;background-color:#3f7468;background-size:cover;background-position:center}
.auth-card{width:100%;max-width:440px;background:#efe6d5;border-radius:14px;padding:36px 36px 32px;box-shadow:0 24px 60px rgba(16,55,58,.35)}
.auth-tabs{display:flex;gap:24px;border-bottom:1px solid #d3c6ad;margin-bottom:28px}
.auth-tab{background:none;border:0;padding:0 0 12px;font:inherit;font-size:18px;font-weight:600;color:#8a7c61;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1px}
.auth-tab[aria-selected="true"]{color:#2a2418;border-color:#f2562b}
.field{margin-bottom:18px}
.field label{display:block;font-size:14px;font-weight:600;margin-bottom:6px}
.input-wrap{position:relative}
.field input{width:100%;padding:12px 14px;font:inherit;border:1.5px solid #cdbfa3;border-radius:8px;background:#fff;color:inherit}
.field input:focus{outline:3px solid #f2562b55;border-color:#f2562b}
.field input[aria-invalid="true"]{border-color:#b3261e}
.toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;font:inherit;font-size:13px;font-weight:600;color:#2a2418;cursor:pointer;padding:6px}
.err{color:#b3261e;font-size:13px;margin:6px 0 0}
.strength{display:flex;gap:4px;margin-top:8px}
.strength span{height:4px;flex:1;border-radius:2px;background:#d9ccb2}
.strength span.on{background:#2e8b6a}
.hint{font-size:13px;color:#6e6149;margin:6px 0 0}
.row{display:flex;justify-content:space-between;align-items:center;margin:-4px 0 20px;font-size:14px}
.row label{display:flex;gap:8px;align-items:center}
.link{background:none;border:0;padding:0;font:inherit;color:#2a2418;text-decoration:underline;cursor:pointer}
.submit{width:100%;padding:13px;font:inherit;font-weight:700;font-size:16px;color:#fff;background:#f2562b;border:0;border-radius:8px;cursor:pointer}
.submit:hover:not(:disabled){background:#d9441c}
.submit:focus-visible{outline:3px solid #2a2418;outline-offset:2px}
.submit:disabled{opacity:.6;cursor:wait}
.form-err{background:#fbe9e7;color:#8c1d18;padding:10px 12px;border-radius:8px;font-size:14px;margin-bottom:18px}
.done{text-align:center}
.done h2{font-size:26px;margin:0 0 8px}
.done p{color:#6e6149;margin:0 0 24px}
@media (max-width:480px){.auth{padding:16px}.auth-card{padding:28px 22px}}
`;

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const strength = (p) =>
  [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

////////
//Insert API Stuff later
////////

//field errors

//authenticator

  const pwType = showPw ? "text" : "password";
  const score = strength(form.password);

  return (
    <div className="auth" style={{ backgroundImage: BACKGROUND_IMAGE }}>
      <style>{css}</style>
      <main className="auth-card">
        <div>
          {user ? (
            <div className="done">
              <h2>{isRegister ? `Account created, ${user.name}` : `Welcome back, ${user.name}`}</h2>
              <p>{isRegister ? "You're signed in and ready to go." : "You're signed in."}</p>
              <button className="submit" onClick={() => { setUser(null); setForm({ name: "", email: "", password: "", confirm: "", remember: false }); }}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button className="auth-tab" role="tab" aria-selected={!isRegister} onClick={() => switchMode("login")}>
                  Log in
                </button>
                <button className="auth-tab" role="tab" aria-selected={isRegister} onClick={() => switchMode("register")}>
                  Create account
                </button>
              </div>

              {formError && <div className="form-err" role="alert">{formError}</div>}

              <form onSubmit={submit} noValidate>
                {isRegister && (
                  <Field id="name" label="Full name" error={errors.name}>
                    <input id="name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
                  </Field>
                )}

                <Field id="email" label="Email" error={errors.email}>
                  <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
                </Field>

                <Field
                  id="password"
                  label="Password"
                  error={errors.password}
                  hint={isRegister ? "At least 8 characters. Mix letters, numbers and symbols." : undefined}
                >
                  <div className="input-wrap">
                    <input
                      id="password"
                      type={pwType}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      value={form.password}
                      onChange={set("password")}
                      aria-invalid={!!errors.password}
                      style={{ paddingRight: 64 }}
                    />
                    <button type="button" className="toggle" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  {isRegister && form.password && (
                    <div className="strength" aria-hidden="true">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={n <= score ? "on" : ""} />
                      ))}
                    </div>
                  )}
                </Field>

                {isRegister ? (
                  <Field id="confirm" label="Confirm password" error={errors.confirm}>
                    <input id="confirm" type={pwType} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} aria-invalid={!!errors.confirm} />
                  </Field>
                ) : (
                  <div className="row">
                    <label>
                      <input type="checkbox" checked={form.remember} onChange={set("remember")} /> Keep me signed in
                    </label>
                    <button type="button" className="link">Forgot password?</button>
                  </div>
                )}

                <button className="submit" type="submit" disabled={loading}>
                  {loading ? (isRegister ? "Creating account…" : "Logging in…") : isRegister ? "Create account" : "Log in"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}