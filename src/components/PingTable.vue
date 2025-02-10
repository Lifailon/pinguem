<script>
import axios from 'axios'
export default {
    data() {
        return {
            inputs: [{ address: '' }], // Массив для хранения адресов
            results: [],
            intervalId: null,
            isPinging: false,
            pingInterval: 1, // Начальный интервал
            intervalOptions: Array.from({ length: 10 }, (_, i) => i + 1), // Интервал от 1 до 10
            sortKey: '', // Ключ для сортировки
            sortOrder: 'asc', // Направление сортировки (asc или desc)
        }
    },
    watch: {
        pingInterval() {
            // Сохраняем значение при изменении интервала
            this.saveToLocalStorage()
        },
        inputs: {
            deep: true,
            handler() {
                // Сохраняем адреса при изменении
                this.saveToLocalStorage()
            }
        }
    },
    methods: {
        addInput() {
            // Добавляем новое поле для ввода
            this.inputs.push({ address: '' })
        },
        removeInput(index) {
            // Удаляем поле по индексу
            this.inputs.splice(index, 1)
        },
        saveToLocalStorage() {
            // Сохраняем адреса в локальное хранилище
            const addresses = this.inputs.map(input => input.address)
            localStorage.setItem('pingAddresses', JSON.stringify(addresses))
            // Сохраняем интервал как строку
            localStorage.setItem('pingInterval', String(this.pingInterval))
        },
        loadFromLocalStorage() {
            // Получаем данные из LocalStorage при загрузке страницы (интервал и введенные адреса)
            const storedAddresses = JSON.parse(localStorage.getItem('pingAddresses'))
            const storedInterval = localStorage.getItem('pingInterval')
            if (storedAddresses && Array.isArray(storedAddresses)) {
                this.inputs = storedAddresses.map(address => ({ address }))
            }
            if (storedInterval) {
                // Восстанавливаем интервал как число
                this.pingInterval = parseInt(storedInterval)
            }
        },
        async fetchPingResults() {
            // Извлекаем адреса из полей ввода (фильтруя пустые адреса)
            const addresses = this.inputs.map(input => input.address).filter(address => address)
            if (addresses.length > 0) {
                try {
                    // Отправляем массив адресов к backend
                    const serverHost = `${window.location.protocol}//${window.location.hostname}:3005`
                    const response = await axios.post(`${serverHost}/ping`, { addresses })
                    // console.log('Ping results:', response.data)
                    this.results = response.data
                    // Применяем сортировку к данным после получения
                    this.sortResults()
                }
                catch (error) {
                    console.error('Error during ping:', error)
                }
            }
        },
        // Обновляем значения successful и failed
        async resetPingCounts() {
            const addresses = this.inputs.map(input => input.address).filter(address => address)
            if (addresses.length > 0) {
                const serverHost = `${window.location.protocol}//${window.location.hostname}:3005`
                await axios.post(`${serverHost}/reset`, { addresses })
                this.results.forEach(result => {
                    result.successful = 0
                    result.failed = 0
                })
            }
        },
        togglePing() {
            if (this.isPinging) {
                clearInterval(this.intervalId)
                this.isPinging = false
            } else {
                this.fetchPingResults()
                this.intervalId = setInterval(this.fetchPingResults, this.pingInterval * 1000)
                this.isPinging = true
            }
        },
        // Метод для сортировки данных в таблице
        sortResults() {
            if (this.sortKey) {
                this.results.sort((a, b) => {
                    let aValue = a[this.sortKey]
                    let bValue = b[this.sortKey]

                    // Сортировка по четвертому октету для IP-адресов и имени хоста
                    if (this.sortKey === 'host') {
                        // Если это IP-адрес, то сортируем по четвертому октету
                        if (aValue.includes('.') && bValue.includes('.')) {
                            const aIp = aValue.split('.').map(num => parseInt(num))
                            const bIp = bValue.split('.').map(num => parseInt(num))
                            for (let i = 0; i < 4; i++) {
                                if (aIp[i] !== bIp[i]) {
                                    return this.sortOrder === 'asc' ? aIp[i] - bIp[i] : bIp[i] - aIp[i]
                                }
                            }
                            return 0 // Если все октеты равны, считаем равными
                        } else {
                            // Если это хостнеймы, сортируем как строки
                            return this.sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
                        }
                    }

                    // Обработка unknown для Response Time (рассматривать как NaN)
                    if (this.sortKey === 'time') {
                        aValue = aValue === 'unknown' ? NaN : parseInt(aValue)
                        bValue = bValue === 'unknown' ? NaN : parseInt(bValue)
                    }

                    // Обработка N/A для дат
                    if (this.sortKey === 'lastAvailable' || this.sortKey === 'lastUnavailable') {
                        aValue = aValue === 'N/A' ? NaN : new Date(aValue)
                        bValue = bValue === 'N/A' ? NaN : new Date(bValue)
                    }

                    // Если значения NaN, то ставим в конец
                    if (isNaN(aValue) && !isNaN(bValue)) {
                        return 1
                    }
                    if (!isNaN(aValue) && isNaN(bValue)) {
                        return -1
                    }

                    // Сортировка для остальных столбцов
                    if (this.sortOrder === 'asc') {
                        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
                    } else {
                        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
                    }
                })
            }
        },
        // Метод для изменения порядка сортировки
        changeSortOrder(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortKey = key
                this.sortOrder = 'asc'
            }
            this.sortResults()
        }
    },
    mounted() {
        // Загружаем данные при монтировании текущего компонента
        this.loadFromLocalStorage()
    },
    beforeUnmount() {
        // Очищаем интервал при уничтожении компонента
        clearInterval(this.intervalId)
        // Сохраняем данные перед выходом
        this.saveToLocalStorage()
    }
}
</script>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

