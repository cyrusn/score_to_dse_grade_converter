const marks = require('./data/mark.json')
const grading = require('./grading.json')
const fs = require('fs')
// package to convert csv to json or vice
const Papa = require('papaparse')
const _ = require('lodash')

const subjects = _(grading).map(s => s.slug).uniq().value()
const gradingCriteria = _.groupBy(grading, 'slug')
const BASIC_INFO_KEY = ['classcode', 'cname', 'ename']

function isBasicInfoKey (key) {
  return _.includes([...BASIC_INFO_KEY], key)
}

function convert2weightedScore (key, val) {
  let weightedScore
  const coreSubjects = ['chi', 'eng', 'math', 'ls']
  if (_.includes([...coreSubjects], key)) {
    // core subjects have weighting 3
    weightedScore = val * 3
  } else if (key === 'm2') {
    weightedScore = val
  } else {
    // all other subjects have weighting 2.
    weightedScore = val * 2
  }
  return weightedScore
}

function convert2Grade (key, score) {
  let criteria = gradingCriteria[key]
  const inRange = score => {
    return (criterion) => {
      return (score >= criterion.min && score <= criterion.max)
    }
  }

  const getGrade = (acc, c) => (acc + c.grade)

  if (criteria) {
    let grade = criteria.filter(inRange(score)).reduce(getGrade, 0)
    return grade
  }
}

function convertScore2Grade (s) {
  return _.mapValues(s, (val, key) => {
    // do nothing to basic info
    if (isBasicInfoKey(key)) return val
    // only convert score to grade
    // convert score to weighted score first
    let weightedScore = convert2weightedScore(key, val)
    // then convert to grade
    let grade = convert2Grade(key, weightedScore)
    return grade
  })
}

// results that are added predicted DSE score / grade
const gradedMarks = _.map(marks, convertScore2Grade)

const gradedMarksCSV = Papa.unparse({
  fields: [...BASIC_INFO_KEY, ...subjects],
  data: gradedMarks
})

function write2Files (filename) {
  fs.writeFileSync(`./result/${filename}.json`, JSON.stringify(gradedMarks, null, '\t'), {
    encoding: 'utf8'
  })

  fs.writeFileSync(`./result/${filename}.csv`, gradedMarksCSV, {
    encoding: 'utf8'
  })
}

write2Files('result')
