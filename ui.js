/**
 * 隐藏迷宫 - 用户界面控制模块
 * 处理Canvas渲染、UI更新、用户交互等
 */

class UIController {
    /**
     * 创建UI控制器实例
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        // Canvas元素和上下文
        this.canvas = document.getElementById(options.canvasId || 'gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏实例
        this.game = options.game || null;
        
        // 渲染配置
        this.config = {
            cellSize: options.cellSize || 40,
            wallWidth: options.wallWidth || 4,
            colors: {
                background: 'rgba(0, 0, 0, 0.5)',
                wallExplored: 'rgba(0, 0, 0, 0.5)',      // 已探索墙壁颜色
                wallUnexplored: 'rgba(0, 0, 0, 0.8)',    // 未探索墙壁颜色（更深的颜色）
                start: '#10b981',
                end: '#ef4444',
                player: '#3b82f6',
                explored: 'rgba(255, 255, 255, 0.1)',
                unexplored: 'rgba(0, 0, 0, 0.5)',
                path: 'rgba(34, 197, 94, 0.3)',
                grid: 'rgba(255, 255, 255, 0.05)',
                text: '#e2e8f0'
            },
            animations: {
                enabled: true,
                moveDuration: 200, // 毫秒
                fadeDuration: 300
            }
        };
        
        // 动画状态
        this.animationState = {
            isAnimating: false,
            currentAnimation: null,
            startTime: null
        };
        
        // Canvas缩放和偏移
        this.canvasScale = 1;
        this.canvasOffset = { x: 0, y: 0 };
        
        // UI元素引用
        this.uiElements = {
            exploreRate: document.getElementById('exploreRate'),
            gameStatus: document.getElementById('gameStatus'),
            mazeSize: document.getElementById('mazeSize'),
            modePermanent: document.getElementById('modePermanent'),
            modeInstant: document.getElementById('modeInstant'),
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            hintBtn: document.getElementById('hintBtn'),
            solveBtn: document.getElementById('solveBtn'),
            moveUp: document.getElementById('moveUp'),
            moveDown: document.getElementById('moveDown'),
            moveLeft: document.getElementById('moveLeft'),
            moveRight: document.getElementById('moveRight'),
            startScreen: document.getElementById('startScreen'),
            gameOverlay: document.getElementById('gameOverlay')
        };
        
        // 事件监听器
        this.eventListeners = [];
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化UI控制器
     */
    init() {
        // 设置Canvas尺寸
        this.updateCanvasSize();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始渲染
        this.render();
        
        console.log('UI控制器初始化完成');
    }
    
