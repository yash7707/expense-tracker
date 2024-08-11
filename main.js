let currentType = '';
let finalBalance = document.getElementById('final-balance');

// Initialize Chart.js for Income Chart
let incomeCtx = document.getElementById('incomeChart').getContext('2d');
let incomeChart = new Chart(incomeCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            label: 'Income Distribution',
            data: [],
            backgroundColor: [],
            borderWidth: 1
        }]
    }
});

// Initialize Chart.js for Expense Chart
let expenseCtx = document.getElementById('expenseChart').getContext('2d');
let expenseChart = new Chart(expenseCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            label: 'Expense Distribution',
            data: [],
            backgroundColor: [],
            borderWidth: 1
        }]
    }
});

// Function to generate a random user ID
function generateUserID() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Check if a user ID exists in localStorage, otherwise create one
let userID = localStorage.getItem('userID');
if (!userID) {
    userID = generateUserID();
    localStorage.setItem('userID', userID);
}

// Function to save transaction history in localStorage
function saveTransaction(transaction) {
    let transactionHistory = JSON.parse(localStorage.getItem(userID)) || [];
    transactionHistory.push(transaction);
    localStorage.setItem(userID, JSON.stringify(transactionHistory));
}

// Function to retrieve and display transaction history
function displayTransactionHistory() {
    let transactionHistory = JSON.parse(localStorage.getItem(userID)) || [];
    transactionHistory.forEach(transaction => {
        addTransactionToUI(transaction.name, transaction.amount, transaction.type, true);
    });
}

// Function to toggle active transaction type
function toggleActive(type) {
    let plusDiv = document.getElementById('plus-money');
    let minusDiv = document.getElementById('minus-money');
    let transactionUpdateClass = document.getElementById('transaction-div');

    currentType = type;

    if (type === 'plus') {
        plusDiv.classList.add('plus-active');
        minusDiv.classList.remove('minus-active');
        transactionUpdateClass.classList.add('plus');
        transactionUpdateClass.classList.remove('minus');
    } else if (type === 'minus') {
        minusDiv.classList.add('minus-active');
        plusDiv.classList.remove('plus-active');
        transactionUpdateClass.classList.add('minus');
        transactionUpdateClass.classList.remove('plus');
    }
}

// Update the addTransaction function to include validations and save transactions
function addTransaction() {
    let transactionName = document.getElementById('text').value.trim();
    let transactionAmount = parseFloat(document.getElementById('amount').value.trim());

    // Validation: Ensure non-empty transaction name and valid transaction amount
    if (transactionName === '' || isNaN(transactionAmount) || transactionAmount <= 0) {
        showAlert('Please provide a valid transaction name and amount');
        return;
    }

    // Validation: Ensure transaction name is not too long
    if (transactionName.length > 15) {
        showAlert('Please provide a transaction name shorter than 15 characters');
        return;
    }

    // Validation: Ensure a transaction type is selected
    if (!currentType) {
        showAlert('Please choose the type of transaction');
        return;
    }

    let transaction = {
        name: transactionName,
        amount: transactionAmount,
        type: currentType
    };

    saveTransaction(transaction);
    addTransactionToUI(transactionName, transactionAmount, currentType, true);

    // Clear input fields
    document.getElementById('text').value = '';
    document.getElementById('amount').value = '';
}

