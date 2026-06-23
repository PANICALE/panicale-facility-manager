// ============================================================
// Supabase 연결 설정 — 여기 두 줄만 본인 프로젝트 값으로 바꾸세요
// (Supabase 대시보드 > Project Settings > Data API 에서 확인)
// ============================================================
const SUPABASE_URL = "https://xhgudsxtlvkzbnwyoazx.supabase.co";       // 예: https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ3Vkc3h0bHZremJud3lvYXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxODU1NDYsImV4cCI6MjA5Nzc2MTU0Nn0.bv-_sCTq7MhiZiJHb5H4eWfxUSTR1NtkifZNOxtav18";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------
// 로그인 체크 — 로그인 안 되어있으면 로그인 페이지로 보냄
// (dashboard.html, equipment.html 등 보호된 페이지 맨 위에서 호출)
// ------------------------------------------------------------
async function requireAuth() {
    const { data } = await sb.auth.getSession();
    if (!data.session) {
        window.location.href = "index.html";
        return null;
    }
    return data.session;
}

async function logout() {
    await sb.auth.signOut();
    window.location.href = "index.html";
}

// ------------------------------------------------------------
// 날짜 유틸
// ------------------------------------------------------------
function todayStr() {
    // 한국시간 기준 오늘 날짜 (YYYY-MM-DD)
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

// 토/일만 건너뜀 (공휴일까지 자동 계산하는 라이브러리는 JS 쪽에 마땅한 게 없어서
// 일단 주말만 처리. 공휴일은 next_due_note에 직접 메모해서 쓰는 걸 추천)
function nextBusinessDay(dateStr) {
    let d = new Date(dateStr + "T00:00:00Z");
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return d.toISOString().slice(0, 10);
}

function daysBetween(fromStr, toStr) {
    const a = new Date(fromStr + "T00:00:00Z");
    const b = new Date(toStr + "T00:00:00Z");
    return Math.round((b - a) / 86400000);
}

// 점검항목 + 최근 점검기록으로 due 상태 계산
function computeDueStatus(item, lastRecord) {
    if (!lastRecord) {
        return { lastChecked: null, nextDue: null, dueState: "NEVER", daysOverdue: null };
    }
    const lastDate = lastRecord.checked_at.slice(0, 10);
    let nextDue = addDays(lastDate, item.period_days);
    nextDue = nextBusinessDay(nextDue);
    const today = todayStr();

    let dueState, daysOverdue = null;
    if (nextDue < today) {
        dueState = "OVERDUE";
        daysOverdue = daysBetween(nextDue, today);
    } else if (nextDue === today) {
        dueState = "TODAY";
    } else {
        dueState = "OK";
    }
    return { lastChecked: lastDate, nextDue, dueState, daysOverdue };
}

function badgeHtml(dueState, daysOverdue, nextDueNote) {
    if (nextDueNote) return `<span class="badge">메모</span>`;
    if (dueState === "OVERDUE") return `<span class="badge badge-danger">${daysOverdue}일 경과</span>`;
    if (dueState === "TODAY") return `<span class="badge badge-warning">오늘점검</span>`;
    if (dueState === "OK") return `<span class="badge badge-ok">정상</span>`;
    return `<span class="badge">미점검</span>`;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
