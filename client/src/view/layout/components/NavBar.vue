<template>
  <div class="header">
    <div class="left">
      <el-icon class="menu-switch" @click="$emit('toggleMenu')"><icon-menu /></el-icon>
      <span class="title">Gonitor</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Menu as IconMenu,
} from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
  .header{
    color: #FFFFFF;
    height: 100%;
    .left{
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 20px;
      .menu-switch{
        font-size: 22px;
        &:hover{
          cursor: pointer;
        }
      }
      .title{
        margin-left: 40px;
        font-size: 22px;
      }
    }
  }
</style>