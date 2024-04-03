<template>
  <div class="app-container">
    <el-form :model="form" ref="form" label-width="100px" v-loading="formLoading" :rules="rules">
      <el-form-item label="试卷类型：" prop="subjectLevel" required>
        <el-select v-model="form.subjectLevel" placeholder="试卷类型"  @change="levelChange" clearable>
          <el-option v-for="item in levelEnum" :key="item.key" :value="item.key" :label="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="题型：" prop="subjectId" required>
        <el-select v-model="form.subjectId" placeholder="题型" >
          <el-option v-for="item in subjectFilter" :key="item.id" :value="item.id" :label="item.name+' ( '+item.levelName+' )'"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="内容：" prop="content" required>
        <el-input v-model="form.content" @focus="inputClick(form,'content')" />
      </el-form-item>
      <el-form-item :key="index" :label="'题目'+(index+1)+'：'" required v-for="(titleItem,index) in form.questionItems">
        <el-input v-model="titleItem.name" style="width: 80%"/>
        <el-popover trigger="click">
          <el-button type="warning" size="mini" v-for="item in editUrlEnum" :key="item.key" @click="addQuestionItem(titleItem)">{{item.name}}
          </el-button>
          <el-button slot="reference" type="text" class="link-left" style="margin-left: 20px" size="mini">
            添加选项
          </el-button>
        </el-popover>
        <el-button type="text" class="link-left" size="mini" @click="form.questionItems.splice(index,1)">删除</el-button>
        <el-card class="exampaper-item-box" v-if="titleItem.items.length!==0">
          <el-form-item :key="questionIndex"
                        v-for="(questionItem,questionIndex) in titleItem.items" style="margin-bottom: 15px">
            <el-row>
              <el-col :span="23">
                <!-- <el-input v-if="titleItem.items.id" :placeholder="titleItem.items.id"></el-input> -->
                <!-- <el-input v-if="questionItem.id" :placeholder="questionItem.id"></el-input> -->
                <QuestionShow :qType="questionItem.questionType" :question="questionItem"/>
              </el-col>
              <el-col :span="1">
                <el-button type="text" size="mini" @click="titleItem.items.splice(questionIndex,1)">删除
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>
        </el-card>
      </el-form-item>
      <el-form-item label="建议时长：" prop="suggestTime" required>
        <el-input v-model="form.suggestTime" placeholder="分钟"/>
      </el-form-item>
      <el-dialog :visible.sync="questionPage.showDialog"  width="70%">
        <el-form :model="questionForm" ref="questionForm" label-width="100px" v-loading="questionFormLoading" :rules="questionRules">
          <el-form-item label="选项：" required>
            <el-form-item :label="item.prefix" :key="item.prefix"  v-for="(item,index) in questionForm.items"  label-width="50px" class="question-item-label">
              <el-input v-model="item.prefix"  style="width:50px;" />
              <el-input v-model="item.content"   @focus="inputClick(item,'content')"  class="question-item-content-input"/>
              <el-button type="danger" size="mini" class="question-item-remove" icon="el-icon-delete" @click="questionItemRemove(index)"></el-button>
            </el-form-item>
          </el-form-item>
          <el-form-item label="解析：" prop="analyze" required>
            <el-input v-model="questionForm.analyze"  @focus="inputClick(questionForm,'analyze')" />
          </el-form-item>
          <el-form-item label="分数：" prop="score" required>
            <el-input-number v-model="questionForm.score" :precision="1" :step="1" :max="100"></el-input-number>
          </el-form-item>
          <el-form-item label="正确答案：" prop="correct" required>
            <el-radio-group v-model="questionForm.correct">
              <el-radio  v-for="item in questionForm.items"  :key="item.prefix"  :label="item.prefix">{{item.prefix}}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitQuestionForm">提交</el-button>
            <el-button @click="resetQuestionForm">重置</el-button>
            <el-button type="success" @click="questionItemAdd">添加选项</el-button>
            <el-button type="success" @click="showQuestion">预览</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button plain type="success" @click="addQuestion">添加题目</el-button>
        <el-button type="success" @click="showPassage">预览</el-button>
      </el-form-item>
    </el-form>
    <el-dialog  :visible.sync="richEditor.dialogVisible"  append-to-body :close-on-click-modal="false" style="width: 100%;height: 100%"   :show-close="false" center>
      <Ueditor @ready="editorReady"/>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="editorConfirm">确 定</el-button>
        <el-button @click="richEditor.dialogVisible = false">取 消</el-button>
      </span>
    </el-dialog>
    <el-dialog :visible.sync="passageShow.dialog" style="width: 100%;height: 100%">
      <PassageShow :pType="passageShow.pType" :passage="passageShow.passage" :pLoading="passageShow.loading"/>
    </el-dialog>
  </div>
