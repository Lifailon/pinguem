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

<template>
    <div class="ping-container">

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
                    <th>IP Address</th>
                    <th>Response Time (ms)</th>
                    <th>Status</th>
                    <th>Last Available</th>
                    <th>Last Unavailable</th>
                    <th>Successful Pings</th>
                    <th>Failed Pings</th>
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

<style scoped>
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

    th, td {
        padding: 10px;
        border: 1px solid #dddddd;
        text-align: left;
    }

    .available {
        color: #41b883;
    }

    .unavailable {
        color: red;
    }
</style>