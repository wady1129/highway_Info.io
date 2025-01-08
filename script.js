const client_id = "fishcookie1129.mg10-fb26161c-01fe-4ea2";
const client_secret = "cdf83d35-2d18-458b-adda-e367ae8ca9fe";

// 當頁面載入時自動獲取資料
document.addEventListener("DOMContentLoaded", fetchTrafficData);

async function getAuthToken() {
    const url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: client_id,
        client_secret: client_secret
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params
    });

    if (!response.ok) {
        throw new Error("無法取得授權 Token");
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchTrafficData() {
    try {
        const token = await getAuthToken();
        
        const apiUrl = "https://tdx.transportdata.tw/api/advanced/v2/Road/Traffic/Live/CMS/Freeway/RoadName/%E5%9C%8B%E9%81%931%E8%99%9F?%24top=30&%24format=JSON";

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept-Encoding": "br,gzip"
            }
        });

        if (!response.ok) {
            throw new Error("無法獲取高速公路資訊");
        }

        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error("發生錯誤：", error);
        document.getElementById("dataDisplay").innerHTML = `<p class="error">發生錯誤：${error.message}</p>`;
    }
}

function displayData(data) {
    if (!data.CMSLives || !data.CMSLives.length) {
        document.getElementById("dataDisplay").innerHTML = "<p>未找到任何資料。</p>";
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    thead.innerHTML = `
        <tr>
            <th>設備代碼</th>
            <th>業管子機關簡碼</th>
            <th>訊息發布狀態</th>
            <th>循環訊息內容</th>
            <th>設備狀態</th>
            <th>資料蒐集時間</th>
        </tr>
    `;

    data.CMSLives.forEach(cms => {
        const messages = cms.Messages.map(msg => {
            return `
                <div class="message">
                    <p><strong>訊息：</strong>${msg.Text || "無"}</p>
                    <p><strong>圖片：</strong>${msg.Image ? `<img src="${msg.Image}" alt="訊息圖片" width="100">` : "無"}</p>
                    <p><strong>種類：</strong>${getMessageType(msg.Type)}</p>
                    <p><strong>優先順序：</strong>${msg.Priority || "無"}</p>
                </div>
            `;
        }).join("<hr>");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cms.CMSID || "無資料"}</td>
            <td>${cms.SubAuthorityCode || "無資料"}</td>
            <td>${getMessageStatus(cms.MessageStatus)}</td>
            <td>${messages || "無訊息"}</td>
            <td>${getEquipmentStatus(cms.Status)}</td>
            <td>${formatDateTime(cms.DataCollectTime) || "無資料"}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    document.getElementById("dataDisplay").classList.remove("loader");
    document.getElementById("dataDisplay").innerHTML = "";
    document.getElementById("dataDisplay").appendChild(table);
}

function getMessageStatus(status) {
    const statuses = {
        0: "目前無資料顯示",
        1: "目前正執行循環顯示"
    };
    return statuses[status] || "未知狀態";
}

function getEquipmentStatus(status) {
    const statuses = {
        0: "正常",
        1: "通訊異常",
        2: "停用或施工中",
        3: "設備故障"
    };
    return statuses[status] || "未知狀態";
}

function getMessageType(type) {
    const types = {
        1: "旅行時間資訊",
        2: "壅塞資訊",
        3: "事故資訊",
        4: "施工資訊",
        5: "停車資訊",
        6: "政令宣導資訊",
        7: "其他未定義"
    };
    return types[type] || "未知種類";
}

function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    if (isNaN(date)) return dateTimeStr;
    return date.toLocaleString('zh-TW', { hour12: false });
}