// Применяем тему при загрузке страницы
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})
</script>

<template>
    <div class="ping-container">
        <button class="theme-toggle" @click="toggleTheme">
            {{ isDark ? '🌙' : '☀️' }}
        </button>

        <div v-for="(input, index) in inputs" :key="index" class="input-group">
            <input v-model="input.address" placeholder="Enter address" />
            <button @click="removeInput(index)">-</button>
        </div>

        <button @click="addInput">+</button>

        <select v-model="pingInterval">
            <option v-for="sec in intervalOptions" :key="sec" :value="sec">
                {{ sec }} second{{ sec > 1 ? 's' : '' }}
            </option>
        </select>

        <button @click="togglePing">{{ isPinging ? 'Stop' : 'Start' }}</button>
        <button @click="resetPingCounts">Reset Counts</button>

        <table v-if="results.length > 0">
            <thead>
                <tr>
                    <th @click="changeSortOrder('host')">IP Address</th>
                    <th @click="changeSortOrder('time')">Response Time (ms)</th>
                    <th @click="changeSortOrder('status')">Status</th>
                    <th @click="changeSortOrder('lastAvailable')">Last Available</th>
                    <th @click="changeSortOrder('lastUnavailable')">Last Unavailable</th>
                    <th @click="changeSortOrder('successful')">Successful Pings</th>
                    <th @click="changeSortOrder('failed')">Failed Pings</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="result in results" :key="result.host">
                    <td>{{ result.host }}</td>
                    <td>{{ result.time !== null ? result.time : 'N/A' }}</td>
                    <td :class="result.status === 'Available' ? 'available' : 'unavailable'">
                        {{ result.status }}
                    </td>
                    <td>{{ result.lastAvailable ? new Date(result.lastAvailable).toLocaleString() : 'N/A' }}</td>
                    <td>{{ result.lastUnavailable ? new Date(result.lastUnavailable).toLocaleString() : 'N/A' }}</td>
                    <td>{{ result.successful }}</td>
                    <td>{{ result.failed }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style>
.theme-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
  background: transparent !important;
  border: none;
  outline: none;
}

.dark table,
.dark {
  background-color: #2f2f2f;
  color: #e3e3e3;
}

/* Теманая тема для полей ввода и выпадающего списка*/
.dark input,
.dark select {
    background-color: #4a4a4a;
    color: #ffffff;
}

.ping-container {
    width: 80%;
    margin: 0 auto;
}

.input-group {
    margin-bottom: 10px
}

input {
    padding: 10px;
    margin-right: 10px;
    width: 300px;
}

button {
    padding: 10px 20px;
    background-color: #41b883;
    color: white;
    border: none;
    cursor: pointer;
    margin-right: 10px;
}

button:hover {
    background-color: #35495e;
}

select {
    padding: 10px;
    margin-right: 10px;
}

table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
}

th {
    padding: 10px;
    border: 1px solid #dddddd;
    text-align: left;
    /* Устанавливаем курсор только для заголовков */
    cursor: pointer;
}

td {
    padding: 10px;
    border: 1px solid #dddddd;
    text-align: left;
}

th:hover {
    /* Подсветка при наведении на заголовки */
    background-color: #41b883;
}

.available {
    color: #41b883;
}

.unavailable {
    color: red;
}
</style>