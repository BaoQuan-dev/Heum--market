/**
 * ============================================
 * 河南农业大学·农大闲置 - 管理员后台逻辑
 * 功能：审核/列表/状态同步/数据管理
 * ============================================
 */

// 管理员账号
const ADMIN_ACCOUNT = {
    username: 'admin',
    password: '123456'
};

const AdminModule = {
    // 状态
    state: {
        isLoggedIn: false,
        activeTab: 'verify',
        pendingVerifies: [],
        users: [],
        goods: []
    },

    /**
     * 初始化
     */
    init() {
        this.render();
        this.bindEvents();
    },

    /**
     * 渲染页面
     */
    render() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        if (!this.state.isLoggedIn) {
            this.renderLogin(container);
        } else {
            this.renderDashboard(container);
        }
    },

    /**
     * 渲染登录页
     */
    renderLogin(container) {
        container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 100px auto;">
                <div class="card-header">
                    <h2 class="card-title">🔐 管理员登录</h2>
                </div>
                <form id="adminLoginForm">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" id="adminUsername" class="form-input" 
                               placeholder="请输入管理员用户名" autocomplete="off">
                        <p class="form-error" id="adminUsernameError"></p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" id="adminPassword" class="form-input" 
                               placeholder="请输入管理员密码">
                        <p class="form-error" id="adminPasswordError"></p>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg btn-block" id="adminLoginBtn">
                        登录
                    </button>
                </form>
            </div>
        `;

        // 绑定登录表单事件
        const form = document.getElementById('adminLoginForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    },

    /**
     * 渲染仪表盘
     */
    renderDashboard(container) {
        this.loadData();

        container.innerHTML = `
            <!-- 统计卡片 -->
            <div class="d-flex gap-md flex-wrap" style="margin-bottom: 20px;">
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">${this.state.pendingVerifies.length}</div>
                    <div style="color: var(--text-secondary);">待审核认证</div>
                </div>
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">${this.state.users.length}</div>
                    <div style="color: var(--text-secondary);">注册用户</div>
                </div>
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">${this.state.goods.length}</div>
                    <div style="color: var(--text-secondary);">发布商品</div>
                </div>
            </div>

            <!-- 选项卡 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📊 管理面板</h2>
                    <button class="btn btn-outline btn-sm" id="adminLogoutBtn">退出登录</button>
                </div>

                <div class="tabs-nav" style="margin-bottom: 20px;">
                    <div class="tabs-nav-item ${this.state.activeTab === 'verify' ? 'active' : ''}" data-tab="verify">认证审核</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'users' ? 'active' : ''}" data-tab="users">用户管理</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'goods' ? 'active' : ''}" data-tab="goods">商品管理</div>
                </div>

                <!-- 认证审核 -->
                <div class="tabs-panel ${this.state.activeTab === 'verify' ? 'active' : ''}" id="verifyPanel">
                    ${this.renderVerifyList()}
                </div>

                <!-- 用户管理 -->
                <div class="tabs-panel ${this.state.activeTab === 'users' ? 'active' : ''}" id="usersPanel">
                    ${this.renderUsersList()}
                </div>

                <!-- 商品管理 -->
                <div class="tabs-panel ${this.state.activeTab === 'goods' ? 'active' : ''}" id="goodsPanel">
                    ${this.renderGoodsList()}
                </div>
            </div>
        `;
    },

    /**
     * 渲染认证审核列表
     */
    renderVerifyList() {
        if (this.state.pendingVerifies.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p class="empty-state-text">暂无待审核认证</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>学号</th>
                            <th>校区</th>
                            <th>子校区</th>
                            <th>学院</th>
                            <th>学生证</th>
                            <th>提交时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.pendingVerifies.map(verify => `
                            <tr>
                                <td>${Utils.escapeHtml(verify.studentId)}</td>
                                <td>${Utils.escapeHtml(verify.campus)}</td>
                                <td>${verify.subCampus ? Utils.escapeHtml(verify.subCampus) : '-'}</td>
                                <td>${Utils.escapeHtml(verify.college)}</td>
                                <td>
                                    ${verify.studentCardImage ? `
                                        <img src="${verify.studentCardImage}" alt="学生证" 
                                             class="list-table-image verify-image" 
                                             data-src="${verify.studentCardImage}">
                                    ` : '-'}
                                </td>
                                <td>${Utils.formatDate(verify.submitTime)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-success approve-verify-btn" data-id="${verify.studentId}">通过</button>
                                        <button class="btn btn-sm btn-danger reject-verify-btn" data-id="${verify.studentId}">拒绝</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * 渲染用户列表
     */
    renderUsersList() {
        if (this.state.users.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p class="empty-state-text">暂无注册用户</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>用户名</th>
                            <th>学号</th>
                            <th>校区</th>
                            <th>学院</th>
                            <th>注册时间</th>
                            <th>认证状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.users.map(user => {
                            const verifyInfo = Auth.getVerifyInfo();
                            const verifyState = Auth.getVerifyState();
                            const stateMap = {
                                'unsubmitted': { text: '未认证', class: 'pending' },
                                'pending': { text: '审核中', class: 'pending' },
                                'approved': { text: '已认证', class: 'approved' }
                            };
                            const state = stateMap[verifyState] || stateMap['unsubmitted'];

                            return `
                                <tr>
                                    <td>${Utils.escapeHtml(user.username)}</td>
                                    <td>${verifyInfo ? Utils.escapeHtml(verifyInfo.studentId) : '-'}</td>
                                    <td>${verifyInfo ? Utils.escapeHtml(verifyInfo.campus) : '-'}</td>
                                    <td>${verifyInfo ? Utils.escapeHtml(verifyInfo.college) : '-'}</td>
                                    <td>${Utils.formatDate(user.regTime)}</td>
                                    <td><span class="status-badge ${state.class}">${state.text}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * 渲染商品列表
     */
    renderGoodsList() {
        if (this.state.goods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p class="empty-state-text">暂无发布商品</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>商品名称</th>
                            <th>价格</th>
                            <th>分类</th>
                            <th>校区</th>
                            <th>发布者</th>
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.goods.map(goods => `
                            <tr>
                                <td>${Utils.escapeHtml(goods.name)}</td>
                                <td style="color: var(--error-color); font-weight: 600;">¥${goods.price.toFixed(2)}</td>
                                <td>${goods.category}</td>
                                <td>${goods.campus}</td>
                                <td>${Utils.escapeHtml(goods.publisher)}</td>
                                <td>${Utils.formatDate(goods.publishTime)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-danger delete-goods-btn" data-id="${goods.id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * 加载数据
     */
    loadData() {
        // 待审核认证
        const verifyInfo = Auth.getVerifyInfo();
        const verifyState = Auth.getVerifyState();

        this.state.pendingVerifies = [];
        if (verifyState === Auth.VERIFY_STATE.PENDING && verifyInfo) {
            this.state.pendingVerifies.push(verifyInfo);
        }

        // 用户列表
        this.state.users = Auth.getUsers();

        // 商品列表
        this.state.goods = Auth.getGoods();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 退出登录
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Modal.confirm('退出登录', '确定要退出管理员登录吗？', () => {
                    this.state.isLoggedIn = false;
                    this.render();
                });
            });
        }

        // 选项卡切换
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 认证审核按钮
        this.bindVerifyEvents();

        // 商品管理按钮
        this.bindGoodsEvents();
    },

    /**
     * 切换选项卡
     */
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // 更新选项卡状态
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新面板状态
        const panels = document.querySelectorAll('.tabs-panel');
        panels.forEach(panel => {
            if (panel.id === `${tabName}Panel`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // 重新绑定事件
        this.bindVerifyEvents();
        this.bindGoodsEvents();
    },

    /**
     * 绑定认证审核事件
     */
    bindVerifyEvents() {
        // 图片预览
        const imageBtns = document.querySelectorAll('.verify-image');
        imageBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const src = btn.dataset.src;
                ImagePreview.show(src);
            });
        });

        // 通过按钮
        const approveBtns = document.querySelectorAll('.approve-verify-btn');
        approveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const studentId = btn.dataset.id;
                Modal.confirm('通过认证', `确定要通过学号 ${studentId} 的认证申请吗？`, () => {
                    Auth.updateVerifyState(Auth.VERIFY_STATE.APPROVED, studentId);
                    Toast.show('认证已通过', 'success');
                    this.loadData();
                    this.render();
                });
            });
        });

        // 拒绝按钮
        const rejectBtns = document.querySelectorAll('.reject-verify-btn');
        rejectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const studentId = btn.dataset.id;
                Modal.confirm('拒绝认证', `确定要拒绝学号 ${studentId} 的认证申请吗？`, () => {
                    Auth.resetVerify();
                    Toast.show('认证申请已拒绝', 'success');
                    this.loadData();
                    this.render();
                });
            });
        });
    },

    /**
     * 绑定商品管理事件
     */
    bindGoodsEvents() {
        const deleteBtns = document.querySelectorAll('.delete-goods-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const goodsId = btn.dataset.id;
                Modal.confirm('删除商品', '确定要删除该商品吗？', () => {
                    const goods = Auth.getGoods();
                    const index = goods.findIndex(g => g.id === goodsId);
                    if (index !== -1) {
                        goods.splice(index, 1);
                        Storage.set(Auth.KEYS.GOODS, goods);

                        // 同步删除收藏
                        const collects = Auth.getCollects();
                        const filteredCollects = collects.filter(c => c.goodsId !== goodsId);
                        Storage.set(Auth.KEYS.COLLECTS, filteredCollects);

                        Toast.show('商品已删除', 'success');
                        this.loadData();
                        this.render();
                    }
                });
            });
        });
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const username = document.getElementById('adminUsername')?.value || '';
        const password = document.getElementById('adminPassword')?.value || '';

        // 校验
        if (!username) {
            document.getElementById('adminUsernameError').textContent = '请输入用户名';
            document.getElementById('adminUsernameError').classList.add('show');
            return;
        }

        if (!password) {
            document.getElementById('adminPasswordError').textContent = '请输入密码';
            document.getElementById('adminPasswordError').classList.add('show');
            return;
        }

        // 清除错误
        document.getElementById('adminUsernameError').classList.remove('show');
        document.getElementById('adminPasswordError').classList.remove('show');

        // 验证账号密码
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            this.state.isLoggedIn = true;
            Toast.show('登录成功', 'success');
            this.render();
        } else {
            document.getElementById('adminPasswordError').textContent = '用户名或密码错误';
            document.getElementById('adminPasswordError').classList.add('show');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminContent')) {
        AdminModule.init();
    }
});

// 定时刷新数据
setInterval(() => {
    if (document.getElementById('adminContent') && AdminModule.state.isLoggedIn) {
        AdminModule.loadData();
    }
}, 5000);
