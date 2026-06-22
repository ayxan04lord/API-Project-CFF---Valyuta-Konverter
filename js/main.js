// ===== MAIN APP =====
const API_KEY = "fca_live_uQSsDDA4zKXmzdZn77bNqH97ezWGoh07FEdqTaZU";
const API_URL = `https://api.freecurrencyapi.com/v1/latest?apikey=${API_KEY}`;

let ratesCache = {};
let fromCurrency = "USD";
let toCurrency = "AZN";

// ===== TOAST =====
function showToast(msg, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = `toast toast--${type} toast--show`;
    setTimeout(() => t.classList.remove("toast--show"), 3000);
}

// ===== THEME =====
function initTheme() {
    const saved = localStorage.getItem("azbank_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("azbank_theme", next);
    updateThemeIcon(next);
    const logoImg = document.getElementById("logoImg");
    logoImg.src = next === "dark" ? "img/logo_dark.png" : "img/logo_dark.png";
}

function updateThemeIcon(theme) {
    const icon = document.getElementById("themeIcon");
    icon.className = theme === "dark" ? "fa fa-sun" : "fa fa-moon";
}

// ===== ROUTER =====
let currentPage = "converter";

function navigateTo(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".header__menu-item").forEach(item => {
        item.classList.remove("header__menu-item--active");
    });
    document.querySelectorAll(`.nav-link[data-page="${page}"]`).forEach(link => {
        const li = link.closest(".header__menu-item");
        if (li) li.classList.add("header__menu-item--active");
    });

    currentPage = page;
    closeUserDropdown();

    // Page-specific renders
    if (page === "profile") renderProfile();
    if (page === "history") renderHistory();
    if (page === "transfer") renderTransferPage();
    if (page === "banks") renderBanks();
    if (page === "rates") renderRatesTable();
    if (page === "conditions") renderConditions();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== NAV LINKS =====
function initNavLinks() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const page = this.getAttribute("data-page");
            if (page) navigateTo(page);
        });
    });
}

// ===== AUTH UI =====
function updateAuthUI() {
    const user = Auth.getCurrentUser();
    const guestEl = document.getElementById("authGuest");
    const userEl = document.getElementById("authUser");
    const avatarEl = document.getElementById("userAvatar");
    const nameEl = document.getElementById("userDropdownName");
    const bankEl = document.getElementById("userDropdownBank");

    if (user) {
        guestEl.classList.add("hidden");
        userEl.classList.remove("hidden");
        const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        avatarEl.textContent = initials;
        nameEl.textContent = user.name;
        const bank = [...AZ_BANKS, ...INTL_BANKS].find(b => b.id === user.bank);
        bankEl.textContent = bank ? bank.name : "";
    } else {
        guestEl.classList.remove("hidden");
        userEl.classList.add("hidden");
    }
}

function closeUserDropdown() {
    document.getElementById("userDropdown").classList.remove("active");
}

