/**
 * Auto-load JSON lessons from this folder.
 * Add more L*.json files and they will appear in the app.
 */
const modules = import.meta.glob('./*.json', { eager: true })
const lessons = Object.values(modules).map(m => m.default ?? m)
export default lessons
