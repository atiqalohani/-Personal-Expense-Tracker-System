/* ===================================
   Personal Expense Tracker System
   Enhanced JavaScript with Report Fix
   =================================== */

// ===== GLOBAL VARIABLES =====
let expenses = [];
let categoryChart = null;
let trendChart = null;
let reportPieChart = null;
let reportLineChart = null;
let currentEditId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('PET System Initialized');
    loadExpenses();
    setupEventListeners();
    setTodayDate();
    updateDashboard();
    updateCategoriesView();
    loadBudgetForm();
    displayBudgetProgress();
    
    // Show welcome animation
    setTimeout(() => {
        if (expenses.length === 0) {
            showWelcomeMessage();
        }
    }, 500);
});

// ===== WELCOME MESSAGE =====
function showWelcomeMessage() {
    const recentList = document.getElementById('recent-list');
    if (recentList && expenses.length === 0) {
        recentList.innerHTML = `
            <div style="text-align: center; padding: 3rem; animation: fadeIn 0.5s ease;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h3 style="color: var(--accent-blue); margin-bottom: 1rem;">Welcome to PET System!</h3>
                <p style="color: var(--text-secondary);">Start tracking your expenses by adding your first transaction.</p>
            </div>
        `;
    }
}

// ===== LOCAL STORAGE FUNCTIONS =====
function loadExpenses() {
    try {
        const stored = localStorage.getItem('petExpenses');
        expenses = stored ? JSON.parse(stored) : [];
        console.log(`Loaded ${expenses.length} expenses`);
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

function saveExpenses() {
    try {
        localStorage.setItem('petExpenses', JSON.stringify(expenses));
        console.log('Expenses saved successfully');
    } catch (error) {
        console.error('Error saving expenses:', error);
        alert('❌ Error saving data. Please check your storage.');
    }
}

function loadBudget() {
    try {
        const budget = localStorage.getItem('petBudget');
        return budget ? JSON.parse(budget) : {};
    } catch (error) {
        console.error('Error loading budget:', error);
        return {};
    }
}

function saveBudgetData(budgetData) {
    try {
        localStorage.setItem('petBudget', JSON.stringify(budgetData));
        console.log('Budget saved successfully');
    } catch (error) {
        console.error('Error saving budget:', error);
    }
}

function loadBudgetForm() {
    const budget = loadBudget();
    if (Object.keys(budget).length > 0) {
        document.getElementById('budget-food').value = budget.food || '';
        document.getElementById('budget-transport').value = budget.transport || '';
        document.getElementById('budget-entertainment').value = budget.entertainment || '';
        document.getElementById('budget-total').value = budget.total || '';
    }
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Add expense form
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addExpense();
        });
    }
    
    // Edit expense form
    const editForm = document.getElementById('edit-expense-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateExpense();
        });
    }
    
    // Search with debounce
    const searchInput = document.getElementById('search-expense');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterExpenses, 300);
        });
    }
    
    // Report period selection
    const reportPeriod = document.getElementById('report-period');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            const customPeriod = document.getElementById('custom-period');
            if (customPeriod) {
                customPeriod.style.display = this.value === 'custom' ? 'flex' : 'none';
            }
        });
    }
}

// ===== TAB NAVIGATION =====
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from buttons
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        const clickedBtn = event.target.closest('.tab-btn');
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
    }
    
    // Update views based on tab
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'manage') {
        displayExpenses();
    } else if (tabName === 'categories') {
        updateCategoriesView();
    } else if (tabName === 'budget') {
        displayBudgetProgress();
    } else if (tabName === 'reports') {
        generateReport();
    }
}

// ===== DATE HELPER =====
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        dateInput.value = today;
    }
}