    /**
     * 更新Canvas尺寸
     */
    updateCanvasSize() {
        if (!this.game) return;
        
        const mazeSize = this.game.config.mazeSize;
        const cellSize = this.config.cellSize;
        const padding = 20;
        
        // 计算迷宫实际需要的尺寸
        const mazeWidth = mazeSize * cellSize;
        const mazeHeight = mazeSize * cellSize;
        
        // 获取容器尺寸
        const container = this.canvas.parentElement;
        const containerWidth = container ? container.clientWidth : 800;
        const containerHeight = container ? container.clientHeight : 600;
        
        // 计算最大可用尺寸（留出边距）
        const maxWidth = containerWidth - padding * 2;
        const maxHeight = containerHeight - padding * 2;
        
        // 计算缩放比例
        const scaleX = maxWidth / mazeWidth;
        const scaleY = maxHeight / mazeHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 不超过原始大小
        
        // 计算Canvas尺寸
        const canvasWidth = Math.min(mazeWidth * scale + padding * 2, containerWidth);
        const canvasHeight = Math.min(mazeHeight * scale + padding * 2, containerHeight);
        
        // 更新Canvas尺寸
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // 保存缩放信息
        this.canvasScale = scale;
        this.canvasOffset = {
            x: (canvasWidth - mazeWidth * scale) / 2,
            y: (canvasHeight - mazeHeight * scale) / 2
        };
        
        console.log(`Canvas尺寸更新: ${canvasWidth}x${canvasHeight}, 缩放: ${scale.toFixed(2)}`);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // Canvas点击事件
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 控制按钮事件
        if (this.uiElements.startBtn) {
            this.uiElements.startBtn.addEventListener('click', () => this.handleStartGame());
        }
        
        if (this.uiElements.restartBtn) {
            this.uiElements.restartBtn.addEventListener('click', () => this.handleRestartGame());
        }
        
        if (this.uiElements.hintBtn) {
            this.uiElements.hintBtn.addEventListener('click', () => this.handleHint());
        }
        
        if (this.uiElements.solveBtn) {
            this.uiElements.solveBtn.addEventListener('click', () => this.handleShowSolution());
        }
        
        // 方向控制按钮
        if (this.uiElements.moveUp) {
            this.uiElements.moveUp.addEventListener('click', () => this.handleMove(0, -1));
        }
        
        if (this.uiElements.moveDown) {
            this.uiElements.moveDown.addEventListener('click', () => this.handleMove(0, 1));
        }
        
        if (this.uiElements.moveLeft) {
            this.uiElements.moveLeft.addEventListener('click', () => this.handleMove(-1, 0));
        }
        
        if (this.uiElements.moveRight) {
            this.uiElements.moveRight.addEventListener('click', () => this.handleMove(1, 0));
        }
        
        // 视野模式切换
        if (this.uiElements.modePermanent) {
            this.uiElements.modePermanent.addEventListener('click', () => this.handleViewModeChange('permanent'));
        }
        
        if (this.uiElements.modeInstant) {
            this.uiElements.modeInstant.addEventListener('click', () => this.handleViewModeChange('instant'));
        }
        
        // 迷宫大小选择
        if (this.uiElements.mazeSize) {
            this.uiElements.mazeSize.addEventListener('change', (e) => this.handleMazeSizeChange(e));
        }
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * 设置游戏实例
     * @param {Game} game - 游戏实例
     */
    setGame(game) {
        this.game = game;
        
        // 更新Canvas尺寸
        this.updateCanvasSize();
        
        // 注册游戏事件监听器
        this.registerGameEvents();
        
        // 初始渲染
        this.render();
    }
    
    /**
     * 注册游戏事件监听器
     */
    registerGameEvents() {
        if (!this.game) return;
        
        // 移动事件
        this.game.addEventListener('onMove', (data) => {
            this.updateStats();
            this.render();
        });
        
        // 单元格探索事件
        this.game.addEventListener('onCellExplored', (data) => {
            this.updateStats();
        });
        
        // 游戏开始事件
        this.game.addEventListener('onGameStart', (data) => {
            this.hideStartScreen();
            this.updateStats();
            this.render();
        });
        
        // 游戏胜利事件
        this.game.addEventListener('onVictory', (data) => {
            this.showVictoryScreen(data);
            this.updateStats();
        });
        
        // 游戏结束事件
        this.game.addEventListener('onGameOver', (data) => {
            this.showGameOverScreen(data);
            this.updateStats();
        });
    }
    
    /**
     * 渲染游戏
     */
    render() {
        if (!this.game || !this.ctx) return;
        
        // 清除Canvas
        this.clearCanvas();
        
        // 获取游戏状态
        const maze = this.game.getMaze();
        const playerPos = this.game.getPlayerPosition();
        const endPos = this.game.getMaze().getEnd();
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制已探索区域
        this.drawExploredAreas();
        
        // 绘制解决方案路径（如果启用）
        if (this.game.config.showSolution) {
            this.drawSolutionPath();
        }
        
        // 绘制迷宫墙壁
        this.drawWalls(maze);
        
        // 绘制起点和终点
        this.drawStartAndEnd(maze.getStart(), endPos);
        
        // 绘制玩家
        this.drawPlayer(playerPos);
        
        // 绘制UI叠加层
        this.drawUIOverlay();
    }
    
    /**
     * 清除Canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 绘制背景
     */
    drawBackground() {
        // 背景已经由clearCanvas绘制
    }
    
    /**
     * 绘制网格
     */
    drawGrid() {
        const { width, height } = this.canvas;
        const cellSize = this.config.cellSize;
        const padding = 10;
        
        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = padding; x <= width - padding; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, height - padding);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = padding; y <= height - padding; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制已探索区域
     */
    drawExploredAreas() {
        if (!this.game) return;
        
        const maze = this.game.getMaze();
        const { width, height } = maze.getSize();
        const cellSize = this.config.cellSize;
        const padding = 10;
        const viewSystem = this.game.getViewSystem();
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (viewSystem.isCellVisible(x, y)) {
                    // 当前可见的单元格
                    if (this.game.isCellExplored(x, y)) {
                        // 已探索的可见单元格 - 使用探索颜色
                        this.ctx.fillStyle = this.config.colors.explored;
                    } else {
                        // 当前可见但未探索的单元格 - 使用未探索颜色
                        this.ctx.fillStyle = this.config.colors.unexplored;
                    }
                    this.ctx.fillRect(
                        padding + x * cellSize,
                        padding + y * cellSize,
                        cellSize,
                        cellSize
                    );
                } else {
                    // 不可见的单元格 - 严格隐藏（使用背景色）
                    this.ctx.fillStyle = this.config.colors.background;
                    this.ctx.fillRect(
                        padding + x * cellSize,
                        padding + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }
    
    /**
     * 检查墙壁是否已探索
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {string} orientation - 墙壁方向 ('horizontal' 或 'vertical')
     * @param {Maze} maze - 迷宫实例
     * @returns {boolean} 墙壁是否已探索
     */
    isWallExplored(x, y, orientation, maze) {
        if (!this.game) return false;
        
        const viewSystem = this.game.getViewSystem();
        const { width, height } = maze.getSize();
        
        if (orientation === 'horizontal') {
            // 水平墙壁：检查上方单元格(y-1)和下方单元格(y)是否已探索
            const cellAbove = y > 0 ? viewSystem.isCellExplored(x, y-1) : false;
            const cellBelow = y < height ? viewSystem.isCellExplored(x, y) : false;
            return cellAbove || cellBelow;
        } else if (orientation === 'vertical') {
            // 垂直墙壁：检查左侧单元格(x-1)和右侧单元格(x)是否已探索
            const cellLeft = x > 0 ? viewSystem.isCellExplored(x-1, y) : false;
            const cellRight = x < width ? viewSystem.isCellExplored(x, y) : false;
            return cellLeft || cellRight;
        }
        
        return false;
    }
    
    /**
     * 绘制迷宫墙壁
     * @param {Maze} maze - 迷宫实例
     */
    drawWalls(maze) {
        const { width, height } = maze.getSize();
        const cellSize = this.config.cellSize;
        const wallWidth = this.config.wallWidth;
        const padding = 10;
        
        this.ctx.lineWidth = wallWidth;
        this.ctx.lineCap = 'square';
        
        // 绘制水平墙壁
        for (let y = 0; y <= height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze.getWall('horizontal', y, x)) {
                    // 检查墙壁是否已探索
                    const isExplored = this.isWallExplored(x, y, 'horizontal', maze);
                    
                    // 根据探索状态设置颜色
                    this.ctx.strokeStyle = isExplored ?
                        this.config.colors.wallExplored :
                        this.config.colors.wallUnexplored;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        padding + x * cellSize,
                        padding + y * cellSize
                    );
                    this.ctx.lineTo(
                        padding + (x + 1) * cellSize,
                        padding + y * cellSize
                    );
                    this.ctx.stroke();
                }
            }
        }
        
        // 绘制垂直墙壁
        for (let y = 0; y < height; y++) {
            for (let x = 0; x <= width; x++) {
                if (maze.getWall('vertical', y, x)) {
                    // 检查墙壁是否已探索
                    const isExplored = this.isWallExplored(x, y, 'vertical', maze);
                    
                    // 根据探索状态设置颜色
                    this.ctx.strokeStyle = isExplored ?
                        this.config.colors.wallExplored :
                        this.config.colors.wallUnexplored;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        padding + x * cellSize,
                        padding + y * cellSize
                    );
                    this.ctx.lineTo(
                        padding + x * cellSize,
                        padding + (y + 1) * cellSize
                    );
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * 绘制起点和终点
     * @param {Object} start - 起点坐标
     * @param {Object} end - 终点坐标
     */
    drawStartAndEnd(start, end) {
        const cellSize = this.config.cellSize;
        const padding = 10;
        const radius = cellSize * 0.3;
        
        // 绘制起点（绿色）
        this.ctx.fillStyle = this.config.colors.start;
        this.ctx.beginPath();
        this.ctx.arc(
            padding + start.x * cellSize + cellSize / 2,
            padding + start.y * cellSize + cellSize / 2,
            radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 绘制终点（红色）
        this.ctx.fillStyle = this.config.colors.end;
        this.ctx.beginPath();
        this.ctx.arc(
            padding + end.x * cellSize + cellSize / 2,
            padding + end.y * cellSize + cellSize / 2,
            radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 添加文字标签
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 起点标签
        this.ctx.fillText(
            '起点',
            padding + start.x * cellSize + cellSize / 2,
            padding + start.y * cellSize + cellSize / 2
        );
        
        // 终点标签
        this.ctx.fillText(
            '终点',
            padding + end.x * cellSize + cellSize / 2,
            padding + end.y * cellSize + cellSize / 2
        );
    }
    
    /**
     * 绘制玩家
     * @param {Object} position - 玩家位置（像素坐标）
     */
    drawPlayer(position) {
        const padding = 10;
        
        // 如果position包含radius，使用它，否则使用默认值
        const radius = position.radius || (this.config.cellSize * 0.25);
        
        this.ctx.fillStyle = this.config.colors.player;
        this.ctx.beginPath();
        this.ctx.arc(
            padding + position.x,
            padding + position.y,
            radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 添加玩家图标
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'P',
            padding + position.x,
            padding + position.y
        );
    }
    
    /**
     * 绘制解决方案路径
     */
    drawSolutionPath() {
        if (!this.game) return;
        
        const path = this.game.getSolutionPath();
        if (path.length < 2) return;
        
        const cellSize = this.config.cellSize;
        const padding = 10;
        const radius = cellSize * 0.1;
        
        this.ctx.strokeStyle = this.config.colors.path;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 绘制路径线
        this.ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const x = padding + point.x * cellSize + cellSize / 2;
            const y = padding + point.y * cellSize + cellSize / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        // 绘制路径点
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const x = padding + point.x * cellSize + cellSize / 2;
            const y = padding + point.y * cellSize + cellSize / 2;
            
            this.ctx.fillStyle = this.config.colors.path;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * 绘制UI叠加层
     */
    drawUIOverlay() {
        // 这里可以添加一些UI叠加元素，比如提示文字等
    }
    
    /**
     * 更新游戏统计信息显示
     */
    updateStats() {
        if (!this.game) return;
        
        const stats = this.game.getStats();
        
        if (this.uiElements.exploreRate) {
            this.uiElements.exploreRate.textContent = `${stats.exploreRate}%`;
        }
        
        if (this.uiElements.gameStatus) {
            const gameState = this.game.getGameState();
            let statusText = '准备中';
            
            if (gameState.isRunning) {
                statusText = gameState.isPaused ? '已暂停' : '进行中';
            } else if (gameState.isGameOver) {
                statusText = gameState.isVictory ? '胜利!' : '失败';
            }
            
            this.uiElements.gameStatus.textContent = statusText;
        }
    }
    
    /**
     * 显示开始屏幕
     */
    showStartScreen() {
        if (this.uiElements.gameOverlay && this.uiElements.startScreen) {
            this.uiElements.gameOverlay.style.display = 'flex';
            this.uiElements.startScreen.style.display = 'block';
        }
    }
    
    /**
     * 隐藏开始屏幕
     */
    hideStartScreen() {
        if (this.uiElements.gameOverlay) {
            this.uiElements.gameOverlay.style.display = 'none';
        }
    }
    
    /**
     * 显示胜利屏幕
     * @param {Object} data - 胜利数据
     */
    showVictoryScreen(data) {
        // 创建胜利屏幕HTML
        const victoryHTML = `
            <div class="message-overlay victory">
                <div class="message-box">
                    <h2><i class="fas fa-trophy"></i> 恭喜你胜利了！</h2>
                    <p>你成功找到了迷宫的出口！</p>
                    
                    <div class="message-stats">
                        <div class="stat-box">
                            <span class="value">${data.time}s</span>
                            <span class="label">时间</span>
                        </div>
                        <div class="stat-box">
                            <span class="value">${data.exploreRate}%</span>
                            <span class="label">探索率</span>
                        </div>
                        <div class="stat-box">
                            <span class="value">${data.exploredCells}/${data.totalCells}</span>
                            <span class="label">探索单元格</span>
                        </div>
                    </div>
                    
                    <div class="message-buttons">
                        <button class="message-btn primary" id="playAgainBtn">
                            <i class="fas fa-redo"></i> 再玩一次
                        </button>
                        <button class="message-btn secondary" id="backToMenuBtn">
                            <i class="fas fa-home"></i> 返回菜单
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        const overlay = document.createElement('div');
        overlay.innerHTML = victoryHTML;
        document.body.appendChild(overlay);
        
        // 绑定按钮事件
        setTimeout(() => {
            const playAgainBtn = document.getElementById('playAgainBtn');
            const backToMenuBtn = document.getElementById('backToMenuBtn');
            
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    overlay.remove();
                    this.handleRestartGame();
                });
            }
            
            if (backToMenuBtn) {
                backToMenuBtn.addEventListener('click', () => {
                    overlay.remove();
                    this.showStartScreen();
                    this.game.init();
                    this.render();
                });
            }
        }, 100);
    }
    
    /**
     * 显示游戏结束屏幕
     * @param {Object} data - 游戏结束数据
     */
    showGameOverScreen(data) {
        // 创建游戏结束屏幕HTML
        const gameOverHTML = `
            <div class="message-overlay defeat">
                <div class="message-box">
                    <h2><i class="fas fa-skull-crossbones"></i> 游戏结束</h2>
                    <p>很遗憾，你未能完成迷宫。</p>
                    
                    <div class="message-stats">
                        <div class="stat-box">
                            <span class="value">${data.time}s</span>
                            <span class="label">时间</span>
                        </div>
                    </div>
                    
                    <div class="message-buttons">
                        <button class="message-btn primary" id="retryBtn">
                            <i class="fas fa-redo"></i> 重新尝试
                        </button>
                        <button class="message-btn secondary" id="showSolutionBtn">
                            <i class="fas fa-route"></i> 显示解决方案
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        const overlay = document.createElement('div');
        overlay.innerHTML = gameOverHTML;
        document.body.appendChild(overlay);
        
        // 绑定按钮事件
        setTimeout(() => {
            const retryBtn = document.getElementById('retryBtn');
            const showSolutionBtn = document.getElementById('showSolutionBtn');
            
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    overlay.remove();
                    this.handleRestartGame();
                });
            }
            
            if (showSolutionBtn) {
                showSolutionBtn.addEventListener('click', () => {
                    overlay.remove();
                    this.handleShowSolution();
                    this.render();
                });
            }
        }, 100);
    }
    
    /**
     * 处理Canvas点击事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleCanvasClick(e) {
        if (!this.game || !this.game.state.isRunning || this.game.state.isPaused) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const padding = 10;
        
        // 计算点击的像素位置（减去padding）
        const clickX = x - padding;
        const clickY = y - padding;
        
        // 获取玩家当前位置
        const playerPos = this.game.getPlayerPosition();
        
        // 计算点击方向向量
        const dx = clickX - playerPos.x;
        const dy = clickY - playerPos.y;
        
        // 如果点击位置很近，不移动
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 20) {
            return;
        }
        
        // 归一化方向向量
        const normX = dx / distance;
        const normY = dy / distance;
        
        // 设置移动输入（模拟长按方向）
        // 这里简化处理：直接移动到点击位置
        // 实际应该设置移动方向，让玩家持续移动
        this.handleMoveDirection(normX, normY);
    }
    
    /**
     * 处理移动方向（连续移动）
     * @param {number} dirX - x方向
     * @param {number} dirY - y方向
     */
    handleMoveDirection(dirX, dirY) {
        if (!this.game) return;
        
        // 确定主要移动方向
        let moveX = 0, moveY = 0;
        
        if (Math.abs(dirX) > Math.abs(dirY)) {
            moveX = dirX > 0 ? 1 : -1;
        } else {
            moveY = dirY > 0 ? 1 : -1;
        }
        
        // 使用旧的移动方法（兼容性）
        this.handleMove(moveX, moveY);
    }
    
    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        if (!this.game) return;
        
        // 处理移动输入（长按支持）
        let direction = null;
        let pressed = true;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                direction = 'right';
                break;
            case ' ':
                if (this.game.state.isRunning) {
                    this.game.togglePause();
                    this.updateStats();
                    this.render();
                }
                return;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    this.handleRestartGame();
                }
                return;
            case 'Escape':
                if (this.game.state.isRunning) {
                    this.game.togglePause();
                    this.updateStats();
                    this.render();
                }
                return;
            default:
                return;
        }
        
        if (direction) {
            e.preventDefault();
            
            // 设置移动输入
            if (this.game.setMoveInput) {
                this.game.setMoveInput(direction, pressed);
            } else {
                // 回退到旧的移动方式
                let dx = 0, dy = 0;
                if (direction === 'up') dy = -1;
                if (direction === 'down') dy = 1;
                if (direction === 'left') dx = -1;
                if (direction === 'right') dx = 1;
                this.handleMove(dx, dy);
            }
        }
    }
    
