/**
 * ============================================
 * 河南农业大学·农大闲置 - 管理员后台逻辑
 * 功能：认证审核/用户管理/商品管理
 * 【已修复】标签页切换和按钮交互问题
 * ============================================
 */

// 管理员账号配置
const ADMIN_ACCOUNT = {
    username: 'admin',
    password: '123456'
};

// 存储键名（管理员专用）
const ADMIN_KEYS = {
    PROCESSED_VERIFIES: 'hnau_admin_processed_verifies',  // 已处理的认证记录
    ADMIN_LOGGED_IN: 'hnau_admin_logged_in'              // 管理员登录状态
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

    // ==========================================
    // 【核心修复】使用事件委托，避免重复绑定
    // ==========================================
    init() {
        // 检查管理员登录状态
        this.state.isLoggedIn = localStorage.getItem(ADMIN_KEYS.ADMIN_LOGGED_IN) === 'true';
        
        this.render();
        
        // 【关键修复】使用事件委托，统一处理所有点击事件
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
    },

    /**
     * 【核心修复】统一事件处理器
     */
    handleGlobalClick(e) {
        // 退出登录按钮
        if (e.target.id === 'adminLogoutBtn') {
            this.handleLogout();
            return;
        }

        // 登录表单提交
        if (e.target.id === 'adminLoginBtn' || e.target.closest('#adminLoginForm')) {
            if (e.target.type === 'submit' || e.target.closest('form')) {
                e.preventDefault();
                this.handleLogin();
            }
            return;
        }

        // 选项卡切换
        const tabItem = e.target.closest('.tabs-nav-item');
        if (tabItem) {
            const tabName = tabItem.dataset.tab;
            if (tabName) {
                this.switchTab(tabName);
            }
            return;
        }

        // 【关键】认证审核 - 通过按钮
        if (e.target.classList.contains('approve-verify-btn')) {
            const studentId = e.target.dataset.id;
            if (studentId) {
                this.handleApprove(studentId);
            }
            return;
        }

        // 【关键】认证审核 - 拒绝按钮
        if (e.target.classList.contains('reject-verify-btn')) {
            const studentId = e.target.dataset.id;
            if (studentId) {
                this.handleReject(studentId);
            }
            return;
        }

        // 商品管理 - 删除按钮
        if (e.target.classList.contains('delete-goods-btn')) {
            const goodsId = e.target.dataset.id;
            if (goodsId) {
                this.handleDeleteGoods(goodsId);
            }
            return;
        }

        // 图片预览
        if (e.target.classList.contains('verify-image')) {
            const src = e.target.dataset.src;
            if (src) {
                this.showImagePreview(src);
            }
            return;
        }
    },

    // ==========================================
    // 渲染方法
    // ==========================================
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

            <!-- 管理面板 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📊 管理面板</h2>
                    <button class="btn btn-outline btn-sm" id="adminLogoutBtn">退出登录</button>
                </div>

                <!-- 选项卡 -->
                <div class="tabs-nav" style="margin-bottom: 20px;">
                    <div class="tabs-nav-item ${this.state.activeTab === 'verify' ? 'active' : ''}" data-tab="verify">认证审核</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'users' ? 'active' : ''}" data-tab="users">用户管理</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'goods' ? 'active' : ''}" data-tab="goods">商品管理</div>
                </div>

                <!-- 认证审核面板 -->
                <div class="tabs-panel ${this.state.activeTab === 'verify' ? 'active' : ''}" id="verifyPanel">
                    ${this.renderVerifyList()}
                </div>

                <!-- 用户管理面板 -->
                <div class="tabs-panel ${this.state.activeTab === 'users' ? 'active' : ''}" id="usersPanel">
                    ${this.renderUsersList()}
                </div>

                <!-- 商品管理面板 -->
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
                                <td>${this.escapeHtml(verify.studentId)}</td>
                                <td>${this.escapeHtml(verify.campus)}</td>
                                <td>${verify.subCampus ? this.escapeHtml(verify.subCampus) : '-'}</td>
                                <td>${this.escapeHtml(verify.college)}</td>
                                <td>
                                    ${verify.studentCardImage ? `
                                        <img src="${verify.studentCardImage}" alt="学生证" 
                                             class="list-table-image verify-image" 
                                             data-src="${verify.studentCardImage}">
                                    ` : '-'}
                                </td>
                                <td>${this.formatDate(verify.submitTime)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-success approve-verify-btn" data-id="${this.escapeHtml(verify.studentId)}">通过</button>
                                        <button class="btn btn-sm btn-danger reject-verify-btn" data-id="${this.escapeHtml(verify.studentId)}">拒绝</button>
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

        // 获取所有认证信息
        const verifyInfo = this.getVerifyInfo();
        const verifyState = this.getVerifyState();

        const stateMap = {
            'unsubmitted': { text: '未认证', class: 'pending' },
            'pending': { text: '审核中', class: 'pending' },
            'approved': { text: '已认证', class: 'approved' }
        };
        const state = stateMap[verifyState] || stateMap['unsubmitted'];

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
                        ${this.state.users.map(user => `
                            <tr>
                                <td>${this.escapeHtml(user.username)}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.studentId) : '-'}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.campus) : '-'}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.college) : '-'}</td>
                                <td>${this.formatDate(user.regTime)}</td>
                                <td><span class="status-badge ${state.class}">${state.text}</span></td>
                            </tr>
                        `).join('')}
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
                                <td>${this.escapeHtml(goods.name)}</td>
                                <td style="color: var(--error-color); font-weight: 600;">¥${typeof goods.price === 'number' ? goods.price.toFixed(2) : goods.price}</td>
                                <td>${goods.category || '-'}</td>
                                <td>${goods.campus || '-'}</td>
                                <td>${this.escapeHtml(goods.publisher || '-')}</td>
                                <td>${this.formatDate(goods.publishTime)}</td>
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

    // ==========================================
    // 【关键修复】事件处理方法
    // ==========================================

    /**
     * 切换选项卡
     */
    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.render();
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const username = document.getElementById('adminUsername')?.value?.trim() || '';
        const password = document.getElementById('adminPassword')?.value || '';
        const usernameError = document.getElementById('adminUsernameError');
        const passwordError = document.getElementById('adminPasswordError');

        // 清除错误
        if (usernameError) {
            usernameError.textContent = '';
            usernameError.classList.remove('show');
        }
        if (passwordError) {
            passwordError.textContent = '';
            passwordError.classList.remove('show');
        }

        // 校验
        if (!username) {
            if (usernameError) {
                usernameError.textContent = '请输入用户名';
                usernameError.classList.add('show');
            }
            return;
        }

        if (!password) {
            if (passwordError) {
                passwordError.textContent = '请输入密码';
                passwordError.classList.add('show');
            }
            return;
        }

        // 验证账号密码
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            localStorage.setItem(ADMIN_KEYS.ADMIN_LOGGED_IN, 'true');
            this.state.isLoggedIn = true;
            this.showToast('登录成功', 'success');
            this.render();
        } else {
            if (passwordError) {
                passwordError.textContent = '用户名或密码错误';
                passwordError.classList.add('show');
            }
        }
    },

    /**
     * 处理退出登录
     */
    handleLogout() {
        if (confirm('确定要退出管理员登录吗？')) {
            localStorage.removeItem(ADMIN_KEYS.ADMIN_LOGGED_IN);
            this.state.isLoggedIn = false;
            this.state.activeTab = 'verify';
            this.render();
        }
    },

    /**
     * 【关键】处理认证通过
     */
    handleApprove(studentId) {
        if (confirm(`确定要通过学号 ${studentId} 的认证申请吗？`)) {
            // 保存处理记录
            this.saveProcessedVerify(studentId, 'approved');
            
            // 更新认证状态为通过
            localStorage.setItem('hnau_verify_state', 'approved');
            
            // 显示提示
            this.showToast('认证已通过', 'success');
            
            // 重新加载并渲染
            this.loadData();
            this.render();
        }
    },

    /**
     * 【关键】处理认证拒绝
     */
    handleReject(studentId) {
        if (confirm(`确定要拒绝学号 ${studentId} 的认证申请吗？`)) {
            // 保存处理记录
            this.saveProcessedVerify(studentId, 'rejected');
            
            // 清除认证信息和状态
            localStorage.removeItem('hnau_verify_info');
            localStorage.removeItem('hnau_verify_state');
            
            // 显示提示
            this.showToast('认证申请已拒绝', 'success');
            
            // 重新加载并渲染
            this.loadData();
            this.render();
        }
    },

    /**
     * 【关键】处理删除商品
     */
    handleDeleteGoods(goodsId) {
        if (confirm('确定要删除该商品吗？')) {
            // 获取商品列表
            const goodsStr = localStorage.getItem('hnau_goods');
            const goods = goodsStr ? JSON.parse(goodsStr) : [];
            
            // 找到并删除商品
            const index = goods.findIndex(g => g.id === goodsId);
            if (index !== -1) {
                goods.splice(index, 1);
                localStorage.setItem('hnau_goods', JSON.stringify(goods));
                
                // 同步删除相关收藏
                const collectsStr = localStorage.getItem('hnau_collects');
                const collects = collectsStr ? JSON.parse(collectsStr) : [];
                const filteredCollects = collects.filter(c => c.goodsId !== goodsId);
                localStorage.setItem('hnau_collects', JSON.stringify(filteredCollects));
                
                this.showToast('商品已删除', 'success');
                this.loadData();
                this.render();
            }
        }
    },

    /**
     * 显示图片预览
     */
    showImagePreview(src) {
        // 创建预览模态框
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <img src="${src}" style="max-width:90%;max-height:90%;object-fit:contain;" />
            <button style="position:absolute;top:20px;right:20px;width:40px;height:40px;background:rgba(255,255,255,0.2);border:none;border-radius:50%;color:white;font-size:24px;cursor:pointer;">×</button>
        `;
        
        document.body.appendChild(modal);
        
        // 点击关闭
        modal.querySelector('button').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    },

    // ==========================================
    // 数据加载和存储方法
    // ==========================================

    /**
     * 加载数据
     */
    loadData() {
        // 待审核认证（排除已处理的）
        const processedIds = this.getProcessedVerifyIds();
        const verifyInfo = this.getVerifyInfo();
        const verifyState = this.getVerifyState();

        this.state.pendingVerifies = [];
        if (verifyState === 'pending' && verifyInfo && !processedIds.includes(verifyInfo.studentId)) {
            this.state.pendingVerifies.push(verifyInfo);
        }

        // 用户列表
        const usersStr = localStorage.getItem('hnau_users');
        this.state.users = usersStr ? JSON.parse(usersStr) : [];

        // 商品列表
        const goodsStr = localStorage.getItem('hnau_goods');
        this.state.goods = goodsStr ? JSON.parse(goodsStr) : [];
    },

    /**
     * 获取认证信息
     */
    getVerifyInfo() {
        const str = localStorage.getItem('hnau_verify_info');
        return str ? JSON.parse(str) : null;
    },

    /**
     * 获取认证状态
     */
    getVerifyState() {
        return localStorage.getItem('hnau_verify_state') || 'unsubmitted';
    },

    /**
     * 获取已处理的认证ID列表
     */
    getProcessedVerifyIds() {
        const str = localStorage.getItem(ADMIN_KEYS.PROCESSED_VERIFIES);
        const processed = str ? JSON.parse(str) : [];
        return processed.map(p => p.studentId);
    },

    /**
     * 保存已处理的认证记录
     */
    saveProcessedVerify(studentId, action) {
        const str = localStorage.getItem(ADMIN_KEYS.PROCESSED_VERIFIES);
        const processed = str ? JSON.parse(str) : [];
        
        processed.push({
            studentId: studentId,
            action: action,
            time: new Date().toISOString()
        });
        
        localStorage.setItem(ADMIN_KEYS.PROCESSED_VERIFIES, JSON.stringify(processed));
    },

    // ==========================================
    // 工具方法
    // ==========================================

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 显示提示
     */
    showToast(message, type) {
        // 简单提示实现
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = 'position:fixed;top:100px;right:20px;padding:15px 20px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;';
        toast.innerHTML = `
            <span style="color: ${type === 'success' ? '#198754' : type === 'error' ? '#DC3545' : '#0D6EFD'};">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span style="margin-left:10px;">${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

// ==========================================
// 页面加载完成后初始化
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保DOM完全加载
    setTimeout(() => {
        AdminModule.init();
    }, 100);
});