// ===== ADD EXPENSE =====
function addExpense() {
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const payment = document.getElementById('expense-payment').value;
    const description = document.getElementById('expense-description').value;
    
    if (amount <= 0) {
        alert('⚠️ Please enter a valid amount greater than 0!');
        return;
    }
    
    if (!category) {
        alert('⚠️ Please select a category!');
        return;
    }
    
    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        date: date,
        payment: payment,
        description: description,
        timestamp: new Date().toISOString()
    };
    
    expenses.push(expense);
    saveExpenses();
    
    document.getElementById('expense-form').reset();
    setTodayDate();
    
    updateDashboard();
    displayExpenses();
    updateCategoriesView();
    
    alert('✅ Expense added successfully!');
    
    // Switch to dashboard with animation
    const dashboardBtn = document.querySelector('.tab-btn:first-child');
    if (dashboardBtn) {
        dashboardBtn.click();
    }
}

// ===== DISPLAY EXPENSES =====
function displayExpenses(filteredExpenses = expenses) {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredExpenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <p>No expenses found. Start adding your expenses to see them here!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        const formattedDate = new Date(expense.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const categoryIcon = getCategoryIcon(expense.category);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="category-badge">${categoryIcon} ${expense.category}</span></td>
            <td><strong style="color: var(--accent-blue);">Rs. ${expense.amount.toFixed(2)}</strong></td>
            <td>${expense.payment}</td>
            <td>${expense.description || '-'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal(${expense.id})">✏️ Edit</button>
                <button class="action-btn btn-delete" onclick="deleteExpense(${expense.id})">🗑️ Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getCategoryIcon(category) {
    const icons = {
        'Food': '🍔',
        'Transport': '🚗',
        'Utilities': '💡',
        'Entertainment': '🎮',
        'Healthcare': '⚕️',
        'Shopping': '🛍️',
        'Education': '📚',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

// ===== FILTER EXPENSES =====
function filterExpenses() {
    const searchTerm = document.getElementById('search-expense').value.toLowerCase();
    const filterCategory = document.getElementById('filter-category').value;
    const filterFrom = document.getElementById('filter-from').value;
    const filterTo = document.getElementById('filter-to').value;
    
    let filtered = expenses;
    
    if (searchTerm) {
        filtered = filtered.filter(expense => 
            (expense.description || '').toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterCategory) {
        filtered = filtered.filter(expense => expense.category === filterCategory);
    }
    
    if (filterFrom) {
        filtered = filtered.filter(expense => expense.date >= filterFrom);
    }
    
    if (filterTo) {
        filtered = filtered.filter(expense => expense.date <= filterTo);
    }
    
    displayExpenses(filtered);
}

function applyFilters() {
    filterExpenses();
}

function clearFilters() {
    document.getElementById('search-expense').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-from').value = '';
    document.getElementById('filter-to').value = '';
    displayExpenses();
}

// ===== EDIT EXPENSE =====
function openEditModal(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;
    
    currentEditId = id;
    
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-amount').value = expense.amount;
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-date').value = expense.date;
    document.getElementById('edit-expense-payment').value = expense.payment;
    document.getElementById('edit-expense-description').value = expense.description;
    
    document.getElementById('edit-modal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditId = null;
}

function updateExpense() {
    const id = parseInt(document.getElementById('edit-expense-id').value);
    const amount = parseFloat(document.getElementById('edit-expense-amount').value);
    const category = document.getElementById('edit-expense-category').value;
    const date = document.getElementById('edit-expense-date').value;
    const payment = document.getElementById('edit-expense-payment').value;
    const description = document.getElementById('edit-expense-description').value;
    
    const index = expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
        expenses[index] = {
            ...expenses[index],
            amount,
            category,
            date,
            payment,
            description
        };
        
        saveExpenses();
        closeEditModal();
        displayExpenses();
        updateDashboard();
        updateCategoriesView();
        
        alert('✅ Expense updated successfully!');
    }
}

// ===== DELETE EXPENSE =====
function deleteExpense(id) {
    if (confirm('⚠️ Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses();
        displayExpenses();
        updateDashboard();
        updateCategoriesView();
        alert('✅ Expense deleted successfully!');
    }
}

// ===== DASHBOARD FUNCTIONS =====
function updateDashboard() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalTransactions = expenses.length;
    
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const topCategory = Object.keys(categoryTotals).length > 0 
        ? Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b)
        : 'N/A';
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const avgDaily = totalExpenses / daysInMonth;
    
    // Update cards
    const totalExpEl = document.getElementById('total-expenses');
    const totalTransEl = document.getElementById('total-transactions');
    const topCatEl = document.getElementById('top-category');
    const avgDailyEl = document.getElementById('avg-daily');
    
    if (totalExpEl) totalExpEl.textContent = `Rs. ${totalExpenses.toFixed(2)}`;
    if (totalTransEl) totalTransEl.textContent = totalTransactions;
    if (topCatEl) topCatEl.textContent = topCategory;
    if (avgDailyEl) avgDailyEl.textContent = `Rs. ${avgDaily.toFixed(2)}`;
    
    updateCategoryChart();
    updateTrendChart();
    displayRecentTransactions();
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    if (data.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                    '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'
                ],
                borderWidth: 2,
                borderColor: '#1a1f3a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': Rs. ' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    const last30Days = [];
    const dailyTotals = {};
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(dateStr);
        dailyTotals[dateStr] = 0;
    }
    
    expenses.forEach(exp => {
        if (dailyTotals.hasOwnProperty(exp.date)) {
            dailyTotals[exp.date] += exp.amount;
        }
    });
    
    const data = last30Days.map(date => dailyTotals[date]);
    const labels = last30Days.map(date => {
        const d = new Date(date);
        return d.getDate() + '/' + (d.getMonth() + 1);
    });
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Expenses (Rs.)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'Rs. ' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            }
        }
    });
}

