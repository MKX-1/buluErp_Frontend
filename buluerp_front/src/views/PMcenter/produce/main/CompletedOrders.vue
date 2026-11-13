<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import FormSearch from '@/components/form/Form.vue'
import BordShow from '@/components/board/SecBoard.vue'
import TableList from '@/components/table/TableList.vue'
import { listArchiveOrders, exportArchiveOrders } from '@/apis/produceControl/produce/archive'
import { downloadBinaryFile } from '@/utils/file/base64'

const props = defineProps<{ addTab: Function }>()

const formData = ref([
  [
    { type: 'input', label: '订单编号', key: 'orderCodeKeyword' },
    { type: 'input', label: '客户', key: 'customerName' },
    { type: 'input', label: '产品编号', key: 'productId' },
  ],
])

const searchContent = ref({
  orderCodeKeyword: '',
  customerName: '',
  productId: '',
})

const tableData = ref([
  { value: 'innerId', label: '内部编号', type: 'text' },
  { value: 'outerId', label: '外部编号', type: 'text' },
  { value: 'customerName', label: '客户', type: 'text' },
  { value: 'productName', label: '产品名称', type: 'text' },
  { value: 'productCode', label: '产品编号', type: 'text' },
  { value: 'quantity', label: '数量', type: 'text' },
  { value: 'deliveryTime', label: '交货时间', type: 'text' },
  { value: 'statusLabel', label: '订单状态', type: 'tags' },
  { value: 'scheduleCount', label: '布产记录', type: 'text' },
  { value: 'arrangeCount', label: '排产记录', type: 'text' },
])

const listData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadData = () => {
  const params: Record<string, any> = {
    pageNum: page.value,
    pageSize: pageSize.value,
    orderByColumn: 'createTime',
    isAsc: 'desc',
  }
  Object.keys(searchContent.value).forEach((key) => {
    const value = (searchContent.value as Record<string, any>)[key]
    if (value) params[key] = value
  })
  listArchiveOrders(params).then((res: any) => {
    listData.value = res.rows || []
    total.value = res.total || 0
  })
}

const onSubmit = () => {
  page.value = 1
  loadData()
}

const handlePageChange = (value: number) => {
  page.value = value
  loadData()
}

const handleSizeChange = (value: number) => {
  pageSize.value = value
  page.value = 1
  loadData()
}

const operation = ref([
  {
    value: '查看',
    func: (row: any) => {
      props.addTab(
        `已完成订单详情 ${row.innerId}`,
        'PMProduceArchiveDetail',
        { row, orderCode: row.innerId, addTab: props.addTab },
        `/PMProduceArchiveDetail/${row.id}`,
      )
    },
  },
])

let exportCount = 1
const exportFunc = (rows: any[]) => {
  if (!rows.length) {
    ElMessage.warning('请先选择要导出的订单')
    return
  }
  exportArchiveOrders(rows.map((row) => row.id)).then((res) => {
    downloadBinaryFile(res, `已完成订单_${new Date().toLocaleDateString()}_${exportCount}.xlsx`)
    exportCount += 1
  })
}

loadData()
</script>

<template>
  <div class="col">
    <BordShow content="已完成订单" path="生产管理中心/生产/已完成订单" />
    <div class="greyBack">
      <FormSearch title="查询" :data="formData" :onSubmit="onSubmit" :searchForm="searchContent" />
      <div class="archive-rule">
        归档规则：仅订单状态为“已完成（14）”时自动归入；订单状态回退后自动返回布产表、排产表。
      </div>
      <TableList
        :tableData="tableData"
        :listData="listData"
        :operations="operation"
        :exportFunc="exportFunc"
      >
        <slot>
          <div class="pagination-row">
            <span>共 {{ total }} 条</span>
            <el-pagination
              background
              layout="prev, pager, next, jumper, ->, total, sizes"
              :current-page="page"
              :page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="total"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </slot>
      </TableList>
    </div>
  </div>
</template>

<style scoped>
.archive-rule {
  margin: 0 30px 2px;
  padding: 10px 14px;
  color: #606266;
  background: #f4f4f5;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
}

.pagination-row {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #606266;
}
</style>
