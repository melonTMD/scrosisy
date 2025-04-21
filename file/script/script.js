console.log(`
Welcome to
   _____                  ____     _____     
  / ____|                / __ \\   / ____|    
 | (___     ___   _ __  | |  | | | (___      
  \\___ \\   / __| | '__| | |  | |  \\___ \\     
  ____) | | (__  | |    | |__| |  ____) |  _ 
 |_____/   \\___| |_|     \\____/  |_____/  ( )
                                          |/
 ______                                                         
/\\__  _\\                                                        
\\/_/\\ \\/      ____     __      __    __  __      ___    __  __  
   \\ \\ \\     /',__\\  /'__\`\\  /'__\`\\ /\\ \\/\\ \\    / __\`\\ /\\ \\/\\ \\ 
    \\_\\ \\__ /\\__, \`\\/\\  __/ /\\  __/ \\ \\ \\_\\ \\  /\\ \\L\\ \\\\ \\ \\_\\ \\
    /\\_____\\\\/\\____/\\ \\____\\\\ \\____\\ \\/\`____ \\ \\ \\____/ \\ \\____/
    \\/_____/ \\/___/  \\/____/ \\/____/  \`/___/> \\ \\/___/   \\/___/ 
                                         /\\___/                 
© 2025 Maybesoft. all rights reserved.   \\/__/                  

`);

// 配置项统一管理
let isimgconfig = false;
const CONFIG = {
    apis: {
        news: 'https://scosnews.02studio.xyz/',
        projects: 'https://scosjson.02studio.xyz/',
        rankOS: 'https://scosrankos.02studio.xyz/',
        rankUI: 'https://scosrankui.02studio.xyz/'
    },
    containers: {
        news: '#newslist',
        projects: '#osprojectlist',
        projects_sidebar: '#sidebardownlayer',
        news_sidebar: '#newssidebardownlayer',
        rankOS: '#oslist',
        rankUI: '#uilist'
    },
    rankConfig: [
        { class: 'nb1', icon: '🥇' },
        { class: 'nb2', icon: '🥈' },
        { class: 'nb3', icon: '🥉' }
    ]
};

