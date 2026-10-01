// Session-only so nothing lingers on a shared phone after the browser tab closes.
const ANSWERS_KEY = 'hiv_answers'
const RESULT_KEY = 'hiv_result'

const read = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key))
  } catch {
    return null
  }
}

export const loadAnswers = () => read(ANSWERS_KEY) || {}
export const saveAnswers = (answers) => sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
export const loadResult = () => read(RESULT_KEY)
export const saveResult = (data) => sessionStorage.setItem(RESULT_KEY, JSON.stringify(data))

export const clearAll = () => {
  sessionStorage.removeItem(ANSWERS_KEY)
  sessionStorage.removeItem(RESULT_KEY)
}
