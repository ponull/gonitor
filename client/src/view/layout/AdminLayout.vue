<template>
  <div class="admin-layout">
    <el-container>
      <el-header class="header">
        <nav-bar @toggleMenu="toggleMenu"/>
      </el-header>
      <el-container>
        <el-aside class="menu-wrap" :width="menuWidth">
          <side-menu :is-collapse="menuCollapse"/>
        </el-aside>
        <el-main class="main">Main</el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import NavBar from "./components/NavBar.vue";
import SideMenu from "./components/SideMenu.vue";
import {computed, ref} from "vue";

const menuCollapse = ref(true)
const toggleMenu = () => {
  menuCollapse.value = !menuCollapse.value
}
const menuWidth = computed(() => {
  return menuCollapse.value ? "64px" : "240px"
})
</script>

<style lang="scss" scoped>
.admin-layout {
  .header {
    background: #3f51b5;
  }

  .menu-wrap {
    transition: width 0.25s;
    -webkit-transition: width 0.25s;
    -moz-transition: width 0.25s;
    -webkit-transition: width 0.25s;
    -o-transition: width 0.25s;
  }

  .main {
    height: calc(100vh - 60px);
    min-width: calc(100vw - 240px);
  }
}
</style>