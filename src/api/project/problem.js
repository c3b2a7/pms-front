import request from '@/utils/request'

// 查询问题管理列表
export function listProblem (query) {
  return request({
    url: '/project/problem/list',
    method: 'get',
    params: query
  })
}

// 查询问题管理详细
export function getProblem (id) {
  return request({
    url: '/project/problem/' + id,
    method: 'get'
  })
}

// 新增问题管理
export function addProblem (data) {
  return request({
    url: '/project/problem',
    method: 'post',
    data: data
  })
}

// 修改问题管理
export function updateProblem (data) {
  return request({
    url: '/project/problem',
    method: 'put',
    data: data
  })
}

// 删除问题管理
export function delProblem (id) {
  return request({
    url: '/project/problem/' + id,
    method: 'delete'
  })
}

// 导出问题管理
export function exportProblem (query) {
  return request({
    url: '/project/problem/export',
    method: 'get',
    params: query
  })
}
