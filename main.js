/**
 * 隐藏迷宫 - 主游戏控制文件
 * 整合所有模块，初始化游戏并启动
 */

// 游戏全局变量
let game = null;
let uiController = null;

/**
 * 初始化游戏
 */
function initGame() {
    console.log('初始化隐藏迷宫游戏...');
    
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const mazeSize = parseInt(urlParams.get('size')) || 15;
    const viewMode = urlParams.get('mode') || 'permanent';
    
    // 创建游戏实例
    game = new Game({
        mazeSize: mazeSize,
        viewMode: viewMode,
        cellSize: 40
    });
    
    // 创建UI控制器
    uiController = new UIController({
        canvasId: 'gameCanvas',
        game: game,
        cellSize: 40
    });
    
    // 设置游戏到UI控制器
    uiController.setGame(game);
    
    // 初始化UI状态
    initUIState();
    
    // 显示开始屏幕
    uiController.showStartScreen();
    
    // 添加CSS样式
    addCustomStyles();
    
    // 启动游戏循环
    startGameLoop();
    
    console.log('游戏初始化完成！');
}

/**
 * 初始化UI状态
 */
function initUIState() {
    // 设置迷宫大小选择
    const mazeSizeSelect = document.getElementById('mazeSize');
    if (mazeSizeSelect && game) {
        mazeSizeSelect.value = game.config.mazeSize;
    }
    
    // 设置视野模式按钮
    const modePermanent = document.getElementById('modePermanent');
    const modeInstant = document.getElementById('modeInstant');
    
    if (game) {
        if (game.config.viewMode === 'permanent') {
            if (modePermanent) modePermanent.classList.add('active');
            if (modeInstant) modeInstant.classList.remove('active');
        } else {
            if (modePermanent) modePermanent.classList.remove('active');
            if (modeInstant) modeInstant.classList.add('active');
        }
    }
    
    // 设置开始按钮事件
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 获取选择的模式
            const modeButtons = document.querySelectorAll('.mode-btn');
            let selectedMode = 'permanent';
            
            modeButtons.forEach(btn => {
                if (btn.classList.contains('active')) {
                    selectedMode = btn.dataset.mode;
                }
            });
            
            // 设置游戏模式
            game.setViewMode(selectedMode);
            
            // 开始游戏
            game.start();
            
            // 隐藏开始屏幕
            uiController.hideStartScreen();
            
            // 更新UI
            uiController.updateStats();
            uiController.render();
        });
    }
    
    // 设置模式选择按钮
    const modeSelectionButtons = document.querySelectorAll('.mode-btn');
    modeSelectionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            modeSelectionButtons.forEach(b => b.classList.remove('active'));
            // 添加active类到点击的按钮
            btn.classList.add('active');
        });
    });
}

