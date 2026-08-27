import React, { useState, useEffect } from "react";

export default function PremiumBudgetApp() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [profileTab, setProfileTab] = useState("categories");
  const [activeModal, setActiveModal] = useState(null); // 'expense', 'income', 'editCategory', 'editBill', 'editIncome'
  const [editingItem, setEditingItem] = useState(null);

  // --- Persistent State Management ---
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedCategories = JSON.parse(
      localStorage.getItem("budget_categories")
    ) || [
      { id: 1, name: "Groceries", budget: 300 },
      { id: 2, name: "Entertainment", budget: 150 },
    ];
    const savedBills = JSON.parse(localStorage.getItem("budget_bills")) || [
      {
        id: 1,
        name: "Apartment Lease",
        amount: 1200,
        dueDate: 1,
        isAutopay: true,
        isLoan: false,
        loanBalance: 0,
      },
    ];
    const savedIncomes = JSON.parse(localStorage.getItem("budget_incomes")) || [
      {
        id: 1,
        name: "Synergy Fiber Salary",
        type: "recurring",
        amount: 2500,
        nextDate: "2026-09-04",
        frequency: "bi-weekly",
      },
      {
        id: 2,
        name: "EPIC Media Projects",
        type: "one-time",
        amount: 400,
        nextDate: "2026-08-30",
        frequency: "none",
      },
    ];
    const savedExpenses =
      JSON.parse(localStorage.getItem("budget_expenses")) || [];

    setCategories(savedCategories);
    setBills(savedBills);
    setIncomes(savedIncomes);
    setExpenses(savedExpenses);
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("budget_categories", JSON.stringify(categories));
      localStorage.setItem("budget_bills", JSON.stringify(bills));
      localStorage.setItem("budget_incomes", JSON.stringify(incomes));
      localStorage.setItem("budget_expenses", JSON.stringify(expenses));
    }
  }, [categories, bills, incomes, expenses, isLoaded]);

  // --- Calculations ---
  const getNextPayday = () => {
    const recurring = incomes.filter((i) => i.type === "recurring");
    if (recurring.length === 0) return null;
    const today = new Date();
    let closestDays = Infinity;
    recurring.forEach((inc) => {
      const payDate = new Date(inc.nextDate);
      const diffDays = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < closestDays) closestDays = diffDays;
    });
    return closestDays === Infinity ? 0 : closestDays;
  };
  const daysUntilPayday = getNextPayday();

  // --- Handlers: Creating & Updating ---
  const handleSaveExpense = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        amount: parseFloat(form.get("amount")),
        categoryId: parseInt(form.get("category")),
        date: new Date().toISOString(),
        note: form.get("note"),
      },
    ]);
    setActiveModal(null);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    if (editingItem) {
      setCategories(
        categories.map((c) =>
          c.id === editingItem.id
            ? {
                ...c,
                name: form.get("name"),
                budget: parseFloat(form.get("budget")),
              }
            : c
        )
      );
    } else {
      setCategories([
        ...categories,
        {
          id: Date.now(),
          name: form.get("name"),
          budget: parseFloat(form.get("budget")),
        },
      ]);
    }
    closeModal();
  };

  const handleSaveBill = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const isLoan = form.get("isLoan") === "on";
    const billData = {
      id: editingItem ? editingItem.id : Date.now(),
      name: form.get("name"),
      amount: parseFloat(form.get("amount")),
      dueDate: parseInt(form.get("dueDate")),
      isAutopay: form.get("isAutopay") === "on",
      isLoan: isLoan,
      loanBalance: isLoan ? parseFloat(form.get("loanBalance")) : 0,
    };
    if (editingItem)
      setBills(bills.map((b) => (b.id === editingItem.id ? billData : b)));
    else setBills([...bills, billData]);
    closeModal();
  };

  const handleSaveIncome = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const incomeData = {
      id: editingItem ? editingItem.id : Date.now(),
      name: form.get("name"),
      type: form.get("type"),
      amount: parseFloat(form.get("amount")),
      nextDate: form.get("nextDate"),
      frequency: form.get("frequency") || "none",
    };
    if (editingItem)
      setIncomes(
        incomes.map((i) => (i.id === editingItem.id ? incomeData : i))
      );
    else setIncomes([...incomes, incomeData]);
    closeModal();
  };

  // --- Handlers: Deleting ---
  const handleDelete = (type, id) => {
    if (type === "category")
      setCategories(categories.filter((c) => c.id !== id));
    if (type === "bill") setBills(bills.filter((b) => b.id !== id));
    if (type === "income") setIncomes(incomes.filter((i) => i.id !== id));
    closeModal();
  };

  const openEditModal = (type, item) => {
    setEditingItem(item);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => setEditingItem(null), 200); // Wait for animation
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-fuchsia-300">
      {/* HEADER - Glassmorphism */}
      <header className="bg-white/70 backdrop-blur-md px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-20 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 tracking-tight">
            Flux Budget
          </h1>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-full shadow-inner border border-slate-200">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
              currentView === "dashboard"
                ? "bg-white shadow-sm text-violet-600 scale-105"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView("profile")}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
              currentView === "profile"
                ? "bg-white shadow-sm text-violet-600 scale-105"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Profile
          </button>
        </div>
      </header>

      <main className="p-5 max-w-md mx-auto space-y-8 relative">
        {/* ================= DASHBOARD VIEW ================= */}
        {currentView === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 rounded-3xl p-7 text-white shadow-[0_20px_40px_-15px_rgba(147,51,234,0.5)] relative overflow-hidden transition-transform hover:scale-[1.02] duration-300">
              <div className="relative z-10">
                <p className="text-violet-200 font-semibold tracking-wide text-sm uppercase mb-1">
                  Next Payday In
                </p>
                {daysUntilPayday !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter drop-shadow-md">
                      {daysUntilPayday}
                    </span>
                    <span className="text-2xl font-bold opacity-90">Days</span>
                  </div>
                ) : (
                  <p className="text-xl font-bold">No recurring income</p>
                )}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-2xl rounded-full"></div>
              <div className="absolute bottom-0 right-10 w-24 h-24 bg-fuchsia-400/30 blur-xl rounded-full"></div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setActiveModal("expense");
                  setEditingItem(null);
                }}
                className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95"
              >
                <div className="bg-rose-100 text-rose-500 p-4 rounded-2xl text-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  💸
                </div>
                <span className="font-bold text-sm text-slate-700">
                  Log Expense
                </span>
              </button>
              <button
                onClick={() => openEditModal("editIncome", null)}
                className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95"
              >
                <div className="bg-emerald-100 text-emerald-500 p-4 rounded-2xl text-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  💵
                </div>
                <span className="font-bold text-sm text-slate-700">
                  Add Income
                </span>
              </button>
            </div>

            {/* Visual Budgets */}
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-5 tracking-tight">
                Active Budgets
              </h3>
              <div className="space-y-5">
                {categories.map((cat) => {
                  const spent = expenses
                    .filter((e) => e.categoryId === cat.id)
                    .reduce((s, e) => s + e.amount, 0);
                  const remaining = cat.budget - spent;
                  const percent = Math.min((spent / cat.budget) * 100, 100);
                  const isOver = spent > cat.budget;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-200 transition-colors"
                    >
                      <div className="flex justify-between items-end mb-3">
                        <span className="font-bold text-slate-700 text-lg">
                          {cat.name}
                        </span>
                        <span
                          className={`font-black text-lg ${
                            isOver ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          ${remaining.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isOver
                              ? "bg-rose-500"
                              : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className="text-xs font-semibold text-slate-400">
                          ${spent.toFixed(2)} spent
                        </p>
                        <p className="text-xs font-semibold text-slate-400">
                          of ${cat.budget}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= PROFILE VIEW ================= */}
        {currentView === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Mac-Style Segmented Control */}
            <div className="bg-slate-200/60 p-1.5 rounded-2xl flex w-full">
              {["categories", "bills", "income"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                    profileTab === tab
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List Views */}
            <div className="space-y-4">
              <button
                onClick={() =>
                  openEditModal(
                    `edit${
                      profileTab.charAt(0).toUpperCase() +
                      profileTab.slice(1).replace(/ies$/, "y")
                    }`,
                    null
                  )
                }
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
              >
                + Add New {profileTab.replace(/ies$/, "y")}
              </button>

              {profileTab === "categories" &&
                categories.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openEditModal("editCategory", c)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-violet-200 transition-all active:scale-95"
                  >
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-bold text-sm">
                      ${c.budget}
                    </span>
                  </div>
                ))}

              {profileTab === "bills" &&
                bills.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openEditModal("editBill", b)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 transition-all active:scale-95"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-800">{b.name}</span>
                      <span className="font-black text-rose-500">
                        ${b.amount}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        Due: {b.dueDate}
                      </span>
                      {b.isAutopay && (
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                          Autopay
                        </span>
                      )}
                      {b.isLoan && (
                        <span className="bg-fuchsia-100 text-fuchsia-600 px-2 py-1 rounded-md">
                          Loan: ${b.loanBalance}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {profileTab === "income" &&
                incomes.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => openEditModal("editIncome", i)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 transition-all active:scale-95"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-800">{i.name}</span>
                      <span className="font-black text-emerald-500">
                        +${i.amount}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                      {i.type === "recurring"
                        ? `Recurring: ${i.frequency}`
                        : `One-Time: ${i.nextDate}`}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL OVERLAYS ================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>

            {/* Modal: EXPENSE */}
            {activeModal === "expense" && (
              <form onSubmit={handleSaveExpense} className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800">
                  Log Transaction
                </h2>
                <input
                  required
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="$ Amount"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-violet-500 outline-none text-lg font-bold transition-colors"
                />
                <select
                  required
                  name="category"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-violet-500 outline-none font-semibold transition-colors"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  type="text"
                  placeholder="Note (Optional)"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-violet-500 outline-none font-medium transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl text-lg transition-transform active:scale-95 shadow-lg"
                >
                  Save Transaction
                </button>
              </form>
            )}

            {/* Modal: EDIT CATEGORY */}
            {activeModal === "editCategory" && (
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800">
                  {editingItem ? "Edit Category" : "New Category"}
                </h2>
                <input
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  type="text"
                  placeholder="Name"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-violet-500 outline-none font-bold"
                />
                <input
                  required
                  name="budget"
                  defaultValue={editingItem?.budget}
                  type="number"
                  placeholder="Budget Amount"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-violet-500 outline-none font-bold"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-violet-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => handleDelete("category", editingItem.id)}
                      className="px-6 bg-rose-100 text-rose-600 font-bold rounded-2xl active:scale-95 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Modal: EDIT BILL */}
            {activeModal === "editBill" && (
              <form onSubmit={handleSaveBill} className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800">
                  {editingItem ? "Edit Bill" : "New Bill"}
                </h2>
                <input
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  type="text"
                  placeholder="Bill Name"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                />
                <div className="flex gap-3">
                  <input
                    required
                    name="amount"
                    defaultValue={editingItem?.amount}
                    type="number"
                    placeholder="$ Amount"
                    className="w-1/2 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                  />
                  <input
                    required
                    name="dueDate"
                    defaultValue={editingItem?.dueDate}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Due (1-31)"
                    className="w-1/2 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="flex gap-6 py-2 px-2">
                  <label className="flex items-center gap-2 font-bold text-slate-600">
                    <input
                      name="isAutopay"
                      defaultChecked={editingItem?.isAutopay}
                      type="checkbox"
                      className="w-5 h-5 rounded accent-violet-600"
                    />{" "}
                    Autopay
                  </label>
                  <label className="flex items-center gap-2 font-bold text-fuchsia-600">
                    <input
                      name="isLoan"
                      defaultChecked={editingItem?.isLoan}
                      type="checkbox"
                      className="w-5 h-5 rounded accent-fuchsia-600"
                      onChange={(e) =>
                        (document.getElementById("editLoanBal").style.display =
                          e.target.checked ? "block" : "none")
                      }
                    />{" "}
                    Is Loan
                  </label>
                </div>
                <input
                  id="editLoanBal"
                  name="loanBalance"
                  defaultValue={editingItem?.loanBalance}
                  style={{ display: editingItem?.isLoan ? "block" : "none" }}
                  type="number"
                  placeholder="Total Loan Balance"
                  className="w-full bg-fuchsia-50 border-2 border-fuchsia-100 p-4 rounded-2xl outline-none font-bold text-fuchsia-900"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => handleDelete("bill", editingItem.id)}
                      className="px-6 bg-rose-100 text-rose-600 font-bold rounded-2xl active:scale-95 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Modal: EDIT INCOME */}
            {activeModal === "editIncome" && (
              <form onSubmit={handleSaveIncome} className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800">
                  {editingItem ? "Edit Income" : "New Income"}
                </h2>
                <input
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  type="text"
                  placeholder="Source Name"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                />
                <input
                  required
                  name="amount"
                  defaultValue={editingItem?.amount}
                  type="number"
                  placeholder="$ Amount"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                />
                <select
                  required
                  name="type"
                  defaultValue={editingItem?.type || "recurring"}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold"
                  onChange={(e) =>
                    (document.getElementById("editFreq").style.display =
                      e.target.value === "recurring" ? "block" : "none")
                  }
                >
                  <option value="recurring">Recurring Schedule</option>
                  <option value="one-time">One-Time Payment</option>
                </select>
                <div className="flex gap-3">
                  <input
                    required
                    name="nextDate"
                    defaultValue={editingItem?.nextDate}
                    type="date"
                    className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-600"
                  />
                  <select
                    id="editFreq"
                    name="frequency"
                    defaultValue={editingItem?.frequency || "bi-weekly"}
                    style={{
                      display:
                        !editingItem || editingItem.type === "recurring"
                          ? "block"
                          : "none",
                    }}
                    className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-600"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => handleDelete("income", editingItem.id)}
                      className="px-6 bg-rose-100 text-rose-600 font-bold rounded-2xl active:scale-95 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
