// ── app.js — UI rendering & event handling ───────────────────

// ── State ─────────────────────────────────────────────────────
let currentCourseId = null;
let activeLessonData = null;
let activeQuizQuestions = [];
let userAnswers = {};
let quizSubmitted = false;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refreshSidebarXP();
  refreshStreak();
  navigateTo('home');

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Setup tabs
  document.querySelectorAll('.setup-tab').forEach(t => {
    t.addEventListener('click', () => switchSetupTab(t.dataset.tab));
  });

  // Fetch playlist button
  document.getElementById('btn-fetch-playlist')
    .addEventListener('click', handleFetchPlaylist);

  // Build course from URL
  document.getElementById('btn-build-url')
    .addEventListener('click', handleBuildFromUrl);

  // Build course from manual
  document.getElementById('btn-add-video')
    .addEventListener('click', addManualVideoRow);
  document.getElementById('btn-build-manual')
    .addEventListener('click', handleBuildManual);

  // Modal close
  document.getElementById('modal-overlay')
    .addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  document.getElementById('btn-modal-close')
    .addEventListener('click', closeModal);

  document.getElementById('btn-mark-watched')
    .addEventListener('click', markWatched);

  document.getElementById('btn-start-quiz')
    .addEventListener('click', startQuiz);

  document.getElementById('btn-submit-quiz')
    .addEventListener('click', submitQuiz);
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');

  document.getElementById('topbar-title').textContent =
    { home: 'My Courses', new: 'New Course', badges: 'Achievements' }[page] || 'Course';

  if (page === 'home') renderCourseList();
  if (page === 'badges') renderBadgesPage();
  if (page === 'course') renderCourseView();
}

// ── Sidebar XP ────────────────────────────────────────────────
function refreshSidebarXP() {
  const stats = Storage.getStats();
  const xpPerLevel = 500;
  const xp = stats.totalXP % xpPerLevel;
  const level = Math.floor(stats.totalXP / xpPerLevel) + 1;
  document.getElementById('xp-current').textContent = `${stats.totalXP} XP · Lv ${level}`;
  document.getElementById('xp-bar-fill').style.width = `${(xp / xpPerLevel) * 100}%`;
}

function refreshStreak() {
  const stats = Storage.getStats();
  document.getElementById('streak-count').textContent = `${stats.streak} day streak`;
}

