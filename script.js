// --- 1. 光照测量系统 (Measurement System) ---
const grid = document.querySelector('.layout-grid');
const cards = document.querySelectorAll('.glass-panel');

grid.addEventListener('mousemove', (e) => {
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 将鼠标坐标传给 CSS，用于移动光斑
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// --- 2. 量子流场 (Quantum Flow Field) ---
const canvas = document.getElementById('quantum-flow');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
// 流场网格分辨率
const scale = 20; 
let cols, rows;
let zOff = 0; // 噪声的时间维度

// 粒子配置
const config = {
    count: 1500,        // 粒子数量，大胆一点！
    speed: 0.8,         // 基础速度
    color1: '#8f00ff',  // 紫色
    color2: '#00f3ff'   // 青色
};

// 简单的伪噪声函数 (替代 Perlin Noise 库，保持代码轻量)
// 返回 -1 到 1 之间的值
function noise(x, y, t) {
    return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) * Math.sin(x * 0.005 + y * 0.005 + t * 0.5);
}

class Particle {
    constructor() {
        this.pos = { x: Math.random() * width, y: Math.random() * height };
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        this.maxSpeed = Math.random() * 2 + 1;
        
        this.prevPos = { x: this.pos.x, y: this.pos.y };
        
        // 随机决定这个粒子偏向紫色还是青色
        this.colorBias = Math.random(); 
    }

    update(time) {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;

        // 1. 计算流场力
        // 获取当前位置的噪声值，映射到角度 (0 到 2PI)
        const angle = (noise(this.pos.x, this.pos.y, time * 0.0005) + 1) * Math.PI * 2;
        
        // 根据角度设定加速度矢量
        this.acc.x += Math.cos(angle) * 0.1;
        this.acc.y += Math.sin(angle) * 0.1;

        // 2. 鼠标交互力 (测量扰动)
        // 简单的交互：鼠标是一个排斥源
        // 注意：这里简单模拟，假设 global mouse 变量存在
        // 实际项目中可以添加鼠标监听更新全局 mouseX, mouseY

        // 3. 物理运动
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        
        // 限制速度
        const currSpeed = Math.sqrt(this.vel.x**2 + this.vel.y**2);
        if (currSpeed > this.maxSpeed) {
            this.vel.x = (this.vel.x / currSpeed) * this.maxSpeed;
            this.vel.y = (this.vel.y / currSpeed) * this.maxSpeed;
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        // 重置加速度
        this.acc.x = 0;
        this.acc.y = 0;

        // 边界处理：穿过屏幕
        this.edges();
    }

    edges() {
        if (this.pos.x > width) { this.pos.x = 0; this.prevPos.x = 0; }
        if (this.pos.x < 0) { this.pos.x = width; this.prevPos.x = width; }
        if (this.pos.y > height) { this.pos.y = 0; this.prevPos.y = 0; }
        if (this.pos.y < 0) { this.pos.y = height; this.prevPos.y = height; }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.prevPos.x, this.prevPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        
        // 动态调色：速度越快越亮，且混合青紫
        const speed = Math.sqrt(this.vel.x**2 + this.vel.y**2);
        const alpha = Math.min(speed * 0.3, 0.8); // 速度决定透明度
        
        if (this.colorBias > 0.5) {
            ctx.strokeStyle = `rgba(143, 0, 255, ${alpha})`; // 紫
        } else {
            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`; // 青
        }
        
        ctx.lineWidth = speed * 0.8; // 速度决定线条粗细
        ctx.stroke();
    }
}

function initParticles() {
    resize();
    particles = [];
    for(let i = 0; i < config.count; i++) {
        particles.push(new Particle());
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function animate() {
    // 关键技巧：不完全清空画布，保留一点点上一帧的痕迹，形成更加连贯的“流体感”
    // 如果想要粒子清晰，用 clearRect；如果想要拖尾流体，用 fillRect 黑色带透明度
    ctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; 
    ctx.fillRect(0, 0, width, height);

    zOff += 1; // 时间流动

    particles.forEach(p => {
        p.update(zOff);
        p.draw(ctx);
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resize();
    initParticles();
});

initParticles();
animate();

// --- 3. Configuration Loader (Data Injection) ---
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error('Failed to load config');
        const data = await response.json();

        // 1. Update System Status
        document.getElementById('sys-status').textContent = data.system.status;
        document.getElementById('sys-version').textContent = data.system.version;

        // 2. Update Profile
        const nameEl = document.getElementById('profile-name');
        nameEl.textContent = data.profile.name;
        nameEl.setAttribute('data-text', data.profile.name);
        
        const roleContainer = document.querySelector('.role-tag');
        roleContainer.innerHTML = `<span class="op">∇</span> ${data.profile.role}`;

        document.getElementById('bio-primary').innerHTML = data.profile.bio_primary;
        document.getElementById('bio-secondary').textContent = data.profile.bio_secondary;
        
        document.getElementById('btn-email').href = `mailto:${data.profile.email}`;
        document.getElementById('btn-github').href = data.profile.github;
        document.getElementById('btn-scholar').href = data.profile.scholar;

        // 3. Update Featured Project (包含链接逻辑)
        document.getElementById('proj-label').textContent = data.featured_project.label;
        document.getElementById('proj-name').textContent = data.featured_project.name;
        document.getElementById('proj-desc').textContent = data.featured_project.description;
        
        // [NEW] 设置 Project 卡片的链接
        const projectLink = document.getElementById('project-link');
        if (data.featured_project.url) {
            projectLink.href = data.featured_project.url;
        } else {
            projectLink.removeAttribute('href'); // 如果没有链接，移除 href 防止跳转
            projectLink.style.cursor = 'default';
        }
        
        const tagContainer = document.getElementById('proj-tags');
        tagContainer.innerHTML = ''; 
        data.featured_project.tags.forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag;
            tagContainer.appendChild(span);
        });

        // 4. Update Papers (包含链接逻辑)
        const paperList = document.getElementById('paper-list');
        paperList.innerHTML = ''; 
        
        data.papers.forEach(paper => {
            // [NEW] 创建 a 标签而不是 div
            const link = document.createElement('a');
            link.className = 'paper-item';
            // 设置链接，如果 json 里有 url 且不为空
            if (paper.url) {
                link.href = paper.url;
                link.target = "_blank"; // 在新标签页打开论文
            }
            
            const statusClass = paper.type === 'review' ? 'state-tag review' : 'state-tag';
            
            link.innerHTML = `
                <span class="year">${paper.year}</span>
                <span class="title">${paper.title}</span>
                <span class="${statusClass}">${paper.status}</span>
            `;
            
            paperList.appendChild(link);
        });

    } catch (error) {
        console.error('Error loading config:', error);
        document.getElementById('profile-name').textContent = "ERROR_LOAD";
    }
}

document.addEventListener('DOMContentLoaded', loadConfig);