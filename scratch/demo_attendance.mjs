// Auto-demo script using puppeteer
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname);

async function demo() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Step 1: Login
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, '01_login.png'), fullPage: true });
    console.log('Screenshot: 01_login.png');

    // Fill credentials
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"]');

    if (emailInput && passwordInput) {
        await emailInput.type('student@gmail.com');
        await passwordInput.type('password');
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    }

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT, '02_after_login.png'), fullPage: true });
    console.log('Screenshot: 02_after_login.png | URL:', page.url());

    // Step 2: Navigate to attendance
    console.log('Navigating to attendance...');
    await page.goto('http://localhost:5173/student/attendance', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT, '03_attendance_hub.png'), fullPage: true });
    console.log('Screenshot: 03_attendance_hub.png');

    // Expand sidebar if needed - click Attendance menu item
    const attendanceSidebarBtn = await page.$x("//button[contains(., 'Attendance')]");
    if (attendanceSidebarBtn.length > 0) {
        await attendanceSidebarBtn[0].click();
        await new Promise(r => setTimeout(r, 800));
    }
    await page.screenshot({ path: path.join(OUT, '04_sidebar_expanded.png'), fullPage: true });
    console.log('Screenshot: 04_sidebar_expanded.png');

    // Navigate through each tab
    const tabs = [
        { url: '/student/attendance/dashboard', file: '05_dashboard.png' },
        { url: '/student/attendance/calendar', file: '06_calendar.png' },
        { url: '/student/attendance/analytics', file: '07_analytics.png' },
        { url: '/student/attendance/reports', file: '08_reports.png' },
        { url: '/student/attendance/notifications', file: '09_notifications.png' },
        { url: '/student/attendance/online', file: '10_online_classes.png' },
        { url: '/student/attendance/scan', file: '11_qr_scan.png' },
        { url: '/student/attendance/history', file: '12_history.png' },
    ];

    for (const tab of tabs) {
        console.log(`Navigating to ${tab.url}...`);
        await page.goto(`http://localhost:5173${tab.url}`, { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(OUT, tab.file), fullPage: true });
        console.log(`Screenshot: ${tab.file}`);
    }

    console.log('\n✅ Demo complete! All screenshots saved to scratch/ directory.');
    // Keep browser open for user to see
    // await browser.close();
}

demo().catch(err => {
    console.error('Demo failed:', err.message);
    process.exit(1);
});