function initAuthUI() {
    document.getElementById("userAvatar").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("userDropdown").classList.toggle("active");
    });
    document.addEventListener("click", closeUserDropdown);

    document.getElementById("openAuthModal").addEventListener("click", () => openModal("authModal"));
    document.getElementById("closeModal").addEventListener("click", () => closeModal("authModal"));

    document.getElementById("tabLogin").addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("tabRegister").addEventListener("click", () => switchAuthTab("register"));

    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("registerForm").addEventListener("submit", handleRegister);

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
        updateAuthUI();
        showToast("Hesabdan çıxış edildi.");
        navigateTo("converter");
    });

    document.querySelectorAll("[id$='LoginBtn']").forEach(btn => {
        btn.addEventListener("click", () => openModal("authModal"));
    });
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabL = document.getElementById("tabLogin");
    const tabR = document.getElementById("tabRegister");

    if (tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabL.classList.add("modal__tab--active");
        tabR.classList.remove("modal__tab--active");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabR.classList.add("modal__tab--active");
        tabL.classList.remove("modal__tab--active");
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const result = Auth.login(email, password);
    if (result.ok) {
        closeModal("authModal");
        updateAuthUI();
        showToast(`Xoş gəldiniz, ${result.user.name}!`);
        navigateTo("converter");
    } else {
        document.getElementById("loginError").textContent = result.msg;
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const bank = document.getElementById("regBank").value;
    if (password.length < 6) {
        document.getElementById("registerError").textContent = "Şifrə minimum 6 simvol olmalıdır.";
        return;
    }
    const result = Auth.register({ name, email, password, bank });
    if (result.ok) {
        Auth.login(email, password);
        closeModal("authModal");
        updateAuthUI();
        showToast(`Qeydiyyat uğurlu! Xoş gəldiniz, ${name}! 100 AZN bonus verildi.`);
        navigateTo("profile");
    } else {
        document.getElementById("registerError").textContent = result.msg;
    }
}

function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// ===== CURRENCY API =====
async function fetchRates() {
    try {
        const resp = await fetch(`${API_URL}&base_currency=USD&currencies=${AVAILABLE_CURRENCIES.join(",")}`);
        const data = await resp.json();
        if (data.data) {
            ratesCache = data.data;
            document.getElementById("updateTime").textContent =
                "Son yenilənmə: " + new Date().toLocaleTimeString("az-AZ");
            return true;
        }
    } catch (err) {
        console.error("API Error:", err);
    }
    // Fallback approximate rates (AZN base)
    ratesCache = {
        AZN: 1, USD: 0.589, EUR: 0.541, GBP: 0.464,
        RUB: 53.2, TRY: 19.1, CHF: 0.524, JPY: 89.0
    };
    document.getElementById("updateTime").textContent = "Offline məlumat (təxmini)";
    return false;
}

function getRate(from, to) {
    if (!ratesCache[from] || !ratesCache[to]) return 1;
    // Convert via USD base
    return ratesCache[to] / ratesCache[from];
}

// ===== CONVERTER =====
function buildCurrencyTabs(containerId, selected, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    AVAILABLE_CURRENCIES.forEach(cur => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "currency-tab" + (cur === selected ? " currency-tab--active" : "");
        const info = CURRENCY_INFO[cur];
        btn.innerHTML = `<span class="currency-tab__flag">${info ? info.flag : ""}</span><span>${cur}</span>`;
        btn.addEventListener("click", () => {
            onSelect(cur);
            container.querySelectorAll(".currency-tab").forEach(b => b.classList.remove("currency-tab--active"));
            btn.classList.add("currency-tab--active");
        });
        container.appendChild(btn);
    });
}

function updateConverterRates() {
    const fromInput = document.getElementById("from_report_value");
    const toInput = document.getElementById("to_report_value");
    const fromRate = document.getElementById("from_report_current_rate");
    const toRate = document.getElementById("to_report_current_rate");

    const rate = getRate(fromCurrency, toCurrency);
    const invRate = getRate(toCurrency, fromCurrency);
    const val = parseFloat(fromInput.value) || 0;

    toInput.value = (val * rate).toFixed(4);
    fromRate.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
    toRate.textContent = `1 ${toCurrency} = ${invRate.toFixed(4)} ${fromCurrency}`;
}

function initConverter() {
    buildCurrencyTabs("fromTabs", fromCurrency, (cur) => {
        fromCurrency = cur;
        updateConverterRates();
    });
    buildCurrencyTabs("toTabs", toCurrency, (cur) => {
        toCurrency = cur;
        updateConverterRates();
    });

    document.getElementById("from_report_value").addEventListener("input", () => {
        const val = parseFloat(document.getElementById("from_report_value").value) || 0;
        document.getElementById("to_report_value").value = (val * getRate(fromCurrency, toCurrency)).toFixed(4);
    });

    document.getElementById("to_report_value").addEventListener("input", () => {
        const val = parseFloat(document.getElementById("to_report_value").value) || 0;
        document.getElementById("from_report_value").value = (val * getRate(toCurrency, fromCurrency)).toFixed(4);
    });

    document.getElementById("swapBtn").addEventListener("click", () => {
        [fromCurrency, toCurrency] = [toCurrency, fromCurrency];
        buildCurrencyTabs("fromTabs", fromCurrency, (cur) => {
            fromCurrency = cur; updateConverterRates();
        });
        buildCurrencyTabs("toTabs", toCurrency, (cur) => {
            toCurrency = cur; updateConverterRates();
        });
        updateConverterRates();
    });

    document.getElementById("convertBtn").addEventListener("click", updateConverterRates);
    updateConverterRates();
}

