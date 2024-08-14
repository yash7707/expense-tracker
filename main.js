class FinancialTracker {
    constructor() {
        this.currentType = '';
        this.userID = this.initializeUserID();
        this.finalBalance = document.getElementById('final-balance');
        this.incomeChart = this.initializeChart('incomeChart', 'Income Distribution');
        this.expenseChart = this.initializeChart('expenseChart', 'Expense Distribution');

        this.displayTransactionHistory();
        this.setEventListeners();
    }

    initializeChart(elementId, label) {
        const ctx = document.getElementById(elementId).getContext('2d');
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1
                }]
            }
        });
    }

    generateUserID() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    initializeUserID() {
        let userID = localStorage.getItem('userID');
        if (!userID) {
            userID = this.generateUserID();
            localStorage.setItem('userID', userID);
        }
        return userID;
    }

    saveTransaction(transaction) {
        const transactionHistory = JSON.parse(localStorage.getItem(this.userID)) || [];
        transactionHistory.push(transaction);
        localStorage.setItem(this.userID, JSON.stringify(transactionHistory));
    }

    displayTransactionHistory() {
        const transactionHistory = JSON.parse(localStorage.getItem(this.userID)) || [];
        transactionHistory.forEach(transaction => {
            this.addTransactionToUI(transaction.name, transaction.amount, transaction.type, true);
        });
    }

    toggleActive(type) {
        const plusDiv = document.getElementById('plus-money');
        const minusDiv = document.getElementById('minus-money');
        const transactionUpdateClass = document.getElementById('transaction-div');

        this.currentType = type;

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

    addTransaction() {
        const transactionName = document.getElementById('text').value.trim();
        const transactionAmount = parseFloat(document.getElementById('amount').value.trim());

        if (!this.validateTransaction(transactionName, transactionAmount)) return;

        const transaction = {
            name: transactionName,
            amount: transactionAmount,
            type: this.currentType
        };

        this.saveTransaction(transaction);
        this.addTransactionToUI(transactionName, transactionAmount, this.currentType, true);

        document.getElementById('text').value = '';
        document.getElementById('amount').value = '';
    }

    validateTransaction(name, amount) {
        if (name === '' || isNaN(amount) || amount <= 0) {
            this.showAlert('Please provide a valid transaction name and amount');
            return false;
        }

        if (name.length > 15) {
            this.showAlert('Please provide a transaction name shorter than 15 characters');
            return false;
        }

        if (!this.currentType) {
            this.showAlert('Please choose the type of transaction');
            return false;
        }

        return true;
    }

    addTransactionToUI(transactionName, transactionAmount, transactionType, updateCharts) {
        const historyUl = document.getElementById('history-list');

        const newListItemHTML = `
            <li class="${transactionType}">
                <span id="trans-name">${transactionName}</span> <span id="history-amt">${transactionAmount}</span>
                <button class="delete-btn" onclick="tracker.deleteTransaction(this)"><i class="fa-solid fa-trash-can"></i></button>
            </li>`;

        if (historyUl.childNodes.length > 10) {
            historyUl.style.overflowY = 'scroll';
            historyUl.style.maxHeight = '600px';
        }

        historyUl.insertAdjacentHTML('beforeend', newListItemHTML);

        const incomeUpdate = document.getElementById('income-update');
        const expenseUpdate = document.getElementById('expense-update');
        let incomeUpdateNum = parseFloat(incomeUpdate.textContent);
        let expenseUpdateNum = parseFloat(expenseUpdate.textContent);

        if (transactionType === 'plus') {
            incomeUpdateNum += transactionAmount;
            incomeUpdate.textContent = incomeUpdateNum;

            if (updateCharts) {
                this.updateChart(this.incomeChart, transactionName, transactionAmount);
            }

            this.showAlert(`Income added: ${transactionName} = $${transactionAmount}`);
        } else if (transactionType === 'minus') {
            expenseUpdateNum += transactionAmount;
            expenseUpdate.textContent = expenseUpdateNum;

            if (updateCharts) {
                this.updateChart(this.expenseChart, transactionName, transactionAmount);
            }

            this.showAlert(`Expense added: ${transactionName} = $${transactionAmount}`);
        }

        const balance = incomeUpdateNum - expenseUpdateNum;
        this.updateFinalBalance(balance);
    }

    updateChart(chart, name, amount) {
        chart.data.labels.push(name);
        chart.data.datasets[0].data.push(amount);
        chart.data.datasets[0].backgroundColor.push(this.getRandomColor());
        chart.update();
    }

    deleteTransaction(button) {
        const listItem = button.parentNode;
        const transactionAmount = parseFloat(listItem.querySelector('#history-amt').textContent);
        const transactionName = listItem.querySelector('#trans-name').textContent.trim();
        const transactionType = listItem.classList.contains('plus') ? 'plus' : 'minus';

        const transactionHistory = JSON.parse(localStorage.getItem(this.userID)) || [];

        // Filter out the transaction based on name, amount, and type
        const filteredHistory = transactionHistory.filter(transaction =>
            !(transaction.name === transactionName &&
                transaction.amount === transactionAmount &&
                transaction.type === transactionType)
        );

        // Update local storage with the filtered transactions
        localStorage.setItem(this.userID, JSON.stringify(filteredHistory));

        // Update the UI and remove the transaction
        this.removeFromUIAndChart(transactionType, transactionName, transactionAmount);
        listItem.parentNode.removeChild(listItem);
    }

    removeFromUIAndChart(type, name, amount) {
        const incomeUpdate = document.getElementById('income-update');
        const expenseUpdate = document.getElementById('expense-update');
        let incomeUpdateNum = parseFloat(incomeUpdate.textContent);
        let expenseUpdateNum = parseFloat(expenseUpdate.textContent);

        if (type === 'plus') {
            incomeUpdateNum -= amount;
            incomeUpdate.textContent = incomeUpdateNum;
            this.updateChartOnDelete(this.incomeChart, name);
            this.showAlert(`Income removed: ${name} = $${amount}`);
        } else if (type === 'minus') {
            expenseUpdateNum -= amount;
            expenseUpdate.textContent = expenseUpdateNum;
            this.updateChartOnDelete(this.expenseChart, name);
            this.showAlert(`Expense removed: ${name} = $${amount}`);
        }

        const balance = incomeUpdateNum - expenseUpdateNum;
        this.updateFinalBalance(balance);
    }

    updateChartOnDelete(chart, name) {
        const index = chart.data.labels.indexOf(name);
        if (index > -1) {
            chart.data.labels.splice(index, 1);
            chart.data.datasets[0].data.splice(index, 1);
            chart.data.datasets[0].backgroundColor.splice(index, 1);
            chart.update();
        }
    }

    updateFinalBalance(balance) {
        this.finalBalance.innerHTML = `$${balance}`;
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    showAlert(message) {
        const alertBox = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');

        alertMessage.textContent = message;
        alertBox.classList.add('active');

        setTimeout(() => {
            alertBox.classList.remove('active');
        }, 7000);
    }

    setEventListeners() {
        document.getElementById('closeAlert').onclick = () => {
            document.getElementById('customAlert').classList.remove('active');
        };

        window.onload = () => {
            const userIdInput = document.getElementById('userid');
            userIdInput.value = this.userID;
        };
    }
}


const tracker = new FinancialTracker();
