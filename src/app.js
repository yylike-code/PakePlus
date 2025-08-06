// 应用状态管理
let appState = {
    items: [],
    formula: 'SUM(项目1, 项目2, 项目3, 项目4, 项目5, 项目6, 项目7, 项目8)',
    coefficients: {},
    password: '000000'
};

// DOM元素引用
const elements = {
    itemList: document.getElementById('itemList'),
    totalValue: document.getElementById('totalValue'),
    addItemBtn: document.getElementById('addItemBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    importExportBtn: document.getElementById('importExportBtn'),
    
    // 模态框
    settingsModal: document.getElementById('settingsModal'),
    importExportModal: document.getElementById('importExportModal'),
    passwordModal: document.getElementById('passwordModal'),
    itemModal: document.getElementById('itemModal'),
    
    // 设置模态框
    formulaInput: document.getElementById('formulaInput'),
    coefficientsList: document.getElementById('coefficientsList'),
    formulaTabBtn: document.getElementById('formulaTabBtn'),
    coefficientTabBtn: document.getElementById('coefficientTabBtn'),
    passwordTabBtn: document.getElementById('passwordTabBtn'),
    formulaTab: document.getElementById('formulaTab'),
    coefficientTab: document.getElementById('coefficientTab'),
    passwordTab: document.getElementById('passwordTab'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    
    // 导入导出
    importData: document.getElementById('importData'),
    exportData: document.getElementById('exportData'),
    
    // 密码模态框
    passwordInput: document.getElementById('passwordInput'),
    passwordPrompt: document.getElementById('passwordPrompt'),
    
    // 项目模态框
    itemModalTitle: document.getElementById('itemModalTitle'),
    itemName: document.getElementById('itemName'),
    itemValue: document.getElementById('itemValue')
};

// 全局变量
let editingItemIndex = -1;
let passwordCallback = null;

// 事件监听器
document.addEventListener('DOMContentLoaded', initApp);

// 初始化应用
function initApp() {
    loadFromLocalStorage();
    renderItemList();
    calculateTotal();
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 按钮事件
    elements.addItemBtn.addEventListener('click', () => requestPassword(() => openItemModal()));
    elements.settingsBtn.addEventListener('click', () => requestPassword(() => openSettingsModal()));
    elements.importExportBtn.addEventListener('click', () => requestPassword(() => openImportExportModal()));
    
    // 设置模态框事件
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
    document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // 导入导出事件
    document.getElementById('closeImportExportBtn').addEventListener('click', closeImportExportModal);
    document.getElementById('closeImportExportModalBtn').addEventListener('click', closeImportExportModal);
    document.getElementById('importBtn').addEventListener('click', importData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // 密码模态框事件
    document.getElementById('closePasswordBtn').addEventListener('click', closePasswordModal);
    document.getElementById('cancelPasswordBtn').addEventListener('click', closePasswordModal);
    document.getElementById('confirmPasswordBtn').addEventListener('click', confirmPassword);
    
    // 项目模态框事件
    document.getElementById('closeItemBtn').addEventListener('click', closeItemModal);
    document.getElementById('cancelItemBtn').addEventListener('click', closeItemModal);
    document.getElementById('saveItemBtn').addEventListener('click', saveItem);
    
    // 设置选项卡事件
    elements.formulaTabBtn.addEventListener('click', () => switchSettingsTab('formula'));
    elements.coefficientTabBtn.addEventListener('click', () => switchSettingsTab('coefficient'));
    elements.passwordTabBtn.addEventListener('click', () => switchSettingsTab('password'));
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// 数据管理
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('calculatorAppState');
        if (saved) {
            appState = { ...appState, ...JSON.parse(saved) };
        } else {
            loadSampleData();
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        loadSampleData();
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('calculatorAppState', JSON.stringify(appState));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadSampleData() {
    appState.items = [
        { name: '项目1', value: 100, selected: true },
        { name: '项目2', value: 50, selected: true },
        { name: '项目3', value: -30, selected: true },
        { name: '项目4', value: 75, selected: false },
        { name: '项目5', value: 200, selected: true },
        { name: '项目6', value: -25, selected: false },
        { name: '项目7', value: 150, selected: true },
        { name: '项目8', value: 80, selected: false }
    ];
    
    appState.coefficients = {};
    appState.items.forEach(item => {
        appState.coefficients[item.name] = 1;
    });
}

// 渲染功能
function renderItemList() {
    const container = elements.itemList;
    
    if (appState.items.length === 0) {
        container.innerHTML = '<div class="empty-message">暂无项目，点击"添加项目"开始</div>';
        return;
    }
    
    container.innerHTML = '';
    appState.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        
        row.innerHTML = `
            <input type="checkbox" class="item-checkbox" ${item.selected ? 'checked' : ''} data-index="${index}">
            <span class="item-name">${item.name}</span>
            <span class="item-value">${item.value.toFixed(2)}</span>
            <div class="item-actions">
                <button class="action-btn edit-btn" data-index="${index}">编辑</button>
                <button class="action-btn delete-btn" data-index="${index}">删除</button>
            </div>
        `;
        
        container.appendChild(row);
    });
    
    // 添加事件监听器
    container.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            appState.items[index].selected = e.target.checked;
            saveToLocalStorage();
            calculateTotal();
        });
    });
    
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            requestPassword(() => openItemModal(index));
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            requestPassword(() => deleteItem(index));
        });
    });
}

