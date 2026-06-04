const STORAGE_KEYS = {
  COURSES:  'ytcourse_courses',
  PROGRESS: 'ytcourse_progress',
  BADGES:   'ytcourse_badges',
  STATS:    'ytcourse_stats',
};

const Storage = {
  
  getCourses() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES)) || []; }
    catch { return []; }
  },

  saveCourse(course) {
    const courses = this.getCourses();
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx >= 0) courses[idx] = course;
    else courses.push(course);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  },

  deleteCourse(id) {
    const courses = this.getCourses().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    
    const prog = this.getProgress();
    delete prog[id];
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(prog));
  },

  getCourseById(id) {
    return this.getCourses().find(c => c.id === id) || null;
  },

  
  getProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS)) || {}; }
    catch { return {}; }
  },

  getCourseProgress(courseId) {
    const all = this.getProgress();
    return all[courseId] || {};
  },

  
  setLessonProgress(courseId, lessonIndex, data) {
    const all = this.getProgress();
    if (!all[courseId]) all[courseId] = {};
    all[courseId][lessonIndex] = { ...(all[courseId][lessonIndex] || {}), ...data };
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  },

  
  getEarnedBadges() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)) || []; }
    catch { return []; }
  },

  awardBadge(badgeId) {
    const badges = this.getEarnedBadges();
    if (badges.includes(badgeId)) return false; 
    badges.push(badgeId);
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    return true; 
  },

  
  getStats() {
    const defaults = { totalXP: 0, quizzesPassed: 0, lessonsCompleted: 0, streak: 0, lastActive: null };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS)) }; }
    catch { return defaults; }
  },

  updateStats(delta) {
    const stats = this.getStats();
    const today = new Date().toDateString();
    if (delta.xp)             stats.totalXP += delta.xp;
    if (delta.quizPassed)     stats.quizzesPassed += 1;
    if (delta.lessonComplete) stats.lessonsCompleted += 1;
    // streak logic
    if (stats.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      stats.streak = (stats.lastActive === yesterday) ? stats.streak + 1 : 1;
      stats.lastActive = today;
    }
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    return stats;
  },
};
