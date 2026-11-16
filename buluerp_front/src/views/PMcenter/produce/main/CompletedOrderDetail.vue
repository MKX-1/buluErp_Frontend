<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import BordShow from '@/components/board/SecBoard.vue'
import FormSearch from '@/components/form/Form.vue'
import {
  exportArchiveOrders,
  listArchiveArranges,
  listArchiveSchedules,
} from '@/apis/produceControl/produce/archive'
import { downloadBinaryFile } from '@/utils/file/base64'
import { getFullImageUrl } from '@/utils/image/getUrl'
import { parseTime } from '@/utils/ruoyi'

const props = defineProps<{ data: any }>()
const order = computed(() => props.data?.row || props.data || {})
const orderCode = computed(() => props.data?.orderCode || order.value?.innerId)
const activeTab = ref('schedule')
const pageSizes = [10, 20, 50, 100]

const scheduleFormData = ref([
  [
    { type: 'timer', label: '出货日期', timerType: 'date', key: 'shipmentTime' },
    { type: 'timer', label: '布产时间', timerType: 'date', key: 'productionTime' },
    { type: 'input', label: '操作人', key: 'operator' },
  ],
  [
    { type: 'input', label: '颜色编号', key: 'colorCode' },
    {
      type: 'select',
      label: '模具状态',
      key: 'mouldCondition',
      options: [
        { label: '未生产', value: '未生产' },
        { label: '已生产', value: '已生产' },
      ],
    },
    { type: 'input', label: '产品编号', key: 'productId' },
  ],
  [
    { type: 'input', label: '供应商', key: 'supplier' },
    { type: 'input', label: '模具编码', key: 'mouldNumber' },
    { type: 'input', label: '模具厂家', key: 'mouldManufacturer' },
  ],
  [{ type: 'input', label: '料别', key: 'materialType' }],
])

const arrangeFormData = ref([
  [
    { type: 'timer', label: '安排日期', timerType: 'date', key: 'scheduledTime' },
    { type: 'timer', label: '完成时间', timerType: 'date', key: 'completionTime' },
    { type: 'input', label: '操作人', key: 'operator' },
  ],
  [
    { type: 'input', label: '颜色编号', key: 'colorCode' },
    { type: 'input', label: '料别', key: 'materialType' },
    { type: 'input', label: '模具编号', key: 'mouldNumber' },
  ],
])

const scheduleSearch = ref({
  shipmentTime: '',
  productionTime: '',
  operator: '',
  colorCode: '',
  mouldCondition: '',
  productId: '',
  supplier: '',
  mouldNumber: '',
  mouldManufacturer: '',
  materialType: '',
})

const arrangeSearch = ref({
  scheduledTime: '',
  completionTime: '',
  operator: '',
  colorCode: '',
  materialType: '',
  mouldNumber: '',
})

const scheduleLoading = ref(false)
const arrangeLoading = ref(false)
const scheduleData = ref<any[]>([])
const arrangeData = ref<any[]>([])
const schedulePage = ref(1)
const arrangePage = ref(1)
const schedulePageSize = ref(10)
const arrangePageSize = ref(10)
const scheduleTotal = ref(0)
const arrangeTotal = ref(0)

const scheduleColumns = [
  { prop: 'id', label: '布产ID', width: 90 },
  { prop: 'productCode', label: '产品编号', width: 120 },
  { prop: 'mouldNumber', label: '模具编码', width: 130 },
  { prop: 'colorCode', label: '颜色编号', width: 110 },
  { prop: 'materialType', label: '料别', width: 90 },
  { prop: 'productionQuantity', label: '布产数量', width: 110 },
  { prop: 'productionTime', label: '布产时间', width: 120 },
  { prop: 'shipmentTime', label: '出货时间', width: 120 },
  { prop: 'operator', label: '操作人', width: 100 },
]

const arrangeColumns = [
  { prop: 'id', label: '排产ID', width: 90 },
  { prop: 'mouldNumber', label: '模具编号', width: 130 },
  { prop: 'colorCode', label: '颜色编号', width: 110 },
  { prop: 'materialType', label: '料别', width: 90 },
  { prop: 'mouldOutput', label: '出模数', width: 90 },
  { prop: 'productionQuantity', label: '排产数量', width: 110 },
  { prop: 'productionWeight', label: '排产重量', width: 110 },
  { prop: 'scheduledTime', label: '安排时间', width: 120 },
  { prop: 'completionTime', label: '完成时间', width: 120 },
  { prop: 'operator', label: '操作人', width: 100 },
]

const buildParams = (
  filters: Record<string, any>,
  page: number,
  pageSize: number,
  dateFields: string[],
) => {
  const params: Record<string, any> = {
    pageNum: page,
    pageSize,
    orderByColumn: 'creationTime',
    isAsc: 'desc',
  }
  Object.keys(filters).forEach((key) => {
    const value = filters[key]
    if (value !== '' && value !== null && value !== undefined) {
      params[key] = dateFields.includes(key) ? parseTime(value, '{y}-{m}-{d}') : value
    }
  })
  return params
}

const loadSchedules = async () => {
  if (!orderCode.value) return
  scheduleLoading.value = true
  try {
    const filters = scheduleSearch.value as Record<string, any>
    const res: any = await listArchiveSchedules(
      orderCode.value,
      buildParams(filters, schedulePage.value, schedulePageSize.value, [
        'shipmentTime',
        'productionTime',
      ]),
    )
    scheduleData.value = res.rows || []
    scheduleTotal.value = res.total || 0
  } finally {
    scheduleLoading.value = false
  }
}

