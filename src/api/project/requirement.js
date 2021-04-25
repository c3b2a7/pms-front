import request from '@/utils/request'

// 查询需求列表
export function listRequirement (query) {
  return request({
    url: '/project/requirement/list',
    method: 'get',
    params: query
  })
}

// 查询需求详细
export function getRequirement (id) {
  return request({
    url: '/project/requirement/' + id,
    method: 'get'
  })
}

// 新增需求
export function addRequirement (data) {
  return request({
    url: '/project/requirement',
    method: 'post',
    data: data
  })
}

// 修改需求
export function updateRequirement (data) {
  return request({
    url: '/project/requirement',
    method: 'put',
    data: data
  })
}

// 删除需求
export function delRequirement (id) {
  return request({
    url: '/project/requirement/' + id,
    method: 'delete'
  })
}

// 导出需求
export function exportRequirement (query) {
  return request({
    url: '/project/requirement/export',
    method: 'get',
    params: query
  })
}
