<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="问题标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入问题标题"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="问题级别" prop="problemLevel">
        <el-select v-model="queryParams.problemLevel" placeholder="请选择问题级别" clearable size="small">
          <el-option
            v-for="dict in problemLevelOptions"
            :key="dict.dictValue"
            :label="dict.dictLabel"
            :value="dict.dictValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="问题状态" prop="problemStatus">
        <el-select v-model="queryParams.problemStatus" placeholder="请选择问题状态" clearable size="small">
          <el-option
            v-for="dict in problemStatusOptions"
            :key="dict.dictValue"
            :label="dict.dictLabel"
            :value="dict.dictValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="责任科室" prop="dutyDepartment">
        <el-autocomplete
          v-model="queryParams.dutyDepartment"
          :fetch-suggestions="querySearch"
          placeholder="请输入责任科室"
          :trigger-on-focus="false"
          value-key="deptName"
          size="small"
          @keyup.enter.native="handleQuery"
        ></el-autocomplete>
      </el-form-item>
      <br/>
      <el-form-item label="发生日期">
        <el-date-picker
          v-model="daterangeAppearDate"
          size="small"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="解决时间">
        <el-date-picker
          v-model="daterangeSolveData"
          size="small"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
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
          v-hasPermi="['project:problem:add']"
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
          v-hasPermi="['project:problem:edit']"
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
          v-hasPermi="['project:problem:remove']"
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
          v-hasPermi="['project:problem:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="problemList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="问题标题" align="center" prop="title"/>
      <el-table-column label="问题级别" align="center" prop="problemLevel" :formatter="problemLevelFormat"/>
      <el-table-column label="发生日期" align="center" prop="appearDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.appearDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="解决时间" align="center" prop="solveData" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.solveData, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="责任科室" align="center" prop="dutyDepartment"/>
      <el-table-column label="问题状态" align="center" prop="problemStatus" :formatter="problemStatusFormat"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['project:problem:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['project:problem:remove']"
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

    <!-- 添加或修改问题管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="问题标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入问题标题"/>
        </el-form-item>
        <el-form-item label="问题级别" prop="problemLevel">
          <el-select v-model="form.problemLevel" placeholder="请选择问题级别">
            <el-option
              v-for="dict in problemLevelOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="发生日期" prop="appearDate">
          <el-date-picker clearable size="small"
                          v-model="form.appearDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="选择发生日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="解决时间" prop="solveData">
          <el-date-picker clearable size="small"
                          v-model="form.solveData"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="选择解决时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="责任科室" prop="dutyDepartment">
          <el-select
            v-model="form.dutyDepartment"
            filterable
            remote
            placeholder="请输入责任科室"
            :remote-method="remoteMethod"
            :loading="selectLoading">
            <el-option
              v-for="item in options"
              :key="item.deptId"
              :label="item.deptName"
              :value="item.deptName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="问题状态" prop="problemStatus">
          <el-select v-model="form.problemStatus" placeholder="请选择问题状态">
            <el-option
              v-for="dict in problemStatusOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="parseInt(dict.dictValue)"
            ></el-option>
          </el-select>
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
  addProblem,
  delProblem,
  exportProblem,
  getProblem,
  listProblem,
  updateProblem
} from '@/api/project/problem'
import { listDept } from '@/api/system/dept'

export default {
  name: 'Problem',
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
      // 问题管理表格数据
      problemList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 问题级别字典
      problemLevelOptions: [],
      // 发生日期时间范围
      daterangeAppearDate: [],
      // 解决时间时间范围
      daterangeSolveData: [],
      // 问题状态字典
      problemStatusOptions: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        problemLevel: null,
        appearDate: null,
        solveData: null,
        dutyDepartment: null,
        problemStatus: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: '问题标题不能为空', trigger: 'blur' }
        ],
        problemLevel: [
          { required: true, message: '问题级别不能为空', trigger: 'change' }
        ],
        dutyDepartment: [
          { required: true, message: '责任科室不能为空', trigger: 'blur' }
        ],
      },
      selectLoading: false,
      options: []
    }
  },
  created () {
    this.getList()
    this.getDicts('t_problem_level').then(response => {
      this.problemLevelOptions = response.data
    })
    this.getDicts('t_problem_status').then(response => {
      this.problemStatusOptions = response.data
    })
  },
  methods: {
    remoteMethod (query) {
      if (query !== '') {
        this.selectLoading = true
        listDept({
          deptName: query
        }).then(({ data }) => this.options = data)
          .finally(() => this.selectLoading = false)
      } else {
        this.options = []
      }
    },
    async querySearch (queryString, cb) {
      await listDept({
        deptName: queryString
      }).then(({ data }) => cb(data))
    },
    /** 查询问题管理列表 */
    getList () {
      this.loading = true
      this.queryParams.params = {}
      if (null != this.daterangeAppearDate && '' != this.daterangeAppearDate) {
        this.queryParams.params['beginAppearDate'] = this.daterangeAppearDate[0]
        this.queryParams.params['endAppearDate'] = this.daterangeAppearDate[1]
      }
      if (null != this.daterangeSolveData && '' != this.daterangeSolveData) {
        this.queryParams.params['beginSolveData'] = this.daterangeSolveData[0]
        this.queryParams.params['endSolveData'] = this.daterangeSolveData[1]
      }
      listProblem(this.queryParams).then(response => {
        this.problemList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 问题级别字典翻译
    problemLevelFormat (row, column) {
      return this.selectDictLabel(this.problemLevelOptions, row.problemLevel)
    },
    // 问题状态字典翻译
    problemStatusFormat (row, column) {
      return this.selectDictLabel(this.problemStatusOptions, row.problemStatus)
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
        problemLevel: null,
        appearDate: null,
        solveData: null,
        dutyDepartment: null,
        problemInfo: null,
        problemEffect: null,
        problemCause: null,
        solution: null,
        problemStatus: null,
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
      this.daterangeAppearDate = []
      this.daterangeSolveData = []
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
      this.title = '添加问题管理'
    },
    /** 修改按钮操作 */
    handleUpdate (row) {
      this.reset()
      const id = row.id || this.ids
      getProblem(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改问题管理'
      })
    },
    /** 提交按钮 */
    submitForm () {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateProblem(this.form).then(response => {
              this.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addProblem(this.form).then(response => {
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
      this.$confirm('是否确认删除问题管理编号为"' + ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return delProblem(ids)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      })
    },
    /** 导出按钮操作 */
    handleExport () {
      const queryParams = this.queryParams
      this.$confirm('是否确认导出所有问题管理数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return exportProblem(queryParams)
      }).then(response => {
        this.download(response.msg)
      })
    }
  }
}
</script>
