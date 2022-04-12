<template>
  <div class="login">
    <el-container>
      <el-header>Header</el-header>
      <el-main>
        <div class="login-wrap">
          <el-form :model="loginInfo" label-width="120px">
            <el-form-item label="login account">
              <el-input v-model="loginInfo.loginAccount" />
            </el-form-item>
            <el-form-item label="password">
              <el-input v-model="loginInfo.password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="doLogin">Login</el-button>
              <el-button>Cancel</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import {reactive} from "vue";

const loginInfo =  reactive({
  loginAccount: '',
  password: ''
})
const doLogin = () => {
  console.log("login")
}
</script>

<style lang="scss" scoped>
  .login{
    .login-wrap{
      width: 350px;
    }
  }
</style>