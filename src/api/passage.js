import { post } from '@/utils/request'

export default {
  pageList: query => post('/api/admin/passage/page', query),
  edit: query => post('/api/admin/passage/edit', query),
  select: id => post('/api/admin/passage/select/' + id)
}