function displayRecentTransactions() {
    const recentList = document.getElementById('recent-list');
    if (!recentList) return;
    
    recentList.innerHTML = '';
    
    const recent = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recent.length === 0) {
        recentList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                <p>No transactions yet. Add your first expense!</p>
            </div>
        `;
        return;
    }
    
    recent.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const formattedDate = new Date(exp.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short'
        });
        
        const icon = getCategoryIcon(exp.category);
        
        item.innerHTML = `
            <div class="transaction-details">
                <h4>${icon} ${exp.category}</h4>
                <p>${formattedDate} • ${exp.payment}</p>
            </div>
            <div class="transaction-amount">Rs. ${exp.amount.toFixed(2)}</div>
        `;
        
        recentList.appendChild(item);
    });
}

// ===== CATEGORIES VIEW =====
function updateCategoriesView() {
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other'];
    
    categories.forEach(category => {
        const categoryExpenses = expenses.filter(exp => exp.category === category);
        const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const amountEl = document.querySelector(`.category-amount[data-cat="${category}"]`);
        const countEl = document.querySelector(`.category-count[data-cat="${category}"]`);
        
        if (amountEl) amountEl.textContent = `Rs. ${total.toFixed(2)}`;
        if (countEl) countEl.textContent = `${categoryExpenses.length} transaction${categoryExpenses.length !== 1 ? 's' : ''}`;
    });
}

// ===== BUDGET FUNCTIONS =====
function saveBudget() {
    const budgetData = {
        food: parseFloat(document.getElementById('budget-food').value) || 0,
        transport: parseFloat(document.getElementById('budget-transport').value) || 0,
        entertainment: parseFloat(document.getElementById('budget-entertainment').value) || 0,
        total: parseFloat(document.getElementById('budget-total').value) || 0
    };
    
    saveBudgetData(budgetData);
    displayBudgetProgress();
    alert('✅ Budget saved successfully!');
}

function displayBudgetProgress() {
    const budget = loadBudget();
    const progressDiv = document.getElementById('budget-progress');
    if (!progressDiv) return;
    
    progressDiv.innerHTML = '';
    
    if (Object.keys(budget).length === 0 || (budget.food === 0 && budget.transport === 0 && budget.entertainment === 0 && budget.total === 0)) {
        progressDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                <p>No budget set. Set your budget limits above to track your spending.</p>
            </div>
        `;
        return;
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const spending = {
        food: 0,
        transport: 0,
        entertainment: 0,
        total: 0
    };
    
    monthExpenses.forEach(exp => {
        const amount = exp.amount;
        spending.total += amount;
        
        if (exp.category === 'Food') spending.food += amount;
        else if (exp.category === 'Transport') spending.transport += amount;
        else if (exp.category === 'Entertainment') spending.entertainment += amount;
    });
    
    const categories = [
        { key: 'food', label: '🍔 Food', icon: '🍔' },
        { key: 'transport', label: '🚗 Transport', icon: '🚗' },
        { key: 'entertainment', label: '🎮 Entertainment', icon: '🎮' },
        { key: 'total', label: '💰 Total Budget', icon: '💰' }
    ];
    
    categories.forEach(cat => {
        if (budget[cat.key] > 0) {
            const percentage = (spending[cat.key] / budget[cat.key]) * 100;
            const overBudget = percentage > 100;
            
            const item = document.createElement('div');
            item.className = 'budget-item';
            item.innerHTML = `
                <div class="budget-header">
                    <span><strong>${cat.label}</strong></span>
                    <span>Rs. ${spending[cat.key].toFixed(2)} / Rs. ${budget[cat.key].toFixed(2)}</span>
                </div>
                <div class="budget-bar">
                    <div class="budget-fill ${overBudget ? 'over-budget' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <p style="margin-top: 0.75rem; color: ${overBudget ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
                    ${percentage.toFixed(1)}% used ${overBudget ? '(⚠️ Over Budget!)' : '✅'}
                </p>
            `;
            
            progressDiv.appendChild(item);
        }
    });
}