const loadArranges = async () => {
  if (!orderCode.value) return
  arrangeLoading.value = true
  try {
    const filters = arrangeSearch.value as Record<string, any>
    const res: any = await listArchiveArranges(
      orderCode.value,
      buildParams(filters, arrangePage.value, arrangePageSize.value, [
        'scheduledTime',
        'completionTime',
      ]),
    )
    arrangeData.value = res.rows || []
    arrangeTotal.value = res.total || 0
  } finally {
    arrangeLoading.value = false
  }
}

const handleScheduleSearch = () => {
  schedulePage.value = 1
  loadSchedules()
}

const handleScheduleReset = () => {
  schedulePage.value = 1
  loadSchedules()
}

const handleSchedulePageChange = (value: number) => {
  schedulePage.value = value
  loadSchedules()
}

const handleScheduleSizeChange = (value: number) => {
  schedulePageSize.value = value
  schedulePage.value = 1
  loadSchedules()
}

const handleArrangeSearch = () => {
  arrangePage.value = 1
  loadArranges()
}

const handleArrangeReset = () => {
  arrangePage.value = 1
  loadArranges()
}

const handleArrangePageChange = (value: number) => {
  arrangePage.value = value
  loadArranges()
}

const handleArrangeSizeChange = (value: number) => {
  arrangePageSize.value = value
  arrangePage.value = 1
  loadArranges()
}

const exportDetail = () => {
  if (!order.value?.id) {
    ElMessage.warning('未找到可导出的订单')
    return
  }
  exportArchiveOrders([order.value.id]).then((res) => {
    downloadBinaryFile(res, `已完成订单_${order.value.innerId || order.value.id}.xlsx`)
  })
}

loadSchedules()
loadArranges()
</script>

<template>
  <div class="col">
    <BordShow content="已完成订单详情" path="生产管理中心/生产/已完成订单/详情" />
    <div class="greyBack">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-button type="primary" @click="exportDetail">导出</el-button>
          </div>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="内部编号">{{ order.innerId }}</el-descriptions-item>
          <el-descriptions-item label="外部编号">{{ order.outerId }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ order.customerName }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag type="success">{{ order.statusLabel || '已完成' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ order.productName }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ order.productCode }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ order.quantity }}</el-descriptions-item>
          <el-descriptions-item label="交货时间">{{ order.deliveryTime }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ order.operator }}</el-descriptions-item>
          <el-descriptions-item label="布产记录">{{ scheduleTotal }} 条</el-descriptions-item>
          <el-descriptions-item label="排产记录">{{ arrangeTotal }} 条</el-descriptions-item>
        </el-descriptions>
        <el-alert
          class="readonly-alert"
          title="该订单已完成归档，布产和排产记录仅供查询与导出，不可编辑或删除。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-card>

      <el-card>
        <template #header>
          <div class="card-header">
            <span>生产归档记录</span>
            <span class="source-note">数据来源：布产表 / 排产表 · 服务端分页</span>
          </div>
        </template>
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="`布产记录 ${scheduleTotal}`" name="schedule">
            <FormSearch
              title="查询"
              :data="scheduleFormData"
              :onSubmit="handleScheduleSearch"
              :onReset="handleScheduleReset"
              :searchForm="scheduleSearch"
            />
            <el-table v-loading="scheduleLoading" :data="scheduleData" border style="width: 100%">
              <el-table-column label="图片" width="80" align="center">
                <template #default="{ row }">
                  <el-image
                    v-if="row.pictureUrl"
                    :src="getFullImageUrl(row.pictureUrl)"
                    :preview-src-list="[getFullImageUrl(row.pictureUrl)]"
                    preview-teleported
                    fit="contain"
                    class="record-image"
                  >
                    <template #error><span class="image-placeholder">暂无</span></template>
                  </el-image>
                  <span v-else class="image-placeholder">暂无</span>
                </template>
              </el-table-column>
              <el-table-column
                v-for="column in scheduleColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :width="column.width"
              />
            </el-table>
            <div class="pagination-row">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :current-page="schedulePage"
                :page-size="schedulePageSize"
                :page-sizes="pageSizes"
                :total="scheduleTotal"
                @current-change="handleSchedulePageChange"
                @size-change="handleScheduleSizeChange"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`排产记录 ${arrangeTotal}`" name="arrange">
            <FormSearch
              title="查询"
              :data="arrangeFormData"
              :onSubmit="handleArrangeSearch"
              :onReset="handleArrangeReset"
              :searchForm="arrangeSearch"
            />
            <el-table v-loading="arrangeLoading" :data="arrangeData" border style="width: 100%">
              <el-table-column label="图片" width="80" align="center">
                <template #default="{ row }">
                  <el-image
                    v-if="row.pictureUrl"
                    :src="getFullImageUrl(row.pictureUrl)"
                    :preview-src-list="[getFullImageUrl(row.pictureUrl)]"
                    preview-teleported
                    fit="contain"
                    class="record-image"
                  >
                    <template #error><span class="image-placeholder">暂无</span></template>
                  </el-image>
                  <span v-else class="image-placeholder">暂无</span>
                </template>
              </el-table-column>
              <el-table-column
                v-for="column in arrangeColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :width="column.width"
              />
            </el-table>
            <div class="pagination-row">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :current-page="arrangePage"
                :page-size="arrangePageSize"
                :page-sizes="pageSizes"
                :total="arrangeTotal"
                @current-change="handleArrangePageChange"
                @size-change="handleArrangeSizeChange"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.readonly-alert {
  margin-top: 16px;
}

.source-note {
  color: #909399;
  font-size: 12px;
}

.record-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}

.image-placeholder {
  color: #909399;
  font-size: 12px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