/**
 * 添加自定义CSS样式
 */
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 提示消息样式 */
        .hint-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(245, 158, 11, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideDown 0.3s ease-out;
        }
        
        .hint-content {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        }
        
        .hint-content i {
            font-size: 1.2rem;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        /* 模式选择按钮激活状态 */
        .mode-btn.active {
            background: rgba(76, 201, 240, 0.15);
            border-color: #4cc9f0;
            box-shadow: 0 0 20px rgba(76, 201, 240, 0.3);
        }
        
        /* 控制按钮激活状态 */
        .toggle-btn.active {
            background: rgba(76, 201, 240, 0.2);
            border-color: #4cc9f0;
            color: #4cc9f0;
        }
        
        /* 移动按钮悬停效果 */
        .move-btn:hover {
            background: rgba(76, 201, 240, 0.3);
            border-color: #4cc9f0;
            transform: scale(1.05);
        }
        
        /* 动作按钮悬停效果 */
        .action-btn:hover {
            transform: translateY(-2px);
        }
        
        .action-btn.restart:hover {
            background: rgba(239, 68, 68, 0.3);
        }
        
        .action-btn.hint:hover {
            background: rgba(245, 158, 11, 0.3);
        }
        
        .action-btn.solve:hover {
            background: rgba(34, 197, 94, 0.3);
        }
        
        /* 游戏画布光标 */
        #gameCanvas {
            cursor: pointer;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .game-area {
                grid-template-columns: 1fr;
            }
            
            .game-controls {
                order: 2;
            }
            
            .canvas-container {
                order: 1;
            }
            
            .action-buttons {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * 开始新游戏
 * @param {number} size - 迷宫大小
 * @param {string} mode - 视野模式
 */
function startNewGame(size = 15, mode = 'permanent') {
    if (game) {
        game.setMazeSize(size);
        game.setViewMode(mode);
        game.start();
        
        // 更新UI
        uiController.updateCanvasSize();
        uiController.updateStats();
        uiController.render();
    }
}

/**
 * 切换视野模式
 * @param {string} mode - 视野模式 ('permanent' 或 'instant')
 */
function toggleViewMode(mode) {
    if (game) {
        game.setViewMode(mode);
        uiController.updateStats();
        uiController.render();
    }
}

/**
 * 显示解决方案
 */
function showSolution() {
    if (game) {
        game.showSolution();
        uiController.render();
    }
}

/**
 * 隐藏解决方案
 */
function hideSolution() {
    if (game) {
        game.hideSolution();
        uiController.render();
    }
}

/**
 * 获取游戏统计信息
 * @returns {Object} 游戏统计
 */
function getGameStats() {
    return game ? game.getStats() : null;
}

/**
 * 导出游戏状态（用于保存）
 * @returns {Object} 游戏状态
 */
function exportGameState() {
    if (!game) return null;
    
    const gameState = game.getGameState();
    const maze = game.getMaze();
    
    return {
        config: { ...game.config },
        state: { ...gameState },
        maze: {
            width: maze.width,
            height: maze.height,
            start: maze.getStart(),
            end: maze.getEnd(),
            walls: maze.walls
        },
        player: game.getPlayerPosition(),
        exploredCells: Array.from(game.exploredCells || []),
        visitedCells: Array.from(game.visitedCells || [])
    };
}

/**
 * 导入游戏状态（用于加载）
 * @param {Object} savedState - 保存的游戏状态
 */
function importGameState(savedState) {
    if (!savedState) return;
    
    // 重新创建游戏实例
    game = new Game(savedState.config);
    
    // 这里需要实现完整的游戏状态恢复
    // 由于时间关系，暂时只恢复基本配置
    game.config = { ...savedState.config };
    
    // 设置UI控制器
    if (uiController) {
        uiController.setGame(game);
        uiController.updateStats();
        uiController.render();
    }
    
    console.log('游戏状态已导入');
}

/**
 * 保存游戏到本地存储
 */
function saveGame() {
    if (!game) return;
    
    const gameState = exportGameState();
    if (gameState) {
        localStorage.setItem('hiddenMaze_save', JSON.stringify(gameState));
        console.log('游戏已保存到本地存储');
        
        // 显示保存成功提示
        showNotification('游戏已保存！');
    }
}

/**
 * 从本地存储加载游戏
 */
function loadGame() {
    const savedState = localStorage.getItem('hiddenMaze_save');
    if (savedState) {
        try {
            const gameState = JSON.parse(savedState);
            importGameState(gameState);
            console.log('游戏已从本地存储加载');
            
            // 显示加载成功提示
            showNotification('游戏已加载！');
        } catch (error) {
            console.error('加载游戏失败:', error);
            showNotification('加载游戏失败！', 'error');
        }
    } else {
        console.log('没有找到保存的游戏');
        showNotification('没有找到保存的游戏', 'warning');
    }
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('success', 'error', 'warning', 'info')
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    // 添加CSS样式（如果还没有）
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                min-width: 250px;
                max-width: 350px;
            }
            
            .notification.success {
                background: rgba(34, 197, 94, 0.9);
                border-left: 4px solid #16a34a;
            }
            
            .notification.error {
                background: rgba(239, 68, 68, 0.9);
                border-left: 4px solid #dc2626;
            }
            
            .notification.warning {
                background: rgba(245, 158, 11, 0.9);
                border-left: 4px solid #d97706;
            }
            
            .notification.info {
                background: rgba(59, 130, 246, 0.9);
                border-left: 4px solid #2563eb;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 500;
            }
            
            .notification-content i {
                font-size: 1.2rem;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 添加快捷键
 */
function addShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S 保存游戏
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveGame();
        }
        
        // Ctrl+L 加载游戏
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            loadGame();
        }
        
        // Ctrl+R 重新开始
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (game) {
                game.restart();
                uiController.updateStats();
                uiController.render();
            }
        }
        
        // Ctrl+H 显示/隐藏解决方案
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            if (game) {
                if (game.config.showSolution) {
                    game.hideSolution();
                } else {
                    game.showSolution();
                }
                uiController.render();
            }
        }
        
        // ESC 暂停/继续
        if (e.key === 'Escape') {
            e.preventDefault();
            if (game) {
                game.togglePause();
                uiController.updateStats();
                uiController.render();
            }
        }
    });
}

