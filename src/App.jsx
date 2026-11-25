import React, { useState, useEffect } from "react";

const ADMIN_EMAIL = "admin@expenseease.com";
const ADMIN_PASSWORD = "Admin@123";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const money = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function App() {
  const [users, setUsers] = useState(() => read("ee_users", []));
  const [current, setCurrent] = useState(() => read("ee_current", null));
  const [transactions, setTransactions] = useState([]);
  const [mode, setMode] = useState("login");
  const [page, setPage] = useState("Overview");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food"
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem("ee_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("ee_current", JSON.stringify(current));
  }, [current]);

  useEffect(() => {
    if (current?.role === "user") {
      setTransactions(
        read("ee_transactions_" + current.email, [])
      );
    } else {
      setTransactions([]);
    }
  }, [current]);

  useEffect(() => {
    if (current?.role === "user") {
      localStorage.setItem(
        "ee_transactions_" + current.email,
        JSON.stringify(transactions)
      );
    }
  }, [transactions, current]);

  const register = e => {
    e.preventDefault();

    if (users.some(u => u.email === email.toLowerCase())) {
      alert("An account with this email already exists.");
      return;
    }

    const newUser = {
      name,
      email: email.toLowerCase(),
      password,
      role: "user",
      active: true
    };

    const updated = [...users, newUser];

    setUsers(updated);
    setCurrent(newUser);
    setPage("Overview");
  };

  const login = e => {
    e.preventDefault();

    if (
      email.toLowerCase() === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      setCurrent({
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin"
      });
      return;
    }

    const found = users.find(
      u =>
        u.email === email.toLowerCase() &&
        u.password === password
    );

    if (!found) {
      alert("Invalid email or password.");
      return;
    }

    if (!found.active) {
      alert("Your account has been deactivated.");
      return;
    }

    setCurrent(found);
    setPage("Overview");
  };

  const logout = () => {
    setCurrent(null);
    setEmail("");
    setPassword("");
    setName("");
    setMode("login");
  };

  const addTransaction = e => {
    e.preventDefault();

    if (!form.title || Number(form.amount) <= 0) {
      alert("Enter a valid transaction and amount.");
      return;
    }

    const item = {
      id: Date.now(),
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: new Date().toLocaleDateString("en-IN")
    };

    setTransactions(prev => [item, ...prev]);

    setForm({
      title: "",
      amount: "",
      type: "expense",
      category: "Food"
    });

    setShowForm(false);
  };

  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTransactions = users.flatMap(user =>
    read("ee_transactions_" + user.email, []).map(t => ({
      ...t,
      owner: user.name,
      email: user.email
    }))
  );

  const totalIncome = allTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = allTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const deactivateUser = userEmail => {
    setUsers(prev =>
      prev.map(u =>
        u.email === userEmail
          ? { ...u, active: !u.active }
          : u
      )
    );
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f6fb",
      fontFamily: "Arial, sans-serif",
      color: "#202943"
    },
    card: {
      background: "white",
      padding: "25px",
      borderRadius: "15px",
      boxShadow: "0 4px 18px #0000000d",
      marginBottom: "20px"
    },
    button: {
      background: "#4169e1",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "11px 18px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px",
      margin: "8px 0 16px",
      border: "1px solid #dce1eb",
      borderRadius: "8px"
    }
  };

  if (!current) {
    return (
      <div style={{
        ...styles.page,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{
          ...styles.card,
          width: "100%",
          maxWidth: "420px"
        }}>
          <h1 style={{ color: "#4169e1" }}>
            ExpenseEase
          </h1>

          <p>Manage your money. Build better habits.</p>

          <h2>
            {mode === "login" ? "Welcome Back!" : "Create Account"}
          </h2>

          <form onSubmit={mode === "login" ? login : register}>
            {mode === "register" && (
              <>
                <label>Full Name</label>
                <input
                  style={styles.input}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </>
            )}

            <label>Email Address</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button
              style={{ ...styles.button, width: "100%" }}
              type="submit"
            >
              {mode === "login" ? "Login" : "Register"}
            </button>
          </form>

          <p style={{ marginTop: "20px" }}>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              style={{
                border: "none",
                background: "none",
                color: "#4169e1",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              {mode === "login" ? " Register" : " Login"}
            </button>
          </p>

          <hr />

          <p style={{ fontSize: "13px", color: "#777" }}>
            Admin demo login:<br />
            Email: {ADMIN_EMAIL}<br />
            Password: {ADMIN_PASSWORD}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={{
        background: "#202d50",
        color: "white",
        padding: "18px 5%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <h2>💰 ExpenseEase</h2>

        <div>
          {current.name} &nbsp; | &nbsp;
          {current.role === "admin" ? "Admin Portal" : "User Portal"}

          <button
            onClick={logout}
            style={{
              ...styles.button,
              background: "#e05252",
              marginLeft: "15px"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {current.role === "admin" ? (
        <main style={{ padding: "30px 5%" }}>
          <h1>Admin Dashboard</h1>
          <p>Monitor and manage the ExpenseEase platform.</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "20px",
            marginTop: "25px"
          }}>
            {[
              ["Registered Users", users.length],
              ["Total Transactions", allTransactions.length],
              ["Platform Income", money(totalIncome)],
              ["Platform Expenses", money(totalExpenses)]
            ].map(([label, value]) => (
              <div key={label} style={styles.card}>
                <p>{label}</p>
                <h2>{value}</h2>
              </div>
            ))}
          </div>

          <section style={styles.card}>
            <h2>Registered Users</h2>

            {users.length === 0 ? (
              <p>No registered users yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table width="100%" cellPadding="12">
                  <thead>
                    <tr>
                      <th align="left">Name</th>
                      <th align="left">Email</th>
                      <th align="left">Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map(user => (
                      <tr key={user.email}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          {user.active ? "Active" : "Inactive"}
                        </td>
                        <td>
                          <button
                            style={{
                              ...styles.button,
                              background: user.active
                                ? "#e05252"
                                : "#22a06b"
                            }}
                            onClick={() => deactivateUser(user.email)}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={styles.card}>
            <h2>Platform Transactions</h2>

            {allTransactions.length === 0 ? (
              <p>No transactions recorded yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table width="100%" cellPadding="12">
                  <thead>
                    <tr>
                      <th align="left">User</th>
                      <th align="left">Transaction</th>
                      <th align="left">Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {allTransactions.map(t => (
                      <tr key={t.id}>
                        <td>{t.owner}</td>
                        <td>{t.title}</td>
                        <td>{t.category}</td>
                        <td>{t.type}</td>
                        <td>{money(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      ) : (
        <>
          <nav style={{
            background: "white",
            padding: "15px 5%",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap"
          }}>
            {["Overview", "Transactions"].map(item => (
              <button
                key={item}
                onClick={() => setPage(item)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: page === item ? "#4169e1" : "#555",
                  fontWeight: "bold"
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <main style={{ padding: "30px 5%" }}>
            <h1>Welcome, {current.name}! 👋</h1>
            <p>Your personal finance dashboard.</p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: "20px",
              marginTop: "25px"
            }}>
              {[
                ["Total Balance", money(income - expenses)],
                ["Total Income", money(income)],
                ["Total Expenses", money(expenses)],
                ["Transactions", transactions.length]
              ].map(([label, value]) => (
                <div key={label} style={styles.card}>
                  <p>{label}</p>
                  <h2>{value}</h2>
                </div>
              ))}
            </div>

            {page === "Overview" && (
              <section style={styles.card}>
                <h2>Financial Summary</h2>
                <p>Income: {money(income)}</p>
                <p>Expenses: {money(expenses)}</p>
                <p>Available balance: {money(income - expenses)}</p>

                <button
                  style={styles.button}
                  onClick={() => setShowForm(true)}
                >
                  + Add Transaction
                </button>
              </section>
            )}

            {page === "Transactions" && (
              <section style={styles.card}>
                <h2>My Transactions</h2>

                <button
                  style={styles.button}
                  onClick={() => setShowForm(true)}
                >
                  + Add Transaction
                </button>

                {transactions.length === 0 ? (
                  <p style={{ marginTop: "20px" }}>
                    No transactions yet. Add your first transaction!
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table width="100%" cellPadding="12">
                      <thead>
                        <tr>
                          <th align="left">Name</th>
                          <th align="left">Category</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {transactions.map(t => (
                          <tr key={t.id}>
                            <td>{t.title}</td>
                            <td>{t.category}</td>
                            <td>{t.date}</td>
                            <td>{t.type}</td>
                            <td>{money(t.amount)}</td>
                            <td>
                              <button
                                onClick={() =>
                                  setTransactions(prev =>
                                    prev.filter(x => x.id !== t.id)
                                  )
                                }
                                style={{
                                  ...styles.button,
                                  background: "#e05252"
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </main>
        </>
      )}

      {showForm && current.role === "user" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#0008",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <form
            onSubmit={addTransaction}
            style={{
              ...styles.card,
              width: "100%",
              maxWidth: "400px"
            }}
          >
            <h2>Add Transaction</h2>

            <label>Transaction Name</label>
            <input
              style={styles.input}
              value={form.title}
              onChange={e =>
                setForm({ ...form, title: e.target.value })
              }
              required
            />

            <label>Amount (₹)</label>
            <input
              style={styles.input}
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={e =>
                setForm({ ...form, amount: e.target.value })
              }
              required
            />

            <label>Transaction Type</label>
            <select
              style={styles.input}
              value={form.type}
              onChange={e =>
                setForm({
                  ...form,
                  type: e.target.value,
                  category: e.target.value === "income"
                    ? "Salary"
                    : "Food"
                })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <label>Category</label>
            <select
              style={styles.input}
              value={form.category}
              onChange={e =>
                setForm({ ...form, category: e.target.value })
              }
            >
              {(form.type === "income"
                ? ["Salary", "Business", "Other Income"]
                : ["Food", "Shopping", "Transport", "Bills", "Health", "Entertainment", "Other"]
              ).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <button
              style={{ ...styles.button, marginRight: "10px" }}
              type="submit"
            >
              Save
            </button>

            <button
              style={{
                ...styles.button,
                background: "#777"
              }}
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <footer style={{
        textAlign: "center",
        padding: "25px",
        color: "#777"
      }}>
        © 2026 ExpenseEase | Personal Finance Management
      </footer>
    </div>
  );
}
