const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    GAD_TOKEN_ADDRESS: '0x3A2F29a2B8D38EcF1E3CF72f698C570594e6628c',
    RPC_URL: 'https://bsc-dataseed.binance.org/',
    DATA_FILE: path.join(__dirname, '../data/price-history.json'),
    DECIMALS: 18
};

// ============================================================
// ABI
// ============================================================
const GAD_ABI = [
    'function price() view returns (uint256)'
];

// ============================================================
// FETCH PRICE
// ============================================================
async function fetchPrice() {
    try {
        const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        const contract = new ethers.Contract(CONFIG.GAD_TOKEN_ADDRESS, GAD_ABI, provider);
        const price = await contract.price();
        return parseFloat(ethers.formatUnits(price, CONFIG.DECIMALS));
    } catch (err) {
        console.error('Error fetching price:', err.message);
        return null;
    }
}

// ============================================================
// UPDATE DATA
// ============================================================
async function updateData() {
    const price = await fetchPrice();
    if (price === null) {
        console.log('❌ Failed to fetch price, using existing data');
        return;
    }

    // خواندن داده‌های موجود
    let history = [];
    if (fs.existsSync(CONFIG.DATA_FILE)) {
        const content = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
        try {
            history = JSON.parse(content);
        } catch (e) {
            history = [];
        }
    }

    // تاریخ امروز
    const today = new Date().toISOString().split('T')[0];

    // بررسی اینکه آیا امروز قبلاً ثبت شده
    const existing = history.find(entry => entry.date === today);
    if (existing) {
        existing.price = price;
        console.log(`✅ Updated price for ${today}: ${price}`);
    } else {
        history.push({ date: today, price: price });
        console.log(`✅ Added new price for ${today}: ${price}`);
    }

    // مرتب‌سازی بر اساس تاریخ
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // حفظ حداقل 365 روز داده
    const maxDays = 365;
    if (history.length > maxDays) {
        history = history.slice(-maxDays);
    }

    // ذخیره داده‌ها
    fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(history, null, 2));
    console.log(`✅ Saved ${history.length} entries to ${CONFIG.DATA_FILE}`);
}

// ============================================================
// RUN
// ============================================================
updateData().catch(console.error);