// Option codes must match backend/screening/ml.py FIELDS.
export const AGE_MIN = 12
export const AGE_MAX = 80

export const QUESTIONS = [
  { field: 'age', type: 'number' },
  { field: 'marital', options: ['unmarried', 'married', 'cohabiting', 'divorced', 'widowed'] },
  { field: 'education', options: ['illiteracy', 'primary', 'junior_high', 'senior_high', 'college'] },
  { field: 'orientation', options: ['heterosexual', 'homosexual', 'bisexual'] },
  { field: 'place', options: ['internet', 'bar', 'public_bath', 'park', 'others'] },
  { field: 'std', options: ['yes', 'no'] },
  { field: 'tested_past_year', options: ['yes', 'no'] },
  { field: 'aids_education', options: ['yes', 'no'] },
  { field: 'drugs', options: ['yes', 'no'] },
]

export const WHATIF_FIELDS = ['place', 'std', 'tested_past_year', 'aids_education']

export const optionsFor = (field) => QUESTIONS.find((q) => q.field === field).options
