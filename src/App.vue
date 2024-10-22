<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <PingTable/>
  </div>
</template>

<script>
import PingTable from './components/PingTable.vue'

export default {
  name: 'App',
  components: {
    PingTable
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>