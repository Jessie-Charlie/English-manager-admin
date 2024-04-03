<template>
  <div style="line-height:1.8">
    <div v-loading="pLoading">
      <div class="q-title" v-html="passage.content"/>
    </div>
  </div>

</template>

<script>
export default {
  name: 'PassageShow',
  props: {
    passage: {
      type: Object,
      default: function () {
        return {}
      }
    },
    pLoading: {
      type: Boolean,
      default: false
    },
    pType: {
      type: Number,
      default: 0
    }
  },
  methods: {}
}
</script>
