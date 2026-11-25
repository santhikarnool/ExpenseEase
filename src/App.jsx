import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, TrendingUp, TrendingDown,
  PiggyBank, Target, Bell, Search, Plus, MoreHorizontal, Utensils,
  ShoppingBag, Car, Receipt, HeartPulse, Film, Briefcase, X, Menu,
  ChevronRight, LogOut, Users, Trash2, Pencil, CalendarDays, AlertTriangle,
  CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";

const ADMIN_EMAIL = "admin@expenseease.com";
const ADMIN_PASSWORD = "Admin@123";
const COLORS = ["#4169e1", "#22a477", "#f0a34a", "#8b6bd6", "#e16b78", "#8390a4"];

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});
const iconFor = category => ({
  Food: Utensils, Shopping: ShoppingBag, Transport: Car, Bills: Receipt,
  Health: HeartPulse, Healthcare: HeartPulse, Entertainment: Film,
  Salary: Briefcase, Business: Briefcase
}[category] || Wallet);

const monthKey = dateText => {
  if (!dateText) return "";
  // Stored dates use en-IN format: DD/MM/YYYY.
  const parts = String(dateText).split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, "0")}`;
  const d = new Date(dateText);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};
const toInputDate = dateText => {
  if (!dateText) return new Date().toISOString().slice(0,10);
  const parts = String(dateText).split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  return String(dateText).slice(0,10);
};
const toStoredDate = inputDate => {
  const [y,m,d] = inputDate.split("-");
  return `${d}/${m}/${y}`;
};
const monthLabel = key => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const recentMonths = () => {
  const now = new Date();
  return Array.from({length: 6}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
};

function Auth({ mode, setMode, onLogin, onRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = e => {
    e.preventDefault();
    mode === "login" ? onLogin(email, password) : onRegister(name, email, password);
  };
  return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f5f7fb",padding:20,fontFamily:"'DM Sans',sans-serif"}}>
    <form onSubmit={submit} style={{background:"#fff",width:"min(420px,100%)",padding:34,borderRadius:16,boxShadow:"0 12px 40px #172b5512"}}>
      <div style={{fontSize:28,fontWeight:800,color:"#4169e1",fontFamily:"Manrope,sans-serif"}}>ExpenseEase</div>
      <p style={{color:"#8290a5",fontSize:13,marginTop:7}}>Manage your money. Build better habits.</p>
      <h2 style={{color:"#1d2b47",margin:"28px 0 20px"}}>{mode === "login" ? "Welcome Back!" : "Create Account"}</h2>
      {mode === "register" && <label style={labelStyle}>Full Name<input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} required /></label>}
      <label style={labelStyle}>Email Address<input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label style={labelStyle}>Password<input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      <button className="btn primary" style={{width:"100%",padding:13,marginTop:8}}>{mode === "login" ? "Login" : "Register"}</button>
      <p style={{fontSize:12,color:"#8290a5",textAlign:"center",marginTop:20}}>
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        <button type="button" onClick={()=>setMode(mode==="login"?"register":"login")} style={{border:0,background:"none",color:"#4169e1",fontWeight:700,cursor:"pointer",marginLeft:5}}>{mode==="login"?"Register":"Login"}</button>
      </p>
      <div style={{borderTop:"1px solid #e9edf4",paddingTop:14,fontSize:10,color:"#98a3b3",lineHeight:1.7}}>
        Admin demo login: {ADMIN_EMAIL}<br/>Password: {ADMIN_PASSWORD}
      </div>
    </form>
  </div>;
}
const labelStyle = {display:"grid",gap:7,fontSize:11,fontWeight:700,color:"#64748b",marginBottom:14};
const inputStyle = {width:"100%",padding:11,border:"1px solid #e0e6ef",borderRadius:7,outline:"none",fontSize:12,marginTop:2};

export default function App() {
  const [users,setUsers] = useState(()=>read("ee_users",[]));
  const [current,setCurrent] = useState(()=>read("ee_current",null));
  const [transactions,setTransactions] = useState([]);
  const [loadedEmail,setLoadedEmail] = useState(null);
  const [authMode,setAuthMode] = useState("login");
  const [page,setPage] = useState("Overview");
  const [showForm,setShowForm] = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [search,setSearch] = useState("");
  const [selectedMonth,setSelectedMonth] = useState(recentMonths()[5]);
  const [form,setForm] = useState({title:"",amount:"",type:"expense",category:"Food",date:new Date().toISOString().slice(0,10)});
  const [budget,setBudget] = useState(()=>read("ee_budget",5000));
  const [budgetDraft,setBudgetDraft] = useState(()=>read("ee_budget",5000));
  const [goal,setGoal] = useState(()=>read("ee_goal",{name:"Emergency Fund",target:20000,saved:0}));
  const [goalDraft,setGoalDraft] = useState(()=>read("ee_goal",{name:"Emergency Fund",target:20000,saved:0}));

  useEffect(()=>localStorage.setItem("ee_users",JSON.stringify(users)),[users]);
  useEffect(()=>localStorage.setItem("ee_current",JSON.stringify(current)),[current]);
  useEffect(()=>{
    if(current?.role==="user"){
      setTransactions(read("ee_transactions_"+current.email,[]));
      setLoadedEmail(current.email);
    } else {
      setTransactions([]);
      setLoadedEmail(null);
    }
  },[current]);
  useEffect(()=>{
    if(current?.role==="user" && loadedEmail===current.email){
      localStorage.setItem("ee_transactions_"+current.email,JSON.stringify(transactions));
    }
  },[transactions,current,loadedEmail]);

  const login=(email,password)=>{
    if(email.toLowerCase()===ADMIN_EMAIL&&password===ADMIN_PASSWORD){setCurrent({name:"Administrator",email:ADMIN_EMAIL,role:"admin"});return;}
    const found=users.find(u=>u.email===email.toLowerCase()&&u.password===password);
    if(!found){alert("Invalid email or password.");return;}
    if(!found.active){alert("Your account has been deactivated.");return;}
    setCurrent(found);setPage("Overview");
    const savedBudget=read("ee_budget_"+found.email,read("ee_budget",5000));
    const savedGoal=read("ee_goal_"+found.email,read("ee_goal",{name:"Emergency Fund",target:20000,saved:0}));
    setBudget(savedBudget);setBudgetDraft(savedBudget);setGoal(savedGoal);setGoalDraft(savedGoal);
  };
  const register=(name,email,password)=>{
    if(users.some(u=>u.email===email.toLowerCase())){alert("An account with this email already exists.");return;}
    const user={name,email:email.toLowerCase(),password,role:"user",active:true};
    setUsers(prev=>[...prev,user]);setCurrent(user);setPage("Overview");
    setTransactions([]);
  };
  const logout=()=>{setCurrent(null);setAuthMode("login");setPage("Overview");};
  const openAdd=()=>{
    setEditingId(null);
    setForm({title:"",amount:"",type:"expense",category:"Food",date:new Date().toISOString().slice(0,10)});
    setShowForm(true);
  };
  const openEdit=t=>{
    setEditingId(t.id);
    setForm({title:t.title,amount:String(t.amount),type:t.type,category:t.category,date:toInputDate(t.date)});
    setShowForm(true);
  };
  const saveTransaction=e=>{
    e.preventDefault();
    if(!form.title.trim()||Number(form.amount)<=0){alert("Enter a valid transaction and amount.");return;}
    if(editingId!==null){
      setTransactions(prev=>prev.map(t=>t.id===editingId?{...t,title:form.title.trim(),amount:Number(form.amount),type:form.type,category:form.category,date:toStoredDate(form.date)}:t));
    } else {
      setTransactions(prev=>[{id:Date.now(),title:form.title.trim(),amount:Number(form.amount),type:form.type,category:form.category,date:toStoredDate(form.date)},...prev]);
    }
    setShowForm(false);setEditingId(null);
  };
  const saveBudget=()=>{
    const value=Number(budgetDraft);
    if(!Number.isFinite(value)||value<=0){alert("Enter a budget greater than zero.");return;}
    setBudget(value);
    localStorage.setItem("ee_budget_"+current.email,JSON.stringify(value));
    alert("Monthly budget saved!");
  };
  const saveGoal=()=>{
    const value={...goalDraft,target:Number(goalDraft.target),saved:Number(goalDraft.saved)};
    if(!value.name.trim()||value.target<=0||value.saved<0){alert("Please enter a valid goal name and amounts.");return;}
    setGoal(value);
    localStorage.setItem("ee_goal_"+current.email,JSON.stringify(value));
    alert("Savings goal saved!");
  };

  const months=useMemo(recentMonths,[]);
  const monthTransactions=transactions.filter(t=>monthKey(t.date)===selectedMonth);
  const income=monthTransactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses=monthTransactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance=income-expenses;
  const budgetPercent=budget>0?expenses/budget*100:0;
  const budgetWarning=budgetPercent>=100?"exceeded":budgetPercent>=80?"warning":"safe";
  const allTransactions=users.flatMap(u=>read("ee_transactions_"+u.email,[]).map(t=>({...t,owner:u.name,email:u.email})));
  const totalIncome=allTransactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpenses=allTransactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const filtered=transactions.filter(t=>(t.title+" "+t.category+" "+t.type).toLowerCase().includes(search.toLowerCase()));
  const categories=useMemo(()=>Object.entries(monthTransactions.filter(t=>t.type==="expense").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).map(([name,value])=>({name,value})),[transactions,selectedMonth]);
  const historyData=months.map(key=>{
    const rows=transactions.filter(t=>monthKey(t.date)===key);
    return {month:new Date(Number(key.slice(0,4)),Number(key.slice(5,7))-1,1).toLocaleDateString("en-IN",{month:"short"}),Income:rows.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),Expenses:rows.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)};
  });
  const toggleUser=email=>setUsers(prev=>prev.map(u=>u.email===email?{...u,active:!u.active}:u));

  if(!current)return <Auth mode={authMode} setMode={setAuthMode} onLogin={login} onRegister={register}/>;

  const admin=current.role==="admin";
  const nav=admin?[["Overview",LayoutDashboard],["Users",Users],["Transactions",ArrowLeftRight]]:[["Overview",LayoutDashboard],["Transactions",ArrowLeftRight],["Budgets",Wallet],["Savings Goals",Target]];
  const go=p=>{setPage(p);setMobileOpen(false);};
  const stat=(title,value,Icon,tone,foot)=> <div className="stat-card">
    <div className="stat-top"><span>{title}</span><span className={"stat-icon "+(tone||"")}><Icon size={15}/></span></div>
    <h2>{value}</h2><div className="stat-foot">{foot}</div>
  </div>;
  const transactionTable=(items,adminMode=false)=><div className="table-wrap"><table><thead><tr>{adminMode&&<th>USER</th>}<th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>TYPE</th><th style={{textAlign:"right"}}>AMOUNT</th>{!adminMode&&<th>ACTION</th>}</tr></thead><tbody>
    {items.map(t=>{const Icon=iconFor(t.category);return <tr key={t.id}>{adminMode&&<td>{t.owner}</td>}<td><div className="transaction-name"><span className="transaction-icon"><Icon size={14}/></span><strong>{t.title}</strong></div></td><td><span className="category-tag">{t.category}</span></td><td className="date-cell">{t.date}</td><td>{t.type}</td><td className={t.type==="income"?"amount income-amount":"amount"}>{t.type==="income"?"+":"−"}{money(t.amount)}</td>{!adminMode&&<td><div className="transaction-action-buttons"><button className="more-btn edit-btn" title="Edit transaction" onClick={()=>openEdit(t)}><Pencil size={14}/></button><button className="more-btn delete-btn" title="Delete transaction" onClick={()=>{if(window.confirm("Delete this transaction?"))setTransactions(prev=>prev.filter(x=>x.id!==t.id));}}><Trash2 size={14}/></button></div></td>}</tr>})}
    {!items.length&&<tr><td colSpan={adminMode?6:7} className="empty">No transactions found for this period.</td></tr>}</tbody></table></div>;

  return <div className="app-shell">
    {mobileOpen&&<div className="overlay" onClick={()=>setMobileOpen(false)}/>}
    <aside className={"sidebar "+(mobileOpen?"open":"")}>
      <div className="brand"><span className="brand-mark">E</span>ExpenseEase</div>
      <button className="nav-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button>
      <div className="nav-label">MENU</div>
      <nav>{nav.map(([item,Icon])=><button key={item} className={"nav-item "+(page===item?"active":"")} onClick={()=>go(item)}><Icon size={16}/>{item}</button>)}</nav>
      <div className="sidebar-bottom">
        {!admin&&<div className="upgrade"><div className="upgrade-icon"><PiggyBank size={15}/></div><strong>Build better habits</strong><p>Keep an eye on your spending and make progress toward your goals.</p><button onClick={()=>go("Savings Goals")}>View savings goal <ChevronRight size={12}/></button></div>}
        <div className="profile"><div className="avatar">{(current.name||"U").slice(0,2).toUpperCase()}</div><div><strong>{current.name}</strong><small>{admin?"Administrator":"Personal account"}</small></div><button className="more-btn" onClick={logout} title="Logout"><LogOut size={15}/></button></div>
      </div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <button className="menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={19}/></button>
        <div className="breadcrumb">ExpenseEase <span>/</span> <strong>{admin?"Admin": "My Finance"} · {page}</strong></div>
        <div className="top-actions"><button className="icon-btn notification"><Bell size={17}/><i/></button><div className="avatar top-avatar">{(current.name||"U").slice(0,2).toUpperCase()}</div></div>
      </header>
      <main className="content">
        <div className="page-heading"><div><p className="eyebrow">{admin?"PLATFORM MANAGEMENT":"PERSONAL FINANCE"}</p><h1>{admin?"Admin Dashboard":page==="Overview"?`Welcome back, ${current.name}`:page}</h1><p className="subtitle">{admin?"Monitor and manage the ExpenseEase platform.":"Here's your financial snapshot at a glance."}</p></div>
          {!admin&&<div className="heading-actions"><button className="btn secondary" onClick={()=>go("Transactions")}><ArrowLeftRight size={14}/> Transactions</button><button className="btn primary" onClick={openAdd}><Plus size={14}/> Add transaction</button></div>}
        </div>
        {admin?<>
          <div className="stats-grid">{stat("Registered Users",users.length,Users,"purple","Accounts on the platform")}{stat("Total Transactions",allTransactions.length,ArrowLeftRight,"","Across all users")}{stat("Platform Income",money(totalIncome),TrendingUp,"green","Recorded income")}{stat("Platform Expenses",money(totalExpenses),TrendingDown,"red","Recorded expenses")}</div>
          <section className="panel transactions-panel"><div className="panel-header transaction-header"><div><h3>Registered Users</h3><p>Manage user access and account status</p></div></div><div className="table-wrap"><table><thead><tr><th>NAME</th><th>EMAIL</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{users.map(u=><tr key={u.email}><td><strong>{u.name}</strong></td><td>{u.email}</td><td><span className="category-tag">{u.active?"Active":"Inactive"}</span></td><td><button className="btn secondary" onClick={()=>toggleUser(u.email)}>{u.active?"Deactivate":"Activate"}</button></td></tr>)}{!users.length&&<tr><td colSpan="4" className="empty">No registered users yet.</td></tr>}</tbody></table></div></section>
          <section className="panel transactions-panel"><div className="panel-header"><div><h3>Platform Transactions</h3><p>Recent activity from all registered users</p></div></div>{transactionTable(allTransactions,true)}</section>
        </>:<>
          {page==="Overview"&&<>
            <div className="month-filter-row"><label htmlFor="overview-month">Showing financial activity for</label><select id="overview-month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>{months.slice().reverse().map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select></div>
            <div className="stats-grid">
              <div className="stat-card balance-card"><div className="stat-top"><span>Total Balance</span><span className="stat-icon"><Wallet size={15}/></span></div><h2>{money(balance)}</h2><div className="stat-foot"><span className={"trend "+(balance>=0?"positive":"negative")}>{balance>=0?"↑":"↓"} {balance>=0?"You're in a positive balance":"Expenses exceed income"}</span></div><div className="balance-decoration"/></div>
              {stat("Total Income",money(income),TrendingUp,"green","Money received")}
              {stat("Total Expenses",money(expenses),TrendingDown,"red","Money spent")}
              {stat("Transactions",monthTransactions.length,ArrowLeftRight,"purple","This month's activity")}
            </div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-header"><div><h3>Income vs Expenses — Last 6 Months</h3><p>Compare your monthly financial activity</p></div></div>
                <div className="chart-legend"><span><i className="legend-dot income-dot"/>Income</span><span><i className="legend-dot expense-dot"/>Expenses</span></div>
                <div className="area-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historyData}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4169e1" stopOpacity={.22}/><stop offset="100%" stopColor="#4169e1" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8390a4" stopOpacity={.18}/><stop offset="100%" stopColor="#8390a4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" tick={{fontSize:9,fill:"#98a3b3"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:9,fill:"#98a3b3"}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>money(v)}/><Area type="monotone" dataKey="Income" stroke="#4169e1" fill="url(#incomeFill)" strokeWidth={2}/><Area type="monotone" dataKey="Expenses" stroke="#8390a4" fill="url(#expenseFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
              </section>
              <section className="panel category-panel"><div className="panel-header"><div><h3>Spending by Category</h3><p>{monthLabel(selectedMonth)} spending</p></div></div>
                <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>{categories.map((c,i)=><Cell key={c.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(expenses)}</strong><small>Total spent</small></div></div>
                <div className="category-legend">{categories.length?categories.map((c,i)=><div key={c.name}><span><i style={{background:COLORS[i%COLORS.length]}}/>{c.name}</span><strong>{money(c.value)}</strong></div>):<div>No spending data for this month</div>}</div>
              </section>
            </div>
            <section className="panel transactions-panel"><div className="panel-header transaction-header"><div><h3>Recent Transactions</h3><p>Your latest income and expenses</p></div><button className="text-btn" onClick={()=>go("Transactions")}>View all <ChevronRight size={13}/></button></div>{transactionTable(transactions.slice(0,5))}</section>
            <div className="bottom-grid">
              <section className="panel"><div className="panel-header"><div><h3>Monthly Budget</h3><p>Track your spending limit</p></div><Wallet size={17} color="#4169e1"/></div><div className="budget-total"><strong>{money(expenses)}</strong><span>of {money(budget)} spent</span></div><div className={"progress "+(budgetWarning==="exceeded"?"progress-danger":budgetWarning==="warning"?"progress-warning":"")}><div style={{width:Math.min(100,budgetPercent)+"%"}}/></div><div className="budget-foot"><span>{Math.round(budgetPercent)}% used</span><span>{money(Math.max(0,budget-expenses))} remaining</span></div>
                {budgetWarning==="exceeded"?<div className="budget-alert danger"><AlertTriangle size={15}/> Budget exceeded by {money(expenses-budget)}. Try reducing your spending.</div>:budgetWarning==="warning"?<div className="budget-alert warning"><AlertTriangle size={15}/> Warning: You're approaching your budget limit.</div>:<div className="budget-alert safe"><CheckCircle2 size={15}/> You're within your budget!</div>}
                <button className="text-btn" style={{marginTop:12}} onClick={()=>go("Budgets")}>Edit budget <ChevronRight size={12}/></button></section>
              <section className="panel"><div className="panel-header"><div><h3>{goal.name}</h3><p>Your savings goal</p></div><span className="goal-icon"><Target size={16}/></span></div><div className="goal-amount"><strong>{money(goal.saved)}</strong><span>of {money(goal.target)}</span></div><div className="progress goal-progress"><div style={{width:Math.min(100,goal.target?goal.saved/goal.target*100:0)+"%"}}/></div><div className="budget-foot"><span>{Math.round(goal.target?goal.saved/goal.target*100:0)}% completed</span><span>{money(Math.max(0,goal.target-goal.saved))} to go</span></div><button className="text-btn" style={{marginTop:15}} onClick={()=>go("Savings Goals")}>Update goal <ChevronRight size={12}/></button></section>
            </div>
          </>}
          {page==="Transactions"&&<section className="panel transactions-panel"><div className="panel-header transaction-header"><div><h3>All Transactions</h3><p>Review, edit and manage your activity</p></div><div className="transaction-actions"><div className="search-box"><Search size={13}/><input placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="btn primary" onClick={openAdd}><Plus size={13}/> Add</button></div></div>{transactionTable(filtered)}</section>}
          {page==="Budgets"&&<section className="panel"><div className="panel-header"><div><h3>Monthly Budget</h3><p>Set and save a spending limit for yourself</p></div></div><div className="budget-row"><label style={labelStyle}>Monthly spending limit<input className="budget-input" type="number" min="1" value={budgetDraft} onChange={e=>setBudgetDraft(e.target.value)}/></label><div className="budget-total"><strong>{money(expenses)}</strong><span>spent this month of {money(budget)}</span></div><div className={"progress "+(budgetWarning==="exceeded"?"progress-danger":budgetWarning==="warning"?"progress-warning":"")}><div style={{width:Math.min(100,budgetPercent)+"%"}}/></div><div className="budget-foot"><span>{Math.round(budgetPercent)}% used</span><span>{money(Math.max(0,budget-expenses))} remaining</span></div>
              {budgetWarning==="exceeded"?<div className="budget-alert danger"><AlertTriangle size={15}/> Budget limit exceeded by {money(expenses-budget)}.</div>:budgetWarning==="warning"?<div className="budget-alert warning"><AlertTriangle size={15}/> Warning: You're approaching your budget limit.</div>:<div className="budget-alert safe"><CheckCircle2 size={15}/> You're within your budget.</div>}
              <button className="btn primary save-settings-btn" onClick={saveBudget}>Save Budget</button></div></section>}
          {page==="Savings Goals"&&<section className="panel"><div className="panel-header"><div><h3>Savings Goal</h3><p>Edit your target and save your changes when ready</p></div><Target size={18} color="#4169e1"/></div><div className="goal-edit-form"><label>Goal name<input value={goalDraft.name} onChange={e=>setGoalDraft({...goalDraft,name:e.target.value})}/></label><label>Target amount (₹)<input type="number" min="1" value={goalDraft.target} onChange={e=>setGoalDraft({...goalDraft,target:e.target.value})}/></label><label>Amount saved (₹)<input type="number" min="0" value={goalDraft.saved} onChange={e=>setGoalDraft({...goalDraft,saved:e.target.value})}/></label></div><div className="goal-amount"><strong>{money(goalDraft.saved)}</strong><span>of {money(goalDraft.target)}</span></div><div className="progress goal-progress"><div style={{width:Math.min(100,goalDraft.target?goalDraft.saved/goalDraft.target*100:0)+"%"}}/></div><button className="btn primary save-settings-btn" onClick={saveGoal}>Save Goal</button></section>}
        </>}
        <footer>© 2026 ExpenseEase <span>Personal Finance Management</span></footer>
      </main>
    </div>
    {showForm&&!admin&&<div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>{editingId!==null?"Edit Transaction":"Add Transaction"}</h2><button className="more-btn" onClick={()=>{setShowForm(false);setEditingId(null);}}><X size={18}/></button></div><form onSubmit={saveTransaction}>
      <label>Transaction name<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="e.g. Groceries"/></label>
      <label>Amount (₹)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label>
      <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label>
      <label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:e.target.value==="income"?"Salary":"Food"})}><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{(form.type==="income"?["Salary","Business","Other Income"]:["Food","Shopping","Transport","Bills","Health","Entertainment","Other"]).map(c=><option key={c}>{c}</option>)}</select></label>
      <div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>{setShowForm(false);setEditingId(null);}}>Cancel</button><button className="btn primary" type="submit">{editingId!==null?"Save Changes":"Save transaction"}</button></div>
    </form></div></div>}
  </div>;
}
