function renderNavbar(activePage) {
    const nav = document.createElement("nav");
    nav.className = "navbar";
    nav.innerHTML = `
        <div class="nav-brand"><a href="dashboard.html">🏭 PANICALE 시설관리</a></div>
        <div class="nav-links">
            <a href="dashboard.html">대시보드</a>
            <a href="equipment.html">설비</a>
            <a href="issues.html">이슈</a>
            <a href="vendors.html">관리업체</a>
        </div>
        <div class="nav-user"><span id="navUserEmail"></span> · <a id="logoutLink">로그아웃</a></div>
    `;
    document.body.insertBefore(nav, document.body.firstChild);
    document.getElementById("logoutLink").addEventListener("click", logout);

    sb.auth.getSession().then(({ data }) => {
        if (data.session) {
            document.getElementById("navUserEmail").textContent = data.session.user.email;
        }
    });
}
