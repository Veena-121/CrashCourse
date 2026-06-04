

const BADGE_DEFS = [
  {
    id: 'first_lesson',
    icon: '🎬',
    name: 'First Step',
    desc: 'Complete your first lesson',
  },
  {
    id: 'first_quiz',
    icon: '🧠',
    name: 'Quiz Taker',
    desc: 'Pass your first quiz',
  },
  {
    id: 'quiz_ace',
    icon: '⭐',
    name: 'Ace',
    desc: 'Score 100% on any quiz',
  },
  {
    id: 'halfway',
    icon: '🔥',
    name: 'Halfway There',
    desc: 'Complete 50% of a course',
  },
  {
    id: 'course_complete',
    icon: '🏆',
    name: 'Graduate',
    desc: 'Finish an entire course',
  },
  {
    id: 'streak_3',
    icon: '⚡',
    name: 'On a Roll',
    desc: '3-day learning streak',
  },
  {
    id: 'streak_7',
    icon: '🌟',
    name: 'Committed',
    desc: '7-day learning streak',
  },
  {
    id: 'speed_run',
    icon: '🚀',
    name: 'Speed Learner',
    desc: 'Complete a lesson before deadline',
  },
  {
    id: 'night_owl',
    icon: '🦉',
    name: 'Night Owl',
    desc: 'Study after midnight',
  },
  {
    id: 'perfect_course',
    icon: '💎',
    name: 'Perfectionist',
    desc: 'Pass every quiz in a course with 80%+',
  },
];

const BadgeSystem = {
  getAll() { return BADGE_DEFS; },

  getById(id) { return BADGE_DEFS.find(b => b.id === id); },

  
  evaluate(courseId) {
    const newBadges = [];
    const course   = Storage.getCourseById(courseId);
    if (!course) return newBadges;

    const progress = Storage.getCourseProgress(courseId);
    const stats    = Storage.getStats();
    const earned   = Storage.getEarnedBadges();

    const completedLessons  = Object.values(progress).filter(p => p.watched).length;
    const quizzesPassed     = Object.values(progress).filter(p => p.quizPassed).length;
    const totalLessons      = course.lessons.length;
    const perfectQuizzes    = Object.values(progress).filter(p => p.quizScore === 100).length;

    const try_award = (id) => {
      if (!earned.includes(id) && Storage.awardBadge(id)) {
        newBadges.push(id);
        Storage.updateStats({ xp: 50 }); // bonus XP per badge
      }
    };

    if (completedLessons >= 1)                         try_award('first_lesson');
    if (quizzesPassed >= 1)                            try_award('first_quiz');
    if (perfectQuizzes >= 1)                           try_award('quiz_ace');
    if (totalLessons > 0 && completedLessons >= Math.ceil(totalLessons / 2)) try_award('halfway');
    if (completedLessons === totalLessons)              try_award('course_complete');
    if (stats.streak >= 3)                             try_award('streak_3');
    if (stats.streak >= 7)                             try_award('streak_7');
    if (new Date().getHours() >= 0 && new Date().getHours() < 4) try_award('night_owl');

    
    const lessonKeys = Object.keys(progress);
    const lastKey    = lessonKeys[lessonKeys.length - 1];
    if (lastKey !== undefined) {
      const lesson  = course.lessons[parseInt(lastKey)];
      const prog    = progress[lastKey];
      if (lesson && prog && prog.watched && prog.completedAt) {
        if (new Date(prog.completedAt) <= new Date(lesson.deadline)) {
          try_award('speed_run');
        }
      }
    }

   
    if (totalLessons > 0 && quizzesPassed === totalLessons) {
      const allHigh = Object.values(progress).every(p => (p.quizScore || 0) >= 80);
      if (allHigh) try_award('perfect_course');
    }

    return newBadges;
  },
};