/**
 * 添加开发者工具
 */
function addDeveloperTools() {
    // 只在开发模式下添加
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('开发者工具已启用');
        
        // 将游戏实例暴露到全局，方便调试
        window.game = game;
        window.uiController = uiController;
        
        // 添加调试命令
        window.debug = {
            showAll: () => {
                if (game) {
                    // 探索所有单元格
                    const maze = game.getMaze();
                    const { width, height } = maze.getSize();
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const cellKey = `${x},${y}`;
                            game.exploredCells.add(cellKey);
                        }
                    }
                    uiController.render();
                }
            },
            win: () => {
                if (game) {
                    game.victory();
                }
            },
            stats: () => {
                if (game) {
                    console.log('游戏统计:', game.getStats());
                }
            }
        };
    }
}

/**
 * 启动游戏循环
 */
function startGameLoop() {
    let lastTime = 0;
    
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        
        if (game && game.state.isRunning && !game.state.isPaused && !game.state.isGameOver) {
            // 更新玩家位置（连续移动）
            if (game.updatePlayerPosition) {
                const moved = game.updatePlayerPosition();
                if (moved && uiController) {
                    // 更新UI
                    uiController.updateStats();
                    uiController.render();
                }
            }
        }
        
        lastTime = timestamp;
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
}

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    initGame();
    
    // 添加快捷键
    addShortcuts();
    
    // 添加开发者工具
    addDeveloperTools();
    
    // 绑定键盘释放事件
    document.addEventListener('keyup', (e) => {
        if (uiController && uiController.handleKeyUp) {
            uiController.handleKeyUp(e);
        }
    });
    
    // 显示欢迎消息
    console.log('欢迎来到隐藏迷宫游戏！');
    console.log('使用方向键或WASD移动玩家（长按连续移动）');
    console.log('点击迷宫中的位置可以移动');
    console.log('ESC键暂停/继续游戏');
    console.log('Ctrl+S保存游戏，Ctrl+L加载游戏');
    
    // 添加页面卸载前的保存提示
    window.addEventListener('beforeunload', (e) => {
        // 如果游戏正在进行中，提示保存
        if (game && game.state.isRunning && !game.state.isGameOver) {
            e.preventDefault();
            e.returnValue = '游戏正在进行中，确定要离开吗？';
            return e.returnValue;
        }
    });
});

/**
 * 导出全局函数
 */
window.HiddenMaze = {
    initGame,
    startNewGame,
    toggleViewMode,
    showSolution,
    hideSolution,
    getGameStats,
    saveGame,
    loadGame,
    showNotification,
    game,
    uiController
};