    /**
     * 处理键盘释放事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyUp(e) {
        if (!this.game) return;
        
        let direction = null;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                direction = 'right';
                break;
            default:
                return;
        }
        
        if (direction && this.game.setMoveInput) {
            e.preventDefault();
            this.game.setMoveInput(direction, false);
        }
    }
    
    /**
     * 处理移动
     * @param {number} dx - x方向移动量
     * @param {number} dy - y方向移动量
     */
    handleMove(dx, dy) {
        if (!this.game) return;
        
        const success = this.game.movePlayer(dx, dy);
        
        if (success) {
            // 播放移动音效（如果有）
            this.playMoveSound();
            
            // 更新UI
            this.updateStats();
            this.render();
        } else {
            // 播放错误音效（如果有）
            this.playErrorSound();
        }
    }
    
    /**
     * 处理开始游戏
     */
    handleStartGame() {
        if (!this.game) return;
        
        // 获取选择的模式
        const modeButtons = document.querySelectorAll('.mode-btn');
        let selectedMode = 'permanent';
        
        modeButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                selectedMode = btn.dataset.mode;
            }
        });
        
        // 设置游戏模式
        this.game.setViewMode(selectedMode);
        
        // 开始游戏
        this.game.start();
        
        // 更新UI
        this.updateStats();
        this.render();
    }
    
    /**
     * 处理重新开始游戏
     */
    handleRestartGame() {
        if (!this.game) return;
        
        this.game.restart();
        this.updateStats();
        this.render();
    }
    
    /**
     * 处理提示
     */
    handleHint() {
        if (!this.game) return;
        
        // 显示下一个建议移动方向
        const playerPos = this.game.getPlayerPosition();
        const endPos = this.game.getMaze().getEnd();
        
        // 简单提示：指向终点的方向
        const dx = endPos.x - playerPos.x;
        const dy = endPos.y - playerPos.y;
        
        let hint = '';
        if (Math.abs(dx) > Math.abs(dy)) {
            hint = dx > 0 ? '尝试向右移动' : '尝试向左移动';
        } else {
            hint = dy > 0 ? '尝试向下移动' : '尝试向上移动';
        }
        
        // 显示提示
        this.showHint(hint);
    }
    
    /**
     * 显示提示
     * @param {string} message - 提示消息
     */
    showHint(message) {
        // 创建提示元素
        const hintElement = document.createElement('div');
        hintElement.className = 'hint-message';
        hintElement.innerHTML = `
            <div class="hint-content">
                <i class="fas fa-lightbulb"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(hintElement);
        
        // 3秒后移除
        setTimeout(() => {
            hintElement.remove();
        }, 3000);
    }
    
    /**
     * 处理显示解决方案
     */
    handleShowSolution() {
        if (!this.game) return;
        
        this.game.showSolution();
        this.render();
    }
    
    /**
     * 处理视野模式切换
     * @param {string} mode - 视野模式
     */
    handleViewModeChange(mode) {
        if (!this.game) return;
        
        this.game.setViewMode(mode);
        
        // 更新UI按钮状态
        if (this.uiElements.modePermanent && this.uiElements.modeInstant) {
            if (mode === 'permanent') {
                this.uiElements.modePermanent.classList.add('active');
                this.uiElements.modeInstant.classList.remove('active');
            } else {
                this.uiElements.modePermanent.classList.remove('active');
                this.uiElements.modeInstant.classList.add('active');
            }
        }
        
        this.render();
    }
    
    /**
     * 处理迷宫大小变化
     * @param {Event} e - 变化事件
     */
    handleMazeSizeChange(e) {
        if (!this.game) return;
        
        const size = parseInt(e.target.value);
        this.game.setMazeSize(size);
        
        // 更新Canvas尺寸
        this.updateCanvasSize();
        
        this.render();
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 可以在这里添加响应式调整
        this.render();
    }
    
    /**
     * 播放移动音效
     */
    playMoveSound() {
        // 这里可以添加音效播放逻辑
        // 暂时使用控制台日志
        console.log('播放移动音效');
    }
    
    /**
     * 播放错误音效
     */
    playErrorSound() {
        // 这里可以添加音效播放逻辑
        // 暂时使用控制台日志
        console.log('播放错误音效');
    }
    
    /**
     * 开始移动动画
     * @param {Object} from - 起始位置
     * @param {Object} to - 目标位置
     */
    startMoveAnimation(from, to) {
        if (!this.config.animations.enabled) return;
        
        this.animationState.isAnimating = true;
        this.animationState.currentAnimation = {
            type: 'move',
            from: { ...from },
            to: { ...to },
            startTime: Date.now()
        };
        
        this.animate();
    }
    
    /**
     * 动画循环
     */
    animate() {
        if (!this.animationState.isAnimating) return;
        
        const now = Date.now();
        const animation = this.animationState.currentAnimation;
        
        if (animation.type === 'move') {
            const elapsed = now - animation.startTime;
            const duration = this.config.animations.moveDuration;
            const progress = Math.min(elapsed / duration, 1);
            
            // 计算当前位置
            const currentX = animation.from.x + (animation.to.x - animation.from.x) * progress;
            const currentY = animation.from.y + (animation.to.y - animation.from.y) * progress;
            
            // 渲染中间状态
            this.renderWithAnimation(currentX, currentY);
            
            if (progress < 1) {
                requestAnimationFrame(() => this.animate());
            } else {
                this.animationState.isAnimating = false;
                this.animationState.currentAnimation = null;
                this.render(); // 最终渲染
            }
        }
    }
    
    /**
     * 带动画的渲染
     * @param {number} playerX - 玩家x坐标（动画中）
     * @param {number} playerY - 玩家y坐标（动画中）
     */
    renderWithAnimation(playerX, playerY) {
        // 保存原始玩家位置
        const originalPlayer = this.game ? { ...this.game.getPlayerPosition() } : null;
        
        // 临时设置玩家位置
        if (this.game && originalPlayer) {
            // 这里需要临时修改玩家位置进行渲染
            // 注意：这只是一个示例，实际实现可能需要不同的方法
        }
        
        this.render();
        
        // 恢复原始玩家位置
        if (this.game && originalPlayer) {
            // 恢复玩家位置
        }
    }
}

// 导出UIController类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}