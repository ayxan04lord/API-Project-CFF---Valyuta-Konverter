// ===== AUTH & USER SYSTEM =====

const Auth = (() => {
    const USERS_KEY = "azbank_users";
    const SESSION_KEY = "azbank_session";

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getCurrentUser() {
        const email = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY + "_rem");
        if (!email) return null;
        return getUsers().find(u => u.email === email) || null;
    }

    function register({ name, email, password, bank }) {
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            return { ok: false, msg: "Bu e-poçt artıq qeydiyyatdan keçib." };
        }
        const newUser = {
            name,
            email,
            password,
            bank,
            createdAt: new Date().toISOString(),
            balance: { AZN: 100.00, USD: 0, EUR: 0, GBP: 0, RUB: 0, TRY: 0 },
            transactions: [{
                id: Date.now(),
                type: "deposit",
                amount: 100,
                currency: "AZN",
                note: "Xoş gəlmisiniz bonusu",
                date: new Date().toISOString(),
                from: "AzBank",
                to: email
            }]
        };
        users.push(newUser);
        saveUsers(users);
        return { ok: true };
    }

    function login(email, password) {
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return { ok: false, msg: "E-poçt və ya şifrə yanlışdır." };
        sessionStorage.setItem(SESSION_KEY, email);
        return { ok: true, user };
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY + "_rem");
    }

    function updateUser(email, updater) {
        const users = getUsers();
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) return false;
        updater(users[idx]);
        saveUsers(users);
        return true;
    }

    function deposit(email, amount, currency) {
        return updateUser(email, user => {
            if (!user.balance[currency]) user.balance[currency] = 0;
            user.balance[currency] = parseFloat((user.balance[currency] + amount).toFixed(2));
            user.transactions.unshift({
                id: Date.now(),
                type: "deposit",
                amount,
                currency,
                note: "Depozit",
                date: new Date().toISOString(),
                from: "Kənar",
                to: email
            });
        });
    }

    function transfer(fromEmail, toEmail, amount, currency, note) {
        const users = getUsers();
        const fromIdx = users.findIndex(u => u.email === fromEmail);
        const toIdx = users.findIndex(u => u.email === toEmail);

        if (fromIdx === -1) return { ok: false, msg: "Göndərən tapılmadı." };
        if (toIdx === -1) return { ok: false, msg: "Alıcı tapılmadı. E-poçtu yoxlayın." };
        if (fromEmail === toEmail) return { ok: false, msg: "Özünüzə köçürə bilməzsiniz." };

        const { fee } = calcFee(amount, currency);
        const total = amount + fee;

        if (!users[fromIdx].balance[currency]) users[fromIdx].balance[currency] = 0;
        if (users[fromIdx].balance[currency] < total) {
            return { ok: false, msg: `Balans kifayət etmir. Lazım: ${total.toFixed(2)} ${currency} (komissiya daxil).` };
        }

        users[fromIdx].balance[currency] = parseFloat((users[fromIdx].balance[currency] - total).toFixed(2));
        if (!users[toIdx].balance[currency]) users[toIdx].balance[currency] = 0;
        users[toIdx].balance[currency] = parseFloat((users[toIdx].balance[currency] + amount).toFixed(2));

        const txId = Date.now();
        const dateNow = new Date().toISOString();
        const txNote = note || "Köçürmə";

        users[fromIdx].transactions.unshift({
            id: txId, type: "send", amount, currency,
            note: txNote, date: dateNow, from: fromEmail, to: toEmail, fee
        });
        users[toIdx].transactions.unshift({
            id: txId + 1, type: "receive", amount, currency,
            note: txNote, date: dateNow, from: fromEmail, to: toEmail
        });

        saveUsers(users);
        return { ok: true, fee };
    }

    return { getCurrentUser, register, login, logout, deposit, transfer, updateUser };
})();