// 计算功能
function calculateTotal() {
    try {
        const result = evaluateFormula();
        elements.totalValue.textContent = result.toFixed(2);
    } catch (error) {
        console.error('计算错误:', error);
        elements.totalValue.textContent = '错误';
    }
}

function evaluateFormula() {
    let formula = appState.formula;
    
    // 替换项目名称
    appState.items.forEach(item => {
        const regex = new RegExp(item.name, 'g');
        let value = item.selected ? item.value * (appState.coefficients[item.name] || 1) : 0;
        formula = formula.replace(regex, value.toString());
    });
    
    // 处理条件表达式
    formula = formula.replace(/(\w+)被勾选/g, (match, name) => {
        const item = appState.items.find(item => item.name === name);
        return item && item.selected ? 'true' : 'false';
    });
    
    // 处理函数
    formula = formula.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/g, (match, condition, trueVal, falseVal) => {
        return eval(condition) ? trueVal : falseVal;
    });
    
    formula = formula.replace(/SUM\(([^)]+)\)/g, (match, args) => {
        return args.split(',').reduce((sum, val) => sum + parseFloat(val.trim()), 0);
    });
    
    formula = formula.replace(/AVG\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(val => parseFloat(val.trim()));
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    formula = formula.replace(/MIN\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(val => parseFloat(val.trim()));
        return Math.min(...values);
    });
    
    formula = formula.replace(/MAX\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(val => parseFloat(val.trim()));
        return Math.max(...values);
    });
    
    // 安全地计算结果
    return Function('"use strict"; return (' + formula + ')')();
}

// 模态框功能
function openSettingsModal() {
    elements.formulaInput.value = appState.formula;
    renderCoefficientsList();
    switchSettingsTab('formula');
    elements.settingsModal.style.display = 'block';
}

function closeSettingsModal() {
    elements.settingsModal.style.display = 'none';
    elements.currentPassword.value = '';
    elements.newPassword.value = '';
    elements.confirmPassword.value = '';
}

function openImportExportModal() {
    elements.exportData.value = JSON.stringify(appState.items, null, 2);
    elements.importData.value = '';
    elements.importExportModal.style.display = 'block';
}

function closeImportExportModal() {
    elements.importExportModal.style.display = 'none';
}

function openItemModal(index = -1) {
    editingItemIndex = index;
    
    if (index >= 0) {
        elements.itemModalTitle.textContent = '编辑项目';
        const item = appState.items[index];
        elements.itemName.value = item.name;
        elements.itemValue.value = item.value;
    } else {
        elements.itemModalTitle.textContent = '添加项目';
        elements.itemName.value = '';
        elements.itemValue.value = '';
    }
    
    elements.itemModal.style.display = 'block';
}

function closeItemModal() {
    elements.itemModal.style.display = 'none';
    editingItemIndex = -1;
}

function closeAllModals() {
    closeSettingsModal();
    closeImportExportModal();
    closePasswordModal();
    closeItemModal();
}

// 设置选项卡切换
function switchSettingsTab(tab) {
    // 隐藏所有选项卡内容
    elements.formulaTab.style.display = 'none';
    elements.coefficientTab.style.display = 'none';
    elements.passwordTab.style.display = 'none';
    
    // 移除所有按钮的活动状态
    elements.formulaTabBtn.classList.remove('active');
    elements.coefficientTabBtn.classList.remove('active');
    elements.passwordTabBtn.classList.remove('active');
    
    // 显示选中的选项卡
    switch(tab) {
        case 'formula':
            elements.formulaTab.style.display = 'block';
            elements.formulaTabBtn.classList.add('active');
            break;
        case 'coefficient':
            elements.coefficientTab.style.display = 'block';
            elements.coefficientTabBtn.classList.add('active');
            break;
        case 'password':
            elements.passwordTab.style.display = 'block';
            elements.passwordTabBtn.classList.add('active');
            break;
    }
}

