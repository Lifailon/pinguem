<template>
    <div class="ping-container">
        <h1>Ping Addresses or Subnet</h1>

        <div v-for="(input, index) in inputs" :key="index" class="input-group">
            <input v-model="input.address" placeholder="Enter address (e.g., 192.168.1.100 or 192.168.1.0)" />
            <button @click="removeInput(index)">-</button>
        </div>

        <button @click="addInput">+</button>

        <select v-model="pingInterval">
            <option v-for="sec in intervalOptions" :key="sec" :value="sec">
                {{ sec }} second{{ sec > 1 ? 's' : '' }}
            </option>
        </select>

        <button @click="togglePing">{{ isPinging ? 'Stop' : 'Start' }}</button>
        <button @click="resetPingCounts" v-if="results.length > 0">Reset Counts</button>

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
                    <td :class="result.status === 'Alive' ? 'alive' : 'unreachable'">
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

<script>
import axios from 'axios'

export default {
    data() {
        return {
            inputs: [{ address: '' }], // Массив для хранения адресов
            results: [],
            intervalId: null,
            isPinging: false,
            pingInterval: 2, // Начальный интервал в 2 секунды
            intervalOptions: Array.from({ length: 10 }, (_, i) => i + 1), // Опции от 1 до 10
        }
    },
    watch: {
        pingInterval() {
            this.saveToLocalStorage(); // Сохраняем данные при изменении интервала
        },
        inputs: {
            deep: true,
            handler() {
                this.saveToLocalStorage(); // Сохраняем адреса при изменении
            }
        }
    },
    methods: {
        addInput() {
            this.inputs.push({ address: '' }); // Добавляем новое поле для ввода
            this.saveToLocalStorage(); // Сохраняем данные
        },
        removeInput(index) {
            this.inputs.splice(index, 1); // Удаляем поле по индексу
            this.saveToLocalStorage(); // Сохраняем данные
        },
        saveToLocalStorage() {
            const addresses = this.inputs.map(input => input.address); // Сохраняем только адреса
            localStorage.setItem('pingAddresses', JSON.stringify(addresses)); // Сохраняем в LocalStorage
            localStorage.setItem('pingInterval', String(this.pingInterval)); // Сохраняем интервал как строку
        },
        loadFromLocalStorage() {
            const storedAddresses = JSON.parse(localStorage.getItem('pingAddresses')); // Получаем данные из LocalStorage
            const storedInterval = localStorage.getItem('pingInterval'); // Получаем сохраненный интервал
            if (storedAddresses && Array.isArray(storedAddresses)) {
                this.inputs = storedAddresses.map(address => ({ address })); // Восстанавливаем введенные адреса
            }
            if (storedInterval) {
                this.pingInterval = parseInt(storedInterval); // Восстанавливаем интервал как число
            }
        },
        async fetchPingResults() {
            const addresses = this.inputs.map(input => input.address).filter(address => address); // Извлекаем адреса из полей ввода

            if (addresses.length > 0) {
                try {
                    const response = await axios.post('http://localhost:3000/ping', { addresses }); // Отправляем массив адресов
                    console.log('Ping results:', response.data);
                    this.results = response.data;
                } catch (error) {
                    console.error('Error during ping:', error);
                }
            } else {
                alert('Please enter at least one valid address or subnet.');
            }
        },
        async resetPingCounts() {
            const addresses = this.inputs.map(input => input.address).filter(address => address);
            if (addresses.length > 0) {
                await axios.post('http://localhost:3000/reset', { addresses });
                this.results.forEach(result => {
                    result.successful = 0;
                    result.failed = 0;
                });
            }
        },
        togglePing() {
            if (this.isPinging) {
                clearInterval(this.intervalId);
                this.isPinging = false;
            } else {
                this.fetchPingResults(); // Выполняем начальный пинг
                this.intervalId = setInterval(this.fetchPingResults, this.pingInterval * 1000); // Пинг с выбранным интервалом
                this.isPinging = true;
            }
        },
    },
    mounted() {
        this.loadFromLocalStorage(); // Загружаем данные при монтировании компонента
    },
    beforeUnmount() {
        clearInterval(this.intervalId); // Очищаем интервал при уничтожении компонента
        this.saveToLocalStorage(); // Сохраняем данные перед выходом
    }
}
</script>

<style scoped>
.ping-container {
    width: 80%;
    margin: 0 auto;
}

.input-group {
    margin-bottom: 10px;
}

input {
    padding: 10px;
    margin-right: 10px;
    width: 300px;
}

button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    margin-right: 10px;
}

button:hover {
    background-color: #45a049;
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

th,
td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
}

.alive {
    color: green;
}

.unreachable {
    color: red;
}
</style>