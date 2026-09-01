<template>
  <div class="col">
    <BordShow content="模具列表" path="模具管理/模具" />

    <div class="greyBack">
      <!-- 查询表单 -->
      <FormSearch
        title="查询"
        :data="formData"
        :onSubmit="onSubmit"
        :onImport="onImport"
        :onCreate="onCreate"
        :onDownloadTemplate="onDownloadTemplate"
        :searchForm="searchContent"
      />

      <!-- 表格 -->
      <TableList
        ref="tableListRef"
        :tableData="tableData"
        :operations="operation"
        :listData="listData"
        :DeleteFunc="DeleteFunc"
        :exportFunc="exportFunc"
      >
        <template #toolbar>
          <el-button type="warning" @click="openBatchStatusDialog">批量更新状态</el-button>
        </template>
        <div
          style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center"
        >
          <div>共 {{ total }} 条</div>
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
      </TableList>
    </div>

    <!-- 批量更新模具状态 -->
    <el-dialog v-model="batchDialogVisible" title="批量更新模具状态" width="620px">
      <el-alert
        title="少量零散数据可使用勾选；上千条数据建议先设置查询条件，再选择当前查询结果。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />

      <el-form label-width="110px">
        <el-form-item label="更新范围" required>
          <el-radio-group v-model="batchForm.scope" class="batch-scope-group">
            <el-radio value="selected" :disabled="selectedMoulds.length === 0">
              已勾选记录（{{ selectedMoulds.length }} 条）
            </el-radio>
            <el-radio value="filtered">
              当前查询结果（{{ total }} 条）
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="batchForm.scope === 'filtered'" label="当前条件">
          <div class="filter-summary">
            <el-tag v-for="item in activeFilterTags" :key="item" type="info">{{ item }}</el-tag>
            <span v-if="activeFilterTags.length === 0" class="all-data-warning">
              未设置查询条件，将更新全部 {{ total }} 条模具
            </span>
          </div>
        </el-form-item>

        <el-form-item label="目标状态" required>
          <el-select v-model="batchForm.status" placeholder="请选择更新后的模具状态" style="width: 100%">
            <el-option
              v-for="item in mouldStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="batchForm.status === '模具故障送修中'" label="送修模房" required>
          <el-select
            v-model="batchForm.mouldHouseId"
            placeholder="请选择送修模房"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in mouldHouseOptions"
              :key="item.id"
              :label="`${item.name}（ID：${item.id}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="submitBatchStatus">
          确认更新 {{ batchAffectedCount }} 条
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" :title="title" width="800px">
      <CreateForm :data="dynamicFormData" :Formvalue="newSubmit" ref="createFormRef" />
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确认</el-button>
          <el-button @click="() => (editDialogVisible = false)">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入 Excel" width="400px">
      <el-upload
        class="upload-demo"
        drag
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
        accept=".xlsx,.xls"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只能上传 xls/xlsx 文件，大小不超过 500MB</div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import FormSearch from '@/components/form/Form.vue'
import CreateForm from '@/components/form/CreateForm.vue'
import TableList from '@/components/table/TableList.vue'
import BordShow from '@/components/board/SecBoard.vue'
import { ElMessage , ElMessageBox} from 'element-plus'
import { beforeUpload } from '@/utils/file/importExcel'
import { messageBox } from '@/components/message/messageBox'
import { downloadBinaryFile } from '@/utils/file/base64'
import { requiredRule } from '@/utils/form/valid'
import {
  getMouldList,
  createMould,
  deleteMould,
  updateMould,
  batchUpdateMouldStatus,
  exportMould,
  importMouldFile,
  getMouldTemplate,
} from '@/apis/mould'
import { getMouldHouseList } from '@/apis/mouldHouse'
import { searchFunc } from "@/utils/search/search"

defineOptions({ name: 'MouldList' })

interface MouldRow {
  id: number | string
}

interface MouldHouseOption {
  id: number | string
  name: string
}

const mouldStatusOptions = [
  { value: '新模(排产中)', label: '新模(排产中)' },
  { value: '新模完成(待试模)', label: '新模完成(待试模)' },
  { value: '验收合格(已入库)', label: '验收合格(已入库)' },
  { value: '模具故障送修中', label: '模具故障送修中' },
  { value: '维修好返厂待试模', label: '维修好返厂待试模' },
  { value: '已外发', label: '已外发' },
]

// 查询表单
const formData = ref([
  [
    { type: 'input', label: '模具编号', key: 'mouldNumber' },
    { type: 'input', label: '模具厂商', key: 'manufacturerName' },
    {
      type: 'select',
      label: '模具状态',
      key: 'status',
      options: mouldStatusOptions,
    },
  ],
])

const searchContent = ref({
  mouldNumber: '',
  manufacturerName: '',
  status: '',
})

