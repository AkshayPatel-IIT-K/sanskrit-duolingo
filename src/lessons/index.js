const modules = import.meta.glob('./*.json', { eager: true })
const lessons = Object.values(modules).map(m => m.default ?? m)
export default lessons