function renderQuickRates() {
    const pairs = [["USD", "AZN"], ["EUR", "AZN"], ["GBP", "AZN"], ["RUB", "AZN"], ["TRY", "AZN"]];
    const container = document.getElementById("quickRates");
    container.innerHTML = pairs.map(([f, t]) => {
        const rate = getRate(f, t);
        const info = CURRENCY_INFO[f];
        return `<div class="quick-rate-card">
            <span class="quick-rate__flag">${info ? info.flag : ""}</span>
            <span class="quick-rate__code">${f}</span>
            <span class="quick-rate__val">${rate.toFixed(4)} ${t}</span>
        </div>`;
    }).join("");
}

// ===== BANKS PAGE =====
function renderBanks(filter = "all") {
    const allBanks = [...AZ_BANKS, ...INTL_BANKS];
    const filtered = filter === "all" ? allBanks : allBanks.filter(b => b.type === filter);
    const grid = document.getElementById("banksGrid");
    grid.innerHTML = filtered.map(bank => `
        <div class="bank-card">
            <div class="bank-card__header" style="border-left: 4px solid ${bank.color}">
                <div class="bank-card__logo">${bank.logo}</div>
                <div>
                    <h3 class="bank-card__name">${bank.name}</h3>
                    <p class="bank-card__fullname">${bank.fullName}</p>
                </div>
                <span class="bank-card__type-badge bank-card__type-badge--${bank.type}">
                    ${bank.type === "az" ? "🇦🇿 Azərb." : "🌍 Beynəl."}
                </span>
            </div>
            <p class="bank-card__desc">${bank.description}</p>
            <div class="bank-card__info-grid">
                <div class="bank-info-item">
                    <span class="bank-info-item__label">Komissiya</span>
                    <span class="bank-info-item__val">${bank.commission}</span>
                </div>
                <div class="bank-info-item">
                    <span class="bank-info-item__label">Min məbləğ</span>
                    <span class="bank-info-item__val">${bank.minAmount}</span>
                </div>
                <div class="bank-info-item">
                    <span class="bank-info-item__label">Max məbləğ</span>
                    <span class="bank-info-item__val">${bank.maxAmount}</span>
                </div>
                <div class="bank-info-item">
                    <span class="bank-info-item__label">İş saatları</span>
                    <span class="bank-info-item__val">${bank.workHours}</span>
                </div>
            </div>
            <div class="bank-card__currencies">
                ${bank.currencies.map(c => `<span class="currency-chip">${c}</span>`).join("")}
            </div>
            <div class="bank-card__features">
                ${bank.features.map(f => `<span class="feature-tag"><i class="fa fa-check"></i> ${f}</span>`).join("")}
            </div>
            <a href="${bank.website}" target="_blank" class="btn btn--outline btn--sm bank-card__website">
                <i class="fa fa-external-link-alt"></i> Sayta keç
            </a>
        </div>
    `).join("");

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("filter-btn--active", btn.dataset.filter === filter);
        btn.onclick = () => renderBanks(btn.dataset.filter);
    });
}

