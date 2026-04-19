# 农大闲置 - 发布权限校验系统（修复版）

## 一、权限校验流程（正确逻辑）

```
点击「发布闲置」
    ↓
校验0：是否登录？
    ├─ 否 → 提示"请先登录"，跳转登录页
    └─ 是 → 继续校验1
            ↓
        校验1：authStatus === 'approved'？
            ├─ approved → 进入发布页 ✅
            ├─ pending → 提示"等待审核"，跳转个人中心
            ├─ rejected → 提示"重新认证"，跳转认证页
            └─ unsubmitted → 提示"先认证"，跳转认证页
```

## 二、认证状态说明

| 状态值 | 用户看到的文案 | 说明 |
|--------|---------------|------|
| `unsubmitted` | 未提交 | 注册后默认状态，需主动提交认证 |
| `pending` | 待审核 | 已提交认证，等待管理员审核 |
| `approved` | 已认证 | 管理员审核通过，可发布商品 |
| `rejected` | 已拒绝 | 认证被拒，需重新提交 |

## 三、正确流程

```
注册账号 ──authStatus='unsubmitted'──→ 登录 ──提交认证──→ 待审核 ──管理员通过──→ 已认证
   │                                                                              ↓
   └─── 退出登录 ─────────────────────────────────────────────────────────────→ 发布商品 ✅
```

## 四、localStorage 键名规范

| 键名 | 说明 | 数据示例 |
|------|------|----------|
| `hnau_login_state` | 登录状态 | `{isLogin:true, curUser:"张三"}` |
| `hnau_users` | 用户列表 | `[{username:"张三", authStatus:"approved", studentId:"2021001"}]` |
| `hnau_pending_auths` | 待审核列表 | `[{studentId:"2021001", status:"approved"}]` |
| `hnau_verify_info` | 认证信息 | `{studentId:"2021001", campus:"东校区"}` |
| `hnau_verify_state` | 全局认证状态 | `"pending"` |

**重要**：校验发布权限时，**只读取 `hnau_users` 中用户的 `authStatus`**，不读取全局状态！

## 五、Coze 低代码平台配置

### 5.1 发布按钮点击事件

```javascript
// ========== 发布权限校验（核心逻辑）==========

// 1. 获取登录状态
const loginState = STORAGE.get('hnau_login_state') || {};

// 2. 校验0：是否登录
if (!loginState.isLogin || !loginState.curUser) {
  TOAST.show('请先登录后再发布商品');
  PAGE.navigate('user_login.html');
  return;
}

// 3. 获取用户认证状态（只从用户数据读取，不读全局状态）
const users = STORAGE.get('hnau_users') || [];
const user = users.find(u => u.username === loginState.curUser);
const authStatus = user?.authStatus || 'unsubmitted';

// 4. 校验1：认证状态
if (authStatus === 'approved') {
  // 校验通过，跳转发布页
  PAGE.navigate('publish.html');
} else if (authStatus === 'pending') {
  TOAST.show('您的认证正在审核中，请等待审核通过');
  PAGE.navigate('user_center.html');
} else if (authStatus === 'rejected') {
  TOAST.show('您的认证申请被拒绝，请重新提交认证信息');
  PAGE.navigate('stu_check.html');
} else {
  TOAST.show('发布商品需先完成校园认证');
  PAGE.navigate('stu_check.html');
}
```

### 5.2 注册按钮点击事件

```javascript
// ========== 注册逻辑（修复版）==========

const username = INPUT.regUsername;
const password = INPUT.regPassword;
const confirmPassword = INPUT.regConfirmPassword;

// 1. 表单验证
if (!username || !password) {
  TOAST.show('请填写用户名和密码', 'error');
  return;
}

if (password !== confirmPassword) {
  TOAST.show('两次密码输入不一致', 'error');
  return;
}

// 2. 检查用户名是否已存在
const users = STORAGE.get('hnau_users') || [];
if (users.find(u => u.username === username)) {
  TOAST.show('该用户名已被注册', 'error');
  return;
}

// 3. 【关键】创建用户 - 注册时authStatus必须为'unsubmitted'
const newUser = {
  username: username,
  password: password,
  regTime: new Date().toISOString(),
  authStatus: 'unsubmitted',  // 【重要】注册时默认未提交！
  studentId: '',               // 认证通过后关联
  campus: '',
  college: ''
};

users.push(newUser);
STORAGE.set('hnau_users', users);

// 4. 登录并跳转
STORAGE.set('hnau_login_state', { isLogin: true, curUser: username });

TOAST.show('注册成功！', 'success');
PAGE.navigate('user_center.html');
```

### 5.3 提交认证按钮点击事件