</template>

<script>
import PassageShow from '../components/Show'
import QuestionShow from '../../question/components/Show'
import Ueditor from '@/components/Ueditor'
import { mapGetters, mapState, mapActions } from 'vuex'
import passageApi from '@/api/passage'
import questionApi from '@/api/question'

export default {
  components: {
    Ueditor, PassageShow, QuestionShow
  },
  data () {
    return {
      form: {
        id: null,
        subjectLevel: null,
        subjectId: null,
        content: '',
        suggestTime: null,
        questionItems: [],
        questionIds: []
      },
      questionForm: {
        id: null,
        questionType: 1,
        title: '',
        items: [
          { prefix: 'A', content: '' },
          { prefix: 'B', content: '' },
          { prefix: 'C', content: '' },
          { prefix: 'D', content: '' }
        ],
        analyze: '',
        correct: '',
        score: ''
      },
      questionFormLoading: false,
      subjectFilter: null,
      formLoading: false,
      rules: {
        subjectLevel: [
          { required: true, message: '请选择所属试卷类型', trigger: 'change' }
        ],
        subjectId: [
          { required: true, message: '请选择所属题型', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入短文内容', trigger: 'blur' }
        ],
        suggestTime: [
          { required: true, message: '请输入建议时长', trigger: 'blur' }
        ]
      },
      currentQuestionItem: null,
      questionRules: {
        title: [
          { required: true, message: '请输入题干', trigger: 'blur' }
        ],
        analyze: [
          { required: true, message: '请输入解析', trigger: 'blur' }
        ],
        score: [
          { required: true, message: '请输入分数', trigger: 'blur' }
        ],
        correct: [
          { required: true, message: '请选择正确答案', trigger: 'change' }
        ]
      },
      questionPage: {
        multipleSelection: [],
        showDialog: false,
        queryParam: {
          id: null,
          subjectLevel: null,
          subjectId: 1,
          context: null,
          pageIndex: 1,
          pageSize: 5
        },
        listLoading: true,
        tableData: [],
        total: 0
      },
      richEditor: {
        dialogVisible: false,
        object: null,
        parameterName: '',
        instance: null
      },
      passageShow: {
        pType: 0,
        dialog: false,
        passage: null,
        loading: false
      }
    }
  },
  mounted () {
    let passage = this.$route.query.passage
    let _this = this
    this.initSubject(function () {
      _this.subjectFilter = _this.subjects
    })
    if (passage) {
      _this.formLoading = true
      passageApi.select(passage.id).then(p => {
        _this.form = p.response
        console.log('begin')
        console.log(p.response)
        console.log(this.form.questionItems)
        _this.formLoading = false
        console.log('end')
      })
    }
  },
  methods: {
    editorReady (instance) {
      this.richEditor.instance = instance
      let currentContent = this.richEditor.object[this.richEditor.parameterName]
      this.richEditor.instance.setContent(currentContent)
      // 光标定位到Ueditor
      this.richEditor.instance.focus(true)
    },
    inputClick (object, parameterName) {
      this.richEditor.object = object
      this.richEditor.parameterName = parameterName
      this.richEditor.dialogVisible = true
    },
    editorConfirm () {
      let content = this.richEditor.instance.getContent()
      this.richEditor.object[this.richEditor.parameterName] = content
      this.richEditor.dialogVisible = false
    },
    submitForm () {
      let _this = this
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.formLoading = true
          passageApi.edit(this.form).then(re => {
            if (re.code === 1) {
              _this.$message.success(re.message)
              _this.delCurrentView(_this).then(() => {
                _this.$router.push('/exam/passage/list')
              })
            } else {
              _this.$message.error(re.message)
              this.formLoading = false
            }
          }).catch(e => {
            this.formLoading = false
          })
        } else {
          return false
        }
      })
    },
    resetForm () {
      let lastId = this.form.id
      this.$refs['form'].resetFields()
      this.form = {
        id: null,
        subjectLevel: null,
        subjectId: null,
        content: ''
      }
      this.form.id = lastId
    },
    addQuestion () {
      this.form.questionItems.push({
        name: '',
        items: []
      })
    },
    addQuestionItem (titleItem) {
      this.currentQuestionItem = titleItem
      this.questionPage.showDialog = true
      this.questionForm.title = titleItem.name
    },
    submitQuestionForm () {
      let _this = this
      this.$refs.questionForm.validate((valid) => {
        if (valid) {
          this.questionFormLoading = true
          questionApi.edit(this.questionForm).then(re => {
            if (re.code === 1) {
              _this.$message.success(re.message)
              this.questionPage.multipleSelection.push(re.response)
              this.questionPage.multipleSelection.forEach(q => {
                questionApi.select(q.id).then(re => {
                  _this.currentQuestionItem.items.push(re.response)
                })
              })
              this.questionPage.multipleSelection.pop()
              this.form.questionIds.push(re.response.id)
              console.log(this.form.questionItems)
              this.questionFormLoading = false
              this.questionPage.showDialog = false
            } else {
              _this.$message.error(re.message)
              this.questionFormLoading = false
            }
          }).catch(e => {
            this.questionFormLoading = false
          })
        } else {
          return false
        }
      })
    },
    resetQuestionForm () {
      let lastId = this.questionForm.id
      this.$refs['form'].resetFields()
      this.questionForm = {
        id: null,
        questionType: 1,
        title: '',
        items: [
          { prefix: 'A', content: '' },
          { prefix: 'B', content: '' },
          { prefix: 'C', content: '' },
          { prefix: 'D', content: '' }
        ],
        analyze: '',
        correct: '',
        score: '',
        difficult: 0
      }
      this.questionForm.id = lastId
    },
    showQuestion () {
      this.questionShow.dialog = true
      this.questionShow.qType = this.form.questionType
      this.questionShow.question = this.form
    },
    questionItemRemove (index) {
      this.questionForm.items.splice(index, 1)
    },
    questionItemAdd () {
      let items = this.questionForm.items
      let newLastPrefix
      if (items.length > 0) {
        let last = items[items.length - 1]
        newLastPrefix = String.fromCharCode(last.prefix.charCodeAt() + 1)
      } else {
        newLastPrefix = 'A'
      }
      items.push({ id: null, prefix: newLastPrefix, content: '' })
    },
    levelChange () {
      this.form.subjectId = null
      this.subjectFilter = this.subjects.filter(data => data.level === this.form.subjectLevel)
    },
    showPassage () {
      this.passageShow.dialog = true
      this.passageShow.pType = this.form.subjectId
      this.passageShow.passage = this.form
      console.log(this.passageShow.passage)
    },
    ...mapActions('exam', { initSubject: 'initSubject' }),
    ...mapActions('tagsView', { delCurrentView: 'delCurrentView' })
  },
  computed: {
    ...mapGetters('enumItem', ['enumFormat']),
    ...mapState('enumItem', {
      editUrlEnum: state => state.exam.question.editUrlEnum,
      questionTypeEnum: state => state.exam.question.typeEnum,
      levelEnum: state => state.user.levelEnum
    }),
    ...mapState('exam', { subjects: state => state.subjects })
  }
}
</script>
