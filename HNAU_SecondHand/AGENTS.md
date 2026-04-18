# 河南农业大学·农大闲置 - 项目规范文档

## 1. 项目概览

**项目名称**：河南农业大学·农大闲置  
**项目类型**：纯前端静态网站（无后端、无框架、无CDN依赖）  
**技术栈**：HTML5 + CSS3 + 原生JavaScript (ES6+)  
**数据存储**：localStorage  
**目标用户**：河南农业大学在校师生

## 2. 项目结构

```
HNAU_SecondHand/
├── home.html                # 首页（核心浏览页）
├── stu_check.html           # 校园认证页
├── user_login.html          # 登录注册页
├── release_goods.html       # 商品发布页（唯一权限拦截页）
├── user_center.html         # 个人中心
├── manage_admin.html        # 管理员后台
├── style/
│   └── main.css             # 全局样式（CSS变量统一管理）
├── script/
│   ├── common.js            # 公共核心函数（存储/跳转/提示/权限）
│   ├── check.js             # 校园认证逻辑
│   ├── login.js             # 登录注册逻辑
│   ├── release.js           # 商品发布逻辑
│   ├── home.js              # 首页逻辑
│   ├── center.js            # 个人中心逻辑
│   └── admin.js             # 管理员后台逻辑
└── images/
    └── logo.png             # Logo占位图
```

## 3. 核心权限逻辑

### 3.1 全局规则
- **所有页面无访问限制**：home/stu_check/user_login/user_center/manage_admin 均可自由浏览
- **唯一权限拦截点**：点击「发布商品」按钮或打开 release_goods.html 触发四级校验

### 3.2 四级权限校验

| 校验层级 | 条件 | 操作 |
|---------|------|------|
| 校验1 | hnau_verify_state ≠ approved | 提示「发布商品需先完成校园认证」，跳转stu_check.html |
| 校验2 | approved + 用户未注册 | 提示「请先完成账号注册」，跳转user_login.html (注册选项卡) |
| 校验3 | 已注册 + 未登录 | 提示「请先登录」，跳转user_login.html (登录选项卡) |
| 校验4 | 已认证 + 已注册 + 已登录 | 直接进入发布页面 |

## 4. 数据存储规范

### 4.1 localStorage键名

| 键名 | 说明 | 数据格式 |
|------|------|---------|
| hnau_verify_info | 认证信息 | Object |
| hnau_verify_state | 认证状态 | string: unsubmitted/pending/approved |
| hnau_users | 用户列表 | Array |
| hnau_login_state | 登录状态 | Object: {isLogin, curUser} |
| hnau_goods | 商品列表 | Array |
| hnau_collects | 收藏列表 | Array |

### 4.2 数据安全
- 所有存储操作使用 JSON.stringify/JSON.parse
- 所有读取操作前做存在性判断和默认值兜底
- 所有存储操作包裹 try-catch 异常捕获

## 5. 页面功能说明

### 5.1 首页 (home.html)
- 搜索功能（实时联想提示）
- 双维度筛选（校区 + 分类）
- 商品展示（3D卡片翻转效果）
- 收藏功能（需登录）

### 5.2 校园认证页 (stu_check.html)
- 三种状态展示：未提交/待审核/已通过
- 校区-学院联动加载
- 图片上传（预览/删除/格式校验/大小校验）
- 提交后自动进入待审核状态

### 5.3 登录注册页 (user_login.html)
- 双选项卡切换
- 用户名实时判重
- 防重复提交
- 注册成功后自动切换到登录选项卡

### 5.4 商品发布页 (release_goods.html)
- 四级权限校验拦截
- 多图上传（最多3张，Base64存储）
- 价格/微信号格式校验
- 发布成功后跳转首页

### 5.5 个人中心 (user_center.html)
- 基本信息展示
- 认证状态管理（修改/重置）
- 我的发布管理
- 我的收藏管理
- 碳足迹计算器

### 5.6 管理员后台 (manage_admin.html)
- 管理员账号：admin / 123456
- 待审核认证列表（通过/拒绝操作）
- 用户列表
- 商品列表（删除操作）

## 6. CSS样式规范

### 6.1 CSS变量
```css
:root {
    --primary-color: #006633;     /* 农大绿 */
    --primary-light: #E8F5E9;    /* 浅绿辅助色 */
    --accent-color: #F5A623;     /* 麦穗金 */
    --success-color: #198754;    /* 成功色 */
    --error-color: #DC3545;      /* 错误色 */
    --shadow-md: 0 2px 10px rgba(0,0,0,0.08);
    --radius-md: 8px;
    --transition-normal: 0.3s ease-in-out;
}
```

### 6.2 响应式断点
- PC端：≥1200px
- 平板端：768px - 1199px
- 移动端：<768px

## 7. 开发规范

### 7.1 JavaScript规范
- 模块化开发，每个页面专属JS独立隔离
- 公共逻辑写入 common.js
- 所有函数/变量按模块命名
- 所有DOM操作做存在性判断
- 所有事件绑定做重复绑定规避

### 7.2 HTML规范
- 语义化标签（header/nav/main/section/footer）
- 表单元素绑定唯一 id/name
- label 与 input 一一对应（for/id 绑定）
- 每个模块添加清晰注释

### 7.3 路径规范
- 所有引用使用相对路径 `./xxx/xxx`
- 文件/文件夹名称统一英文小写+下划线
- 无大写/中文/特殊字符

## 8. 测试要点

### 8.1 功能测试
- [ ] 首页商品展示和筛选
- [ ] 校园认证流程（提交/审核/通过）
- [ ] 注册登录流程（判重/校验/状态同步）
- [ ] 商品发布流程（权限校验/表单校验/图片上传）
- [ ] 收藏功能（添加/取消）
- [ ] 个人中心信息展示和管理
- [ ] 管理员审核操作

### 8.2 兼容性测试
- Chrome ≥ 90
- Edge ≥ 90
- Firefox ≥ 88
- 移动端浏览器（iOS Safari/Android Chrome）

### 8.3 响应式测试
- 桌面端（1920px）
- 平板端（768px - 1199px）
- 移动端（375px - 414px）
- 汉堡菜单展开/收起
- 表格横向滚动

## 9. 常见问题排查

### 9.1 页面空白
- 检查 localStorage 是否可用
- 检查控制台是否有 JS 报错
- 检查元素是否存在（ID选择器）

### 9.2 数据不显示
- 检查 localStorage 键名是否正确
- 检查数据格式是否正确（JSON.parse）
- 刷新页面重试

### 9.3 权限校验失败
- 检查 hnau_verify_state 值是否为 approved
- 检查 hnau_users 中是否存在用户名
- 检查 hnau_login_state.isLogin 是否为 true

## 10. 部署说明

### 10.1 本地运行
双击 `home.html` 即可直接运行，无需任何配置。

### 10.2 服务部署
任何静态文件服务器均可部署，如：
- Python: `python3 -m http.server 5000`
- Node.js: `npx server -l 5000`
- Nginx: 配置静态文件目录

### 10.3 注意事项
- 确保所有文件使用相对路径
- 确保服务器支持 localStorage（同源策略）
- 无需后端服务，纯前端即可运行