// ===== RATES TABLE =====
function renderRatesTable(filter = "") {
    const tbody = document.getElementById("ratesTableBody");
    const currencies = Object.keys(CURRENCY_INFO);
    const filtered = filter ? currencies.filter(c =>
        c.toLowerCase().includes(filter.toLowerCase()) ||
        CURRENCY_INFO[c].name.toLowerCase().includes(filter.toLowerCase())
    ) : currencies;

    tbody.innerHTML = filtered.map(cur => {
        const info = CURRENCY_INFO[cur];
        const aznRate = getRate("AZN", cur);
        const toAzn = getRate(cur, "AZN");
        const change = (Math.random() * 2 - 1).toFixed(2); // Simulated change
        const changeClass = parseFloat(change) >= 0 ? "rate-up" : "rate-down";
        const changeIcon = parseFloat(change) >= 0 ? "↑" : "↓";
        return `<tr>
            <td><span class="flag-cell">${info.flag}</span> ${info.name}</td>
            <td><strong>${cur}</strong></td>
            <td>${aznRate.toFixed(4)}</td>
            <td>${toAzn.toFixed(4)}</td>
            <td class="${changeClass}">${changeIcon} ${Math.abs(change)}%</td>
        </tr>`;
    }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("ratesSearch");
    if (searchInput) {
        searchInput.addEventListener("input", () => renderRatesTable(searchInput.value));
    }
});

// ===== PROFILE PAGE =====
function renderProfile() {
    const user = Auth.getCurrentUser();
    const warn = document.getElementById("profileLoginWarn");
    const panel = document.getElementById("profilePanel");

    if (!user) {
        warn.classList.remove("hidden");
        panel.classList.add("hidden");
        return;
    }
    warn.classList.add("hidden");
    panel.classList.remove("hidden");

    document.getElementById("profileAvatar").textContent =
        user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    const bank = [...AZ_BANKS, ...INTL_BANKS].find(b => b.id === user.bank);
    document.getElementById("profileBank").textContent = bank ? `🏦 ${bank.fullName}` : "";

    renderBalanceCards("profileBalanceCards", user);
    renderTxList("txHistory", user.transactions.slice(0, 10));

    document.getElementById("depositBtn").onclick = () => {
        const amount = parseFloat(document.getElementById("depositAmount").value);
        const currency = document.getElementById("depositCurrency").value;
        if (!amount || amount <= 0) { showToast("Düzgün məbləğ daxil edin.", "error"); return; }
        Auth.deposit(user.email, amount, currency);
        showToast(`${amount} ${currency} depozit edildi!`);
        renderProfile();
    };
}

function renderBalanceCards(containerId, user) {
    const container = document.getElementById(containerId);
    const currencies = Object.keys(user.balance).filter(c => user.balance[c] > 0 || c === "AZN");
    container.innerHTML = currencies.map(cur => {
        const info = CURRENCY_INFO[cur] || { flag: "💱", name: cur };
        return `<div class="balance-card">
            <span class="balance-card__flag">${info.flag}</span>
            <div>
                <p class="balance-card__amount">${user.balance[cur]?.toFixed(2) || "0.00"}</p>
                <p class="balance-card__currency">${cur} · ${info.name}</p>
            </div>
        </div>`;
    }).join("");
}

function renderTxList(containerId, txs) {
    const container = document.getElementById(containerId);
    if (!txs || txs.length === 0) {
        container.innerHTML = `<p class="text-muted text-center">Əməliyyat yoxdur</p>`;
        return;
    }
    container.innerHTML = txs.map(tx => {
        const icons = { deposit: "fa-arrow-down", send: "fa-arrow-up", receive: "fa-arrow-down" };
        const colors = { deposit: "tx-green", send: "tx-red", receive: "tx-green" };
        const labels = { deposit: "Depozit", send: "Göndərildi", receive: "Alındı" };
        const sign = tx.type === "send" ? "-" : "+";
        const date = new Date(tx.date).toLocaleString("az-AZ");
        return `<div class="tx-item">
            <div class="tx-item__icon ${colors[tx.type]}">
                <i class="fa ${icons[tx.type]}"></i>
            </div>
            <div class="tx-item__info">
                <p class="tx-item__label">${labels[tx.type] || tx.type}</p>
                <p class="tx-item__sub">${tx.type === "send" ? "→ " + tx.to : tx.type === "receive" ? "← " + tx.from : tx.note}</p>
                <p class="tx-item__note">${tx.note}</p>
            </div>
            <div class="tx-item__amount ${colors[tx.type]}">
                ${sign}${tx.amount.toFixed(2)} ${tx.currency}
            </div>
            <div class="tx-item__date">${date}</div>
        </div>`;
    }).join("");
}

