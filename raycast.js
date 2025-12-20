/**
 * 隐藏迷宫 - 射线检测系统模块
 * 使用射线检测算法实现360度视野
 */

class RaycastSystem {
    /**
     * 创建射线检测系统实例
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        this.config = {
            rayCount: options.rayCount || 360, // 射线数量（360度）
            maxRayDistance: options.maxRayDistance || 10, // 最大射线距离（单位：格子）
            rayStep: options.rayStep || 0.1, // 射线步进距离
            fov: options.fov || 360 // 视野角度（度）
        };
        
        this.visiblePoints = []; // 可见点集合
        this.visibleCells = new Set(); // 可见单元格集合（兼容旧系统）
        this.cache = new Map(); // 缓存计算结果
    }
    
    /**
     * 更新视野
     * @param {number} playerX - 玩家x坐标（像素）
     * @param {number} playerY - 玩家y坐标（像素）
     * @param {Maze} maze - 迷宫实例
     * @param {number} cellSize - 单元格大小（像素）
     * @returns {Array} 可见点数组
     */
    update(playerX, playerY, maze, cellSize) {
        const cacheKey = `${playerX.toFixed(1)},${playerY.toFixed(1)}`;
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            this.visiblePoints = cached.points;
            this.visibleCells = cached.cells;
            return this.visiblePoints;
        }
        
        this.visiblePoints = [];
        this.visibleCells.clear();
        
        // 计算玩家所在的格子坐标
        const playerCellX = Math.floor(playerX / cellSize);
        const playerCellY = Math.floor(playerY / cellSize);
        
        // 发射射线
        const rayCount = this.config.rayCount;
        const angleStep = this.config.fov / rayCount;
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i * angleStep) * Math.PI / 180; // 转换为弧度
            
            // 发射一条射线
            const rayPoints = this.castRay(
                playerX, playerY, 
                angle, 
                maze, 
                cellSize
            );
            
            // 添加射线上的可见点
            this.visiblePoints.push(...rayPoints);
            
            // 更新可见单元格
            for (const point of rayPoints) {
                const cellX = Math.floor(point.x / cellSize);
                const cellY = Math.floor(point.y / cellSize);
                const cellKey = `${cellX},${cellY}`;
                this.visibleCells.add(cellKey);
            }
        }
        
        // 缓存结果
        this.cache.set(cacheKey, {
            points: [...this.visiblePoints],
            cells: new Set(this.visibleCells)
        });
        
        // 限制缓存大小
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        return this.visiblePoints;
    }
    
    /**
     * 发射一条射线
     * @param {number} startX - 起点x坐标
     * @param {number} startY - 起点y坐标
     * @param {number} angle - 射线角度（弧度）
     * @param {Maze} maze - 迷宫实例
     * @param {number} cellSize - 单元格大小
     * @returns {Array} 射线上的可见点
     */
    castRay(startX, startY, angle, maze, cellSize) {
        const points = [];
        const maxDistance = this.config.maxRayDistance * cellSize;
        const step = this.config.rayStep * cellSize;
        
        let distance = 0;
        let currentX = startX;
        let currentY = startY;
        
        // 射线方向向量
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        
        while (distance < maxDistance) {
            // 计算下一个点
            currentX += dirX * step;
            currentY += dirY * step;
            distance += step;
            
            // 检查是否碰到墙壁
            if (this.isPointInWall(currentX, currentY, maze, cellSize)) {
                // 碰到墙壁，停止射线
                break;
            }
            
            // 添加可见点
            points.push({
                x: currentX,
                y: currentY,
                distance: distance
            });
            
            // 如果到达迷宫边界，停止射线
            const cellX = Math.floor(currentX / cellSize);
            const cellY = Math.floor(currentY / cellSize);
            const { width, height } = maze.getSize();
            
            if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) {
                break;
            }
        }
        
        return points;
    }
    
    /**
     * 检查点是否在墙壁内
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {Maze} maze - 迷宫实例
     * @param {number} cellSize - 单元格大小
     * @returns {boolean} 是否在墙壁内
     */
    isPointInWall(x, y, maze, cellSize) {
        // 计算点所在的格子
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        
        // 计算点在格子内的相对位置
        const relX = (x % cellSize) / cellSize;
        const relY = (y % cellSize) / cellSize;
        
        const { width, height } = maze.getSize();
        
        // 检查是否在迷宫范围内
        if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) {
            return true; // 迷宫边界视为墙壁
        }
        
        // 检查水平墙壁（上边界）
        if (relY < 0.1) { // 靠近上边界
            if (maze.getWall('horizontal', cellY, cellX)) {
                return true;
            }
        }
        
        // 检查水平墙壁（下边界）
        if (relY > 0.9) { // 靠近下边界
            if (maze.getWall('horizontal', cellY + 1, cellX)) {
                return true;
            }
        }
        
        // 检查垂直墙壁（左边界）
        if (relX < 0.1) { // 靠近左边界
            if (maze.getWall('vertical', cellY, cellX)) {
                return true;
            }
        }
        
        // 检查垂直墙壁（右边界）
        if (relX > 0.9) { // 靠近右边界
            if (maze.getWall('vertical', cellY, cellX + 1)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查点是否可见
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} cellSize - 单元格大小
     * @returns {boolean} 是否可见
     */
    isPointVisible(x, y, cellSize) {
        // 简化检查：如果点在可见点附近，则认为可见
        const tolerance = cellSize * 0.5;
        
        for (const point of this.visiblePoints) {
            const dx = point.x - x;
            const dy = point.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= tolerance) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查单元格是否可见（兼容旧系统）
     * @param {number} cellX - 单元格x坐标
     * @param {number} cellY - 单元格y坐标
     * @returns {boolean} 是否可见
     */
    isCellVisible(cellX, cellY) {
        const cellKey = `${cellX},${cellY}`;
        return this.visibleCells.has(cellKey);
    }
    
    /**
     * 获取可见点数组
     * @returns {Array} 可见点数组
     */
    getVisiblePoints() {
        return [...this.visiblePoints];
    }
    
    /**
     * 获取可见单元格数组（兼容旧系统）
     * @returns {Array} 可见单元格坐标数组
     */
    getVisibleCells() {
        const cells = [];
        for (const cellKey of this.visibleCells) {
            const [x, y] = cellKey.split(',').map(Number);
            cells.push({ x, y });
        }
        return cells;
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * 设置射线数量
     * @param {number} count - 射线数量
     */
    setRayCount(count) {
        this.config.rayCount = Math.max(36, Math.min(count, 720)); // 限制范围
        this.clearCache();
    }
    
    /**
     * 设置最大射线距离
     * @param {number} distance - 最大距离（格子数）
     */
    setMaxRayDistance(distance) {
        this.config.maxRayDistance = Math.max(1, Math.min(distance, 20)); // 限制范围
        this.clearCache();
    }
    
    /**
     * 设置视野角度
     * @param {number} fov - 视野角度（度）
     */
    setFOV(fov) {
        this.config.fov = Math.max(45, Math.min(fov, 360)); // 限制范围
        this.clearCache();
    }
    
    /**
     * 获取系统状态
     * @returns {Object} 状态对象
     */
    getState() {
        return {
            rayCount: this.config.rayCount,
            maxRayDistance: this.config.maxRayDistance,
            fov: this.config.fov,
            visiblePoints: this.visiblePoints.length,
            visibleCells: this.visibleCells.size
        };
    }
}

// 导出RaycastSystem类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaycastSystem;
}