// ── Home / course list ────────────────────────────────────────
function renderCourseList() {
  const courses = Storage.getCourses();
  const el = document.getElementById('course-list');
  if (!courses.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No courses yet</h3>
        <p>Turn any YouTube playlist into a structured course with AI quizzes and deadlines.</p>
        <button class="btn btn-primary" onclick="navigateTo('new')">Create your first course</button>
      </div>`;
    return;
  }

  el.innerHTML = courses.map(course => {
    const progress = Storage.getCourseProgress(course.id);
    const completed = Object.values(progress).filter(p => p.watched).length;
    const total = course.lessons.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    return `
      <div class="lesson-card" onclick="openCourse('${course.id}')" style="cursor:pointer">
        <div class="lesson-num" style="width:44px;height:44px;font-size:16px">${pct}%</div>
        <div class="lesson-info">
          <div class="lesson-title">${escHtml(course.title)}</div>
          <div class="lesson-meta">
            <span>📹 ${total} lessons</span>
            <span>✅ ${completed} done</span>
            <span style="color:var(--muted)">Started ${new Date(course.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="lesson-actions">
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();deleteCourse('${course.id}')">Delete</button>
          <button class="btn btn-sm btn-primary">Open →</button>
        </div>
      </div>`;
  }).join('');
}

function openCourse(id) {
  currentCourseId = id;
  navigateTo('course');
}

function deleteCourse(id) {
  if (!confirm('Delete this course? Progress will be lost.')) return;
  Storage.deleteCourse(id);
  renderCourseList();
  showToast('Course deleted', 'warning');
}

// ── Course view ───────────────────────────────────────────────
function renderCourseView() {
  if (!currentCourseId) { navigateTo('home'); return; }
  const course = Storage.getCourseById(currentCourseId);
  if (!course) { navigateTo('home'); return; }

  const progress = Storage.getCourseProgress(currentCourseId);
  const stats    = Storage.getStats();
  const completed = Object.values(progress).filter(p => p.watched).length;
  const total     = course.lessons.length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  // Stats row
  const quizzesPassed = Object.values(progress).filter(p => p.quizPassed).length;
  document.getElementById('stat-lessons').textContent  = `${completed}/${total}`;
  document.getElementById('stat-quizzes').textContent  = quizzesPassed;
  document.getElementById('stat-xp').textContent       = stats.totalXP;
  document.getElementById('stat-streak').textContent   = stats.streak;

  // Header
  document.getElementById('course-view-title').textContent = course.title;
  document.getElementById('course-lesson-count').textContent = `${total} lessons`;

  // SVG ring
  const r = 40, circ = 2 * Math.PI * r;
  document.getElementById('ring-circle').setAttribute('stroke-dasharray',
    `${(pct / 100) * circ} ${circ}`);
  document.getElementById('ring-pct').textContent = pct + '%';

  // Lessons list
  const listEl = document.getElementById('lessons-list');
  listEl.innerHTML = course.lessons.map((lesson, i) => {
    const prog       = progress[i] || {};
    const isCompleted = !!prog.watched;
    const dl         = CourseBuilder.deadlineStatus(lesson, isCompleted);
    const isActive   = i === completed && !isCompleted;
    const isLocked   = i > completed;

    let cls = 'lesson-card';
    if (isCompleted) cls += ' completed';
    else if (isActive) cls += ' active-lesson';
    else if (isLocked) cls += ' locked';

    const quizBadge = isCompleted && prog.quizPassed
      ? `<span class="deadline-tag done">Quiz ✓ ${prog.quizScore ?? ''}%</span>`
      : (isCompleted ? `<span class="deadline-tag soon">Quiz pending</span>` : '');

    return `
      <div class="${cls}" onclick="${isLocked ? '' : `openLesson(${i})`}">
        <div class="lesson-num">${isCompleted ? '✓' : i + 1}</div>
        <div class="lesson-info">
          <div class="lesson-title">${escHtml(lesson.title)}</div>
          <div class="lesson-meta">
            <span class="deadline-tag ${dl.cls}">${dl.label}</span>
            ${quizBadge}
            ${isLocked ? '<span style="color:var(--muted);font-size:11px">🔒 Complete previous lesson first</span>' : ''}
          </div>
        </div>
        <div class="lesson-actions">
          ${!isLocked ? `<button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openLesson(${i})">
            ${isCompleted ? 'Review' : 'Start'}
          </button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Lesson modal ──────────────────────────────────────────────
function openLesson(index) {
  const course = Storage.getCourseById(currentCourseId);
  if (!course) return;
  const lesson = course.lessons[index];
  activeLessonData = { lesson, index };
  activeQuizQuestions = [];
  userAnswers = {};
  quizSubmitted = false;

  const prog = Storage.getCourseProgress(currentCourseId)[index] || {};

  document.getElementById('modal-lesson-title').textContent = lesson.title;
  document.getElementById('lesson-number-badge').textContent = `Lesson ${index + 1}`;

  document.getElementById('video-frame').src =
    `https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1`;

  // watched button
  const watchBtn = document.getElementById('btn-mark-watched');
  watchBtn.textContent = prog.watched ? '✓ Watched' : 'Mark as Watched';
  watchBtn.disabled = !!prog.watched;

  // quiz area
  const quizArea = document.getElementById('quiz-area');
  if (prog.quizPassed || (prog.watched && prog.quizScore !== undefined)) {
    quizArea.innerHTML = renderQuizResult(prog.quizScore, true);
  } else if (prog.watched) {
    quizArea.innerHTML = `
      <div class="quiz-section">
        <h4>AI Quiz</h4>
        <p class="quiz-desc">Test your knowledge with an AI-generated quiz for this lesson.</p>
        <button class="btn btn-primary" id="btn-start-quiz" onclick="startQuiz()">Start Quiz →</button>
      </div>`;
  } else {
    quizArea.innerHTML = `
      <div class="quiz-section">
        <p class="quiz-desc" style="color:var(--muted)">Watch the lesson first, then take the AI quiz.</p>
      </div>`;
  }

  openModal();
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('video-frame').src = '';
  activeLessonData = null;
}

function markWatched() {
  if (!activeLessonData) return;
  const { lesson, index } = activeLessonData;
  Storage.setLessonProgress(currentCourseId, index, {
    watched: true,
    completedAt: new Date().toISOString(),
  });
  Storage.updateStats({ xp: 20, lessonComplete: true });
  renderCourseView();
  refreshSidebarXP();

  // update button
  document.getElementById('btn-mark-watched').textContent = '✓ Watched';
  document.getElementById('btn-mark-watched').disabled = true;

  // show quiz
  document.getElementById('quiz-area').innerHTML = `
    <div class="quiz-section">
      <h4>AI Quiz</h4>
      <p class="quiz-desc">Test your knowledge with an AI-generated quiz for this lesson.</p>
      <button class="btn btn-primary" id="btn-start-quiz" onclick="startQuiz()">Start Quiz →</button>
    </div>`;

  // check badges
  const newBadges = BadgeSystem.evaluate(currentCourseId);
  newBadges.forEach(id => showBadgePopup(id));
  showToast('Lesson marked as watched! +20 XP', 'success');
}

// ── Quiz flow ─────────────────────────────────────────────────
async function startQuiz() {
  if (!activeLessonData) return;
  const { lesson } = activeLessonData;

  document.getElementById('quiz-area').innerHTML = `
    <div class="quiz-loading"><div class="spinner"></div> Generating your quiz with AI…</div>`;

  try {
    activeQuizQuestions = await QuizEngine.generate(lesson);
    userAnswers = {};
    quizSubmitted = false;
    renderQuizQuestions();
  } catch (err) {
    document.getElementById('quiz-area').innerHTML = `
      <div class="quiz-section">
        <p style="color:var(--accent2)">⚠ Failed to generate quiz: ${escHtml(err.message)}</p>
        <button class="btn btn-outline btn-sm" onclick="startQuiz()">Retry</button>
      </div>`;
  }
}

function renderQuizQuestions() {
  const html = `
    <div class="quiz-section">
      <h4>AI Quiz</h4>
      <p class="quiz-desc">${activeQuizQuestions.length} questions · Select one answer per question</p>
      ${activeQuizQuestions.map((q, qi) => `
        <div class="quiz-question-block" id="q-block-${qi}">
          <div class="quiz-question-text">${qi + 1}. ${escHtml(q.q)}</div>
          <div class="quiz-options">
            ${q.options.map((opt, oi) => `
              <button class="quiz-option" onclick="selectAnswer(${qi}, ${oi})" data-qi="${qi}" data-oi="${oi}">
                <span style="font-weight:600;color:var(--accent);min-width:18px">${String.fromCharCode(65+oi)}.</span>
                ${escHtml(opt)}
              </button>`).join('')}
          </div>
        </div>`).join('')}
      <div style="margin-top:16px">
        <button class="btn btn-primary btn-full" id="btn-submit-quiz" onclick="submitQuiz()" disabled>
          Submit Quiz
        </button>
      </div>
    </div>`;
  document.getElementById('quiz-area').innerHTML = html;
}

function selectAnswer(qi, oi) {
  if (quizSubmitted) return;
  userAnswers[qi] = oi;
  // highlight selected
  document.querySelectorAll(`[data-qi="${qi}"]`).forEach(btn => btn.classList.remove('selected'));
  document.querySelector(`[data-qi="${qi}"][data-oi="${oi}"]`).classList.add('selected');
  // enable submit if all answered
  if (Object.keys(userAnswers).length === activeQuizQuestions.length) {
    document.getElementById('btn-submit-quiz').disabled = false;
  }
}

function submitQuiz() {
  if (!activeLessonData) return;
  quizSubmitted = true;
  const score = QuizEngine.score(activeQuizQuestions, userAnswers);
  const passed = score >= 60;
  const { index } = activeLessonData;

  // Reveal correct/wrong
  activeQuizQuestions.forEach((q, qi) => {
    const chosen  = userAnswers[qi];
    const correct = q.answer;
    document.querySelectorAll(`[data-qi="${qi}"]`).forEach(btn => {
      btn.disabled = true;
      const oi = parseInt(btn.dataset.oi);
      if (oi === correct) btn.classList.add('correct');
      else if (oi === chosen && chosen !== correct) btn.classList.add('wrong');
    });
  });

  Storage.setLessonProgress(currentCourseId, index, {
    quizPassed: passed,
    quizScore: score,
  });
  Storage.updateStats({ xp: passed ? 50 : 10, quizPassed: passed });

  // append result
  const submitBtn = document.getElementById('btn-submit-quiz');
  if (submitBtn) submitBtn.remove();

  document.getElementById('quiz-area').insertAdjacentHTML('beforeend',
    renderQuizResult(score, false));

  refreshSidebarXP();
  renderCourseView();

  // badges
  const newBadges = BadgeSystem.evaluate(currentCourseId);
  newBadges.forEach(id => showBadgePopup(id));
  showToast(passed ? `Quiz passed! +50 XP 🎉` : `Quiz done — ${score}%. Try again later!`,
    passed ? 'success' : 'warning');
}

function renderQuizResult(score, compact) {
  const passed = score >= 60;
  if (compact) {
    return `<div class="quiz-section">
      <div class="quiz-result" style="padding:16px">
        <p style="font-size:14px;color:var(--muted)">Quiz completed · Score: <strong style="color:${passed ? 'var(--green)' : 'var(--accent2)'}">${score}%</strong></p>
      </div>
    </div>`;
  }
  return `<div class="quiz-result" style="margin-top:16px">
    <div class="score-big">${score}%</div>
    <div class="score-label">${passed ? '🎉 Passed! Great job.' : '📖 Keep studying and try again.'}</div>
    ${passed ? '' : `<button class="btn btn-outline btn-sm" onclick="startQuiz()">Retake Quiz</button>`}
  </div>`;
}

// ── Setup: URL tab ────────────────────────────────────────────
async function handleFetchPlaylist() {
  const url  = document.getElementById('playlist-url').value.trim();
  const btn  = document.getElementById('btn-fetch-playlist');
  const info = document.getElementById('playlist-info');

  if (!url) { showToast('Please enter a playlist URL', 'warning'); return; }
  const id = YouTube.extractPlaylistId(url);
  if (!id) { showToast('Could not find playlist ID in that URL', 'error'); return; }

  btn.disabled = true;
  btn.textContent = 'Fetching…';
  info.innerHTML = '<div class="quiz-loading"><div class="spinner"></div> Fetching playlist…</div>';

  try {
    const [videos, meta] = await Promise.all([
      YouTube.fetchPlaylist(id),
      YouTube.fetchPlaylistInfo(id),
    ]);

    if (!videos.length) throw new Error('No videos found in this playlist');

    document.getElementById('url-course-title').value = meta?.title || 'My Course';
    document.getElementById('url-video-count').textContent = videos.length;
    document.getElementById('url-playlist-title').textContent = meta?.title || id;
    document.getElementById('playlist-info').style.display = 'block';

    // store fetched videos in a temp variable on window
    window._fetchedVideos = videos;
    window._fetchedMeta = meta;

    info.innerHTML = `
      <div style="background:var(--bg3);border-radius:var(--radius);padding:14px 18px;margin-top:12px;">
        <p style="font-size:13px;color:var(--green);margin-bottom:4px">✓ Fetched ${videos.length} videos</p>
        <p style="font-size:12px;color:var(--muted)">${meta?.channel ? 'Channel: ' + escHtml(meta.channel) : ''}</p>
      </div>`;
    document.getElementById('url-build-section').style.display = 'block';

  } catch (err) {
    info.innerHTML = `<p style="color:var(--accent2);font-size:13px;margin-top:8px">⚠ ${escHtml(err.message)}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Fetch Playlist';
  }
}

function handleBuildFromUrl() {
  if (!window._fetchedVideos?.length) { showToast('Fetch a playlist first', 'warning'); return; }
  const title  = document.getElementById('url-course-title').value.trim() || 'My Course';
  const start  = document.getElementById('url-start-date').value || new Date().toISOString().split('T')[0];
  const days   = parseInt(document.getElementById('url-days-per-lesson').value) || CONFIG.DAYS_PER_LESSON;

  const course = CourseBuilder.build({ title, videos: window._fetchedVideos, startDate: start, daysPerLesson: days });
  Storage.saveCourse(course);
  window._fetchedVideos = null;

  showToast(`Course "${title}" created! 🚀`, 'success');
  currentCourseId = course.id;
  navigateTo('course');
}

// ── Setup: Manual tab ─────────────────────────────────────────
function switchSetupTab(tab) {
  document.querySelectorAll('.setup-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`.setup-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

function addManualVideoRow() {
  const list = document.getElementById('manual-video-list');
  const idx  = list.children.length;
  const row  = document.createElement('div');
  row.className = 'manual-video-item';
  row.innerHTML = `
    <input type="text" placeholder="Video title" data-field="title">
    <input type="text" placeholder="YouTube video ID or URL" data-field="vid">
    <button class="btn-icon" onclick="this.closest('.manual-video-item').remove()" title="Remove">✕</button>`;
  list.appendChild(row);
}

function handleBuildManual() {
  const title  = document.getElementById('manual-course-title').value.trim();
  const start  = document.getElementById('manual-start-date').value || new Date().toISOString().split('T')[0];
  const days   = parseInt(document.getElementById('manual-days-per-lesson').value) || CONFIG.DAYS_PER_LESSON;
  const rows   = document.querySelectorAll('#manual-video-list .manual-video-item');

  if (!title) { showToast('Enter a course title', 'warning'); return; }
  if (!rows.length) { showToast('Add at least one video', 'warning'); return; }

  const videos = [];
  for (const row of rows) {
    const t  = row.querySelector('[data-field="title"]').value.trim();
    const v  = row.querySelector('[data-field="vid"]').value.trim();
    if (!t || !v) { showToast('Fill in all video fields', 'warning'); return; }
    const videoId = YouTube.extractPlaylistId('?v=' + v) ||
      v.match(/(?:youtu\.be\/|v=)([^&\s]+)/)?.[1] || v;
    videos.push({ title: t, videoId, description: '', thumbnail: '' });
  }

  const course = CourseBuilder.build({ title, videos, startDate: start, daysPerLesson: days });
  Storage.saveCourse(course);

  showToast(`Course "${title}" created! 🚀`, 'success');
  currentCourseId = course.id;
  navigateTo('course');
}

// ── Badges page ───────────────────────────────────────────────
function renderBadgesPage() {
  const earned = Storage.getEarnedBadges();
  const all    = BadgeSystem.getAll();
  document.getElementById('badges-earned-count').textContent =
    `${earned.length} / ${all.length} earned`;

  document.getElementById('badges-grid').innerHTML = all.map(b => {
    const isEarned = earned.includes(b.id);
    return `
      <div class="badge-card ${isEarned ? 'earned' : 'locked-badge'}">
        ${isEarned ? '<span class="badge-earned-tag">✓</span>' : ''}
        <span class="badge-icon">${b.icon}</span>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>`;
  }).join('');
}

// ── Badge popup ───────────────────────────────────────────────
function showBadgePopup(badgeId) {
  const badge = BadgeSystem.getById(badgeId);
  if (!badge) return;
  const popup = document.getElementById('badge-popup');
  document.getElementById('popup-badge-icon').textContent = badge.icon;
  document.getElementById('popup-badge-name').textContent = badge.name;
  document.getElementById('popup-badge-desc').textContent = badge.desc;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 3000);
}

document.getElementById && document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('badge-popup')?.addEventListener('click', () => {
    document.getElementById('badge-popup').classList.remove('show');
  });
});

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icons = { success: '✓', warning: '⚡', error: '✕' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span>${escHtml(msg)}`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Utils ─────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