```javascript
// ========== 提交认证逻辑 ==========

const studentId = INPUT.studentId;
const campus = SELECT.campus;
const college = SELECT.college;
const studentCard = INPUT.studentCardImage;

if (!studentId || !campus || !college || !studentCard) {
  TOAST.show('请填写完整的认证信息', 'error');
  return;
}

// 1. 获取当前登录用户
const loginState = STORAGE.get('hnau_login_state');
if (!loginState || !loginState.curUser) {
  TOAST.show('请先登录', 'error');
  PAGE.navigate('user_login.html');
  return;
}

// 2. 添加到待审核列表
const pendingList = STORAGE.get('hnau_pending_auths') || [];
pendingList.push({
  id: Date.now().toString(),
  studentId: studentId,
  campus: campus,
  college: college,
  studentCardImage: studentCard,
  submitTime: new Date().toISOString(),
  status: 'pending'
});
STORAGE.set('hnau_pending_auths', pendingList);

// 3. 【关键】更新用户认证状态为'pending'
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.username === loginState.curUser);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'pending';
  users[userIndex].studentId = studentId;  // 关联学号
  users[userIndex].campus = campus;
  users[userIndex].college = college;
  STORAGE.set('hnau_users', users);
}

// 4. 保存认证信息
STORAGE.set('hnau_verify_info', { studentId, campus, college, studentCardImage: studentCard });
STORAGE.set('hnau_verify_state', 'pending');

TOAST.show('认证申请已提交，请等待管理员审核', 'success');
PAGE.navigate('user_center.html');
```

### 5.4 管理员「通过」按钮点击事件

```javascript
// ========== 管理员通过认证 ==========

const authId = EVENT.target.dataset.id;
const studentId = EVENT.target.dataset.studentid;

// 1. 更新待审核列表状态
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const pendingIndex = pendingList.findIndex(a => a.id === authId);
if (pendingIndex !== -1) {
  pendingList[pendingIndex].status = 'approved';
  pendingList[pendingIndex].updateTime = new Date().toISOString();
  STORAGE.set('hnau_pending_auths', pendingList);
}

// 2. 【关键】找到申请者并更新其认证状态
const users = STORAGE.get('hnau_users') || [];
// 根据学号查找用户
const userIndex = users.findIndex(u => u.studentId === studentId && u.authStatus === 'pending');
if (userIndex !== -1) {
  users[userIndex].authStatus = 'approved';
  STORAGE.set('hnau_users', users);
}

// 3. 更新全局状态
STORAGE.set('hnau_verify_state', 'approved');

// 4. 刷新页面
TOAST.show('已通过认证申请', 'success');
PAGE.reload();
```

### 5.5 管理员「拒绝」按钮点击事件

```javascript
// ========== 管理员拒绝认证 ==========

const authId = EVENT.target.dataset.id;
const studentId = EVENT.target.dataset.studentid;

// 1. 更新待审核列表状态
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const pendingIndex = pendingList.findIndex(a => a.id === authId);
if (pendingIndex !== -1) {
  pendingList[pendingIndex].status = 'rejected';
  pendingList[pendingIndex].updateTime = new Date().toISOString();
  STORAGE.set('hnau_pending_auths', pendingList);
}

// 2. 【关键】更新用户认证状态
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.studentId === studentId && u.authStatus === 'pending');
if (userIndex !== -1) {
  users[userIndex].authStatus = 'rejected';
  STORAGE.set('hnau_users', users);
}

// 3. 重置全局状态
STORAGE.set('hnau_verify_state', 'unsubmitted');
STORAGE.remove('hnau_verify_info');

TOAST.show('已拒绝认证申请', 'success');
PAGE.reload();
```

## 六、个人中心显示逻辑

```javascript
// ========== 个人中心 - 获取认证状态 ==========

// 只从用户数据读取认证状态
const loginState = STORAGE.get('hnau_login_state');
const users = STORAGE.get('hnau_users') || [];
const user = users.find(u => u.username === loginState.curUser);
const verifyState = user?.authStatus || 'unsubmitted';

// 渲染状态文案
const statusMap = {
  'unsubmitted': '未提交',
  'pending': '待审核',
  'approved': '已认证',
  'rejected': '已拒绝'
};

TEXT.verifyStatusText = statusMap[verifyState] || '未提交';
```

## 七、常见错误修复

### 错误1：注册后自动显示已认证
**原因**：注册时把 `authStatus` 设为 `'approved'`
**修复**：注册时必须设为 `'unsubmitted'`

```javascript
// ❌ 错误
authStatus: verifyInfo ? 'approved' : 'unsubmitted'

// ✅ 正确
authStatus: 'unsubmitted'
```

### 错误2：校验时用全局状态覆盖用户状态
**原因**：代码中用 `globalVerifyState` 覆盖了用户的 `authStatus`
**修复**：严格只读取用户数据中的 `authStatus`

```javascript
// ❌ 错误
if (!verifyState || verifyState === 'unsubmitted') {
  const globalVerifyState = this.getVerifyState();
  if (globalVerifyState !== 'unsubmitted') {
    verifyState = globalVerifyState;  // 覆盖了用户状态！
  }
}

// ✅ 正确
const verifyState = this.getUserAuthStatus(username);  // 只读用户状态
```

## 八、测试用例

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 注册新账号 | authStatus='unsubmitted' |
| 2 | 登录后查看个人中心 | 显示"未提交" |
| 3 | 点击发布 | 跳转认证页 |
| 4 | 提交认证 | authStatus='pending' |
| 5 | 查看个人中心 | 显示"待审核" |
| 6 | 点击发布 | 提示等待审核 |
| 7 | 管理员审核通过 | authStatus='approved' |
| 8 | 查看个人中心 | 显示"已认证" |
| 9 | 点击发布 | 进入发布页 ✅ |
