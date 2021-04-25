import request from '@/utils/request'

// 查询缺陷列表
export function listBug (query) {
  return request({
    url: '/project/bug/list',
    method: 'get',
    params: query
  })
}

// 查询缺陷详细
export function getBug (id) {
  return request({
    url: '/project/bug/' + id,
    method: 'get'
  })
}

// 新增缺陷
export function addBug (data) {
  return request({
    url: '/project/bug',
    method: 'post',
    data: data
  })
}

// 修改缺陷
export function updateBug (data) {
  return request({
    url: '/project/bug',
    method: 'put',
    data: data
  })
}

// 删除缺陷
export function delBug (id) {
  return request({
    url: '/project/bug/' + id,
    method: 'delete'
  })
}

// 导出缺陷
export function exportBug (query) {
  return request({
    url: '/project/bug/export',
    method: 'get',
    params: query
  })
}
