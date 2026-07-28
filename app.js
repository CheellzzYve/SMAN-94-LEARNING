// ========================================
// SMAN94 LEARNING - Complete Application
// ========================================

// Database Management
const DB = {
    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    load(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
};

// Initialize Default Data
function initData() {
    // Default Dev Account
    if (!localStorage.getItem('teachers')) {
        DB.save('teachers', [
            {
                email: 'shannurf25@gmail.com',
                password: 'dev123',
                name: 'Developer Utama',
                role: 'dev',
                subject: 'Semua Mapel',
                createdAt: new Date().toISOString()
            }
        ]);
    }

    // Initialize other data
    if (!localStorage.getItem('students')) DB.save('students', []);
    if (!localStorage.getItem('rooms')) DB.save('rooms', []);
    if (!localStorage.getItem('logs')) DB.save('logs', []);
    if (!localStorage.getItem('answers')) DB.save('answers', []);
}

// Global State
let currentUser = null;
let currentRole = null;
let currentPage = '';

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="login-screen">
            <div class="logo">
                <i class="fas fa-graduation-cap"></i>
                <h1>SMAN94 LEARNING</h1>
                <p class="subtitle">Platform Ujian Digital Terintegrasi</p>
            </div>
            <div class="tabs">
                <button class="tab active" onclick="switchTab('student')">👨‍🎓 Siswa</button>
                <button class="tab" onclick="switchTab('teacher')">👨‍🏫 Guru/Dev</button>
            </div>
            <div id="loginForm" class="form-box"></div>
        </div>
    `;
    switchTab('student');
}

function switchTab(type) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab');
    tabs[0].classList.toggle('active', type === 'student');
    tabs[1].classList.toggle('active', type === 'teacher');

    // Render form
    if (type === 'student') {
        document.getElementById('loginForm').innerHTML = `
            <h3><i class="fas fa-user-graduate"></i> Masuk Siswa</h3>
            <input type="text" id="sKelas" placeholder="📚 Kelas (contoh: XII IPA 1)">
            <input type="text" id="sNama" placeholder="👤 Nama Lengkap">
            <input type="text" id="sNomor" placeholder="🔢 Nomor Ujian">
            <input type="text" id="sKode" placeholder="🔑 Kode Akses Ruangan">
            <button onclick="loginSiswa()">
                <i class="fas fa-sign-in-alt"></i> Masuk Ujian
            </button>
            <div id="error" class="error"></div>
        `;
    } else {
        document.getElementById('loginForm').innerHTML = `
            <h3><i class="fas fa-chalkboard-teacher"></i> Masuk Guru/Developer</h3>
            <input type="email" id="tEmail" placeholder="📧 Email">
            <input type="password" id="tPass" placeholder="🔒 Password">
            <button onclick="loginTeacher()">
                <i class="fas fa-sign-in-alt"></i> Masuk
            </button>
            <div id="error" class="error"></div>
        `;
    }
}

// ========================================
// LOGIN FUNCTIONS
// ========================================

function loginSiswa() {
    const kelas = document.getElementById('sKelas').value.trim();
    const nama = document.getElementById('sNama').value.trim();
    const nomor = document.getElementById('sNomor').value.trim();
    const kode = document.getElementById('sKode').value.trim();

    // Validate input
    if (!kelas || !nama || !nomor || !kode) {
        showError('Semua field harus diisi!');
        return;
    }

    const students = DB.load('students');
    const rooms = DB.load('rooms');
    const logs = DB.load('logs');

    // Check student exists
    const student = students.find(s =>
        s.name.toLowerCase() === nama.toLowerCase() &&
        s.class.toLowerCase() === kelas.toLowerCase() &&
        s.examNum === nomor
    );

    if (!student) {
        showError('❌ Data siswa tidak ditemukan! Hubungi guru Anda.');
        return;
    }

    // Check room exists
    const room = rooms.find(r => r.accessCode === kode);
    if (!room) {
        showError('❌ Kode ruangan tidak valid!');
        return;
    }

    // Check if room is active
    if (!room.active) {
        showError('❌ Ruangan ujian sudah ditutup!');
        return;
    }

    // Check if student already in this room
    const alreadyIn = logs.find(l =>
        l.studentName.toLowerCase() === nama.toLowerCase() &&
        l.roomCode === kode &&
        l.status === 'active'
    );

    if (alreadyIn) {
        showError('⚠️ Anda sudah login di perangkat lain!\nSatu siswa hanya boleh menggunakan satu perangkat.');
        return;
    }

    // Generate device ID and IP
    const deviceId = navigator.userAgent.substring(0, 80);
    const ip = '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);

    // Add to logs
    logs.push({
        studentName: nama,
        class: kelas,
        examNum: nomor,
        roomCode: kode,
        roomName: room.name,
        subject: room.subject,
        ip: ip,
        deviceId: deviceId,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active',
        violations: 0
    });
    DB.save('logs', logs);

    // Success message
    alert('✅ Login Berhasil!\n\n' +
          'Selamat mengerjakan ujian.\n\n' +
          '⚠️ PERINGATAN:\n' +
          '- Jangan keluar dari aplikasi\n' +
          '- Jangan membuka tab lain\n' +
          '- Semua aktivitas tercatat\n\n' +
          'Mata Pelajaran: ' + room.subject + '\n' +
          'Ruangan: ' + room.name);

    // Reset form
    switchTab('student');
}

function loginTeacher() {
    const email = document.getElementById('tEmail').value.trim();
    const pass = document.getElementById('tPass').value.trim();

    if (!email || !pass) {
        showError('Email dan password harus diisi!');
        return;
    }

    const teachers = DB.load('teachers');
    const user = teachers.find(t => t.email === email && t.password === pass);

    if (!user) {
        showError('❌ Email atau password salah!');
        return;
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    const updatedTeachers = teachers.map(t =>
        t.email === email ? user : t
    );
    DB.save('teachers', updatedTeachers);

    // Set current user
    currentUser = user;
    currentRole = user.role;

    // Log login
    const logs = DB.load('logs');
    logs.push({
        type: 'login',
        user: email,
        role: user.role,
        time: new Date().toISOString()
    });
    DB.save('logs', logs);

    // Render dashboard
    renderDashboard();
}

function showError(msg) {
    const err = document.getElementById('error');
    if (err) {
        err.textContent = msg;
        err.style.display = 'block';
        setTimeout(() => {
            err.style.display = 'none';
        }, 4000);
    }
}

// ========================================
// DASHBOARD RENDERING
// ========================================

function renderDashboard() {
    document.getElementById('app').innerHTML = `
        <div class="dashboard">
            <div class="sidebar">
                <div class="logo">
                    <i class="fas fa-graduation-cap"></i>
                    <h2>SMAN94 LEARNING</h2>
                    <span class="badge ${currentRole === 'dev' ? 'badge-dev' : 'badge-guru'}">
                        ${currentRole === 'dev' ? 'DEVELOPER' : 'GURU'}
                    </span>
                </div>
                <ul class="menu" id="menuList"></ul>
                <button class="logout" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Keluar
                </button>
            </div>
            <div class="main" id="mainContent"></div>
        </div>
    `;

    // Render menu based on role
    renderMenu();

    // Show default page
    if (currentRole === 'dev') {
        showPage('overview');
    } else {
        showPage('myRooms');
    }
}

function renderMenu() {
    const menu = document.getElementById('menuList');

    if (currentRole === 'dev') {
        menu.innerHTML = `
            <li onclick="showPage('overview')" class="active">
                <i class="fas fa-tachometer-alt"></i> Overview
            </li>
            <li onclick="showPage('teachers')">
                <i class="fas fa-user-tie"></i> Manajemen Guru
            </li>
            <li onclick="showPage('students')">
                <i class="fas fa-user-graduate"></i> Manajemen Siswa
            </li>
            <li onclick="showPage('rooms')">
                <i class="fas fa-door-open"></i> Ruang Ujian
            </li>
            <li onclick="showPage('logs')">
                <i class="fas fa-history"></i> Logs Sistem
            </li>
        `;
    } else {
        menu.innerHTML = `
            <li onclick="showPage('myRooms')" class="active">
                <i class="fas fa-door-open"></i> Ruang Saya
            </li>
            <li onclick="showPage('createRoom')">
                <i class="fas fa-plus-circle"></i> Buat Ruang
            </li>
            <li onclick="showPage('monitoring')">
                <i class="fas fa-desktop"></i> Monitoring
            </li>
            <li onclick="showPage('results')">
                <i class="fas fa-clipboard-check"></i> Hasil Ujian
            </li>
        `;
    }
}

// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(page) {
    currentPage = page;

    // Update menu active state
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    const menuItems = document.querySelectorAll('.menu li');
    const pageIndex = {
        'overview': 0, 'teachers': 1, 'students': 2, 'rooms': 3, 'logs': 4,
        'myRooms': 0, 'createRoom': 1, 'monitoring': 2, 'results': 3
    };

    if (menuItems[pageIndex[page]]) {
        menuItems[pageIndex[page]].classList.add('active');
    }

    const main = document.getElementById('mainContent');
    const teachers = DB.load('teachers');
    const students = DB.load('students');
    const rooms = DB.load('rooms');
    const logs = DB.load('logs');
    const answers = DB.load('answers');

    switch(page) {
        case 'overview':
            renderOverview(main, teachers, students, rooms, logs);
            break;
        case 'teachers':
            renderTeachers(main, teachers);
            break;
        case 'students':
            renderStudents(main, students);
            break;
        case 'rooms':
            renderRooms(main, rooms);
            break;
        case 'logs':
            renderLogs(main, logs);
            break;
        case 'myRooms':
            renderMyRooms(main, rooms);
            break;
        case 'createRoom':
            renderCreateRoom(main);
            break;
        case 'monitoring':
            renderMonitoring(main, rooms);
            break;
        case 'results':
            renderResults(main, rooms);
            break;
    }
}

// ========================================
// DEV PAGES
// ========================================

function renderOverview(main, teachers, students, rooms, logs) {
    const activeRooms = rooms.filter(r => r.active).length;
    const todayViolations = logs.filter(l => l.violations > 0).length;

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-tachometer-alt"></i> Developer Dashboard
        </h1>
        <p style="color:#666;margin-bottom:30px;">Selamat datang, ${currentUser.name}</p>

        <div class="stats">
            <div class="stat-card">
                <i class="fas fa-chalkboard-teacher" style="color:#1a73e8"></i>
                <h3>Total Guru</h3>
                <p>${teachers.filter(t => t.role === 'guru').length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-user-graduate" style="color:#34a853"></i>
                <h3>Total Siswa</h3>
                <p>${students.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-door-open" style="color:#fbbc04"></i>
                <h3>Ruang Aktif</h3>
                <p>${activeRooms}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle" style="color:#ea4335"></i>
                <h3>Pelanggaran</h3>
                <p>${todayViolations}</p>
            </div>
        </div>

        <div class="card">
            <h3><i class="fas fa-info-circle"></i> Informasi Sistem</h3>
            <p>📧 Email Developer: shannurf25@gmail.com</p>
            <p>👨‍🏫 Total Guru Terdaftar: ${teachers.filter(t => t.role === 'guru').length}</p>
            <p>👨‍🎓 Total Siswa Terdaftar: ${students.length}</p>
            <p>🚪 Total Ruangan: ${rooms.length}</p>
            <p>📝 Total Logs: ${logs.length}</p>
        </div>
    `;
}

