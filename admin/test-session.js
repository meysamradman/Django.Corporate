/**
 * 🔥 تست ساده Session - چک می‌کند چرا Session می‌ماند
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:8000',
  loginUrl: 'http://localhost:3000/login',
  waitTime: 30000, // 30 ثانیه برای تست سریع
  logFile: path.join(__dirname, 'session-test-log.txt'),
};

class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.startTime = Date.now();
    fs.writeFileSync(logFile, ''); // پاک کردن فایل قدیمی
  }

  log(message, type = 'INFO') {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const logMsg = `[${elapsed}s] [${type}] ${message}`;
    console.log(logMsg);
    fs.appendFileSync(this.logFile, logMsg + '\n');
  }

  info(msg) { this.log(msg, 'INFO'); }
  success(msg) { this.log(`✅ ${msg}`, 'SUCCESS'); }
  error(msg) { this.log(`❌ ${msg}`, 'ERROR'); }
  warning(msg) { this.log(`⚠️ ${msg}`, 'WARNING'); }
}

async function checkSession(page, logger) {
  logger.info('🔍 چک کردن Session...');
  
  // کوکی‌ها
  const cookies = await page.cookies();
  const sessionCookie = cookies.find(c => c.name === 'sessionid');
  const csrfCookie = cookies.find(c => c.name === 'csrftoken');
  
  const sessionId = sessionCookie?.value || null;
  const csrfToken = csrfCookie?.value || null;
  
  logger.info(`🍪 sessionid: ${sessionId ? sessionId.substring(0, 30) + '...' : '❌ وجود ندارد'}`);
  if (sessionCookie) {
    const expires = sessionCookie.expires ? new Date(sessionCookie.expires * 1000).toISOString() : 'Session';
    logger.info(`   └─ Expires: ${expires}`);
  }
  logger.info(`🍪 csrftoken: ${csrfToken ? csrfToken.substring(0, 30) + '...' : '❌ وجود ندارد'}`);
  
  // localStorage
  const ls = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const adminUiStorage = localStorage.getItem('admin-ui-storage');
    let adminUiData = null;
    try {
      adminUiData = adminUiStorage ? JSON.parse(adminUiStorage) : null;
    } catch (e) {
      adminUiData = adminUiStorage;
    }
    return {
      keys,
      adminUiStorage,
      adminUiData,
      hasData: keys.length > 0
    };
  });
  
  logger.info(`📦 localStorage: ${ls.hasData ? `✅ دارد (${ls.keys.join(', ')})` : '❌ خالی است'}`);
  if (ls.adminUiData) {
    logger.info(`   └─ admin-ui-storage keys: ${Object.keys(ls.adminUiData).join(', ')}`);
  }
  
  // sessionStorage
  const ss = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    return { keys, hasData: keys.length > 0 };
  });
  
  logger.info(`📦 sessionStorage: ${ss.hasData ? `✅ دارد (${ss.keys.join(', ')})` : '❌ خالی است'}`);
  
  // URL
  const url = page.url();
  logger.info(`📍 URL: ${url}`);
  logger.info(`📍 در صفحه login: ${url.includes('/login') ? '✅ بله' : '❌ خیر'}`);
  
  // Console logs از browser
  const consoleLogs = await page.evaluate(() => {
    // این فقط برای نمایش است - نمی‌توانیم console.log های قبلی را بگیریم
    return 'Console logs available in browser DevTools';
  });
  
  return {
    hasSessionCookie: !!sessionCookie,
    hasCsrfCookie: !!csrfCookie,
    hasLocalStorage: ls.hasData,
    hasSessionStorage: ss.hasData,
    isOnLoginPage: url.includes('/login'),
    sessionId: sessionId
  };
}

async function main() {
  const logger = new Logger(CONFIG.logFile);
  
  logger.info('🚀 شروع تست Session');
  logger.info('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: برو به صفحه login
    logger.info('\n📌 مرحله 1: رفتن به صفحه login');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info('');
    logger.info('='.repeat(60));
    logger.info('🔐 لطفاً خودتان لاگین کنید!');
    logger.info('='.repeat(60));
    logger.info('⏳ منتظر می‌مانم تا لاگین کنید...');
    logger.info('');
    
    // منتظر لاگین
    let loginDetected = false;
    for (let i = 0; i < 120; i++) { // 2 دقیقه
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = page.url();
      if (!url.includes('/login')) {
        loginDetected = true;
        logger.success('✅ لاگین موفق!');
        break;
      }
      if (i % 10 === 0 && i > 0) {
        logger.info(`⏱️ هنوز منتظر... (${i} ثانیه)`);
      }
    }
    
    if (!loginDetected) {
      logger.error('❌ لاگین انجام نشد!');
      await browser.close();
      return;
    }
    
    // Step 2: چک Session بعد از لاگین
    logger.info('\n📌 مرحله 2: چک Session بعد از لاگین');
    logger.info('='.repeat(60));
    const before = await checkSession(page, logger);
    
    if (!before.hasSessionCookie) {
      logger.error('❌ Session cookie وجود ندارد!');
      await browser.close();
      return;
    }
    
    logger.success(`✅ Session ID: ${before.sessionId?.substring(0, 30)}...`);
    
    // Step 3: صبر برای انقضا + API call برای trigger کردن 401
    logger.info('\n📌 مرحله 3: صبر برای انقضای Session (30 ثانیه)');
    logger.info('='.repeat(60));
    logger.info(`⏳ منتظر می‌مانم ${CONFIG.waitTime / 1000} ثانیه...`);
    logger.info('💡 هر 5 ثانیه یک API call می‌زنم تا 401 را trigger کنم...');
    
    const checkInterval = 5000; // هر 5 ثانیه چک کن
    const totalChecks = CONFIG.waitTime / checkInterval;
    let sessionExpired = false;
    const initialSessionId = before.sessionId;
    
    for (let i = 0; i < totalChecks; i++) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      const elapsed = (i + 1) * 5;
      logger.info(`\n⏱️ ${elapsed} ثانیه گذشته...`);
      
      // یک API call بزن تا اگر Session منقضی شده، 401 برگرداند
      try {
        logger.info('📡 Making API call to /admin/profile/...');
        const apiResult = await page.evaluate(async (apiUrl) => {
          try {
            const csrfToken = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || '';
            const response = await fetch(`${apiUrl}/admin/profile/`, {
              method: 'GET',
              credentials: 'include',
              headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
              }
            });
            const data = await response.json().catch(() => ({}));
            return { 
              status: response.status, 
              ok: response.ok,
              message: data?.metaData?.message || '',
              appStatusCode: data?.metaData?.AppStatusCode || response.status
            };
          } catch (e) {
            return { status: 0, ok: false, error: e.message };
          }
        }, CONFIG.apiUrl);
        
        logger.info(`📡 API Response: Status ${apiResult.status}, AppStatusCode: ${apiResult.appStatusCode || 'N/A'}`);
        if (apiResult.message) {
          logger.info(`   └─ Message: ${apiResult.message}`);
        }
        if (apiResult.error) {
          logger.warning(`   └─ Error: ${apiResult.error}`);
        }
        
        if (apiResult.status === 401 || apiResult.appStatusCode === 401) {
          logger.success(`✅ API returned 401 - Session منقضی شد بعد از ${elapsed} ثانیه!`);
          sessionExpired = true;
          // صبر کن تا frontend redirect کند
          logger.info('⏳ Waiting 5 seconds for frontend redirect...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
        }
      } catch (e) {
        logger.warning(`⚠️ API call error: ${e.message}`);
      }
      
      // چک سریع cookies و URL
      const cookies = await page.cookies();
      const sessionCookie = cookies.find(c => c.name === 'sessionid');
      const url = page.url();
      const currentSessionId = sessionCookie?.value;
      
      // چک کن که آیا Session ID تغییر کرده
      if (currentSessionId && initialSessionId && currentSessionId !== initialSessionId) {
        logger.warning(`⚠️ Session ID changed!`);
        logger.warning(`   └─ Old: ${initialSessionId.substring(0, 30)}...`);
        logger.warning(`   └─ New: ${currentSessionId.substring(0, 30)}...`);
        logger.info('💡 Frontend should detect this and redirect...');
      }
      
      if (!sessionCookie || url.includes('/login')) {
        logger.success(`✅ Session منقضی شد بعد از ${elapsed} ثانیه!`);
        sessionExpired = true;
        break;
      }
    }
    
    if (!sessionExpired) {
      logger.warning('⚠️ Session timeout reached but no expiry detected');
    }
    
    // Step 4: چک نهایی
    logger.info('\n📌 مرحله 4: چک نهایی Session');
    logger.info('='.repeat(60));
    const after = await checkSession(page, logger);
    
    // نتیجه
    logger.info('\n📊 نتیجه تست:');
    logger.info('='.repeat(60));
    logger.info(`🍪 Session Cookie: ${after.hasSessionCookie ? '❌ هنوز وجود دارد!' : '✅ پاک شده'}`);
    logger.info(`🍪 CSRF Cookie: ${after.hasCsrfCookie ? '❌ هنوز وجود دارد!' : '✅ پاک شده'}`);
    logger.info(`📦 LocalStorage: ${after.hasLocalStorage ? '❌ هنوز وجود دارد!' : '✅ پاک شده'}`);
    logger.info(`📦 SessionStorage: ${after.hasSessionStorage ? '❌ هنوز وجود دارد!' : '✅ پاک شده'}`);
    logger.info(`📍 در صفحه Login: ${after.isOnLoginPage ? '✅ بله' : '❌ خیر'}`);
    
    if (after.hasSessionCookie || after.hasLocalStorage || !after.isOnLoginPage) {
      logger.error('\n❌❌❌ تست ناموفق: Session منقضی نشده!');
      logger.error('مشکلات:');
      if (after.hasSessionCookie) logger.error('  - Session cookie هنوز وجود دارد');
      if (after.hasCsrfCookie) logger.error('  - CSRF cookie هنوز وجود دارد');
      if (after.hasLocalStorage) logger.error('  - LocalStorage هنوز داده دارد');
      if (!after.isOnLoginPage) logger.error('  - به صفحه login redirect نشده');
    } else {
      logger.success('\n✅✅✅ تست موفق: Session درست منقضی شد!');
    }
    
    // Screenshot
    await page.screenshot({ path: path.join(__dirname, 'test-result.png'), fullPage: true });
    logger.info(`📸 Screenshot: test-result.png`);
    
  } catch (error) {
    logger.error(`❌ خطا: ${error.message}`);
    logger.error(error.stack);
  } finally {
    logger.info('\n🏁 تست تمام شد');
    logger.info(`📄 لاگ کامل: ${CONFIG.logFile}`);
    
    // 5 ثانیه صبر کن تا کاربر نتیجه را ببیند
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

main().catch(console.error);
