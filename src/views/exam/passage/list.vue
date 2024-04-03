<template>
  <div class="app-container">
    <el-form :model="queryParam" ref="queryForm" :inline="true">
      <el-form-item label="短文ID：">
        <el-input v-model="queryParam.id" clearable></el-input>
      </el-form-item>
      <el-form-item label="所属试卷类型：">
        <el-select v-model="queryParam.level" placeholder="所属试卷类型"  @change="levelChange" clearable>
          <el-option v-for="item in levelEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="题型：">
        <el-select v-model="queryParam.subjectId" clearable>
          <el-option v-for="item in subjectFilter" :key="item.id" :value="item.id"
                     :label="item.name+' ( '+item.levelName+' )'"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">查询</el-button>
        <el-button @click="$router.push('/exam/passage/edit/edit')" type="primary" class="link-left">添加</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="listLoading" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" label="Id" width="90px"/>
      <el-table-column prop="subjectId" label="试卷类型" :formatter="subjectFormatter" width="120px"/>
      <el-table-column prop="content" label="短文内容" show-overflow-tooltip/>
      <el-table-column prop="createTime" label="创建时间" width="160px"/>
      <el-table-column label="操作" align="center" width="220px">
        <template slot-scope="{row}">
          <el-button size="mini"   @click="showPassage(row)">预览</el-button>
          <el-button size="mini"  @click="editPassage(row)">编辑</el-button>
          <el-button size="mini"  type="danger" @click="deletePassage(row)" class="link-left">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="queryParam.pageIndex" :limit.sync="queryParam.pageSize"
                @pagination="search"/>
    <el-dialog :visible.sync="passageShow.dialog" style="width: 100%;height: 100%">
      <PassageShow :pType="passageShow.pType" :question="passageShow.passage" :qLoading="passageShow.loading"/>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import Pagination from '@/components/Pagination'
import PassageShow from './components/Show'
import passageApi from '@/api/passage'

export default {
  components: { Pagination, PassageShow },
  data () {
    return {
      queryParam: {
        id: null,
        subjectLevel: null,
        subjectId: null,
        pageIndex: 1,
        pageSize: 10
      },
      subjectFilter: null,
      listLoading: true,
      tableData: [],
      total: 0,
      passageShow: {
        pType: 0,
        dialog: false,
        passage: null,
        loading: false
      }
    }
  },
  created () {
    this.initSubject()
    this.search()
  },
  methods: {
    submitForm () {
      this.queryParam.pageIndex = 1
      this.search()
    },
    search () {
      this.listLoading = true
      passageApi.pageList(this.queryParam).then(data => {
        const re = data.response
        this.tableData = re.list
        this.total = re.total
        this.queryParam.pageIndex = re.pageNum
        this.listLoading = false
      })
    },
    levelChange () {
      this.queryParam.subjectId = null
      this.subjectFilter = this.subjects.filter(data => data.level === this.queryParam.level)
    },
    addPassage () {
      this.$router.push('/exam/passage/edit/edit')
    },
    showPassage (row) {
      let _this = this
      this.passageShow.dialog = true
      this.passageShow.loading = true
      passageApi.select(row.id).then(re => {
        _this.passageShow.pType = re.response.questionType
        _this.passageShow.question = re.response
        _this.passageShow.loading = false
      })
    },
    editPassage (row) {
      this.$router.push({ path: 'edit/edit', query: { passage: row } })
    },
    deletePassage (row) {
      let _this = this
      questionApi.deleteQuestion(row.id).then(re => {
        if (re.code === 1) {
          _this.search()
          _this.$message.success(re.message)
        } else {
          _this.$message.error(re.message)
        }
      })
    },
    subjectFormatter (row, column, cellValue, index) {
      return this.subjectEnumFormat(cellValue)
    },
    ...mapActions('exam', { initSubject: 'initSubject' })
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      questionType: state => state.exam.question.typeEnum,
      levelEnum: state => state.user.levelEnum
    }),
    ...mapGetters('exam', ['subjectEnumFormat']),
    ...mapState('exam', { subjects: state => state.subjects })
  }
}
</script>
