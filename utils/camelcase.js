/**
 * Created by Bruce on 2016/3/15.
 */
/* eslint-disable */
'use strict'
var isDate = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Date]'
}
var isRegex = function (obj) {
  return Object.prototype.toString.call(obj) === '[object RegExp]'
}
String.prototype.replaceAll = function (find, replace) {
  var str = this
  return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace)
}
function camel(obj) {
  var re = /"[\w\d]+?_[\w\d]+?"\s?(?=:)/g
  var str = JSON.stringify(obj)
  var m
  var matched = []
  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++
    }
    if (matched.indexOf(m[0]) === -1) {
      matched.push(m[0])
      str = str.replaceAll(m[0], m[0].replace(/[_.-](\w|$)/g, function (_, x) {
        return x.toUpperCase()
      }))
    }
  }
  return JSON.parse(str)
}
function snake(obj, isString) {
  var re = /"[\w\d]+?[A-Z][\w\d]+?"\s?(?=:)/g
  var str = isString ? obj : JSON.stringify(obj)
  var m
  var matched = []
  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++
    }
    if (matched.indexOf(m[0]) === -1) {
      matched.push(m[0])
      str = str.replaceAll(m[0], m[0].replace(/([A-Z])/g, function ($1) {
        return '_' + $1.toLowerCase()
      }))
    }
  }
  return isString ? str : JSON.parse(str)
}
export const camelcase = function (obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (isDate(obj) || isRegex(obj)) return obj
  return camel(obj)
}
export const snakecase = function (obj, isString) {
  if (!isString && (!obj || typeof obj !== 'object')) return obj
  if (isDate(obj) || isRegex(obj)) return obj
  return snake(obj, isString)
}
