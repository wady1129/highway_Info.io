const client_id = "fishcookie1129.mg10-fb26161c-01fe-4ea2";
const client_secret = "cdf83d35-2d18-458b-adda-e367ae8ca9fe";

// 當頁面載入時自動獲取資料
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = getCurrentPage();
    if (currentPage === "cms.html") {
        fetchCMSDataWrapper();
        // 每5分鐘更新一次
        setInterval(fetchCMSDataWrapper, 300000); // 300,000 毫秒 = 5 分鐘
    } else if (currentPage === "vd.html") {
        fetchVDDataWrapper();
        // 每5分鐘更新一次
        setInterval(fetchVDDataWrapper, 300000); // 300,000 毫秒 = 5 分鐘
    }
});

// 獲取當前頁面名稱
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    return page;
}

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

async function fetchCMSDataWrapper() {
    try {
        const token = await getAuthToken();
        await fetchCMSData(token);
    } catch (error) {
        console.error("發生錯誤：", error);
        // 顯示在 CMS 區域
        const cmsDisplay = document.getElementById("cmsDisplay");
        if (cmsDisplay) {
            cmsDisplay.classList.remove("loader");
            cmsDisplay.innerHTML = `<p class="error">發生錯誤：${error.message}</p>`;
        }
    }
}

async function fetchVDDataWrapper() {
    try {
        const token = await getAuthToken();
        await fetchVDData(token);
    } catch (error) {
        console.error("發生錯誤：", error);
        // 顯示在 VD 區域
        const vdDisplay = document.getElementById("vdDisplay");
        if (vdDisplay) {
            vdDisplay.classList.remove("loader");
            vdDisplay.innerHTML = `<p class="error">發生錯誤：${error.message}</p>`;
        }
    }
}

async function fetchCMSData(token) {
    try {
        const apiUrl = "https://tdx.transportdata.tw/api/advanced/v2/Road/Traffic/Live/CMS/Freeway/RoadName/%E5%9C%8B%E9%81%931%E8%99%9F?%24top=30&%24format=JSON";

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept-Encoding": "br,gzip"
            }
        });

        if (!response.ok) {
            throw new Error("無法獲取 CMS 高速公路資訊");
        }

        const data = await response.json();
        displayCMSData(data);
    } catch (error) {
        console.error("CMS 發生錯誤：", error);
        const cmsDisplay = document.getElementById("cmsDisplay");
        if (cmsDisplay) {
            cmsDisplay.classList.remove("loader");
            cmsDisplay.innerHTML = `<p class="error">發生錯誤：${error.message}</p>`;
        }
    }
}

async function fetchVDData(token) {
    try {
        const apiUrl = "https://tdx.transportdata.tw/api/advanced/v2/Road/Traffic/Live/VD/Freeway/RoadName/%E5%9C%8B%E9%81%931%E8%99%9F?%24top=50&%24format=JSON";

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept-Encoding": "br,gzip"
            }
        });

        if (!response.ok) {
            throw new Error("無法獲取車流偵測資訊");
        }

        const data = await response.json();
        displayVDData(data);
    } catch (error) {
        console.error("VD 發生錯誤：", error);
        const vdDisplay = document.getElementById("vdDisplay");
        if (vdDisplay) {
            vdDisplay.classList.remove("loader");
            vdDisplay.innerHTML = `<p class="error">發生錯誤：${error.message}</p>`;
        }
    }
}