function renderCoefficientsList() {
    const container = elements.coefficientsList;
    container.innerHTML = '';
    
    appState.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'coefficient-row';
        
        row.innerHTML = `
            <span class="coefficient-name">${item.name}</span>
            <input type="number" class="coefficient-input" 
                   value="${appState.coefficients[item.name] || 1}" 
                   data-name="${item.name}" step="0.1">
        `;
        
        container.appendChild(row);
    });
    
    // 添加事件监听器
    container.querySelectorAll('.coefficient-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const name = e.target.dataset.name;
            appState.coefficients[name] = parseFloat(e.target.value) || 1;
            saveToLocalStorage();
            calculateTotal();
        });
    });
}

// 项目操作
function saveItem() {
    const name = elements.itemName.value.trim();
    const value = parseFloat(elements.itemValue.value);
    
    if (!name) {
        alert('请输入项目名称');
        return;
    }
    
    if (isNaN(value)) {
        alert('请输入有效的数值');
        return;
    }
    
    if (editingItemIndex >= 0) {
        // 编辑现有项目
        const oldName = appState.items[editingItemIndex].name;
        appState.items[editingItemIndex] = { 
            ...appState.items[editingItemIndex], 
            name, 
            value 
        };
        
        // 更新系数映射
        if (oldName !== name) {
            appState.coefficients[name] = appState.coefficients[oldName] || 1;
            delete appState.coefficients[oldName];
        }
    } else {
        // 添加新项目
        appState.items.push({ name, value, selected: true });
        if (!appState.coefficients[name]) {
            appState.coefficients[name] = 1;
        }
    }
    
    saveToLocalStorage();
    renderItemList();
    calculateTotal();
    closeItemModal();
}

function deleteItem(index) {
    if (confirm('确定要删除这个项目吗？')) {
        const itemName = appState.items[index].name;
        appState.items.splice(index, 1);
        delete appState.coefficients[itemName];
        
        saveToLocalStorage();
        renderItemList();
        calculateTotal();
    }
}

// 设置保存
function saveSettings() {
    // 保存公式
    appState.formula = elements.formulaInput.value;
    
    // 保存密码
    const currentPwd = elements.currentPassword.value;
    const newPwd = elements.newPassword.value;
    const confirmPwd = elements.confirmPassword.value;
    
    if (newPwd || confirmPwd) {
        if (currentPwd !== appState.password) {
            alert('当前密码错误');
            return;
        }
        
        if (newPwd !== confirmPwd) {
            alert('新密码与确认密码不匹配');
            return;
        }
        
        appState.password = newPwd;
    }
    
    saveToLocalStorage();
    calculateTotal();
    closeSettingsModal();
    alert('设置已保存');
}

// 导入导出功能
function importData() {
    try {
        const data = JSON.parse(elements.importData.value);
        
        if (!Array.isArray(data)) {
            alert('数据格式错误：必须是数组');
            return;
        }
        
        const validItems = data.filter(item => 
            item.name && typeof item.value === 'number'
        );
        
        if (validItems.length === 0) {
            alert('没有有效的数据');
            return;
        }
        
        appState.items = validItems.map(item => ({
            name: item.name,
            value: item.value,
            selected: item.selected !== undefined ? item.selected : true
        }));
        
        // 更新系数映射
        appState.coefficients = {};
        appState.items.forEach(item => {
            appState.coefficients[item.name] = 1;
        });
        
        saveToLocalStorage();
        renderItemList();
        calculateTotal();
        closeImportExportModal();
        alert(`成功导入 ${validItems.length} 个项目`);
    } catch (error) {
        alert('导入失败：' + error.message);
    }
}

function exportData() {
    const data = JSON.stringify(appState.items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calculator_data.json';
    a.click();
    
    URL.revokeObjectURL(url);
}

// 密码验证
function requestPassword(callback) {
    passwordCallback = callback;
    elements.passwordInput.value = '';
    elements.passwordModal.style.display = 'block';
    elements.passwordInput.focus();
}

function closePasswordModal() {
    elements.passwordModal.style.display = 'none';
    passwordCallback = null;
}

function confirmPassword() {
    const inputPassword = elements.passwordInput.value;
    
    if (inputPassword === appState.password) {
        const callback = passwordCallback;
        closePasswordModal();
        if (callback) {
            callback();
        }
    } else {
        alert('密码错误');
    }
}

// 模态框外部点击关闭
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// 防止表单提交刷新页面
document.addEventListener('submit', (e) => {
    e.preventDefault();
});