// Function to add a transaction to the UI with list overflow handling
function addTransactionToUI(transactionName, transactionAmount, transactionType, updateCharts) {
    let historyUl = document.getElementById('history-list');

    let newListItemHTML = `
        <li class="${transactionType}">
            <span>${transactionName}</span> <span id="history-amt">${transactionAmount}</span>
            <button class="delete-btn" onclick="deleteTransaction(this)"><i class="fa-solid fa-trash-can"></i></button>
        </li>`;

    // Handle list overflow
    if (historyUl.childNodes.length > 10) {
        historyUl.style.overflowY = 'scroll';
        historyUl.style.maxHeight = '600px';
    }

    historyUl.insertAdjacentHTML('beforeend', newListItemHTML);

    let incomeUpdate = document.getElementById('income-update');
    let expenseUpdate = document.getElementById('expense-update');
    let incomeUpdateNum = parseFloat(incomeUpdate.textContent);
    let expenseUpdateNum = parseFloat(expenseUpdate.textContent);

    if (transactionType === 'plus') {
        incomeUpdateNum += transactionAmount;
        incomeUpdate.textContent = incomeUpdateNum;

        if (updateCharts) {
            incomeChart.data.labels.push(transactionName);
            incomeChart.data.datasets[0].data.push(transactionAmount);
            incomeChart.data.datasets[0].backgroundColor.push(getRandomColor());
            incomeChart.update();
        }

        showAlert(`Income added: ${transactionName} = $${transactionAmount}`);
    } else if (transactionType === 'minus') {
        expenseUpdateNum += transactionAmount;
        expenseUpdate.textContent = expenseUpdateNum;

        if (updateCharts) {
            expenseChart.data.labels.push(transactionName);
            expenseChart.data.datasets[0].data.push(transactionAmount);
            expenseChart.data.datasets[0].backgroundColor.push(getRandomColor());
            expenseChart.update();
        }

        showAlert(`Expense added: ${transactionName} = $${transactionAmount}`);
    }

    let balance = incomeUpdateNum - expenseUpdateNum;
    updateFinalBalance(balance);
}

// Modify deleteTransaction to also remove the transaction from localStorage
function deleteTransaction(button) {
    let listItem = button.parentNode;
    let transactionAmount = parseFloat(listItem.querySelector('#history-amt').textContent);
    let transactionName = listItem.firstChild.textContent.trim();
    let transactionType = listItem.classList.contains('plus') ? 'plus' : 'minus';

    // Remove from localStorage
    let transactionHistory = JSON.parse(localStorage.getItem(userID)) || [];
    transactionHistory = transactionHistory.filter(transaction => {
        return !(transaction.name === transactionName && transaction.amount === transactionAmount && transaction.type === transactionType);
    });
    localStorage.setItem(userID, JSON.stringify(transactionHistory));

    let incomeUpdate = document.getElementById('income-update');
    let incomeUpdateNum = parseFloat(incomeUpdate.textContent);
    let expenseUpdate = document.getElementById('expense-update');
    let expenseUpdateNum = parseFloat(expenseUpdate.textContent);

    // Remove from UI and charts
    if (transactionType === 'plus') {
        incomeUpdateNum -= transactionAmount;
        incomeUpdate.textContent = incomeUpdateNum;

        let index = incomeChart.data.labels.indexOf(transactionName);
        if (index > -1) {
            incomeChart.data.labels.splice(index, 1);
            incomeChart.data.datasets[0].data.splice(index, 1);
            incomeChart.data.datasets[0].backgroundColor.splice(index, 1);
            incomeChart.update();
        }

        showAlert(`Income removed: ${transactionName} = $${transactionAmount}`);
    } else if (transactionType === 'minus') {
        expenseUpdateNum -= transactionAmount;
        expenseUpdate.textContent = expenseUpdateNum;

        let index = expenseChart.data.labels.indexOf(transactionName);
        if (index > -1) {
            expenseChart.data.labels.splice(index, 1);
            expenseChart.data.datasets[0].data.splice(index, 1);
            expenseChart.data.datasets[0].backgroundColor.splice(index, 1);
            expenseChart.update();
        }

        showAlert(`Expense removed: ${transactionName} = $${transactionAmount}`);
    }

    let balance = incomeUpdateNum - expenseUpdateNum;
    updateFinalBalance(balance);

    listItem.parentNode.removeChild(listItem);
}

// Function to update the final balance
function updateFinalBalance(balance) {
    let balanceTar = document.getElementById("final-balance");
    balanceTar.innerHTML = `$${balance}`;
}

// Function to generate a random color for the chart slices
function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to show the custom alert box
function showAlert(message) {
    let alertBox = document.getElementById('customAlert');
    let alertMessage = document.getElementById('alertMessage');

    alertMessage.textContent = message;
    alertBox.classList.add('active');

    // Auto-close the alert box after 7 seconds
    setTimeout(function () {
        alertBox.classList.remove('active');
    }, 7000);
}

document.getElementById('closeAlert').onclick = function () {
    document.getElementById('customAlert').classList.remove('active');
}

// Call displayTransactionHistory when the page loads
window.onload = function () {
    displayTransactionHistory();

    let userIdInput =  document.getElementById('userid');
    userIdInput.value = userID;
};