function displayCMSData(data) {
    console.log("CMS Data:", data); // 用於調試

    // 檢查資料結構
    if (!data || typeof data !== "object" || !data.CMSLiveList || !Array.isArray(data.CMSLiveList.CMSLives)) {
        console.warn("API 回傳資料可能不是預期的結構。", data);
        document.getElementById("cmsDisplay").innerHTML = "<p>未找到任何 CMS 資料。</p>";
        return;
    }

    const cmsLives = data.CMSLiveList.CMSLives;
    console.log("CMSLives:", cmsLives); // 用於調試

    if (!cmsLives || cmsLives.length === 0) {
        document.getElementById("cmsDisplay").innerHTML = "<p>未找到任何 CMS 資料。</p>";
        return;
    }

    const cmsCards = document.getElementById("cmsCards");
    cmsCards.innerHTML = ""; // 清空先前的內容

    cmsLives.forEach(cms => {
        console.log("Processing CMS:", cms); // 用於調試

        const card = document.createElement("div");
        card.classList.add("card");

        // 設備代碼
        const title = document.createElement("h3");
        title.textContent = `設備代碼：${cms.CMSID || "無資料"}`;
        card.appendChild(title);

        // 業管子機關簡碼
        const subAuthority = document.createElement("p");
        subAuthority.innerHTML = `<strong>業管子機關簡碼：</strong>${cms.SubAuthorityCode || "無資料"}`;
        card.appendChild(subAuthority);

        // 訊息發布狀態
        const messageStatus = document.createElement("p");
        messageStatus.innerHTML = `<strong>訊息發布狀態：</strong>${getMessageStatus(cms.MessageStatus)}`;
        card.appendChild(messageStatus);

        // 設備狀態
        const status = document.createElement("p");
        status.innerHTML = `<strong>設備狀態：</strong>${getEquipmentStatus(cms.Status)}`;
        card.appendChild(status);

        // 資料蒐集時間
        const dataCollectTime = document.createElement("p");
        dataCollectTime.innerHTML = `<strong>資料蒐集時間：</strong>${formatDateTime(cms.DataCollectTime) || "無資料"}`;
        card.appendChild(dataCollectTime);

        // 循環訊息內容
        const messagesContainer = document.createElement("div");
        messagesContainer.innerHTML = `<strong>循環訊息內容：</strong>`;

        if (cms.Messages && Array.isArray(cms.Messages) && cms.Messages.length > 0) {
            cms.Messages.forEach(msg => {
                console.log("Processing Message:", msg); // 用於調試

                const messageDiv = document.createElement("div");
                messageDiv.classList.add("message");

                const text = document.createElement("p");
                text.innerHTML = `<strong>訊息：</strong>${msg.Text || "無"}`;
                messageDiv.appendChild(text);

                if (msg.Image) {
                    const image = document.createElement("img");
                    image.src = msg.Image;
                    image.alt = "訊息圖片";
                    messageDiv.appendChild(image);
                } else {
                    const noImage = document.createElement("p");
                    noImage.innerHTML = `<strong>圖片：</strong>無`;
                    messageDiv.appendChild(noImage);
                }

                const type = document.createElement("p");
                type.innerHTML = `<strong>種類：</strong>${getMessageType(msg.Type)}`;
                messageDiv.appendChild(type);

                const priority = document.createElement("p");
                priority.innerHTML = `<strong>優先順序：</strong>${msg.Priority || "無"}`;
                messageDiv.appendChild(priority);

                messagesContainer.appendChild(messageDiv);
            });
        } else {
            messagesContainer.innerHTML += "<p>無訊息內容。</p>";
        }

        card.appendChild(messagesContainer);
        cmsCards.appendChild(card);
    });

    // 移除載入動畫
    document.getElementById("cmsDisplay").style.display = "none";
}

