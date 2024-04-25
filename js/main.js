const API_URL = "https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_uQSsDDA4zKXmzdZn77bNqH97ezWGoh07FEdqTaZU";
const FROM_CURRENCY_DEFAULT_VALUE = 1;
const FLOAT_FIXED_VALUE = 6;
let AVAILABLE_CURRENCY_LIST = ["RUB", "USD", "EUR", "GBP"];
let FROM_CURRENCY_DEFAULT_STATE = AVAILABLE_CURRENCY_LIST[0];
let TO_CURRENCY_DEFAULT_STATE = AVAILABLE_CURRENCY_LIST[1];

document.addEventListener("DOMContentLoaded", function () {
    const FROM_CURRENCY_BUTTONS = document.querySelectorAll("[data-from-currency]");
    const TO_CURRENCY_BUTTONS = document.querySelectorAll("[data-to-currency]");
    const FROM_REPORT_VALUE = document.querySelector("#from_report_value");
    const TO_REPORT_VALUE = document.querySelector("#to_report_value");
    const FROM_REPORT_CURRENT_RATE = document.querySelector("#from_report_current_rate");
    const TO_REPORT_CURRENT_RATE = document.querySelector("#to_report_current_rate");
    const FETCHING_HISTORY = {};
    FROM_REPORT_VALUE.value = FROM_CURRENCY_DEFAULT_VALUE;

    async function getCurrencyRate() {
        try {
            for (let currency of AVAILABLE_CURRENCY_LIST) {
                const response = await fetch(`${API_URL}&base_currency=${currency}&currencies=${AVAILABLE_CURRENCY_LIST.join(",")}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const json_data = await response.json();
                FETCHING_HISTORY[currency] = json_data.data;
            }
        }
        catch (error) {
            console.error("[DEBUG]Fetch Error:" + error);
        }
    }

    (async () => {
        await getCurrencyRate();
        TO_REPORT_VALUE.value = (parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]) * parseFloat(FROM_REPORT_VALUE.value));

        FROM_REPORT_CURRENT_RATE.textContent = `1 ${FROM_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]))} ${TO_CURRENCY_DEFAULT_STATE}`;
        TO_REPORT_CURRENT_RATE.textContent = `1 ${TO_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[TO_CURRENCY_DEFAULT_STATE][FROM_CURRENCY_DEFAULT_STATE]))} ${FROM_CURRENCY_DEFAULT_STATE}`;

        FROM_REPORT_VALUE.addEventListener("input", function () {
            TO_REPORT_VALUE.value = (parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]) * parseFloat(FROM_REPORT_VALUE.value));
        });

        TO_REPORT_VALUE.addEventListener("input", function () {
            FROM_REPORT_VALUE.value = (parseFloat(FETCHING_HISTORY[TO_CURRENCY_DEFAULT_STATE][FROM_CURRENCY_DEFAULT_STATE]) * parseFloat(TO_REPORT_VALUE.value));
        });

        FROM_CURRENCY_BUTTONS.forEach((from_button) => {
            if (from_button.getAttribute("data-from-currency") === FROM_CURRENCY_DEFAULT_STATE.toLowerCase()) {
                from_button.classList.add("converter__from-menu-btn--active");
            }
            from_button.addEventListener("click", function () {
                FROM_CURRENCY_BUTTONS.forEach((from_btn) => {
                    from_btn.classList.remove("converter__from-menu-btn--active");
                });
                this.classList.add("converter__from-menu-btn--active");
                FROM_CURRENCY_DEFAULT_STATE = this.getAttribute("data-from-currency").toUpperCase();
                FROM_REPORT_CURRENT_RATE.textContent = `1 ${FROM_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]))} ${TO_CURRENCY_DEFAULT_STATE}`;
                TO_REPORT_CURRENT_RATE.textContent = `1 ${TO_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[TO_CURRENCY_DEFAULT_STATE][FROM_CURRENCY_DEFAULT_STATE]))} ${FROM_CURRENCY_DEFAULT_STATE}`;
                TO_REPORT_VALUE.value = (parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]) * parseFloat(FROM_REPORT_VALUE.value));
            });
        });

        TO_CURRENCY_BUTTONS.forEach((to_button) => {
            if (to_button.getAttribute("data-to-currency").toUpperCase() === TO_CURRENCY_DEFAULT_STATE.toUpperCase()) {
                to_button.classList.add("converter__to-menu-btn--active");
            }
            to_button.addEventListener("click", function () {
                TO_CURRENCY_BUTTONS.forEach((to_btn) => {
                    to_btn.classList.remove("converter__to-menu-btn--active");
                });
                this.classList.add("converter__to-menu-btn--active");
                TO_CURRENCY_DEFAULT_STATE = this.getAttribute("data-to-currency").toUpperCase();
                FROM_REPORT_CURRENT_RATE.textContent = `1 ${FROM_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]))} ${TO_CURRENCY_DEFAULT_STATE}`;
                TO_REPORT_CURRENT_RATE.textContent = `1 ${TO_CURRENCY_DEFAULT_STATE} = ${(parseFloat(FETCHING_HISTORY[TO_CURRENCY_DEFAULT_STATE][FROM_CURRENCY_DEFAULT_STATE]))} ${FROM_CURRENCY_DEFAULT_STATE}`;
                TO_REPORT_VALUE.value = (parseFloat(FETCHING_HISTORY[FROM_CURRENCY_DEFAULT_STATE][TO_CURRENCY_DEFAULT_STATE]) * parseFloat(FROM_REPORT_VALUE.value));
            });
        });

    })();
});