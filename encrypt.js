import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pagecrypt from 'pagecrypt';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUBLIC_DIR = path.join(__dirname, 'public');
const PASSWORD = process.env.ARTICLE_PASSWORD;

if (!PASSWORD || PASSWORD.trim() === '' || PASSWORD === 'undefined') {
    console.error('❌ 严重错误：未能获取到有效的 ARTICLE_PASSWORD 环境变量！');
    console.error('为了防止私密文章以“空密码”形式裸奔泄漏，deploy已强制拦截退出。');
    process.exit(1);
}

console.log('📦 当前 pagecrypt 模块导出的所有内容：', Object.keys(pagecrypt));

// 动态寻找加密函数（兼容新旧版本命名）
// 新版可能叫 encrypt，或者挂载在某个内部属性下
const encryptFn = pagecrypt.encryptFile || pagecrypt.encrypt || pagecrypt.default?.encryptFile;

if (!encryptFn) {
    console.error('❌ 致命错误：未能在 pagecrypt 模块中找到任何加密函数，请查看上方打印的结构。');
}

async function walkAndEncrypt(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            await walkAndEncrypt(filePath);
        } else if (file === 'index.html') {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 当内容中出现标志字符串时，加密内容
            if (content.includes('encrypted-content')) {
                console.log(`🔒 正在加密页面: ${filePath}`);
                
                try {
                    await encryptFn(filePath, filePath, PASSWORD);
                } catch (err) {
                    console.error(`❌ 加密失败 [${filePath}]:`, err);
                }
            }
        }
    }
}

async function run() {
    console.log('🚀 开始扫描并加密受保护的页面...');
    if (encryptFn) {
        await walkAndEncrypt(PUBLIC_DIR);
    }
    console.log('✅ 任务执行完毕！');
}

run();