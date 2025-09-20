<script setup lang="ts">
import viteLogo from './assets/vite.svg';
import vueLogo from './assets/vue.svg';
import { ref, onMounted, nextTick } from 'vue';

import Login from './components/Login.vue';
import { version } from '../../package.json';
import FileBrowser from './components/FileBrowser.vue';
// window.electronAPI.sendMessage('Hello from App.vue!');
// window.electronAPI.sendMessage('Hello from App.vue!');

const isLogin_f = ref(false);


</script>

<template>
  <main class="container">
    <FileBrowser v-if="isLogin_f" />
  <Login v-else @isLogin="(val: boolean) => isLogin_f = val" />


    <!-- <Login v-else @isLogin="(val: any) => isLogin.valueOf = val" /> -->

  </main>
  <p class="version">V{{ version }}-dev</p>
</template>

<style scoped>
.container {
  margin: 0;
  margin-top: 0vh;
  padding-top: 0vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* justify-content: center;
  text-align: center; */
}
.version {
  text-align: center;
  margin: 0em;
  font-size: 0.8em;
  color: #797989;

}
</style>