// 工具函数
const utils = {
    // 文本截断
    truncate: (text, max, ellipsis = '...') =>
        text?.length > max ? text.slice(0, max) + ellipsis : text || '',

    // 创建元素
    createEl: (tag, classes, styles) => {
        const el = document.createElement(tag);
        if (classes) el.className = classes;
        if (styles) Object.assign(el.style, styles);
        return el;
    },

    // 统一错误处理
    showError: (error, containerId) => {
        const container = document.querySelector(containerId);
        if (!container) return;

        const errorEl = utils.createEl('div', 'error-message', {
            margin: '5px',
            padding: '0px 14px 0px 14px',
            background: '#ffecec',
            width: '250px',
            border: '1px solid #ffb3b3',
            borderRadius: '4px'
        });

        errorEl.innerHTML = `<h3>加载失败</h3><p>${utils.escapeHtml(error.message)}</p>`;
        container.innerHTML = '';
        container.appendChild(errorEl);
    },

    // HTML转义
    escapeHtml: (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/[&<>"']/g, (match) => {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }
};

// 通用数据加载模块
const dataLoader = {
    // 加载列表数据
    async loadList(config) {
        try {
            const { url, containerId, fieldsMap, template } = config;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP错误 ${res.status}`);

            const data = await res.json();
            if (data.code !== 200 || !data.success) throw new Error('数据异常');

            const container = document.querySelector(containerId);
            if (!container) throw new Error('容器不存在');

            container.innerHTML = data.data.records
                .map(record => {
                    const fields = Object.entries(fieldsMap)
                        .reduce((acc, [key, field]) =>
                            ({ ...acc, [key]: utils.escapeHtml(record.fields[field]) }), {});
                    return template(fields);
                })
                .join('');

        } catch (error) {
            console.error(`加载失败: ${error}`);
            utils.showError(error, config.containerId);
        }
    },

    // 加载排行榜
    async loadRanking(config) {
        try {
            const { url, containerId, titleField, authorField, scoreField } = config;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP错误 ${res.status}`);

            const data = await res.json();
            if (data.code !== 200 || !data.success) throw new Error('数据异常');

            const sorted = [...data.data.records].sort((a, b) =>
                parseFloat(b.fields[scoreField]) - parseFloat(a.fields[scoreField]));

            const container = document.querySelector(containerId);
            if (!container) throw new Error('容器不存在');

            container.innerHTML = sorted
                .map((item, index) => {
                    const rank = index < 3 ? CONFIG.rankConfig[index] : null;
                    return `
              <div class="${rank ? rank.class : 'nbn'}" onclick="toggleproject_sidebar('${stringToHex(utils.escapeHtml(item.fields[titleField]))}scros${stringToHex(utils.escapeHtml(item.fields[authorField]))}');">
                <span>
                  ${rank ? rank.icon + ' ' : ''}
                  ${utils.escapeHtml(item.fields[titleField])} - ${utils.escapeHtml(item.fields[authorField])} 分:${utils.escapeHtml(item.fields[scoreField])}
                </span>
              </div>
            `;
                })
                .join('');

        } catch (error) {
            console.error(`加载失败: ${error}`);
            utils.showError(error, config.containerId);
        }
    }
};

// 初始化函数
const init = () => {
    // 图片高度调整函数
    const adjustImageHeight = () => {
        document.querySelectorAll('.image-div').forEach(div => {
            const height = div.offsetHeight;
            div.querySelectorAll('.image').forEach(img => {
                img.style.height = `86px`;
            });
        });
    };

    // 初始化图片调整配置
    if (!isimgconfig) {
        adjustImageHeight(); // 初始调整
        isimgconfig = true;
    }

    // 监听内容变化
    const observer = new MutationObserver(adjustImageHeight);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 加载新闻列表
    dataLoader.loadList({
        url: CONFIG.apis.news,
        containerId: CONFIG.containers.news,
        fieldsMap: {
            title: '标题',
            content: '内容',
            time: '时间'
        },
        template: fields => `
        <div class="conli" onclick="togglenews_sidebar('${stringToHex(fields.title)}news${stringToHex(fields.time)}');">
          <div class="content-div">
            <span class="title">${fields.title}</span>
            <br>
            <span>${fields.time}</span>
            <br>
            <span>${utils.truncate(fields.content, 30)}</span>
          </div>
        </div>
      `
    });

    // 加载新闻列表
    dataLoader.loadList({
        url: CONFIG.apis.news,
        containerId: CONFIG.containers.news_sidebar,
        fieldsMap: {
            title: '标题',
            content: '内容',
            time: '时间'
        },
        template: fields => `
        <div class="scros-detalmsg-sidebar" id="${stringToHex(fields.title)}news${stringToHex(fields.time)}">
            <button class="toggle" onclick="togglenews_sidebar('${stringToHex(fields.title)}news${stringToHex(fields.time)}');"><</button>
            <h1 class="title" style="font-size: 3rem; color: #fafafa;"> <span class="material-symbols-outlined" style="font-size: 3rem; color: #fafafa;">newspaper</span> ${fields.title}</h1>
            <span class="author" style="color: #fafafa;">${fields.time}</span>
            <hr class="hr-sidebar">
            <span class="author" style="color: #fafafa;">${fields.content}</span>
        <hr class="hr-sidebar">
          `
    });

    // 加载项目列表（主内容区域）
    dataLoader.loadList({
        url: CONFIG.apis.projects,
        containerId: CONFIG.containers.projects,
        fieldsMap: {
            title: '名称',
            content: '介绍',
            author: '作者',
            size: '体积'
        },
        template: fields => `
        <div class="conli" onclick="toggleproject_sidebar('${stringToHex(fields.title)}scros${stringToHex(fields.author)}');">
          <div class="image-div">
            <img class="image" src="file/img/tab-logo.png">
          </div>
          <div class="content-div">
            <span class="title">${fields.title}</span>
            <br>
            <span>by ${fields.author}</span>
            <br>
            <span>${utils.truncate(fields.content, 30)}</span>
            <br>
            <span>${fields.size}</span>
          </div>
        </div>
        `
    });

    // 加载侧边栏项目列表
    dataLoader.loadList({
        url: CONFIG.apis.projects,
        containerId: CONFIG.containers.projects_sidebar,
        fieldsMap: {
            title: '名称',
            content: '介绍',
            author: '作者',
            size: '体积',
            files: '附件'
        },
        template: fields => `
        <div class="scros-detalmsg-sidebar" id="${stringToHex(fields.title)}scros${stringToHex(fields.author)}">
            <button class="toggle" onclick="toggleproject_sidebar('${stringToHex(fields.title)}scros${stringToHex(fields.author)}');"><</button>
            <h1 class="title" style="font-size: 3rem; color: #fafafa;"> <span class="material-symbols-outlined" style="font-size: 3rem; color: #fafafa;">desktop_windows</span> ${fields.title}</h1>
            <span class="author" style="color: #fafafa;">作者：${fields.author}</span>
        <hr class="hr-sidebar">
            <span class="author" style="color: #fafafa;">介绍：${fields.content}</span>
        <hr class="hr-sidebar">
            <span class="author" style="color: #fafafa;">体积：${fields.size}</span>
        <hr class="hr-sidebar">
        <span style="color: #fafafa;">附件：${fields.files?.map(file =>
            `<br><a href="${file.url}" target="_blank" download="${file.name}" style="color: #fafafa;">${file.name}</a>`
        ).join('') || '无'
            }</span>
        </div>
        `
    });

    // 加载排行榜
    dataLoader.loadRanking({
        url: CONFIG.apis.rankOS,
        containerId: CONFIG.containers.rankOS,
        titleField: '名字',
        authorField: '作者',
        scoreField: '总分'
    });

    dataLoader.loadRanking({
        url: CONFIG.apis.rankUI,
        containerId: CONFIG.containers.rankUI,
        titleField: '名字',
        authorField: '作者',
        scoreField: '总分'
    });
};

// 启动初始化
document.addEventListener('DOMContentLoaded', init);

function toggleproject_sidebar(id) {
    if (document.getElementById(id)) {
        let sidebardownlayer = document.getElementById('sidebardownlayer');
        if (sidebardownlayer.style.backgroundColor === "rgba(0, 0, 0, 0.5)") {
            sidebardownlayer.style.backgroundColor = "rgba(0, 0, 0, 0)";
            sidebardownlayer.style.pointerEvents = "none";
        } else {
            sidebardownlayer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            sidebardownlayer.style.pointerEvents = "auto";
        }
        let sidebar = document.getElementById(id);
        if (sidebar.style.left === "0px") {
            sidebar.style.left = "-360px";
        } else {
            sidebar.style.left = "0px";
        }
    }
}

function togglenews_sidebar(id) {
    if (document.getElementById(id)) {
        let sidebardownlayer = document.getElementById('newssidebardownlayer');
        if (sidebardownlayer.style.backgroundColor === "rgba(0, 0, 0, 0.5)") {
            sidebardownlayer.style.backgroundColor = "rgba(0, 0, 0, 0)";
            sidebardownlayer.style.pointerEvents = "none";
        } else {
            sidebardownlayer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            sidebardownlayer.style.pointerEvents = "auto";
        }
        let sidebar = document.getElementById(id);
        if (sidebar.style.left === "0px") {
            sidebar.style.left = "-360px";
        } else {
            sidebar.style.left = "0px";
        }
    }
}

function stringToHex(str) {
    return Array.from(new TextEncoder().encode(str))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

window.onload = changeto("oslist");

function changeto(id) {
    if (id == 'oslist') {
        let oslist = document.getElementById('oslist');
        let uilist = document.getElementById('uilist');
        oslist.style.left = "0px";
        uilist.style.left = "340px";
        let uibtn = document.getElementById('uibtn');
        uibtn.className = "tab-btn-unactive";
        let osbtn = document.getElementById('osbtn');
        osbtn.className = "tab-btn";

    } else if (id == 'uilist') {
        let oslist = document.getElementById('oslist');
        let uilist = document.getElementById('uilist');
        oslist.style.left = "-340px";
        uilist.style.left = "0px";
        let uibtn = document.getElementById('uibtn');
        uibtn.className = "tab-btn";
        let osbtn = document.getElementById('osbtn');
        osbtn.className = "tab-btn-unactive";
    }
}