// 表格列
const tableData = ref([
  { value: 'id', label: 'id', type: 'text' },
  { value: 'mouldNumber', label: '模具编号', type: 'text' },
  { value: 'manufacturerName', label: '模具厂商', type: 'text' },
  { value: 'trialDate', label: '试模日期', type: 'text' },
  {
    value: 'status',
    label: '模具状态',
    type: (row) => (row.status === '模具故障送修中' ? 'warningtags' : 'tags'),
  },
  { value: 'mouldHouseId', label: '模房id', type: 'text' },
])

// 表单绑定对象
const newSubmit = ref({
  mouldNumber: '',
  manufacturerId: '',
  trialDate: '',
  status: '',
  remark: '',
})

// 弹窗显示与表单结构
const editDialogVisible = ref(false)
const title = ref('新增')
const createFormRef = ref()
const dynamicFormData = ref([])

// 分页与数据
const listData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableListRef = ref()

// 批量状态更新
const batchDialogVisible = ref(false)
const batchSubmitting = ref(false)
const selectedMoulds = ref<MouldRow[]>([])
const mouldHouseOptions = ref<MouldHouseOption[]>([])
const batchForm = ref({
  scope: 'selected',
  status: '',
  mouldHouseId: null as number | string | null,
})

const batchAffectedCount = computed(() =>
  batchForm.value.scope === 'selected' ? selectedMoulds.value.length : total.value,
)

const activeFilterTags = computed(() => {
  const tags = []
  if (searchContent.value.mouldNumber) tags.push(`模具编号：${searchContent.value.mouldNumber}`)
  if (searchContent.value.manufacturerName) tags.push(`模具厂商：${searchContent.value.manufacturerName}`)
  if (searchContent.value.status) tags.push(`原状态：${searchContent.value.status}`)
  return tags
})

const openBatchStatusDialog = async () => {
  selectedMoulds.value = tableListRef.value?.getSelectionRows?.() ?? []
  batchForm.value = {
    scope: selectedMoulds.value.length > 0 ? 'selected' : 'filtered',
    status: '',
    mouldHouseId: null,
  }
  batchDialogVisible.value = true

  if (mouldHouseOptions.value.length === 0) {
    try {
      const res = await getMouldHouseList(1, 1000)
      mouldHouseOptions.value = res.rows || []
    } catch {
      ElMessage.warning('模房列表加载失败，请稍后重试')
    }
  }
}

