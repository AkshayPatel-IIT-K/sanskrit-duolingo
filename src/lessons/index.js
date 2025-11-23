// Auto-load all lesson JSON files inside this folder
const modules = import.meta.glob('./*.json', { eager: true });

// Convert to a clean object: { lesson_id: lessonObject }
const lessons = {};

for (const path in modules) {
  const lesson = modules[path];
  const id = lesson.lesson_id || path.replace('./', '').replace('.json', '');
  lessons[id] = lesson;
}

export default lessons;