// ===== HISTORY PAGE =====
function renderHistory() {
    const user = Auth.getCurrentUser();
    const warn = document.getElementById("historyLoginWarn");
    const panel = document.getElementById("historyPanel");
    if (!user) {
        warn.classList.remove("hidden");
        panel.classList.add("hidden");
        return;
    }
    warn.classList.add("hidden");
    panel.classList.remove("hidden");
    renderTxList("historyList", user.transactions);
}

// ===== TRANSFER PAGE =====
function renderTransferPage() {
    const user = Auth.getCurrentUser();
    const warn = document.getElementById("transferLoginWarn");
    const panel = document.getElementById("transferPanel");
    if (!user) {
        warn.classList.remove("hidden");
        panel.classList.add("hidden");
        return;
    }
    warn.classList.add("hidden");
    panel.classList.remove("hidden");
    renderBalanceCards("balanceCards", user);

    const amountInput = document.getElementById("tAmount");
    const currencySelect = document.getElementById("tCurrency");
    const feeInfo = document.getElementById("tFeeInfo");

    function updateFeeDisplay() {
        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect.value;
        if (amount > 0) {
            const { fee, rule } = calcFee(amount, currency);
            feeInfo.innerHTML = `<i class="fa fa-info-circle"></i> Komissiya: <strong>${fee.toFixed(2)} ${currency}</strong> (${rule.label}) · Cəmi: <strong>${(amount + fee).toFixed(2)} ${currency}</strong>`;
        } else {
            feeInfo.innerHTML = "";
        }
    }

    amountInput.addEventListener("input", updateFeeDisplay);
    currencySelect.addEventListener("change", updateFeeDisplay);

    document.getElementById("doTransferBtn").onclick = () => {
        const to = document.getElementById("tTo").value.trim();
        const amount = parseFloat(document.getElementById("tAmount").value);
        const currency = document.getElementById("tCurrency").value;
        const note = document.getElementById("tNote").value.trim();
        const errEl = document.getElementById("tError");
        errEl.textContent = "";

        if (!to || !amount) { errEl.textContent = "Bütün məlumatları doldurun."; return; }
        const result = Auth.transfer(user.email, to, amount, currency, note);
        if (result.ok) {
            showToast(`${amount} ${currency} göndərildi! Komissiya: ${result.fee} ${currency}`);
            document.getElementById("tTo").value = "";
            document.getElementById("tAmount").value = "";
            document.getElementById("tNote").value = "";
            feeInfo.innerHTML = "";
            renderTransferPage();
        } else {
            errEl.textContent = result.msg;
        }
    };
}