// ===== REPORT FUNCTIONS (FIXED) =====
function generateReport() {
    const period = document.getElementById('report-period');
    if (!period) return;
    
    const periodValue = period.value;
    let filteredExpenses = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (periodValue === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= weekAgo);
    } else if (periodValue === 'monthly') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= monthAgo);
    } else if (periodValue === 'yearly') {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= yearAgo);
    } else if (periodValue === 'custom') {
        const fromDate = document.getElementById('report-from')?.value;
        const toDate = document.getElementById('report-to')?.value;
        
        if (fromDate && toDate) {
            filteredExpenses = expenses.filter(exp => 
                exp.date >= fromDate && exp.date <= toDate
            );
        } else {
            alert('⚠️ Please select both from and to dates for custom period!');
            return;
        }
    }
    
    // Calculate statistics
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredExpenses.length;
    const max = count > 0 ? Math.max(...filteredExpenses.map(exp => exp.amount)) : 0;
    
    // Calculate days for average
    let days = 1;
    if (periodValue === 'weekly') days = 7;
    else if (periodValue === 'monthly') days = 30;
    else if (periodValue === 'yearly') days = 365;
    else if (periodValue === 'custom') {
        const fromDate = new Date(document.getElementById('report-from').value);
        const toDate = new Date(document.getElementById('report-to').value);
        days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));
    }
    
    const avg = total / days;
    
    // Update statistics
    const reportTotal = document.getElementById('report-total');
    const reportAvg = document.getElementById('report-avg');
    const reportMax = document.getElementById('report-max');
    const reportCount = document.getElementById('report-count');
    
    if (reportTotal) reportTotal.textContent = `Rs. ${total.toFixed(2)}`;
    if (reportAvg) reportAvg.textContent = `Rs. ${avg.toFixed(2)}`;
    if (reportMax) reportMax.textContent = `Rs. ${max.toFixed(2)}`;
    if (reportCount) reportCount.textContent = count;
    
    // Update charts
    updateReportCharts(filteredExpenses);
}

