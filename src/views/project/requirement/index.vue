<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="需求标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入需求标题"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-input
          v-model="queryParams.priority"
          placeholder="请输入优先级"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择需求当前状态" clearable size="small">
          <el-option
            v-for="dict in statusOptions"
            :key="dict.dictValue"
            :label="dict.dictLabel"
            :value="dict.dictValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" prop="sa">
        <el-autocomplete
          v-model="queryParams.sa"
          :fetch-suggestions="querySearch"
          placeholder="请输入负责人"
          :trigger-on-focus="false"
          value-key="nickName"
          size="small"
          @keyup.enter.native="handleQuery"
        ></el-autocomplete>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['project:requirement:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['project:requirement:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['project:requirement:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['project:requirement:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="requirementList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="需求标题" align="center" prop="title"/>
      <el-table-column label="优先级" align="center" prop="priority"/>
      <el-table-column label="需求当前状态" align="center" prop="status" :formatter="statusFormat"/>
      <el-table-column label="负责人" align="center" prop="sa"/>
      <el-table-column label="需求描述" align="center" prop="description"/>
      <el-table-column label="计划开始日期" align="center" prop="planStartDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.planStartDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计划上线日期" align="center" prop="planPublishDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.planPublishDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建人" align="center" prop="createBy"/>
      <el-table-column label="创建时间" align="center" prop="createDatetime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createDatetime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['project:requirement:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['project:requirement:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改需求对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="需求标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入需求标题"/>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入优先级"/>
        </el-form-item>
        <el-form-item label="需求当前状态">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in statusOptions"
              :key="dict.dictValue"
              :label="parseInt(dict.dictValue)"
            >{{ dict.dictLabel }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人" prop="sa">
          <el-select
            v-model="form.sa"
            filterable
            remote
            placeholder="请输入负责人"
            :remote-method="remoteMethod"
            :loading="selectLoading">
            <el-option
              v-for="item in options"
              :key="item.userId"
              :label="item.nickName"
              :value="item.nickName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需求描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"/>
        </el-form-item>
        <el-form-item label="计划开始日期" prop="planStartDate">
          <el-date-picker clearable size="small"
                          v-model="form.planStartDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="选择计划开始日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="计划上线日期" prop="planPublishDate">
          <el-date-picker clearable size="small"
                          v-model="form.planPublishDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="选择计划上线日期">
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addRequirement,
  delRequirement,
  exportRequirement,
  getRequirement,
  listRequirement,
  updateRequirement
} from '@/api/project/requirement'
import { listUser } from '@/api/system/user'

export default {
  name: 'Requirement',
  components: {},
  data () {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 需求表格数据
      requirementList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 需求当前状态字典
      statusOptions: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        priority: null,
        status: null,
        sa: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: '需求标题不能为空', trigger: 'blur' }
        ],
        priority: [
          { required: true, message: '优先级不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '需求当前状态不能为空', trigger: 'blur' }
        ],
        sa: [
          { required: true, message: '负责人不能为空', trigger: 'blur' }
        ],
      },
      selectLoading: false,
      options: []
    }
  },
  created () {
    this.getList()
    this.getDicts('t_requirement_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    remoteMethod (query) {
      if (query !== '') {
        this.selectLoading = true
        listUser({
          nickName: query,
          pageNum: 1,
          pageSize: 5
        }).then(({ rows }) => this.options = rows)
          .finally(() => this.selectLoading = false)
      } else {
        this.options = []
      }
    },
    async querySearch (queryString, cb) {
      await listUser({
        nickName: queryString,
        pageNum: 1,
        pageSize: 6
      }).then(({ rows }) => cb(rows))
    },
    /** 查询需求列表 */
    getList () {
      this.loading = true
      listRequirement(this.queryParams).then(response => {
        this.requirementList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 需求当前状态字典翻译
    statusFormat (row, column) {
      return this.selectDictLabel(this.statusOptions, row.status)
    },
    // 取消按钮
    cancel () {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset () {
      this.form = {
        id: null,
        title: null,
        priority: null,
        status: 0,
        sa: null,
        description: null,
        planStartDate: null,
        planPublishDate: null,
        createBy: null,
        createDatetime: null,
        updateBy: null,
        updateDatetime: null
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery () {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery () {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange (selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd () {
      this.reset()
      this.open = true
      this.title = '添加需求'
    },
    /** 修改按钮操作 */
    handleUpdate (row) {
      this.reset()
      const id = row.id || this.ids
      getRequirement(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改需求'
      })
    },
    /** 提交按钮 */
    submitForm () {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateRequirement(this.form).then(response => {
              this.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addRequirement(this.form).then(response => {
              this.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete (row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除需求编号为"' + ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return delRequirement(ids)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      })
    },
    /** 导出按钮操作 */
    handleExport () {
      const queryParams = this.queryParams
      this.$confirm('是否确认导出所有需求数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return exportRequirement(queryParams)
      }).then(response => {
        this.download(response.msg)
      })
    }
  }
}
</script>
