import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const outputDir = path.resolve(frontendDir, '..', '论文相关材料', '论文截图')

fs.mkdirSync(outputDir, { recursive: true })

const mockUser = {
  _id: '6804c9658bcf86cd79943901',
  name: '胡建华',
  email: '2647345339@qq.com',
  token: 'mock-jwt-token',
}

const mockResume = {
  _id: '6804c9658bcf86cd79943902',
  title: '软件工程师求职简历',
  thumbnailLink: '',
  template: {
    theme: '01',
    colorPalette: [],
  },
  completion: 88,
  profileInfo: {
    fullName: '胡建华',
    designation: '前端开发工程师',
    summary:
      '具备 Web 前后端项目开发经验，熟悉 React、Node.js 与 MongoDB，能够独立完成中小型系统的设计、实现与测试。',
  },
  contactInfo: {
    email: '2647345339@qq.com',
    phone: '13800138000',
    location: '江西南昌',
    linkedin: 'https://linkedin.com/in/hujianhua',
    github: 'https://github.com/Code-JHua',
    website: 'https://example.com',
  },
  workExperience: [
    {
      company: '某互联网科技有限公司',
      role: '前端开发实习生',
      startDate: '2024-06',
      endDate: '2024-09',
      description:
        '参与企业后台管理系统页面开发，负责表单组件封装、接口联调和页面样式优化，提升了页面复用性与交互体验。',
    },
  ],
  education: [
    {
      degree: '本科',
      institution: '东华理工大学',
      startDate: '2022-09',
      endDate: '2026-06',
    },
  ],
  skills: [
    { name: 'React', progress: 90 },
    { name: 'Node.js', progress: 80 },
    { name: 'MongoDB', progress: 78 },
    { name: 'Tailwind CSS', progress: 85 },
  ],
  projects: [
    {
      title: 'ResumeXpert 简历生成系统',
      description:
        '采用 React、Express 和 MongoDB 实现在线简历创建、编辑、模板预览和 PDF 导出功能。',
      github: 'https://github.com/Code-JHua/ResumeXpert',
      liveDemo: 'https://example-demo.com',
    },
  ],
  certifications: [
    {
      title: '全国计算机技术与软件专业技术资格证书',
      issuer: '工业和信息化部',
      year: '2025',
    },
  ],
  languages: [
    { name: '中文', progress: 100 },
    { name: '英文', progress: 75 },
  ],
  interests: ['Web 开发', '开源项目', '技术写作'],
  createdAt: '2026-04-18T10:00:00.000Z',
  updatedAt: '2026-04-20T10:30:00.000Z',
}

async function routeApi(page) {
  await page.route('**/api/auth/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    })
  })

  await page.route('**/api/resume', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockResume]),
      })
      return
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockResume),
      })
      return
    }

    await route.fallback()
  })

  await page.route(`**/api/resume/${mockResume._id}`, async (route) => {
    const method = route.request().method()

    if (method === 'GET' || method === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResume),
      })
      return
    }

    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Resume deleted successfully' }),
      })
      return
    }

    await route.fallback()
  })

  await page.route(`**/api/resume/${mockResume._id}/upload-image`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        thumbnailLink: '',
        profilePreviewUrl: '',
      }),
    })
  })
}

async function takeScreenshot(page, name, locator = null) {
  const target = locator ? page.locator(locator) : page
  await target.screenshot({
    path: path.join(outputDir, name),
    fullPage: !locator,
  })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const guestContext = await browser.newContext({
    viewport: { width: 1440, height: 2000 },
    deviceScaleFactor: 1.25,
  })
  const page = await guestContext.newPage()

  await page.addInitScript(() => {
    localStorage.removeItem('token')
    localStorage.setItem('resumexpert-language', 'zh')
  })

  await routeApi(page)

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outputDir, '01-首页.png'), fullPage: true })

  await page.getByRole('button', { name: /开始|Get Started/i }).first().click()
  await page.waitForTimeout(800)
  await takeScreenshot(page, '02-登录弹窗.png', '.fixed.inset-0')

  await page.getByRole('button', { name: /注册|Sign up/i }).click()
  await page.waitForTimeout(800)
  await takeScreenshot(page, '03-注册弹窗.png', '.fixed.inset-0')

  await guestContext.close()

  const authContext = await browser.newContext({
    viewport: { width: 1440, height: 2000 },
    deviceScaleFactor: 1.25,
  })
  const authPage = await authContext.newPage()

  await authPage.addInitScript((user) => {
    localStorage.setItem('token', user.token)
    localStorage.setItem('resumexpert-language', 'zh')
  }, mockUser)

  await routeApi(authPage)

  await authPage.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })
  await authPage.waitForTimeout(1200)
  await authPage.screenshot({ path: path.join(outputDir, '04-用户仪表盘.png'), fullPage: true })

  await authPage.goto(`http://localhost:5173/resume/${mockResume._id}`, { waitUntil: 'networkidle' })
  await authPage.waitForTimeout(1500)
  await authPage.screenshot({ path: path.join(outputDir, '05-简历编辑页.png'), fullPage: true })

  await authPage.locator('button').filter({ hasText: /主题|Theme/i }).first().click()
  await authPage.waitForTimeout(1200)
  await takeScreenshot(authPage, '06-模板切换界面.png', '.fixed.inset-0')

  const themeCloseButton = authPage.locator('.fixed.inset-0 button').nth(0)
  if (await themeCloseButton.isVisible().catch(() => false)) {
    await themeCloseButton.click()
  } else {
    await authPage.keyboard.press('Escape')
  }

  await authPage.waitForTimeout(500)
  await authPage.locator('button').filter({ hasText: /下载|Download/i }).first().click()
  await authPage.waitForTimeout(1500)
  await takeScreenshot(authPage, '07-PDF预览界面.png', '.fixed.inset-0')

  await authContext.close()
  await browser.close()
  console.log(`Screenshots saved to: ${outputDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