function updateReportCharts(filteredExpenses) {
    // Pie chart
    const pieCtx = document.getElementById('reportPieChart');
    if (pieCtx) {
        const categoryTotals = {};
        filteredExpenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        const pieLabels = Object.keys(categoryTotals);
        const pieData = Object.values(categoryTotals);
        
        if (reportPieChart) {
            reportPieChart.destroy();
        }
        
        if (pieData.length > 0) {
            reportPieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: pieLabels,
                    datasets: [{
                        data: pieData,
                        backgroundColor: [
                            '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                            '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'
                        ],
                        borderWidth: 2,
                        borderColor: '#1a1f3a'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e2e8f0',
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': Rs. ' + context.parsed.toFixed(2) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Line chart
    const lineCtx = document.getElementById('reportLineChart');
    if (lineCtx) {
        const dailyTotals = {};
        filteredExpenses.forEach(exp => {
            dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + exp.amount;
        });
        
        const sortedDates = Object.keys(dailyTotals).sort();
        const lineData = sortedDates.map(date => dailyTotals[date]);
        const lineLabels = sortedDates.map(date => {
            const d = new Date(date);
            return d.getDate() + '/' + (d.getMonth() + 1);
        });
        
        if (reportLineChart) {
            reportLineChart.destroy();
        }
        
        if (lineData.length > 0) {
            reportLineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: lineLabels,
                    datasets: [{
                        label: 'Daily Expenses (Rs.)',
                        data: lineData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    return 'Rs. ' + value;
                                }
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#94a3b8'
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    }
}

function printReport() {
    window.print();
}

// ===== IMPORT/EXPORT FUNCTIONS =====
function exportToExcel() {
    if (expenses.length === 0) {
        alert('⚠️ No expenses to export!');
        return;
    }
    
    const data = expenses.map(exp => ({
        'Date': exp.date,
        'Category': exp.category,
        'Amount (Rs.)': exp.amount,
        'Payment Method': exp.payment,
        'Description': exp.description || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    
    const fileName = `PET_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert('✅ Expenses exported to Excel successfully!');
}

function exportToCSV() {
    if (expenses.length === 0) {
        alert('⚠️ No expenses to export!');
        return;
    }
    
    let csv = 'Date,Category,Amount,Payment Method,Description\n';
    
    expenses.forEach(exp => {
        csv += `${exp.date},${exp.category},${exp.amount},${exp.payment},"${exp.description || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PET_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Expenses exported to CSV successfully!');
}

function exportToJSON() {
    if (expenses.length === 0) {
        alert('⚠️ No expenses to export!');
        return;
    }
    
    const json = JSON.stringify(expenses, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PET_Expenses_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Expenses exported to JSON successfully!');
}

function importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('⚠️ Please select a file to import!');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            
            if (file.name.endsWith('.csv')) {
                importCSV(data);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                importExcel(data);
            } else {
                alert('⚠️ Unsupported file format! Please use CSV or Excel files.');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Error importing file: ' + error.message);
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

function importCSV(csvData) {
    const lines = csvData.split('\n');
    let imported = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        
        if (parts && parts.length >= 3) {
            const expense = {
                id: Date.now() + i,
                date: parts[0].replace(/"/g, ''),
                category: parts[1].replace(/"/g, ''),
                amount: parseFloat(parts[2].replace(/"/g, '')),
                payment: parts[3] ? parts[3].replace(/"/g, '') : 'Cash',
                description: parts[4] ? parts[4].replace(/"/g, '') : '',
                timestamp: new Date().toISOString()
            };
            
            if (expense.date && expense.category && !isNaN(expense.amount)) {
                expenses.push(expense);
                imported++;
            }
        }
    }
    
    saveExpenses();
    updateDashboard();
    displayExpenses();
    updateCategoriesView();
    
    alert(`✅ Successfully imported ${imported} expenses!`);
    
    // Clear file input
    document.getElementById('import-file').value = '';
}

function importExcel(binaryData) {
    const workbook = XLSX.read(binaryData, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    let imported = 0;
    
    data.forEach((row, index) => {
        const expense = {
            id: Date.now() + index,
            date: row['Date'] || row['date'],
            category: row['Category'] || row['category'],
            amount: parseFloat(row['Amount (Rs.)'] || row['Amount'] || row['amount']),
            payment: row['Payment Method'] || row['Payment'] || row['payment'] || 'Cash',
            description: row['Description'] || row['description'] || '',
            timestamp: new Date().toISOString()
        };
        
        if (expense.date && expense.category && !isNaN(expense.amount)) {
            expenses.push(expense);
            imported++;
        }
    });
    
    saveExpenses();
    updateDashboard();
    displayExpenses();
    updateCategoriesView();
    
    alert(`✅ Successfully imported ${imported} expenses!`);
    
    // Clear file input
    document.getElementById('import-file').value = '';
}

function backupData() {
    const backupData = {
        expenses: expenses,
        budget: loadBudget(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PET_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Backup created successfully!');
}

function clearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL your expense data permanently! Are you absolutely sure?')) {
        if (confirm('⚠️ Last chance! This action cannot be undone. Proceed with deletion?')) {
            expenses = [];
            saveExpenses();
            localStorage.removeItem('petBudget');
            
            updateDashboard();
            displayExpenses();
            updateCategoriesView();
            displayBudgetProgress();
            
            // Clear budget form
            document.getElementById('budget-food').value = '';
            document.getElementById('budget-transport').value = '';
            document.getElementById('budget-entertainment').value = '';
            document.getElementById('budget-total').value = '';
            
            alert('✅ All data has been cleared!');
            
            // Show welcome message
            showWelcomeMessage();
        }
    }
}

// ===== UTILITY FUNCTIONS =====
window.onclick = function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// ===== SAMPLE DATA (OPTIONAL - UNCOMMENT TO USE) =====
function addSampleData() {
    const sampleExpenses = [
        {
            id: Date.now() + 1,
            amount: 1500,
            category: 'Food',
            date: '2026-01-05',
            payment: 'Cash',
            description: 'Monthly grocery shopping',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            amount: 800,
            category: 'Transport',
            date: '2026-01-04',
            payment: 'Card',
            description: 'Fuel for car',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            amount: 2000,
            category: 'Entertainment',
            date: '2026-01-03',
            payment: 'Online',
            description: 'Movie tickets and dinner',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 4,
            amount: 3500,
            category: 'Utilities',
            date: '2026-01-02',
            payment: 'Card',
            description: 'Electricity and water bills',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 5,
            amount: 1200,
            category: 'Healthcare',
            date: '2026-01-01',
            payment: 'Cash',
            description: 'Medical checkup and medicines',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 6,
            amount: 2500,
            category: 'Shopping',
            date: '2025-12-30',
            payment: 'Card',
            description: 'Clothing and accessories',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 7,
            amount: 5000,
            category: 'Education',
            date: '2025-12-28',
            payment: 'Online',
            description: 'Course enrollment fee',
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() + 8,
            amount: 600,
            category: 'Food',
            date: '2025-12-27',
            payment: 'Cash',
            description: 'Restaurant dinner',
            timestamp: new Date().toISOString()
        }
    ];
    
    expenses = sampleExpenses;
    saveExpenses();
    updateDashboard();
    displayExpenses();
    updateCategoriesView();
    
    alert('✅ Sample data loaded successfully!');
}

// Uncomment the line below to load sample data on first visit
// if (expenses.length === 0) addSampleData();

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-expense');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

// ===== CONSOLE LOG FOR DEBUGGING =====
console.log('✅ PET System loaded successfully!');
console.log('📊 Total expenses:', expenses.length);
console.log('💡 Press Ctrl+K to focus search');
console.log('🎨 Enjoying the navy blue theme!');

// ===== PERFORMANCE MONITORING =====
if (window.performance) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log('⚡ Page load time:', pageLoadTime + 'ms');
        }, 0);
    });
}