const submitBatchStatus = async () => {
  if (batchAffectedCount.value === 0) {
    ElMessage.warning('当前没有可更新的模具')
    return
  }
  if (!batchForm.value.status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  if (batchForm.value.status === '模具故障送修中' && !batchForm.value.mouldHouseId) {
    ElMessage.warning('状态为模具故障送修中时，必须选择送修模房')
    return
  }

  const scopeText = batchForm.value.scope === 'selected'
    ? `已勾选的 ${selectedMoulds.value.length} 条记录`
    : `当前查询结果的 ${total.value} 条记录`

  try {
    await ElMessageBox.confirm(
      `确认将${scopeText}更新为“${batchForm.value.status}”吗？`,
      '批量更新确认',
      {
        confirmButtonText: '确认更新',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const payload = {
      scope: batchForm.value.scope,
      ids: batchForm.value.scope === 'selected'
        ? selectedMoulds.value.map((item) => item.id)
        : undefined,
      filters: batchForm.value.scope === 'filtered'
        ? { ...searchContent.value }
        : undefined,
      status: batchForm.value.status,
      mouldHouseId: batchForm.value.status === '模具故障送修中'
        ? batchForm.value.mouldHouseId
        : undefined,
    }

    batchSubmitting.value = true
    const res = await batchUpdateMouldStatus(payload)
    ElMessage.success(res.msg || `成功更新 ${batchAffectedCount.value} 条模具`)
    batchDialogVisible.value = false
    tableListRef.value?.clearSelection?.()
    loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      const message = error?.response?.data?.msg || error?.msg || '批量更新失败'
      ElMessage.error(message)
    }
  } finally {
    batchSubmitting.value = false
  }
}

// 加载数据
const loadData = () => {
  getMouldList({
    pageNum: page.value,
    pageSize: pageSize.value,
    ...searchContent.value,
  }).then((res) => {
    listData.value = res.rows.map((item) => ({ ...item }))
    total.value = res.total
  })
}

loadData()
const handlePageChange = (val: number) => { page.value = val; loadData() }
const handleSizeChange = (val: number) => { pageSize.value = val; page.value = 1; loadData() }

// 点击“新增”按钮
const onCreate = () => {
  title.value = '新增'
  newSubmit.value = {
    mouldNumber: '',
    manufacturerId: '',
    trialDate: '',
    status: '',
    remark: '',
  }

  dynamicFormData.value = [
    [
      { type: 'input', label: '模具编号', key: 'mouldNumber', width: 8, rules: [requiredRule] },
      {
        type: 'inputSelect',
        label: '模具厂商',
        key: 'manufacturerName',
        width: 8,
        rules: [requiredRule],
        allowCreate: true,
        showKey: [
          { key: 'id', label: '厂商编号' },
          { key: 'name', label: '厂商名称' },
        ],
        remoteFunc: searchFunc('system/manufacturer/list', 'name'),
        options: [],
        loading: false,
      },
    ],
  ]

  editDialogVisible.value = true
  nextTick(() => createFormRef.value.clearValidate())
}

// 编辑行数据
const editRow = (row) => {
  title.value = '编辑'
  newSubmit.value = { ...row }

  dynamicFormData.value = [
    [
      { type: 'input', label: '模具编号', key: 'mouldNumber', width: 8, disabled: true, rules: [requiredRule] },
      {
        type: 'inputSelect',
        label: '模具厂商',
        key: 'manufacturerName',
        width: 8,
        rules: [requiredRule],
        showKey: [
          { key: 'id', label: '厂商编号' },
          { key: 'name', label: '厂商名称' },
        ],
        remoteFunc: searchFunc('system/manufacturer/list', 'name'),
        options: [],
        loading: false,
      },
      {
        type: 'select',
        label: '模具状态',
        key: 'status',
        width: 8,
        options: mouldStatusOptions,
        rules: [requiredRule],
      },
    ],
    [
      {
        type: 'timer',
        label: '试模日期',
        key: 'trialDate',
        timerType: 'date',
        width: 8,
      },
      {
        type: 'inputSelect',
        label: '模房ID',
        key: 'mouldHouseId',
        width: 8,
        rules: [requiredRule],
        showKey: [
          { key: 'id', label: '模房编号' },
          { key: 'name', label: '模房名称' },
        ],
        remoteFunc: searchFunc('system/mould-house/list', 'id'),
        options: [],
        loading: false,
        tip: '-1 表示未维修',
      },
    ],
  ]

  editDialogVisible.value = true
  nextTick(() => createFormRef.value.clearValidate())
}

// 表格操作列
const operation = ref([
  { value: '编辑', func: (row) => editRow(row) },
])

// 提交表单
const handleSubmit = () => {
  createFormRef.value.validateForm((valid) => {
    if (!valid) return

    // === 关键校验逻辑 ===
    if (
      newSubmit.value.status === '模具故障送修中' &&
      (!newSubmit.value.mouldHouseId || newSubmit.value.mouldHouseId === -1)
    ) {
      ElMessage.error('模具状态为维修时，必须选择一个模房')
      return
    }

    const payload = { ...newSubmit.value }
    const api = title.value === '编辑' ? updateMould : createMould

    api(payload).then((res) => {
      ElMessage.success(res.msg || '操作成功')
      editDialogVisible.value = false
      loadData()
    })
  })
}


// 删除
const DeleteFunc = (rows) => {
  if (!rows.length) return ElMessage.warning('请选择要删除的记录')

  const ids = rows.map(r => r.id)

  ElMessageBox.confirm(
    `确认删除 ${ids.length} 条记录？`,
    '操作确认提示',
    {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      return deleteMould(ids)
    })
    .then(() => {
      // 成功的 messageBox
      messageBox(
        'success',
        () => Promise.resolve(),
        `成功删除 ${ids.length} 条记录`,
        '',
        ''
      )
      loadData()
    })
    .catch((err) => {
      if (err === 'cancel') return

      const backendMsg =
        err?.msg ||
        err?.response?.data?.msg ||
        '删除失败'

      messageBox(
        'error',
        () => Promise.resolve(),
        '',
        backendMsg,
        ''
      )
    })
}



// 导入
const importDialogVisible = ref(false)
const onImport = () => (importDialogVisible.value = true)
const handleUpload = (option) => {
  const formData = new FormData()
  formData.append('file', option.file)
  importMouldFile(formData).then((res) => {
    ElMessage.success(res.msg || '导入成功')
    importDialogVisible.value = false
    loadData()
  })
}

// 下载模板
const onDownloadTemplate = () => {
  getMouldTemplate().then((res) => downloadBinaryFile(res, '模具导入模板.xlsx'))
}

// 导出
const exportFunc = (rows) => {
  if (!rows.length) return ElMessage.warning('请选择要导出的记录')
  const ids = rows.map((r) => r.id).join(',')
  exportMould(ids).then((res) => downloadBinaryFile(res, '模具导出.xlsx'))
}

// 查询
const onSubmit = () => {
  page.value = 1
  loadData()
}
</script>

<style scoped>
.batch-scope-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.filter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.all-data-warning {
  color: #e6a23c;
  font-weight: 500;
}
</style>