// ===== CONDITIONS PAGE =====
function renderConditions() {
    const azContent = document.getElementById("condAz");
    const intlContent = document.getElementById("condIntl");
    const rulesContent = document.getElementById("condRules");

    azContent.innerHTML = `
        <div class="conditions-table-wrap">
            <table class="conditions-table">
                <thead>
                    <tr>
                        <th>Bank</th>
                        <th>Komissiya</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Valyutalar</th>
                        <th>Alış spreadi</th>
                        <th>Satış spreadi</th>
                        <th>İş saatı</th>
                    </tr>
                </thead>
                <tbody>
                    ${AZ_BANKS.map(b => `<tr>
                        <td><strong>${b.name}</strong></td>
                        <td>${b.commission}</td>
                        <td>${b.minAmount}</td>
                        <td>${b.maxAmount}</td>
                        <td>${b.currencies.join(", ")}</td>
                        <td class="rate-up">+${b.buySpread}%</td>
                        <td class="rate-up">+${b.sellSpread}%</td>
                        <td>${b.workHours}</td>
                    </tr>`).join("")}
                </tbody>
            </table>
        </div>`;

    intlContent.innerHTML = `
        <div class="conditions-table-wrap">
            <table class="conditions-table">
                <thead>
                    <tr>
                        <th>Platforma</th>
                        <th>Komissiya</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Xüsusiyyətlər</th>
                    </tr>
                </thead>
                <tbody>
                    ${INTL_BANKS.map(b => `<tr>
                        <td><strong>${b.name}</strong></td>
                        <td>${b.commission}</td>
                        <td>${b.minAmount}</td>
                        <td>${b.maxAmount}</td>
                        <td>${b.features.join(" · ")}</td>
                    </tr>`).join("")}
                </tbody>
            </table>
        </div>`;

    rulesContent.innerHTML = `
        <div class="rules-grid">
            <div class="rule-card">
                <div class="rule-card__icon">📋</div>
                <h3>Mübadilə Limiti</h3>
                <p>Azərbaycanda fiziki şəxslər gündəlik 10,000 AZN-ə qədər nağd valyuta mübadiləsi apara bilər. Daha böyük məbləğlər üçün bank hesabı lazımdır.</p>
            </div>
            <div class="rule-card">
                <div class="rule-card__icon">🪪</div>
                <h3>Şəxsiyyət Tələbi</h3>
                <p>500 AZN-dən yuxarı bütün əməliyyatlar üçün şəxsiyyət vəsiqəsi tələb olunur. AMBD tənzimləməsinə uyğun olaraq.</p>
            </div>
            <div class="rule-card">
                <div class="rule-card__icon">🏦</div>
                <h3>AMBD Tənzimləməsi</h3>
                <p>Azərbaycan Mərkəzi Bank Departamenti bütün bank və valyuta mübadiləxanalarının fəaliyyətini tənzimləyir. Rəsmi kurslar hər gün elan edilir.</p>
            </div>
            <div class="rule-card">
                <div class="rule-card__icon">💸</div>
                <h3>Köçürmə Məhdudiyyəti</h3>
                <p>Xarici ölkəyə köçürmə üçün 10,000 USD-dən yuxarı məbləğlər Vergi Xidmətinə bildirilir. FATF standartlarına riayət edilir.</p>
            </div>
            <div class="rule-card">
                <div class="rule-card__icon">📊</div>
                <h3>Valyuta Nəzarəti</h3>
                <p>AZN sabit məzənnə rejimindədir. Mərkəzi Bank USD/AZN məzənnəsini 1.70 AZN ətrafında saxlayır.</p>
            </div>
            <div class="rule-card">
                <div class="rule-card__icon">🔒</div>
                <h3>Sığorta</h3>
                <p>Azərbaycanda bank depozitləri 30,000 AZN-ə qədər Əmanətlərin Sığortası Fondunun zəmanəti altındadır.</p>
            </div>
        </div>`;

    // Tab switching
    document.querySelectorAll(".cond-tab").forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll(".cond-tab").forEach(t => t.classList.remove("cond-tab--active"));
            document.querySelectorAll(".conditions-content").forEach(c => c.classList.add("hidden"));
            tab.classList.add("cond-tab--active");
            document.getElementById("cond" + tab.dataset.ctab.charAt(0).toUpperCase() + tab.dataset.ctab.slice(1)).classList.remove("hidden");
        };
    });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initNavLinks();
    initAuthUI();
    updateAuthUI();

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    await fetchRates();
    initConverter();
    renderQuickRates();
    renderBanks();

    // Pre-render conditions so table exists
    setTimeout(renderConditions, 100);

    navigateTo("converter");

    // Refresh rates every 5 min
    setInterval(async () => {
        await fetchRates();
        updateConverterRates();
        renderQuickRates();
        if (currentPage === "rates") renderRatesTable();
    }, 300000);
});