function renderTeachers(main, teachers) {
    const guruList = teachers.filter(t => t.role === 'guru');

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-user-tie"></i> Manajemen Guru
        </h1>

        <button class="btn btn-blue" onclick="showAddTeacherModal()" style="margin-bottom:20px;">
            <i class="fas fa-plus"></i> Tambah Guru Baru
        </button>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nama</th>
                        <th>Password</th>
                        <th>Status</th>
                        <th>Terakhir Login</th>
                    </tr>
                </thead>
                <tbody>
                    ${guruList.length === 0 ?
                        '<tr><td colspan="5" style="text-align:center;padding:30px;">Belum ada guru terdaftar</td></tr>' :
                        guruList.map(t => `
                            <tr>
                                <td>📧 ${t.email}</td>
                                <td>${t.name}</td>
                                <td><code>${t.password}</code></td>
                                <td><span class="badge badge-guru">Aktif</span></td>
                                <td>${t.lastLogin ? new Date(t.lastLogin).toLocaleString('id-ID') : '-'}</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
}

function renderStudents(main, students) {
    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-user-graduate"></i> Manajemen Siswa
        </h1>

        <div style="display:flex;gap:10px;margin-bottom:20px;">
            <button class="btn btn-blue" onclick="showUploadStudentsModal()">
                <i class="fas fa-upload"></i> Upload Data Siswa
            </button>
            <button class="btn btn-green" onclick="downloadTemplate()">
                <i class="fas fa-download"></i> Download Template
            </button>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Siswa</th>
                        <th>Kelas</th>
                        <th>Nomor Ujian</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.length === 0 ?
                        '<tr><td colspan="5" style="text-align:center;padding:30px;">Belum ada data siswa</td></tr>' :
                        students.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.name}</td>
                                <td>${s.class}</td>
                                <td><code>${s.examNum}</code></td>
                                <td>✅ Aktif</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
}

function renderRooms(main, rooms) {
    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-door-open"></i> Semua Ruang Ujian
        </h1>

        <div class="room-grid">
            ${rooms.length === 0 ?
                '<p style="color:#666;">Belum ada ruangan dibuat</p>' :
                rooms.map(r => `
                    <div class="room-card">
                        <h3>🚪 ${r.name}</h3>
                        <p><strong>Mata Pelajaran:</strong> ${r.subject}</p>
                        <p><strong>Guru:</strong> ${r.teacherName}</p>
                        <p><strong>Tanggal:</strong> ${r.date}</p>
                        <p><strong>Waktu:</strong> ${r.startTime} - ${r.endTime}</p>
                        <p><strong>Kode Akses:</strong> <code style="background:#e3f2fd;padding:3px 8px;border-radius:4px;">${r.accessCode}</code></p>
                        <p><strong>Status:</strong> ${r.active ? '🟢 Aktif' : '🔴 Nonaktif'}</p>
                    </div>
                `).join('')
            }
        </div>
    `;
}

function renderLogs(main, logs) {
    const recentLogs = logs.slice(-50).reverse();

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-history"></i> Logs Sistem
        </h1>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Siswa</th>
                        <th>Ruangan</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Pelanggaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentLogs.filter(l => l.studentName).map(l => `
                        <tr>
                            <td>${new Date(l.loginTime).toLocaleString('id-ID')}</td>
                            <td>${l.studentName}</td>
                            <td>${l.roomName}</td>
                            <td><code>${l.ip}</code></td>
                            <td>${l.status === 'active' ?
                                '<span style="color:green;">✅ Aktif</span>' :
                                '<span style="color:red;">❌ Keluar</span>'}
                            </td>
                            <td>${l.violations} kali</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========================================
// TEACHER PAGES
// ========================================

function renderMyRooms(main, rooms) {
    const myRooms = rooms.filter(r => r.teacherEmail === currentUser.email);

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-door-open"></i> Ruang Ujian Saya
        </h1>

        <div class="room-grid">
            ${myRooms.length === 0 ?
                '<p style="color:#666;grid-column:1/-1;">Anda belum membuat ruangan. Silakan buat ruangan baru.</p>' :
                myRooms.map(r => `
                    <div class="room-card">
                        <h3>🚪 ${r.name}</h3>
                        <p><strong>Mata Pelajaran:</strong> ${r.subject}</p>
                        <p><strong>Tanggal:</strong> ${r.date}</p>
                        <p><strong>Waktu:</strong> ${r.startTime} - ${r.endTime}</p>
                        <p><strong>Kode Akses:</strong> <code style="background:#e3f2fd;padding:3px 8px;border-radius:4px;">${r.accessCode}</code></p>
                        <p><strong>Status:</strong> ${r.active ? '🟢 Aktif' : '🔴 Nonaktif'}</p>
                        <div style="margin-top:15px;display:flex;gap:5px;flex-wrap:wrap;">
                            <button class="btn btn-blue btn-sm" onclick="viewRoomLogs('${r.code}')">
                                <i class="fas fa-list"></i> Logs
                            </button>
                            <button class="btn btn-green btn-sm" onclick="viewRoomStudents('${r.code}')">
                                <i class="fas fa-users"></i> Siswa
                            </button>
                            <button class="btn btn-orange btn-sm" onclick="viewRoomResults('${r.code}')">
                                <i class="fas fa-clipboard-check"></i> Hasil
                            </button>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
}

function renderCreateRoom(main) {
    const code = 'SMAN94-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-plus-circle"></i> Buat Ruang Ujian Baru
        </h1>

        <div class="card">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <div>
                    <label>Nama Ruangan *</label>
                    <input type="text" id="rName" placeholder="Contoh: Ruang Ujian Matematika">
                </div>
                <div>
                    <label>Mata Pelajaran *</label>
                    <input type="text" id="rSubject" placeholder="Contoh: Matematika">
                </div>
                <div>
                    <label>Tanggal Ujian *</label>
                    <input type="date" id="rDate">
                </div>
                <div>
                    <label>Waktu Mulai *</label>
                    <input type="time" id="rStart">
                </div>
                <div>
                    <label>Waktu Selesai *</label>
                    <input type="time" id="rEnd">
                </div>
                <div>
                    <label>Kode Akses</label>
                    <div style="display:flex;gap:10px;">
                        <input type="text" id="rCode" value="${code}" readonly>
                        <button class="btn btn-blue btn-sm" onclick="generateNewCode()">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                </div>
            </div>
            <button class="btn btn-green" onclick="createRoom()" style="margin-top:20px;width:100%;padding:12px;">
                <i class="fas fa-check"></i> Buat Ruangan
            </button>
        </div>
    `;
}

function generateNewCode() {
    const code = 'SMAN94-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('rCode').value = code;
}

function createRoom() {
    const name = document.getElementById('rName').value.trim();
    const subject = document.getElementById('rSubject').value.trim();
    const date = document.getElementById('rDate').value;
    const startTime = document.getElementById('rStart').value;
    const endTime = document.getElementById('rEnd').value;
    const accessCode = document.getElementById('rCode').value.trim();

    if (!name || !subject || !date || !startTime || !endTime) {
        alert('❌ Semua field harus diisi!');
        return;
    }

    const rooms = DB.load('rooms');
    rooms.push({
        code: Date.now().toString(),
        name: name,
        subject: subject,
        date: date,
        startTime: startTime,
        endTime: endTime,
        accessCode: accessCode,
        teacherEmail: currentUser.email,
        teacherName: currentUser.name,
        active: true,
        createdAt: new Date().toISOString()
    });

    DB.save('rooms', rooms);
    alert('✅ Ruangan berhasil dibuat!\n\nKode Akses: ' + accessCode);
    showPage('myRooms');
}

function renderMonitoring(main, rooms) {
    const myRooms = rooms.filter(r => r.teacherEmail === currentUser.email);

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-desktop"></i> Monitoring Ujian
        </h1>

        <div class="card">
            <label>Pilih Ruangan:</label>
            <select id="monitorRoom" onchange="showMonitoringData()">
                <option value="">-- Pilih Ruangan --</option>
                ${myRooms.map(r => `<option value="${r.code}">${r.name} - ${r.subject}</option>`).join('')}
            </select>
        </div>

        <div id="monitoringData"></div>
    `;
}

function showMonitoringData() {
    const roomCode = document.getElementById('monitorRoom').value;
    if (!roomCode) {
        document.getElementById('monitoringData').innerHTML = '';
        return;
    }

    const logs = DB.load('logs').filter(l => l.roomCode === roomCode);
    const activeCount = logs.filter(l => l.status === 'active').length;

    document.getElementById('monitoringData').innerHTML = `
        <div class="card">
            <h3>Status Ruangan: ${activeCount} siswa aktif</h3>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Siswa</th>
                        <th>Kelas</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Pelanggaran</th>
                        <th>Waktu Masuk</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(l => `
                        <tr>
                            <td>${l.studentName}</td>
                            <td>${l.class}</td>
                            <td><code>${l.ip}</code></td>
                            <td>${l.status === 'active' ?
                                '<span style="color:green;">✅ Sedang Mengerjakan</span>' :
                                '<span style="color:red;">❌ Keluar</span>'}
                            </td>
                            <td>${l.violations} kali</td>
                            <td>${new Date(l.loginTime).toLocaleString('id-ID')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderResults(main, rooms) {
    const myRooms = rooms.filter(r => r.teacherEmail === currentUser.email);

    main.innerHTML = `
        <h1 class="page-title">
            <i class="fas fa-clipboard-check"></i> Hasil Ujian
        </h1>

        <div class="card">
            <label>Pilih Ruangan:</label>
            <select id="resultRoom" onchange="showResultData()">
                <option value="">-- Pilih Ruangan --</option>
                ${myRooms.map(r => `<option value="${r.code}">${r.name} - ${r.subject}</option>`).join('')}
            </select>
        </div>

        <div id="resultData"></div>
    `;
}

function showResultData() {
    const roomCode = document.getElementById('resultRoom').value;
    if (!roomCode) {
        document.getElementById('resultData').innerHTML = '';
        return;
    }

    const logs = DB.load('logs').filter(l => l.roomCode === roomCode);
    const answers = DB.load('answers').filter(a => a.roomCode === roomCode);
    const room = DB.load('rooms').find(r => r.code === roomCode);

    document.getElementById('resultData').innerHTML = `
        <div class="card">
            <h3>📊 Daftar Siswa & Hasil Ujian</h3>
            <p><strong>Ruangan:</strong> ${room ? room.name : ''}</p>
            <p><strong>Mata Pelajaran:</strong> ${room ? room.subject : ''}</p>
            <p><strong>Total Siswa:</strong> ${logs.length}</p>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Siswa</th>
                        <th>Kelas</th>
                        <th>Status</th>
                        <th>Nilai</th>
                        <th>Pelanggaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map((l, i) => {
                        const ans = answers.find(a => a.studentName === l.studentName);
                        return `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${l.studentName}</td>
                                <td>${l.class}</td>
                                <td>${l.status === 'active' ? '🟡 Mengerjakan' : '🟢 Selesai'}</td>
                                <td>${ans ? ans.score : '-'}</td>
                                <td>${l.violations} kali</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <button class="btn btn-blue" onclick="sendResultsByEmail('${roomCode}')" style="margin-top:15px;">
                <i class="fas fa-envelope"></i> Kirim Hasil ke Email
            </button>
        </div>
    `;
}

// ========================================
// MODAL FUNCTIONS
// ========================================

function showAddTeacherModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box">
            <span class="close-btn" onclick="closeModal()">&times;</span>
            <h2>Tambah Guru Baru</h2>
            <label>Email Guru *</label>
            <input type="email" id="newTeacherEmail" placeholder="contoh: guru@sekolah.sch.id">
            <label>Nama Lengkap *</label>
            <input type="text" id="newTeacherName" placeholder="Nama lengkap guru">
            <label>Password</label>
            <div style="display:flex;gap:10px;">
                <input type="text" id="newTeacherPass" readonly style="flex:1;">
                <button class="btn btn-blue btn-sm" onclick="generateTeacherPassword()">
                    <i class="fas fa-sync"></i> Generate
                </button>
            </div>
            <div class="btn-row">
                <button class="btn btn-red" onclick="closeModal()">Batal</button>
                <button class="btn btn-green" onclick="addTeacher()">
                    <i class="fas fa-check"></i> Simpan
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    generateTeacherPassword();
}

function generateTeacherPassword() {
    const pass = 'guru' + Math.random().toString(36).substring(2, 8);
    const input = document.getElementById('newTeacherPass');
    if (input) input.value = pass;
}

function addTeacher() {
    const email = document.getElementById('newTeacherEmail').value.trim();
    const name = document.getElementById('newTeacherName').value.trim();
    const password = document.getElementById('newTeacherPass').value.trim();

    if (!email || !name) {
        alert('❌ Email dan nama harus diisi!');
        return;
    }

    const teachers = DB.load('teachers');

    // Check duplicate
    if (teachers.find(t => t.email === email)) {
        alert('❌ Email sudah terdaftar!');
        return;
    }

    teachers.push({
        email: email,
        password: password,
        name: name,
        role: 'guru',
        subject: '-',
        createdAt: new Date().toISOString()
    });

    DB.save('teachers', teachers);
    closeModal();
    alert(`✅ Guru berhasil ditambahkan!\n\nEmail: ${email}\nPassword: ${password}`);
    showPage('teachers');
}

function showUploadStudentsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:600px;">
            <span class="close-btn" onclick="closeModal()">&times;</span>
            <h2>Upload Data Siswa</h2>
            <p style="color:#666;margin-bottom:15px;">
                Format: Nama,Kelas,NomorUjian<br>
                (Satu siswa per baris)
            </p>
            <textarea id="studentData" rows="12" placeholder="Contoh:&#10;Ahmad Fauzi,XII IPA 1,2024001&#10;Siti Nurhaliza,XII IPA 2,2024002&#10;Budi Santoso,XII IPS 1,2024003"></textarea>
            <p style="color:#666;margin-top:10px;">
                <button class="btn btn-blue btn-sm" onclick="pasteExample()">
                    <i class="fas fa-paste"></i> Contoh Data
                </button>
            </p>
            <div class="btn-row">
                <button class="btn btn-red" onclick="closeModal()">Batal</button>
                <button class="btn btn-green" onclick="uploadStudents()">
                    <i class="fas fa-upload"></i> Upload
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function pasteExample() {
    const textarea = document.getElementById('studentData');
    if (textarea) {
        textarea.value = 'Ahmad Fauzi,XII IPA 1,2024001\nSiti Nurhaliza,XII IPA 2,2024002\nBudi Santoso,XII IPS 1,2024003\nDewi Lestari,XII IPA 1,2024004\nEko Prasetyo,XII IPS 2,2024005';
    }
}

function uploadStudents() {
    const data = document.getElementById('studentData').value;
    const lines = data.split('\n').filter(l => l.trim());
    const students = DB.load('students');
    let addedCount = 0;

    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length === 3) {
            const [name, cls, examNum] = parts.map(p => p.trim());
            if (name && cls && examNum) {
                // Check duplicate
                const exists = students.find(s =>
                    s.name === name && s.class === cls && s.examNum === examNum
                );
                if (!exists) {
                    students.push({ name, class: cls, examNum });
                    addedCount++;
                }
            }
        }
    });

    DB.save('students', students);
    closeModal();
    alert(`✅ ${addedCount} siswa berhasil ditambahkan!`);
    showPage('students');
}

function downloadTemplate() {
    const template = 'Nama,Kelas,NomorUjian\nAhmad Fauzi,XII IPA 1,2024001\nSiti Nurhaliza,XII IPA 2,2024002\nBudi Santoso,XII IPS 1,2024003';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa_sman94.csv';
    a.click();
    alert('✅ Template berhasil didownload!');
}

// ========================================
// VIEW FUNCTIONS
// ========================================

function viewRoomLogs(roomCode) {
    const logs = DB.load('logs').filter(l => l.roomCode === roomCode);
    const room = DB.load('rooms').find(r => r.code === roomCode);

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:800px;">
            <span class="close-btn" onclick="closeModal()">&times;</span>
            <h2>📋 Logs Ruangan: ${room ? room.name : ''}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Siswa</th>
                        <th>IP</th>
                        <th>Status</th>
                        <th>Pelanggaran</th>
                        <th>Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length === 0 ?
                        '<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>' :
                        logs.map(l => `
                            <tr>
                                <td>${l.studentName}</td>
                                <td><code>${l.ip}</code></td>
                                <td>${l.status === 'active' ? '✅ Aktif' : '❌ Keluar'}</td>
                                <td>${l.violations}</td>
                                <td>${new Date(l.loginTime).toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
    document.body.appendChild(modal);
}

function viewRoomStudents(roomCode) {
    const logs = DB.load('logs').filter(l => l.roomCode === roomCode);
    const room = DB.load('rooms').find(r => r.code === roomCode);

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:800px;">
            <span class="close-btn" onclick="closeModal()">&times;</span>
            <h2>👨‍🎓 Daftar Siswa: ${room ? room.name : ''}</h2>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Nomor Ujian</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length === 0 ?
                        '<tr><td colspan="5" style="text-align:center;">Belum ada siswa</td></tr>' :
                        logs.map((l, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${l.studentName}</td>
                                <td>${l.class}</td>
                                <td>${l.examNum}</td>
                                <td>${l.status === 'active' ? '🟡 Sedang Ujian' : '🟢 Selesai'}</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
    document.body.appendChild(modal);
}

function viewRoomResults(roomCode) {
    const logs = DB.load('logs').filter(l => l.roomCode === roomCode);
    const answers = DB.load('answers').filter(a => a.roomCode === roomCode);
    const room = DB.load('rooms').find(r => r.code === roomCode);

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:800px;">
            <span class="close-btn" onclick="closeModal()">&times;</span>
            <h2>📊 Hasil Ujian: ${room ? room.name : ''}</h2>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Nilai</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length === 0 ?
                        '<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>' :
                        logs.map((l, i) => {
                            const ans = answers.find(a => a.studentName === l.studentName);
                            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${l.studentName}</td>
                                    <td>${l.class}</td>
                                    <td>${ans ? ans.score : '-'}</td>
                                    <td>${l.status === 'active' ? '🟡 Mengerjakan' : '🟢 Selesai'}</td>
                                </tr>
                            `;
                        }).join('')
                    }
                </tbody>
            </table>
            <button class="btn btn-blue" onclick="sendResultsByEmail('${roomCode}')" style="margin-top:15px;">
                <i class="fas fa-envelope"></i> Kirim Semua Hasil ke Email
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function sendResultsByEmail(roomCode) {
    const email = prompt('📧 Masukkan email tujuan:');
    if (email) {
        alert(`✅ Data hasil ujian akan dikirim ke ${email}\n\n(Catatan: Fitur pengiriman email memerlukan backend server. Saat ini menggunakan simulasi.)`);
        closeModal();
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.remove());
}

// ========================================
// LOGOUT
// ========================================

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        currentUser = null;
        currentRole = null;
        renderLogin();
    }
}

// ========================================
// CLOSE MODAL ON OUTSIDE CLICK
// ========================================

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// ========================================
// INITIALIZE APP
// ========================================

function init() {
    initData();
    renderLogin();
}

// Start the app
init();
