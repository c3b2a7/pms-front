<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="缺陷标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入缺陷标题"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="需求编号" prop="requirementNo">
        <el-input
          v-model="queryParams.requirementNo"
          placeholder="请输入需求编号"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="严重级别" prop="bugLevel">
        <el-select v-model="queryParams.bugLevel" placeholder="请选择严重级别" clearable size="small">
          <el-option
            v-for="dict in bugLevelOptions"
            :key="dict.dictValue"
            :label="dict.dictLabel"
            :value="dict.dictValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable size="small">
          <el-option
            v-for="dict in statusOptions"
            :key="dict.dictValue"
            :label="dict.dictLabel"
            :value="dict.dictValue"
          />
        </el-select>
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
          v-hasPermi="['project:bug:add']"
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
          v-hasPermi="['project:bug:edit']"
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
          v-hasPermi="['project:bug:remove']"
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
          v-hasPermi="['project:bug:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="bugList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="缺陷标题" align="center" prop="title"/>
      <el-table-column label="需求编号" align="center" prop="requirementNo"/>
      <el-table-column label="严重级别" align="center" prop="bugLevel" :formatter="bugLevelFormat"/>
      <el-table-column label="状态" align="center" prop="status" :formatter="statusFormat"/>
      <el-table-column label="提出人" align="center" prop="proposer"/>
      <el-table-column label="负责人" align="center" prop="sa"/>
      <el-table-column label="解决人" align="center" prop="solutioner"/>
      <el-table-column label="解决时间" align="center" prop="solveDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.solveDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="缺陷描述" align="center" prop="description"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['project:bug:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['project:bug:remove']"
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

    <!-- 添加或修改缺陷对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="缺陷标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入缺陷标题"/>
        </el-form-item>
        <el-form-item label="需求编号" prop="requirementNo">
          <el-input v-model="form.requirementNo" placeholder="请输入需求编号"/>
        </el-form-item>
        <el-form-item label="严重级别" prop="bugLevel">
          <el-select v-model="form.bugLevel" placeholder="请选择严重级别">
            <el-option
              v-for="dict in bugLevelOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option
              v-for="dict in statusOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="parseInt(dict.dictValue)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="提出人" prop="proposer">
          <el-select
            v-model="form.proposer"
            filterable
            remote
            placeholder="请输入提出人"
            :remote-method="querySearch"
            :loading="selectLoading">
            <el-option
              v-for="item in options"
              :key="item.userId"
              :label="item.nickName"
              :value="item.nickName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="sa">
          <el-select
            v-model="form.sa"
            filterable
            remote
            placeholder="请输入负责人"
            :remote-method="querySearch"
            :loading="selectLoading">
            <el-option
              v-for="item in options"
              :key="item.userId"
              :label="item.nickName"
              :value="item.nickName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="解决人" prop="solutioner">
          <el-select
            v-model="form.solutioner"
            filterable
            remote
            placeholder="请输入解决人"
            :remote-method="querySearch"
            :loading="selectLoading">
            <el-option
              v-for="item in options"
              :key="item.userId"
              :label="item.nickName"
              :value="item.nickName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="解决时间" prop="solveDate">
          <el-date-picker clearable size="small"
                          v-model="form.solveDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="选择解决时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="缺陷描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"/>
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
import { addBug, delBug, exportBug, getBug, listBug, updateBug } from '@/api/project/bug'
import { listUser } from '@/api/system/user'

export default {
  name: 'Bug',
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
      // 缺陷表格数据
      bugList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 严重级别字典
      bugLevelOptions: [],
      // 状态字典
      statusOptions: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        requirementNo: null,
        bugLevel: null,
        status: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: '缺陷标题不能为空', trigger: 'blur' }
        ],
        requirementNo: [
          { required: true, message: '需求编号不能为空', trigger: 'blur' }
        ],
        bugLevel: [
          { required: true, message: '严重级别不能为空', trigger: 'change' }
        ],
        status: [
          { required: true, message: '状态不能为空', trigger: 'change' }
        ],
        proposer: [
          { required: true, message: '提出人不能为空', trigger: 'blur' }
        ],
        sa: [
          { required: true, message: '负责人不能为空', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '缺陷描述不能为空', trigger: 'blur' }
        ],
      },
      selectLoading: false,
      options: []
    }
  },
  created () {
    this.getList()
    this.getDicts('t_bug_level').then(response => {
      this.bugLevelOptions = response.data
    })
    this.getDicts('t_bug_status').then(response => {
      this.statusOptions = response.data
    })
  },
  methods: {
    querySearch (query) {
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
    /** 查询缺陷列表 */
    getList () {
      this.loading = true
      listBug(this.queryParams).then(response => {
        this.bugList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 严重级别字典翻译
    bugLevelFormat (row, column) {
      return this.selectDictLabel(this.bugLevelOptions, row.bugLevel)
    },
    // 状态字典翻译
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
        requirementNo: null,
        bugLevel: null,
        status: null,
        proposer: null,
        sa: null,
        solutioner: null,
        solveDate: null,
        description: null,
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
      this.title = '添加缺陷'
    },
    /** 修改按钮操作 */
    handleUpdate (row) {
      this.reset()
      const id = row.id || this.ids
      getBug(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改缺陷'
      })
    },
    /** 提交按钮 */
    submitForm () {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateBug(this.form).then(response => {
              this.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addBug(this.form).then(response => {
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
      this.$confirm('是否确认删除缺陷编号为"' + ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return delBug(ids)
      }).then(() => {
        this.getList()
        this.msgSuccess('删除成功')
      })
    },
    /** 导出按钮操作 */
    handleExport () {
      const queryParams = this.queryParams
      this.$confirm('是否确认导出所有缺陷数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        return exportBug(queryParams)
      }).then(response => {
        this.download(response.msg)
      })
    }
  }
}
</script>