function displayVDData(data) {
    console.log("VD Data:", data); // 用於調試

    // 檢查資料結構
    if (!data || typeof data !== "object" || !Array.isArray(data.VDLives)) {
        console.warn("API 回傳資料可能不是預期的結構。", data);
        document.getElementById("vdDisplay").innerHTML = "<p>未找到任何車流偵測資料。</p>";
        return;
    }

    const vdLives = data.VDLives;
    console.log("VDLives:", vdLives); // 用於調試

    if (!vdLives || vdLives.length === 0) {
        document.getElementById("vdDisplay").innerHTML = "<p>未找到任何車流偵測資料。</p>";
        return;
    }

    const vdCards = document.getElementById("vdCards");
    vdCards.innerHTML = ""; // 清空先前的內容

    vdLives.forEach(vd => {
        console.log("Processing VD:", vd); // 用於調試

        const card = document.createElement("div");
        card.classList.add("card");

        // VDID
        const title = document.createElement("h3");
        title.textContent = `VDID：${vd.VDID || "無資料"}`;
        card.appendChild(title);

        // 業管子機關簡碼
        const subAuthority = document.createElement("p");
        subAuthority.innerHTML = `<strong>業管子機關簡碼：</strong>${vd.SubAuthorityCode || "無資料"}`;
        card.appendChild(subAuthority);

        // 設備狀態
        const status = document.createElement("p");
        status.innerHTML = `<strong>設備狀態：</strong>${getEquipmentStatus(vd.Status)}`;
        card.appendChild(status);

        // 資料蒐集時間
        const dataCollectTime = document.createElement("p");
        dataCollectTime.innerHTML = `<strong>資料蒐集時間：</strong>${formatDateTime(vd.DataCollectTime) || "無資料"}`;
        card.appendChild(dataCollectTime);

        // 車流資訊
        const linkFlowsContainer = document.createElement("div");
        linkFlowsContainer.innerHTML = `<strong>車流資訊：</strong>`;

        if (vd.LinkFlows && Array.isArray(vd.LinkFlows) && vd.LinkFlows.length > 0) {
            vd.LinkFlows.forEach(flow => {
                console.log("Processing LinkFlow:", flow); // 用於調試

                const flowDiv = document.createElement("div");
                flowDiv.classList.add("link-flow");

                const linkID = document.createElement("p");
                linkID.innerHTML = `<strong>路段 ID：</strong>${flow.LinkID || "無資料"}`;
                flowDiv.appendChild(linkID);

                // 車道資訊
                const lanesContainer = document.createElement("div");
                lanesContainer.innerHTML = `<strong>車道資訊：</strong>`;

                if (flow.Lanes && Array.isArray(flow.Lanes) && flow.Lanes.length > 0) {
                    flow.Lanes.forEach(lane => {
                        console.log("Processing Lane:", lane); // 用於調試

                        const laneDiv = document.createElement("div");
                        laneDiv.classList.add("lane");

                        const laneID = document.createElement("p");
                        laneID.innerHTML = `<strong>車道 ID：</strong>${lane.LaneID}`;
                        laneDiv.appendChild(laneID);

                        const laneType = document.createElement("p");
                        laneType.innerHTML = `<strong>車道類型：</strong>${getLaneType(lane.LaneType)}`;
                        laneDiv.appendChild(laneType);

                        const speed = document.createElement("p");
                        speed.innerHTML = `<strong>速率：</strong>${lane.Speed} km/h`;
                        laneDiv.appendChild(speed);

                        const occupancy = document.createElement("p");
                        occupancy.innerHTML = `<strong>占有率：</strong>${lane.Occupancy}%`;
                        laneDiv.appendChild(occupancy);

                        // 車輛資訊
                        const vehiclesContainer = document.createElement("div");
                        vehiclesContainer.innerHTML = `<strong>車輛資訊：</strong>`;

                        if (lane.Vehicles && Array.isArray(lane.Vehicles) && lane.Vehicles.length > 0) {
                            lane.Vehicles.forEach(vehicle => {
                                console.log("Processing Vehicle:", vehicle); // 用於調試

                                const vehicleDiv = document.createElement("div");
                                vehicleDiv.classList.add("vehicle");

                                const vehicleType = document.createElement("p");
                                vehicleType.innerHTML = `<strong>車種代碼：</strong>${vehicle.VehicleType}`;
                                vehicleDiv.appendChild(vehicleType);

                                const volume = document.createElement("p");
                                volume.innerHTML = `<strong>流量：</strong>${vehicle.Volume}`;
                                vehicleDiv.appendChild(volume);

                                const avgSpeed = document.createElement("p");
                                avgSpeed.innerHTML = `<strong>平均速率：</strong>${vehicle.Speed} km/h`;
                                vehicleDiv.appendChild(avgSpeed);

                                vehiclesContainer.appendChild(vehicleDiv);
                            });
                        } else {
                            vehiclesContainer.innerHTML += "<p>無車輛資訊。</p>";
                        }

                        laneDiv.appendChild(vehiclesContainer);
                        lanesContainer.appendChild(laneDiv);
                    });
                } else {
                    lanesContainer.innerHTML += "<p>無車道資訊。</p>";
                }

                flowDiv.appendChild(lanesContainer);
                linkFlowsContainer.appendChild(flowDiv);
            });
        } else {
            linkFlowsContainer.innerHTML += "<p>無車流資訊。</p>";
        }

        card.appendChild(linkFlowsContainer);
        vdCards.appendChild(card);
    });

    // 移除載入動畫
    document.getElementById("vdDisplay").style.display = "none";
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

function getLaneType(type) {
    const types = {
        1: "普通車道",
        2: "快車道",
        3: "慢車道",
        4: "機車道",
        5: "高承載車道",
        6: "公車專用道",
        7: "轉向車道",
        8: "路肩",
        9: "輔助車道",
        10: "調撥車道",
        11: "其他"
    };
    return types[type] || "未知類型";
}

function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    if (isNaN(date)) return dateTimeStr;
    return date.toLocaleString('zh-TW', { hour12: false });
}
